import type { PostgrestSingleResponse } from '@supabase/supabase-js';

export function unwrapSingle<T>(r: PostgrestSingleResponse<T>): T | null {
  if (r.error?.code === 'PGRST116') return null; // no rows
  if (r.error) throw r.error;
  return r.data ?? null;
}