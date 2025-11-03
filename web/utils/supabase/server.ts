import 'server-only';                  // build-time guard
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import type { Database } from './database.types'

// Environment validation
const validateEnvironment = () => {
  const requiredVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY
  }

  const missing = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  return requiredVars
}

/**
 * SSR-safe factory. No top-level import of supabase-js or ssr.
 * We dynamically import only at call time in Node.
 */
export async function getSupabaseServerClient(): Promise<SupabaseClient<Database>> {
  const env = validateEnvironment()
  
  let cookieStore
  try {
    cookieStore = cookies()
  } catch {
    // During build time, cookies() might not be available
    // Throw an error to prevent build-time usage
    throw new Error('getSupabaseServerClient() cannot be called during build time. Use it only in API routes and server components.')
  }
  
  const { createServerClient } = await import('@supabase/ssr') // dynamic!
  
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Missing required Supabase environment variables');
  }
  
  return createServerClient<Database>(
    url,
    key,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: Record<string, unknown>) => {
          try {
            cookieStore.set(name, value, options)
          } catch {
            // Ignore errors in RSC context
          }
        },
        remove: (name: string, _options: Record<string, unknown>) => {
          try {
            cookieStore.delete(name)
          } catch {
            // Ignore errors in RSC context
          }
        },
      },
    },
  )
}

/**
 * Admin client using service role key. Use ONLY on the server for admin tasks.
 */
export async function getSupabaseAdminClient(): Promise<SupabaseClient<Database>> {
  const env = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceKey: process.env.SUPABASE_SECRET_KEY,
  }
  if (!env.url || !env.serviceKey) {
    throw new Error('Missing Supabase admin environment variables')
  }
  const { createClient } = await import('@supabase/supabase-js')
  return createClient<Database>(env.url, env.serviceKey)
}

// Export types for use in other modules
export type { Database }
export type DatabaseTypes = Database

// Core table types (tables that exist in the database)
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Poll = Database['public']['Tables']['polls']['Row']
export type Vote = Database['public']['Tables']['votes']['Row']
export type CandidatePlatform = Database['public']['Tables']['candidate_platforms']['Row']
export type RepresentativeCore = Database['public']['Tables']['representatives_core']['Row']
export type Feedback = Database['public']['Tables']['feedback']['Row']
export type WebAuthnCredential = Database['public']['Tables']['webauthn_credentials']['Row']
export type WebAuthnChallenge = Database['public']['Tables']['webauthn_challenges']['Row']
