import jwt, {type SignOptions} from 'jsonwebtoken';
import {randomBytes} from 'node:crypto';
import {z} from 'zod';
import {languages, type Locale} from './i18n.dict.js';

const localeValues = Object.keys(languages) as [Locale, ...Locale[]];

const AccessTokenPayloadSchema = z.object({
  userId: z.string(),
  locale: z.enum(localeValues),
});

export type AccessTokenPayload = z.infer<typeof AccessTokenPayloadSchema>;
const RefreshTokenPayloadSchema = z.object({userId: z.string(), tokenId: z.string()});
export type RefreshTokenPayload = z.infer<typeof RefreshTokenPayloadSchema>;

export interface TokenConfig {
  accessSecret: string;
  refreshSecret: string;
  accessTtlSeconds: number;
  refreshTtlSeconds: number;
}

export function signAccessToken(payload: AccessTokenPayload, config: TokenConfig): string {
  const options: SignOptions = {expiresIn: config.accessTtlSeconds};
  return jwt.sign(payload, config.accessSecret, options);
}

export function verifyAccessToken(token: string, secret: string): AccessTokenPayload {
  return AccessTokenPayloadSchema.parse(jwt.verify(token, secret));
}

export function signRefreshToken(
  userId: string,
  config: TokenConfig
): { token: string; tokenId: string; } {
  const tokenId = randomBytes(16).toString('hex');
  const options: SignOptions = {expiresIn: config.refreshTtlSeconds};
  return {token: jwt.sign({userId, tokenId}, config.refreshSecret, options), tokenId};
}

export function verifyRefreshToken(token: string, secret: string): RefreshTokenPayload {
  return RefreshTokenPayloadSchema.parse(jwt.verify(token, secret));
}
