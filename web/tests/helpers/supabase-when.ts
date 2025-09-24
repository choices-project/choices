import type { State } from './supabase-mock';

export type Register = (m: (s: State) => boolean, r: () => any) => void;

function normalize(s: State) {
  return {
    ...s,
    selects: s.selects ?? '*',
    filters: [...s.filters].sort((a,b) => a.column.localeCompare(b.column)),
  };
}

export type MockBuilder = {
  table: (t: string) => MockBuilder;
  op: (op: State['op']) => MockBuilder;
  select: (sel?: string) => MockBuilder;
  eq: (c: string, v: any) => MockBuilder;
  where: (pred: (s: State) => boolean) => MockBuilder;
  returnsSingle: (row: any) => void;
  returnsList: (rows: any[]) => void;
  returnsError: (msg: string) => void;
};

export function makeWhen(registerRoute: Register) {
  return function when(): MockBuilder {
    const wanted: Partial<State> = { filters: [] };
    let pred: ((s: State) => boolean) | undefined;

    const subsetMatch = (s: State) => {
      const nS = normalize(s), nW = normalize(wanted as State);
      const base = nS.table === nW.table && nS.op === nW.op;
      const subset = (nW.filters ?? []).every(wf =>
        (nS.filters ?? []).some(sf => sf.type === wf.type && sf.column === wf.column && sf.value === wf.value)
      );
      const selOK = !nW.selects || nW.selects === nS.selects;
      const predOK = pred ? pred(s) : true;
      return base && subset && selOK && predOK;
    };

    const api: MockBuilder = {
      table(t){ wanted.table = t; return api; },
      op(op){ wanted.op = op; return api; },
      select(sel){ wanted.selects = sel ?? '*'; return api; },
      eq(c,v){ (wanted.filters as any[]).push({ type:'eq', column:c, value:v }); return api; },
      where(p){ pred = p; return api; },

      returnsSingle(row){ registerRoute(subsetMatch, () => ({ data: row, error: null })); },
      returnsList(rows){ registerRoute(subsetMatch, () => ({ data: rows, error: null })); },
      returnsError(msg){ registerRoute(subsetMatch, () => ({ data: null, error: { message: msg } })); },
    };
    return api;
  };
}

// Export the when function and expectQueryState for backward compatibility
export const when = makeWhen(() => {});
export const expectQueryState = () => {};
