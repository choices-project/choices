/**
 * Shared Database Types
 * 
 * Database type definitions for shared/core tables used across features.
 * This follows the existing shared type architecture.
 * 
 * Created: October 19, 2025
 * Status: ✅ ACTIVE
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface CoreDatabase {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          user_id: string
          username: string
          email: string
          display_name: string | null
          bio: string | null
          avatar_url: string | null
          is_active: boolean | null
          is_admin: boolean | null
          is_verified: boolean | null
          onboarding_completed: boolean | null
          preferences: Json | null
          created_at: string | null
          updated_at: string | null
          last_active_at: string | null
          demographics: Json | null
          location_data: Json | null
          privacy_settings: Json | null
          community_focus: string[] | null
          followed_hashtags: string[] | null
          primary_hashtags: string[] | null
          primary_concerns: string[] | null
          participation_style: string | null
          geo_lat: number | null
          geo_lon: number | null
          geo_precision: string | null
          geo_source: string | null
          geo_trust_gate: string | null
          geo_coarse_hash: string | null
          geo_consent_version: number | null
          geo_updated_at: string | null
          hashtag_preferences: Json | null
          onboarding_data: Json | null
          last_modified_by: string | null
          modification_reason: string | null
        }
        Insert: {
          id?: string
          user_id: string
          username: string
          email: string
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          is_active?: boolean | null
          is_admin?: boolean | null
          is_verified?: boolean | null
          onboarding_completed?: boolean | null
          preferences?: Json | null
          created_at?: string | null
          updated_at?: string | null
          last_active_at?: string | null
          demographics?: Json | null
          location_data?: Json | null
          privacy_settings?: Json | null
          community_focus?: string[] | null
          followed_hashtags?: string[] | null
          primary_hashtags?: string[] | null
          primary_concerns?: string[] | null
          participation_style?: string | null
          geo_lat?: number | null
          geo_lon?: number | null
          geo_precision?: string | null
          geo_source?: string | null
          geo_trust_gate?: string | null
          geo_coarse_hash?: string | null
          geo_consent_version?: number | null
          geo_updated_at?: string | null
          hashtag_preferences?: Json | null
          onboarding_data?: Json | null
          last_modified_by?: string | null
          modification_reason?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          username?: string
          email?: string
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          is_active?: boolean | null
          is_admin?: boolean | null
          is_verified?: boolean | null
          onboarding_completed?: boolean | null
          preferences?: Json | null
          created_at?: string | null
          updated_at?: string | null
          last_active_at?: string | null
          demographics?: Json | null
          location_data?: Json | null
          privacy_settings?: Json | null
          community_focus?: string[] | null
          followed_hashtags?: string[] | null
          primary_hashtags?: string[] | null
          primary_concerns?: string[] | null
          participation_style?: string | null
          geo_lat?: number | null
          geo_lon?: number | null
          geo_precision?: string | null
          geo_source?: string | null
          geo_trust_gate?: string | null
          geo_coarse_hash?: string | null
          geo_consent_version?: number | null
          geo_updated_at?: string | null
          hashtag_preferences?: Json | null
          onboarding_data?: Json | null
          last_modified_by?: string | null
          modification_reason?: string | null
        }
      }
      
      analytics_events: {
        Row: {
          id: string
          user_id: string | null
          event_type: string
          event_data: Json | null
          created_at: string | null
          session_id: string | null
          ip_address: string | null
          user_agent: string | null
          referrer: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          event_type: string
          event_data?: Json | null
          created_at?: string | null
          session_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          event_type?: string
          event_data?: Json | null
          created_at?: string | null
          session_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
        }
      }
      
      privacy_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          details: Json | null
          created_at: string | null
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          details?: Json | null
          created_at?: string | null
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          details?: Json | null
          created_at?: string | null
          ip_address?: string | null
          user_agent?: string | null
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Re-export specific table types for convenience
export type UserProfile = CoreDatabase['public']['Tables']['user_profiles']['Row']
export type UserProfileInsert = CoreDatabase['public']['Tables']['user_profiles']['Insert']
export type UserProfileUpdate = CoreDatabase['public']['Tables']['user_profiles']['Update']

export type AnalyticsEvent = CoreDatabase['public']['Tables']['analytics_events']['Row']
export type AnalyticsEventInsert = CoreDatabase['public']['Tables']['analytics_events']['Insert']
export type AnalyticsEventUpdate = CoreDatabase['public']['Tables']['analytics_events']['Update']

export type PrivacyLog = CoreDatabase['public']['Tables']['privacy_logs']['Row']
export type PrivacyLogInsert = CoreDatabase['public']['Tables']['privacy_logs']['Insert']
export type PrivacyLogUpdate = CoreDatabase['public']['Tables']['privacy_logs']['Update']