// Minimal, self-contained core with explicit mock-lib + route registry + terminals consult routes

export type Op = 'select' | 'insert' | 'update' | 'delete' | 'rpc';

export type State = {
  table: string;
  op: Op;
  selects?: string;
  filters: Array<{ type: 'eq'|'neq'|'in'|'ilike'; column: string; value: unknown }>;
  order?: Array<{ column: string; ascending: boolean }>;
  limit?: number;
  rpc?: { fn: string; args: unknown };
};

export type MockLib = {
  fn: <T extends (...a: unknown[]) => unknown>(impl?: T) => unknown;
  spyOn: unknown;
}

type Route = { match: (s: State) => boolean; respond: () => unknown };

export function makeMockSupabase(mockLib: MockLib = {} as MockLib) {
  const routes: Route[] = [];
  const metrics = {
    counts: { single: 0, maybeSingle: 0, list: 0, mutate: 0, rpc: 0 },
    byTable: {} as Record<string, { single: number; maybeSingle: number; list: number; mutate: number; rpc: number }>
  };
  const register = (match: Route['match'], respond: Route['respond']) => routes.push({ match, respond });
  const find = (s: State) => routes.find(r => r.match(s));

  const fn = mockLib.fn;
  const handles = {
    single: fn<(...args: any[]) => unknown>(),
    maybeSingle: fn<(...args: any[]) => unknown>(),
    list: fn<(...args: any[]) => unknown>(),
    mutate: fn<(...args: any[]) => unknown>(),
    rpc: fn<(...args: any[]) => unknown>(),
  };

  const bump = (table: string, key: keyof typeof metrics.counts) => {
    metrics.counts[key]++; (metrics.byTable[table] ??= { single:0, maybeSingle:0, list:0, mutate:0, rpc:0 })[key]++;
  };

  const builder = (seed: State) => {
    const state = structuredClone(seed);

    const api: {
      select: (cols?: string) => typeof api;
      eq: (col: string, val: unknown) => typeof api;
      neq: (col: string, val: unknown) => typeof api;
      in: (col: string, arr: unknown[]) => typeof api;
      ilike: (col: string, val: string) => typeof api;
      order: (col: string, opts?: { ascending?: boolean }) => typeof api;
      limit: (n: number) => typeof api;
      single: () => Promise<{ data: unknown; error: { message: string } | null }>;
      maybeSingle: () => Promise<{ data: unknown; error: null }>;
      then: (onFulfilled: unknown, onRejected: unknown) => Promise<unknown>;
      list: () => Promise<{ data: unknown[]; error: null }>;
      insert: (_rows: unknown) => typeof api;
      update: (_rows?: unknown) => typeof api;
      delete: () => typeof api;
      mutate: () => Promise<{ data: unknown[]; error: null }>;
    } = {
      // chainers
      select(cols?: string){ state.selects = cols ?? '*'; return api; },
      eq(col: string, val: unknown){ state.filters.push({ type:'eq', column: col, value: val }); return api; },
      neq(col: string, val: unknown){ state.filters.push({ type:'neq', column: col, value: val }); return api; },
      in(col: string, arr: unknown[]){ state.filters.push({ type:'in', column: col, value: arr }); return api; },
      ilike(col: string, val: string){ state.filters.push({ type:'ilike', column: col, value: val }); return api; },
      order(col: string, opts?: { ascending?: boolean }){ (state.order ??= []).push({ column: col, ascending: opts?.ascending ?? true }); return api; },
      limit(n: number){ state.limit = n; return api; },

      // terminals (all route-first)
      async single() {
        bump(state.table, 'single'); (handles.single as any).mock.calls.push([structuredClone(state)]);
        const r = find(state); if (r) return r.respond();
        if ((handles.single as any).mockImplementation) return (handles.single as any).mockImplementation(state);
        return { data: null, error: { message: 'Not found' } };
      },
      async maybeSingle() {
        bump(state.table, 'maybeSingle'); (handles.maybeSingle as any).mock.calls.push([structuredClone(state)]);
        const r = find(state); if (r) return r.respond();
        if ((handles.maybeSingle as any).mockImplementation) return (handles.maybeSingle as any).mockImplementation(state);
        return { data: null, error: null };
      },
      async then(onFulfilled: unknown, onRejected: unknown) {
        // allow awaited select() without explicit .list() (PostgREST-ish)
        return api.list().then(onFulfilled as any, onRejected as any);
      },
      async list() {
        bump(state.table, 'list'); (handles.list as any).mock.calls.push([structuredClone(state)]);
        const r = find(state); if (r) return r.respond();
        if ((handles.list as any).mockImplementation) return (handles.list as any).mockImplementation(state);
        return { data: [], error: null };
      },

      // mutations
      insert(_rows: unknown){ state.op = 'insert'; return api; },
      update(_rows?: unknown){ state.op = 'update'; return api; },
      delete(){ state.op = 'delete'; return api; },
      async mutate() {
        bump(state.table, 'mutate'); (handles.mutate as any).mock.calls.push([structuredClone(state)]);
        const r = find(state); if (r) return r.respond();
        if ((handles.mutate as any).mockImplementation) return (handles.mutate as any).mockImplementation(state);
        return { data: [], error: null };
      },
    };

    return api;
  };

  const client = {
    from<T extends string>(table: T) {
      return builder({ table, op: 'select', filters: [], selects: '*' });
    },
    rpc(fnName: string, args?: unknown) {
      const state: State = { table: '__rpc__', op: 'rpc', filters: [], rpc: { fn: fnName, args } };
      bump('__rpc__', 'rpc'); (handles.rpc as any).mock.calls.push([structuredClone(state)]);
      const r = find(state); if (r) return r.respond();
      if ((handles.rpc as any).mockImplementation) return (handles.rpc as any).mockImplementation(state);
      return Promise.resolve({ data: null, error: null });
    },
  };

  const resetAllMocks = () => {
    routes.length = 0;
    for (const k of Object.keys(handles) as (keyof typeof handles)[]) (handles[k] as any).mockReset?.();
    metrics.counts = { single:0, maybeSingle:0, list:0, mutate:0, rpc:0 };
    for (const t of Object.keys(metrics.byTable)) delete metrics.byTable[t];
  };

  return {
    client,
    handles,
    __registerRoute: register,
    getMetrics: () => structuredClone(metrics),
    resetAllMocks,
  };
}