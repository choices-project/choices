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

import { useAnalyticsStore } from '@/lib/stores/analyticsStore';
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
  const trackEventRef = useRef(useAnalyticsStore.getState().trackEvent);

  // Track feed view on mount
  useEffect(() => {
    startTimeRef.current = Date.now();
    
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
      }
    };
  }, [enableTimeTracking, feedId, userId]);

  // Tracking functions
  const trackItemView = useCallback((itemId: string, itemType: string = 'post') => {
    if (!enableEngagementTracking) return;
    
    trackEventRef.current({
      event_type: 'feed_item_view',
      type: 'view',
      category: 'feed',
      action: 'item_view',
      label: itemId,
      session_id: '',
      event_data: { feedId, itemId, itemType, userId },
      created_at: new Date().toISOString()
    });
  }, [feedId, userId, enableEngagementTracking]);

  const trackItemLike = useCallback((itemId: string) => {
    if (!enableEngagementTracking) return;
    
    trackEventRef.current({
      event_type: 'feed_item_like',
      type: 'engagement',
      category: 'feed',
      action: 'like',
      label: itemId,
      value: 1,
      session_id: '',
      event_data: { feedId, itemId, userId },
      created_at: new Date().toISOString()
    });
  }, [feedId, userId, enableEngagementTracking]);

  const trackItemBookmark = useCallback((itemId: string) => {
    if (!enableEngagementTracking) return;
    
    trackEventRef.current({
      event_type: 'feed_item_bookmark',
      type: 'engagement',
      category: 'feed',
      action: 'bookmark',
      label: itemId,
      value: 1,
      session_id: '',
      event_data: { feedId, itemId, userId },
      created_at: new Date().toISOString()
    });
  }, [feedId, userId, enableEngagementTracking]);

  const trackItemShare = useCallback((itemId: string, platform?: string) => {
    if (!enableEngagementTracking) return;
    
    trackEventRef.current({
      event_type: 'feed_item_share',
      type: 'engagement',
      category: 'feed',
      action: 'share',
      label: itemId,
      value: 1,
      session_id: '',
      event_data: { feedId, itemId, userId, platform },
      created_at: new Date().toISOString()
    });
  }, [feedId, userId, enableEngagementTracking]);

  const trackHashtagClick = useCallback((hashtag: string) => {
    if (!enableEngagementTracking) return;
    
    trackEventRef.current({
      event_type: 'feed_hashtag_click',
      type: 'interaction',
      category: 'feed',
      action: 'hashtag_click',
      label: hashtag,
      value: 1,
      session_id: '',
      event_data: { feedId, hashtag, userId },
      created_at: new Date().toISOString()
    });
  }, [feedId, userId, enableEngagementTracking]);

  const trackFilterChange = useCallback((filterType: string, filterValue: any) => {
    if (!enableEngagementTracking) return;
    
    trackEventRef.current({
      event_type: 'feed_filter_change',
      type: 'interaction',
      category: 'feed',
      action: 'filter_change',
      label: filterType,
      session_id: '',
      event_data: { feedId, filterType, filterValue, userId },
      created_at: new Date().toISOString()
    });
  }, [feedId, userId, enableEngagementTracking]);

  return {
    trackItemView,
    trackItemLike,
    trackItemBookmark,
    trackItemShare,
    trackHashtagClick,
    trackFilterChange
  };
}

