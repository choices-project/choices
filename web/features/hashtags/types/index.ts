/**
 * Hashtag Types
 *
 * Local feature-oriented type definitions kept lightweight to avoid pulling in
 * large upstream type graphs that slow down tooling. When updating shapes,
 * please mirror significant changes back to `@/types/features/hashtags` so the
 * global catalog stays in sync.
 */

export type Hashtag = {
  id: string;
  name: string;
  display_name?: string;
  description?: string;
  category: HashtagCategory;
  usage_count: number;
  is_trending: boolean;
  is_verified: boolean;
  is_featured?: boolean;
  follower_count?: number;
  trend_score?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  metadata?: Record<string, unknown>;
};

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
  | 'custom'
  | 'global'
  | 'activism'
  | 'community'
  | 'business';

export type HashtagSearchResult = {
  hashtag: Hashtag;
  relevance_score: number;
  match_type: 'exact' | 'partial' | 'fuzzy';
};

export type HashtagSearchResponse = {
  hashtags: Hashtag[];
  total_count: number;
  suggestions: HashtagSuggestion[];
  related_queries: string[];
  filters_applied: Record<string, unknown>;
  search_time_ms: number;
};

export type TrendingHashtag = {
  hashtag: Hashtag;
  trend_score: number;
  growth_rate: number;
  peak_usage: number;
  time_period: string;
};

export type UserHashtag = {
  user_id: string;
  hashtag_id: string;
  hashtag: Hashtag;
  followed_at: string;
  notification_enabled: boolean;
};

export type HashtagSuggestion = {
  hashtag: Hashtag;
  reason: string;
  confidence: number;
  confidence_score?: number;
  source: 'trending' | 'similar' | 'popular' | 'recent' | 'personal';
  metadata?: Record<string, unknown>;
  context?: string;
};

export type HashtagSearchQuery = {
  query: string;
  category?: HashtagCategory;
  limit?: number;
  offset?: number;
  sort_by?: 'relevance' | 'popularity' | 'trending' | 'recent';
  include_trending?: boolean;
  include_verified?: boolean;
  filters?: Record<string, unknown>;
};

export type HashtagEngagement = {
  hashtag_id: string;
  user_id: string;
  action: 'view' | 'click' | 'follow' | 'unfollow' | 'share';
  timestamp: string;
  metadata?: Record<string, unknown>;
};

export type HashtagAnalytics = {
  hashtag_id: string;
  period: string;
  total_usage: number;
  unique_users: number;
  engagement_rate: number;
  trend_score: number;
  demographics?: {
    age_groups: Record<string, number>;
    locations: Record<string, number>;
    interests: Record<string, number>;
  };
  generated_at: string;
};

export type HashtagModeration = {
  id: string;
  hashtag_id: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'approved' | 'rejected' | 'flagged';
  human_review_required?: boolean;
  moderation_reason?: string;
  created_at: string;
  updated_at: string;
  moderated_by?: string;
  moderated_at?: string;
};

export type HashtagFlag = {
  id: string;
  hashtag_id: string;
  flag_type: 'inappropriate' | 'spam' | 'misleading' | 'duplicate' | 'other';
  reason: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'approved' | 'rejected' | 'flagged';
  reviewed_by?: string;
  reviewed_at?: string;
};

export type HashtagApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};
