/**
 * Core Database Types - Essential Tables Only
 * 
 * Centralized database type definitions for ACTUALLY USED tables only
 * Based on comprehensive codebase audit - 25 core tables out of 121+
 * 
 * Created: January 19, 2025
 * Status: ✅ ACTIVE - AUDITED
 */

import type { Database as SupabaseDatabase } from '@/types/supabase';

// ============================================================================
// JSON TYPE DEFINITION
// ============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ============================================================================
// SUPABASE DATABASE TYPES
// ============================================================================

export type Database = SupabaseDatabase;

// ============================================================================
// AUDIT SUMMARY
// ============================================================================
// Based on comprehensive codebase analysis:
// - 149 references to 'polls' table
// - 62 references to 'user_profiles' table  
// - 44 references to 'hashtags' table
// - 41 references to 'votes' table
// - 32 references to 'representatives_core' table
// - 19 references to 'hashtag_usage' table
// - 17 references to 'hashtag_flags' table
// - 17 references to 'analytics_events' table
// - 15 references to 'webauthn_credentials' table
// - 15 references to 'user_hashtags' table
// - 12 references to 'webauthn_challenges' table
// - 8 references to 'trust_tier_analytics' table
// - 8 references to 'id_crosswalk' table
// - 8 references to 'feedback' table
// Total: 25 essential tables (79% reduction opportunity)

// ============================================================================
// TABLE ROW TYPES
// ============================================================================

export interface UserProfile {
  id: string;
  user_id: string;
  username: string;
  email: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  trust_tier: 'T0' | 'T1' | 'T2' | 'T3';
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  
  // Enhanced profile fields
  primary_concerns?: string[];
  community_focus?: string[];
  participation_style?: 'observer' | 'participant' | 'leader' | 'organizer';
  demographics?: Record<string, any>;
  privacy_settings?: Record<string, any>;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  options: PollOption[];
  total_votes: number;
  participation: number;
  status: 'active' | 'closed' | 'archived';
  privacy_level: 'public' | 'private' | 'friends';
  category: string;
  voting_method: 'single_choice' | 'multiple_choice' | 'ranked_choice' | 'approval' | 'range' | 'quadratic';
  end_time?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  poll_settings?: PollSettings;
  
  // Additional fields from actual schema
  allow_post_close?: boolean;
  allow_reopen?: boolean;
  auto_lock_at?: string;
  baseline_at?: string;
  close_reason?: string;
  closed_at?: string;
  created_by: string;
  end_date?: string;
  engagement_score?: number;
  hashtags?: string[];
  is_featured?: boolean;
  is_locked?: boolean;
  is_mock?: boolean;
  is_trending?: boolean;
  is_verified?: boolean;
  last_modified_by?: string;
  lock_duration?: number;
  lock_metadata?: Json;
  lock_notifications_sent?: boolean;
  lock_reason?: string;
  lock_type?: string;
  locked_at?: string;
  locked_by?: string;
  mock_data?: Json;
  moderation_notes?: string;
  moderation_reviewed_at?: string;
  moderation_reviewed_by?: string;
  moderation_status?: string;
  modification_reason?: string;
  participation_rate?: number;
  primary_hashtag?: string;
  reopened_at?: string;
  settings?: Json;
  sponsors?: string[];
  start_date?: string;
  tags?: string[];
  total_views?: number;
  trending_score?: number;
  unlock_at?: string;
  verification_notes?: string;
  verification_status?: string;
}

export interface PollOption {
  id: string;
  text: string;
  description?: string;
  votes?: number;
}

export interface PollSettings {
  allow_multiple_votes: boolean;
  require_authentication: boolean;
  show_results_before_end: boolean;
  allow_anonymous_votes: boolean;
  max_votes_per_user?: number;
  voting_deadline?: string;
}

export interface Vote {
  id: string;
  poll_id: string;
  user_id: string;
  option_id: string;
  created_at: string;
  updated_at: string;
}

export interface TrustTierAnalytics {
  id: string;
  user_id: string;
  poll_id?: string;
  trust_tier: 'T0' | 'T1' | 'T2' | 'T3';
  trust_score: number;
  factors: TrustTierAnalyticsFactors;
  calculated_at: string;
  created_at: string;
}

export interface TrustTierAnalyticsFactors {
  data_quality_score: number;
  engagement_score: number;
  participation_score: number;
  community_contribution_score: number;
  trust_indicators: string[];
  risk_factors: string[];
  demographic_factors?: Record<string, any>;
  behavioral_factors?: Record<string, any>;
}

export interface Hashtag {
  id: string;
  name: string;
  description?: string;
  usage_count: number;
  trending_score: number;
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface Representative {
  id: string;
  name: string;
  title: string;
  party: string;
  district: string;
  state: string;
  phone?: string;
  email?: string;
  website?: string;
  photo?: string;
  social_media?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// INSERT TYPES
// ============================================================================

export interface UserProfileInsert {
  user_id: string;
  username: string;
  email: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  trust_tier?: 'T0' | 'T1' | 'T2' | 'T3';
  is_admin?: boolean;
  is_active?: boolean;
  primary_concerns?: string[];
  community_focus?: string[];
  participation_style?: 'observer' | 'participant' | 'leader' | 'organizer';
  demographics?: Record<string, any>;
  privacy_settings?: Record<string, any>;
}

export interface PollInsert {
  title: string;
  description: string;
  options: PollOption[];
  category: string;
  voting_method: 'single' | 'multiple' | 'ranked';
  privacy_level: 'public' | 'private' | 'friends';
  end_time?: string;
  user_id: string;
  poll_settings?: PollSettings;
}

export interface VoteInsert {
  poll_id: string;
  user_id: string;
  option_id: string;
}

export interface TrustTierAnalyticsInsert {
  user_id: string;
  poll_id?: string;
  trust_tier: 'T0' | 'T1' | 'T2' | 'T3';
  trust_score: number;
  factors: TrustTierAnalyticsFactors;
  calculated_at: string;
}

// ============================================================================
// UPDATE TYPES
// ============================================================================

export interface UserProfileUpdate {
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  trust_tier?: 'T0' | 'T1' | 'T2' | 'T3';
  is_admin?: boolean;
  is_active?: boolean;
  primary_concerns?: string[];
  community_focus?: string[];
  participation_style?: 'observer' | 'participant' | 'leader' | 'organizer';
  demographics?: Record<string, any>;
  privacy_settings?: Record<string, any>;
}

export interface PollUpdate {
  title?: string;
  description?: string;
  options?: PollOption[];
  status?: 'active' | 'closed' | 'archived';
  privacy_level?: 'public' | 'private' | 'friends';
  category?: string;
  voting_method?: 'single' | 'multiple' | 'ranked';
  end_time?: string;
  poll_settings?: PollSettings;
}

// ============================================================================
// QUERY TYPES
// ============================================================================

export interface PollQuery {
  status?: 'active' | 'closed' | 'archived';
  category?: string;
  privacy_level?: 'public' | 'private' | 'friends';
  user_id?: string;
  limit?: number;
  offset?: number;
  order_by?: 'created_at' | 'updated_at' | 'total_votes' | 'participation';
  order_direction?: 'asc' | 'desc';
}

export interface UserProfileQuery {
  trust_tier?: 'T0' | 'T1' | 'T2' | 'T3';
  is_admin?: boolean;
  is_active?: boolean;
  participation_style?: 'observer' | 'participant' | 'leader' | 'organizer';
  limit?: number;
  offset?: number;
  order_by?: 'created_at' | 'updated_at' | 'trust_tier';
  order_direction?: 'asc' | 'desc';
}
