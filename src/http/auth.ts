import type {Request, Response, NextFunction} from 'express';
import {translator} from '../lib/i18n.js';
import {verifyAccessToken} from '../lib/jwt.js';
import {unauthorized} from './errors.js';
import {resolveLocale} from './locale.js';
import type {Actor, RequestOrigin} from '../services/audit.js';
import type {AccessTokenPayload} from '../lib/jwt.js';

export interface AuthenticatedRequest extends Request { user: AccessTokenPayload; }

/**
 * Bearer-token authentication.
 *
 * A missing, malformed, or unverifiable token is a 401. A verified one puts its
 * payload on the request and re-derives `req.t`, since the token's locale beats
 * what the cookie or header asked for.
 */
function bearerPayload(req: Request, accessSecret: string): AccessTokenPayload | null {
  const header = req.get('authorization');
  if (!header?.toLowerCase().startsWith('bearer ')) return null;
  try {
    return verifyAccessToken(header.slice(7).trim(), accessSecret);
  } catch {
    return null;
  }
}

export function authenticate(accessSecret: string) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = bearerPayload(req, accessSecret);
    if (!user) return next(unauthorized(req));
    req.user = user;
    req.t = translator(resolveLocale(req));
    next();
  };
}

export function actorOf(req: AuthenticatedRequest): Actor {
  return {
    userId: req.user.userId,
    ipAddress: req.ip ?? null,
    userAgent: req.get('user-agent') ?? null,
  };
}

export function originOf(req: Request): RequestOrigin {
  return {
    userId: req.user?.userId ?? null,
    ipAddress: req.ip ?? null,
    userAgent: req.get('user-agent') ?? null,
    path: req.originalUrl,
    method: req.method,
  };
}
