/**
 * Server-side Supabase Configuration
 * 
 * This file provides a server-side only Supabase client that avoids
 * browser-specific features that cause SSR issues.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { logger } from './logger'

// Environment validation
const validateEnvironment = () => {
  const requiredVars = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
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

// Database schema types (simplified for server-side)
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

// Create server-side Supabase client
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

// Server-side client instance
export const supabaseServer = createServerSideClient()

// Error handling wrapper
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
