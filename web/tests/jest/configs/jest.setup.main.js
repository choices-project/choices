/**
 * Jest Setup - Simple and Clean
 * 
 * This setup file provides minimal configuration for testing.
 * We use real Supabase credentials and real test users instead of complex mocks.
 */

// Import testing library matchers
require('@testing-library/jest-dom');

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' });

// Simple environment setup for testing
process.env.NODE_ENV = 'test';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Set up privacy pepper environment variables for testing
process.env.PRIVACY_PEPPER_DEV = 'dev-pepper-consistent-for-testing-12345678901234567890';
process.env.PRIVACY_PEPPER_CURRENT = 'hex:' + 'ab'.repeat(32);

// Browser API mocks (only for jsdom environment)
if (typeof window !== 'undefined') {
  // Mock window.matchMedia for responsive components
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Mock navigator.onLine for offline functionality
  Object.defineProperty(navigator, 'onLine', {
    writable: true,
    value: true,
  });

  // Mock service worker
  Object.defineProperty(navigator, 'serviceWorker', {
    writable: true,
    value: {
      register: jest.fn(() => Promise.resolve()),
      ready: Promise.resolve(),
    },
  });

  // Mock PushManager
  Object.defineProperty(window, 'PushManager', {
    writable: true,
    value: {
      supportedContentEncodings: ['aesgcm'],
    },
  });

  // Mock Notification
  Object.defineProperty(window, 'Notification', {
    writable: true,
    value: class Notification {
      constructor(title, options = {}) {
        this.title = title;
        this.options = options;
      }
      
      static requestPermission = jest.fn(() => Promise.resolve('granted'));
      static permission = 'granted';
    },
  });

  // Mock IntersectionObserver for components using infinite scroll
  if (typeof window.IntersectionObserver === 'undefined') {
    class MockIntersectionObserver {
      constructor(callback, options) {
        this.callback = callback;
        this.options = options;
      }
      observe() {}
      unobserve() {}
      disconnect() {}
      takeRecords() { return []; }
    }
    Object.defineProperty(window, 'IntersectionObserver', {
      writable: true,
      configurable: true,
      value: MockIntersectionObserver,
    });
  }
}

// Enhanced fetch polyfill for Node.js (for Supabase compatibility)
if (typeof global.fetch === 'undefined') {
  // Create a comprehensive fetch mock that works with Supabase
  global.fetch = jest.fn().mockImplementation(async (url, options = {}) => {
    // Mock successful response for Supabase requests
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Map([
        ['content-type', 'application/json']
      ]),
      json: async () => ({ data: [], error: null }),
      text: async () => '{"data":[],"error":null}',
      url: url,
      type: 'basic',
      redirected: false,
      clone: () => global.fetch(url, options)
    };
    
    return Promise.resolve(mockResponse);
  });
}

// Simple Response polyfill for Node.js (minimal)
if (typeof global.Response === 'undefined') {
  global.Response = class Response {
    constructor(body, options = {}) {
      this.body = body;
      this.status = options.status || 200;
      this.statusText = options.statusText || 'OK';
      this.headers = new Map();
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value);
        });
      }
    }

    async json() {
      return JSON.parse(this.body || '{}');
    }

    async text() {
      return this.body || '';
    }

    static json(data, options = {}) {
      return new Response(JSON.stringify(data), {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
    }
  };
}

// Simple Headers polyfill for Node.js (minimal)
if (typeof global.Headers === 'undefined') {
  global.Headers = class Headers {
    constructor(init = {}) {
      this.map = new Map();
      if (init) {
        Object.entries(init).forEach(([key, value]) => {
          this.map.set(key.toLowerCase(), value);
        });
      }
    }

    get(name) {
      return this.map.get(name.toLowerCase());
    }

    set(name, value) {
      this.map.set(name.toLowerCase(), value);
    }

    has(name) {
      return this.map.has(name.toLowerCase());
    }

    delete(name) {
      this.map.delete(name.toLowerCase());
    }
  };
}

// Simple Request polyfill for Node.js (minimal)
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(input, init = {}) {
      // Use Object.defineProperty to make url writable
      Object.defineProperty(this, 'url', {
        value: input,
        writable: true,
        enumerable: true,
        configurable: true
      });
      this.method = init.method || 'GET';
      this.headers = new Headers(init.headers);
      this.body = init.body;
    }
  };
}

// TextEncoder/TextDecoder polyfills for Node.js
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/',
    route: '/',
    query: {},
    asPath: '/',
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Per-suite mocks should be declared within tests. Avoid global virtual mocks for app modules.

// Enhanced fetch polyfill for Node.js (for Supabase compatibility)
if (typeof global.fetch === 'undefined') {
  // Create a comprehensive fetch mock that works with Supabase
  global.fetch = jest.fn().mockImplementation(async (url, options = {}) => {
    // Mock successful response for Supabase requests
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Map([
        ['content-type', 'application/json']
      ]),
      json: async () => ({ data: [], error: null }),
      text: async () => '{"data":[],"error":null}',
      url: url,
      type: 'basic',
      redirected: false,
      clone: () => global.fetch(url, options)
    };
    
    return Promise.resolve(mockResponse);
  });
}

// lucide-react is mocked via moduleNameMapper in jest.config.js