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

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';

import { useFeedAnalytics } from '@/features/feeds/hooks/useFeedAnalytics';
import FeedShareDialog from '@/features/share/components/FeedShareDialog';

import {
  useUser,
  useFilteredFeeds,
  useFeedsLoading,
  useFeedsError,
  useFeedsPagination,
  useHashtagActions,
  useTrendingHashtags,
  useNotificationActions,
} from '@/lib/stores';
import { useFeedsStore } from '@/lib/stores/feedsStore';
import type { FeedItem } from '@/lib/stores/types/feeds';
// withOptional removed
import logger from '@/lib/utils/logger';

import { useI18n } from '@/hooks/useI18n';

import type React from 'react';

const IS_E2E_HARNESS = process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1';

function HarnessFeedDataProvider({
  userId,
  enableInfiniteScroll = true,
  maxItems = 50,
  children,
}: FeedDataProviderProps) {
  const { t } = useI18n();
  const user = useUser();
  const { addNotification } = useNotificationActions();
  const { getTrendingHashtags } = useHashtagActions();
  const loadFeeds = useFeedsStore((state) => state.loadFeeds);
  const refreshFeeds = useFeedsStore((state) => state.refreshFeeds);
  const likeFeedAction = useFeedsStore((state) => state.likeFeed);
  const bookmarkFeedAction = useFeedsStore((state) => state.bookmarkFeed);
  const loadMoreFeeds = useFeedsStore((state) => state.loadMoreFeeds);
  const setErrorAction = useFeedsStore((state) => state.setError);
  const clearErrorAction = useFeedsStore((state) => state.clearError);
  const feeds = useFeedsStore((state) => state.filteredFeeds);
  const isLoading = useFeedsStore((state) => state.isLoading);
  const error = useFeedsStore((state) => state.error);
  const hasMore = useFeedsStore((state) => state.hasMoreFeeds);
  const totalAvailable = useFeedsStore((state) => state.totalAvailableFeeds);
  const rawTrendingHashtags = useTrendingHashtags();
  // Memoize to prevent new array reference on every render
  const trendingHashtags = useMemo(() =>
    rawTrendingHashtags
      .map((h) => {
        if (typeof h === 'string') return h;
        return (
          (h as { hashtag_name?: string }).hashtag_name ??
          (h as { name?: string }).name ??
          ''
        );
      })
      .filter((name) => name.length > 0),
    [rawTrendingHashtags]
  );

  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [districtFilterEnabled, setDistrictFilterEnabled] = useState(false);
  const harnessEffectiveUserId = user?.id ?? userId ?? '';
  const harnessAnalyticsConfig = useMemo(
    () => ({ feedId: 'harness-feed', userId: harnessEffectiveUserId }),
    [harnessEffectiveUserId]
  );
  const { trackItemShare } = useFeedAnalytics(harnessAnalyticsConfig);
  const trackItemShareRef = useRef(trackItemShare);
  useEffect(() => {
    trackItemShareRef.current = trackItemShare;
  }, [trackItemShare]);
  const [shareItem, setShareItem] = useState<FeedItem | null>(null);
  const [liveMessage, setLiveMessage] = useState('');
  const previousFeedIdsRef = useRef<Set<string>>(new Set());
  const hasAnnouncedInitialRef = useRef(false);
  const initialLoadRef = useRef(false);

  // Refs for stable callbacks
  const addNotificationRef = useRef(addNotification);
  useEffect(() => { addNotificationRef.current = addNotification; }, [addNotification]);
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);
  const likeFeedActionRef = useRef(likeFeedAction);
  useEffect(() => { likeFeedActionRef.current = likeFeedAction; }, [likeFeedAction]);
  const bookmarkFeedActionRef = useRef(bookmarkFeedAction);
  useEffect(() => { bookmarkFeedActionRef.current = bookmarkFeedAction; }, [bookmarkFeedAction]);
  const clearErrorActionRef = useRef(clearErrorAction);
  useEffect(() => { clearErrorActionRef.current = clearErrorAction; }, [clearErrorAction]);
  const setErrorActionRef = useRef(setErrorAction);
  useEffect(() => { setErrorActionRef.current = setErrorAction; }, [setErrorAction]);
  const refreshFeedsRef = useRef(refreshFeeds);
  useEffect(() => { refreshFeedsRef.current = refreshFeeds; }, [refreshFeeds]);
  const feedsRef = useRef(feeds);
  useEffect(() => { feedsRef.current = feeds; }, [feeds]);

  const notifyFeedError = useCallback(
    (message: string) => {
      addNotificationRef.current({
        type: 'error',
        title: tRef.current('feeds.provider.notifications.error.title'),
        message,
      });
    },
    [],
  );

  const surfaceStoreError = useCallback(
    (buildMessage: (error: string) => string) => {
      const latestError = useFeedsStore.getState().error;
      if (latestError) {
        notifyFeedError(buildMessage(latestError));
      }
    },
    [notifyFeedError],
  );

  // Load feeds once on mount - use minimal dependencies to prevent re-runs
  useEffect(() => {
    if (!userId && !user?.id) return;
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;

    let active = true;

    void (async () => {
      try {
        await loadFeeds();
      } catch (err) {
        if (!active) return;
        logger.error('[HarnessFeedDataProvider] Failed to load feeds:', err);
      }
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, user?.id]); // Only depend on user identity, not callbacks

  // Load trending hashtags once - use ref to prevent re-runs
  // Intentionally empty deps - we use a ref to ensure one-time execution
  // and don't want getTrendingHashtags changes to re-trigger
  const hashtagLoadAttemptedRef = useRef(false);
  useEffect(() => {
    if (hashtagLoadAttemptedRef.current) return;
    hashtagLoadAttemptedRef.current = true;

    void (async () => {
      try {
        await getTrendingHashtags();
      } catch (err) {
        // Silently fail - hashtags are optional enhancement
        logger.warn('[HarnessFeedDataProvider] Failed to load trending hashtags (non-blocking):', err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - one-time load with ref guard

  const handleLike = useCallback(async (itemId: string) => {
    clearErrorActionRef.current();
    try {
      const feed = feedsRef.current.find(f => f.id === itemId);
      const wasLiked = feed?.userInteraction?.liked ?? false;
      
      if (wasLiked) {
        const unlikeFeedAction = useFeedsStore.getState().unlikeFeed;
        await unlikeFeedAction(itemId);
        addNotificationRef.current({
          type: 'success',
          title: tRef.current('feeds.actions.unliked.title'),
          message: tRef.current('feeds.actions.unliked.message'),
          duration: 2000,
        });
      } else {
        await likeFeedActionRef.current(itemId);
        addNotificationRef.current({
          type: 'success',
          title: tRef.current('feeds.actions.liked.title'),
          message: tRef.current('feeds.actions.liked.message'),
          duration: 2000,
        });
      }
    } catch (err) {
      logger.error('[HarnessFeedDataProvider] Failed to like feed:', err);
      const shortMessage = tRef.current('feeds.provider.errors.likeFeed.short');
      setErrorActionRef.current(shortMessage);
      notifyFeedError(tRef.current('feeds.provider.errors.likeFeed.message'));
    }
  }, [notifyFeedError]);

  const handleBookmark = useCallback(async (itemId: string) => {
    clearErrorActionRef.current();
    try {
      const feed = feedsRef.current.find(f => f.id === itemId);
      const wasBookmarked = feed?.userInteraction?.bookmarked ?? false;
      
      if (wasBookmarked) {
        const unbookmarkFeedAction = useFeedsStore.getState().unbookmarkFeed;
        await unbookmarkFeedAction(itemId);
        addNotificationRef.current({
          type: 'success',
          title: tRef.current('feeds.actions.unbookmarked.title'),
          message: tRef.current('feeds.actions.unbookmarked.message'),
          duration: 2000,
        });
      } else {
        await bookmarkFeedActionRef.current(itemId);
        addNotificationRef.current({
          type: 'success',
          title: tRef.current('feeds.actions.bookmarked.title'),
          message: tRef.current('feeds.actions.bookmarked.message'),
          duration: 2000,
        });
      }
    } catch (err) {
      logger.error('[HarnessFeedDataProvider] Failed to bookmark feed:', err);
      const shortMessage = tRef.current('feeds.provider.errors.bookmarkFeed.short');
      setErrorActionRef.current(shortMessage);
      notifyFeedError(tRef.current('feeds.provider.errors.bookmarkFeed.message'));
    }
  }, [notifyFeedError]);

  const handleShare = useCallback((itemId: string) => {
    trackItemShareRef.current(itemId);
    const nextItem = feedsRef.current.find((feed) => feed.id === itemId) ?? null;
    if (!nextItem) {
      logger.warn('[HarnessFeedDataProvider] Unable to locate feed item for sharing', { itemId });
      return;
    }
    setShareItem(nextItem);
  }, []);

  const handleCloseShareDialog = useCallback(() => {
    setShareItem(null);
  }, []);

  const handleRefresh = useCallback(async () => {
    clearErrorActionRef.current();
    try {
      await refreshFeedsRef.current();
      surfaceStoreError((error) =>
        tRef.current('feeds.provider.errors.refreshFeeds.withReason', { error }),
      );
    } catch (err) {
      logger.error('[HarnessFeedDataProvider] Failed to refresh feeds:', err);
      const shortMessage = tRef.current('feeds.provider.errors.refreshFeeds.short');
      setErrorActionRef.current(shortMessage);
      notifyFeedError(shortMessage);
    }
  }, [notifyFeedError, surfaceStoreError]);

  const handleHashtagAdd = useCallback((tag: string) => {
    setSelectedHashtags((prev) => {
      if (prev.length < 5 && !prev.includes(tag)) {
        return [...prev, tag];
      }
      return prev;
    });
  }, []);

  const handleHashtagRemove = useCallback((tag: string) => {
    setSelectedHashtags((prev) => prev.filter((current) => current !== tag));
  }, []);

  const handleDistrictToggle = useCallback(() => {
    setDistrictFilterEnabled((prev) => !prev);
  }, []);

  const effectiveLimit = totalAvailable > 0 ? Math.min(maxItems, totalAvailable) : maxItems;
  const showLoadMore = enableInfiniteScroll && hasMore && feeds.length < effectiveLimit;

  const handleLoadMore = useCallback(async () => {
    try {
      await loadMoreFeeds();
    } catch (err) {
      logger.error('[HarnessFeedDataProvider] Failed to load more feeds:', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Stable reference - loadMoreFeeds is from store and stable

  const childProps = {
    feeds,
    isLoading,
    error,
    onLike: handleLike,
    onBookmark: handleBookmark,
    onShare: handleShare,
    onRefresh: handleRefresh,
    selectedHashtags,
    onHashtagAdd: handleHashtagAdd,
    onHashtagRemove: handleHashtagRemove,
    trendingHashtags,
    districtFilterEnabled,
    onDistrictFilterToggle: handleDistrictToggle,
    hasMore: showLoadMore,
  };

  const renderedChildren = children(
    showLoadMore ? { ...childProps, onLoadMore: handleLoadMore } : childProps,
  );

  // Announce feed changes for screen readers - stable deps only
  const feedsLengthRef = useRef(feeds.length);
  useEffect(() => {
    if (feeds.length === 0) {
      previousFeedIdsRef.current = new Set();
      feedsLengthRef.current = 0;
      return;
    }

    // Only run if feeds length actually changed
    if (feeds.length === feedsLengthRef.current) {
      return;
    }
    feedsLengthRef.current = feeds.length;

    const currentIds = new Set(feeds.map((feed) => feed.id));

    if (!hasAnnouncedInitialRef.current) {
      setLiveMessage(`Loaded ${feeds.length} feed items`);
      hasAnnouncedInitialRef.current = true;
    }

    previousFeedIdsRef.current = currentIds;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feeds.length]); // Only depend on length

  const LiveRegion = () => (
    <div aria-live="polite" role="status" className="sr-only" data-testid="feeds-live-message">
      {liveMessage}
    </div>
  );

  return (
    <>
      {renderedChildren}
      <LiveRegion />
      <FeedShareDialog item={shareItem} isOpen={Boolean(shareItem)} onClose={handleCloseShareDialog} />
    </>
  );
}

type FeedDataProviderProps = {
  userId?: string | null | undefined;
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
function StandardFeedDataProvider({
  userId,
  userDistrict,
  enableInfiniteScroll = true,
  maxItems = 50,
  children,
}: FeedDataProviderProps) {
  const { t } = useI18n();
  // Get ONLY data from store selectors (not full state)
  const feeds = useFilteredFeeds();
  const isLoading = useFeedsLoading();
  const storeError = useFeedsError();
  const { totalAvailable, hasMore: storeHasMore, loadMoreFeeds } = useFeedsPagination();
  const rawTrendingHashtags = useTrendingHashtags();
  // Memoize to prevent new array reference on every render
  const trendingHashtags = useMemo(() =>
    rawTrendingHashtags
      .map((h) => {
        if (typeof h === 'string') return h;
        return (
          (h as { hashtag_name?: string }).hashtag_name ??
          (h as { name?: string }).name ??
          ''
        );
      })
      .filter((name) => name.length > 0),
    [rawTrendingHashtags]
  );
  const { getTrendingHashtags } = useHashtagActions();
  // Select individual actions to avoid object recreation issues
  const loadFeeds = useFeedsStore((state) => state.loadFeeds);
  const refreshFeeds = useFeedsStore((state) => state.refreshFeeds);
  const likeFeedAction = useFeedsStore((state) => state.likeFeed);
  const bookmarkFeedAction = useFeedsStore((state) => state.bookmarkFeed);
  const setFiltersAction = useFeedsStore((state) => state.setFilters);
  const setErrorAction = useFeedsStore((state) => state.setError);
  const clearErrorAction = useFeedsStore((state) => state.clearError);
  const user = useUser();
  const { addNotification } = useNotificationActions();
  const effectiveUserId = user?.id ?? userId ?? '';
  const analyticsConfig = useMemo(
    () => ({ feedId: 'primary-feed', userId: effectiveUserId }),
    [effectiveUserId]
  );
  const { trackItemShare } = useFeedAnalytics(analyticsConfig);
  const trackItemShareRef = useRef(trackItemShare);
  useEffect(() => {
    trackItemShareRef.current = trackItemShare;
  }, [trackItemShare]);

  // Local state for hashtag filtering and district filtering
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [districtFilterEnabled, setDistrictFilterEnabled] = useState(false);
  const [shareItem, setShareItem] = useState<FeedItem | null>(null);
  const [liveMessage, setLiveMessage] = useState('');
  const previousFeedIdsRef = useRef<Set<string>>(new Set());
  const hasAnnouncedInitialRef = useRef(false);

  // Use refs for stable callbacks
  const addNotificationRef = useRef(addNotification);
  useEffect(() => { addNotificationRef.current = addNotification; }, [addNotification]);
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);

  const notifyFeedError = useCallback(
    (message: string) => {
      addNotificationRef.current({
        type: 'error',
        title: tRef.current('feeds.provider.notifications.error.title'),
        message,
      });
    },
    [],
  );

  const surfaceStoreError = useCallback(
    (buildMessage: (error: string) => string) => {
      const latestError = useFeedsStore.getState().error;
      if (latestError) {
        notifyFeedError(buildMessage(latestError));
      }
    },
    [notifyFeedError],
  );

  const initialLoadRef = useRef(false);

  // Load feeds on mount - ONCE with minimal dependencies to prevent re-runs
  useEffect(() => {
    if (!userId && !user?.id) return;
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;

    let active = true;

    void (async () => {
      try {
        await loadFeeds();
      } catch (err) {
        if (!active) return;
        logger.error('Failed to load feeds:', err);
      }
    })();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, user?.id]); // Only depend on user identity, not callbacks

  // Load trending hashtags on mount - ONCE
  // Use a ref to track if we've already attempted to load
  const hashtagLoadAttemptedRef = useRef(false);
  // Intentionally empty deps - we use a ref to ensure one-time execution
  // and don't want getTrendingHashtags changes to re-trigger
  useEffect(() => {
    if (hashtagLoadAttemptedRef.current) return;
    hashtagLoadAttemptedRef.current = true;

    void (async () => {
      try {
        await getTrendingHashtags();
      } catch (err) {
        // Silently fail - hashtags are optional enhancement
        logger.warn('Failed to load trending hashtags (non-blocking):', err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty - one-time load with ref guard

  // Refs for store actions to stabilize handlers
  const likeFeedActionRef = useRef(likeFeedAction);
  useEffect(() => { likeFeedActionRef.current = likeFeedAction; }, [likeFeedAction]);
  const bookmarkFeedActionRef = useRef(bookmarkFeedAction);
  useEffect(() => { bookmarkFeedActionRef.current = bookmarkFeedAction; }, [bookmarkFeedAction]);
  const clearErrorActionRef = useRef(clearErrorAction);
  useEffect(() => { clearErrorActionRef.current = clearErrorAction; }, [clearErrorAction]);
  const setErrorActionRef = useRef(setErrorAction);
  useEffect(() => { setErrorActionRef.current = setErrorAction; }, [setErrorAction]);
  const loadFeedsRef = useRef(loadFeeds);
  useEffect(() => { loadFeedsRef.current = loadFeeds; }, [loadFeeds]);
  const loadMoreFeedsRef = useRef(loadMoreFeeds);
  useEffect(() => { loadMoreFeedsRef.current = loadMoreFeeds; }, [loadMoreFeeds]);
  const feedsRef = useRef(feeds);
  useEffect(() => { feedsRef.current = feeds; }, [feeds]);

  // Interaction handlers - use refs to avoid re-renders
  const handleLike = useCallback(async (itemId: string) => {
    clearErrorActionRef.current();
    try {
      const feed = feedsRef.current.find(f => f.id === itemId);
      const wasLiked = feed?.userInteraction?.liked ?? false;
      
      if (wasLiked) {
        const unlikeFeedAction = useFeedsStore.getState().unlikeFeed;
        await unlikeFeedAction(itemId);
        addNotificationRef.current({
          type: 'success',
          title: tRef.current('feeds.actions.unliked.title'),
          message: tRef.current('feeds.actions.unliked.message'),
          duration: 2000,
        });
      } else {
        await likeFeedActionRef.current(itemId);
        addNotificationRef.current({
          type: 'success',
          title: tRef.current('feeds.actions.liked.title'),
          message: tRef.current('feeds.actions.liked.message'),
          duration: 2000,
        });
      }
    } catch (err) {
      logger.error('Failed to like feed:', err);
      const shortMessage = tRef.current('feeds.provider.errors.likeFeed.short');
      setErrorActionRef.current(shortMessage);
      notifyFeedError(tRef.current('feeds.provider.errors.likeFeed.message'));
    }
  }, [notifyFeedError]);

  // More refs for stable handlers
  const refreshFeedsRef = useRef(refreshFeeds);
  useEffect(() => { refreshFeedsRef.current = refreshFeeds; }, [refreshFeeds]);
  const setFiltersActionRef = useRef(setFiltersAction);
  useEffect(() => { setFiltersActionRef.current = setFiltersAction; }, [setFiltersAction]);

  const handleBookmark = useCallback(async (itemId: string) => {
    clearErrorActionRef.current();
    try {
      const feed = feedsRef.current.find(f => f.id === itemId);
      const wasBookmarked = feed?.userInteraction?.bookmarked ?? false;
      
      if (wasBookmarked) {
        const unbookmarkFeedAction = useFeedsStore.getState().unbookmarkFeed;
        await unbookmarkFeedAction(itemId);
        addNotificationRef.current({
          type: 'success',
          title: tRef.current('feeds.actions.unbookmarked.title'),
          message: tRef.current('feeds.actions.unbookmarked.message'),
          duration: 2000,
        });
      } else {
        await bookmarkFeedActionRef.current(itemId);
        addNotificationRef.current({
          type: 'success',
          title: tRef.current('feeds.actions.bookmarked.title'),
          message: tRef.current('feeds.actions.bookmarked.message'),
          duration: 2000,
        });
      }
    } catch (err) {
      logger.error('Failed to bookmark feed:', err);
      const shortMessage = tRef.current('feeds.provider.errors.bookmarkFeed.short');
      setErrorActionRef.current(shortMessage);
      notifyFeedError(tRef.current('feeds.provider.errors.bookmarkFeed.message'));
    }
  }, [notifyFeedError]);

  const handleShare = useCallback((itemId: string) => {
    trackItemShareRef.current(itemId);
    const nextItem = feedsRef.current.find((feed) => feed.id === itemId) ?? null;
    if (!nextItem) {
      logger.warn('[FeedDataProvider] Unable to locate feed item for sharing', { itemId });
      return;
    }
    setShareItem(nextItem);
  }, []);

  const handleCloseShareDialog = useCallback(() => {
    setShareItem(null);
  }, []);

  const handleRefresh = useCallback(async () => {
    clearErrorActionRef.current();
    try {
      await refreshFeedsRef.current();
      surfaceStoreError((error) =>
        tRef.current('feeds.provider.errors.refreshFeeds.withReason', { error }),
      );
    } catch (err) {
      logger.error('Failed to refresh feeds:', err);
      const shortMessage = tRef.current('feeds.provider.errors.refreshFeeds.short');
      setErrorActionRef.current(shortMessage);
      notifyFeedError(shortMessage);
    }
  }, [notifyFeedError, surfaceStoreError]);

  const handleHashtagAdd = useCallback((tag: string) => {
    setSelectedHashtags(prev => {
      if (prev.length < 5 && !prev.includes(tag)) {
        return [...prev, tag];
      }
      return prev;
    });
  }, []);

  const handleHashtagRemove = useCallback((tag: string) => {
    setSelectedHashtags(prev => prev.filter(h => h !== tag));
  }, []);

  // Refs for district toggle
  const districtFilterEnabledRef = useRef(districtFilterEnabled);
  useEffect(() => { districtFilterEnabledRef.current = districtFilterEnabled; }, [districtFilterEnabled]);
  const userDistrictRef = useRef(userDistrict);
  useEffect(() => { userDistrictRef.current = userDistrict; }, [userDistrict]);

  const handleDistrictFilterToggle = useCallback(() => {
    const newValue = !districtFilterEnabledRef.current;
    setDistrictFilterEnabled(newValue);

    // Apply district filter to feeds store
    if (newValue && userDistrictRef.current) {
      setFiltersActionRef.current({ district: userDistrictRef.current });
    } else {
      setFiltersActionRef.current({ district: null });
    }

    // Refresh feeds with new filter
    refreshFeedsRef.current().catch((err) => {
      logger.error('Failed to refresh feeds with district filter:', err);
      const shortMessage = tRef.current('feeds.provider.errors.refreshFeeds.short');
      setErrorActionRef.current(shortMessage);
      notifyFeedError(shortMessage);
    });
  }, [notifyFeedError]);

  const handleLoadMore = useCallback(async () => {
    if (!enableInfiniteScroll) return;
    try {
      await loadMoreFeedsRef.current();
    } catch (err) {
      logger.error('Failed to load more feeds:', err);
    }
  }, [enableInfiniteScroll]);

  // Filter feeds by selected hashtags
  const filteredFeeds = selectedHashtags.length > 0
    ? feeds.filter(feed =>
        feed.tags.some(tag => selectedHashtags.includes(tag))
      )
    : feeds;

  const effectiveLimit = totalAvailable > 0 ? Math.min(maxItems, totalAvailable) : maxItems;
  const hasMore = enableInfiniteScroll && storeHasMore && feeds.length < effectiveLimit;

  // Announce feed changes for screen readers - stable deps only
  const feedsCountRef = useRef(feeds.length);
  useEffect(() => {
    if (feeds.length === 0) {
      previousFeedIdsRef.current = new Set();
      feedsCountRef.current = 0;
      return;
    }

    // Only run if feeds count changed
    if (feeds.length === feedsCountRef.current) {
      return;
    }
    feedsCountRef.current = feeds.length;

    const currentIds = new Set(feeds.map((feed) => feed.id));

    if (!hasAnnouncedInitialRef.current) {
      setLiveMessage(`Loaded ${feeds.length} feed items`);
      hasAnnouncedInitialRef.current = true;
    }

    previousFeedIdsRef.current = currentIds;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feeds.length]); // Only depend on length

  const childNode = children({
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

  const LiveRegion = () => (
    <div aria-live="polite" role="status" className="sr-only" data-testid="feeds-live-message">
      {liveMessage}
    </div>
  );

  return (
    <>
      {childNode}
      <LiveRegion />
      <FeedShareDialog item={shareItem} isOpen={Boolean(shareItem)} onClose={handleCloseShareDialog} />
    </>
  );
}

export default function FeedDataProvider(props: FeedDataProviderProps) {
  if (IS_E2E_HARNESS) {
    const {
      userId,
      enableInfiniteScroll = true,
      maxItems = 50,
      children,
    } = props;

    return (
      <HarnessFeedDataProvider
        userId={userId}
        enableInfiniteScroll={enableInfiniteScroll}
        maxItems={maxItems}
      >
        {children}
      </HarnessFeedDataProvider>
    );
  }

  return <StandardFeedDataProvider {...props} />;
}

