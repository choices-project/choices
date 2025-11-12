'use client';

/**
 * FeedDataProvider Component
 * 
 * Handles data fetching and state management for feeds.
 * Integrates with Zustand stores and provides data to child components.
 * 
 * This component handles:
 * - Store subscriptions (isolated)
 * - Data loading
 * - Hashtag filtering
 * - User interactions
 * 
 * Created: November 5, 2025
 * Status: ✅ Architectural refactor
 */

import type React from 'react';
import { useEffect, useState, useCallback, useRef } from 'react';

import {
  useUser,
  useFeedsStore,
  useFeedsPagination,
  useFeedsActions,
  useHashtagActions,
  useTrendingHashtags,
} from '@/lib/stores';
import type { FeedItem } from '@/lib/stores/feedsStore';
import logger from '@/lib/utils/logger';

type FeedDataProviderProps = {
  userId?: string;
  userDistrict?: string | null;
  enableInfiniteScroll?: boolean;
  maxItems?: number;
  children: (props: {
    feeds: FeedItem[];
    isLoading: boolean;
    error: string | null;
    onLike: (id: string) => Promise<void>;
    onBookmark: (id: string) => Promise<void>;
    onShare: (id: string) => void;
    onRefresh: () => Promise<void>;
    selectedHashtags: string[];
    onHashtagAdd: (tag: string) => void;
    onHashtagRemove: (tag: string) => void;
    trendingHashtags: string[];
    districtFilterEnabled: boolean;
    onDistrictFilterToggle: () => void;
    onLoadMore?: () => Promise<void>;
    hasMore?: boolean;
  }) => React.ReactNode;
};

/**
 * Provider component that handles all data logic
 * Passes data down as render props to avoid re-render issues
 * 
 * Enhanced: November 5, 2025 - Added district filtering support
 */
export default function FeedDataProvider({ 
  userId,
  userDistrict,
  enableInfiniteScroll = true,
  maxItems = 50,
  children 
}: FeedDataProviderProps) {
  // Get ONLY data from stores (not functions)
  const feeds = useFeedsStore((state) => state.filteredFeeds);
  const isLoading = useFeedsStore((state) => state.isLoading);
  const storeError = useFeedsStore((state) => state.error);
  const { totalAvailable, hasMore: storeHasMore, loadMoreFeeds } = useFeedsPagination();
  const trendingHashtags = useTrendingHashtags()
    .map((h) => {
      if (typeof h === 'string') return h;
      return (
        (h as { hashtag_name?: string }).hashtag_name ??
        (h as { name?: string }).name ??
        ''
      );
    })
    .filter((name) => name.length > 0);
  const { getTrendingHashtags } = useHashtagActions();
  const {
    loadFeeds,
    refreshFeeds,
    likeFeed: likeFeedAction,
    bookmarkFeed: bookmarkFeedAction,
    setFilters: setFiltersAction,
    setError: setErrorAction,
    clearError: clearErrorAction,
  } = useFeedsActions();
  const user = useUser();
  
  // Local state for hashtag filtering and district filtering
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [districtFilterEnabled, setDistrictFilterEnabled] = useState(false);

  const initialLoadRef = useRef(false);

  // Load feeds on mount - ONCE
  useEffect(() => {
    if (!userId && !user?.id) return;
    if (initialLoadRef.current && !userId) return;

    let active = true;

    clearErrorAction();

    void (async () => {
      try {
        await loadFeeds();
      } catch (err) {
        if (!active) return;
        logger.error('Failed to load feeds:', err);
        setErrorAction('Failed to load feeds');
      } finally {
        initialLoadRef.current = true;
      }
    })();

    return () => {
      active = false;
    };
  }, [userId, user?.id, loadFeeds, clearErrorAction, setErrorAction]);

  // Load trending hashtags on mount - ONCE
  useEffect(() => {
    void (async () => {
      try {
        await getTrendingHashtags();
      } catch (err) {
        logger.error('Failed to load trending hashtags:', err);
      }
    })();
  }, [getTrendingHashtags]); // Only on mount

  // Interaction handlers - use refs to avoid re-renders
  const handleLike = useCallback(async (itemId: string) => {
    clearErrorAction();
    try {
      await likeFeedAction(itemId);
    } catch (err) {
      logger.error('Failed to like feed:', err);
      setErrorAction('Failed to like feed');
    }
  }, [likeFeedAction, clearErrorAction, setErrorAction]);

  const handleBookmark = useCallback(async (itemId: string) => {
    clearErrorAction();
    try {
      await bookmarkFeedAction(itemId);
    } catch (err) {
      logger.error('Failed to bookmark feed:', err);
      setErrorAction('Failed to bookmark feed');
    }
  }, [bookmarkFeedAction, clearErrorAction, setErrorAction]);

  const handleShare = useCallback((itemId: string) => {
    // Social sharing logic here
    logger.info('Sharing feed:', itemId);
  }, []);

  const handleRefresh = useCallback(async () => {
    clearErrorAction();
    try {
      await refreshFeeds();
    } catch (err) {
      logger.error('Failed to refresh feeds:', err);
      setErrorAction('Failed to refresh feeds');
    }
  }, [refreshFeeds, clearErrorAction, setErrorAction]);

  const handleHashtagAdd = useCallback((tag: string) => {
    if (selectedHashtags.length < 5 && !selectedHashtags.includes(tag)) {
      setSelectedHashtags(prev => [...prev, tag]);
    }
  }, [selectedHashtags]);

  const handleHashtagRemove = useCallback((tag: string) => {
    setSelectedHashtags(prev => prev.filter(t => t !== tag));
  }, []);

  const handleDistrictFilterToggle = useCallback(() => {
    const newValue = !districtFilterEnabled;
    setDistrictFilterEnabled(newValue);

    // Apply district filter to feeds store
    if (newValue && userDistrict) {
      setFiltersAction({ district: userDistrict });
    } else {
      setFiltersAction({ district: null });
    }

    // Refresh feeds with new filter
    refreshFeeds().catch((err) => {
      logger.error('Failed to refresh feeds with district filter:', err);
      setErrorAction('Failed to refresh feeds');
    });
  }, [districtFilterEnabled, userDistrict, setFiltersAction, refreshFeeds, setErrorAction]);

  const handleLoadMore = useCallback(async () => {
    if (!enableInfiniteScroll) return;
    if (!storeHasMore) return;
    if (feeds.length >= maxItems) return;

    clearErrorAction();
    const previousCount = useFeedsStore.getState().feeds.length;

    try {
      await loadMoreFeeds();
      const nextState = useFeedsStore.getState();

      if (nextState.error) {
        setErrorAction(nextState.error);
        return;
      }

      if (nextState.feeds.length === previousCount) {
        return;
      }
    } catch (err) {
      logger.error('Failed to load more feeds:', err);
      setErrorAction('Failed to load more feeds');
    }
  }, [
    enableInfiniteScroll,
    storeHasMore,
    feeds.length,
    maxItems,
    loadMoreFeeds,
    clearErrorAction,
    setErrorAction,
  ]);

  // Filter feeds by selected hashtags
  const filteredFeeds = selectedHashtags.length > 0
    ? feeds.filter(feed => 
        feed.tags.some(tag => selectedHashtags.includes(tag))
      )
    : feeds;

  const effectiveLimit = totalAvailable > 0 ? Math.min(maxItems, totalAvailable) : maxItems;
  const hasMore = enableInfiniteScroll && storeHasMore && feeds.length < effectiveLimit;

  return children({
    feeds: filteredFeeds,
    isLoading,
    error: storeError,
    onLike: handleLike,
    onBookmark: handleBookmark,
    onShare: handleShare,
    onRefresh: handleRefresh,
    selectedHashtags,
    onHashtagAdd: handleHashtagAdd,
    onHashtagRemove: handleHashtagRemove,
    trendingHashtags,
    districtFilterEnabled,
    onDistrictFilterToggle: handleDistrictFilterToggle,
    ...(enableInfiniteScroll ? { onLoadMore: handleLoadMore } : {}),
    ...(enableInfiniteScroll ? { hasMore } : {})
  });
}

