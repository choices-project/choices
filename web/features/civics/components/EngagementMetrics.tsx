/**
 * Enhanced Engagement Metrics Component
 * 
 * Advanced engagement tracking with analytics
 * Features:
 * - Real-time metrics
 * - Engagement history
 * - Social proof
 * - Performance analytics
 * - Accessibility compliance
 */

'use client';

import {
  HeartIcon,
  ChatBubbleLeftIcon,
  ShareIcon,
  BookmarkIcon,
  ChartBarIcon,
  EyeIcon,
  ClockIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartSolidIcon,
  BookmarkIcon as BookmarkSolidIcon
} from '@heroicons/react/24/solid';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { useI18n } from '@/hooks/useI18n';
import { useAnalyticsActions, useFeedsActions, useFeedById } from '@/lib/stores';
 

import type { EngagementData } from '../lib/types/civics-types';

type EngagementMetricsProps = {
  itemId: string;
  initialMetrics: EngagementData;
  onEngagement?: (action: string, itemId: string, value: number) => void;
  showAnalytics?: boolean;
  showTrending?: boolean;
  enableHaptics?: boolean;
  className?: string;
};

const HISTORY_LENGTH = 7;

export default function EngagementMetrics({
  itemId,
  initialMetrics,
  onEngagement,
  showAnalytics = false,
  showTrending = false,
  enableHaptics = false,
  className = ''
}: EngagementMetricsProps) {
  const { t, currentLanguage } = useI18n();
  const [metrics, setMetrics] = useState<EngagementData>(initialMetrics);
  const [engagementHistory, setEngagementHistory] = useState<number[]>(() => {
    const totalEngagement = initialMetrics.likes + initialMetrics.comments + initialMetrics.shares;
    return Array.from({ length: HISTORY_LENGTH }, () => totalEngagement);
  });
  const [localLiked, setLocalLiked] = useState(false);
  const [localBookmarked, setLocalBookmarked] = useState(false);
  const [mutationPending, setMutationPending] = useState(false);

  const storeFeed = useFeedById(itemId);
  const { likeFeed, unlikeFeed, shareFeed, bookmarkFeed, unbookmarkFeed } = useFeedsActions();
  const { trackUserAction } = useAnalyticsActions();

  const isLiked = storeFeed ? storeFeed.userInteraction.liked : localLiked;
  const isBookmarked = storeFeed ? storeFeed.userInteraction.bookmarked : localBookmarked;

  const compactNumberFormatter = useMemo(
    () =>
      new Intl.NumberFormat(currentLanguage ?? undefined, {
        notation: 'compact',
        maximumFractionDigits: 1,
      }),
    [currentLanguage],
  );
  const percentFormatter = useMemo(
    () =>
      new Intl.NumberFormat(currentLanguage ?? undefined, {
        maximumFractionDigits: 1,
      }),
    [currentLanguage],
  );
  const timeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(currentLanguage ?? undefined, {
        hour: 'numeric',
        minute: 'numeric',
      }),
    [currentLanguage],
  );

  useEffect(() => {
    if (!storeFeed) {
      return;
    }

    setMetrics((previous) =>
      ({
        ...previous,
        likes: storeFeed.engagement.likes ?? previous.likes,
        shares: storeFeed.engagement.shares ?? previous.shares,
        comments: storeFeed.engagement.comments ?? previous.comments,
        bookmarks: storeFeed.engagement.bookmarks ?? previous.bookmarks,
        views: storeFeed.engagement.views ?? previous.views,
        engagementRate: storeFeed.engagement.engagementRate ?? previous.engagementRate,
        lastUpdated: new Date(storeFeed.updatedAt ?? storeFeed.publishedAt ?? previous.lastUpdated),
      }),
    );

    const totalEngagement =
      storeFeed.engagement.likes + storeFeed.engagement.comments + storeFeed.engagement.shares;
    setEngagementHistory((previous) => [...previous.slice(-(HISTORY_LENGTH - 1)), totalEngagement]);
    setLocalLiked(storeFeed.userInteraction.liked);
    setLocalBookmarked(storeFeed.userInteraction.bookmarked);
  }, [storeFeed]);

  const vibrate = useCallback(() => {
    if (enableHaptics && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }
  }, [enableHaptics]);

  const pushHistory = useCallback((nextTotal: number) => {
    setEngagementHistory((previous) => [...previous.slice(-(HISTORY_LENGTH - 1)), nextTotal]);
  }, []);

  const handleLike = useCallback(async () => {
    if (mutationPending) return;
    setMutationPending(true);
    vibrate();

    const currentlyLiked = isLiked;
    const nextLikes = Math.max(0, metrics.likes + (currentlyLiked ? -1 : 1));
    const nextTotal = nextLikes + metrics.comments + metrics.shares;

    try {
      if (storeFeed) {
        if (currentlyLiked) {
          await unlikeFeed(itemId);
        } else {
          await likeFeed(itemId);
        }
      } else {
        setLocalLiked((previous) => !previous);
      }

      setMetrics((previous) => {
        const updated = {
          ...previous,
          likes: nextLikes,
          lastUpdated: new Date(),
        };
        onEngagement?.('likes', itemId, nextLikes);
        return updated;
      });
      pushHistory(nextTotal);
      trackUserAction?.(
        currentlyLiked ? 'unlike_feed_item' : 'like_feed_item',
        'civics',
        itemId,
        1
      );
    } finally {
      setMutationPending(false);
    }
  }, [
    mutationPending,
    vibrate,
    isLiked,
    metrics.likes,
    metrics.comments,
    metrics.shares,
    storeFeed,
    unlikeFeed,
    likeFeed,
    itemId,
    onEngagement,
    pushHistory,
    trackUserAction
  ]);

  const handleBookmark = useCallback(async () => {
    if (mutationPending) return;
    setMutationPending(true);
    vibrate();

    const currentlyBookmarked = isBookmarked;
    const nextBookmarks = Math.max(0, metrics.bookmarks + (currentlyBookmarked ? -1 : 1));

    try {
      if (storeFeed) {
        if (currentlyBookmarked) {
          await unbookmarkFeed(itemId);
        } else {
          await bookmarkFeed(itemId);
        }
      } else {
        setLocalBookmarked((previous) => !previous);
      }

      setMetrics((previous) => {
        const updated = {
          ...previous,
          bookmarks: nextBookmarks,
          lastUpdated: new Date(),
        };
        onEngagement?.('bookmarks', itemId, nextBookmarks);
        return updated;
      });
      trackUserAction?.(
        currentlyBookmarked ? 'unbookmark_feed_item' : 'bookmark_feed_item',
        'civics',
        itemId,
        1
      );
    } finally {
      setMutationPending(false);
    }
  }, [
    mutationPending,
    vibrate,
    isBookmarked,
    metrics.bookmarks,
    storeFeed,
    unbookmarkFeed,
    bookmarkFeed,
    itemId,
    onEngagement,
    trackUserAction
  ]);

  const handleShare = useCallback(async () => {
    if (mutationPending) return;
    setMutationPending(true);
    vibrate();

    const nextShares = metrics.shares + 1;
    const nextTotal = metrics.likes + metrics.comments + nextShares;

    try {
      if (storeFeed) {
        shareFeed(itemId);
      }

      setMetrics((previous) => {
        const updated = {
          ...previous,
          shares: nextShares,
          lastUpdated: new Date(),
        };
        onEngagement?.('shares', itemId, nextShares);
        return updated;
      });
      pushHistory(nextTotal);
      trackUserAction?.('share_feed_item', 'civics', itemId, 1);
    } finally {
      setMutationPending(false);
    }
  }, [
    mutationPending,
    vibrate,
    metrics.shares,
    metrics.likes,
    metrics.comments,
    storeFeed,
    shareFeed,
    itemId,
    onEngagement,
    pushHistory,
    trackUserAction
  ]);

  const handleComment = useCallback(() => {
    if (mutationPending) return;
    vibrate();

    const nextComments = metrics.comments + 1;
    const nextTotal = metrics.likes + nextComments + metrics.shares;

    setMetrics((previous) => {
      const updated = {
        ...previous,
        comments: nextComments,
        lastUpdated: new Date(),
      };
      onEngagement?.('comments', itemId, nextComments);
      return updated;
    });
    pushHistory(nextTotal);
    trackUserAction?.('comment_feed_item', 'civics', itemId, 1);
  }, [
    mutationPending,
    vibrate,
    metrics.comments,
    metrics.likes,
    metrics.shares,
    onEngagement,
    itemId,
    pushHistory,
    trackUserAction
  ]);

  const formatNumber = useCallback(
    (value: number) => compactNumberFormatter.format(value),
    [compactNumberFormatter],
  );

  // Get engagement rate color
  const getEngagementRateColor = (rate: number) => {
    if (rate >= 5) return 'text-green-600';
    if (rate >= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Get trending indicator
  const getTrendingIndicator = () => {
    if (engagementHistory.length < 2) return null;
    
    const current = engagementHistory[engagementHistory.length - 1];
    const previous = engagementHistory[engagementHistory.length - 2];
    if (current === undefined || previous === undefined || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    
    if (change > 10) return { direction: 'up', change: Math.abs(change) };
    if (change < -10) return { direction: 'down', change: Math.abs(change) };
    return null;
  };

  const trending = getTrendingIndicator();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Engagement Metrics */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <button
            onClick={handleLike}
            disabled={mutationPending}
            className={`flex items-center space-x-2 transition-colors ${
              isLiked 
                ? 'text-red-500' 
                : 'text-gray-500 hover:text-red-500'
            } ${mutationPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={isLiked ? t('civics.engagement.aria.unlike') : t('civics.engagement.aria.like')}
          >
            {isLiked ? (
              <HeartSolidIcon className="w-5 h-5" />
            ) : (
              <HeartIcon className="w-5 h-5" />
            )}
            <span className="text-sm font-medium">
              {formatNumber(metrics.likes)}
            </span>
          </button>
          
          <button
            onClick={handleComment}
            disabled={mutationPending}
            className={`flex items-center space-x-2 text-gray-500 hover:text-blue-500 transition-colors ${
              mutationPending ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label={t('civics.engagement.aria.comment')}
          >
            <ChatBubbleLeftIcon className="w-5 h-5" />
            <span className="text-sm font-medium">
              {formatNumber(metrics.comments)}
            </span>
          </button>
          
          <button
            onClick={handleShare}
            disabled={mutationPending}
            className={`flex items-center space-x-2 text-gray-500 hover:text-green-500 transition-colors ${
              mutationPending ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            aria-label={t('civics.engagement.aria.share')}
          >
            <ShareIcon className="w-5 h-5" />
            <span className="text-sm font-medium">
              {formatNumber(metrics.shares)}
            </span>
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleBookmark}
            disabled={mutationPending}
            className={`transition-colors ${
              isBookmarked 
                ? 'text-blue-500' 
                : 'text-gray-500 hover:text-blue-500'
            } ${mutationPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={
              isBookmarked
                ? t('civics.engagement.aria.removeBookmark')
                : t('civics.engagement.aria.addBookmark')
            }
          >
            {isBookmarked ? (
              <BookmarkSolidIcon className="w-5 h-5" />
            ) : (
              <BookmarkIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Analytics Section */}
      {showAnalytics && (
        <div className="border-t border-gray-100 pt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 text-sm text-gray-500">
                <EyeIcon className="w-4 h-4" />
                <span>{t('civics.engagement.analytics.views')}</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {formatNumber(metrics.views ?? 0)}
              </p>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center space-x-1 text-sm text-gray-500">
                <ChartBarIcon className="w-4 h-4" />
                <span>{t('civics.engagement.analytics.engagement')}</span>
              </div>
              <p className={`text-lg font-semibold ${
                metrics.engagementRate 
                  ? getEngagementRateColor(metrics.engagementRate)
                  : 'text-gray-900'
              }`}>
                {metrics.engagementRate != null
                  ? `${percentFormatter.format(metrics.engagementRate)}%`
                  : t('civics.engagement.analytics.notAvailable')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Trending Section */}
      {showTrending && trending && (
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-center space-x-2">
            <ArrowTrendingUpIcon className={`w-4 h-4 ${
              trending.direction === 'up' ? 'text-green-500' : 'text-red-500'
            }`} />
            <span className={`text-sm font-medium ${
              trending.direction === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trending.direction === 'up'
                ? t('civics.engagement.trending.up', {
                    change: percentFormatter.format(trending.change),
                  })
                : t('civics.engagement.trending.down', {
                    change: percentFormatter.format(trending.change),
                  })}
            </span>
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="flex items-center justify-center space-x-1 text-xs text-gray-400">
        <ClockIcon className="w-3 h-3" />
        <span>
          {t('civics.engagement.lastUpdated', {
            time: timeFormatter.format(new Date(metrics.lastUpdated)),
          })}
        </span>
      </div>
    </div>
  );
}
