'use client'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

// Import the fully aligned database schema types from Supabase
import type { Database } from '@/types/database.types'

// Re-export the Database type for use in other modules
export type { Database }

let client: SupabaseClient<Database> | undefined

export async function getSupabaseBrowserClient(): Promise<SupabaseClient<Database>> {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseBrowserClient can only be used in client-side code')
  }
  
  if (!client) {
    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
    const supabaseKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
    
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
// Note: Other table types are not available in the real schema as those tables are empty

// Create Supabase client
export const createClient = (): SupabaseClient<Database> => {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL']
  const supabaseKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing required Supabase environment variables')
  }
  
  return createSupabaseClient<Database>(supabaseUrl, supabaseKey)
}

// Alias for compatibility
export const getSupabaseClient = createClient
