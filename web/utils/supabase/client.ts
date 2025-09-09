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
      // Privacy-first tables
      user_consent: {
        Row: {
          id: string
          user_id: string
          consent_type: 'analytics' | 'demographics' | 'behavioral' | 'contact' | 'research' | 'marketing'
          granted: boolean
          granted_at: string
          revoked_at?: string
          consent_version: number
          purpose: string
          data_types: string[]
        }
        Insert: {
          id?: string
          user_id: string
          consent_type: 'analytics' | 'demographics' | 'behavioral' | 'contact' | 'research' | 'marketing'
          granted: boolean
          granted_at?: string
          revoked_at?: string
          consent_version?: number
          purpose: string
          data_types?: string[]
        }
        Update: {
          id?: string
          user_id?: string
          consent_type?: 'analytics' | 'demographics' | 'behavioral' | 'contact' | 'research' | 'marketing'
          granted?: boolean
          granted_at?: string
          revoked_at?: string
          consent_version?: number
          purpose?: string
          data_types?: string[]
        }
      }
      privacy_logs: {
        Row: {
          id: string
          action: string
          user_id_hash: string
          created_at: string
          metadata: any
        }
        Insert: {
          id?: string
          action: string
          user_id_hash: string
          created_at?: string
          metadata?: any
        }
        Update: {
          id?: string
          action?: string
          user_id_hash?: string
          created_at?: string
          metadata?: any
        }
      }
      user_profiles_encrypted: {
        Row: {
          id: string
          user_id: string
          username?: string
          public_bio?: string
          created_at: string
          updated_at: string
          encrypted_demographics?: string
          encrypted_preferences?: string
          encrypted_contact_info?: string
          encryption_version: number
          key_derivation_salt?: string
          key_hash?: string
        }
        Insert: {
          id?: string
          user_id: string
          username?: string
          public_bio?: string
          created_at?: string
          updated_at?: string
          encrypted_demographics?: string
          encrypted_preferences?: string
          encrypted_contact_info?: string
          encryption_version?: number
          key_derivation_salt?: string
          key_hash?: string
        }
        Update: {
          id?: string
          user_id?: string
          username?: string
          public_bio?: string
          created_at?: string
          updated_at?: string
          encrypted_demographics?: string
          encrypted_preferences?: string
          encrypted_contact_info?: string
          encryption_version?: number
          key_derivation_salt?: string
          key_hash?: string
        }
      }
      private_user_data: {
        Row: {
          id: string
          user_id: string
          encrypted_personal_info?: string
          encrypted_behavioral_data?: string
          encrypted_analytics_data?: string
          encryption_key_hash?: string
          last_encrypted_at: string
        }
        Insert: {
          id?: string
          user_id: string
          encrypted_personal_info?: string
          encrypted_behavioral_data?: string
          encrypted_analytics_data?: string
          encryption_key_hash?: string
          last_encrypted_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          encrypted_personal_info?: string
          encrypted_behavioral_data?: string
          encrypted_analytics_data?: string
          encryption_key_hash?: string
          last_encrypted_at?: string
        }
      }
      analytics_contributions: {
        Row: {
          id: string
          poll_id: string
          user_id: string
          age_bucket?: string
          region_bucket?: string
          education_bucket?: string
          vote_choice?: number
          participation_time?: string
          consent_granted: boolean
          created_at: string
        }
        Insert: {
          id?: string
          poll_id: string
          user_id: string
          age_bucket?: string
          region_bucket?: string
          education_bucket?: string
          vote_choice?: number
          participation_time?: string
          consent_granted?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          poll_id?: string
          user_id?: string
          age_bucket?: string
          region_bucket?: string
          education_bucket?: string
          vote_choice?: number
          participation_time?: string
          consent_granted?: boolean
          created_at?: string
        }
      }
      // webauthn_credentials: Removed - not ready for production
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
      demographic_analytics: {
        Row: {
          poll_id: string
          age_bucket: string
          region_bucket: string
          education_bucket: string
          participant_count: number
          average_choice: number
          choice_variance: number
          first_contribution: string
          last_contribution: string
        }
      }
    }
    Functions: {
      anonymize_user_data: {
        Args: {
          target_user_id: string
        }
        Returns: void
      }
      export_user_data: {
        Args: {
          target_user_id: string
        }
        Returns: any
      }
      contribute_to_analytics: {
        Args: {
          target_poll_id: string
          target_age_bucket: string
          target_region_bucket: string
          target_education_bucket: string
          target_vote_choice: number
          target_participation_time: string
        }
        Returns: boolean
      }
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
export type UserConsent = Database['public']['Tables']['user_consent']['Row']
export type PrivacyLog = Database['public']['Tables']['privacy_logs']['Row']
export type UserProfileEncrypted = Database['public']['Tables']['user_profiles_encrypted']['Row']
export type PrivateUserData = Database['public']['Tables']['private_user_data']['Row']
export type AnalyticsContribution = Database['public']['Tables']['analytics_contributions']['Row']
export type DemographicAnalytics = Database['public']['Views']['demographic_analytics']['Row']
// export type WebAuthnCredential = Database['public']['Tables']['webauthn_credentials']['Row'] // Removed - not ready
