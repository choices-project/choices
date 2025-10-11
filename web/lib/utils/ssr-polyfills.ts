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
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    };
  }

  if (typeof (globalThis as any).sessionStorage === 'undefined') {
    (globalThis as any).sessionStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    };
  }

  // Define other browser APIs that might be referenced
  if (typeof (globalThis as any).indexedDB === 'undefined') {
    delete (globalThis as any).indexedDB;
  }

  if (typeof (globalThis as any).crypto === 'undefined') {
    const crypto = await import('crypto');
    (globalThis as any).crypto = crypto.webcrypto;
  }

  if (typeof (globalThis as any).performance === 'undefined') {
    (globalThis as any).performance = {
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
      constructor() {}
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  if (typeof (globalThis as any).IntersectionObserver === 'undefined') {
    (globalThis as any).IntersectionObserver = class IntersectionObserver {
      constructor() {}
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  }

  if (typeof (globalThis as any).MutationObserver === 'undefined') {
    (globalThis as any).MutationObserver = class MutationObserver {
      constructor() {}
      observe() {}
      disconnect() {}
      takeRecords() { return []; }
    };
  }

  // Define EventTarget and Event classes
  if (typeof (globalThis as any).EventTarget === 'undefined') {
    (globalThis as any).EventTarget = class EventTarget {
      constructor() {}
      addEventListener() {}
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
      preventDefault() {}
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
