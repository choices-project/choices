// Production safeguard for temporary stub
if (process.env.NODE_ENV === 'production') {
  console.warn('[supabase-ssr-safe] Using temporary stub in production. Replace with real impl.');
}

/**
 * SSR-Safe Supabase Client
 * 
 * This file provides SSR-safe Supabase client creation for browser environments.
 * It ensures that Supabase clients are only created on the client side.
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/utils/supabase/server'

/**
 * Create a Supabase client for browser environments
 * This function is safe to call from client components
 */
export function createBrowserClientSafe() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
}

