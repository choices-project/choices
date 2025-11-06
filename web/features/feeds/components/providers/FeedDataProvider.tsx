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

import { useUserStore } from '@/lib/stores';
import { useFeedsStore } from '@/lib/stores/feedsStore';
import { useHashtagStore } from '@/lib/stores/hashtagStore';

type FeedDataProviderProps = {
  userId?: string;
  userDistrict?: string | null;
  enableInfiniteScroll?: boolean;
  maxItems?: number;
  children: (props: {
    feeds: any[];
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
    onLoadMore?: () => void;
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
  const feeds = useFeedsStore(state => state.feeds);
  const isLoading = useFeedsStore(state => state.isLoading);
  const storeError = useFeedsStore(state => state.error);
  const trendingHashtags = useHashtagStore(state => 
    state.trendingHashtags.map(h => {
      if (typeof h === 'string') return h;
      // TrendingHashtag has hashtag_name property
      return (h as any).hashtag_name || (h as any).name || '';
    }).filter(Boolean)
  );
  const user = useUserStore(state => state.user);
  
  // Get functions ONCE using getState() - no re-subscription
  const feedsStoreRef = useRef(useFeedsStore.getState());
  const hashtagStoreRef = useRef(useHashtagStore.getState());
  
  // Local state for hashtag filtering and district filtering
  const [selectedHashtags, setSelectedHashtags] = useState<string[]>([]);
  const [districtFilterEnabled, setDistrictFilterEnabled] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load feeds on mount - ONCE
  useEffect(() => {
    if (!userId && !user?.id) return;
    
    let mounted = true;
    
    const loadInitialFeeds = async () => {
      try {
        await feedsStoreRef.current.loadFeeds();
        if (mounted) {
          setError(null);
        }
      } catch (err) {
        console.error('Failed to load feeds:', err);
        if (mounted) {
          setError('Failed to load feeds');
        }
      }
    };
    
    loadInitialFeeds();
    
    return () => {
      mounted = false;
    };
    // Only run on mount or when userId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, user?.id]);

  // Load trending hashtags on mount - ONCE
  useEffect(() => {
    let mounted = true;
    
    const loadTrending = async () => {
      try {
        await hashtagStoreRef.current.getTrendingHashtags();
      } catch (err) {
        console.error('Failed to load trending hashtags:', err);
      }
    };
    
    if (mounted) {
      loadTrending();
    }
    
    return () => {
      mounted = false;
    };
  }, []); // Only on mount

  // Interaction handlers - use refs to avoid re-renders
  const handleLike = useCallback(async (itemId: string) => {
    try {
      await feedsStoreRef.current.likeFeed(itemId);
    } catch (err) {
      console.error('Failed to like feed:', err);
      setError('Failed to like feed');
    }
  }, []);

  const handleBookmark = useCallback(async (itemId: string) => {
    try {
      await feedsStoreRef.current.bookmarkFeed(itemId);
    } catch (err) {
      console.error('Failed to bookmark feed:', err);
      setError('Failed to bookmark feed');
    }
  }, []);

  const handleShare = useCallback((itemId: string) => {
    // Social sharing logic here
    console.log('Sharing feed:', itemId);
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      await feedsStoreRef.current.refreshFeeds();
      setError(null);
    } catch (err) {
      console.error('Failed to refresh feeds:', err);
      setError('Failed to refresh feeds');
    }
  }, []);

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
      feedsStoreRef.current.setFilters({ district: userDistrict });
    } else {
      feedsStoreRef.current.setFilters({});
    }
    
    // Refresh feeds with new filter
    feedsStoreRef.current.refreshFeeds().catch(err => {
      console.error('Failed to refresh feeds with district filter:', err);
    });
  }, [districtFilterEnabled, userDistrict]);

  const handleLoadMore = useCallback(() => {
    if (!enableInfiniteScroll || !hasMore || isLoading) return;
    setCurrentPage(prev => prev + 1);
  }, [enableInfiniteScroll, hasMore, isLoading]);

  // Check if there's more content to load
  useEffect(() => {
    const itemsPerPage = 10;
    const totalExpected = currentPage * itemsPerPage;
    setHasMore(feeds.length >= totalExpected && feeds.length < maxItems);
  }, [currentPage, feeds.length, maxItems]);

  // Filter feeds by selected hashtags
  const filteredFeeds = selectedHashtags.length > 0
    ? feeds.filter(feed => 
        feed.tags.some(tag => selectedHashtags.includes(tag))
      )
    : feeds;

  return children({
    feeds: filteredFeeds,
    isLoading,
    error: error ?? storeError,
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
    ...(enableInfiniteScroll && handleLoadMore ? { onLoadMore: handleLoadMore } : {}),
    ...(enableInfiniteScroll ? { hasMore } : {})
  });
}

