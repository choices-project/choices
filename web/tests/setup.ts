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

// Note: Avoid importing the React type name directly to prevent self-referential typeof issues below.

import { authServer } from './msw/server';

beforeAll(() => {
  authServer.listen({ onUnhandledRequest: 'warn' });
});

afterAll(() => {
  authServer.close();
});

afterEach(() => {
  authServer.resetHandlers();
});

jest.mock('lucide-react', () => {
  const ReactActual = jest.requireActual<typeof import('react')>('react');
  const icons: Record<string, unknown> = {};

  const createIcon = (name: string) =>
    ReactActual.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) =>
      ReactActual.createElement('svg', { ref, 'data-icon': name, ...props }),
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

  // Helper to format common translation patterns
  const formatTranslation = (key: string, vars?: Record<string, unknown>): string => {
    // Handle common count-based translations
    if (key.includes('inDays') && vars?.count) {
      return `In ${vars.count} days`;
    }
    if (key.includes('tomorrow')) {
      return 'Tomorrow';
    }
    if (key.includes('today')) {
      return 'Today';
    }
    if (key.includes('additional') && vars?.count) {
      return `(+${vars.count})`;
    }
    // Handle other common patterns
    if (key.includes('Petition')) {
      return 'Petition';
    }
    if (key.includes('no civic actions found') || (key.includes('empty') && key.includes('actions'))) {
      return 'No civic actions found';
    }
    if (key.includes('create') && (key.includes('action') || key.includes('button'))) {
      return 'Create action';
    }
    if (key.includes('actions.list.buttons.create')) {
      return 'Create action';
    }
    // Default: return key for tests that need to assert on keys
    return key;
  };

  const defaultIntl = {
    locale: 'en',
    messages: {},
    formatMessage: formatTranslation,
  };

  const IntlContext = React.createContext(defaultIntl);

  const NextIntlClientProvider = ({ locale = 'en', messages = {}, children }: {
    locale?: string;
    messages?: Record<string, string>;
    children?: React.ReactNode;
  }) => {
    const value = {
      locale,
      messages,
      formatMessage: (key: string, vars?: Record<string, unknown>) => {
        // Use provided messages if available, otherwise use smart formatting
        return (messages && messages[key]) || formatTranslation(key, vars);
      },
    };

    return React.createElement(IntlContext.Provider, { value }, children);
  };

  const useLocale = () => React.useContext(IntlContext).locale;
  const useTranslations = (_ns?: string) => {
    const ctx = React.useContext(IntlContext);
    return (key: string, vars?: Record<string, unknown>) => ctx.formatMessage(key, vars);
  };

  // Provide exports used by next-intl
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

// Mock console methods to reduce noise in tests
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Silence unimplemented audio playback warnings in jsdom
if (typeof window !== 'undefined' && window.HTMLMediaElement) {
  window.HTMLMediaElement.prototype.play = async () => undefined;
}

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('Warning: ReactDOM.render is deprecated')) {
      return;
    }

    originalConsoleError.apply(console, args as []);
  };

  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') || args[0].includes('componentWillMount'))
    ) {
      return;
    }

    originalConsoleWarn.apply(console, args as []);
  };
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Mock environment variables for Supabase tests
process.env.NEXT_PUBLIC_SUPABASE_URL ??= 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'test-service-role-key';

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

