import type { makeMockSupabase } from './supabase-mock';

type Handles = ReturnType<typeof makeMockSupabase>['handles'];

export function resetAllMocks(handles: Handles) {
  handles.single.mockClear();
  handles.maybeSingle.mockClear();
  handles.list.mockClear();
  handles.mutate.mockClear();
  handles.rpc.mockClear();
}



