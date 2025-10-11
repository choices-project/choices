/**
 * Hashtag Feature Exports
 * 
 * Centralized exports for the hashtag feature including components,
 * hooks, services, types, and utilities
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  // Core hashtag types
  Hashtag,
  UserHashtag,
  HashtagUsage,
  TrendingHashtag,
  HashtagCategory,
  HashtagCategoryInfo,
  HashtagClassification,
  
  // Hashtag interactions
  HashtagFollow,
  HashtagEngagement,
  HashtagAnalytics as HashtagAnalyticsType,
  
  // Search and discovery
  HashtagSearchQuery,
  HashtagSearchResult,
  HashtagSuggestion,
  HashtagRecommendation,
  
  // Content integration
  HashtagContent,
  HashtagFeed,
  
  // Validation and moderation
  HashtagValidation,
  HashtagModeration as HashtagModerationType,
  HashtagFlag,
  
  // API responses
  HashtagApiResponse,
  HashtagListResponse,
  HashtagStatsResponse,
  
  // User preferences
  HashtagUserPreferences,
  
  // Cross-feature integration
  ProfileHashtagIntegration,
  PollHashtagIntegration,
  FeedHashtagIntegration,
  
  // Utility types
  HashtagSortOption,
  HashtagFilterOption,
  HashtagNotificationType,
  HashtagFilter,
  HashtagSort,
  HashtagPagination,
  
  // Component props
  HashtagInputProps,
  HashtagDisplayProps,
  HashtagManagementProps,
  TrendingHashtagsProps,
  
  // Hook types
  UseHashtagOptions,
  UseHashtagSearchOptions,
  UseTrendingHashtagsOptions,
  UseHashtagSuggestionsOptions,
  
  // Store types
  HashtagStore
} from './types';

// ============================================================================
// COMPONENT EXPORTS
// ============================================================================

/** Hashtag input component with smart suggestions */
export { default as HashtagInput } from './components/HashtagInput';

/** Hashtag display component with various layouts */
export { default as HashtagDisplay } from './components/HashtagDisplay';

/** Hashtag management component for following/unfollowing */
export { default as HashtagManagement } from './components/HashtagManagement';

/** Advanced hashtag analytics component */
export { default as HashtagAnalytics } from './components/HashtagAnalytics';

/** Real-time trending hashtags component */
export { default as HashtagTrending } from './components/HashtagTrending';

/** Hashtag moderation component */
export { default as HashtagModeration, FlagHashtag, ModerationQueue, ModerationStatus } from './components/HashtagModeration';

// ============================================================================
// HOOK EXPORTS
// ============================================================================

/** Core hashtag data hooks */
export {
  useHashtag,
  useHashtagByName,
  useHashtagSearch,
  useTrendingHashtags,
  useHashtagSuggestions,
  useUserHashtags,
  useHashtagAnalytics,
  useHashtagStats,
  useHashtagValidation,
  hashtagQueryKeys
} from './hooks/use-hashtags';

/** Hashtag mutation hooks */
export {
  useCreateHashtag,
  useUpdateHashtag,
  useDeleteHashtag,
  useFollowHashtag,
  useUnfollowHashtag
} from './hooks/use-hashtags';

/** Combined hashtag hooks */
export {
  useHashtagData,
  useHashtagSearchWithSuggestions,
  useTrendingHashtagsWithStats,
  useHashtagLoadingStates,
  useHashtagErrorStates,
  useHashtagDataSummary
} from './hooks/use-hashtags';

// ============================================================================
// SERVICE EXPORTS
// ============================================================================

/** Core hashtag operations */
export {
  getHashtagById,
  getHashtagByName,
  createHashtag,
  updateHashtag,
  deleteHashtag
} from './lib/hashtag-service';

/** Hashtag search and discovery */
export {
  searchHashtags,
  getTrendingHashtags,
  getHashtagSuggestions
} from './lib/hashtag-service';

/** User hashtag interactions */
export {
  followHashtag,
  unfollowHashtag,
  getUserHashtags
} from './lib/hashtag-service';

/** Hashtag analytics and insights */
export {
  getHashtagAnalytics,
  getHashtagStats
} from './lib/hashtag-service';

/** Hashtag validation - moved to utility exports below */

/** Hashtag moderation */
export {
  getHashtagModeration,
  flagHashtag,
  moderateHashtag,
  getModerationQueue,
  getModerationStats,
  triggerAutoModeration,
  checkForDuplicates
} from './lib/hashtag-moderation';

/** Cross-feature integration */
export {
  getProfileHashtagIntegration,
  getPollHashtagIntegration,
  getFeedHashtagIntegration
} from './lib/hashtag-service';

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/** Hashtag utility functions */
export {
  validateHashtagName,
  normalizeHashtagName,
  formatHashtagForDisplay,
  getHashtagCategoryColor,
  getHashtagCategoryIcon,
  autoCategorizeHashtag,
  formatUsageCount,
  formatEngagementRate,
  formatGrowthRate,
  formatTrendingScore,
  calculateEngagementRate,
  calculateGrowthRate,
  calculateTrendingScore,
  getHashtagPerformanceLevel,
  generateHashtagSuggestions,
  extractHashtagsFromText,
  removeHashtagsFromText,
  compareHashtagsByUsage,
  compareHashtagsByTrending,
  compareHashtagsByFollowers,
  compareHashtagsByDate,
  filterHashtagsByCategory,
  filterTrendingHashtags,
  filterVerifiedHashtags,
  filterHashtagsByUsage,
  exportHashtagsToCSV,
  exportHashtagsToJSON
} from './utils/hashtag-utils';

/** Hashtag constants */
export {
  HASHTAG_CONSTANTS,
  HASHTAG_CATEGORIES,
  HASHTAG_SORT_OPTIONS,
  HASHTAG_FILTER_OPTIONS,
  HASHTAG_NOTIFICATION_TYPES,
  HASHTAG_ANALYTICS_PERIODS,
  HASHTAG_PERFORMANCE_LEVELS,
  HASHTAG_VALIDATION_RULES,
  HASHTAG_API_ENDPOINTS
} from './utils/hashtag-constants';

// ============================================================================
// FEATURE CONFIGURATION
// ============================================================================

/** Hashtag feature configuration */
export const hashtagFeatureConfig = {
  name: 'hashtags',
  version: '1.0.0',
  description: 'Comprehensive hashtag system with cross-feature integration',
  features: {
    search: true,
    trending: true,
    suggestions: true,
    analytics: true,
    crossFeatureIntegration: true,
    userManagement: true,
    validation: true,
    moderation: true // ✅ Implemented moderation system
  },
  limits: {
    maxHashtagsPerUser: 50,
    maxHashtagsPerContent: 10,
    maxHashtagLength: 50,
    minHashtagLength: 2
  },
  categories: [
    'politics', 'civics', 'social', 'environment', 'economy',
    'health', 'education', 'technology', 'culture', 'sports',
    'entertainment', 'news', 'local', 'national', 'international', 'custom'
  ] as const
} as const;

// ============================================================================
// FEATURE STATUS
// ============================================================================

/** Feature implementation status */
export const hashtagFeatureStatus = {
  core: {
    types: 'completed',
    service: 'completed',
    hooks: 'completed',
    components: 'completed'
  },
  integration: {
    profile: 'pending',
    polls: 'pending',
    feeds: 'pending',
    store: 'pending'
  },
  advanced: {
    analytics: 'completed',
    trending: 'completed',
    suggestions: 'completed',
    moderation: 'completed'
  },
  documentation: {
    feature: 'pending',
    integration: 'pending',
    usage: 'pending'
  }
} as const;

// ============================================================================
// QUICK START
// ============================================================================

/**
 * Quick start guide for using the hashtag feature
 * 
 * @example
 * ```tsx
 * import { HashtagInput, useHashtagSearch, useFollowHashtag } from '@/features/hashtags';
 * 
 * function MyComponent() {
 *   const [hashtags, setHashtags] = useState<string[]>([]);
 *   const followHashtag = useFollowHashtag();
 *   
 *   return (
 *     <HashtagInput
 *       value={hashtags}
 *       onChange={setHashtags}
 *       onSuggestionSelect={(suggestion) => {
 *         followHashtag.mutate(suggestion.hashtag.id);
 *       }}
 *     />
 *   );
 * }
 * ```
 */

// ============================================================================
// MIGRATION GUIDE
// ============================================================================

/**
 * Migration guide for integrating hashtag feature
 * 
 * 1. **Profile Integration**: Add hashtag support to user profiles
 * 2. **Poll Integration**: Enable hashtag tagging for polls
 * 3. **Feed Integration**: Add hashtag filtering to feeds
 * 4. **Store Integration**: Create centralized hashtag store
 * 5. **Component Integration**: Add hashtag components to existing features
 * 
 * @see /docs/features/HASHTAGS.md for detailed integration guide
 */
