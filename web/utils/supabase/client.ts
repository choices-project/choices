'use client'
import type { Database } from '@/types/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

// Import the complete, up-to-date Database types from the central source

let client: SupabaseClient<Database> | undefined

export async function getSupabaseBrowserClient(): Promise<SupabaseClient<Database>> {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseBrowserClient can only be used in client-side code')
  }
  
  if (!client) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }
    
    // Use dynamic import to avoid SSR issues
    const { createBrowserClient } = await import('@supabase/ssr')
    client = createBrowserClient<Database>(
      supabaseUrl,
      supabaseKey,
    )
  }
  return client
}

// Export Database type for convenience
export type { Database }
