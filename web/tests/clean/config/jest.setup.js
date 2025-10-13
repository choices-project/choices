/**
 * Jest Setup Configuration
 * 
 * Global test setup including:
 * - Test environment configuration
 * - Mock setup
 * - Custom matchers
 * - Performance monitoring
 */

import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

// Polyfills for Node.js environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock Next.js image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} />;
  },
}));

// Mock Next.js link
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href, ...props }) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  },
}));

// Mock Supabase client
jest.mock('@/utils/supabase/server', () => ({
  getSupabaseServerClient: jest.fn(() => Promise.resolve({
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              range: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            })),
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      })),
    })),
  })),
}));

// Mock Supabase client for client-side
jest.mock('@/utils/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      getUser: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              range: jest.fn().mockResolvedValue({
                data: [],
                error: null,
              }),
            })),
          })),
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      })),
    })),
  })),
}));

// Mock Zustand stores
jest.mock('@/lib/stores', () => ({
  useAppStore: jest.fn(() => ({
    isMobile: false,
    isTablet: false,
    isDesktop: true,
    screenSize: 'lg',
    theme: 'light',
    sidebarCollapsed: false,
  })),
  useUserStore: jest.fn(() => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    profile: null,
  })),
  usePollsStore: jest.fn(() => ({
    polls: [],
    userPolls: [],
    isLoading: false,
    error: null,
  })),
  useVotingStore: jest.fn(() => ({
    votes: [],
    isLoading: false,
    error: null,
  })),
  useHashtagStore: jest.fn(() => ({
    hashtags: [],
    followedHashtags: [],
    isLoading: false,
    error: null,
  })),
  useNotificationStore: jest.fn(() => ({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
  })),
  useAnalyticsStore: jest.fn(() => ({
    events: [],
    metrics: null,
    isLoading: false,
    error: null,
  })),
  useAdminStore: jest.fn(() => ({
    users: [],
    dashboardStats: null,
    isLoading: false,
    error: null,
  })),
  useOnboardingStore: jest.fn(() => ({
    currentStep: 0,
    onboardingData: {},
    isLoading: false,
    error: null,
  })),
  useCivicsStore: jest.fn(() => ({
    representatives: [],
    selectedRepresentative: null,
    isLoading: false,
    error: null,
  })),
  usePWAStore: jest.fn(() => ({
    isInstalled: false,
    isOffline: false,
    isLoading: false,
    error: null,
  })),
}));

// Mock feature flags
jest.mock('@/lib/core/feature-flags', () => ({
  FEATURE_FLAGS: {
    WEBAUTHN: true,
    PWA: true,
    ADMIN: true,
    FEEDBACK_WIDGET: true,
    ENHANCED_PROFILE: true,
    ENHANCED_POLLS: true,
    ENHANCED_VOTING: true,
    CIVICS_ADDRESS_LOOKUP: true,
    CIVICS_REPRESENTATIVE_DATABASE: true,
    CIVICS_CAMPAIGN_FINANCE: true,
    CIVICS_VOTING_RECORDS: true,
    CANDIDATE_ACCOUNTABILITY: true,
    CANDIDATE_CARDS: true,
    ALTERNATIVE_CANDIDATES: true,
  },
  featureFlagManager: {
    isEnabled: jest.fn(() => true),
    getFlag: jest.fn(() => ({ enabled: true, metadata: {} })),
  },
}));

// Mock authentication
jest.mock('@/lib/core/auth/server-actions', () => ({
  getUser: jest.fn(() => Promise.resolve({
    id: 'user-123',
    email: 'test@example.com',
  })),
  getAuthenticatedUser: jest.fn(() => Promise.resolve({
    id: 'user-123',
    email: 'test@example.com',
  })),
  createSecureServerAction: jest.fn((fn) => fn),
  validateFormData: jest.fn((formData, schema) => schema.parse(formData)),
}));

// Mock rate limiting
jest.mock('@/lib/core/security/rate-limit', () => ({
  rateLimiters: {
    auth: {
      check: jest.fn(() => Promise.resolve({
        allowed: true,
        remaining: 10,
        resetTime: Date.now() + 900000,
      })),
    },
    api: {
      check: jest.fn(() => Promise.resolve({
        allowed: true,
        remaining: 100,
        resetTime: Date.now() + 3600000,
      })),
    },
  },
}));

// Mock CSRF protection
jest.mock('@/app/api/auth/_shared', () => ({
  validateCsrfProtection: jest.fn(() => true),
  createCsrfErrorResponse: jest.fn(() => new Response('CSRF Error', { status: 403 })),
}));

// Mock logger
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
  devLog: jest.fn(),
}));

// Mock performance monitoring
jest.mock('@/lib/utils/performance', () => ({
  measurePerformance: jest.fn((fn) => fn()),
  getPerformanceMetrics: jest.fn(() => ({
    renderTime: 100,
    memoryUsage: 50,
    cpuUsage: 25,
  })),
}));

// Mock analytics
jest.mock('@/lib/utils/analytics', () => ({
  trackEvent: jest.fn(),
  trackPageView: jest.fn(),
  trackUserAction: jest.fn(),
}));

// Mock PWA functionality
jest.mock('@/lib/utils/pwa', () => ({
  isPWAInstalled: jest.fn(() => false),
  isOffline: jest.fn(() => false),
  installPWA: jest.fn(),
  uninstallPWA: jest.fn(),
}));

// Mock crypto for Node.js environment
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
    getRandomValues: (arr) => arr.map(() => Math.floor(Math.random() * 256)),
  },
});

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock matchMedia
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

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock fetch
global.fetch = jest.fn();

// Mock performance
global.performance = {
  now: jest.fn(() => Date.now()),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
  clearMarks: jest.fn(),
  clearMeasures: jest.fn(),
};

// Custom matchers
expect.extend({
  toBeValidUser(received) {
    const pass = received && 
      typeof received.id === 'string' &&
      typeof received.email === 'string' &&
      typeof received.username === 'string' &&
      typeof received.created_at === 'string' &&
      typeof received.updated_at === 'string' &&
      typeof received.onboarding_completed === 'boolean' &&
      typeof received.is_active === 'boolean';

    return {
      message: () => `expected ${received} to be a valid user object`,
      pass,
    };
  },
  toBeValidPoll(received) {
    const pass = received && 
      typeof received.id === 'string' &&
      typeof received.title === 'string' &&
      typeof received.status === 'string' &&
      typeof received.voting_method === 'string' &&
      typeof received.category === 'string' &&
      typeof received.privacy_level === 'string' &&
      typeof received.created_by === 'string' &&
      typeof received.created_at === 'string' &&
      typeof received.updated_at === 'string';

    return {
      message: () => `expected ${received} to be a valid poll object`,
      pass,
    };
  },
  toBeValidVote(received) {
    const pass = received && 
      typeof received.id === 'string' &&
      typeof received.poll_id === 'string' &&
      typeof received.user_id === 'string' &&
      typeof received.option_id === 'string' &&
      typeof received.created_at === 'string';

    return {
      message: () => `expected ${received} to be a valid vote object`,
      pass,
    };
  },
  toHaveValidResponseTime(received, maxTime) {
    const pass = received <= maxTime;
    return {
      message: () => `expected response time ${received}ms to be less than ${maxTime}ms`,
      pass,
    };
  },
});

// Global test utilities
global.testUtils = {
  createMockUser: (overrides = {}) => ({
    id: 'user-' + Math.random().toString(36).substr(2, 9),
    email: 'test@example.com',
    username: 'testuser',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    onboarding_completed: true,
    is_active: true,
    ...overrides,
  }),
  createMockPoll: (overrides = {}) => ({
    id: 'poll-' + Math.random().toString(36).substr(2, 9),
    title: 'Test Poll',
    description: 'Test poll description',
    status: 'active',
    voting_method: 'single',
    category: 'general',
    privacy_level: 'public',
    created_by: 'user-123',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    total_votes: 0,
    ...overrides,
  }),
  createMockVote: (overrides = {}) => ({
    id: 'vote-' + Math.random().toString(36).substr(2, 9),
    poll_id: 'poll-123',
    user_id: 'user-123',
    option_id: 'option-123',
    created_at: new Date().toISOString(),
    ...overrides,
  }),
  waitFor: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  measureTime: (fn) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    return { result, duration: end - start };
  },
};

// Console configuration for tests
const originalConsole = console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  localStorageMock.clear();
  sessionStorageMock.clear();
});

// Global cleanup
afterAll(() => {
  jest.restoreAllMocks();
});
