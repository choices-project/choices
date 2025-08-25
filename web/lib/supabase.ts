/**
 * Supabase Configuration
 * 
 * Implements proper Supabase client configuration with:
 * - Type-safe database schema
 * - Proper error handling
 * - Connection pooling
 * - Security best practices
 * - Performance optimization
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
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
          choice: number
          created_at: string
          updated_at: string
          verification_token?: string
          is_verified: boolean
          voting_method: 'single' | 'approval' | 'ranked' | 'quadratic' | 'range'
          vote_data: any // JSON data for complex voting methods
        }
        Insert: {
          id?: string
          poll_id: string
          user_id: string
          choice: number
          created_at?: string
          updated_at?: string
          verification_token?: string
          is_verified?: boolean
          voting_method: 'single' | 'approval' | 'ranked' | 'quadratic' | 'range'
          vote_data?: any
        }
        Update: {
          id?: string
          poll_id?: string
          user_id?: string
          choice?: number
          created_at?: string
          updated_at?: string
          verification_token?: string
          is_verified?: boolean
          voting_method?: 'single' | 'approval' | 'ranked' | 'quadratic' | 'range'
          vote_data?: any
        }
      }
      webauthn_credentials: {
        Row: {
          id: string
          user_id: string
          credential_id: string
          public_key: string
          sign_count: number
          created_at: string
          last_used_at?: string
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          credential_id: string
          public_key: string
          sign_count?: number
          created_at?: string
          last_used_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          credential_id?: string
          public_key?: string
          sign_count?: number
          created_at?: string
          last_used_at?: string
          is_active?: boolean
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
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Create client-side Supabase client (for browser)
export const createClientSideClient = (): SupabaseClient<Database> => {
  const env = validateEnvironment()
  
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL!, env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'choices-platform-client'
      }
    }
  })
}

// Create server-side Supabase client (for API routes)
export const createServerSideClient = (): SupabaseClient<Database> => {
  const env = validateEnvironment()
  
  return createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL!, env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'choices-platform-server'
      }
    }
  })
}

// Default client instances
export const supabase = createClientSideClient()
export const supabaseAdmin = createServerSideClient()

// Error handling wrapper
export const handleSupabaseError = (error: any, context: string): never => {
  const errorMessage = error?.message || 'Unknown error occurred'
  const errorCode = error?.code || 'UNKNOWN'
  
  logger.error(`Supabase error in ${context}`, error, {
    code: errorCode,
    context,
    timestamp: new Date().toISOString()
  })
  
  throw new Error(`${context}: ${errorMessage}`)
}

// Type-safe database operations
export const db = {
  // User operations
  users: {
    async getById(userId: string) {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error) handleSupabaseError(error, 'getUserById')
      return data
    },

    async create(user: Database['public']['Tables']['user_profiles']['Insert']) {
      const { data, error } = await supabase
        .from('user_profiles')
        .insert(user)
        .select()
        .single()
      
      if (error) handleSupabaseError(error, 'createUser')
      return data
    },

    async update(userId: string, updates: Database['public']['Tables']['user_profiles']['Update']) {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single()
      
      if (error) handleSupabaseError(error, 'updateUser')
      return data
    },

    async delete(userId: string) {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', userId)
      
      if (error) handleSupabaseError(error, 'deleteUser')
    }
  },

  // Poll operations
  polls: {
    async getAll(limit = 50, offset = 0) {
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)
      
      if (error) handleSupabaseError(error, 'getAllPolls')
      return data
    },

    async getById(pollId: string) {
      const { data, error } = await supabase
        .from('polls')
        .select('*')
        .eq('id', pollId)
        .single()
      
      if (error) handleSupabaseError(error, 'getPollById')
      return data
    },

    async create(poll: Database['public']['Tables']['polls']['Insert']) {
      const { data, error } = await supabase
        .from('polls')
        .insert(poll)
        .select()
        .single()
      
      if (error) handleSupabaseError(error, 'createPoll')
      return data
    },

    async update(pollId: string, updates: Database['public']['Tables']['polls']['Update']) {
      const { data, error } = await supabase
        .from('polls')
        .update(updates)
        .eq('id', pollId)
        .select()
        .single()
      
      if (error) handleSupabaseError(error, 'updatePoll')
      return data
    },

    async delete(pollId: string) {
      const { error } = await supabase
        .from('polls')
        .delete()
        .eq('id', pollId)
      
      if (error) handleSupabaseError(error, 'deletePoll')
    }
  },

  // Vote operations
  votes: {
    async getByPollId(pollId: string) {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('poll_id', pollId)
      
      if (error) handleSupabaseError(error, 'getVotesByPollId')
      return data
    },

    async getByUserId(userId: string) {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('user_id', userId)
      
      if (error) handleSupabaseError(error, 'getVotesByUserId')
      return data
    },

    async create(vote: Database['public']['Tables']['votes']['Insert']) {
      const { data, error } = await supabase
        .from('votes')
        .insert(vote)
        .select()
        .single()
      
      if (error) handleSupabaseError(error, 'createVote')
      return data
    },

    async update(voteId: string, updates: Database['public']['Tables']['votes']['Update']) {
      const { data, error } = await supabase
        .from('votes')
        .update(updates)
        .eq('id', voteId)
        .select()
        .single()
      
      if (error) handleSupabaseError(error, 'updateVote')
      return data
    }
  },

  // WebAuthn operations
  webauthn: {
    async getCredentialsByUserId(userId: string) {
      const { data, error } = await supabase
        .from('webauthn_credentials')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
      
      if (error) handleSupabaseError(error, 'getWebAuthnCredentials')
      return data
    },

    async createCredential(credential: Database['public']['Tables']['webauthn_credentials']['Insert']) {
      const { data, error } = await supabase
        .from('webauthn_credentials')
        .insert(credential)
        .select()
        .single()
      
      if (error) handleSupabaseError(error, 'createWebAuthnCredential')
      return data
    },

    async updateCredential(credentialId: string, updates: Database['public']['Tables']['webauthn_credentials']['Update']) {
      const { data, error } = await supabase
        .from('webauthn_credentials')
        .update(updates)
        .eq('id', credentialId)
        .select()
        .single()
      
      if (error) handleSupabaseError(error, 'updateWebAuthnCredential')
      return data
    }
  },

  // Error logging
  errors: {
    async log(error: Database['public']['Tables']['error_logs']['Insert']) {
      const { error: dbError } = await supabase
        .from('error_logs')
        .insert(error)
      
      if (dbError) {
        // Fallback to console if database logging fails
        console.error('Failed to log error to database:', dbError)
        console.error('Original error:', error)
      }
    }
  }
}

// Export types for use in other modules
export type DatabaseTypes = Database
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Poll = Database['public']['Tables']['polls']['Row']
export type Vote = Database['public']['Tables']['votes']['Row']
export type WebAuthnCredential = Database['public']['Tables']['webauthn_credentials']['Row']
