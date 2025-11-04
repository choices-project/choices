/**
 * Database Types - Single Source of Truth
 * 
 * Re-exports the generated Supabase database types for convenience.
 * The source of truth is `@/utils/supabase/database.types.ts` (Supabase-generated).
 * 
 * DO NOT manually edit database.types.ts - it's regenerated from schema.
 * To regenerate: supabase gen types typescript --linked > utils/supabase/database.types.ts
 * 
 * Created: January 26, 2025
 * Updated: November 3, 2025 - Added poll_participation_analytics, performance tables
 */

// ============================================================================
// SUPABASE-GENERATED TYPES (Source of Truth)
// ============================================================================

// ============================================================================
// CONVENIENT TYPE ALIASES (Re-export from Database)
// ============================================================================

import type { Database } from '@/utils/supabase/database.types'

export * from '@/utils/supabase/database.types'
export type { 
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums
} from '@/utils/supabase/database.types'

// Core Tables
export type UserProfile = Database['public']['Tables']['user_profiles']['Row']
export type Poll = Database['public']['Tables']['polls']['Row']
export type PollOption = Database['public']['Tables']['poll_options']['Row']
export type Vote = Database['public']['Tables']['votes']['Row']
export type CivicAction = Database['public']['Tables']['civic_actions']['Row']
export type Hashtag = Database['public']['Tables']['hashtags']['Row']
export type SiteMessage = Database['public']['Tables']['site_messages']['Row']
export type RepresentativeCore = Database['public']['Tables']['representatives_core']['Row']
export type CandidatePlatform = Database['public']['Tables']['candidate_platforms']['Row']
export type Feedback = Database['public']['Tables']['feedback']['Row']
export type WebAuthnCredential = Database['public']['Tables']['webauthn_credentials']['Row']
export type AnalyticsEvent = Database['public']['Tables']['analytics_events']['Row']

// New Tables (Added November 3, 2025 - Migrations Applied)
export type PollParticipationAnalytics = Database['public']['Tables']['poll_participation_analytics']['Row']
export type PerformanceMetrics = Database['public']['Tables']['performance_metrics']['Row']
export type QueryPerformanceLog = Database['public']['Tables']['query_performance_log']['Row']
export type CachePerformanceLog = Database['public']['Tables']['cache_performance_log']['Row']

// Insert Types
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert']
export type PollInsert = Database['public']['Tables']['polls']['Insert']
export type VoteInsert = Database['public']['Tables']['votes']['Insert']
export type CivicActionInsert = Database['public']['Tables']['civic_actions']['Insert']
export type PollParticipationAnalyticsInsert = Database['public']['Tables']['poll_participation_analytics']['Insert']

// Update Types
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update']
export type PollUpdate = Database['public']['Tables']['polls']['Update']
export type VoteUpdate = Database['public']['Tables']['votes']['Update']
