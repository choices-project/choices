/**
 * SSR/browser guards + helpers. Warn in prod if this stub lingers.
 */
if (process.env.NODE_ENV === 'production') {
   
  console.warn('[ssr-safe] Using temporary stub in production. Replace with real impl.');
}

export const isBrowser = () => typeof window !== 'undefined';

export const safeBrowserAccess = {
  window: () => (isBrowser() ? window : undefined),
  document: () => (isBrowser() ? document : undefined),
  navigator: () => (isBrowser() ? navigator : undefined),
  localStorage: () => (isBrowser() ? localStorage : undefined),
  sessionStorage: () => (isBrowser() ? sessionStorage : undefined),
  location: () => (isBrowser() ? location : undefined),
};

// Export the function version for backward compatibility
export function safeBrowserAccessFn<T>(fn: () => T, fallback: T): T {
  if (!isBrowser()) return fallback;
  try { return fn(); } catch { return fallback; }
}

export function browserOnly<T>(fn: () => T, fallback?: T): T | undefined {
  return isBrowser() ? safeTry(fn, fallback) : fallback;
}

export function safeNavigate(url: string) {
  const loc = safeBrowserAccess.location();
  if (loc) loc.href = url;
}

export function safeReload(force = false) {
  const loc = safeBrowserAccess.location();
  if (loc) loc.reload && loc.reload();
}

export function safeSetTimeout(cb: () => void, ms: number) {
  return isBrowser() ? setTimeout(cb, ms) : (undefined as any);
}

const safeTry = <T>(fn: () => T, fallback?: T) => { try { return fn(); } catch { return fallback as T; } };