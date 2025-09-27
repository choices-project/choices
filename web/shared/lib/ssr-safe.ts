/**
 * SSR-Safe Utilities
 * 
 * This file provides utilities to safely handle browser-only code in Next.js SSR environments.
 * It ensures that browser globals are only accessed on the client side.
 * 
 * IMPORTANT: This is the ONLY approved way to access browser APIs in this codebase.
 * Direct access to window, document, navigator, etc. is forbidden in server-side code.
 * 
 * This file is safe to import from both server and client code.
 * It doesn't export DOM types in signatures, making it compatible with server-only TypeScript configs.
 */

// Shared, importable from server and client. No DOM types in signatures.
export const isBrowser = (): boolean => typeof window !== "undefined";
export const isServer  = (): boolean => !isBrowser();

export function browserOnly<T>(fn: () => T, fallback?: T): T | undefined {
  if (!isBrowser()) return fallback;
  try { return fn(); } catch (e) { 
    // Use console.warn for shared utility - logger not available in all contexts
    console.warn("browserOnly failed:", e); 
    return fallback; 
  }
}

export function serverOnly<T>(fn: () => T, fallback?: T): T | undefined {
  if (!isServer()) return fallback;
  try { return fn(); } catch (e) { 
    // Use console.warn for shared utility - logger not available in all contexts
    console.warn("serverOnly failed:", e); 
    return fallback; 
  }
}

// Avoid DOM types in public signatures; use `any` internally.
export function safeWindow<T>(fn: (w: any) => T, fallback?: T): T | undefined {
  return browserOnly(() => fn(window as any), fallback);
}
export function safeDocument<T>(fn: (d: any) => T, fallback?: T): T | undefined {
  return browserOnly(() => fn(document as any), fallback);
}
export function safeNavigator<T>(fn: (n: any) => T, fallback?: T): T | undefined {
  return browserOnly(() => fn(navigator as any), fallback);
}

// Storage (single, consistent API)
function storage(kind: "localStorage" | "sessionStorage") {
  return {
    get: (key: string): string | null =>
      safeWindow(w => w[kind]?.getItem?.(key) ?? null, null),
    set: (key: string, value: string): boolean =>
      safeWindow(w => { w[kind]?.setItem?.(key, value); return true; }, false) ?? false,
    remove: (key: string): boolean =>
      safeWindow(w => { w[kind]?.removeItem?.(key); return true; }, false) ?? false,
    clear: (): boolean =>
      safeWindow(w => { w[kind]?.clear?.(); return true; }, false) ?? false,
  };
}
export const safeLocalStorage   = storage("localStorage");
export const safeSessionStorage = storage("sessionStorage");

export const getUserAgent = (): string =>
  safeNavigator(n => n.userAgent as string, "unknown") ?? "unknown";

export const isMobileDevice = (): boolean =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(getUserAgent());

export const getScreenDimensions = (): { width: number; height: number } | null =>
  safeWindow(w => w.screen ? { width: w.screen.width, height: w.screen.height } : null, null) ?? null;

export const getViewportDimensions = (): { width: number; height: number } | null =>
  safeWindow(w => (w.innerWidth ? { width: w.innerWidth, height: w.innerHeight } : null), null) ?? null;

export const safeNavigate = (url: string): boolean =>
  safeWindow(w => { w.location.href = url; return true; }, false) ?? false;

export const safeReload = (): boolean =>
  safeWindow(w => { w.location.reload(); return true; }, false) ?? false;

// Event listeners without DOM types in signature
export function safeAddEventListener(
  target: unknown,
  event: string,
  handler: any,
  options?: boolean | Record<string, unknown>
): boolean {
  return browserOnly(() => {
    const t = target as any;
    if (t && typeof t.addEventListener === "function") {
      t.addEventListener(event, handler, options as any);
      return true;
    }
    return false;
  }, false) ?? false;
}

export function safeRemoveEventListener(
  target: unknown,
  event: string,
  handler: any,
  options?: boolean | Record<string, unknown>
): boolean {
  return browserOnly(() => {
    const t = target as any;
    if (t && typeof t.removeEventListener === "function") {
      t.removeEventListener(event, handler, options as any);
      return true;
    }
    return false;
  }, false) ?? false;
}