/* eslint-env jest */
// Jest setup that runs after test environment is initialized
require('@testing-library/jest-dom');
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
    configurable: true,
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
    now: jest.fn(() => Math.max(1, Date.now() - performanceStartTime)),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000
    }
  };

  Object.defineProperty(window, 'performance', {
    value: performanceMock,
    configurable: true,
    writable: true
  });

  Object.defineProperty(global, 'performance', {
    value: performanceMock,
    configurable: true,
    writable: true
  });

  let navigatorValue = window.navigator;

  const defineNavigatorAccessor = (key, resolveInitial) => {
    let current = resolveInitial();
    try {
      Object.defineProperty(navigatorValue, key, {
        configurable: true,
        get: () => current,
        set: (value) => {
          current = value;
        },
      });
    } catch {
      try {
        navigatorValue[key] = current;
      } catch {
        // ignore non-configurable properties
      }
    }
    return () => current;
  };

  defineNavigatorAccessor('connection', () => {
    const existing = navigatorValue && navigatorValue.connection;
    if (existing) {
      return existing;
    }
    return {
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
  });

  defineNavigatorAccessor('standalone', () => {
    const existing = navigatorValue && typeof navigatorValue.standalone === 'boolean'
      ? navigatorValue.standalone
      : undefined;
    return typeof existing === 'boolean' ? existing : false;
  });

  defineNavigatorAccessor('onLine', () => {
    const existing = navigatorValue && typeof navigatorValue.onLine === 'boolean'
      ? navigatorValue.onLine
      : undefined;
    return typeof existing === 'boolean' ? existing : true;
  });

  defineNavigatorAccessor('language', () => {
    const existing = navigatorValue.language;
    return typeof existing === 'string' && existing.length > 0 ? existing : 'en-US';
  });
  defineNavigatorAccessor('platform', () => {
    const existing = navigatorValue.platform;
    return typeof existing === 'string' && existing.length > 0 ? existing : 'jest-test';
  });

  Object.defineProperty(window, 'navigator', {
    configurable: true,
    get() {
      return navigatorValue;
    },
    set(value) {
      navigatorValue = value;
    },
  });

  Object.defineProperty(global, 'navigator', {
    configurable: true,
    get() {
      return navigatorValue;
    },
    set(value) {
      navigatorValue = value;
    },
  });

  if (typeof window.PublicKeyCredential === 'undefined') {
    class MockPublicKeyCredential {
      constructor() {
        this.id = 'mock-public-key';
        this.rawId = new ArrayBuffer(16);
        this.response = {
          attestationObject: new ArrayBuffer(0),
          clientDataJSON: new ArrayBuffer(0)
        };
      }

      getClientExtensionResults() {
        return {};
      }

      static isUserVerifyingPlatformAuthenticatorAvailable = jest
        .fn()
        .mockResolvedValue(true);
    }

    Object.defineProperty(window, 'PublicKeyCredential', {
      value: MockPublicKeyCredential,
      configurable: true,
      writable: true
    });

    Object.defineProperty(global, 'PublicKeyCredential', {
      value: MockPublicKeyCredential,
      configurable: true,
      writable: true
    });
  } else if (
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function'
  ) {
    window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable = jest
      .fn()
      .mockResolvedValue(true);
  }

  defineNavigatorAccessor('credentials', () => {
    const existing = navigatorValue && navigatorValue.credentials;
    const container =
      existing ??
      {
        create: jest.fn(async () => new window.PublicKeyCredential()),
        get: jest.fn(async () => null),
      };

    if (typeof container.create !== 'function') {
      container.create = jest.fn(async () => new window.PublicKeyCredential());
    }
    if (typeof container.get !== 'function') {
      container.get = jest.fn(async () => null);
    }
    return container;
  });

  Object.defineProperty(global.navigator, 'credentials', {
    configurable: true,
    get() {
      return navigatorValue.credentials;
    },
    set(value) {
      navigatorValue.credentials = value;
    },
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

if (typeof global.setImmediate === 'undefined') {
  global.setImmediate = (fn, ...args) => setTimeout(fn, 0, ...args);
}

if (typeof global.clearImmediate === 'undefined') {
  global.clearImmediate = (id) => clearTimeout(id);
}
