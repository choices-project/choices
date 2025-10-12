/**
 * Shared Hashtag Types
 * 
 * Core hashtag types shared across the application
 * Moved from features to lib to resolve import boundary issues
 * 
 * Created: October 11, 2025
 * Status: ✅ ACTIVE
 */

// ============================================================================
// CORE HASHTAG TYPES
// ============================================================================

export interface Hashtag {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  category?: HashtagCategory;
  usage_count: number;
  created_at: string;
  updated_at: string;
  is_trending: boolean;
  is_verified: boolean;
  is_custom: boolean;
  is_featured: boolean;
  created_by?: string;
  last_used?: string;
  related_hashtags?: string[];
  trending_score?: number;
  trend_score?: number;
  follower_count?: number;
  engagement_rate?: number;
  reach?: number;
  impressions?: number;
  clicks?: number;
  shares?: number;
  likes?: number;
  comments?: number;
  sentiment_score?: number;
  demographic_breakdown?: {
    age_groups: Record<string, number>;
    genders: Record<string, number>;
    locations: Record<string, number>;
  };
  time_series_data?: Array<{
    date: string;
    usage_count: number;
    engagement_rate: number;
    sentiment_score: number;
  }>;
  cross_feature_usage?: {
    polls: number;
    profiles: number;
    feeds: number;
    comments: number;
  };
  moderation_status?: 'approved' | 'pending' | 'rejected' | 'flagged';
  moderation_notes?: string;
  flagged_count?: number;
  reported_count?: number;
  auto_moderation_score?: number;
  content_policy_violations?: string[];
  last_moderated?: string;
  moderated_by?: string;
  moderation_history?: Array<{
    action: string;
    reason: string;
    timestamp: string;
    moderator: string;
  }>;
}

export type HashtagCategory = 
  | 'politics'
  | 'civics'
  | 'social'
  | 'environment'
  | 'economy'
  | 'health'
  | 'education'
  | 'technology'
  | 'culture'
  | 'sports'
  | 'entertainment'
  | 'news'
  | 'local'
  | 'national'
  | 'international'
  | 'global'
  | 'activism'
  | 'community'
  | 'business'
  | 'science'
  | 'art'
  | 'music'
  | 'food'
  | 'travel'
  | 'fashion'
  | 'lifestyle'
  | 'custom'
  | 'other';

export interface HashtagValidation {
  name: string;
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  normalized_name: string;
  availability: {
    is_available: boolean;
    similar_hashtags: string[];
    conflict_reason?: string;
  };
}

export interface HashtagSuggestion {
  hashtag: Hashtag;
  reason: string;
  confidence: number;
  source: 'trending' | 'related' | 'personalized' | 'category' | 'search';
  metadata?: {
    trending_score?: number;
    related_hashtags?: string[];
    category_match?: boolean;
    user_history?: boolean;
    social_proof?: number;
  };
}

export interface TrendingHashtag {
  hashtag: Hashtag;
  trending_score: number;
  growth_rate: number;
  peak_usage: number;
  time_to_peak: number;
  category_trend: number;
  cross_platform_usage: number;
  engagement_velocity: number;
  sentiment_trend: number;
  demographic_diversity: number;
  geographic_spread: number;
  content_quality_score: number;
  moderation_risk_score: number;
  prediction_confidence: number;
  related_trending: string[];
  peak_timestamp: string;
  trend_duration: number;
  decay_rate: number;
  resurgence_potential: number;
  influencer_impact: number;
  media_coverage: number;
  cross_feature_impact: {
    polls: number;
    profiles: number;
    feeds: number;
    comments: number;
  };
  seasonal_factor: number;
  event_correlation: string[];
  competitor_analysis: {
    similar_hashtags: string[];
    market_share: number;
    differentiation_score: number;
  };
  future_predictions: {
    next_24h: number;
    next_7d: number;
    next_30d: number;
    peak_prediction: string;
    decline_prediction: string;
  };
}

export interface HashtagAnalytics {
  hashtag_id: string;
  period: '24h' | '7d' | '30d' | '90d';
  total_usage: number;
  unique_users: number;
  engagement_rate: number;
  reach: number;
  impressions: number;
  clicks: number;
  shares: number;
  likes: number;
  comments: number;
  sentiment_score: number;
  demographic_breakdown: {
    age_groups: Record<string, number>;
    genders: Record<string, number>;
    locations: Record<string, number>;
  };
  time_series: Array<{
    date: string;
    usage_count: number;
    engagement_rate: number;
    sentiment_score: number;
  }>;
  cross_feature_usage: {
    polls: number;
    profiles: number;
    feeds: number;
    comments: number;
  };
  related_hashtags: string[];
  trending_score: number;
  growth_rate: number;
  peak_usage: number;
  category_trend: number;
  geographic_spread: number;
  content_quality_score: number;
  moderation_risk_score: number;
  generated_at: string;
}

export interface HashtagModeration {
  id: string;
  hashtag_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  reason?: string;
  moderator_id?: string;
  moderated_at?: string;
  auto_moderation_score?: number;
  content_policy_violations?: string[];
  flagged_count: number;
  reported_count: number;
  last_flagged?: string;
  last_reported?: string;
  moderation_notes?: string;
  appeal_count: number;
  appeal_resolved_count: number;
  moderation_history: Array<{
    action: string;
    reason: string;
    timestamp: string;
    moderator: string;
  }>;
  created_at: string;
  updated_at: string;
}
