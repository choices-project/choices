// Set up test environment variables FIRST, before any other imports
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.NEXTAUTH_SECRET = 'test-secret';
process.env.NEXTAUTH_URL = 'http://localhost:3000';

// Set up privacy pepper environment variables for testing
process.env.PRIVACY_PEPPER_DEV = 'dev-pepper-consistent-for-testing-12345678901234567890';
process.env.PRIVACY_PEPPER_CURRENT = 'hex:' + 'ab'.repeat(32);
process.env.PRIVACY_PEPPER_PREVIOUS = 'hex:' + 'cd'.repeat(32);

// Polyfill for Web APIs in Node.js environment
if (typeof global.TextEncoder === 'undefined') {
  const { TextEncoder, TextDecoder } = require('util');
  global.TextEncoder = TextEncoder;
  global.TextDecoder = TextDecoder;
}

// Simple Request polyfill for testing
if (typeof global.Request === 'undefined') {
  global.Request = class Request {
    constructor(url, options = {}) {
      this.url = url;
      this.method = options.method || 'GET';
      this.headers = new Map();
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          this.headers.set(key.toLowerCase(), value);
        });
      }
      this.body = options.body;
    }
    
    async json() {
      return JSON.parse(this.body || '{}');
    }
  };
}

// Simple Response polyfill for testing
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
  };
}

// Simple Headers polyfill for testing
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
  };
}

// Simple fetch polyfill for testing
if (typeof global.fetch === 'undefined') {
  global.fetch = async (url, options = {}) => {
    // Mock fetch for testing - return empty response
    return new Response(JSON.stringify({}), {
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'Content-Type': 'application/json' })
    });
  };
}
