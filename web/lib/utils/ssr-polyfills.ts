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
  if (typeof globalThis.self === 'undefined') {
    Object.defineProperty(globalThis, 'self', {
      value: globalThis,
      configurable: true,
      enumerable: false,
      writable: true,
    });
  }

  // Also ensure self is available on global for older modules
  if (typeof global.self === 'undefined') {
    global.self = globalThis;
  }

  // Define other browser globals that might be referenced
  if (typeof globalThis.window === 'undefined') {
    Object.defineProperty(globalThis, 'window', {
      value: undefined,
      configurable: true,
      enumerable: false,
      writable: false,
    });
  }

  if (typeof globalThis.document === 'undefined') {
    Object.defineProperty(globalThis, 'document', {
      value: undefined,
      configurable: true,
      enumerable: false,
      writable: false,
    });
  }

  // Define localStorage and sessionStorage as no-op objects
  if (typeof globalThis.localStorage === 'undefined') {
    globalThis.localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    };
  }

  if (typeof globalThis.sessionStorage === 'undefined') {
    globalThis.sessionStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    };
  }

  // Define other browser APIs that might be referenced
  if (typeof globalThis.indexedDB === 'undefined') {
    delete globalThis.indexedDB;
  }

  if (typeof globalThis.crypto === 'undefined') {
    const crypto = await import('crypto');
    globalThis.crypto = crypto.webcrypto;
  }

  if (typeof globalThis.performance === 'undefined') {
    globalThis.performance = {
      now: () => Date.now(),
      mark: () => {},
      measure: () => {},
      getEntries: () => [],
      getEntriesByName: () => [],
      getEntriesByType: () => [],
      clearMarks: () => {},
      clearMeasures: () => {},
      clearResourceTimings: () => {},
    };
  }

  if (typeof globalThis.queueMicrotask === 'undefined') {
    globalThis.queueMicrotask = (fn: () => void) => {
      Promise.resolve().then(fn);
    };
  }

  if (typeof globalThis.requestAnimationFrame === 'undefined') {
    globalThis.requestAnimationFrame = (fn: () => void) => {
      return setTimeout(fn, 16);
    };
  }

  if (typeof globalThis.cancelAnimationFrame === 'undefined') {
    globalThis.cancelAnimationFrame = (id: number) => {
      clearTimeout(id);
    };
  }

  // Define browser observer APIs
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class ResizeObserver {
      constructor() {}
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  if (typeof globalThis.IntersectionObserver === 'undefined') {
    globalThis.IntersectionObserver = class IntersectionObserver {
      constructor() {}
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  if (typeof globalThis.MutationObserver === 'undefined') {
    globalThis.MutationObserver = class MutationObserver {
      constructor() {}
      observe() {}
      disconnect() {}
      takeRecords() { return []; }
    };
  }

  // Define EventTarget and Event classes
  if (typeof globalThis.EventTarget === 'undefined') {
    globalThis.EventTarget = class EventTarget {
      constructor() {}
      addEventListener() {}
      removeEventListener() {}
      dispatchEvent() { return true; }
    };
  }

  if (typeof globalThis.Event === 'undefined') {
    globalThis.Event = class Event {
      constructor(type: string) {
        this.type = type;
      }
      type: string;
      target: any = null;
      currentTarget: any = null;
      preventDefault() {}
      stopPropagation() {}
    };
  }

  if (typeof globalThis.CustomEvent === 'undefined') {
    globalThis.CustomEvent = class CustomEvent extends globalThis.Event {
      constructor(type: string, detail?: any) {
        super(type);
        this.detail = detail;
      }
      detail: any;
    };
  }
}

export {}
