export interface SessionStore {
  store(userId: string, tokenId: string, ttlSeconds: number): Promise<void>;
  isValid(userId: string, tokenId: string): Promise<boolean>;
  revoke(userId: string, tokenId: string): Promise<void>;
  revokeAll(userId: string): Promise<void>;
}

export function sessionStore(): SessionStore {
  const sessions = new Map<string, Map<string, number>>();

  return {
    store(userId, tokenId, ttlSeconds) {
      const tokens = sessions.get(userId) ?? new Map<string, number>();
      tokens.set(tokenId, Date.now() + ttlSeconds * 1000);
      sessions.set(userId, tokens);
      return Promise.resolve();
    },

    isValid(userId, tokenId) {
      const tokens = sessions.get(userId);
      const expiresAt = tokens?.get(tokenId);
      if (expiresAt === undefined) return Promise.resolve(false);
      if (expiresAt > Date.now()) return Promise.resolve(true);
      tokens?.delete(tokenId);
      return Promise.resolve(false);
    },

    revoke(userId, tokenId) {
      sessions.get(userId)?.delete(tokenId);
      return Promise.resolve();
    },

    revokeAll(userId) {
      sessions.delete(userId);
      return Promise.resolve();
    }
  };
}
