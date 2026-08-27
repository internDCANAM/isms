export const hmacHash = {
  sha1:   'SHA-1',
  sha256: 'SHA-256',
  sha384: 'SHA-384',
  sha512: 'SHA-512',
} as const;
export type HmacHash = (typeof hmacHash)[keyof typeof hmacHash];

export const hmacUsage = {
  sign:   'sign',
  verify: 'verify',
} as const;
export type HmacUsage = (typeof hmacUsage)[keyof typeof hmacUsage];

export interface HmacKey {
  hash:        HmacHash;
  extractable: boolean;
  usages:      readonly HmacUsage[];
}

export const hmacKeyDefaults: HmacKey = {
  hash:        hmacHash.sha256,
  extractable: false,
  usages:      [hmacUsage.sign],
};

export function importHmacKey(secret: BufferSource, key: HmacKey): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw', secret, {name: 'HMAC', hash: key.hash}, key.extractable, [...key.usages]);
}

export async function hmacHex(secret: string, message: string, key: HmacKey): Promise<string> {
  const bytes = new TextEncoder();
  const sig = await crypto.subtle.sign(
    'HMAC',
    await importHmacKey(bytes.encode(secret), key),
    bytes.encode(message));
  return new Uint8Array(sig).toHex();
}
