import type {Request, Response, Router} from 'express';
import {unauthorized} from '../http/errors.js';
import {createRouter, HttpMethod, HttpStatus} from '../http/table.js';
import {REFRESH_COOKIE_NAME, REFRESH_COOKIE_PATH, SESSION_COOKIE_NAME, SESSION_COOKIE_PATH} from '../http/cookies.js';
import {signAccessToken, signRefreshToken, verifyRefreshToken} from '../lib/jwt.js';
import type {Csrf} from '../http/csrf.js';
import type {RateLimiters} from '../http/rate-limit.js';
import type {TokenConfig} from '../lib/jwt.js';
import type {RefreshResponse} from '../api/auth.js';
import type {SessionStore} from '../store/sessions.js';
import {resolveLocale} from '../http/locale.js';

export interface AuthDeps {
  sessions: SessionStore;
  tokens: TokenConfig;
}

export async function startSession(
  deps: AuthDeps,
  csrf: Csrf,
  req: Request,
  res: Response,
  userId: string
): Promise<void> {
  const {sessions, tokens} = deps;
  const maxAge = tokens.refreshTtlSeconds * 1000;
  const cookieOptions = (path: string) => (
    {httpOnly: true, secure: false, sameSite: 'lax' as const, path, maxAge}
  );
  const {token, tokenId} = signRefreshToken(userId, tokens);
  await sessions.store(userId, tokenId, tokens.refreshTtlSeconds);
  res.cookie(REFRESH_COOKIE_NAME, token, cookieOptions(REFRESH_COOKIE_PATH));
  res.cookie(SESSION_COOKIE_NAME, tokenId, cookieOptions(SESSION_COOKIE_PATH));
  csrf.issueToken(req, res, tokenId);
}

export function authRouter(deps: AuthDeps, limiters: RateLimiters, csrf: Csrf): Router {
  const {sessions, tokens} = deps;

  /**
   * Trades the refresh cookie for a new access token, rotating the cookie: the
   * presented token is revoked as its replacement is issued, so a copy lifted
   * from one client stops working the moment the real one refreshes.
   */
  async function refresh(req: Request, res: Response): Promise<RefreshResponse> {
    const token = req.cookies[REFRESH_COOKIE_NAME] as string | undefined;
    if (!token) throw unauthorized(req, req.t.auth.refreshTokenMissing);
    let payload;
    try {
      payload = verifyRefreshToken(token, tokens.refreshSecret);
    } catch { throw unauthorized(req, req.t.auth.refreshTokenInvalid); }

    if (!(await sessions.isValid(payload.userId, payload.tokenId))) {
      await sessions.revokeAll(payload.userId);
      throw unauthorized(req, req.t.auth.refreshTokenRevoked);
    }

    await sessions.revoke(payload.userId, payload.tokenId);
    await startSession(deps, csrf, req, res, payload.userId);
    const locale = resolveLocale(req);

    return {accessToken: signAccessToken({userId: payload.userId, locale}, tokens)};
  }

  async function logout(req: Request, res: Response): Promise<void> {
    const token = req.cookies[REFRESH_COOKIE_NAME] as string | undefined;
    if (token) {
      try {
        const payload = verifyRefreshToken(token, tokens.refreshSecret);
        await sessions.revoke(payload.userId, payload.tokenId);
      } catch { }
    }
    res.clearCookie(REFRESH_COOKIE_NAME, {path: REFRESH_COOKIE_PATH});
    res.clearCookie(SESSION_COOKIE_NAME, {path: SESSION_COOKIE_PATH});
    res.clearCookie(csrf.cookieName, {path: SESSION_COOKIE_PATH});
  }

  return createRouter({
    middleware: [limiters.refresh, csrf.protection],
    routes: [
      {
        method: HttpMethod.POST,
        path: '/refresh',
        status: HttpStatus.OK,
        handler: (req, res) => refresh(req, res),
      },
      {
        method: HttpMethod.POST,
        path: '/logout',
        status: HttpStatus.NO_CONTENT,
        handler: (req, res) => logout(req, res),
      }
    ]
  });
}
