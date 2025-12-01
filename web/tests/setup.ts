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
  | { kind: 'single'; value: any }
  | { kind: 'list'; value: any[] }
  | { kind: 'error'; message: string }
  | { kind: 'value'; value: any };

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

const defaultMetrics = (): Metrics => ({
  totalOperations: 0,
  byTable: {}
});

const recordMetric = (metrics: Metrics, table: string, kind: MetricKind) => {
  metrics.totalOperations += 1;
  metrics.byTable[table] ??= {};
  const tableMetrics = metrics.byTable[table]!;
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
) => {
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

const makeThenable = <T>(execute: () => Promise<T>) => {
  const promise = {
    then: (onFulfilled: any, onRejected: any) =>
      execute().then(onFulfilled, onRejected),
    catch: (onRejected: any) => execute().catch(onRejected),
    finally: (onFinally: any) => execute().finally(onFinally)
  };
  return promise as Promise<T>;
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

  const buildSelectQuery = (table: string, expectation: Expectation) => {
    let consumed = false;
    const exec = (mode: 'single' | 'list') => {
      if (consumed) {
        return Promise.resolve({
          data: null,
          error: { message: 'Expectation already consumed' }
        });
      }
      consumed = true;
      return Promise.resolve(createSupabaseResponse(expectation, table, metrics, mode));
    };

    const query: any = {
      eq: () => query,
      order: () => query,
      limit: () => query,
      maybeSingle: () => exec('single'),
      single: () => exec('single'),
      throwOnError: () => query,
      then: (...args: any[]) => makeThenable(() => exec('list')).then(...args),
      catch: (...args: any[]) => makeThenable(() => exec('list')).catch(...args),
      finally: (...args: any[]) => makeThenable(() => exec('list')).finally(...args)
    };

    return query;
  };

  const supabaseClient: any = {
    from: jest.fn((table: string) => ({
      select: (..._args: any[]) => {
        const expectation = shiftExpectation(table, 'select');
        return buildSelectQuery(table, expectation);
      },
      insert: (..._args: any[]) => {
        const expectation = shiftExpectation(table, 'insert');
        return Promise.resolve(
          createSupabaseResponse(expectation, table, metrics, 'list')
        );
      },
      update: (..._args: any[]) => {
        const expectation = shiftExpectation(table, 'update');
        return Promise.resolve(
          createSupabaseResponse(expectation, table, metrics, 'list')
        );
      },
      delete: (..._args: any[]) => {
        const expectation = shiftExpectation(table, 'delete');
        return Promise.resolve(
          createSupabaseResponse(expectation, table, metrics, 'list')
        );
      }
    })),
    rpc: jest.fn((fnName: string, ..._args: any[]) => {
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
  };

  const when = () => {
    const expectation: Partial<Expectation> = {
      result: { kind: 'single', value: null }
    };

    const builder: any = {
      table: (tableName: string) => {
        expectation.table = tableName;
        return builder;
      },
      op: (operation: SupabaseOp) => {
        expectation.op = operation;
        return builder;
      },
      select: () => builder,
      eq: () => builder,
      returnsSingle: (value: any) => {
        expectation.result = { kind: 'single', value };
        expectations.push(expectation as Expectation);
        return builder;
      },
      returnsList: (value: any[]) => {
        expectation.result = { kind: 'list', value };
        expectations.push(expectation as Expectation);
        return builder;
      },
      returnsError: (message: string) => {
        expectation.result = { kind: 'error', message };
        expectations.push(expectation as Expectation);
        return builder;
      },
      returns: (value: any) => {
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

