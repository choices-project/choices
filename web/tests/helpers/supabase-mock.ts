// Minimal, self-contained core with explicit mock-lib + route registry + terminals consult routes

export type Op = 'select' | 'insert' | 'update' | 'delete' | 'rpc';

export type State = {
  table: string;
  op: Op;
  selects?: string;
  filters: Array<{ type: 'eq'|'neq'|'in'|'ilike'; column: string; value: any }>;
  order?: Array<{ column: string; ascending: boolean }>;
  limit?: number;
  rpc?: { fn: string; args: any };
};

export type MockLib = {
  fn: <T extends (...a: any[]) => any>(impl?: T) => any;
  spyOn: any;
}

type Route = { match: (s: State) => boolean; respond: () => any };

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
    single: fn<(s: State) => any>(),
    maybeSingle: fn<(s: State) => any>(),
    list: fn<(s: State) => any>(),
    mutate: fn<(s: State) => any>(),
    rpc: fn<(s: State) => any>(),
  };

  const bump = (table: string, key: keyof typeof metrics.counts) => {
    metrics.counts[key]++; (metrics.byTable[table] ||= { single:0, maybeSingle:0, list:0, mutate:0, rpc:0 })[key]++;
  };

  const builder = (seed: State) => {
    const state = structuredClone(seed);

    const api: any = {
      // chainers
      select(cols?: string){ state.selects = cols ?? '*'; return api; },
      eq(col: string, val: any){ state.filters.push({ type:'eq', column: col, value: val }); return api; },
      neq(col: string, val: any){ state.filters.push({ type:'neq', column: col, value: val }); return api; },
      in(col: string, arr: any[]){ state.filters.push({ type:'in', column: col, value: arr }); return api; },
      ilike(col: string, val: string){ state.filters.push({ type:'ilike', column: col, value: val }); return api; },
      order(col: string, opts?: { ascending?: boolean }){ (state.order ||= []).push({ column: col, ascending: opts?.ascending ?? true }); return api; },
      limit(n: number){ state.limit = n; return api; },

      // terminals (all route-first)
      async single() {
        bump(state.table, 'single'); handles.single.mock.calls.push([structuredClone(state)] as any);
        const r = find(state); if (r) return r.respond();
        if (handles.single.mockImplementation) return handles.single.mockImplementation(state);
        return { data: null, error: { message: 'Not found' } };
      },
      async maybeSingle() {
        bump(state.table, 'maybeSingle'); handles.maybeSingle.mock.calls.push([structuredClone(state)] as any);
        const r = find(state); if (r) return r.respond();
        if (handles.maybeSingle.mockImplementation) return handles.maybeSingle.mockImplementation(state);
        return { data: null, error: null };
      },
      async then(onFulfilled: any, onRejected: any) {
        // allow awaited select() without explicit .list() (PostgREST-ish)
        return api.list().then(onFulfilled, onRejected);
      },
      async list() {
        bump(state.table, 'list'); handles.list.mock.calls.push([structuredClone(state)] as any);
        const r = find(state); if (r) return r.respond();
        if (handles.list.mockImplementation) return handles.list.mockImplementation(state);
        return { data: [], error: null };
      },

      // mutations
      insert(_rows: any){ state.op = 'insert'; return api; },
      update(_rows?: any){ state.op = 'update'; return api; },
      delete(){ state.op = 'delete'; return api; },
      async mutate() {
        bump(state.table, 'mutate'); handles.mutate.mock.calls.push([structuredClone(state)] as any);
        const r = find(state); if (r) return r.respond();
        if (handles.mutate.mockImplementation) return handles.mutate.mockImplementation(state);
        return { data: [], error: null };
      },
    };

    return api;
  };

  const client = {
    from<T extends string>(table: T) {
      return builder({ table, op: 'select', filters: [], selects: '*' });
    },
    rpc(fnName: string, args?: any) {
      const state: State = { table: '__rpc__', op: 'rpc', filters: [], rpc: { fn: fnName, args } };
      bump('__rpc__', 'rpc'); handles.rpc.mock.calls.push([structuredClone(state)] as any);
      const r = find(state); if (r) return r.respond();
      if (handles.rpc.mockImplementation) return handles.rpc.mockImplementation(state);
      return Promise.resolve({ data: null, error: null });
    },
  };

  const resetAllMocks = () => {
    routes.length = 0;
    for (const k of Object.keys(handles) as (keyof typeof handles)[]) handles[k].mockReset();
    metrics.counts = { single:0, maybeSingle:0, list:0, mutate:0, rpc:0 } as any;
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