'use client'
import type { SupabaseClient } from '@supabase/supabase-js'

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

let client: SupabaseClient<Database> | undefined

export function getSupabaseBrowserClient(): SupabaseClient<Database> {
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
    const { createBrowserClient } = require('@supabase/ssr')
    client = createBrowserClient(
      supabaseUrl,
      supabaseKey,
    ) as SupabaseClient<Database>
  }
  return client
}

// Export types for use in other modules
export type DatabaseTypes = Database
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Poll = Database['public']['Tables']['polls']['Row']
export type Vote = Database['public']['Tables']['votes']['Row']
export type WebAuthnCredential = Database['public']['Tables']['webauthn_credentials']['Row']
