'use client'

import { createBrowserClient } from '@supabase/ssr'

import { env } from '@/lib/config/env'

import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Browser Supabase client for Next.js App Router.
 *
 * Must use `@supabase/ssr` `createBrowserClient` (PKCE + cookie storage) so
 * `signInWithOAuth` stores the code verifier where `exchangeCodeForSession` in
 * `/auth/callback` can read it via `createServerClient` + `cookies()`.
 * Plain `createClient` from `supabase-js` used localStorage only, which breaks
 * server-side OAuth code exchange.
 */
let client: SupabaseClient<Database> | undefined

export async function getSupabaseBrowserClient(): Promise<SupabaseClient<Database>> {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseBrowserClient can only be used in client-side code')
  }

  if (!client) {
    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }

    client = createBrowserClient<Database>(supabaseUrl, supabaseKey, {
      isSingleton: true,
    })
  }
  return client
}

// Export Database type for convenience
export type { Database }
