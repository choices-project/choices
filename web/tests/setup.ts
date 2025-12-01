/**
 * Jest Test Setup
 *
 * Global test setup and configuration shared across all Jest projects.
 *
 * @created September 9, 2025
 * @migrated November 6, 2025 - Moved into web/tests to align with monorepo modules
 */

import '@testing-library/jest-dom';
import { webcrypto } from 'crypto';
import { TextDecoder, TextEncoder } from 'util';

import * as React from 'react';

import { authServer } from './msw/server';

// Note: Avoid importing the React type name directly to prevent self-referential typeof issues below.

// Defer loading MSW server until runtime to avoid top-level transform issues.
let authServer: any = {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  listen: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  close: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  resetHandlers: () => {}
};

beforeAll(async () => {
  try {
    // dynamic import prevents top-level transform/require errors
    const mod = await import('./msw/server');
    authServer = mod.authServer ?? authServer;
    if (typeof authServer.listen === 'function') {
      authServer.listen({ onUnhandledRequest: 'warn' });
    }
  } catch (err) {
    // Fail fast: MSW server is required for tests that depend on handlers.

    console.error('Failed to import ./msw/server in tests/setup. MSW handlers are required: ', (err as Error)?.message ?? err);
    throw err; // ensure CI/test run fails loudly so you can fix missing file/config
  }
});

afterAll(() => {
  try {
    authServer?.close?.();
  } catch (_e) {
    // Ignore errors during cleanup
  }
});

afterEach(() => {
  try {
    authServer?.resetHandlers?.();
  } catch (_e) {
    // Ignore errors during cleanup
  }
});

jest.mock('lucide-react', () => {
  const ActualReact = jest.requireActual('react') as typeof React;
  const icons: Record<string, unknown> = {};

  const createIcon = (name: string) =>
    ActualReact.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) =>
      ActualReact.createElement('svg', { ref, 'data-icon': name, ...props }),
    );

  return new Proxy(
    {},
    {
      get: (_target, prop: string | symbol) => {
        if (prop === '__esModule') {
          return true;
        }
        if (prop === 'default') {
          return {};
        }
        const key = String(prop);
        if (!icons[key]) {
          icons[key] = createIcon(key);
        }
        return icons[key];
      },
    },
  );
});

jest.mock('@/lib/stores/storage', () => {
  const { createJSONStorage } = jest.requireActual('zustand/middleware');
  const memoryStorage = () => {
    const store = new Map<string, string>();
    return {
      getItem: (name: string) => store.get(name) ?? null,
      setItem: (name: string, value: string) => {
        store.set(name, value);
      },
      removeItem: (name: string) => {
        store.delete(name);
      },
    };
  };

  return {
    createSafeStorage: () => createJSONStorage(memoryStorage),
  };
});

// Minimal mocks for i18n and next/navigation used by many components in tests
jest.mock('next-intl', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const englishMessages = require('../messages/en.json') as Record<string, unknown>;

  const humanizeKey = (key: string): string => {
    const lastSegment = key.split('.').pop() ?? key;
    const withSpaces = lastSegment
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/[_-]/g, ' ')
      .trim();
    if (!withSpaces) {
      return key;
    }
    return withSpaces.charAt(0).toUpperCase() + withSpaces.slice(1);
  };

  const resolveMessage = (messages: Record<string, unknown>, key: string): string | undefined => {
    return key.split('.').reduce<unknown>((acc, segment) => {
      if (acc && typeof acc === 'object' && segment in (acc as Record<string, unknown>)) {
        return (acc as Record<string, unknown>)[segment];
      }
      return undefined;
    }, messages) as string | undefined;
  };

  const applyParams = (template: string, vars?: Record<string, unknown>): string => {
    if (!vars) {
      return template;
    }
    return template.replace(/\{(\w+)\}/g, (_match, param: string) => {
      if (param in vars) {
        const value = vars[param];
        if (value === null || value === undefined) {
          return '';
        }
        return String(value);
      }
      return '';
    });
  };

  const formatTranslation = (
    key: string,
    vars?: Record<string, unknown>,
    scopedMessages: Record<string, unknown> = englishMessages,
  ): string => {
    const raw = resolveMessage(scopedMessages, key);
    const base = typeof raw === 'string' ? raw : humanizeKey(key);
    return applyParams(base, vars);
  };

  const defaultIntl = {
    locale: 'en',
    messages: englishMessages,
    formatMessage: (key: string, vars?: Record<string, unknown>) => formatTranslation(key, vars),
  };

  const IntlContext = React.createContext(defaultIntl);

  const NextIntlClientProvider = ({
    locale = 'en',
    messages = englishMessages,
    children,
  }: {
    locale?: string;
    messages?: Record<string, unknown>;
    children?: React.ReactNode;
  }) => {
    const value = {
      locale,
      messages,
      formatMessage: (key: string, vars?: Record<string, unknown>) => formatTranslation(key, vars, messages),
    };
    return React.createElement(IntlContext.Provider, { value }, children);
  };

  const useLocale = () => React.useContext(IntlContext).locale;
  const useTranslations = () => {
    const ctx = React.useContext(IntlContext);
    return React.useCallback(
      (key: string, vars?: Record<string, unknown>) => ctx.formatMessage(key, vars),
      [ctx],
    );
  };

  return {
    NextIntlClientProvider,
    useLocale,
    useTranslations,
  };
});

jest.mock('next/navigation', () => {
  const push = jest.fn();
  const replace = jest.fn();
  const prefetch = jest.fn().mockResolvedValue(undefined);
  return {
    useParams: jest.fn(() => ({ locale: 'en' })),
    usePathname: jest.fn(() => '/'),
    useRouter: () => ({
      push,
      replace,
      prefetch,
      pathname: '/',
    }),
  };
});

(globalThis as any).Notification =
  (typeof Notification !== 'undefined' && Notification) ||
  class MockNotification {
    static permission = 'granted';
    static requestPermission = jest.fn(async () => 'granted');
  };

jest.spyOn(globalThis.Notification, 'requestPermission').mockResolvedValue('granted');

// Use Node.js built-in Web Crypto API for testing
Object.defineProperty(global, 'crypto', {
  value: webcrypto,
  writable: true,
  configurable: true
});

// Mock TextEncoder and TextDecoder for Node.js environment
(globalThis as any).TextEncoder = TextEncoder;
(globalThis as any).TextDecoder = TextDecoder;

// Mock btoa and atob for base64 encoding
(globalThis as any).btoa = (str: string) => Buffer.from(str, 'binary').toString('base64');
(globalThis as any).atob = (str: string) => Buffer.from(str, 'base64').toString('binary');

// Mock global fetch to prevent real network requests in tests
global.fetch = jest.fn().mockImplementation((_input, _init) =>
  Promise.resolve({
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => ({}),
    text: async () => '',
    blob: async () => new Blob(),
    arrayBuffer: async () => new ArrayBuffer(0),
    formData: async () => new FormData(),
    headers: new Headers(),
    redirected: false,
    type: 'default' as ResponseType,
    url: '',
    clone: jest.fn(),
    body: null,
    bodyUsed: false,
  }),
) as unknown as typeof fetch;

// Mock console methods to reduce noise in tests
const originalConsole = {
  error: console.error.bind(console),
  warn: console.warn.bind(console),
  info: console.info.bind(console),
  log: console.log.bind(console),
};

// Silence unimplemented audio playback warnings in jsdom
if (typeof window !== 'undefined' && window.HTMLMediaElement) {
  window.HTMLMediaElement.prototype.play = async () => undefined;
}

// Silence unimplemented audio playback warnings in jsdom
if (typeof window !== 'undefined' && window.HTMLMediaElement) {
  window.HTMLMediaElement.prototype.play = async () => undefined;
}

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning: ReactDOM.render is deprecated')) {
      return;
    }
    originalConsole.error('[ERROR]', ...args);
  };

  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') || args[0].includes('componentWillMount'))
    ) {
      return;
    }
    originalConsole.warn('[WARN]', ...args);
  };

  console.info = (...args: unknown[]) => {
    originalConsole.info('[INFO]', ...args);
  };
});

afterAll(() => {
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
  console.info = originalConsole.info;
});

// Mock environment variables for Supabase tests
process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'test-service-role-key';

// Mock analytics and external service calls
const createAuthAnalyticsMock = (modulePath: string) => {
  const actual = jest.requireActual<typeof import('@/features/analytics/lib/auth-analytics')>(modulePath);
  // @ts-expect-error - Overriding private method for testing purposes
  class MockAuthAnalytics extends actual.AuthAnalytics {
    // Override network-bound method so tests remain deterministic
    async sendToExternalService(): Promise<void> {
      return Promise.resolve();
    }
  }
  return {
    ...actual,
    AuthAnalytics: MockAuthAnalytics,
  };
};

jest.mock('@/features/analytics/lib/auth-analytics', () =>
  createAuthAnalyticsMock('@/features/analytics/lib/auth-analytics'),
);

jest.mock('@/lib/core/services/analytics/lib/auth-analytics', () =>
  createAuthAnalyticsMock('@/lib/core/services/analytics/lib/auth-analytics'),
);

// Mock rate limiter to prevent undefined promise errors
// Use a factory function to avoid out-of-scope variable references in jest.mock
const createApiRateLimiter = () => ({
  apiRateLimiter: {
    checkLimit: jest.fn().mockResolvedValue({
      allowed: true,
      remaining: 50,
      resetTime: Date.now() + 900000,
      totalHits: 1,
    }),
    getViolationsForIP: jest.fn().mockResolvedValue([]),
    getAllViolations: jest.fn().mockResolvedValue([]),
    getMetrics: jest.fn().mockResolvedValue({
      totalViolations: 0,
      violationsByIP: new Map(),
      violationsByEndpoint: new Map(),
      violationsLastHour: 0,
      topViolatingIPs: [],
    }),
    clearRateLimit: jest.fn().mockResolvedValue(true),
    getRateLimitStatus: jest.fn().mockResolvedValue(null),
  },
});

// Use inline factories (no out-of-scope variable captured by the jest.mock factory)
jest.mock('@/lib/rate-limiting/api-rate-limiter', () => createApiRateLimiter());
// Note: Only mock the primary path - other import paths will resolve to the same module

type SupabaseOp = 'select' | 'insert' | 'update' | 'delete' | 'rpc';

type ExpectationResult =
  | { kind: 'single'; value: unknown }
  | { kind: 'list'; value: unknown[] }
  | { kind: 'error'; message: string }
  | { kind: 'value'; value: unknown };

type Expectation = {
  table: string;
  op: SupabaseOp;
  result: ExpectationResult;
};

type MetricKind = 'single' | 'list' | 'error' | 'value';

type Metrics = {
  totalOperations: number;
  byTable: Record<string, Partial<Record<MetricKind, number>>>;
};

type SupabaseResponse = {
  data: unknown;
  error: { message: string } | null;
  count?: number;
};

type SelectQuery = PromiseLike<SupabaseResponse> & {
  eq: (...args: unknown[]) => SelectQuery;
  order: (...args: unknown[]) => SelectQuery;
  limit: (...args: unknown[]) => SelectQuery;
  maybeSingle: () => Promise<SupabaseResponse>;
  single: () => Promise<SupabaseResponse>;
  throwOnError: () => SelectQuery;
  catch: <TResult = never>(
    onRejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null
  ) => Promise<SupabaseResponse | TResult>;
  finally: (onFinally?: (() => void) | null) => Promise<SupabaseResponse>;
};

type SupabaseTableOperations = {
  select: (...args: unknown[]) => SelectQuery;
  insert: (...args: unknown[]) => Promise<SupabaseResponse>;
  update: (...args: unknown[]) => Promise<SupabaseResponse>;
  delete: (...args: unknown[]) => Promise<SupabaseResponse>;
};

type SupabaseMockClient = {
  from: jest.Mock<SupabaseTableOperations, [string]>;
  rpc: jest.Mock<Promise<SupabaseResponse>, [string, ...unknown[]]>;
  auth: {
    getUser: jest.Mock<Promise<{ data: { user: null }; error: null }>, []>;
  };
};

type ExpectationBuilder = {
  table: (tableName: string) => ExpectationBuilder;
  op: (operation: SupabaseOp) => ExpectationBuilder;
  select: (...args: unknown[]) => ExpectationBuilder;
  eq: (...args: unknown[]) => ExpectationBuilder;
  returnsSingle: (value: unknown) => ExpectationBuilder;
  returnsList: (value: unknown[]) => ExpectationBuilder;
  returnsError: (message: string) => ExpectationBuilder;
  returns: (value: unknown) => ExpectationBuilder;
};

const defaultMetrics = (): Metrics => ({
  totalOperations: 0,
  byTable: {}
});

const recordMetric = (metrics: Metrics, table: string, kind: MetricKind) => {
  metrics.totalOperations += 1;
  metrics.byTable[table] ??= {};
  const tableMetrics = metrics.byTable[table] ?? {};
  metrics.byTable[table] = tableMetrics;
  tableMetrics[kind] = (tableMetrics[kind] ?? 0) + 1;
};

const clone = <T>(value: T): T => {
  if (value === null || value === undefined) {
    return value;
  }
  return JSON.parse(JSON.stringify(value));
};

const createSupabaseResponse = (
  expectation: Expectation,
  table: string,
  metrics: Metrics,
  consumeAs: 'single' | 'list'
): SupabaseResponse => {
  switch (expectation.result.kind) {
    case 'single': {
      recordMetric(metrics, table, 'single');
      return {
        data: clone(expectation.result.value),
        error: null
      };
    }
    case 'list': {
      recordMetric(metrics, table, 'list');
      const list = clone(expectation.result.value);
      if (consumeAs === 'single') {
        return {
          data: list[0] ?? null,
          error: null
        };
      }
      return {
        data: list,
        error: null,
        count: Array.isArray(list) ? list.length : undefined
      };
    }
    case 'error': {
      recordMetric(metrics, table, 'error');
      return {
        data: null,
        error: { message: expectation.result.message }
      };
    }
    case 'value': {
      recordMetric(metrics, table, 'value');
      return {
        data: clone(expectation.result.value),
        error: null
      };
    }
    default: {
      recordMetric(metrics, table, 'error');
      return {
        data: null,
        error: { message: 'Unhandled expectation result' }
      };
    }
  }
};

export const getMS = () => {
  const expectations: Expectation[] = [];
  let metrics = defaultMetrics();

  const shiftExpectation = (table: string, op: SupabaseOp): Expectation => {
    const opIndex = expectations.findIndex(
      (item) => item.table === table && item.op === op
    );

    if (opIndex === -1) {
      throw new Error(
        `No mock Supabase expectation configured for ${table}.${op}`
      );
    }

    const [expectation] = expectations.splice(opIndex, 1);
    if (!expectation) {
      throw new Error(`Failed to retrieve expectation for ${table}.${op}`);
    }
    return expectation;
  };

  const buildSelectQuery = (table: string, expectation: Expectation): SelectQuery => {
    let consumed = false;
    const exec = (mode: 'single' | 'list'): Promise<SupabaseResponse> => {
      if (consumed) {
        return Promise.resolve({
          data: null,
          error: { message: 'Expectation already consumed' }
        });
      }
      consumed = true;
      return Promise.resolve(createSupabaseResponse(expectation, table, metrics, mode));
    };

    const query: Partial<SelectQuery> = {};
    const chain = (): SelectQuery => query as SelectQuery;

    query.eq = (..._args: unknown[]) => chain();
    query.order = (..._args: unknown[]) => chain();
    query.limit = (..._args: unknown[]) => chain();
    query.maybeSingle = () => exec('single');
    query.single = () => exec('single');
    query.throwOnError = () => chain();
    query.then = <TResult1 = SupabaseResponse, TResult2 = never>(
      onFulfilled?: ((value: SupabaseResponse) => TResult1 | PromiseLike<TResult1>) | null,
      onRejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
    ) => exec('list').then(onFulfilled, onRejected);
    query.catch = <TResult = never>(
      onRejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null
    ) => exec('list').catch(onRejected) as Promise<SupabaseResponse | TResult>;
    query.finally = (onFinally?: (() => void) | null) => exec('list').finally(onFinally ?? undefined);

    return chain();
  };

  const supabaseClient = {
    from: jest.fn((table: string) => ({
      select: (..._args: unknown[]) => {
        const expectation = shiftExpectation(table, 'select');
        return buildSelectQuery(table, expectation);
      },
      insert: (..._args: unknown[]) => {
        const expectation = shiftExpectation(table, 'insert');
        return Promise.resolve(
          createSupabaseResponse(expectation, table, metrics, 'list')
        );
      },
      update: (..._args: unknown[]) => {
        const expectation = shiftExpectation(table, 'update');
        return Promise.resolve(
          createSupabaseResponse(expectation, table, metrics, 'list')
        );
      },
      delete: (..._args: unknown[]) => {
        const expectation = shiftExpectation(table, 'delete');
        return Promise.resolve(
          createSupabaseResponse(expectation, table, metrics, 'list')
        );
      }
    })),
    rpc: jest.fn((fnName: string, ..._args: unknown[]) => {
      const tableKey = `rpc:${fnName}`;
      const expectation = shiftExpectation(tableKey, 'rpc');
      return Promise.resolve(
        createSupabaseResponse(expectation, tableKey, metrics, 'single')
      );
    }),
    auth: {
      getUser: jest.fn(async () => ({
        data: { user: null },
        error: null
      }))
    }
  } satisfies SupabaseMockClient;

  const when = () => {
    const expectation: Partial<Expectation> = {
      result: { kind: 'single', value: null }
    };

    const builder: ExpectationBuilder = {
      table: (tableName: string) => {
        expectation.table = tableName;
        return builder;
      },
      op: (operation: SupabaseOp) => {
        expectation.op = operation;
        return builder;
      },
      select: (..._args: unknown[]) => builder,
      eq: (..._args: unknown[]) => builder,
      returnsSingle: (value: unknown) => {
        expectation.result = { kind: 'single', value };
        expectations.push(expectation as Expectation);
        return builder;
      },
      returnsList: (value: unknown[]) => {
        expectation.result = { kind: 'list', value };
        expectations.push(expectation as Expectation);
        return builder;
      },
      returnsError: (message: string) => {
        expectation.result = { kind: 'error', message };
        expectations.push(expectation as Expectation);
        return builder;
      },
      returns: (value: unknown) => {
        expectation.result = { kind: 'value', value };
        expectations.push(expectation as Expectation);
        return builder;
      }
    };

    return builder;
  };

  return {
    when,
    client: supabaseClient,
    getMetrics: () => metrics,
    resetAllMocks: () => {
      expectations.splice(0, expectations.length);
      metrics = defaultMetrics();
      supabaseClient.from.mockClear();
      supabaseClient.rpc.mockClear();
      supabaseClient.auth.getUser.mockClear();
    }
  };
};

