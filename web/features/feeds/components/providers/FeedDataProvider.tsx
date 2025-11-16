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

import { useFeedAnalytics } from '@/features/feeds/hooks/useFeedAnalytics';
import FeedShareDialog from '@/features/share/components/FeedShareDialog';
import { useI18n } from '@/hooks/useI18n';
import ScreenReaderSupport from '@/lib/accessibility/screen-reader';
import {
  useUser,
  useFilteredFeeds,
  useFeedsLoading,
  useFeedsError,
  useFeedsPagination,
  useFeedsActions,
  useHashtagActions,
  useTrendingHashtags,
  useNotificationActions,
} from '@/lib/stores';
import { useFeedsStore } from '@/lib/stores/feedsStore';
import type { FeedItem } from '@/lib/stores/types/feeds';
// withOptional removed
import logger from '@/lib/utils/logger';

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

  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [districtFilterEnabled, setDistrictFilterEnabled] = useState(false);
  const { trackItemShare } = useFeedAnalytics({ feedId: 'harness-feed', userId: user?.id ?? (userId ?? '') });
  const trackItemShareRef = useRef(trackItemShare);
  useEffect(() => {
    trackItemShareRef.current = trackItemShare;
  }, [trackItemShare]);
  const [shareItem, setShareItem] = useState<FeedItem | null>(null);
  const [liveMessage, setLiveMessage] = useState('');
  const previousFeedIdsRef = useRef<Set<string>>(new Set());
  const hasAnnouncedInitialRef = useRef(false);
  const initialLoadRef = useRef(false);

  const notifyFeedError = useCallback(
    (message: string) => {
      addNotification({
        type: 'error',
        title: t('feeds.provider.notifications.error.title'),
        message,
      });
    },
    [addNotification, t],
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

  useEffect(() => {
    if (!userId && !user?.id) return;
    if (initialLoadRef.current) return;

    let active = true;
    clearErrorAction();

    void (async () => {
      try {
        await loadFeeds();
        surfaceStoreError((error) =>
          t('feeds.provider.errors.loadFeeds.withReason', { error }),
        );
      } catch (err) {
        if (!active) return;
        logger.error('[HarnessFeedDataProvider] Failed to load feeds:', err);
        const shortMessage = t('feeds.provider.errors.loadFeeds.short');
        setErrorAction(shortMessage);
        notifyFeedError(shortMessage);
      } finally {
        initialLoadRef.current = true;
      }
    })();

    return () => {
      active = false;
    };
  }, [userId, user?.id, loadFeeds, clearErrorAction, setErrorAction, notifyFeedError, surfaceStoreError, t]);

  useEffect(() => {
    void (async () => {
      try {
        await getTrendingHashtags();
      } catch (err) {
        logger.warn('[HarnessFeedDataProvider] Failed to load trending hashtags:', err);
      }
    })();
  }, [getTrendingHashtags, t]);

  const handleLike = useCallback(async (itemId: string) => {
    clearErrorAction();
    try {
      await likeFeedAction(itemId);
    } catch (err) {
      logger.error('[HarnessFeedDataProvider] Failed to like feed:', err);
      const shortMessage = t('feeds.provider.errors.likeFeed.short');
      setErrorAction(shortMessage);
      notifyFeedError(t('feeds.provider.errors.likeFeed.message'));
    }
  }, [likeFeedAction, clearErrorAction, setErrorAction, notifyFeedError, t]);

  const handleBookmark = useCallback(async (itemId: string) => {
    clearErrorAction();
    try {
      await bookmarkFeedAction(itemId);
    } catch (err) {
      logger.error('[HarnessFeedDataProvider] Failed to bookmark feed:', err);
      const shortMessage = t('feeds.provider.errors.bookmarkFeed.short');
      setErrorAction(shortMessage);
      notifyFeedError(t('feeds.provider.errors.bookmarkFeed.message'));
    }
  }, [bookmarkFeedAction, clearErrorAction, setErrorAction, notifyFeedError, t]);

  const handleShare = useCallback((itemId: string) => {
    trackItemShareRef.current(itemId);
    const nextItem = feeds.find((feed) => feed.id === itemId) ?? null;
    if (!nextItem) {
      logger.warn('[HarnessFeedDataProvider] Unable to locate feed item for sharing', { itemId });
      return;
    }
    setShareItem(nextItem);
  }, [feeds]);

  const handleCloseShareDialog = useCallback(() => {
    setShareItem(null);
  }, []);

  const handleRefresh = useCallback(async () => {
    clearErrorAction();
    try {
      await refreshFeeds();
      surfaceStoreError((error) =>
        t('feeds.provider.errors.refreshFeeds.withReason', { error }),
      );
    } catch (err) {
      logger.error('[HarnessFeedDataProvider] Failed to refresh feeds:', err);
      const shortMessage = t('feeds.provider.errors.refreshFeeds.short');
      setErrorAction(shortMessage);
      notifyFeedError(shortMessage);
    }
  }, [refreshFeeds, clearErrorAction, setErrorAction, notifyFeedError, surfaceStoreError, t]);

  const handleHashtagAdd = useCallback((tag: string) => {
    if (selectedHashtags.length < 5 && !selectedHashtags.includes(tag)) {
      setSelectedHashtags((prev) => [...prev, tag]);
    }
  }, [selectedHashtags]);

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
      surfaceStoreError((error) =>
        t('feeds.provider.errors.loadMoreFeeds.withReason', { error }),
      );
    } catch (err) {
      logger.error('[HarnessFeedDataProvider] Failed to load more feeds:', err);
      const shortMessage = t('feeds.provider.errors.loadMoreFeeds.short');
      setErrorAction(shortMessage);
      notifyFeedError(shortMessage);
    }
  }, [loadMoreFeeds, setErrorAction, notifyFeedError, surfaceStoreError, t]);

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

  useEffect(() => {
    if (feeds.length === 0) {
      previousFeedIdsRef.current = new Set();
      return;
    }

    const currentIds = new Set(feeds.map((feed) => feed.id));

    if (!hasAnnouncedInitialRef.current) {
      const message = t('feeds.live.initialLoad', { count: feeds.length });
      setLiveMessage(message);
      ScreenReaderSupport.announce(message, 'polite');
      hasAnnouncedInitialRef.current = true;
    } else {
      let newCount = 0;
      feeds.forEach((feed) => {
        if (!previousFeedIdsRef.current.has(feed.id)) {
          newCount += 1;
        }
      });
      if (newCount > 0) {
        const message = t('feeds.live.newItems', { count: newCount });
        setLiveMessage(message);
        ScreenReaderSupport.announce(message, 'polite');
      }
    }

    previousFeedIdsRef.current = currentIds;
  }, [feeds, t]);

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
  const { addNotification } = useNotificationActions();
  const { trackItemShare } = useFeedAnalytics({ feedId: 'primary-feed', userId: user?.id ?? (userId ?? '') });
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

  const notifyFeedError = useCallback(
    (message: string) => {
      addNotification({
        type: 'error',
        title: t('feeds.provider.notifications.error.title'),
        message,
      });
    },
    [addNotification, t],
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

  // Load feeds on mount - ONCE
  useEffect(() => {
    if (!userId && !user?.id) return;
    if (initialLoadRef.current && !userId) return;

    let active = true;

    clearErrorAction();

    void (async () => {
      try {
        await loadFeeds();
        surfaceStoreError((error) =>
          t('feeds.provider.errors.loadFeeds.withReason', { error }),
        );
      } catch (err) {
        if (!active) return;
        logger.error('Failed to load feeds:', err);
        const shortMessage = t('feeds.provider.errors.loadFeeds.short');
        setErrorAction(shortMessage);
        notifyFeedError(shortMessage);
      } finally {
        initialLoadRef.current = true;
      }
    })();

    return () => {
      active = false;
    };
  }, [userId, user?.id, loadFeeds, clearErrorAction, setErrorAction, notifyFeedError, surfaceStoreError, t]);

  // Load trending hashtags on mount - ONCE
  useEffect(() => {
    void (async () => {
      try {
        await getTrendingHashtags();
      } catch (err) {
        logger.error('Failed to load trending hashtags:', err);
      }
    })();
  }, [getTrendingHashtags, t]); // Only on mount

  // Interaction handlers - use refs to avoid re-renders
  const handleLike = useCallback(async (itemId: string) => {
    clearErrorAction();
    try {
      await likeFeedAction(itemId);
    } catch (err) {
      logger.error('Failed to like feed:', err);
      const shortMessage = t('feeds.provider.errors.likeFeed.short');
      setErrorAction(shortMessage);
      notifyFeedError(t('feeds.provider.errors.likeFeed.message'));
    }
  }, [likeFeedAction, clearErrorAction, setErrorAction, notifyFeedError, t]);

  const handleBookmark = useCallback(async (itemId: string) => {
    clearErrorAction();
    try {
      await bookmarkFeedAction(itemId);
    } catch (err) {
      logger.error('Failed to bookmark feed:', err);
      const shortMessage = t('feeds.provider.errors.bookmarkFeed.short');
      setErrorAction(shortMessage);
      notifyFeedError(t('feeds.provider.errors.bookmarkFeed.message'));
    }
  }, [bookmarkFeedAction, clearErrorAction, setErrorAction, notifyFeedError, t]);

  const handleShare = useCallback((itemId: string) => {
    trackItemShareRef.current(itemId);
    const nextItem = feeds.find((feed) => feed.id === itemId) ?? null;
    if (!nextItem) {
      logger.warn('[FeedDataProvider] Unable to locate feed item for sharing', { itemId });
      return;
    }
    setShareItem(nextItem);
  }, [feeds]);

  const handleCloseShareDialog = useCallback(() => {
    setShareItem(null);
  }, []);

  const handleRefresh = useCallback(async () => {
    clearErrorAction();
    try {
      await refreshFeeds();
      surfaceStoreError((error) =>
        t('feeds.provider.errors.refreshFeeds.withReason', { error }),
      );
    } catch (err) {
      logger.error('Failed to refresh feeds:', err);
      const shortMessage = t('feeds.provider.errors.refreshFeeds.short');
      setErrorAction(shortMessage);
      notifyFeedError(shortMessage);
    }
  }, [refreshFeeds, clearErrorAction, setErrorAction, notifyFeedError, surfaceStoreError, t]);

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
      const shortMessage = t('feeds.provider.errors.refreshFeeds.short');
      setErrorAction(shortMessage);
      notifyFeedError(shortMessage);
    });
  }, [
    districtFilterEnabled,
    userDistrict,
    setFiltersAction,
    refreshFeeds,
    setErrorAction,
    notifyFeedError,
    t,
  ]);

  const handleLoadMore = useCallback(async () => {
    if (!enableInfiniteScroll) return;
    if (!storeHasMore) return;
    if (feeds.length >= maxItems) return;

    clearErrorAction();
    try {
      await loadMoreFeeds();
      surfaceStoreError((error) =>
        t('feeds.provider.errors.loadMoreFeeds.withReason', { error }),
      );
    } catch (err) {
      logger.error('Failed to load more feeds:', err);
      const shortMessage = t('feeds.provider.errors.loadMoreFeeds.short');
      setErrorAction(shortMessage);
      notifyFeedError(shortMessage);
    }
  }, [
    enableInfiniteScroll,
    storeHasMore,
    feeds.length,
    maxItems,
    loadMoreFeeds,
    clearErrorAction,
    setErrorAction,
    notifyFeedError,
    surfaceStoreError,
    t,
  ]);

  // Filter feeds by selected hashtags
  const filteredFeeds = selectedHashtags.length > 0
    ? feeds.filter(feed =>
        feed.tags.some(tag => selectedHashtags.includes(tag))
      )
    : feeds;

  const effectiveLimit = totalAvailable > 0 ? Math.min(maxItems, totalAvailable) : maxItems;
  const hasMore = enableInfiniteScroll && storeHasMore && feeds.length < effectiveLimit;

  useEffect(() => {
    if (feeds.length === 0) {
      previousFeedIdsRef.current = new Set();
      return;
    }

    const currentIds = new Set(feeds.map((feed) => feed.id));

    if (!hasAnnouncedInitialRef.current) {
      const message = t('feeds.live.initialLoad', { count: feeds.length });
      setLiveMessage(message);
      ScreenReaderSupport.announce(message, 'polite');
      hasAnnouncedInitialRef.current = true;
    } else {
      let newCount = 0;
      feeds.forEach((feed) => {
        if (!previousFeedIdsRef.current.has(feed.id)) {
          newCount += 1;
        }
      });
      if (newCount > 0) {
        const message = t('feeds.live.newItems', { count: newCount });
        setLiveMessage(message);
        ScreenReaderSupport.announce(message, 'polite');
      }
    }

    previousFeedIdsRef.current = currentIds;
  }, [feeds, t]);

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

