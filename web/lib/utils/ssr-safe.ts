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

// Type-safe browser API access with proper type guards
type BrowserWindow = {
  localStorage?: Storage;
  sessionStorage?: Storage;
  screen?: { width: number; height: number };
  innerWidth?: number;
  innerHeight?: number;
  location?: { href: string; reload(): void; origin?: string };
  URL?: {
    createObjectURL?: (blob: Blob) => string;
    revokeObjectURL?: (url: string) => void;
  };
  gtag?: (command: string, eventName: string, parameters?: Record<string, any>) => void;
}

type BrowserDocument = {
  createElement?: (tagName: string) => HTMLElement;
  body?: {
    appendChild?: (child: HTMLElement) => void;
    removeChild?: (child: HTMLElement) => void;
  };
}

type BrowserNavigator = {
  userAgent?: string;
  clipboard?: {
    writeText?: (text: string) => Promise<void>;
  };
}

// Type guards for browser objects
function isBrowserWindow(obj: unknown): obj is BrowserWindow {
  return typeof obj === 'object' && obj !== null && 'localStorage' in obj;
}

function isBrowserDocument(obj: unknown): obj is BrowserDocument {
  return typeof obj === 'object' && obj !== null;
}

function isBrowserNavigator(obj: unknown): obj is BrowserNavigator {
  return typeof obj === 'object' && obj !== null && 'userAgent' in obj;
}

export function safeWindow<T>(fn: (w: BrowserWindow) => T, fallback?: T): T | undefined {
  return browserOnly(() => {
    if (isBrowserWindow(window)) {
      return fn(window);
    }
    throw new Error('window is not available or has unexpected shape');
  }, fallback);
}

export function safeDocument<T>(fn: (d: BrowserDocument) => T, fallback?: T): T | undefined {
  return browserOnly(() => {
    if (isBrowserDocument(document)) {
      return fn(document);
    }
    throw new Error('document is not available or has unexpected shape');
  }, fallback);
}

export function safeNavigator<T>(fn: (n: BrowserNavigator) => T, fallback?: T): T | undefined {
  return browserOnly(() => {
    if (isBrowserNavigator(navigator)) {
      return fn(navigator);
    }
    throw new Error('navigator is not available or has unexpected shape');
  }, fallback);
}

// Storage (single, consistent API)
function storage(kind: "localStorage" | "sessionStorage") {
  return {
    get: (key: string): string | null =>
      safeWindow(w => {
        const storage = w[kind];
        return storage?.getItem?.(key) ?? null;
      }, null) ?? null,
    set: (key: string, value: string): boolean =>
      safeWindow(w => { 
        const storage = w[kind];
        storage?.setItem?.(key, value); 
        return true; 
      }, false) ?? false,
    remove: (key: string): boolean =>
      safeWindow(w => { 
        const storage = w[kind];
        storage?.removeItem?.(key); 
        return true; 
      }, false) ?? false,
    clear: (): boolean =>
      safeWindow(w => { 
        const storage = w[kind];
        storage?.clear?.(); 
        return true; 
      }, false) ?? false,
  };
}
export const safeLocalStorage   = storage("localStorage");
export const safeSessionStorage = storage("sessionStorage");

export const getUserAgent = (): string =>
  safeNavigator(n => n.userAgent ?? "unknown", "unknown") ?? "unknown";

export const isMobileDevice = (): boolean =>
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(getUserAgent());

export const getScreenDimensions = (): { width: number; height: number } | null =>
  safeWindow(w => {
    if (w.screen) {
      return { width: w.screen.width, height: w.screen.height };
    }
    return null;
  }, null) ?? null;

export const getViewportDimensions = (): { width: number; height: number } | null =>
  safeWindow(w => {
    if (w.innerWidth && w.innerHeight) {
      return { width: w.innerWidth, height: w.innerHeight };
    }
    return null;
  }, null) ?? null;

export const safeNavigate = (url: string): boolean =>
  safeWindow(w => { 
    if (w.location) {
      w.location.href = url; 
      return true; 
    }
    return false;
  }, false) ?? false;

export const safeReload = (): boolean =>
  safeWindow(w => { 
    if (w.location) {
      w.location.reload(); 
      return true; 
    }
    return false;
  }, false) ?? false;

// Event listeners without DOM types in signature
type EventTargetLike = {
  addEventListener(event: string, handler: unknown, options?: boolean | Record<string, unknown>): void;
  removeEventListener(event: string, handler: unknown, options?: boolean | Record<string, unknown>): void;
}

function isEventTargetLike(obj: unknown): obj is EventTargetLike {
  return typeof obj === 'object' && 
         obj !== null && 
         typeof (obj as EventTargetLike).addEventListener === 'function' &&
         typeof (obj as EventTargetLike).removeEventListener === 'function';
}

export function safeAddEventListener(
  target: unknown,
  event: string,
  handler: unknown,
  options?: boolean | Record<string, unknown>
): boolean {
  return browserOnly(() => {
    if (isEventTargetLike(target)) {
      target.addEventListener(event, handler, options);
      return true;
    }
    return false;
  }, false) ?? false;
}

export function safeRemoveEventListener(
  target: unknown,
  event: string,
  handler: unknown,
  options?: boolean | Record<string, unknown>
): boolean {
  return browserOnly(() => {
    if (isEventTargetLike(target)) {
      target.removeEventListener(event, handler, options);
      return true;
    }
    return false;
  }, false) ?? false;
}