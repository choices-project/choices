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

// Local types from components
export type { 
  FeedHashtagIntegration as FeedHashtagIntegrationType,
  HashtagFilter,
  HashtagSort
} from './components/FeedHashtagIntegration';

// Lib utilities
export { TrendingHashtagsTracker, trendingHashtagsTracker } from './lib/TrendingHashtags';

// Hashtag-Polls Integration (Client Version)
export { 
  hashtagPollsIntegrationServiceClient as hashtagPollsIntegrationService,
  type HashtagPollIntegration,
  type HashtagFeedAnalytics,
  type PersonalizedHashtagFeed
} from './lib/hashtag-polls-integration-client';

// Components
export { default as HashtagPollsFeed } from './components/HashtagPollsFeed';

// Unified Feed Component (RECOMMENDED)
export { default as UnifiedFeed } from './components/UnifiedFeed';

// Legacy Components (DEPRECATED - Use UnifiedFeed instead)
export { default as SocialFeed } from './components/SocialFeed';
export { default as EnhancedSocialFeed } from './components/EnhancedSocialFeed';
export { default as FeedHashtagIntegration } from './components/FeedHashtagIntegration';
export { default as FeedItem } from './components/FeedItem';
export { default as InfiniteScroll } from './components/InfiniteScroll';

// Hooks (when created)
// export { useFeed } from './hooks/useFeed'
// export { useHashtags } from './hooks/useHashtags'
// export { useFeedPersonalization } from './hooks/useFeedPersonalization'

// Services (moved from polls)
// export { InterestBasedPollFeed } from './lib/interest-based-feed' // Commented out to fix hydration issue
