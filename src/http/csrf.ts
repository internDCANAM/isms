import type {Request, RequestHandler, Response} from 'express';
import {doubleCsrf} from 'csrf-csrf';
import {SESSION_COOKIE_NAME, SESSION_COOKIE_PATH} from './cookies.js';

const CSRF_COOKIE_NAME = 'csrf_token';

export interface Csrf {
  cookieName: string;
  protection: RequestHandler;
  issueToken(req: Request, res: Response, sessionId: string): void;
  invalidTokenError: Error;
}

/**
 * Double-submit CSRF
 *
 * ...
 */
export function createCsrf(secret: string, maxAgeMs: number): Csrf {
  const {doubleCsrfProtection, generateCsrfToken, invalidCsrfTokenError} = doubleCsrf({
    getSecret: () => secret,
    getSessionIdentifier: (req) => (req.cookies[SESSION_COOKIE_NAME] as string | undefined) ?? '',
    cookieName: CSRF_COOKIE_NAME,
    cookieOptions: {
      httpOnly: false,
      secure: false,
      sameSite: 'lax',
      path: SESSION_COOKIE_PATH,
      maxAge: maxAgeMs,
    }
  });

  return {
    cookieName: CSRF_COOKIE_NAME,
    protection: doubleCsrfProtection,
    invalidTokenError: invalidCsrfTokenError,

    issueToken(req, res, sessionId) {
      req.cookies[SESSION_COOKIE_NAME] = sessionId;
      generateCsrfToken(req, res, {overwrite: true});
    }
  };
}
