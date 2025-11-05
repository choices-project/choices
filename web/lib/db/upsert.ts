/**
 * Phase 4: Clean Database Operations
 * 
 * Wraps Supabase operations with stripUndefinedDeep to eliminate
 * exactOptionalPropertyTypes violations in DB writes
 */

import { getSupabaseBrowserClient } from '../../utils/supabase/client'
import { stripUndefinedDeep } from '../util/clean'

/**
 * Clean upsert operation that strips undefined values before DB write
 * Eliminates hundreds of exactOptionalPropertyTypes errors
 */
export async function upsertClean<T extends object>(
  table: string,
  payload: T,
  options?: { onConflict?: string }
) {
  const supabase = await getSupabaseBrowserClient()
  const cleanPayload = stripUndefinedDeep(payload)
  
  if (options?.onConflict) {
    return (supabase as any).from(table).upsert(cleanPayload, { onConflict: options.onConflict })
  }
  
  return (supabase as any).from(table).upsert(cleanPayload)
}

/**
 * Clean insert operation that strips undefined values before DB write
 */
export async function insertClean<T extends object>(
  table: string,
  payload: T
) {
  const supabase = await getSupabaseBrowserClient()
  const cleanPayload = stripUndefinedDeep(payload)
  return (supabase as any).from(table).insert(cleanPayload)
}

/**
 * Clean update operation that strips undefined values before DB write
 */
export async function updateClean<T extends object>(
  table: string,
  payload: T,
  match: Record<string, unknown>
) {
  const supabase = await getSupabaseBrowserClient()
  const cleanPayload = stripUndefinedDeep(payload)
  
  let query = (supabase as any).from(table).update(cleanPayload)
  
  for (const [key, value] of Object.entries(match)) {
    query = query.eq(key, value as any)
  }
  
  return query
}
