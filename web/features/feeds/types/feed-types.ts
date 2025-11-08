/**
 * Feed Types
 * Type definitions for feed functionality.
 */

import type { FeedItemData } from '@/features/civics/lib/types/civics-types';
import type { FeedHashtagAnalytics } from '@/features/hashtags/types';

/**
 * Feed item with calculated personalization score (0-1).
 */
export type FeedItemWithScore = {
  item: FeedItemData;
  score: number;
}

/**
 * Analytics event tracking data.
 */
export type TrackEventData = {
  platform?: string;
  handle?: string;
  url?: string;
  representative?: string;
  [key: string]: unknown;
}

/**
 * Engagement action metadata.
 */
export type EngagementMetadata = {
  source?: string;
  context?: string;
  timestamp?: string;
  [key: string]: unknown;
}

/**
 * Recommended poll from hashtag-based matching.
 */
export type RecommendedPoll = {
  poll_id: string;
  title: string;
  description: string;
  hashtags?: string[];
  total_votes: number;
  created_at: string;
  relevance_score: number;
  reason?: string;
}

/**
 * Hashtag string identifier.
 */
export type PollHashtag = string;

/**
 * Hashtag engagement analytics.
 */
export type HashtagAnalytic = FeedHashtagAnalytics;

/**
 * Personalized feed based on user's hashtag interests.
 */
export type HashtagPollsFeed = {
  user_id: string;
  hashtag_interests: string[];
  recommended_polls: RecommendedPoll[];
  trending_hashtags: string[];
  hashtag_analytics: HashtagAnalytic[];
  feed_score: number;
  last_updated: Date;
}

/**
 * Type guard for FeedItemData.
 */
export function isFeedItem(item: unknown): item is FeedItemData {
  return (
    typeof item === 'object' &&
    item !== null &&
    'id' in item &&
    'title' in item
  );
}

/**
 * Type guard for RecommendedPoll.
 */
export function isRecommendedPoll(item: unknown): item is RecommendedPoll {
  return (
    typeof item === 'object' &&
    item !== null &&
    'poll_id' in item &&
    'title' in item
  );
}

export type {
  FeedItemData,
};

