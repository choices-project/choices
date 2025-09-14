export const isBrowser = () => typeof window !== 'undefined';

export function safeBrowserAccess<T>(fn: () => T, fallback: T): T {
  if (!isBrowser()) return fallback;
  try { return fn(); } catch { return fallback; }
}