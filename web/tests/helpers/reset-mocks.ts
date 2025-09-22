/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Handles } from './supabase-mock';

export function resetAllMocks(handles: Handles) {
  handles.single.mockClear();
  handles.maybeSingle.mockClear();
  handles.list.mockClear();
  handles.mutate.mockClear();
  handles.rpc.mockClear();
}


