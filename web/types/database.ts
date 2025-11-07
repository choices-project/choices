/**
 * Database Types - Single Source of Truth
 *
 * Re-exports the generated Supabase database types for convenience.
 *
 * **CANONICAL LOCATION**: `@/types/supabase.ts` (Supabase-generated)
 *
 * To regenerate:
 *   npx supabase gen types typescript --project-id muqwrehywjrbaeerjgfb > types/supabase.ts
 *
 * Created: January 26, 2025
 * Updated: November 5, 2025 - Consolidated to types/supabase.ts
 */

// ============================================================================
// SUPABASE-GENERATED TYPES (Source of Truth)
// ============================================================================

import type { Database } from '@/types/supabase'

export * from '@/types/supabase'
export type {
  Database,
  Json,
  Tables,
  TablesInsert,
  TablesUpdate,
  Enums
} from '@/types/supabase'

// Helper utilities to protect against environment-specific tables being absent
 type PublicTables = Database['public']['Tables']
 type PublicTableName = keyof PublicTables
 type TableRow<Name extends string> = Name extends PublicTableName
   ? PublicTables[Name]['Row']
   : never
 type TableInsert<Name extends string> = Name extends PublicTableName
   ? PublicTables[Name]['Insert']
   : never
 type TableUpdate<Name extends string> = Name extends PublicTableName
   ? PublicTables[Name]['Update']
   : never

// Core Tables
export type UserProfile = TableRow<'user_profiles'>
export type Poll = TableRow<'polls'>
export type PollOption = TableRow<'poll_options'>
export type Vote = TableRow<'votes'>
export type CivicAction = TableRow<'civic_actions'>
export type Hashtag = TableRow<'hashtags'>
export type SiteMessage = TableRow<'site_messages'>
export type RepresentativeCore = TableRow<'representatives_core'>
export type CandidatePlatform = TableRow<'candidate_platforms'>
export type Feedback = TableRow<'feedback'>
export type WebAuthnCredential = TableRow<'webauthn_credentials'>
export type AnalyticsEvent = TableRow<'analytics_events'>

// New Tables (Added November 3, 2025 - Migrations Applied)
export type PollParticipationAnalytics = TableRow<'poll_participation_analytics'>
export type PerformanceMetrics = TableRow<'performance_metrics'>
export type QueryPerformanceLog = TableRow<'query_performance_log'>
export type CachePerformanceLog = TableRow<'cache_performance_log'>

// Insert Types
export type UserProfileInsert = TableInsert<'user_profiles'>
export type PollInsert = TableInsert<'polls'>
export type VoteInsert = TableInsert<'votes'>
export type CivicActionInsert = TableInsert<'civic_actions'>
export type PollParticipationAnalyticsInsert = TableInsert<'poll_participation_analytics'>

// Update Types
export type UserProfileUpdate = TableUpdate<'user_profiles'>
export type PollUpdate = TableUpdate<'polls'>
export type VoteUpdate = TableUpdate<'votes'>
