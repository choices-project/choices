'use client';

/**
 * useFeedAnalytics Hook
 *
 * Provides analytics tracking for feed interactions:
 * - View events
 * - Engagement events (like, bookmark, share)
 * - Hashtag click tracking
 * - Scroll depth tracking
 * - Time on feed tracking
 *
 * Created: November 5, 2025
 * Status: ✅ Analytics integration
 */

import { useEffect, useCallback, useRef } from 'react';

import { useAnalyticsActions } from '@/lib/stores/analyticsStore';
import logger from '@/lib/utils/logger';

type FeedAnalyticsConfig = {
  feedId?: string;
  userId?: string;
  enableScrollTracking?: boolean;
  enableTimeTracking?: boolean;
  enableEngagementTracking?: boolean;
};

/**
 * Hook for tracking feed analytics
 * Integrates with analytics store and external services
 */
export function useFeedAnalytics(config: FeedAnalyticsConfig = {}) {
  const {
    feedId = 'unified-feed',
    userId,
    enableScrollTracking = true,
    enableTimeTracking = true,
    enableEngagementTracking = true
  } = config;

  const startTimeRef = useRef<number>(0);
  const maxScrollDepthRef = useRef<number>(0);
  const { trackEvent } = useAnalyticsActions();
  const trackEventRef = useRef(trackEvent);
  const feedIdRef = useRef(feedId);
  const userIdRef = useRef(userId);
  const enableEngagementTrackingRef = useRef(enableEngagementTracking);

  useEffect(() => {
    trackEventRef.current = trackEvent;
  }, [trackEvent]);

  useEffect(() => {
    feedIdRef.current = feedId;
  }, [feedId]);

  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);

  useEffect(() => {
    enableEngagementTrackingRef.current = enableEngagementTracking;
  }, [enableEngagementTracking]);

  // Track feed view on mount
  useEffect(() => {
    startTimeRef.current = Date.now();

    // Wrap analytics calls in try-catch to prevent failures from breaking the feed
    try {
      trackEventRef.current({
        event_type: 'feed_view',
        type: 'feed_view',
        category: 'feed',
        action: 'view',
        label: feedId,
        session_id: '',  // Added by store
        event_data: { feedId, userId },
        created_at: new Date().toISOString()
      });

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        logger.info('[Analytics] Feed viewed:', feedId);
      }
    } catch (error) {
      // Analytics failures should not break the feed
      logger.warn('[Analytics] Failed to track feed view:', error);
    }
  }, [feedId, userId]);

  // Track scroll depth
  useEffect(() => {
    if (!enableScrollTracking || typeof window === 'undefined') return;

    const handleScroll = () => {
      const scrollPercent = Math.round(
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      );

      if (scrollPercent > maxScrollDepthRef.current) {
        maxScrollDepthRef.current = scrollPercent;

        // Track milestones (25%, 50%, 75%, 100%)
        // Wrap in try-catch to prevent analytics failures from breaking scroll tracking
        try {
          if (scrollPercent >= 25 && scrollPercent < 30) {
            trackEventRef.current({
              event_type: 'feed_scroll_depth',
              type: 'scroll',
              category: 'feed',
              action: 'scroll_depth',
              label: feedId,
              value: 25,
              session_id: '',
              event_data: { feedId, depth: 25, userId },
              created_at: new Date().toISOString()
            });
          } else if (scrollPercent >= 50 && scrollPercent < 55) {
            trackEventRef.current({
              event_type: 'feed_scroll_depth',
              type: 'scroll',
              category: 'feed',
              action: 'scroll_depth',
              label: feedId,
              value: 50,
              session_id: '',
              event_data: { feedId, depth: 50, userId },
              created_at: new Date().toISOString()
            });
          } else if (scrollPercent >= 75 && scrollPercent < 80) {
            trackEventRef.current({
              event_type: 'feed_scroll_depth',
              type: 'scroll',
              category: 'feed',
              action: 'scroll_depth',
              label: feedId,
              value: 75,
              session_id: '',
              event_data: { feedId, depth: 75, userId },
              created_at: new Date().toISOString()
            });
          } else if (scrollPercent >= 100) {
            trackEventRef.current({
              event_type: 'feed_scroll_depth',
              type: 'scroll',
              category: 'feed',
              action: 'scroll_depth',
              label: feedId,
              value: 100,
              session_id: '',
              event_data: { feedId, depth: 100, userId },
              created_at: new Date().toISOString()
            });
          }
        } catch (error) {
          // Analytics failures should not break scroll tracking
          logger.warn('[Analytics] Failed to track scroll depth:', error);
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [enableScrollTracking, feedId, userId]);

  // Track time spent on unmount
  useEffect(() => {
    return () => {
      if (enableTimeTracking && startTimeRef.current > 0) {
        const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000); // seconds

        // Wrap in try-catch to prevent analytics failures from breaking cleanup
        try {
          trackEventRef.current({
            event_type: 'feed_time_spent',
            type: 'engagement',
            category: 'feed',
            action: 'time_spent',
            label: feedId,
            value: timeSpent,
            session_id: '',
            event_data: {
              feedId,
              userId,
              timeSpent,
              maxScrollDepth: maxScrollDepthRef.current
            },
            created_at: new Date().toISOString()
          });

          if (process.env.NODE_ENV === 'development') {
            logger.info('[Analytics] Time spent on feed:', timeSpent, 'seconds');
          }
        } catch (error) {
          // Analytics failures should not break component cleanup
          logger.warn('[Analytics] Failed to track time spent:', error);
        }
      }
    };
  }, [enableTimeTracking, feedId, userId]);

  // Tracking functions - use refs for stable callbacks
  // All wrapped in try-catch to prevent analytics failures from breaking feed functionality
  const trackItemView = useCallback((itemId: string, itemType: string = 'post') => {
    if (!enableEngagementTrackingRef.current) return;

    try {
      trackEventRef.current({
        event_type: 'feed_item_view',
        type: 'view',
        category: 'feed',
        action: 'item_view',
        label: itemId,
        session_id: '',
        event_data: { feedId: feedIdRef.current, itemId, itemType, userId: userIdRef.current },
        created_at: new Date().toISOString()
      });
    } catch (error) {
      logger.warn('[Analytics] Failed to track item view:', error);
    }
  }, []);

  const trackItemLike = useCallback((itemId: string) => {
    if (!enableEngagementTrackingRef.current) return;

    try {
      trackEventRef.current({
        event_type: 'feed_item_like',
        type: 'engagement',
        category: 'feed',
        action: 'like',
        label: itemId,
        value: 1,
        session_id: '',
        event_data: { feedId: feedIdRef.current, itemId, userId: userIdRef.current },
        created_at: new Date().toISOString()
      });
    } catch (error) {
      logger.warn('[Analytics] Failed to track item like:', error);
    }
  }, []);

  const trackItemBookmark = useCallback((itemId: string) => {
    if (!enableEngagementTrackingRef.current) return;

    try {
      trackEventRef.current({
        event_type: 'feed_item_bookmark',
        type: 'engagement',
        category: 'feed',
        action: 'bookmark',
        label: itemId,
        value: 1,
        session_id: '',
        event_data: { feedId: feedIdRef.current, itemId, userId: userIdRef.current },
        created_at: new Date().toISOString()
      });
    } catch (error) {
      logger.warn('[Analytics] Failed to track item bookmark:', error);
    }
  }, []);

  const trackItemShare = useCallback((itemId: string, platform?: string) => {
    if (!enableEngagementTrackingRef.current) return;

    try {
      trackEventRef.current({
        event_type: 'feed_item_share',
        type: 'engagement',
        category: 'feed',
        action: 'share',
        label: itemId,
        value: 1,
        session_id: '',
        event_data: { feedId: feedIdRef.current, itemId, userId: userIdRef.current, platform },
        created_at: new Date().toISOString()
      });
    } catch (error) {
      logger.warn('[Analytics] Failed to track item share:', error);
    }
  }, []);

  const trackHashtagClick = useCallback((hashtag: string) => {
    if (!enableEngagementTrackingRef.current) return;

    try {
      trackEventRef.current({
        event_type: 'feed_hashtag_click',
        type: 'interaction',
        category: 'feed',
        action: 'hashtag_click',
        label: hashtag,
        value: 1,
        session_id: '',
        event_data: { feedId: feedIdRef.current, hashtag, userId: userIdRef.current },
        created_at: new Date().toISOString()
      });
    } catch (error) {
      logger.warn('[Analytics] Failed to track hashtag click:', error);
    }
  }, []);

  const trackFilterChange = useCallback((filterType: string, filterValue: unknown) => {
    if (!enableEngagementTrackingRef.current) return;

    try {
      trackEventRef.current({
        event_type: 'feed_filter_change',
        type: 'interaction',
        category: 'feed',
        action: 'filter_change',
        label: filterType,
        session_id: '',
        event_data: { feedId: feedIdRef.current, filterType, filterValue, userId: userIdRef.current },
        created_at: new Date().toISOString()
      });
    } catch (error) {
      logger.warn('[Analytics] Failed to track filter change:', error);
    }
  }, []);

  return {
    trackItemView,
    trackItemLike,
    trackItemBookmark,
    trackItemShare,
    trackHashtagClick,
    trackFilterChange
  };
}

