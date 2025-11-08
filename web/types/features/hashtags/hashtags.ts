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

import type {
  Hashtag as CoreHashtag,
  UserHashtag as CoreUserHashtag,
  TrendingHashtag as CoreTrendingHashtag,
  HashtagCategory as CoreHashtagCategory,
  HashtagActivity as CoreHashtagActivity,
  HashtagUserPreferences as CoreHashtagUserPreferences,
  ProfileHashtagIntegration as CoreProfileHashtagIntegration,
  PollHashtagIntegration as CorePollHashtagIntegration,
  FeedHashtagIntegration as CoreFeedHashtagIntegration,
  FeedHashtagAnalytics as CoreFeedHashtagAnalytics,
  HashtagValidation as CoreHashtagValidation,
  HashtagSuggestion as CoreHashtagSuggestion,
  HashtagSearchQuery as CoreHashtagSearchQuery,
  HashtagSearchResponse as CoreHashtagSearchResponse,
  HashtagEngagement as CoreHashtagEngagement,
  HashtagAnalytics as CoreHashtagAnalytics,
  CategoryTrendSummary as CoreCategoryTrendSummary,
  HashtagMetadata as CoreHashtagMetadata,
} from '@/features/hashtags/types';

export type Hashtag = CoreHashtag;

export type UserHashtag = CoreUserHashtag;

export type HashtagUsage = CoreHashtagActivity;

export type TrendingHashtag = CoreTrendingHashtag;

// ============================================================================
// HASHTAG CATEGORIES AND CLASSIFICATION
// ============================================================================

export type HashtagCategory = CoreHashtagCategory;

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

export type HashtagEngagement = CoreHashtagEngagement;

export type HashtagAnalytics = CoreHashtagAnalytics;

// ============================================================================
// HASHTAG SEARCH AND DISCOVERY
// ============================================================================

export type HashtagSearchQuery = CoreHashtagSearchQuery;

export type HashtagSearchResult = {
  hashtag: Hashtag;
  relevance_score: number;
  match_type: 'exact' | 'partial' | 'fuzzy';
};

export type HashtagSearchResponse = CoreHashtagSearchResponse;

export type HashtagSuggestion = CoreHashtagSuggestion;

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

export type HashtagValidation = CoreHashtagValidation;

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

// Re-exported above from core feature types

// ============================================================================
// HASHTAG CROSS-FEATURE INTEGRATION
// ============================================================================

// Re-exported above from core feature types

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

export type HashtagMetadata = CoreHashtagMetadata;

export type CategoryTrendSummary = CoreCategoryTrendSummary;
