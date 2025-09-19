'use client'

// Minimal Supabase client that doesn't import any Supabase packages at the top level
// This avoids SSR issues by using dynamic imports only

import type { Database } from '@/types/database'

// Import the actual SupabaseClient type
import type { SupabaseClient as ActualSupabaseClient } from '@supabase/supabase-js'

// Re-export the actual type
export type SupabaseClient<T = Database> = ActualSupabaseClient<T>

let client: SupabaseClient<Database> | undefined

export async function getSupabaseBrowserClient(): Promise<SupabaseClient<Database>> {
  if (typeof globalThis.window === 'undefined') {
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

// Export types for use in other modules
export type DatabaseTypes = Database
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Poll = Database['public']['Tables']['polls']['Row']
export type Vote = Database['public']['Tables']['votes']['Row']