/**
 * FEEDS Feature Exports
 * 
 * Feature exports for feeds functionality
 * Types are now centralized in /web/types/
 * 
 * Updated: October 26, 2025
 * Status: ✅ REFACTORED
 */

/**
 * Feeds Feature - Clean Exports
 * 
 * Centralized exports for all feed-related functionality
 * Provides clean API for consuming feed components and services
 */

// Types - using civics types
export type { 
  FeedItemData,
  UserPreferences,
  EngagementData,
  TouchPoint,
  TouchState
} from '@/features/civics/lib/types/civics-types';

// Local types
export type { 
  FeedItemWithScore,
  TrackEventData,
  EngagementMetadata,
  RecommendedPoll,
  PollHashtag,
  HashtagAnalytic,
  HashtagPollsFeed as HashtagPollsFeedData
} from './types/feed-types';

// Lib utilities
export { TrendingHashtagsTracker, trendingHashtagsTracker } from './lib/TrendingHashtags';

// Hashtag-Polls Integration (Client Version)
export {
  getHashtagPollsIntegrationServiceClient,
  type HashtagPollIntegration,
  type FeedHashtagAnalytics,
  type PersonalizedHashtagFeed
} from './lib/hashtag-polls-integration-client';

// Components
export { default as HashtagPollsFeed } from './components/HashtagPollsFeed';

// Unified Feed Component (RECOMMENDED)
export { default as UnifiedFeedRefactored } from './components/UnifiedFeedRefactored';
export { default as FeedCore } from './components/core/FeedCore';
export { default as FeedDataProvider } from './components/providers/FeedDataProvider';

// Optional enhancers
export { default as FeedPWAEnhancer } from './components/enhancers/FeedPWAEnhancer';
export { default as FeedRealTimeUpdates } from './components/enhancers/FeedRealTimeUpdates';

// Hooks
export { useFeedAnalytics } from './hooks/useFeedAnalytics';

// Note: Feed state management is handled by:
// - FeedDataProvider component (render props pattern)
// - useHashtagStore from @/lib/stores/hashtagStore (hashtag management)
// - useFeedsStore from @/lib/stores/feedsStore (feed state)
// These provide all functionality previously planned for useFeed, useHashtags, etc.

// Server-side Services - DO NOT EXPORT
// InterestBasedPollFeed is server-side only (uses 'server-only' package)
// Import directly from './lib/interest-based-feed' in API routes only
// Types can be exported:
export type { 
  PersonalizedPollFeed,
  PollRecommendation,
  InterestMatch,
  UserInterests
} from './lib/interest-based-feed';

// Utility Components
export { default as FeedItem } from './components/FeedItem';
export { default as InfiniteScroll } from './components/InfiniteScroll';

// Legacy Components - ARCHIVED
// These components have been moved to _archived/ directory
// They are replaced by the new modular architecture above
// Do not use these in new code - see _archived/README.md for migration guide
// - UnifiedFeed (old monolith) → Use UnifiedFeedRefactored
// - SocialFeed → Use UnifiedFeedRefactored
// - EnhancedSocialFeed → Use UnifiedFeedRefactored + FeedPWAEnhancer
// - FeedHashtagIntegration → Built into FeedDataProvider
