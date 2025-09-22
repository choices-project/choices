# Testing Fix Analysis and Implementation

**Created:** January 21, 2025  
**Status:** Root cause identified, fixes ready for implementation  
**Priority:** Critical - Immediate implementation needed

## Root Cause Analysis ✅

You've correctly identified the three core issues:

### 1. **Jest Detection at Factory Creation Time is Flaky**
- Factory checks `globalThis.jest?.fn` when module is evaluated
- In some paths it's undefined, so factory falls back to custom spy
- Custom spy tracks calls but doesn't return arranged data → "Poll not found"

### 2. **Arrangements Aren't Actually Consulted by Terminal Methods**
- `when().returnsSingle(...)` DSL records intent
- `builder.single()` doesn't resolve via arrangements in fallback path
- Just calls `handles.single(state)` (no mock impl) and returns default error

### 3. **Exact-Match Arrangements are Brittle**
- VoteProcessor likely uses different `select(...)` shape than arrangement
- Even if arrangements were consulted, serialized state mismatch would miss
- All three combine: metrics show call, arrangement "exists", but response defaults to "not found"

## Immediate Fixes to Implement

### ✅ Fix 1: Make Mocking Lib Explicit (No More Global Detection)

**Problem:** Factory depends on `globalThis.jest` timing which is unreliable.

**Solution:** Pass mock library explicitly to factory.

```typescript
// web/tests/helpers/supabase-mock.ts
export interface MockLib {
  fn: <T extends (...args: any[]) => any>(impl?: T) => jest.MockedFunction<T>;
  spyOn: typeof jest.spyOn;
}

export function makeMockSupabase(mockLib: MockLib = require('jest-mock')) {
  const fn = mockLib.fn;
  const handles = {
    single: fn<(s: State) => any>(),
    maybeSingle: fn<(s: State) => any>(),
    list: fn<(s: State) => any>(),
    mutate: fn<(s: State) => any>(),
    rpc: fn<(s: State) => any>(),
  };
  // ... rest of implementation
}
```

```typescript
// web/tests/setup.ts
import * as JestMock from 'jest-mock';
import { makeMockSupabase } from './helpers/supabase-mock';

export const getMS = () => makeMockSupabase(JestMock); // explicit, stable
```

### ✅ Fix 2: Route Responses Through Registry the Terminals Consult

**Problem:** Terminal methods don't check arrangements, just call handles with no implementation.

**Solution:** Make terminals check route registry first, populated by `when()` DSL.

```typescript
// web/tests/helpers/supabase-mock.ts (inside makeMockSupabase)
type State = {
  table: string;
  op: 'select' | 'insert' | 'update' | 'delete' | 'rpc';
  selects?: string;
  filters: Array<{ type: 'eq' | 'neq' | 'in' | 'ilike', column: string, value: any }>;
  order?: Array<{ column: string, ascending: boolean }>;
  limit?: number;
  rpc?: { fn: string, args: any };
};

type Route = { match: (s: State) => boolean; respond: () => any };

const routes: Route[] = [];

function registerRoute(match: Route['match'], respond: Route['respond']) {
  routes.push({ match, respond });
}

function findRoute(state: State) {
  return routes.find(r => r.match(state));
}

// Export for when() DSL
export const __registerRoute = registerRoute;

// Terminal wrapper inside query builder
async function single() {
  metrics.counts.single++;
  metrics.byTable[state.table] ??= { single: 0, list: 0, mutate: 0, rpc: 0 };
  metrics.byTable[state.table].single++;

  const route = findRoute(state);
  // Always push into handles for assertions
  handles.single.mock.calls.push([structuredClone(state)] as any);

  if (route) return route.respond();         // ← arrangements win
  if (handles.single.mockImplementation) {
    return handles.single.mockImplementation(state);
  }
  return { data: null, error: { message: 'Poll not found' } }; // default
}
```

### ✅ Fix 3: Make Matching Loose (Don't Require Exact Serialized State)

**Problem:** `select('*')` vs `select('id,title')` breaks matching unnecessarily.

**Solution:** Add normalizer + fuzzy matcher for loose matching.

```typescript
// web/tests/helpers/supabase-when.ts
import { __registerRoute } from './supabase-mock';

type MatchBuilder = {
  table: (t: string) => MatchBuilder;
  op: (op: State['op']) => MatchBuilder;
  select: (sel?: string) => MatchBuilder;
  eq: (c: string, v: any) => MatchBuilder;
  where: (pred: (s: State) => boolean) => MatchBuilder;
  returnsSingle: (row: any) => void;
  returnsList: (rows: any[]) => void;
  returnsError: (message: string) => void;
};

function normalize(s: State) {
  return {
    ...s,
    selects: s.selects ?? '*',
    filters: [...s.filters].sort((a, b) => a.column.localeCompare(b.column)),
  };
}

export function when(): MatchBuilder {
  const wanted: Partial<State> = { filters: [] };

  const api: MatchBuilder = {
    table(t) { wanted.table = t; return api; },
    op(op) { wanted.op = op; return api; },
    select(sel) { wanted.selects = sel; return api; },
    eq(c, v) { (wanted.filters as any[]).push({ type: 'eq', column: c, value: v }); return api; },
    where(pred) { (api as any).__pred = pred; return api; },

    returnsSingle(row) {
      __registerRoute(
        (s) => {
          const nS = normalize(s), nW = normalize(wanted as State);
          // loose: must match table & op; filters in nW must be subset of nS
          const base = nS.table === nW.table && nS.op === nW.op;
          const subset = (nW.filters ?? []).every(wf =>
            (nS.filters ?? []).some(sf => sf.type === wf.type && sf.column === wf.column && sf.value === wf.value)
          );
          const selOK = !nW.selects || nW.selects === nS.selects; // only if test specified
          const predOK = (api as any).__pred ? (api as any).__pred(s) : true;
          return base && subset && selOK && predOK;
        },
        () => ({ data: row, error: null })
      );
    },

    returnsList(rows) {
      __registerRoute(
        (s) => {
          const nS = normalize(s), nW = normalize(wanted as State);
          const base = nS.table === nW.table && nS.op === nW.op;
          const subset = (nW.filters ?? []).every(wf =>
            (nS.filters ?? []).some(sf => sf.type === wf.type && sf.column === wf.column && sf.value === wf.value)
          );
          const selOK = !nW.selects || nW.selects === nS.selects;
          const predOK = (api as any).__pred ? (api as any).__pred(s) : true;
          return base && subset && selOK && predOK;
        },
        () => ({ data: rows, error: null })
      );
    },

    returnsError(message) {
      __registerRoute(
        (s) => {
          const nS = normalize(s), nW = normalize(wanted as State);
          const base = nS.table === nW.table && nS.op === nW.op;
          const subset = (nW.filters ?? []).every(wf =>
            (nS.filters ?? []).some(sf => sf.type === wf.type && sf.column === wf.column && sf.value === wf.value)
          );
          const selOK = !nW.selects || nW.selects === nS.selects;
          const predOK = (api as any).__pred ? (api as any).__pred(s) : true;
          return base && subset && selOK && predOK;
        },
        () => ({ data: null, error: { message } })
      );
    },
  };
  return api;
}
```

### ✅ Fix 4: Keep Handles as Spies Only (Don't Depend on Them for Data)

**Problem:** Mixing spy functionality with data resolution.

**Solution:** Use handles only for call tracking, route registry for data.

```typescript
// Optional: Wrap mockResolvedValueOnce to register route
handles.single.mockResolvedValueOnce = (value: any) => {
  let pending = true;
  __registerRoute(
    () => pending,
    () => { pending = false; return value; }
  );
};
```

### ✅ Fix 5: Update Test Usage (Robust + Readable)

**Problem:** Current test uses fragile exact matching.

**Solution:** Use new loose matcher.

```typescript
// BEFORE (fragile)
when(handles).table('polls').select('*').eq('id', 'test-poll-123').returnsSingle(mockPoll);

// AFTER (robust)
when().table('polls').op('select').eq('id', 'test-poll-123').returnsSingle(mockPoll);
```

## Why VoteValidator Passes But VoteProcessor Fails

**VoteValidator** probably uses:
- Simple `maybeSingle()` calls
- Different select shape that coincidentally matched arrangement
- Or hit a route that was wired correctly

**VoteProcessor** uses:
- Different selection shape (`select('*')` vs specific columns)
- Multiple calls (read poll, check votes, insert vote, update poll)
- First call hits registry incorrectly and falls back to "not found"

The loose-match route registry removes this brittleness and supports multi-step flows.

## Implementation Checklist

### Immediate Actions:
- [ ] **Factory uses explicit mock lib** (`makeMockSupabase(JestMock)`)
- [ ] **Terminals check routes first**, then push spy calls, then fall back
- [ ] **when() uses subset/loose matching** (table + op + filter subset)
- [ ] **Specs use when()**, not `handles.*.mockResolvedValueOnce` for happy path
- [ ] **Re-run failing test** to validate fix

### Validation Commands:
```bash
# Test the fix
npx jest tests/unit/vote/vote-processor.test.ts -t "should process valid vote successfully" --verbose

# Expected results:
# metrics.byTable.polls.single === 1
# Final result: { success: true }
```

### If Still Failing:
```typescript
// Add debugging in builder's single() before routing
console.log('Last state:', lastState);

// Add catch-all route temporarily to prove routing works
when().where(() => true).returnsSingle(mockPoll); // delete after
```

## Questions for Implementation

1. **Should we implement all fixes at once or incrementally?**
   - **Recommendation:** Implement Fix 1 (explicit mock lib) first, then Fix 2 (route registry), then Fix 3 (loose matching)

2. **How to handle backward compatibility?**
   - **Recommendation:** Keep existing `when(handles)` API but deprecate it, add new `when()` API

3. **Should we update all existing tests immediately?**
   - **Recommendation:** Fix the failing tests first, then gradually migrate others

4. **How to handle the privacy-utils environment issue?**
   - **Recommendation:** Address separately after fixing the mock factory core issue

## Next Steps

1. **Implement Fix 1** - Explicit mock library injection
2. **Test with single failing test** - Validate the approach
3. **Implement Fix 2** - Route registry system
4. **Implement Fix 3** - Loose matching
5. **Update failing tests** - Use new robust API
6. **Run full test suite** - Ensure no regressions
7. **Update documentation** - Reflect new patterns

## Files to Modify

1. **`web/tests/helpers/supabase-mock.ts`** - Core factory with explicit mock lib and route registry
2. **`web/tests/helpers/supabase-when.ts`** - New loose matching DSL
3. **`web/tests/setup.ts`** - Explicit Jest mock injection
4. **`web/tests/unit/vote/vote-processor.test.ts`** - Update to use new API
5. **`web/tests/helpers/arrange-helpers.ts`** - Update to use new when() API

This analysis provides a clear path forward to fix the V2 mock factory issues while maintaining the sophisticated testing infrastructure you've built.
