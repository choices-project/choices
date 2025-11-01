/**
 * Supabase Client
 * 
 * This file provides client-side Supabase client creation.
 * It should ONLY be used in client-side code (components with 'use client')
 */

import { createBrowserClient } from '@supabase/ssr'

import { logger } from '@/lib/logger'
import type { Database } from '@/types/database'

'use client'

// Hard runtime guard - fail loudly if imported on server
if (typeof window === 'undefined') {
  throw new Error('createSupabaseClient() was imported on the server. Use createSupabaseServerClient() instead.')
}

/**
 * Create a client-side Supabase client
 * This should only be called from client-side code
 */
export function createSupabaseClient(): ReturnType<typeof createBrowserClient<Database>> {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

/**
 * Get the current user from client-side context
 */
export async function getClientUser() {
  const supabase = createSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    logger.error('Failed to get client user', error)
    return null
  }
  
  return user
}
