/**
 * SSR-Safe Supabase Configuration
 * 
 * This file provides a comprehensive solution for Supabase client usage
 * in Next.js SSR environments, handling the 'self is not defined' error
 * and providing proper client initialization for both client and server.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { logger } from './logger'

// Environment validation
const validateEnvironment = () => {
  const requiredVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY
  }

  const missing = Object.entries(requiredVars)
    .filter(([_, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }

  return requiredVars
}

// Database schema types for type safety
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          user_id: string
          username: string
          email: string
          trust_tier: 'T0' | 'T1' | 'T2' | 'T3'
          created_at: string
          updated_at: string
          avatar_url?: string
          bio?: string
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          username: string
          email: string
          trust_tier?: 'T0' | 'T1' | 'T2' | 'T3'
          created_at?: string
          updated_at?: string
          avatar_url?: string
          bio?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          username?: string
          email?: string
          trust_tier?: 'T0' | 'T1' | 'T2' | 'T3'
          created_at?: string
          updated_at?: string
          avatar_url?: string
          bio?: string
          is_active?: boolean
        }
      }
      polls: {
        Row: {
          id: string
          title: string
          description: string
          options: string[]
          voting_method: 'single' | 'approval' | 'ranked' | 'quadratic' | 'range'
          created_by: string
          created_at: string
          updated_at: string
          start_time: string
          end_time: string
          status: 'draft' | 'active' | 'closed' | 'archived'
          privacy_level: 'public' | 'private' | 'high-privacy'
          total_votes: number
          category?: string
          tags?: string[]
        }
        Insert: {
          id?: string
          title: string
          description: string
          options: string[]
          voting_method: 'single' | 'approval' | 'ranked' | 'quadratic' | 'range'
          created_by: string
          created_at?: string
          updated_at?: string
          start_time: string
          end_time: string
          status?: 'draft' | 'active' | 'closed' | 'archived'
          privacy_level?: 'public' | 'private' | 'high-privacy'
          total_votes?: number
          category?: string
          tags?: string[]
        }
        Update: {
          id?: string
          title?: string
          description?: string
          options?: string[]
          voting_method?: 'single' | 'approval' | 'ranked' | 'quadratic' | 'range'
          created_by?: string
          created_at?: string
          updated_at?: string
          start_time?: string
          end_time?: string
          status?: 'draft' | 'active' | 'closed' | 'archived'
          privacy_level?: 'public' | 'private' | 'high-privacy'
          total_votes?: number
          category?: string
          tags?: string[]
        }
      }
      votes: {
        Row: {
          id: string
          poll_id: string
          user_id: string
          selected_options: string[]
          created_at: string
          updated_at: string
          ip_address?: string
          user_agent?: string
        }
        Insert: {
          id?: string
          poll_id: string
          user_id: string
          selected_options: string[]
          created_at?: string
          updated_at?: string
          ip_address?: string
          user_agent?: string
        }
        Update: {
          id?: string
          poll_id?: string
          user_id?: string
          selected_options?: string[]
          created_at?: string
          updated_at?: string
          ip_address?: string
          user_agent?: string
        }
      }
      error_logs: {
        Row: {
          id: string
          user_id?: string
          error_type: string
          error_message: string
          stack_trace?: string
          context?: any
          created_at: string
          severity: 'low' | 'medium' | 'high' | 'critical'
        }
        Insert: {
          id?: string
          user_id?: string
          error_type: string
          error_message: string
          stack_trace?: string
          context?: any
          created_at?: string
          severity?: 'low' | 'medium' | 'high' | 'critical'
        }
        Update: {
          id?: string
          user_id?: string
          error_type?: string
          error_message?: string
          stack_trace?: string
          context?: any
          created_at?: string
          severity?: 'low' | 'medium' | 'high' | 'critical'
        }
      }
    }
  }
}

/**
 * Create SSR-safe browser client
 * Uses @supabase/ssr for proper browser-side initialization
 */
export const createBrowserClientSafe = (): SupabaseClient<Database> | null => {
  try {
    const env = validateEnvironment()
    
    return createBrowserClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL!,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
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
  try {
    const env = validateEnvironment()
    
    return createServerClient<Database>(
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
    )
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
      env.SUPABASE_SERVICE_ROLE_KEY!,
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
  if (typeof window !== 'undefined') {
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

  return {
    // User operations
    users: {
      async getById(userId: string) {
        const { data, error } = await client
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .single()
        
        if (error) handleSupabaseError(error, 'getUserById')
        return data
      },

      async create(user: Database['public']['Tables']['user_profiles']['Insert']) {
        const { data, error } = await client
          .from('user_profiles')
          .insert(user)
          .select()
          .single()
        
        if (error) handleSupabaseError(error, 'createUser')
        return data
      },

      async update(userId: string, updates: Database['public']['Tables']['user_profiles']['Update']) {
        const { data, error } = await client
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
        const { data, error } = await client
          .from('polls')
          .select('*')
          .eq('id', pollId)
          .single()
        
        if (error) handleSupabaseError(error, 'getPollById')
        return data
      },

      async create(poll: Database['public']['Tables']['polls']['Insert']) {
        const { data, error } = await client
          .from('polls')
          .insert(poll)
          .select()
          .single()
        
        if (error) handleSupabaseError(error, 'createPoll')
        return data
      },

      async update(pollId: string, updates: Database['public']['Tables']['polls']['Update']) {
        const { data, error } = await client
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
        const { data, error } = await client
          .from('votes')
          .select('*')
          .eq('poll_id', pollId)
        
        if (error) handleSupabaseError(error, 'getVotesByPollId')
        return data
      },

      async create(vote: Database['public']['Tables']['votes']['Insert']) {
        const { data, error } = await client
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
