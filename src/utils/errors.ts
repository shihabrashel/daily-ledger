const errorKeys = ['errors.storage', 'errors.generic', 'errors.report', 'errors.share',
  'errors.monthBlocked', 'errors.missing', 'errors.staleReport', 'errors.closeTooEarly'] as const;
export type ErrorKey = typeof errorKeys[number];

export class AppError extends Error {
  constructor(public readonly key: ErrorKey) { super(key); this.name = 'AppError'; }
}

// Only known translation keys may reach the UI, never arbitrary native messages.
export function userErrorKey(error: unknown, fallback: ErrorKey): ErrorKey {
  return error instanceof Error && errorKeys.includes(error.message as ErrorKey)
    ? error.message as ErrorKey : fallback;
}

export function controlledError(error: unknown, fallback: ErrorKey): AppError {
  if (typeof __DEV__ !== 'undefined' && __DEV__) console.warn(`[Daily Ledger] ${fallback}`, error);
  return new AppError(userErrorKey(error, fallback));
}
