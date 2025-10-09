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

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  SparklesIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import InfiniteScroll from './InfiniteScroll';
import FeedItem from './FeedItem';

type FeedItemData = {
  id: string;
  representativeId: string;
  representativeName: string;
  representativeParty: string;
  representativeOffice: string;
  representativePhoto: string;
  contentType: 'vote' | 'bill' | 'statement' | 'social_media' | 'photo';
  title: string;
  description?: string;
  imageUrl?: string;
  url?: string;
  date: Date;
  engagementMetrics: {
    likes: number;
    shares: number;
    comments: number;
    bookmarks: number;
  };
  isPublic: boolean;
  metadata: Record<string, any>;
};

type UserPreferences = {
  state?: string;
  district?: string;
  interests?: string[];
  followedRepresentatives?: string[];
  feedPreferences?: {
    showVotes: boolean;
    showBills: boolean;
    showStatements: boolean;
    showSocialMedia: boolean;
    showPhotos: boolean;
  };
};

type EnhancedSocialFeedProps = {
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
};

export default function EnhancedSocialFeed({
  userId,
  preferences,
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
  const [feedItems, setFeedItems] = useState<FeedItemData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [likedItems, setLikedItems] = useState<Set<string>>(new Set());
  const [bookmarkedItems, setBookmarkedItems] = useState<Set<string>>(new Set());
  const [personalizationScore, setPersonalizationScore] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  const wsRef = useRef<WebSocket | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load feed items with personalization
  const loadFeedItems = useCallback(async (pageNum: number, isRefresh: boolean = false) => {
    if (isLoading) return;

    setIsLoading(true);
    if (isRefresh) {
      setIsRefreshing(true);
    }

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20',
        ...(userId && { userId }),
        ...(preferences?.state && { state: preferences.state }),
        ...(preferences?.interests && { interests: preferences.interests.join(',') }),
        ...(preferences?.followedRepresentatives && { 
          followedRepresentatives: preferences.followedRepresentatives.join(',') 
        }),
        ...(enablePersonalization && { personalization: 'true' })
      });

      const response = await fetch(`/api/civics/by-state?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(userId && { 'Authorization': `Bearer ${userId}` })
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load feed');
      }

      const data = await response.json();
      const newItems = data.items || [];

      if (isRefresh) {
        setFeedItems(newItems);
        setPage(1);
      } else {
        setFeedItems(prev => [...prev, ...newItems]);
        setPage(pageNum);
      }

      setHasMore(newItems.length === 20);
      setPersonalizationScore(data.personalizationScore || 0);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading feed:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [userId, preferences, isLoading, enablePersonalization]);

  // Load initial feed
  useEffect(() => {
    loadFeedItems(1, true);
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
          setFeedItems(prev => [data.item, ...prev]);
        } else if (data.label === 'engagement_update') {
          setFeedItems(prev => prev.map(item => 
            item.id === data.itemId 
              ? { ...item, engagementMetrics: data.engagementMetrics }
              : item
          ));
        }
      };

      // Fallback polling for updates
      refreshIntervalRef.current = setInterval(() => {
        loadFeedItems(1, true);
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
      console.log('Analytics:', event, data);
      // TODO: Implement actual analytics tracking
    }
  }, [enableAnalytics]);

  // Handle engagement actions
  const handleLike = useCallback((itemId: string) => {
    setLikedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
        trackEvent('unlike', { itemId });
      } else {
        newSet.add(itemId);
        trackEvent('like', { itemId });
      }
      return newSet;
    });

    // Update engagement metrics
    setFeedItems(prev => prev.map(item => 
      item.id === itemId 
        ? {
            ...item,
            engagementMetrics: {
              ...item.engagementMetrics,
              likes: likedItems.has(itemId) 
                ? item.engagementMetrics.likes - 1 
                : item.engagementMetrics.likes + 1
            }
          }
        : item
    ));

    onLike?.(itemId);
  }, [likedItems, onLike, trackEvent]);

  const handleBookmark = useCallback((itemId: string) => {
    setBookmarkedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });

    onBookmark?.(itemId);
  }, [onBookmark]);

  const handleShare = useCallback((itemId: string) => {
    onShare?.(itemId);
    
    // Native sharing if available
    if (navigator.share) {
      const item = feedItems.find(item => item.id === itemId);
      if (item) {
        navigator.share({
          title: item.title,
          text: item.description || '',
          url: item.url || window.location.href
        });
      }
    }
  }, [feedItems, onShare]);

  const handleComment = useCallback((itemId: string) => {
    onComment?.(itemId);
  }, [onComment]);

  const handleViewDetails = useCallback((itemId: string) => {
    onViewDetails?.(itemId);
  }, [onViewDetails]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await loadFeedItems(1, true);
  }, [loadFeedItems]);

  // Handle load more
  const handleLoadMore = useCallback(async () => {
    await loadFeedItems(page + 1, false);
  }, [loadFeedItems, page]);

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
      {isRefreshing && (
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
        hasMore={hasMore}
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
        {feedItems.map((item) => (
          <FeedItem
            key={item.id}
            item={item}
            onLike={handleLike}
            onShare={handleShare}
            onBookmark={handleBookmark}
            onComment={handleComment}
            onViewDetails={handleViewDetails}
            isLiked={likedItems.has(item.id)}
            isBookmarked={bookmarkedItems.has(item.id)}
            showEngagement={true}
            enableHaptics={enableHaptics}
          />
        ))}
      </InfiniteScroll>
    </div>
  );
}
