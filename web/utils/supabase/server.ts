import 'server-only';                  // build-time guard
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'

// Database schema types for type safety
export type Database = {
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
          geo_lat?: number | null
          geo_lon?: number | null
          geo_precision?: 'exact' | 'approximate' | 'zip' | 'city' | 'state' | 'unknown' | null
          geo_updated_at?: string | null
          geo_source?: string | null
          geo_consent_version?: number | null
          geo_coarse_hash?: string | null
          geo_trust_gate?: 'all' | 'trusted_only' | null
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
          geo_lat?: number | null
          geo_lon?: number | null
          geo_precision?: 'exact' | 'approximate' | 'zip' | 'city' | 'state' | 'unknown' | null
          geo_updated_at?: string | null
          geo_source?: string | null
          geo_consent_version?: number | null
          geo_coarse_hash?: string | null
          geo_trust_gate?: 'all' | 'trusted_only' | null
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
          geo_lat?: number | null
          geo_lon?: number | null
          geo_precision?: 'exact' | 'approximate' | 'zip' | 'city' | 'state' | 'unknown' | null
          geo_updated_at?: string | null
          geo_source?: string | null
          geo_consent_version?: number | null
          geo_coarse_hash?: string | null
          geo_trust_gate?: 'all' | 'trusted_only' | null
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
          vote_data: Record<string, unknown> // JSON data for complex voting methods
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
          vote_data?: Record<string, unknown>
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
          vote_data?: Record<string, unknown>
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
          metadata: Record<string, unknown>
        }
        Insert: {
          id?: string
          action: string
          user_id_hash: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
        Update: {
          id?: string
          action?: string
          user_id_hash?: string
          created_at?: string
          metadata?: Record<string, unknown>
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
      civic_jurisdictions: {
        Row: {
          ocd_division_id: string
          name: string
          level: string
          jurisdiction_type?: string | null
          parent_ocd_id?: string | null
          country_code?: string | null
          state_code?: string | null
          county_name?: string | null
          city_name?: string | null
          geo_scope?: string | null
          centroid_lat?: number | null
          centroid_lon?: number | null
          bounding_box?: Record<string, unknown> | null
          population?: number | null
          source: string
          last_refreshed: string
          metadata: Record<string, unknown>
        }
        Insert: {
          ocd_division_id: string
          name: string
          level: string
          jurisdiction_type?: string | null
          parent_ocd_id?: string | null
          country_code?: string | null
          state_code?: string | null
          county_name?: string | null
          city_name?: string | null
          geo_scope?: string | null
          centroid_lat?: number | null
          centroid_lon?: number | null
          bounding_box?: Record<string, unknown> | null
          population?: number | null
          source?: string
          last_refreshed?: string
          metadata?: Record<string, unknown>
        }
        Update: {
          ocd_division_id?: string
          name?: string
          level?: string
          jurisdiction_type?: string | null
          parent_ocd_id?: string | null
          country_code?: string | null
          state_code?: string | null
          county_name?: string | null
          city_name?: string | null
          geo_scope?: string | null
          centroid_lat?: number | null
          centroid_lon?: number | null
          bounding_box?: Record<string, unknown> | null
          population?: number | null
          source?: string
          last_refreshed?: string
          metadata?: Record<string, unknown>
        }
      }
      jurisdiction_aliases: {
        Row: {
          id: string
          alias_type: 'zip' | 'place' | 'district' | 'legacy' | 'custom'
          alias_value: string
          normalized_value?: string | null
          ocd_division_id: string
          confidence: number | null
          source: string
          last_refreshed: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id?: string
          alias_type: 'zip' | 'place' | 'district' | 'legacy' | 'custom'
          alias_value: string
          normalized_value?: string | null
          ocd_division_id: string
          confidence?: number | null
          source?: string
          last_refreshed?: string
          metadata?: Record<string, unknown>
        }
        Update: {
          id?: string
          alias_type?: 'zip' | 'place' | 'district' | 'legacy' | 'custom'
          alias_value?: string
          normalized_value?: string | null
          ocd_division_id?: string
          confidence?: number | null
          source?: string
          last_refreshed?: string
          metadata?: Record<string, unknown>
        }
      }
      jurisdiction_geometries: {
        Row: {
          ocd_division_id: string
          geometry: Record<string, unknown>
          geometry_format: string
          simplified_geometry?: Record<string, unknown> | null
          area_sq_km?: number | null
          perimeter_km?: number | null
          source: string
          last_refreshed: string
          metadata: Record<string, unknown>
        }
        Insert: {
          ocd_division_id: string
          geometry: Record<string, unknown>
          geometry_format?: string
          simplified_geometry?: Record<string, unknown> | null
          area_sq_km?: number | null
          perimeter_km?: number | null
          source: string
          last_refreshed?: string
          metadata?: Record<string, unknown>
        }
        Update: {
          ocd_division_id?: string
          geometry?: Record<string, unknown>
          geometry_format?: string
          simplified_geometry?: Record<string, unknown> | null
          area_sq_km?: number | null
          perimeter_km?: number | null
          source?: string
          last_refreshed?: string
          metadata?: Record<string, unknown>
        }
      }
      jurisdiction_tiles: {
        Row: {
          ocd_division_id: string
          h3_index: string
          resolution: number
          source: string
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          ocd_division_id: string
          h3_index: string
          resolution: number
          source?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
        Update: {
          ocd_division_id?: string
          h3_index?: string
          resolution?: number
          source?: string
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      candidate_jurisdictions: {
        Row: {
          id: string
          candidate_id: string
          ocd_division_id: string
          role: 'represents' | 'running_for' | 'former' | 'candidate'
          effective_from?: string | null
          effective_to?: string | null
          source: string
          metadata: Record<string, unknown>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          candidate_id: string
          ocd_division_id: string
          role: 'represents' | 'running_for' | 'former' | 'candidate'
          effective_from?: string | null
          effective_to?: string | null
          source: string
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          candidate_id?: string
          ocd_division_id?: string
          role?: 'represents' | 'running_for' | 'former' | 'candidate'
          effective_from?: string | null
          effective_to?: string | null
          source?: string
          metadata?: Record<string, unknown>
          created_at?: string
          updated_at?: string
        }
      }
      user_location_resolutions: {
        Row: {
          id: string
          user_id: string
          address_hash?: string | null
          resolved_ocd_id?: string | null
          lat_q11?: number | null
          lon_q11?: number | null
          accuracy_m?: number | null
          geo_precision: 'exact' | 'approximate' | 'zip' | 'city' | 'state' | 'unknown'
          source: 'browser' | 'manual' | 'import' | 'support'
          consent_version: number
          consent_scope?: string | null
          coarse_hash?: string | null
          captured_at: string
          expires_at?: string | null
          revoked_at?: string | null
          metadata: Record<string, unknown>
        }
        Insert: {
          id?: string
          user_id: string
          address_hash?: string | null
          resolved_ocd_id?: string | null
          lat_q11?: number | null
          lon_q11?: number | null
          accuracy_m?: number | null
          geo_precision: 'exact' | 'approximate' | 'zip' | 'city' | 'state' | 'unknown'
          source: 'browser' | 'manual' | 'import' | 'support'
          consent_version?: number
          consent_scope?: string | null
          coarse_hash?: string | null
          captured_at?: string
          expires_at?: string | null
          revoked_at?: string | null
          metadata?: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          address_hash?: string | null
          resolved_ocd_id?: string | null
          lat_q11?: number | null
          lon_q11?: number | null
          accuracy_m?: number | null
          geo_precision?: 'exact' | 'approximate' | 'zip' | 'city' | 'state' | 'unknown'
          source?: 'browser' | 'manual' | 'import' | 'support'
          consent_version?: number
          consent_scope?: string | null
          coarse_hash?: string | null
          captured_at?: string
          expires_at?: string | null
          revoked_at?: string | null
          metadata?: Record<string, unknown>
        }
      }
      location_consent_audit: {
        Row: {
          id: string
          user_id: string
          resolution_id?: string | null
          action: 'granted' | 'revoked' | 'deleted' | 'regranted'
          scope: string
          actor: 'user' | 'system' | 'admin'
          reason?: string | null
          created_at: string
          metadata: Record<string, unknown>
        }
        Insert: {
          id?: string
          user_id: string
          resolution_id?: string | null
          action: 'granted' | 'revoked' | 'deleted' | 'regranted'
          scope: string
          actor?: 'user' | 'system' | 'admin'
          reason?: string | null
          created_at?: string
          metadata?: Record<string, unknown>
        }
        Update: {
          id?: string
          user_id?: string
          resolution_id?: string | null
          action?: 'granted' | 'revoked' | 'deleted' | 'regranted'
          scope?: string
          actor?: 'user' | 'system' | 'admin'
          reason?: string | null
          created_at?: string
          metadata?: Record<string, unknown>
        }
      }
      error_logs: {
        Row: {
          id: string
          user_id?: string
          error_type: string
          error_message: string
          stack_trace?: string
          context?: Record<string, unknown>
          created_at: string
          severity: 'low' | 'medium' | 'high' | 'critical'
        }
        Insert: {
          id?: string
          user_id?: string
          error_type: string
          error_message: string
          stack_trace?: string
          context?: Record<string, unknown>
          created_at?: string
          severity?: 'low' | 'medium' | 'high' | 'critical'
        }
        Update: {
          id?: string
          user_id?: string
          error_type?: string
          error_message?: string
          stack_trace?: string
          context?: Record<string, unknown>
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
        Returns: Record<string, unknown>
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
  
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
export type CivicJurisdiction = Database['public']['Tables']['civic_jurisdictions']['Row']
export type JurisdictionAlias = Database['public']['Tables']['jurisdiction_aliases']['Row']
export type JurisdictionGeometry = Database['public']['Tables']['jurisdiction_geometries']['Row']
export type JurisdictionTile = Database['public']['Tables']['jurisdiction_tiles']['Row']
export type CandidateJurisdiction = Database['public']['Tables']['candidate_jurisdictions']['Row']
export type UserLocationResolution = Database['public']['Tables']['user_location_resolutions']['Row']
export type LocationConsentRecord = Database['public']['Tables']['location_consent_audit']['Row']
export type DemographicAnalytics = Database['public']['Views']['demographic_analytics']['Row']
