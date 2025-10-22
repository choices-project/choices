/**
 * Core Types - Centralized Type System
 * 
 * Centralized type definitions for the entire application
 * Single source of truth for all core types
 * 
 * Created: January 19, 2025
 * Status: ✅ ACTIVE
 */

// ============================================================================
// DATABASE TYPES
// ============================================================================

export type { Database } from './database';
export type { 
  Poll, 
  Vote, 
  TrustTierAnalytics,
  Hashtag,
  Representative
} from './database';

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  trust_tier: 'T0' | 'T1' | 'T2' | 'T3';
  is_admin: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  user: AuthUser;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// ============================================================================
// PROFILE TYPES
// ============================================================================

export interface ProfileUpdateData {
  displayname: string;
  display_name: string;
  bio: string;
  username: string;
  primaryconcerns: string[];
  primary_concerns: string[];
  communityfocus: string[];
  community_focus: string[];
  participationstyle: 'observer' | 'participant' | 'leader' | 'organizer';
  participation_style: 'observer' | 'participant' | 'leader' | 'organizer';
  privacysettings: PrivacySettings;
  privacy_settings: PrivacySettings;
}

export interface PrivacySettings {
  profile_visibility: 'public' | 'private' | 'friends';
  show_email: boolean;
  show_activity: boolean;
  allow_messages: boolean;
  share_demographics: boolean;
  allow_analytics: boolean;
}

// ============================================================================
// POLL TYPES
// ============================================================================

export interface PollCreateData {
  title: string;
  description: string;
  options: PollOption[];
  category: string;
  voting_method: 'single' | 'multiple' | 'ranked';
  privacy_level: 'public' | 'private' | 'friends';
  end_time?: string;
}

export interface PollOption {
  id: string;
  text: string;
  description?: string;
}

export interface PollSettings {
  allow_multiple_votes: boolean;
  require_authentication: boolean;
  show_results_before_end: boolean;
  allow_anonymous_votes: boolean;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface TrustTierAnalyticsFactors {
  data_quality_score: number;
  engagement_score: number;
  participation_score: number;
  community_contribution_score: number;
  trust_indicators: string[];
  risk_factors: string[];
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface ValidationError extends AppError {
  field: string;
  value: any;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: AppError;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================================================
// STORE TYPES
// ============================================================================

export interface BaseStore {
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

// UserProfile is exported from database types above

import type { UserProfile } from './database';

export interface UserStore extends BaseStore {
  user: AuthUser | null;
  profile: UserProfile | null;
  preferences: UserPreferences | null;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  frequency: 'immediate' | 'daily' | 'weekly';
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const TRUST_TIERS = ['T0', 'T1', 'T2', 'T3'] as const;
export const PARTICIPATION_STYLES = ['observer', 'participant', 'leader', 'organizer'] as const;
export const PROFILE_VISIBILITY = ['public', 'private', 'friends'] as const;
export const VOTING_METHODS = ['single_choice', 'multiple_choice', 'ranked_choice', 'approval', 'range', 'quadratic'] as const;
export const POLL_CATEGORIES = [
  'politics',
  'social',
  'economic',
  'environmental',
  'technology',
  'education',
  'healthcare',
  'other'
] as const;

export type TrustTier = typeof TRUST_TIERS[number];
export type ParticipationStyle = typeof PARTICIPATION_STYLES[number];
export type ProfileVisibility = typeof PROFILE_VISIBILITY[number];
export type VotingMethod = typeof VOTING_METHODS[number];
export type PollCategory = typeof POLL_CATEGORIES[number];
