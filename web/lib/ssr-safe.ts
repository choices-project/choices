// Production safeguard for temporary stub
if (process.env.NODE_ENV === 'production') {
  console.warn('[ssr-safe] Using temporary stub in production. Replace with real impl.');
}

export const isBrowser = () => typeof window !== 'undefined';

export function safeBrowserAccess<T>(fn: () => T, fallback: T): T {
  if (!isBrowser()) return fallback;
  try { return fn(); } catch { return fallback; }
}