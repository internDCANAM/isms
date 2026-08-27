export interface ScopeGuard extends AsyncDisposable { release(): void; }

export function scopeGuard(onExit: () => Promise<void>): ScopeGuard {
  let released = false;
  return {
    release: () => { released = true; },
    [Symbol.asyncDispose]: async () => {
      if (!released) await onExit();
    }
  };
}
