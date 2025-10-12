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

export interface Hashtag {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  category?: HashtagCategory;
  usage_count: number;
  follower_count: number;
  is_trending: boolean;
  trend_score: number;
  engagement_rate?: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  is_verified: boolean;
  is_featured: boolean;
  metadata?: Record<string, any>;
}

export interface UserHashtag {
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

export interface HashtagUsage {
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

export interface TrendingHashtag {
  hashtag: Hashtag;
  trend_score: number;
  growth_rate: number;
  usage_count_24h: number;
  usage_count_7d: number;
  peak_position: number;
  current_position: number;
  related_hashtags: string[];
  trending_since: string;
  category_trends: Record<string, number>;
}

// ============================================================================
// HASHTAG CATEGORIES AND CLASSIFICATION
// ============================================================================

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

export interface HashtagCategoryInfo {
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

export interface HashtagClassification {
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

export interface HashtagFollow {
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

export interface HashtagEngagement {
  hashtag_id: string;
  user_id: string;
  engagement_type: 'view' | 'click' | 'share' | 'create' | 'follow' | 'unfollow';
  content_id?: string;
  content_type?: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface HashtagAnalytics {
  hashtag_id: string;
  period: '24h' | '7d' | '30d' | '90d' | '1y';
  metrics: {
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
  generated_at: string;
}

// ============================================================================
// HASHTAG SEARCH AND DISCOVERY
// ============================================================================

export interface HashtagSearchQuery {
  query: string;
  filters?: {
    category?: HashtagCategory;
    is_trending?: boolean;
    is_verified?: boolean;
    min_usage_count?: number;
    created_after?: string;
    created_before?: string;
  };
  sort?: 'relevance' | 'usage' | 'trending' | 'alphabetical' | 'created';
  limit?: number;
  offset?: number;
}

export interface HashtagSearchResult {
  hashtags: Hashtag[];
  total_count: number;
  suggestions: string[];
  related_queries: string[];
  filters_applied: Record<string, any>;
  search_time_ms: number;
}

export interface HashtagSuggestion {
  hashtag: Hashtag;
  reason: 'trending' | 'related' | 'popular' | 'recent' | 'personal' | string;
  confidence: number;
  confidence_score: number; // For backward compatibility
  source: 'trending' | 'related' | 'personalized' | 'category' | 'search';
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
}

// ============================================================================
// HASHTAG CONTENT INTEGRATION
// ============================================================================

export interface HashtagContent {
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

export interface HashtagFeed {
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

export interface HashtagRecommendation {
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

export interface HashtagSmartSuggestion {
  input: string;
  suggestions: HashtagSuggestion[];
  auto_complete: string[];
  related_hashtags: string[];
  trending_hashtags: string[];
  personal_hashtags: string[];
  context_hashtags: string[];
}

export interface HashtagTrendingAlgorithm {
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

export interface HashtagModeration {
  hashtag_id: string;
  status: 'approved' | 'pending' | 'rejected' | 'flagged';
  moderation_reason?: string;
  moderated_by?: string;
  moderated_at: string;
  flags: HashtagFlag[];
  auto_moderation_score: number;
  human_review_required: boolean;
}

export interface HashtagFlag {
  id: string;
  hashtag_id: string;
  user_id: string;
  flag_type: 'inappropriate' | 'spam' | 'misleading' | 'duplicate' | 'other';
  reason: string;
  created_at: string;
  status: 'pending' | 'resolved' | 'dismissed';
  reviewed_by?: string;
  reviewed_at?: string;
}

// ============================================================================
// HASHTAG API RESPONSES
// ============================================================================

export interface HashtagApiResponse<T = any> {
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

export interface HashtagListResponse {
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

export interface HashtagStatsResponse {
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

export interface HashtagUserPreferences {
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

export interface ProfileHashtagIntegration {
  user_id: string;
  primary_hashtags: string[];
  interest_hashtags: string[];
  custom_hashtags: string[];
  followed_hashtags: string[];
  hashtag_preferences: HashtagUserPreferences;
  hashtag_activity: HashtagEngagement[];
  last_updated: string;
}

export interface PollHashtagIntegration {
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

export interface FeedHashtagIntegration {
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

export interface HashtagFilter {
  type: HashtagFilterOption;
  value: any;
  label: string;
  active: boolean;
}

export interface HashtagSort {
  option: HashtagSortOption;
  direction: 'asc' | 'desc';
  label: string;
}

export interface HashtagPagination {
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

export interface HashtagInputProps {
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

export interface HashtagDisplayProps {
  hashtags: Hashtag[];
  showCount?: boolean;
  showCategory?: boolean;
  clickable?: boolean;
  onHashtagClick?: (hashtag: Hashtag) => void;
  onFollow?: (hashtag: Hashtag) => void;
  onUnfollow?: (hashtag: Hashtag) => void;
  className?: string;
}

export interface HashtagManagementProps {
  userHashtags: UserHashtag[];
  onFollow: (hashtag: Hashtag) => void;
  onUnfollow: (hashtag: Hashtag) => void;
  onReorder: (hashtags: UserHashtag[]) => void;
  showSuggestions?: boolean;
  className?: string;
}

export interface TrendingHashtagsProps {
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

export interface UseHashtagOptions {
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

export interface HashtagStore {
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
