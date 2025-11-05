'use client';

/**
 * Unified Feed Component
 * 
 * Consolidated feed component that combines all feed functionality:
 * - Social feed with Instagram-like features
 * - Hashtag-polls integration for personalized content
 * - Mobile-optimized with PWA features
 * - Real-time updates and analytics
 * - Comprehensive hashtag integration
 * 
 * This replaces: SocialFeed, EnhancedSocialFeed, FeedHashtagIntegration
 * 
 * Created: January 19, 2025
 * Status: ✅ ACTIVE
 */

import { HashtagIcon, ArrowTrendingUpIcon, ClockIcon, UserGroupIcon, ChartBarIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import { FeatureWrapper } from '@/components/shared/FeatureWrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { UserPreferences } from '@/features/civics/lib/types/civics-types';
import { useSocialSharing } from '@/hooks/useSocialSharing';
import { useHashtagStore, useHashtagActions, useHashtagStats, usePWAStore, useUserStore, useNotificationStore } from '@/lib/stores';
import { useFeedsStore } from '@/lib/stores/feedsStore';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/utils/logger';

import FeedItem from './FeedItem';
import { PollCard } from '@/features/polls';
import type { 
  FeedItemWithScore, 
  TrackEventData, 
  EngagementMetadata,
  RecommendedPoll,
  PollHashtag,
  HashtagAnalytic,
  HashtagPollsFeed
} from '../types/feed-types';

type UnifiedFeedProps = {
  userId?: string;
  preferences?: UserPreferences;
  onLike?: (itemId: string) => void;
  onShare?: (itemId: string) => void;
  onBookmark?: (itemId: string) => void;
  onComment?: (itemId: string) => void;
  onViewDetails?: (itemId: string) => void;
  onPollSelect?: (pollId: string) => void;
  onHashtagSelect?: (hashtag: string) => void;
  className?: string;
  enablePersonalization?: boolean;
  enableRealTimeUpdates?: boolean;
  enableAnalytics?: boolean;
  enableHaptics?: boolean;
  enableHashtagPolls?: boolean;
  enableMobileOptimization?: boolean;
  showTrending?: boolean;
  maxItems?: number;
}

function UnifiedFeed({
  userId,
  preferences: _preferences,
  onLike,
  onShare,
  onBookmark,
  onComment,
  onViewDetails,
  onPollSelect,
  onHashtagSelect,
  className = '',
  enablePersonalization: _enablePersonalization = true,
  enableRealTimeUpdates: _enableRealTimeUpdates = true,
  enableAnalytics = false,
  enableHaptics = true,
  enableHashtagPolls = true,
  enableMobileOptimization: _enableMobileOptimization = true,
  showTrending = true,
  maxItems = 50
}: UnifiedFeedProps) {
  console.log('[UnifiedFeed] Component rendering', { userId });
  
  // Store hooks
  const { feeds, isLoading, loadFeeds, likeFeed, bookmarkFeed, refreshFeeds } = useFeedsStore();
  const pwaStore = usePWAStore();
  const { user } = useUserStore();
  const addNotification = useNotificationStore(state => state.addNotification);
  
  // Hashtag store
  const { hashtags, trendingHashtags } = useHashtagStore();
  const { getTrendingHashtags } = useHashtagActions();
  const { trendingCount } = useHashtagStats();
  
  // Local error state
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const loadFeedsWrapped = useCallback(async () => {
    try {
      await loadFeeds();
      setLoadError(null);
    } catch (error) {
      console.error('[UnifiedFeed] store loadFeeds error:', error);
      setLoadError('Failed to load feeds');
    }
  }, [loadFeeds]);
  

  // Local state
  const [activeTab, setActiveTab] = useState('feed');
  const [hashtagPollsFeed, setHashtagPollsFeed] = useState<HashtagPollsFeed | null>(null);
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [personalizationScore, setPersonalizationScore] = useState(0);
  const [_lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [_notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [accessibilityAnnouncements, setAccessibilityAnnouncements] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [_showError, _setShowError] = useState<boolean>(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [_page, setPage] = useState(1);
  const [refreshThreshold] = useState(80);
  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useRef<HTMLDivElement>(null);
  const scrollToTopRef = useRef<HTMLButtonElement>(null);

  // Touch gesture handling (from FeedItem.tsx) - moved to pull-to-refresh section

  // PWA Features
  const initializeSuperiorPWAFeatures = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        setSwRegistration(registration);
        
        // Request notification permission
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          setNotificationPermission(permission);
          
          if (permission === 'granted' && registration) {
            await subscribeToNotifications(registration);
          }
        }
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }, []);

  // Push notification subscription
  const subscribeToNotifications = useCallback(async (registration: ServiceWorkerRegistration) => {
    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null
      });
      
      // Send subscription to server
      await fetch('/api/pwa?action=subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });
      
      logger.info('Push subscription successful');
    } catch (error) {
      console.error('Push subscription failed:', error);
    }
  }, []);

  const checkOnlineStatus = useCallback(() => {
    const handleOnline = () => {
      if (swRegistration) {
        syncOfflineData();
      }
    };
    
    const handleOffline = () => {
      // Handle offline state
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [swRegistration]);

  const syncOfflineData = useCallback(async () => {
    setSyncStatus('syncing');
    try {
      const response = await fetch('/api/pwa?action=sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, lastSync: lastSync?.toISOString() })
      });
      
      if (response.ok) {
        setLastSync(new Date());
        setSyncStatus('idle');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
    }
  }, [userId, lastSync]);

  // Accessibility helper functions
  const announceToScreenReader = useCallback((message: string) => {
    setAccessibilityAnnouncements(prev => [...prev, message]);
    if (typeof window !== 'undefined') {
    const liveRegion = document.getElementById('live-region-content');
    if (liveRegion) {
      liveRegion.textContent = message;
    }
    setTimeout(() => {
      setAccessibilityAnnouncements(prev => prev.slice(1));
      if (liveRegion) {
        liveRegion.textContent = '';
      }
    }, 5000);
    }
  }, []);

  const setError = useCallback((message: string) => {
    setErrorMessage(message);
    announceToScreenReader(`Error: ${message}`);
  }, [announceToScreenReader]);

  const clearError = useCallback(() => {
    setErrorMessage('');
  }, []);

  // Load hashtag-polls feed if enabled
  const loadHashtagPollsFeed = useCallback(async () => {
    if (!enableHashtagPolls || !userId) return;

    try {
      // Use the existing /api/feeds endpoint instead of the non-existent interest-based endpoint
      const response = await fetch(`/api/feeds?userId=${userId}&limit=20`);
      if (!response.ok) return;

      const data = await response.json();
      if (data.success && data.feeds) {
        setHashtagPollsFeed({
          user_id: userId,
          hashtag_interests: [],
          recommended_polls: data.feeds || [],
          trending_hashtags: [],
          hashtag_analytics: [],
          feed_score: 0,
          last_updated: new Date()
        });
      }
    } catch (error) {
      logger.warn('Failed to load hashtag-polls feed:', { error: error as Error });
    }
  }, [userId, enableHashtagPolls]);

  // Load feed data
  const loadFeedData = useCallback(async () => {
    console.log('[UnifiedFeed] loadFeedData called');
    try {
      console.log('[UnifiedFeed] Calling loadFeeds...');
      await loadFeeds();
      console.log('[UnifiedFeed] Calling loadHashtagPollsFeed...');
      await loadHashtagPollsFeed();
      setLastUpdate(new Date());
      console.log('[UnifiedFeed] Feed data loaded successfully');
    } catch (error) {
      console.error('[UnifiedFeed] Failed to load feed data:', error);
      logger.error('Failed to load feed data:', error as Error);
      setError('Failed to load feed data');
      console.log('[UnifiedFeed] Error state set:', error);
    }
  }, [loadFeedsWrapped, loadHashtagPollsFeed]);

  // Initialize feed data with cleanup - simplified to prevent timeout
  useEffect(() => {
    console.log('[UnifiedFeed] useEffect triggered', { userId });
    if (userId) {
      console.log('[UnifiedFeed] Loading feeds for userId:', userId);
      // Load initial feeds via store
      loadFeedsWrapped().catch(error => {
        console.error('[UnifiedFeed] Error loading feeds:', error);
        setLoadError('Failed to load feeds');
      });
    } else {
      console.log('[UnifiedFeed] No userId provided');
    }
    
    // Cleanup function to prevent memory leaks
    return () => {
      // Clear any pending timeouts
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
      // Close WebSocket connection
      if (wsRef.current) {
        wsRef.current.close();
      }
      // Disconnect intersection observer
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [userId, loadFeedsWrapped]); // Proper dependencies

  // Load trending hashtags
  useEffect(() => {
    if (showTrending) {
      getTrendingHashtags();
    }
  }, [showTrending, getTrendingHashtags]);

  /**
   * Calculate personalization score for content matching.
   * Compares user interests (hashtags they've selected) against content tags
   * to determine relevance. Used for sorting feed items.
   * 
   * @param userInterests - Array of user's selected/followed hashtags
   * @param contentTags - Array of tags associated with the content item
   * @returns Score between 0-1, where 1 is perfect match
   */
  const calculatePersonalizationScore = useCallback((userInterests: string[], contentTags: string[]) => {
    if (!userInterests.length || !contentTags.length) return 0;
    
    const matchingTags = contentTags.filter(tag => 
      userInterests.some(interest => 
        interest.toLowerCase().includes(tag.toLowerCase()) ||
        tag.toLowerCase().includes(interest.toLowerCase())
      )
    );
    
    return matchingTags.length / Math.max(userInterests.length, contentTags.length);
  }, []);

  /**
   * Filtered and personalized feed items
   * 
   * Filters feed items by:
   * - Selected hashtags
   * - Search query
   * 
   * Then applies personalization scoring to sort items by relevance
   * when user has selected hashtags (indicating interests).
   * 
   * @returns Filtered and sorted feed items, limited to maxItems
   */
  const filteredFeedItems = useMemo(() => {
    let filtered = feeds || [];

    // Filter by selected hashtags
    if (selectedHashtags.length > 0) {
      filtered = filtered.filter(item => 
        selectedHashtags.some(hashtag => 
          (item as any).hashtags?.includes(hashtag)
        )
      );
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item => 
        (item as any).title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item as any).description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply personalization scoring and sort if user has interests
    const userInterests = selectedHashtags.length > 0 ? selectedHashtags : [];
    
    if (userInterests.length > 0) {
      const scoredItems = filtered.map((feedItem): FeedItemWithScore => {
        const itemTags = (feedItem as any).hashtags ?? (feedItem as any).tags ?? [];
        const score = calculatePersonalizationScore(userInterests, itemTags);
        return { item: feedItem as any, score };
      });
      
      // Sort by personalization score (highest first)
      scoredItems.sort((a, b) => b.score - a.score);
      filtered = scoredItems.map(({ item }) => item as any) as typeof filtered;
    }

    return filtered.slice(0, maxItems);
  }, [feeds, selectedHashtags, searchQuery, maxItems, calculatePersonalizationScore]);

  // Handle hashtag selection
  const handleHashtagSelect = useCallback((hashtag: string) => {
    setSelectedHashtags(prev => {
      if (prev.includes(hashtag)) {
        return prev.filter(h => h !== hashtag);
      } else {
        return [...prev, hashtag];
      }
    });
    onHashtagSelect?.(hashtag);
  }, [onHashtagSelect]);

  // Handle poll selection
  const handlePollSelect = useCallback((pollId: string) => {
    onPollSelect?.(pollId);
  }, [onPollSelect]);

  // Analytics tracking (from EnhancedSocialFeed.tsx)
  const trackEvent = useCallback((event: string, data?: TrackEventData) => {
    if (enableAnalytics) {
      logger.info('Analytics:', { event, data });
      
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

  // Enhanced engagement tracking
  const trackEngagement = useCallback((action: string, itemId: string, metadata?: EngagementMetadata) => {
    trackEvent(`feed_item_${action}`, { itemId, ...metadata });
    
    // Update personalization score based on engagement
    if (action === 'liked' || action === 'bookmarked') {
      setPersonalizationScore(prev => Math.min(prev + 0.1, 1.0));
    }
  }, [trackEvent]);

  // Handle feed item interactions
  const handleLike = useCallback(async (itemId: string) => {
    try {
      await likeFeed(itemId);
      onLike?.(itemId);
      
      if (enableHaptics && 'vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      trackEngagement('liked', itemId);
      announceToScreenReader(`Liked item ${itemId}`);
    } catch (error) {
      logger.error('Failed to like item:', error as Error);
      setError('Failed to like item');
    }
  }, [likeFeed, onLike, enableHaptics, trackEngagement, announceToScreenReader, setError]);

  const handleBookmark = useCallback(async (itemId: string) => {
    try {
      await bookmarkFeed(itemId);
      onBookmark?.(itemId);
      
      if (enableHaptics && 'vibrate' in navigator) {
        navigator.vibrate(50);
      }
      
      trackEngagement('bookmarked', itemId);
      announceToScreenReader(`Bookmarked item ${itemId}`);
    } catch (error) {
      logger.error('Failed to bookmark item:', error as Error);
      setError('Failed to bookmark item');
    }
  }, [bookmarkFeed, onBookmark, enableHaptics, trackEngagement, announceToScreenReader, setError]);

  // Social sharing hook
  const socialSharing = useSocialSharing();

  const handleShare = useCallback(async (itemId: string) => {
    console.log('[UnifiedFeed] handleShare called with itemId:', itemId);
    if (enableHaptics && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }
    onShare?.(itemId);
    
    const item = feeds.find((feedItem) => feedItem.id === itemId);
    if (!item) {
      console.warn('Item not found for sharing:', itemId);
      return;
    }

    // Determine content type and URL
    const _contentType = (item as any).type === 'poll' ? 'poll' : 'feed';
    const shareUrl = (item as any).url || `${window.location.origin}/polls/${itemId}`;
    
    // Share using social sharing hook
    if (socialSharing && typeof socialSharing.share === 'function') {
      await socialSharing.share({
        url: shareUrl,
        title: (item as any).title,
        text: (item as any).description || (item as any).summary || ''
      });
    } else if (socialSharing && typeof socialSharing.copyToClipboard === 'function') {
      await socialSharing.copyToClipboard(shareUrl);
    }
    trackEngagement('shared', itemId);
    announceToScreenReader(`Shared item ${itemId}`);
  }, [onShare, enableHaptics, feeds, trackEngagement, announceToScreenReader, socialSharing]);

  const handleComment = useCallback((itemId: string) => {
    if (enableHaptics && 'vibrate' in navigator) {
      navigator.vibrate(25);
    }
    onComment?.(itemId);
    
    trackEngagement('commented', itemId);
    announceToScreenReader(`Opened comments for item ${itemId}`);
  }, [onComment, enableHaptics, trackEngagement, announceToScreenReader]);

  const handleViewDetails = useCallback((itemId: string) => {
    onViewDetails?.(itemId);
    
    trackEngagement('viewed_details', itemId);
    announceToScreenReader(`Viewing details for item ${itemId}`);
  }, [onViewDetails, trackEngagement, announceToScreenReader]);

  // Load more functionality
  const handleLoadMore = useCallback(async () => {
    if (hasMore && !isLoading) {
      setPage(prev => prev + 1);
      await loadFeeds();
      setHasMore(feeds.length === 20); // Adjust based on your pagination
    }
  }, [hasMore, isLoading, loadFeeds, feeds.length]);

  // Infinite scroll setup
  useEffect(() => {
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoading) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (lastItemRef.current) {
      observerRef.current.observe(lastItemRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, handleLoadMore]);

  // Scroll to top functionality
  const scrollToTop = useCallback(() => {
    if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    announceToScreenReader('Scrolled to top');
    }
  }, [announceToScreenReader]);

  // Dark mode toggle - moved to later in file

  // Refresh functionality
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await refreshFeeds();
      await loadHashtagPollsFeed();
      setLastUpdate(new Date());
      announceToScreenReader('Feed refreshed');
    } catch (error) {
      logger.error('Failed to refresh feeds:', error as Error);
      setError('Failed to refresh feed');
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshFeeds, loadHashtagPollsFeed, announceToScreenReader]); // Removed setError as it's a stable state setter

  // Real-time updates with WebSocket
  useEffect(() => {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    if (_enableRealTimeUpdates && userId && pwaStore.offline.isOnline) {
      // Only enable WebSocket if we have a valid endpoint
      const wsEndpoint = process.env.NEXT_PUBLIC_WS_ENDPOINT;
      if (wsEndpoint) {
        const ws = new WebSocket(`${wsEndpoint}/feed/${userId}`);
        wsRef.current = ws;

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          if (data.label === 'new_item') {
            logger.info('New item received:', data.item);
            announceToScreenReader('New content available');
            addNotification({
              title: 'New Content',
              message: 'New content is available in your feed',
              type: 'info'
            });
          } else if (data.label === 'engagement_update') {
            logger.info('Engagement update received:', data);
            announceToScreenReader('Engagement updated');
          }
        };

        ws.onerror = (error) => {
          logger.error('WebSocket error:', error);
        };
      }

      // Fallback polling for updates (only if online)
      if (pwaStore.offline.isOnline) {
        refreshIntervalRef.current = setInterval(() => {
          handleRefresh();
        }, 30000); // Refresh every 30 seconds
      }

      return () => {
        if (wsRef.current) {
          wsRef.current.close();
        }
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [_enableRealTimeUpdates, userId, pwaStore.offline.isOnline, announceToScreenReader, addNotification, handleRefresh]);

  // Initialize PWA features on mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'test') {
          await initializeSuperiorPWAFeatures();
          const cleanup = checkOnlineStatus();
          return cleanup;
        }
      } catch (error) {
        console.error('Error initializing app:', error);
        setError('Failed to initialize app features');
      }
    };
    
    let cleanup: (() => void) | undefined;
    const timeoutId = setTimeout(async () => {
      cleanup = await initializeApp();
    }, 0);
    
    return () => {
      clearTimeout(timeoutId);
      if (cleanup) {
        cleanup();
      }
    };
  }, [initializeSuperiorPWAFeatures, checkOnlineStatus, setError]);

  // NOTE: formatDate, getContentTypeIcon, getPartyColor removed - FeedItem component handles these internally


  /**
   * Toggle expansion state for feed item
   * 
   * FeedItem manages its own expansion state internally.
   * This function announces state changes to screen readers for accessibility.
   * 
   * @param itemId - ID of the feed item to toggle
   */
  const toggleItemExpansion = useCallback((itemId: string) => {
    // FeedItem handles expansion state internally
    // Just announce for accessibility
    announceToScreenReader(`Toggled item ${itemId}`);
  }, [announceToScreenReader]);

  // Pull-to-refresh functionality
  const handlePullToRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    announceToScreenReader('Refreshing feed...');
    
    try {
      // Refresh feed data
      await refreshFeeds();
      
      // Reset pagination
      setPage(1);
      setHasMore(true);
      
      // Announce success
      announceToScreenReader('Feed refreshed successfully');
      
      // Haptic feedback
      if (enableHaptics && 'vibrate' in navigator) {
        navigator.vibrate([50, 100, 50]);
      }
    } catch (error) {
      console.error('Pull to refresh failed:', error);
      announceToScreenReader('Failed to refresh feed');
      setError('Failed to refresh feed');
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, refreshFeeds, announceToScreenReader, enableHaptics, setError]);

  // Enhanced touch handling for pull-to-refresh
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (typeof window !== 'undefined' && window.scrollY === 0 && e.touches[0]) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || (typeof window !== 'undefined' && window.scrollY > 0) || !e.touches[0]) return;
    
    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStartRef.current.y;
    
    if (deltaY > 0) {
      const distance = Math.min(deltaY * 0.5, refreshThreshold);
      setPullDistance(distance);
      
      if (distance >= refreshThreshold && !isRefreshing) {
        announceToScreenReader('Release to refresh');
      }
    }
  }, [refreshThreshold, isRefreshing, announceToScreenReader]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current || !e.changedTouches[0]) return;
    
    const touch = e.changedTouches[0];
    const deltaY = touch.clientY - touchStartRef.current.y;
    const deltaTime = Date.now() - touchStartRef.current.time;
    
    if (deltaY >= refreshThreshold && deltaTime < 1000 && (typeof window !== 'undefined' && window.scrollY === 0)) {
      handlePullToRefresh();
    }
    
    setPullDistance(0);
    touchStartRef.current = null;
  }, [refreshThreshold, handlePullToRefresh]);

  // Dark mode functionality
  const toggleDarkMode = useCallback(() => {
    console.log('[UnifiedFeed] toggleDarkMode called');
    if (typeof window === 'undefined') return; // Client-side check
    setIsDarkMode(prev => {
      const newMode = !prev;
      console.log('[UnifiedFeed] Setting dark mode to:', newMode);
      
      // Update document class for global dark mode
      if (newMode) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
      
      // Store preference in localStorage
      localStorage.setItem('darkMode', newMode.toString());
      
      // Announce to screen reader
      announceToScreenReader(`Switched to ${newMode ? 'dark' : 'light'} mode`);
      
      // Haptic feedback
      if (enableHaptics && 'vibrate' in navigator) {
        navigator.vibrate(25);
      }
      
      return newMode;
    });
  }, [announceToScreenReader, enableHaptics]);

  // Ref for dark mode button
  const darkModeButtonRef = useRef<HTMLButtonElement>(null);

  // Mark as client-side component after hydration
  useEffect(() => {
    setIsClient(true);
    console.log('[UnifiedFeed] isClient set to true');
  }, []);

  // Initialize dark mode from localStorage and system preference
  useEffect(() => {
    // Only run on client side after hydration
    if (!isClient) return;
    
    const stored = localStorage.getItem('darkMode');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = stored ? stored === 'true' : systemPrefersDark;
    
    setIsDarkMode(shouldBeDark);
    
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
  }, [isClient]);

  // Show loading state to prevent timeout
  if (isLoading) {
    return (
      <div className={cn('unified-feed', className)} data-testid="unified-feed">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600" />
        </div>
      </div>
    );
  }

  // Show error state
  if (loadError) {
    return (
      <div className={cn('unified-feed', className)} data-testid="unified-feed">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-red-600">Error Loading Feed</h3>
            <p className="text-gray-600">{loadError}</p>
            <Button onClick={() => void loadFeeds()} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={feedRef}
      className={cn(
        "space-y-6 transition-colors duration-300",
        isDarkMode ? "bg-gray-900 text-white" : "bg-white text-gray-900",
        className
      )} 
      role="main" 
      aria-label="Unified Feed"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div 
          className="fixed top-0 left-0 right-0 z-50 bg-blue-500 text-white text-center py-2 transition-transform duration-200"
          style={{ transform: `translateY(${Math.max(0, pullDistance - 50)}px)` }}
          role="status"
          aria-live="polite"
        >
          {pullDistance >= refreshThreshold ? 'Release to refresh' : 'Pull to refresh'}
        </div>
      )}

      {/* Status Bar with PWA indicators */}
      <div className="bg-blue-50 dark:bg-blue-900 border-b border-gray-200 dark:border-gray-700 p-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1" role="status" aria-live="polite">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" aria-hidden="true" />
              <span className="text-green-600">Online</span>
            </div>
            {syncStatus === 'syncing' && (
              <div className="flex items-center space-x-1" role="status" aria-live="polite">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" aria-hidden="true" />
                <span className="text-blue-600">Syncing...</span>
              </div>
            )}
            {isRefreshing && (
              <div className="flex items-center space-x-1" role="status" aria-live="polite">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500" aria-hidden="true" />
                <span className="text-blue-600">Refreshing...</span>
              </div>
            )}
          </div>
          {lastSync && (
            <span className="text-gray-500">
              Last sync: {lastSync.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Header with feed controls */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Unified Feed</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Personalized content with hashtag-polls integration
            {personalizationScore > 0 && (
              <span className="flex items-center space-x-1 ml-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" aria-hidden="true" />
                <span>Personalized ({Math.round(personalizationScore * 100)}% match)</span>
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {/* Dark mode toggle */}
          <button
            ref={darkModeButtonRef}
            type="button"
            onClick={toggleDarkMode}
            className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
          >
            {isDarkMode ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {/* Advanced filters toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle advanced filters"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
          </button>

          {enableAnalytics && (
            <div className="text-right">
              <p className="text-sm text-gray-600 dark:text-gray-400">Personalization</p>
              <p className="text-lg font-semibold text-blue-600">
                {Math.round(personalizationScore * 100)}%
              </p>
            </div>
          )}
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            aria-label={isRefreshing ? "Refreshing feed" : "Refresh feed"}
            aria-describedby="refresh-status"
          >
            <ArrowPathIcon className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            {isRefreshing ? "Refreshing..." : "Refresh"}
          </Button>
          <div id="refresh-status" className="sr-only">
            {isRefreshing ? "Feed is being refreshed" : "Click to refresh the feed"}
          </div>
        </div>
      </header>

      {/* Advanced Filters Section */}
      {showAdvancedFilters && (
        <div 
          data-testid="advanced-filters"
          className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
          role="complementary"
          aria-label="Advanced filter options"
        >
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Advanced Filters</h4>
          <div className="space-y-2">
            <label className="block text-sm text-gray-600 dark:text-gray-400">
              <input type="checkbox" className="mr-2" /> Federal Representatives
            </label>
            <label className="block text-sm text-gray-600 dark:text-gray-400">
              <input type="checkbox" className="mr-2" /> State Representatives
            </label>
            <label className="block text-sm text-gray-600 dark:text-gray-400">
              <input type="checkbox" className="mr-2" /> Local Representatives
            </label>
            <label className="block text-sm text-gray-600 dark:text-gray-400">
              <input type="checkbox" className="mr-2" /> Trending Content
            </label>
            <label className="block text-sm text-gray-600 dark:text-gray-400">
              <input type="checkbox" className="mr-2" /> Hashtag-Polls Integration
            </label>
          </div>
        </div>
      )}

      {/* Pull-to-refresh indicator */}
      {pullDistance > 0 && (
        <div className="flex items-center justify-center py-4 text-gray-500">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
          <span className="ml-2">Pull to refresh...</span>
        </div>
      )}

      {/* Hashtag filters and search */}
      <Card role="region" aria-label="Content filters">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HashtagIcon className="h-5 w-5" aria-hidden="true" />
            Content Filters
            {selectedHashtags.length > 0 && (
              <Badge variant="secondary" aria-label={`${selectedHashtags.length} hashtags selected`}>
                {selectedHashtags.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FeatureWrapper feature="HASHTAG_FILTERING">
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <label htmlFor="content-search" className="sr-only">
                  Search content
                </label>
                <Input
                  id="content-search"
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  aria-describedby="search-help"
                />
                <HashtagIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                <div id="search-help" className="sr-only">
                  Search through feed content by title or description
                </div>
              </div>

              {/* Selected hashtags */}
              {selectedHashtags.length > 0 && (
                <div className="flex flex-wrap gap-2" role="list" aria-label="Selected hashtags">
                  {selectedHashtags.map(hashtag => (
                    <Badge
                      key={hashtag}
                      variant="default"
                      className="cursor-pointer hover:bg-red-100"
                      onClick={() => handleHashtagSelect(hashtag)}
                      role="listitem"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleHashtagSelect(hashtag);
                        }
                      }}
                      aria-label={`Remove hashtag ${hashtag} from filters`}
                    >
                      #{hashtag} ×
                    </Badge>
                  ))}
                </div>
              )}

              {/* Trending hashtags - Always enabled through hashtag system */}
              {showTrending && trendingHashtags.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Trending:</p>
                  <div className="flex flex-wrap gap-2" role="list" aria-label="Trending hashtags">
                    {(trendingHashtags as unknown as string[]).slice(0, 10).map((hashtag: string) => (
                      <Badge
                        key={hashtag}
                        variant={selectedHashtags.includes(hashtag) ? "default" : "outline"}
                        className="cursor-pointer hover:bg-blue-100"
                        onClick={() => handleHashtagSelect(hashtag)}
                        role="listitem"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleHashtagSelect(hashtag);
                          }
                        }}
                        aria-label={`${selectedHashtags.includes(hashtag) ? 'Remove' : 'Add'} hashtag ${hashtag} ${selectedHashtags.includes(hashtag) ? 'from' : 'to'} filters`}
                      >
                        <ArrowTrendingUpIcon className="h-3 w-3 mr-1" aria-hidden="true" />
                        #{hashtag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </FeatureWrapper>
        </CardContent>
      </Card>

    {/* Main content tabs */}
    <div className="mt-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} role="tablist" aria-label="Feed content sections">
        <TabsList className="grid w-full grid-cols-3" role="tablist">
          <TabsTrigger value="feed" role="tab" aria-selected={activeTab === 'feed'} aria-controls="feed-panel" data-testid="feed-tab">
            Feed
          </TabsTrigger>
          <TabsTrigger value="polls" role="tab" aria-selected={activeTab === 'polls'} aria-controls="polls-panel" data-testid="polls-tab">
            Polls
          </TabsTrigger>
          <TabsTrigger value="analytics" role="tab" aria-selected={activeTab === 'analytics'} aria-controls="analytics-panel" data-testid="analytics-tab">
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Main feed */}
        <TabsContent value="feed" className="space-y-4" id="feed-panel" role="tabpanel" aria-labelledby="feed-tab">
          {isLoading ? (
            <div className="flex items-center justify-center py-12" role="status" aria-live="polite">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" aria-hidden="true" />
              <span className="sr-only">Loading feed content...</span>
            </div>
          ) : filteredFeedItems.length === 0 ? (
            <Card role="status" aria-live="polite">
              <CardContent className="p-6 text-center">
                <HashtagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" aria-hidden="true" />
                <p className="text-gray-600">No content matches your filters</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedHashtags([]);
                    setSearchQuery('');
                  }}
                  className="mt-4"
                  aria-label="Clear all filters to show all content"
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4" role="feed" aria-label="Feed content">
              {filteredFeedItems.map((item, index) => (
                <article key={item.id} aria-posinset={index + 1} aria-setsize={filteredFeedItems.length}>
                  <FeedItem
                    item={item as any}
                    onLike={() => handleLike(item.id)}
                    onBookmark={() => handleBookmark(item.id)}
                    onShare={() => handleShare(item.id)}
                    onComment={() => handleComment(item.id)}
                    onViewDetails={() => {
                      toggleItemExpansion(item.id);
                      handleViewDetails(item.id);
                    }}
                    showEngagement={true}
                    enableHaptics={enableHaptics}
                  />
                </article>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Hashtag-polls integration - Feature Flag Controlled */}
        <TabsContent value="polls" className="space-y-4" id="polls-panel" role="tabpanel" aria-labelledby="polls-tab">
          <FeatureWrapper feature="DEMOGRAPHIC_FILTERING">
            {hashtagPollsFeed ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personalized Polls</h3>
                {hashtagPollsFeed.recommended_polls.map((poll: RecommendedPoll) => (
                <Card key={poll.poll_id} className="hover:shadow-md transition-shadow" data-testid="poll-card">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {poll.title}
                        </h3>
                        <p className="text-gray-600 mb-4">{poll.description}</p>
                        
                        {/* Poll hashtags */}
                        {poll.hashtags && poll.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {poll.hashtags.map((hashtag: PollHashtag) => (
                              <Badge
                                key={hashtag}
                                variant="outline"
                                className="cursor-pointer hover:bg-blue-100"
                                onClick={() => handleHashtagSelect(hashtag)}
                              >
                                #{hashtag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {/* Poll metadata */}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <UserGroupIcon className="h-4 w-4 mr-1" />
                            {poll.total_votes} votes
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            {new Date(poll.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <ChartBarIcon className="h-4 w-4 mr-1" />
                            {Math.round(poll.relevance_score * 100)}% match
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        {poll.reason}
                      </div>
                      <Button
                        onClick={() => handlePollSelect(poll.poll_id)}
                        className="ml-4"
                      >
                        View Poll
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <HashtagIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No personalized polls available</p>
                <p className="text-sm text-gray-500">Follow some hashtags to get personalized recommendations</p>
              </CardContent>
            </Card>
          )}
          </FeatureWrapper>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          {enableAnalytics && hashtagPollsFeed?.hashtag_analytics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hashtagPollsFeed.hashtag_analytics.map((analytic: HashtagAnalytic) => (
                <Card key={analytic.hashtag}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <HashtagIcon className="h-4 w-4" />
                      #{analytic.hashtag}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Polls:</span>
                        <span className="font-medium">{analytic.poll_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Engagement:</span>
                        <span className="font-medium">
                          {Math.round(analytic.engagement_rate * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Interest:</span>
                        <span className="font-medium">
                          {Math.round(analytic.user_interest_level * 100)}%
                        </span>
                      </div>
                      {analytic.trending_position && analytic.trending_position > 0 && (
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Trending:</span>
                          <span className="font-medium text-green-600">
                            #{analytic.trending_position}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Analytics not available</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>

    {/* Scroll to top button */}
      {feeds.length > 5 && (
        <button
          ref={scrollToTopRef}
          onClick={scrollToTop}
          className="fixed bottom-20 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-30 min-w-[44px] min-h-[44px]"
          aria-label="Scroll to top"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}

      {/* Loading indicator for infinite scroll */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          <span className="ml-3 text-gray-500">Loading more...</span>
        </div>
      )}

      {/* End of feed indicator */}
      {!hasMore && feeds.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>You&apos;ve reached the end of the feed</p>
          <p className="text-sm mt-1">Check back later for more updates</p>
        </div>
      )}

      {/* Last item ref for infinite scroll */}
      <div ref={lastItemRef} className="h-1" />

      {/* Accessibility Announcements */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      >
        {accessibilityAnnouncements.map((announcement, index) => (
          <div key={`announcement-${index}-${announcement.slice(0, 20)}`}>{announcement}</div>
        ))}
      </div>

      {/* Dedicated Live Region for Dynamic Content */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
        id="live-region"
      >
        <span id="live-region-content" />
      </div>

      {/* Error Messages */}
      {errorMessage && (
        <div 
          role="alert" 
          className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50"
        >
          {errorMessage}
          <div className="mt-2 flex gap-2">
            <button 
              onClick={loadFeedData}
              className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 min-w-[44px] min-h-[44px]"
              aria-label="Retry loading feed"
            >
              Retry
            </button>
          <button 
            onClick={clearError}
              className="px-3 py-1 text-red-700 hover:text-red-900 min-w-[44px] min-h-[44px]"
            aria-label="Close error message"
          >
            ×
          </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default UnifiedFeed;
