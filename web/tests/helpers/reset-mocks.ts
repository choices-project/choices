import type { makeMockSupabase } from './supabase-mock';

type Handles = ReturnType<typeof makeMockSupabase>['handles'];

export function resetAllMocks(handles: Handles) {
  (handles as any).single?.mockClear?.();
  (handles as any).maybeSingle?.mockClear?.();
  (handles as any).list?.mockClear?.();
  (handles as any).mutate?.mockClear?.();
  (handles as any).rpc?.mockClear?.();
}



