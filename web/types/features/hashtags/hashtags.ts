/**
 * Hashtag Feature Types
 *
 * Comprehensive type definitions for the hashtag system
 * Includes core hashtag types, user interactions, analytics, and cross-feature integration
 *
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

// ============================================================================
// CORE HASHTAG TYPES
// ============================================================================

import type { Json } from '@/types/supabase';

export type Hashtag = {
  id: string;
  name: string;
  display_name?: string;
  description?: string;
  category: HashtagCategory;
  usage_count: number;
  follower_count?: number;
  is_trending: boolean;
  trend_score?: number;
  engagement_rate?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  is_verified: boolean;
  is_featured?: boolean;
  metadata?: Json | null;
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
  preferences?: {
    notifications: boolean;
    auto_follow_related: boolean;
    priority: 'low' | 'medium' | 'high';
  };
}

export type HashtagUsage = {
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
}

export type TrendingHashtag = {
  hashtag: Hashtag;
  trend_score: number;
  growth_rate: number;
  usage_count_24h?: number;
  usage_count_7d?: number;
  peak_usage?: number;
  peak_position?: number;
  current_position?: number;
  related_hashtags?: string[];
  trending_since?: string;
  category_trends?: Record<string, number>;
  time_period?: string;
};

// ============================================================================
// HASHTAG CATEGORIES AND CLASSIFICATION
// ============================================================================

export type HashtagCategory = string;

export type HashtagCategoryInfo = {
  name: HashtagCategory;
  display_name: string;
  description: string;
  color: string;
  icon: string;
  parent_category?: HashtagCategory;
  subcategories?: HashtagCategory[];
  is_system: boolean;
  usage_count: number;
}

export type HashtagClassification = {
  hashtag_id: string;
  primary_category: HashtagCategory;
  secondary_categories: HashtagCategory[];
  confidence_score: number;
  auto_classified: boolean;
  classified_at: string;
  classification_method: 'manual' | 'ai' | 'user' | 'system';
}

// ============================================================================
// HASHTAG INTERACTIONS AND ENGAGEMENT
// ============================================================================

export type HashtagFollow = {
  id: string;
  user_id: string;
  hashtag_id: string;
  followed_at: string;
  notification_preferences: {
    new_content: boolean;
    trending_updates: boolean;
    related_hashtags: boolean;
  };
  is_primary: boolean;
  priority: number;
}

export type HashtagEngagement = {
  hashtag_id: string;
  user_id: string;
  action: 'view' | 'click' | 'share' | 'create' | 'follow' | 'unfollow';
  engagement_type?: HashtagEngagement['action'];
  content_id?: string;
  content_type?: string;
  timestamp: string;
  metadata?: Record<string, any>;
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
  metadata?: Record<string, any>;
  generated_at: string;
  metrics?: {
    usage_count: number;
    unique_users: number;
    engagement_rate: number;
    growth_rate: number;
    peak_usage: number;
    average_usage: number;
    top_content: string[];
    top_users: string[];
    related_hashtags: string[];
    sentiment_distribution: Record<string, number>;
    geographic_distribution: Record<string, number>;
    demographic_distribution: Record<string, number>;
  };
};

// ============================================================================
// HASHTAG SEARCH AND DISCOVERY
// ============================================================================

export type HashtagSearchQuery = {
  query: string;
  category?: HashtagCategory;
  limit?: number;
  offset?: number;
  sort_by?: 'relevance' | 'popularity' | 'trending' | 'recent';
  include_trending?: boolean;
  include_verified?: boolean;
  filters?: {
    category?: HashtagCategory;
    is_trending?: boolean;
    is_verified?: boolean;
    min_usage_count?: number;
    created_after?: string;
    created_before?: string;
  };
};

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
  filters_applied: Record<string, any>;
  search_time_ms: number;
};

export type HashtagSuggestion = {
  hashtag: Hashtag;
  reason: string;
  confidence: number;
  confidence_score?: number;
  source: 'trending' | 'related' | 'personalized' | 'category' | 'search' | 'similar' | 'popular' | 'personal';
  category?: HashtagCategory;
  usage_count?: number;
  is_trending?: boolean;
  is_verified?: boolean;
  context?: string;
  metadata?: {
    trending_score?: number;
    related_hashtags?: string[];
    category_match?: boolean;
    user_history?: boolean;
    social_proof?: number;
  };
};

// ============================================================================
// HASHTAG CONTENT INTEGRATION
// ============================================================================

export type HashtagContent = {
  id: string;
  hashtag_id: string;
  content_type: 'poll' | 'comment' | 'profile' | 'feed' | 'post';
  content_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_featured: boolean;
  engagement_score: number;
  metadata?: Record<string, any>;
}

export type HashtagFeed = {
  hashtag_id: string;
  content: HashtagContent[];
  total_count: number;
  has_more: boolean;
  last_updated: string;
  filters?: {
    content_type?: string[];
    date_range?: {
      start: string;
      end: string;
    };
    engagement_threshold?: number;
  };
}

// ============================================================================
// HASHTAG RECOMMENDATIONS AND AI
// ============================================================================

export type HashtagRecommendation = {
  hashtag: Hashtag;
  reason: string;
  confidence_score: number;
  recommendation_type: 'trending' | 'related' | 'personal' | 'discovery' | 'category';
  user_context?: {
    interests: string[];
    behavior: string[];
    demographics: Record<string, any>;
  };
}

export type HashtagSmartSuggestion = {
  input: string;
  suggestions: HashtagSuggestion[];
  auto_complete: string[];
  related_hashtags: string[];
  trending_hashtags: string[];
  personal_hashtags: string[];
  context_hashtags: string[];
}

export type HashtagTrendingAlgorithm = {
  algorithm_version: string;
  parameters: {
    time_window: number;
    engagement_weight: number;
    growth_weight: number;
    recency_weight: number;
    category_boost: Record<string, number>;
  };
  results: TrendingHashtag[];
  generated_at: string;
  next_update: string;
}

// ============================================================================
// HASHTAG VALIDATION AND MODERATION
// ============================================================================

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
}

export type HashtagModeration = {
  id?: string;
  hashtag_id: string;
  status: 'approved' | 'pending' | 'rejected' | 'flagged' | 'reviewed' | 'resolved';
  moderation_reason?: string;
  moderated_by?: string;
  moderated_at?: string;
  created_at?: string;
  updated_at?: string;
  flags?: HashtagFlag[];
  auto_moderation_score?: number;
  human_review_required?: boolean;
};

export type HashtagFlag = {
  id: string;
  hashtag_id: string;
  user_id: string;
  flag_type: 'inappropriate' | 'spam' | 'misleading' | 'duplicate' | 'other';
  reason: string;
  created_at: string;
  updated_at?: string;
  status:
    | 'pending'
    | 'flagged'
    | 'approved'
    | 'rejected'
    | 'resolved'
    | 'reviewed'
    | 'dismissed';
  flagged_by?: string;
  reviewed_by?: string;
  reviewed_at?: string;
};

// ============================================================================
// HASHTAG API RESPONSES
// ============================================================================

export type HashtagApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: {
    request_id: string;
    timestamp: string;
    version: string;
  };
}

export type HashtagListResponse = {
  hashtags: Hashtag[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
  filters?: Record<string, any>;
  sort?: string;
}

export type HashtagStatsResponse = {
  total_hashtags: number;
  trending_count: number;
  verified_count: number;
  categories: Record<HashtagCategory, number>;
  top_hashtags: Hashtag[];
  recent_activity: HashtagUsage[];
  system_health: {
    api_response_time: number;
    database_performance: number;
    cache_hit_rate: number;
  };
}

// ============================================================================
// HASHTAG USER PREFERENCES
// ============================================================================

export type HashtagUserPreferences = {
  user_id: string;
  default_categories: HashtagCategory[];
  auto_follow_suggestions: boolean;
  trending_notifications: boolean;
  related_hashtag_suggestions: boolean;
  privacy_settings: {
    show_followed_hashtags: boolean;
    show_hashtag_activity: boolean;
    allow_hashtag_recommendations: boolean;
  };
  notification_preferences: {
    new_trending_hashtags: boolean;
    hashtag_updates: boolean;
    related_content: boolean;
    weekly_digest: boolean;
  };
  created_at: string;
  updated_at: string;
}

// ============================================================================
// HASHTAG CROSS-FEATURE INTEGRATION
// ============================================================================

export type ProfileHashtagIntegration = {
  user_id: string;
  primary_hashtags: string[];
  interest_hashtags: string[];
  custom_hashtags: string[];
  followed_hashtags: string[];
  hashtag_preferences: HashtagUserPreferences;
  hashtag_activity: HashtagEngagement[];
  last_updated: string;
}

export type PollHashtagIntegration = {
  poll_id: string;
  hashtags: string[];
  primary_hashtag?: string;
  hashtag_engagement: {
    total_views: number;
    hashtag_clicks: number;
    hashtag_shares: number;
  };
  related_polls: string[];
  hashtag_trending_score: number;
}

export type FeedHashtagIntegration = {
  feed_id: string;
  hashtag_filters: string[];
  trending_hashtags: string[];
  hashtag_content: HashtagContent[];
  hashtag_analytics: HashtagAnalytics;
  personalized_hashtags: string[];
}

// ============================================================================
// HASHTAG UTILITY TYPES
// ============================================================================

export type HashtagSortOption = 'relevance' | 'usage' | 'trending' | 'alphabetical' | 'created';
export type HashtagFilterOption = 'category' | 'trending' | 'verified' | 'usage_count' | 'date_range';
export type HashtagNotificationType = 'new_trending' | 'hashtag_update' | 'related_content' | 'weekly_digest';

export type HashtagFilter = {
  type: HashtagFilterOption;
  value: any;
  label: string;
  active: boolean;
}

export type HashtagSort = {
  option: HashtagSortOption;
  direction: 'asc' | 'desc';
  label: string;
}

export type HashtagPagination = {
  page: number;
  limit: number;
  total: number;
  has_more: boolean;
  next_cursor?: string;
  prev_cursor?: string;
}

// ============================================================================
// HASHTAG COMPONENT PROPS
// ============================================================================

export type HashtagInputProps = {
  value: string[];
  onChange: (hashtags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  allowCustom?: boolean;
  suggestions?: HashtagSuggestion[];
  onSuggestionSelect?: (suggestion: HashtagSuggestion) => void;
  validation?: HashtagValidation;
  disabled?: boolean;
  className?: string;
}

export type HashtagDisplayProps = {
  hashtags: Hashtag[];
  showCount?: boolean;
  showCategory?: boolean;
  clickable?: boolean;
  onHashtagClick?: (hashtag: Hashtag) => void;
  onFollow?: (hashtag: Hashtag) => void;
  onUnfollow?: (hashtag: Hashtag) => void;
  className?: string;
}

export type HashtagManagementProps = {
  userHashtags: UserHashtag[];
  onFollow: (hashtag: Hashtag) => void;
  onUnfollow: (hashtag: Hashtag) => void;
  onReorder: (hashtags: UserHashtag[]) => void;
  showSuggestions?: boolean;
  className?: string;
}

export type TrendingHashtagsProps = {
  hashtags: TrendingHashtag[];
  onHashtagClick?: (hashtag: Hashtag) => void;
  showGrowthRate?: boolean;
  showPosition?: boolean;
  limit?: number;
  className?: string;
}

// ============================================================================
// HASHTAG HOOK TYPES
// ============================================================================

export type UseHashtagOptions = {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
  cacheTime?: number;
}

export type UseHashtagSearchOptions = UseHashtagOptions & {
  query: string;
  filters?: HashtagSearchQuery['filters'];
  sort?: HashtagSortOption;
  limit?: number;
}

export type UseTrendingHashtagsOptions = UseHashtagOptions & {
  category?: HashtagCategory;
  limit?: number;
  timeWindow?: '24h' | '7d' | '30d';
}

export type UseHashtagSuggestionsOptions = UseHashtagOptions & {
  input: string;
  context?: string;
  limit?: number;
  includePersonal?: boolean;
  includeTrending?: boolean;
}

// ============================================================================
// HASHTAG STORE TYPES
// ============================================================================

export type HashtagStore = {
  // State
  hashtags: Hashtag[];
  userHashtags: UserHashtag[];
  trendingHashtags: TrendingHashtag[];
  searchResults: HashtagSearchResult;
  suggestions: HashtagSuggestion[];
  isLoading: boolean;
  isSearching: boolean;
  isFollowing: boolean;
  error: string | null;

  // Actions
  searchHashtags: (query: HashtagSearchQuery) => Promise<void>;
  followHashtag: (hashtagId: string) => Promise<boolean>;
  unfollowHashtag: (hashtagId: string) => Promise<boolean>;
  createHashtag: (name: string, description?: string) => Promise<Hashtag | null>;
  getTrendingHashtags: (category?: HashtagCategory) => Promise<void>;
  getSuggestions: (input: string, context?: string) => Promise<void>;
  getUserHashtags: () => Promise<void>;
  clearSearch: () => void;
  clearError: () => void;

  // Getters
  getHashtagById: (id: string) => Hashtag | undefined;
  getHashtagByName: (name: string) => Hashtag | undefined;
  isFollowingHashtag: (hashtagId: string) => boolean;
  getFollowedHashtags: () => UserHashtag[];
  getTrendingHashtagsByCategory: (category: HashtagCategory) => TrendingHashtag[];
}
