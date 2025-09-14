/**
 * Supabase Server Client
 * 
 * This file provides server-side Supabase client creation.
 * It should ONLY be used in server-side code (route handlers, server actions, etc.)
 */

import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logger } from '../logger'
import type { Database } from '../../types/database'

/**
 * Create a server-side Supabase client
 * This should only be called from server-side code
 */
export function createSupabaseServerClient(): ReturnType<typeof createServerClient<Database>> {
  const cookieStore = cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => 
              cookieStore.set(name, value, options)
            )
          } catch (error) {
            // Ignore errors in server components - middleware handles session refresh
            logger.warn('Failed to set cookies in server component', { error })
          }
        },
      },
    }
  )
}

/**
 * Get the current user from server-side context
 */
export async function getServerUser() {
  const supabase = createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    logger.error('Failed to get server user', error)
    return null
  }
  
  return user
}
