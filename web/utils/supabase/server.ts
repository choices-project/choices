import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

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
      ia_users: {
        Row: {
          id: string
          stable_id: string
          email: string
          verification_tier: string
          is_active: boolean
          created_at: string
          updated_at: string
          display_name?: string
          avatar_url?: string
          bio?: string
          password_hash?: string
        }
        Insert: {
          id?: string
          stable_id: string
          email: string
          verification_tier?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          display_name?: string
          avatar_url?: string
          bio?: string
          password_hash?: string
        }
        Update: {
          id?: string
          stable_id?: string
          email?: string
          verification_tier?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          display_name?: string
          avatar_url?: string
          bio?: string
          password_hash?: string
        }
      }
      poll_contexts: {
        Row: {
          id: string
          story_id: string
          question: string
          context: any
          why_important: string
          stakeholders: any
          options: any
          voting_method: string
          estimated_controversy: number
          time_to_live: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          story_id: string
          question: string
          context?: any
          why_important: string
          stakeholders?: any
          options?: any
          voting_method: string
          estimated_controversy?: number
          time_to_live?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          question?: string
          context?: any
          why_important?: string
          stakeholders?: any
          options?: any
          voting_method?: string
          estimated_controversy?: number
          time_to_live?: number
          status?: string
          created_at?: string
          updated_at?: string
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

/**
 * SSR-safe factory. No top-level import of supabase-js or ssr.
 * We dynamically import only at call time in Node.
 */
export async function getSupabaseServerClient() {
  const env = validateEnvironment()
  const cookieStore = await cookies()
  const { createServerClient } = await import('@supabase/ssr') // dynamic!
  
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: (name: string, value: string, options: any) => {
          try {
            cookieStore.set(name, value, options)
          } catch (error) {
            // Ignore errors in RSC context
          }
        },
        remove: (name: string, options: any) => {
          try {
            cookieStore.delete(name)
          } catch (error) {
            // Ignore errors in RSC context
          }
        },
      },
    },
  )
}

// Export types for use in other modules
export type DatabaseTypes = Database
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Poll = Database['public']['Tables']['polls']['Row']
export type Vote = Database['public']['Tables']['votes']['Row']
export type WebAuthnCredential = Database['public']['Tables']['webauthn_credentials']['Row']
