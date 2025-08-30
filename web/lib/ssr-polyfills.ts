/**
 * Minimal SSR Polyfills
 * 
 * This file provides minimal polyfills for Next.js SSR environment
 * to handle the 'self is not defined' error and other essential browser globals.
 * 
 * This is specifically designed to fix the SSR issues with Supabase
 * without importing complex Node.js modules that cause build issues.
 */

// Aggressive polyfill setup - run immediately
// Polyfill for 'self' global - this is the main fix for the SSR error
if (typeof globalThis.self === 'undefined') {
  (globalThis as any).self = globalThis
}

// Also ensure self is available on global for older modules
if (typeof (global as any).self === 'undefined') {
  (global as any).self = globalThis
}

// Only run additional polyfills in server environment
if (typeof window === 'undefined') {

  // Polyfill for 'window' global
  if (typeof globalThis.window === 'undefined') {
    (globalThis as any).window = globalThis
  }

  // Minimal document polyfill
  if (typeof globalThis.document === 'undefined') {
    (globalThis as any).document = {
      createElement: () => ({}),
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
      removeEventListener: () => {},
      cookie: '',
      location: {
        href: '',
        origin: '',
        protocol: '',
        host: '',
        hostname: '',
        port: '',
        pathname: '',
        search: '',
        hash: '',
        reload: () => {},
        replace: () => {},
        assign: () => {}
      }
    }
  }

  // Minimal navigator polyfill
  if (typeof globalThis.navigator === 'undefined') {
    (globalThis as any).navigator = {
      userAgent: 'Node.js',
      language: 'en-US',
      languages: ['en-US'],
      cookieEnabled: true,
      onLine: true,
      platform: 'Node.js',
      vendor: 'Node.js'
    }
  }

  // Minimal location polyfill
  if (typeof globalThis.location === 'undefined') {
    (globalThis as any).location = {
      href: '',
      origin: '',
      protocol: '',
      host: '',
      hostname: '',
      port: '',
      pathname: '',
      search: '',
      hash: '',
      reload: () => {},
      replace: () => {},
      assign: () => {}
    }
  }

  // Minimal localStorage polyfill
  if (typeof globalThis.localStorage === 'undefined') {
    (globalThis as any).localStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0
    }
  }

  // Minimal sessionStorage polyfill
  if (typeof globalThis.sessionStorage === 'undefined') {
    (globalThis as any).sessionStorage = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0
    }
  }

  // Minimal indexedDB polyfill
  if (typeof globalThis.indexedDB === 'undefined') {
    (globalThis as any).indexedDB = {
      open: () => ({
        result: null,
        error: null,
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null
      }),
      deleteDatabase: () => ({
        result: null,
        error: null,
        onsuccess: null,
        onerror: null,
        onblocked: null
      })
    }
  }

  // Minimal crypto polyfill (if not already available)
  if (typeof globalThis.crypto === 'undefined') {
    ;(globalThis as any).crypto = {
      getRandomValues: (array: any) => {
        for (let i = 0; i < array.length; i++) {
          array[i] = Math.floor(Math.random() * 256)
        }
        return array
      },
      subtle: {
        generateKey: () => Promise.resolve({}),
        sign: () => Promise.resolve(new ArrayBuffer(0)),
        verify: () => Promise.resolve(true),
        encrypt: () => Promise.resolve(new ArrayBuffer(0)),
        decrypt: () => Promise.resolve(new ArrayBuffer(0)),
        digest: () => Promise.resolve(new ArrayBuffer(0)),
        importKey: () => Promise.resolve({}),
        exportKey: () => Promise.resolve(new ArrayBuffer(0))
      }
    }
  }

  // Minimal performance polyfill
  if (typeof globalThis.performance === 'undefined') {
    ;(globalThis as any).performance = {
      now: () => Date.now(),
      timeOrigin: Date.now(),
      mark: () => {},
      measure: () => {},
      getEntries: () => [],
      getEntriesByName: () => [],
      getEntriesByType: () => [],
      clearMarks: () => {},
      clearMeasures: () => {},
      clearResourceTimings: () => {}
    }
  }

  // Minimal queueMicrotask polyfill
  if (typeof globalThis.queueMicrotask === 'undefined') {
    ;(globalThis as any).queueMicrotask = (callback: () => void) => {
      Promise.resolve().then(callback)
    }
  }

  // Minimal requestAnimationFrame polyfill
  if (typeof globalThis.requestAnimationFrame === 'undefined') {
    ;(globalThis as any).requestAnimationFrame = (callback: (timestamp: number) => void) => {
      return setTimeout(() => callback(Date.now()), 16)
    }
  }

  // Minimal cancelAnimationFrame polyfill
  if (typeof globalThis.cancelAnimationFrame === 'undefined') {
    ;(globalThis as any).cancelAnimationFrame = (id: number) => {
      clearTimeout(id)
    }
  }

  // Minimal ResizeObserver polyfill
  if (typeof globalThis.ResizeObserver === 'undefined') {
    ;(globalThis as any).ResizeObserver = class ResizeObserver {
      constructor(callback: any) {
        this.callback = callback
      }
      observe() {}
      unobserve() {}
      disconnect() {}
      private callback: any
    }
  }

  // Minimal IntersectionObserver polyfill
  if (typeof globalThis.IntersectionObserver === 'undefined') {
    ;(globalThis as any).IntersectionObserver = class IntersectionObserver {
      constructor(callback: any) {
        this.callback = callback
      }
      observe() {}
      unobserve() {}
      disconnect() {}
      private callback: any
    }
  }

  // Minimal MutationObserver polyfill
  if (typeof globalThis.MutationObserver === 'undefined') {
    ;(globalThis as any).MutationObserver = class MutationObserver {
      constructor(callback: any) {
        this.callback = callback
      }
      observe() {}
      disconnect() {}
      takeRecords() { return [] }
      private callback: any
    }
  }

  // Minimal EventTarget polyfill
  if (typeof globalThis.EventTarget === 'undefined') {
    ;(globalThis as any).EventTarget = class EventTarget {
      constructor() {
        this.listeners = new Map()
      }
      addEventListener(type: string, listener: any) {
        if (!this.listeners.has(type)) {
          this.listeners.set(type, [])
        }
        this.listeners.get(type)!.push(listener)
      }
      removeEventListener(type: string, listener: any) {
        const listeners = this.listeners.get(type)
        if (listeners) {
          const index = listeners.indexOf(listener)
          if (index > -1) {
            listeners.splice(index, 1)
          }
        }
      }
      dispatchEvent(event: any) {
        const listeners = this.listeners.get(event.type)
        if (listeners) {
          listeners.forEach((listener: any) => listener(event))
        }
        return true
      }
      private listeners: Map<string, any[]>
    }
  }

  // Minimal Event polyfill
  if (typeof globalThis.Event === 'undefined') {
    ;(globalThis as any).Event = class Event {
      constructor(type: string, options?: any) {
        this.type = type
        this.target = null
        this.currentTarget = null
        this.eventPhase = 0
        this.bubbles = options?.bubbles || false
        this.cancelable = options?.cancelable || false
        this.defaultPrevented = false
        this.timeStamp = Date.now()
      }
      type: string
      target: any
      currentTarget: any
      eventPhase: number
      bubbles: boolean
      cancelable: boolean
      defaultPrevented: boolean
      timeStamp: number
      preventDefault() {
        if (this.cancelable) {
          this.defaultPrevented = true
        }
      }
      stopPropagation() {}
      stopImmediatePropagation() {}
    }
  }

  // Minimal CustomEvent polyfill
  if (typeof globalThis.CustomEvent === 'undefined') {
    ;(globalThis as any).CustomEvent = class CustomEvent extends (globalThis as any).Event {
      constructor(type: string, options?: any) {
        super(type, options)
        this.detail = options?.detail
      }
      detail: any
    }
  }

  // SSR polyfills applied successfully
}

export {}
