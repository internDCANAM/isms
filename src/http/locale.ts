import type {Request, Response, NextFunction} from 'express';
import {translator, DEFAULT_LOCALE, languages, type Locale} from '../lib/i18n.js';

const VALID_LOCALES = Object.keys(languages);

function validLocale(locale: string): locale is Locale {
  return VALID_LOCALES.includes(locale);
}

/**
 * What the request asked for: the verified token first, then the locale cookie,
 * then `Accept-Language`.
 */
function requestedLocale(req: Request): Locale | undefined {
  if (req.user?.locale && validLocale(req.user.locale)) return req.user.locale;
  const cookies = req.cookies as Record<string, unknown> | undefined;
  if (typeof cookies?.locale === 'string' && validLocale(cookies.locale.toLowerCase())) {
    return cookies.locale.toLowerCase() as Locale;
  }
  const header = req.headers['accept-language'];
  if (typeof header === 'string') {
    return header
      .split(',')
      .map((lang) => (lang.trim().split('-')[0] ?? '').toLowerCase())
      .find(validLocale);
  }
  return undefined;
}

export function resolveLocale(req: Request): Locale {
  return requestedLocale(req) ?? DEFAULT_LOCALE;
}

/**
 * Runs before every router so `req.t` always exists. The auth middleware
 * re-derives it once `req.user` is available, since a verified token's locale
 * beats what the cookie or header asked for.
 */
export function localeMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.t = translator(resolveLocale(req));
  next();
}
