/**
 * Enhanced Social Feed Component
 * 
 * Instagram-like social feed with advanced features
 * Features:
 * - Smooth infinite scroll
 * - Pull-to-refresh
 * - Touch gesture support
 * - Real-time updates
 * - Personalization algorithms
 * - Enhanced engagement metrics
 * - Performance optimizations
 * - Accessibility compliance
 */

'use client';

import {
  SparklesIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import React, { useState, useEffect, useRef, useCallback } from 'react';


import type { UserPreferences } from '@/features/feeds/types';
import { 
  useFeeds, 
  useFeedsActions, 
  useFeedsLoading,
  useNotificationStore
} from '@/lib/stores';
import { logger } from '@/lib/utils/logger';

import FeedItem from './FeedItem';
import InfiniteScroll from './InfiniteScroll';


interface EnhancedSocialFeedProps {
  userId?: string;
  preferences?: UserPreferences;
  onLike?: (itemId: string) => void;
  onShare?: (itemId: string) => void;
  onBookmark?: (itemId: string) => void;
  onComment?: (itemId: string) => void;
  onViewDetails?: (itemId: string) => void;
  className?: string;
  enablePersonalization?: boolean;
  enableRealTimeUpdates?: boolean;
  enableAnalytics?: boolean;
  enableHaptics?: boolean;
  showTrending?: boolean;
}

export default function EnhancedSocialFeed({
  userId,
  preferences: _preferences,
  onLike,
  onShare,
  onBookmark,
  onComment,
  onViewDetails,
  className = '',
  enablePersonalization = true,
  enableRealTimeUpdates = true,
  enableAnalytics = false,
  enableHaptics = true,
  showTrending = true
}: EnhancedSocialFeedProps) {
  // ✅ MIGRATED: Use existing stores instead of useState
  // Feeds state from Feeds Store
  const feeds = useFeeds();
  const { loadFeeds, likeFeed, bookmarkFeed, refreshFeeds } = useFeedsActions();
  const isLoading = useFeedsLoading();
  
  // Global UI state from App Store
  
  // PWA state from PWA Store
  
  // User state from User Store
  
  // Notification state from Notification Store
  const addNotification = useNotificationStore((state: any) => state.addNotification);
  
  // ✅ Keep local state for component-specific concerns
  const [personalizationScore, setPersonalizationScore] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const wsRef = useRef<WebSocket | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load feed items with personalization
  const loadFeedItems = useCallback(async (pageNum: number, isRefresh = false) => {
    if (isLoading) return;

    try {
      // Use FeedsStore to load feeds
      if (isRefresh) {
        await refreshFeeds();
      } else {
        await loadFeeds('all');
      }

      // Update component-specific state
      setPersonalizationScore(0); // This would come from the store
      setLastUpdate(new Date());
      
      // Add notification for user feedback
      addNotification({
        type: 'success',
        title: 'Feed Updated',
        message: isRefresh ? 'Feed refreshed!' : 'New posts loaded!',
        duration: 3000
      });
    } catch (error) {
      // Error handling - could be logged to monitoring service
      console.error('Error loading feed:', error);
      addNotification({
        type: 'error',
        title: 'Feed Load Failed',
        message: 'Failed to load feed. Please try again.',
        duration: 5000
      });
    }
  }, [isLoading, loadFeeds, refreshFeeds, addNotification]);

  // Load initial feed
  useEffect(() => {
    void loadFeedItems(1, true);
  }, [loadFeedItems]);

  // Set up real-time updates
  useEffect(() => {
    if (enableRealTimeUpdates && userId) {
      // WebSocket connection for real-time updates
      const ws = new WebSocket(`wss://your-websocket-endpoint/feed/${userId}`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.label === 'new_item') {
          // Use store action to add new feed item
          // This would need to be implemented in the store
          logger.info('New item received:', data.item);
        } else if (data.label === 'engagement_update') {
          // Use store action to update engagement
          // This would need to be implemented in the store
          logger.info('Engagement update received:', data);
        }
      };

      // Fallback polling for updates
      refreshIntervalRef.current = setInterval(() => {
        void loadFeedItems(1, true);
      }, 30000); // Refresh every 30 seconds

      return () => {
        ws.close();
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [enableRealTimeUpdates, userId, loadFeedItems]);

  // Analytics tracking
  const trackEvent = useCallback((event: string, data?: any) => {
    if (enableAnalytics) {
      logger.info('Analytics:', { event, data });
      // Implement analytics tracking for social media interactions
      try {
        // Track social media click event
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'social_media_click', {
            event_category: 'civics',
            event_label: data?.platform ?? 'unknown',
            value: 1
          });
        }
        
        // Track in local analytics if available
        if (typeof window !== 'undefined' && (window as any).analytics) {
          (window as any).analytics.track('Social Media Clicked', {
            platform: data?.platform ?? 'unknown',
            handle: data?.handle ?? 'unknown',
            url: data?.url ?? 'unknown',
            representative: data?.representative ?? 'unknown'
          });
        }
      } catch (error) {
        console.warn('Analytics tracking failed:', error);
      }
    }
  }, [enableAnalytics]);

  // Handle engagement actions
  const handleLike = useCallback((itemId: string) => {
    // Use FeedsStore to like feed
    likeFeed(itemId);
    onLike?.(itemId);
    trackEvent('feed_item_liked', { itemId });
  }, [likeFeed, onLike, trackEvent]);

  const handleBookmark = useCallback((itemId: string) => {
    // Use FeedsStore to bookmark feed
    bookmarkFeed(itemId);
    onBookmark?.(itemId);
    trackEvent('feed_item_bookmarked', { itemId });
  }, [bookmarkFeed, onBookmark, trackEvent]);

  const handleShare = useCallback((itemId: string) => {
    onShare?.(itemId);
    trackEvent('feed_item_shared', { itemId });
    
    // Native sharing if available
    if (navigator.share) {
      const item = feeds.find((item: any) => item.id === itemId);
      if (item) {
        navigator.share({
          title: item.title,
          text: item.summary ?? '',
          url: item.source.url ?? window.location.href
        });
      }
    }
  }, [feeds, onShare, trackEvent]);

  const handleComment = useCallback((itemId: string) => {
    onComment?.(itemId);
    trackEvent('feed_item_commented', { itemId });
  }, [onComment, trackEvent]);

  const handleViewDetails = useCallback((itemId: string) => {
    onViewDetails?.(itemId);
  }, [onViewDetails]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await loadFeedItems(1, true);
  }, [loadFeedItems]);

  // Handle load more
  const handleLoadMore = useCallback(async () => {
    await loadFeedItems(1, false);
  }, [loadFeedItems]);

  // Format last update time
  const formatLastUpdate = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`h-full ${className}`}>
      {/* Feed Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Civic Feed</h2>
            <p className="text-sm text-gray-500">
              {enablePersonalization && personalizationScore > 0 && (
                <span className="flex items-center space-x-1">
                  <SparklesIcon className="w-4 h-4 text-blue-500" />
                  <span>Personalized for you ({personalizationScore}% match)</span>
                </span>
              )}
            </p>
          </div>
          
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            {enableRealTimeUpdates && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Live</span>
              </div>
            )}
            
            <div className="flex items-center space-x-1">
              <ClockIcon className="w-4 h-4" />
              <span>Updated {formatLastUpdate(lastUpdate)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Refresh Indicator */}
      {isLoading && (
        <div className="bg-blue-50 border-b border-blue-200 p-3">
          <div className="flex items-center justify-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            <span className="text-sm text-blue-600">Refreshing feed...</span>
          </div>
        </div>
      )}

      {/* Trending Section */}
      {showTrending && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-gray-700">Trending Now</span>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Climate Action • Voting Rights • Infrastructure
          </div>
        </div>
      )}

      {/* Enhanced Feed with Infinite Scroll */}
      <InfiniteScroll
        onLoadMore={handleLoadMore}
        hasMore={feeds.length > 0}
        isLoading={isLoading}
        onRefresh={handleRefresh}
        enableScrollToTop={true}
        enablePullToRefresh={true}
        className="h-full"
        loadingComponent={
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-gray-500">Loading more...</span>
          </div>
        }
        endComponent={
          <div className="text-center py-8 text-gray-500">
            <p>You&apos;ve reached the end of the feed</p>
            <p className="text-sm mt-1">Check back later for more updates</p>
          </div>
        }
      >
        {feeds.map((item: any) => (
          <FeedItem
            key={item.id}
            item={item} // Type conversion needed due to different FeedItem types
            onLike={handleLike}
            onShare={handleShare}
            onBookmark={handleBookmark}
            onComment={handleComment}
            onViewDetails={handleViewDetails}
            isLiked={item.userInteraction.liked}
            isBookmarked={item.userInteraction.bookmarked}
            showEngagement={true}
            enableHaptics={enableHaptics}
          />
        ))}
      </InfiniteScroll>
    </div>
  );
}
