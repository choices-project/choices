/**
 * SSR-Safe Supabase Configuration
 * 
 * This file provides a comprehensive solution for Supabase client usage
 * in Next.js SSR environments, handling the 'self is not defined' error
 * and providing proper client initialization for both client and server.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import type { cookies } from 'next/headers'
import { logger } from '@/lib/logger'
import { isBrowser, isServer } from '@/shared/lib/ssr-safe'
import type { Database, UserProfileInsert, UserProfileUpdate, PollInsert, PollUpdate, VoteInsert } from '@/types/database'

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

// Database types are now imported from ../types/database.ts
// This provides proper type safety for all Supabase operations

/**
 * Create SSR-safe browser client
 * Uses @supabase/ssr for proper browser-side initialization
 */
export const createBrowserClientSafe = (): SupabaseClient<Database> | null => {
  // Only create browser client in browser environment
  if (!isBrowser()) {
    logger.warn('Attempted to create browser client in server environment')
    return null
  }

  try {
    const env = validateEnvironment()
    
    return createBrowserClient(
      env.NEXT_PUBLIC_SUPABASE_URL!,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ) as unknown as SupabaseClient<Database>
  } catch (error) {
    logger.error('Failed to create browser client', error instanceof Error ? error : new Error(String(error)))
    return null
  }
}

/**
 * Create SSR-safe server client
 * Uses @supabase/ssr for proper server-side initialization
 */
export const createServerClientSafe = (cookieStore: ReturnType<typeof cookies>): SupabaseClient<Database> | null => {
  // Only create server client in server environment
  if (!isServer()) {
    logger.warn('Attempted to create server client in browser environment')
    return null
  }

  try {
    const env = validateEnvironment()
    
    return createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL!,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
    ) as unknown as SupabaseClient<Database>
  } catch (error) {
    logger.error('Failed to create server client', error instanceof Error ? error : new Error(String(error)))
    return null
  }
}

/**
 * Create service role client for admin operations
 * This is safe for server-side use only
 */
export const createServiceRoleClient = (): SupabaseClient<Database> | null => {
  try {
    const env = validateEnvironment()
    
    return createClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL!,
      env.SUPABASE_SECRET_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        db: {
          schema: 'public'
        },
        global: {
          headers: {
            'X-Client-Info': 'choices-platform-service-role'
          }
        }
      }
    )
  } catch (error) {
    logger.error('Failed to create service role client', error instanceof Error ? error : new Error(String(error)))
    return null
  }
}

/**
 * Get client based on environment
 * Automatically chooses the appropriate client type
 */
export const getSupabaseClient = (): SupabaseClient<Database> | null => {
  // Check if we're in a browser environment
  if (isBrowser()) {
    return createBrowserClientSafe()
  }
  
  // Server environment - return null to force explicit server client creation
  return null
}

/**
 * Error handling wrapper for Supabase operations
 */
export const handleSupabaseError = (error: any, context: string): never => {
  const errorMessage = error?.message || 'Unknown error occurred'
  const errorCode = error?.code || 'UNKNOWN'
  
  logger.error(`Supabase error in ${context}`, error instanceof Error ? error : new Error(String(error)), {
    code: errorCode,
    context,
    timestamp: new Date().toISOString()
  })
  
  throw new Error(`${context}: ${errorMessage}`)
}

/**
 * Safe database operations wrapper
 */
export const createSafeDbOperations = (client: SupabaseClient<Database> | null) => {
  if (!client) {
    throw new Error('Supabase client not available')
  }
  
  // Use the client directly - Supabase will infer types from the database
  const typedClient = client

  return {
    // User operations
    users: {
      async getById(userId: string) {
        const { data, error } = await typedClient
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .single()
        
        if (error) handleSupabaseError(error, 'getUserById')
        return data
      },

      async create(user: UserProfileInsert) {
        const { data, error } = await typedClient
          .from('user_profiles')
          .insert(user)
          .select()
          .single()
        
        if (error) handleSupabaseError(error, 'createUser')
        return data
      },

      async update(userId: string, updates: UserProfileUpdate) {
        const { data, error } = await typedClient
          .from('user_profiles')
          .update(updates)
          .eq('user_id', userId)
          .select()
          .single()
        
        if (error) handleSupabaseError(error, 'updateUser')
        return data
      }
    },

    // Poll operations
    polls: {
      async getById(pollId: string) {
        const { data, error } = await typedClient
          .from('polls')
          .select('*')
          .eq('id', pollId)
          .single()
        
        if (error) handleSupabaseError(error, 'getPollById')
        return data
      },

      async create(poll: PollInsert) {
        const { data, error } = await typedClient
          .from('polls')
          .insert(poll)
          .select()
          .single()
        
        if (error) handleSupabaseError(error, 'createPoll')
        return data
      },

      async update(pollId: string, updates: PollUpdate) {
        const { data, error } = await typedClient
          .from('polls')
          .update(updates)
          .eq('id', pollId)
          .select()
          .single()
        
        if (error) handleSupabaseError(error, 'updatePoll')
        return data
      }
    },

    // Vote operations
    votes: {
      async getByPollId(pollId: string) {
        const { data, error } = await typedClient
          .from('votes')
          .select('*')
          .eq('poll_id', pollId)
        
        if (error) handleSupabaseError(error, 'getVotesByPollId')
        return data
      },

      async create(vote: VoteInsert) {
        const { data, error } = await typedClient
          .from('votes')
          .insert(vote)
          .select()
          .single()
        
        if (error) handleSupabaseError(error, 'createVote')
        return data
      }
    }
  }
}

// Export types for use in other modules
export type DatabaseTypes = Database
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Poll = Database['public']['Tables']['polls']['Row']
export type Vote = Database['public']['Tables']['votes']['Row']
