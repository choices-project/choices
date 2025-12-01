/* eslint-disable @typescript-eslint/no-empty-function */
/**
 * Minimal SSR Polyfills
 *
 * This file provides minimal polyfills for Next.js SSR environment
 * to handle the 'self is not defined' error and other essential browser globals.
 *
 * This is specifically designed to fix the SSR issues with Supabase
 * without importing complex Node.js modules that cause build issues.
 */

// Aggressive SSR polyfills - run immediately
// This file must be imported as early as possible in the application

// Ensure we're in a Node.js environment
if (typeof window === 'undefined') {
  // Define self as globalThis if it doesn't exist
  if (typeof (globalThis as any).self === 'undefined') {
    Object.defineProperty(globalThis, 'self', {
      value: globalThis,
      configurable: true,
      enumerable: false,
      writable: true,
    });
  }

  // Also ensure self is available on global for older modules
  if (typeof (global as any).self === 'undefined') {
    (global as any).self = globalThis;
  }

  // Define other browser globals that might be referenced
  if (typeof (globalThis as any).window === 'undefined') {
    Object.defineProperty(globalThis, 'window', {
      value: undefined,
      configurable: true,
      enumerable: false,
      writable: false,
    });
  }

  if (typeof (globalThis as any).document === 'undefined') {
    Object.defineProperty(globalThis, 'document', {
      value: undefined,
      configurable: true,
      enumerable: false,
      writable: false,
    });
  }

  // Define localStorage and sessionStorage as no-op objects
  if (typeof (globalThis as any).localStorage === 'undefined') {
    (globalThis as any).localStorage = {
      getItem: () => null,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      setItem: () => {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      removeItem: () => {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      clear: () => {},
      key: () => null,
      length: 0,
    };
  }

  if (typeof (globalThis as any).sessionStorage === 'undefined') {
    (globalThis as any).sessionStorage = {
      getItem: () => null,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      setItem: () => {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      removeItem: () => {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      clear: () => {},
      key: () => null,
      length: 0,
    };
  }

  // Define other browser APIs that might be referenced
  if (typeof (globalThis as any).indexedDB === 'undefined') {
    delete (globalThis as any).indexedDB;
  }

  // crypto.webcrypto is available in Node.js 18+ without import
  if (typeof (globalThis as any).crypto === 'undefined') {
    // Use dynamic import to access Node's built-in crypto without breaking bundlers
    import('crypto')
      .then(({ webcrypto }) => {
        if (webcrypto && typeof (globalThis as any).crypto === 'undefined') {
          (globalThis as any).crypto = webcrypto;
        }
      })
      .catch(() => {
        // Edge Runtime or crypto not available - leave undefined
      });
  }

  if (typeof (globalThis as any).performance === 'undefined') {
    (globalThis as any).performance = {
      now: () => Date.now(),
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      mark: () => {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      measure: () => {},
      getEntries: () => [],
      getEntriesByName: () => [],
      getEntriesByType: () => [],
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      clearMarks: () => {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      clearMeasures: () => {},
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      clearResourceTimings: () => {},
    };
  }

  if (typeof (globalThis as any).queueMicrotask === 'undefined') {
    (globalThis as any).queueMicrotask = (fn: () => void) => {
      Promise.resolve().then(fn);
    };
  }

  if (typeof (globalThis as any).requestAnimationFrame === 'undefined') {
    (globalThis as any).requestAnimationFrame = (fn: () => void) => {
      return setTimeout(fn, 16);
    };
  }

  if (typeof (globalThis as any).cancelAnimationFrame === 'undefined') {
    (globalThis as any).cancelAnimationFrame = (id: number) => {
      clearTimeout(id);
    };
  }

  // Define browser observer APIs
  if (typeof (globalThis as any).ResizeObserver === 'undefined') {
    (globalThis as any).ResizeObserver = class ResizeObserver {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      constructor() {}
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      observe() {}
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      unobserve() {}
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      disconnect() {}
    };
  }

  if (typeof (globalThis as any).IntersectionObserver === 'undefined') {
    (globalThis as any).IntersectionObserver = class IntersectionObserver {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      constructor() {}
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      observe() {}
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      unobserve() {}
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      disconnect() {}
    };
  }

  if (typeof (globalThis as any).MutationObserver === 'undefined') {
    (globalThis as any).MutationObserver = class MutationObserver {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      constructor() {}
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      observe() {}
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      disconnect() {}
      takeRecords() { return []; }
    };
  }

  // Define EventTarget and Event classes
  if (typeof (globalThis as any).EventTarget === 'undefined') {
    (globalThis as any).EventTarget = class EventTarget {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      constructor() {}
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      addEventListener() {}
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      removeEventListener() {}
      dispatchEvent() { return true; }
    };
  }

  if (typeof (globalThis as any).Event === 'undefined') {
    (globalThis as any).Event = class Event {
      constructor(type: string) {
        this.type = type;
      }
      type: string;
      target: any = null;
      currentTarget: any = null;
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      preventDefault() {}
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      stopPropagation() {}
    };
  }

  if (typeof (globalThis as any).CustomEvent === 'undefined') {
    (globalThis as any).CustomEvent = class CustomEvent extends (globalThis as any).Event {
      constructor(type: string, detail?: any) {
        super(type);
        this.detail = detail;
      }
      detail: any;
    };
  }
}

export {}
/* eslint-enable @typescript-eslint/no-empty-function */
