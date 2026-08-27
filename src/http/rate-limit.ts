import type {Request} from 'express';
import rateLimit, {ipKeyGenerator, MemoryStore, type RateLimitRequestHandler, type Store} from 'express-rate-limit';
import {ErrorCode, type ApiErrorBody} from '../api/common.js';
import {SecurityEventSeverity, SecurityEventType} from '../domain.js';
import {recordSecurityEvent} from '../services/audit.js';
import {originOf, type AuthenticatedRequest} from './auth.js';
import type {AuditRepository} from '../store/repository.js';

const RateLimitKey = {IP: 'ip', USER: 'user'} as const;
type RateLimitKey = (typeof RateLimitKey)[keyof typeof RateLimitKey];
export type RateLimitStoreFactory = (prefix: string) => Store;
export function rateLimitStore(): RateLimitStoreFactory {return () => new MemoryStore();}

interface LimiterConfig {
  prefix: string;
  windowMs: number;
  limit: number;
  key: RateLimitKey;
  eventType: SecurityEventType;
  message: string;
}

function keyGenerator(key: RateLimitKey): (req: Request) => string {
  switch (key) {
    case RateLimitKey.IP:
      return (req) => ipKeyGenerator(req.ip ?? '');
    case RateLimitKey.USER:
      return (req) => (req as AuthenticatedRequest).user.userId;
  }
}

function limiter(
  config: LimiterConfig,
  makeStore: RateLimitStoreFactory,
  audit: AuditRepository
):RateLimitRequestHandler {
  return rateLimit({
    windowMs: config.windowMs,
    limit: config.limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: keyGenerator(config.key),
    store: makeStore(config.prefix),
    handler: (req, res) => {
      void recordSecurityEvent(audit, {
        origin: originOf(req),
        eventType: config.eventType,
        severity: SecurityEventSeverity.HIGH,
        message: config.message,
      });
      res.status(429).json({
        error: req.t.http.rateLimited,
        code: ErrorCode.RATE_LIMITED,
        statusCode: 429,
      } satisfies ApiErrorBody);
    }
  });
}

export interface RateLimiters {
  login: RateLimitRequestHandler;
  refresh: RateLimitRequestHandler;
  global: RateLimitRequestHandler;
  api: RateLimitRequestHandler;
}

export function buildRateLimiters(
  makeStore: RateLimitStoreFactory,
  audit: AuditRepository
): RateLimiters {
  return {
    login: limiter({
      prefix: 'rl:login:',
      windowMs: 60 * 1000,
      limit: 10,
      key: RateLimitKey.IP,
      eventType: SecurityEventType.LOGIN_RATE_LIMIT_EXCEEDED,
      message: 'Login rate limit exceeded',
    }, makeStore, audit),

    // refresh and logout authenticate from a cookie, so there is no user to key
    // on. one refresh per access-token lifetime leaves room for several tabs
    refresh: limiter({
      prefix: 'rl:refresh:',
      windowMs: 15 * 60 * 1000,
      limit: 120,
      key: RateLimitKey.IP,
      eventType: SecurityEventType.REFRESH_RATE_LIMIT_EXCEEDED,
      message: 'Refresh rate limit exceeded',
    }, makeStore, audit),

    // mounts ahead of the auth middleware, which is itself unthrottled work:
    // every request with a junk bearer token costs a jwt verification
    global: limiter({
      prefix: 'rl:global:',
      windowMs: 15 * 60 * 1000,
      limit: 1000,
      key: RateLimitKey.IP,
      eventType: SecurityEventType.GLOBAL_RATE_LIMIT_EXCEEDED,
      message: 'Global rate limit exceeded',
    }, makeStore, audit),

    // shared by every authenticated router, mounted after the auth middleware
    // has put req.user in place for keyGenerator to read
    api: limiter({
      prefix: 'rl:api:',
      windowMs: 15 * 60 * 1000,
      limit: 600,
      key: RateLimitKey.USER,
      eventType: SecurityEventType.API_RATE_LIMIT_EXCEEDED,
      message: 'API rate limit exceeded',
    }, makeStore, audit),
  };
}
