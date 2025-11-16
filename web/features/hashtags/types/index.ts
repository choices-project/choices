/**
 * Hashtag Types
 *
 * Local feature-oriented type definitions kept lightweight to avoid pulling in
 * large upstream type graphs that slow down tooling. When updating shapes,
 * please mirror significant changes back to `@/types/features/hashtags` so the
 * global catalog stays in sync.
 */

export type HashtagMetadata = Record<string, unknown>;

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
  metadata?: HashtagMetadata;
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

export const HASHTAG_CATEGORIES: HashtagCategory[] = [
  'politics',
  'civics',
  'social',
  'environment',
  'economy',
  'health',
  'education',
  'technology',
  'culture',
  'sports',
  'entertainment',
  'news',
  'local',
  'national',
  'international',
  'custom',
  'global',
  'activism',
  'community',
  'business',
];

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
  usage_7d?: number;
  peak_position?: number;
  current_position?: number;
  categoryContext?: CategoryTrendSummary;
};

export type UserHashtag = {
  id: string;
  user_id: string;
  hashtag_id: string;
  hashtag: Hashtag;
  followed_at: string;
  is_primary: boolean;
  usage_count: number;
  last_used_at?: string;
  created_at?: string;
  preferences?: UserHashtagPreferences;
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
  id: string;
  hashtag_id: string;
  user_id: string;
  engagement_type: string;
  timestamp: string;
  created_at?: string;
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

export type CategoryTrendSummary = {
  category: HashtagCategory;
  totalTrendScore: number;
  totalUsage: number;
  trendingCount: number;
  averageTrendScore: number;
  averageUsage: number;
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
  flags?: HashtagFlag[]; // Include flags for detailed review
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

export type HashtagNotificationPreferences = Record<string, unknown>;
export type HashtagFilterPreferences = Record<string, unknown>;

export type HashtagUserPreferences = {
  userId: string;
  followedHashtags: string[];
  hashtagFilters: HashtagFilterPreferences;
  notificationPreferences: HashtagNotificationPreferences;
  createdAt?: string;
  updatedAt?: string;
};

export type UserHashtagPreferences = Record<string, unknown>;

export type ProfileHashtagIntegration = {
  user_id: string;
  primary_hashtags: string[];
  interest_hashtags: string[];
  custom_hashtags: string[];
  followed_hashtags: string[];
  hashtag_preferences: HashtagUserPreferences | null;
  hashtag_activity: HashtagEngagement[];
  last_updated: string;
};

export type UpdateHashtagUserPreferencesInput = {
  userId: string;
  followedHashtags?: string[];
  hashtagFilters?: HashtagFilterPreferences;
  notificationPreferences?: HashtagNotificationPreferences;
};

export type HashtagActivity = {
  id: string;
  hashtag_id: string;
  hashtag: Hashtag;
  content_type: 'poll' | 'comment' | 'profile' | 'feed';
  content_id: string;
  user_id: string;
  created_at: string;
  context?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  engagement_score?: number;
};

export type PollHashtagEngagement = {
  total_views: number;
  hashtag_clicks: number;
  hashtag_shares: number;
};

export type PollHashtagIntegration = {
  poll_id: string;
  hashtags: string[];
  primary_hashtag?: string;
  hashtag_engagement: PollHashtagEngagement;
  related_polls: string[];
  hashtag_trending_score: number;
};

export type FeedHashtagAnalytics = {
  hashtag: string;
  poll_count: number;
  engagement_rate: number;
  user_interest_level: number;
  trending_position?: number;
  last_activity: string;
};

export type FeedHashtagContentItem = Record<string, unknown>;

export type FeedHashtagIntegration = {
  feed_id: string;
  hashtag_filters: string[];
  trending_hashtags: string[];
  hashtag_content: FeedHashtagContentItem[];
  hashtag_analytics: FeedHashtagAnalytics[];
  personalized_hashtags: string[];
};

export type HashtagValidation = {
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
};
