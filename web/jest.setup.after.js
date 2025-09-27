// Jest setup that runs after test environment is initialized
require('@testing-library/jest-dom');
const _React = require('react');

// Mock crypto API for DPoP tests
Object.defineProperty(global, 'crypto', {
  value: {
    subtle: {
      generateKey: jest.fn().mockResolvedValue({
        publicKey: { type: 'public', algorithm: { name: 'ECDSA' } },
        privateKey: { type: 'private', algorithm: { name: 'ECDSA' } }
      }),
      exportKey: jest.fn().mockResolvedValue(new ArrayBuffer(32)),
      importKey: jest.fn().mockResolvedValue({ type: 'public', algorithm: { name: 'ECDSA' } }),
      sign: jest.fn().mockResolvedValue(new ArrayBuffer(64)),
      verify: jest.fn().mockResolvedValue(true)
    },
    getRandomValues: jest.fn().mockImplementation((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    })
  }
});

// Mock Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signUp: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: jest.fn().mockResolvedValue({ error: null }),
      onAuthStateChange: jest.fn().mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } })
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
      then: jest.fn().mockResolvedValue({ data: [], error: null })
    })),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null })
  }))
}));

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
    };
  },
}));

// Mock Next.js image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage(props) {
    const React = require('react');
    return React.createElement('img', props);
  },
}));

// Mock Next.js server components
jest.mock('next/server', () => ({
  NextRequest: class MockNextRequest {
    constructor(url = 'http://localhost:3000') {
      this.url = url;
      this.headers = new Map();
      this.method = 'GET';
    }
  },
  NextResponse: {
    json: jest.fn((data) => ({ json: () => data })),
    redirect: jest.fn((url) => ({ url })),
    next: jest.fn(() => ({ next: true }))
  }
}));

// Mock window.matchMedia (only in browser environment)
if (typeof window !== 'undefined') {
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

  // Mock performance API
  let performanceStartTime = Date.now();
  const performanceMock = {
    now: jest.fn(() => {
      // Return a value that's always > 0 to ensure calculationTime is tracked
      return Math.max(1, Date.now() - performanceStartTime);
    }),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000
    }
  };
  
  // Mock for browser environment
  Object.defineProperty(window, 'performance', {
    value: performanceMock
  });
  
  // Mock for Node.js environment
  Object.defineProperty(global, 'performance', {
    value: performanceMock
  });

  // Mock navigator
  Object.defineProperty(window, 'navigator', {
    value: {
      ...window.navigator,
      connection: {
        effectiveType: '4g',
        downlink: 10,
        rtt: 50
      },
      standalone: false,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  });
}

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Suppress console warnings in tests
const originalWarn = console.warn;
const originalError = console.error;

beforeAll(() => {
  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is deprecated') ||
       args[0].includes('Warning: An update to') ||
       args[0].includes('Warning: componentWillReceiveProps'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };

  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Failed to load devices') ||
       args[0].includes('Warning: An update to'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.warn = originalWarn;
  console.error = originalError;
});

// Mock privacy-utils module globally to prevent environment variable checks
jest.mock('@/lib/civics/privacy-utils', () => ({
  hmac256: jest.fn(),
  verifyHmacDigest: jest.fn(),
  normalizeAddress: jest.fn(),
  generateAddressHMAC: jest.fn(),
  generatePlaceIdHMAC: jest.fn(),
  generateIPHMAC: jest.fn(),
  geohashWithJitter: jest.fn(),
  bucketIsKAnonymous: jest.fn(),
  setJurisdictionCookie: jest.fn(),
  readJurisdictionCookie: jest.fn(),
  validateAddressInput: jest.fn(),
  isCivicsEnabled: jest.fn(),
  generateRequestId: jest.fn(),
}));

// Mock env-guard module globally to prevent environment variable checks
jest.mock('@/lib/civics/env-guard', () => ({
  assertPepperConfig: jest.fn(),
}));
