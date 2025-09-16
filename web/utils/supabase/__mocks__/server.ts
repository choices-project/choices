// A controllable mock for the Supabase "server" wrapper.
// Exposes helpers so tests can set per-table results and reset cleanly.

type SingleResult<T> = Promise<{ data: T | null; error: any | null }>;

const makeQb = <T>(singleImpl?: () => SingleResult<T>, limitImpl?: () => Promise<{ data: T[] | null; error: any | null }>) => {
  const chain: any = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(async () => ({ data: null, error: null })),
  };
  if (singleImpl) {
    chain.single.mockImplementation(singleImpl);
  }
  if (limitImpl) {
    chain.limit.mockImplementation(limitImpl);
  }
  return chain;
};

// A registry so tests can configure return values per table.
const tableHandlers = new Map<
  string,
  { qb: any }
>();

// Default client shape your code expects.
export const __client = {
  auth: {
    getUser: jest.fn<Promise<{ data: { id: string; email?: string } | null; error: any | null }>, []>(),
  },
  from: jest.fn((table: string) => {
    const existing = tableHandlers.get(table);
    if (existing) return existing.qb;
    const qb = makeQb();
    tableHandlers.set(table, { qb });
    return qb;
  }),
  rpc: jest.fn().mockResolvedValue({ data: true, error: null }),
};

// Helpers for tests
export const __resetClient = () => {
  __client.auth.getUser.mockReset();
  __client.from.mockClear();
  __client.rpc.mockClear();
  tableHandlers.clear();
};

export const __setRpcResult = (functionName: string, result: any, error: any = null) => {
  __client.rpc.mockImplementation((fn: string) => {
    if (fn === functionName) {
      return Promise.resolve({ data: result, error });
    }
    return Promise.resolve({ data: null, error: new Error(`Unknown RPC function: ${fn}`) });
  });
};

export const __setFromSingle = <T>(table: string, data: T | null, error: any = null) => {
  const qb = makeQb<T>(() => Promise.resolve({ data, error }));
  tableHandlers.set(table, { qb });
  return qb; // handy if you want to assert calls on select/eq later
};

export const __setFromLimit = <T>(table: string, data: T[] | null, error: any = null) => {
  const qb = makeQb<T>(undefined, () => Promise.resolve({ data, error }));
  tableHandlers.set(table, { qb });
  return qb; // handy if you want to assert calls on select/limit later
};

// Additional exports for test compatibility - removed duplicates

// This is the named export your code imports.
export const getSupabaseServerClient = jest.fn(async () => __client);
