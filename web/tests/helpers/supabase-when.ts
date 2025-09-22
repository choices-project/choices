import type { State } from './supabase-mock';

type Register = (m: (s: State) => boolean, r: () => any) => void;

function normalize(s: State) {
  return {
    ...s,
    selects: s.selects ?? '*',
    filters: [...s.filters].sort((a,b) => a.column.localeCompare(b.column)),
  };
}

export function makeWhen(__registerRoute: Register) {
  type MB = {
    table: (t: string) => MB;
    op: (op: State['op']) => MB;
    select: (sel?: string) => MB;
    eq: (c: string, v: any) => MB;
    where: (pred: (s: State) => boolean) => MB;
    returnsSingle: (row: any) => void;
    returnsList: (rows: any[]) => void;
    returnsError: (msg: string) => void;
  };

  return function when(): MB {
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

    const api: MB = {
      table(t){ wanted.table = t; return api; },
      op(op){ wanted.op = op; return api; },
      select(sel){ wanted.selects = sel; return api; },
      eq(c,v){ (wanted.filters as any[]).push({ type:'eq', column:c, value:v }); return api; },
      where(p){ pred = p; return api; },

      returnsSingle(row){ __registerRoute(subsetMatch, () => ({ data: row, error: null })); },
      returnsList(rows){ __registerRoute(subsetMatch, () => ({ data: rows, error: null })); },
      returnsError(msg){ __registerRoute(subsetMatch, () => ({ data: null, error: { message: msg } })); },
    };
    return api;
  };
}
