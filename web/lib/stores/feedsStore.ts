/**
 * Feeds Store - Zustand Implementation
 *
 * Comprehensive content feed state management including feed data,
 * filtering, search, user preferences, and content interactions.
 * Consolidates feed state management and content preferences.
 *
 * Created: October 10, 2025
 * Last Updated: November 5, 2025
 * Status: ✅ REFACTORED - Eliminated 67 lines via helper function
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import type { ApiSuccessResponse } from '@/lib/api/types';
import { withOptional } from '@/lib/util/objects';
import { logger } from '@/lib/utils/logger';
import { PrivacyDataType, hasPrivacyConsent } from '@/lib/utils/privacy-guard';

import {
  type FeedCategory,
  type FeedFilters,
  type FeedItem,
  type FeedPreferences,
  type FeedSearch,
  type FeedEngagement,
  type FeedUserInteraction,
  type FeedsStore,
  type FeedsApiPayload,
} from './types/feeds';
import { createSafeStorage } from './storage';

type FetchFeedsParams = {
  category?: string | null;
  district?: string | null;
  limit?: number;
  sort?: string | null;
};

type FeedSearchResponse = {
  items: FeedItem[];
  total: number;
  suggestions?: string[];
};

const mapSortPreferenceToParam = (sortBy: FeedPreferences['sortBy']): string => {
  switch (sortBy) {
    case 'popular':
      return 'popular';
    case 'trending':
      return 'trending';
    case 'newest':
      return 'newest';
    case 'oldest':
      return 'oldest';
    case 'relevance':
      return 'trending';
    default:
      return 'trending';
  }
};

const buildFeedsQueryString = (params: FetchFeedsParams = {}): string => {
  const searchParams = new URLSearchParams();

  if (params.limit != null) {
    searchParams.set('limit', String(params.limit));
  }
  if (params.category && params.category !== 'all') {
    searchParams.set('category', params.category);
  }
  if (params.district) {
    searchParams.set('district', params.district);
  }
  if (params.sort) {
    searchParams.set('sort', params.sort);
  }

  return searchParams.toString();
};

const filterFeeds = (feeds: FeedItem[], filters: FeedFilters): FeedItem[] => {
  if (!feeds.length) {
    return feeds;
  }

  return feeds.filter((feed) => {
    if (filters.categories.length > 0 && !filters.categories.includes(feed.category)) {
      return false;
    }
    if (filters.types.length > 0 && !filters.types.includes(feed.type)) {
      return false;
    }
    if (filters.sources.length > 0 && !filters.sources.includes(feed.source.name)) {
      return false;
    }
    if (filters.readStatus === 'read' && !feed.userInteraction.read) {
      return false;
    }
    if (filters.readStatus === 'unread' && feed.userInteraction.read) {
      return false;
    }
    if (filters.tags.length > 0 && !filters.tags.some((tag) => feed.tags.includes(tag))) {
      return false;
    }
    if (filters.language && filters.language !== 'all' && feed.metadata.language !== filters.language) {
      return false;
    }
    if (filters.dateRange.start) {
      const feedDate = new Date(feed.publishedAt).getTime();
      const startDate = new Date(filters.dateRange.start).getTime();
      if (!Number.isNaN(startDate) && feedDate < startDate) {
        return false;
      }
    }
    if (filters.dateRange.end) {
      const feedDate = new Date(feed.publishedAt).getTime();
      const endDate = new Date(filters.dateRange.end).getTime();
      if (!Number.isNaN(endDate) && feedDate > endDate) {
        return false;
      }
    }
    if (filters.district && feed.district && feed.district !== filters.district) {
      return false;
    }

    return true;
  });
};

const mergeUniqueFeeds = (current: FeedItem[], incoming: FeedItem[]): FeedItem[] => {
  if (!incoming.length) {
    return current;
  }

  const seenIds = new Set(current.map((feed) => feed.id));
  const next = current.slice();

  for (const feed of incoming) {
    if (!seenIds.has(feed.id)) {
      next.push(feed);
      seenIds.add(feed.id);
    }
  }

  return next;
};

const parseFeedsPayload = (
  raw: unknown,
  fallback: Pick<FetchFeedsParams, 'category' | 'district' | 'sort'>
): FeedsApiPayload => {
  if (raw && typeof raw === 'object' && 'success' in raw) {
    const successPayload = raw as ApiSuccessResponse<FeedsApiPayload>;
    return successPayload.data;
  }

  if (raw && typeof raw === 'object' && 'feeds' in raw) {
    const payload = raw as Partial<FeedsApiPayload>;
    if (Array.isArray(payload.feeds)) {
      return {
        feeds: payload.feeds as FeedItem[],
        count: typeof payload.count === 'number' ? payload.count : payload.feeds.length,
        filters: {
          category: payload.filters?.category ?? fallback.category ?? 'all',
          district: payload.filters?.district ?? fallback.district ?? null,
          sort: payload.filters?.sort ?? fallback.sort ?? 'trending',
        },
      };
    }
  }

  if (Array.isArray(raw)) {
    const feeds = raw as FeedItem[];
    return {
      feeds,
      count: feeds.length,
      filters: {
        category: fallback.category ?? 'all',
        district: fallback.district ?? null,
        sort: fallback.sort ?? 'trending',
      },
    };
  }

  throw new Error('Invalid feeds response payload');
};

const fetchFeedsFromApi = async (params: FetchFeedsParams = {}): Promise<FeedsApiPayload> => {
  const query = buildFeedsQueryString(params);
  const endpoint = `/api/feeds${query ? `?${query}` : ''}`;

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch feeds (status ${response.status})`);
  }

  const raw = await response.json();
  return parseFeedsPayload(raw, {
    category: params.category ?? 'all',
    district: params.district ?? null,
    sort: params.sort ?? 'trending',
  });
};

const parseFeedSearchPayload = (raw: unknown): FeedSearchResponse => {
  if (raw && typeof raw === 'object' && 'success' in raw) {
    const successPayload = raw as ApiSuccessResponse<FeedSearchResponse>;
    return successPayload.data;
  }

  if (raw && typeof raw === 'object' && 'items' in raw) {
    const payload = raw as Partial<FeedSearchResponse>;
    if (Array.isArray(payload.items) && typeof payload.total === 'number') {
      return {
        items: payload.items as FeedItem[],
        total: payload.total,
        suggestions: payload.suggestions ?? [],
      };
    }
  }

  if (Array.isArray(raw)) {
    const items = raw as FeedItem[];
    return {
      items,
      total: items.length,
      suggestions: [],
    };
  }

  throw new Error('Invalid feed search response payload');
};

// Default feed preferences
const defaultPreferences: FeedPreferences = {
  defaultView: 'list',
  sortBy: 'newest',
  itemsPerPage: 20,
  autoRefresh: true,
  refreshInterval: 15,
  notifications: {
    newContent: true,
    trendingContent: true,
    categoryUpdates: false,
    authorUpdates: false,
  },
  privacy: {
    showReadHistory: false,
    showBookmarks: true,
    showLikes: true,
    shareActivity: false,
  },
  content: {
    showImages: true,
    showVideos: true,
    showAudio: true,
    autoPlay: false,
    quality: 'medium',
  },
};

// Default feed filters
const defaultFilters: FeedFilters = {
  categories: [],
  types: [],
  sources: [],
  dateRange: {
    start: '',
    end: '',
  },
  readStatus: 'all',
  engagement: 'all',
  language: 'all',
  tags: [],
  district: null,
};

const assignDefined = <T extends Record<string, unknown>>(
  base: T,
  updates: Partial<T>
): T => {
  const next: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(updates)) {
    if (value === undefined) continue;
    next[key] = value;
  }
  return next as T;
};

const mergeFeed = (feed: FeedItem, updates: Partial<FeedItem>) =>
  assignDefined(feed, updates);

const mergeUserInteraction = (
  interaction: FeedUserInteraction,
  updates: Partial<FeedUserInteraction>
) =>
  assignDefined(interaction, updates);

const mergeEngagement = (
  engagement: FeedEngagement,
  updates: Partial<FeedEngagement>
) =>
  assignDefined(engagement, updates);

const mergeFilters = (filters: FeedFilters, updates: Partial<FeedFilters>) => {
  const { dateRange, ...rest } = updates;
  const next = assignDefined(filters, rest);
  if (dateRange) {
    next.dateRange = assignDefined(filters.dateRange, dateRange);
  }
  return next;
};

const mergeSearchState = (search: FeedSearch, updates: Partial<FeedSearch>) =>
  assignDefined(search, updates);

const mergeCategory = (category: FeedCategory, updates: Partial<FeedCategory>) =>
  assignDefined(category, updates);

const mergePreferences = (preferences: FeedPreferences, updates: Partial<FeedPreferences>) => {
  const { notifications, privacy, content, ...rest } = updates;
  const next = assignDefined(preferences, rest);
  if (notifications) {
    next.notifications = assignDefined(preferences.notifications, notifications);
  }
  if (privacy) {
    next.privacy = assignDefined(preferences.privacy, privacy);
  }
  if (content) {
    next.content = assignDefined(preferences.content, content);
  }
  return next;
};

const cloneFilters = (): FeedFilters => ({
  ...defaultFilters,
  categories: [...defaultFilters.categories],
  types: [...defaultFilters.types],
  sources: [...defaultFilters.sources],
  tags: [...defaultFilters.tags],
  dateRange: { ...defaultFilters.dateRange },
});

const clonePreferences = (): FeedPreferences => ({
  ...defaultPreferences,
  notifications: { ...defaultPreferences.notifications },
  privacy: { ...defaultPreferences.privacy },
  content: { ...defaultPreferences.content },
});

const prependItem = <T>(items: T[], item: T): T[] => {
  const next = items.slice();
  next.unshift(item);
  return next;
};

// Create feeds store with middleware
export const useFeedsStore = create<FeedsStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        feeds: [],
        filteredFeeds: [],
        categories: [],
        search: {
          query: '',
          results: [],
          totalResults: 0,
          currentPage: 1,
          totalPages: 1,
          filters: cloneFilters(),
          suggestions: [],
          recentSearches: [],
        },
        currentView: 'list',
        selectedFeed: null,
        selectedCategory: null,
        filters: cloneFilters(),
        preferences: clonePreferences(),
        privacySettings: null, // 🔒 Will be set from user profile
        totalAvailableFeeds: 0,
        hasMoreFeeds: false,
        isLoading: false,
        isSearching: false,
        isRefreshing: false,
        isUpdating: false,
        error: null,

        // Feed management actions
        setFeeds: (feeds) => set((state) => ({
          feeds,
          filteredFeeds: filterFeeds(feeds, state.filters),
          totalAvailableFeeds: feeds.length,
          hasMoreFeeds: false,
        })),

        addFeed: (feed) => set((state) => {
          const nextFeeds = prependItem(state.feeds, feed);
          return {
            feeds: nextFeeds,
            filteredFeeds: filterFeeds(nextFeeds, state.filters),
            totalAvailableFeeds: state.totalAvailableFeeds + 1,
          };
        }),

        updateFeed: (id, updates) => set((state) => ({
          feeds: state.feeds.map((feed) =>
            feed.id === id ? mergeFeed(feed, updates) : feed
          ),
          filteredFeeds: state.filteredFeeds.map((feed) =>
            feed.id === id ? mergeFeed(feed, updates) : feed
          ),
        })),

        removeFeed: (id) => set((state) => ({
          feeds: state.feeds.filter(feed => feed.id !== id),
          filteredFeeds: state.filteredFeeds.filter(feed => feed.id !== id),
          totalAvailableFeeds: Math.max(0, state.totalAvailableFeeds - 1),
        })),

        refreshFeeds: async () => {
          const { isRefreshing } = get();
          if (isRefreshing) return;

          try {
            set({ isRefreshing: true, error: null });

            const currentState = get();
            const payload = await fetchFeedsFromApi({
              category: currentState.selectedCategory,
              district: currentState.filters.district ?? null,
              limit: currentState.preferences.itemsPerPage,
              sort: mapSortPreferenceToParam(currentState.preferences.sortBy),
            });

            const nextFeeds = payload.feeds;
            set({
              feeds: nextFeeds,
              filteredFeeds: filterFeeds(nextFeeds, currentState.filters),
              totalAvailableFeeds: payload.count,
              hasMoreFeeds: payload.count > nextFeeds.length,
              isRefreshing: false,
            });

            logger.info('Feeds refreshed successfully', {
              count: payload.count,
              category: payload.filters.category,
              district: payload.filters.district,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ error: errorMessage, isRefreshing: false });
            logger.error('Failed to refresh feeds:', error instanceof Error ? error : new Error(errorMessage));
          }
        },

        loadMoreFeeds: async () => {
          const { isLoading } = get();
          const currentState = get();
          if (isLoading || !currentState.hasMoreFeeds) return;

          try {
            set({ isLoading: true, error: null });

            const limit = currentState.feeds.length + currentState.preferences.itemsPerPage;
            const payload = await fetchFeedsFromApi({
              category: currentState.selectedCategory,
              district: currentState.filters.district ?? null,
              limit,
              sort: mapSortPreferenceToParam(currentState.preferences.sortBy),
            });

            const mergedFeeds = mergeUniqueFeeds(currentState.feeds, payload.feeds);
            set({
              feeds: mergedFeeds,
              filteredFeeds: filterFeeds(mergedFeeds, currentState.filters),
              totalAvailableFeeds: payload.count,
              hasMoreFeeds: payload.count > mergedFeeds.length,
              isLoading: false,
            });

            logger.info('More feeds loaded', {
              appended: payload.feeds.length,
              total: mergedFeeds.length,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ error: errorMessage, isLoading: false });
            logger.error('Failed to load more feeds:', error instanceof Error ? error : new Error(errorMessage));
          }
        },

        // Filtering and search actions
        setFilters: (filters) => set((state) => {
          const newFilters = mergeFilters(state.filters, filters);
          return {
            filters: newFilters,
            filteredFeeds: filterFeeds(state.feeds, newFilters),
          };
        }),

        clearFilters: () => set((state) => {
          const resetFilters = cloneFilters();
          return {
            filters: resetFilters,
            filteredFeeds: filterFeeds(state.feeds, resetFilters),
          };
        }),

        searchFeeds: async (query) => {
          const { setSearching, setError } = get();

          try {
            setSearching(true);
            setError(null);

            const response = await fetch('/api/feeds/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify({ query }),
            });

            if (!response.ok) {
              throw new Error('Failed to search feeds');
            }

            const payload = parseFeedSearchPayload(await response.json());

            set((state) => ({
              search: mergeSearchState(state.search, {
                query,
                results: payload.items,
                totalResults: payload.total,
                currentPage: 1,
                totalPages: Math.max(1, Math.ceil(payload.total / state.preferences.itemsPerPage)),
                suggestions: payload.suggestions ?? [],
              }),
            }));

            logger.info('Feeds searched', {
              query,
              returned: payload.items.length,
              total: payload.total,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to search feeds:', error instanceof Error ? error : new Error(errorMessage));
          } finally {
            setSearching(false);
          }
        },

        setSearchQuery: (query) => set((state) => ({
          search: mergeSearchState(state.search, { query }),
        })),

        clearSearch: () => set((state) => ({
          search: mergeSearchState(state.search, {
            query: '',
            results: [],
            totalResults: 0,
            currentPage: 1,
            totalPages: 1,
          }),
        })),

        // Feed interaction actions (🔒 Privacy-aware)
        // Note: These update UI state immediately, but only persist if user has consented
        likeFeed: async (id) => {
          const currentState = get();
          const canTrack = hasPrivacyConsent(currentState.privacySettings, PrivacyDataType.FEED_ACTIVITY);

          if (!canTrack) {
            logger.debug('Feed like not tracked - no user consent', { feedId: id });
          }

          set((state) =>
            updateFeedInBothArrays(state, id, (feed) =>
              mergeFeed(feed, {
                userInteraction: mergeUserInteraction(feed.userInteraction, { liked: true }),
                engagement: mergeEngagement(feed.engagement, {
                  likes: feed.engagement.likes + 1,
                }),
              })
            )
          );

          if (canTrack) {
            try {
              await get().saveUserInteraction(id, { liked: true });
            } catch (error) {
              logger.error('Failed to save like interaction', error);
            }
          }
        },

        unlikeFeed: async (id) => {
          const currentState = get();
          const canTrack = hasPrivacyConsent(currentState.privacySettings, PrivacyDataType.FEED_ACTIVITY);

          set((state) =>
            updateFeedInBothArrays(state, id, (feed) =>
              mergeFeed(feed, {
                userInteraction: mergeUserInteraction(feed.userInteraction, { liked: false }),
                engagement: mergeEngagement(feed.engagement, {
                  likes: Math.max(0, feed.engagement.likes - 1),
                }),
              })
            )
          );

          if (canTrack) {
            try {
              await get().saveUserInteraction(id, { liked: false });
            } catch (error) {
              logger.error('Failed to persist unlike interaction', error);
            }
          }
        },

        shareFeed: (id) =>
          set((state) =>
            updateFeedInBothArrays(state, id, (feed) =>
              mergeFeed(feed, {
                userInteraction: mergeUserInteraction(feed.userInteraction, { shared: true }),
                engagement: mergeEngagement(feed.engagement, {
                  shares: feed.engagement.shares + 1,
                }),
              })
            )
          ),

        bookmarkFeed: async (id) => {
          const currentState = get();
          const canTrack = hasPrivacyConsent(currentState.privacySettings, PrivacyDataType.FEED_ACTIVITY);

          set((state) =>
            updateFeedInBothArrays(state, id, (feed) =>
              mergeFeed(feed, {
                userInteraction: mergeUserInteraction(feed.userInteraction, { bookmarked: true }),
              })
            )
          );

          if (canTrack) {
            try {
              await get().saveUserInteraction(id, { bookmarked: true });
            } catch (error) {
              logger.error('Failed to save bookmark interaction', error);
            }
          }
        },

        unbookmarkFeed: async (id) => {
          const currentState = get();
          const canTrack = hasPrivacyConsent(currentState.privacySettings, PrivacyDataType.FEED_ACTIVITY);

          set((state) =>
            updateFeedInBothArrays(state, id, (feed) =>
              mergeFeed(feed, {
                userInteraction: mergeUserInteraction(feed.userInteraction, { bookmarked: false }),
              })
            )
          );

          if (canTrack) {
            try {
              await get().saveUserInteraction(id, { bookmarked: false });
            } catch (error) {
              logger.error('Failed to remove bookmark interaction', error);
            }
          }
        },

        markAsRead: async (id) => {
          const currentState = get();
          const canTrack = hasPrivacyConsent(currentState.privacySettings, PrivacyDataType.FEED_ACTIVITY);

          if (!canTrack) {
            logger.debug('Feed read tracking skipped - no user consent', { feedId: id });
            return;
          }

          const readAt = new Date().toISOString();

          set((state) =>
            updateFeedInBothArrays(state, id, (feed) =>
              mergeFeed(feed, {
                userInteraction: mergeUserInteraction(feed.userInteraction, {
                  read: true,
                  readAt,
                }),
              })
            )
          );

          try {
            await get().saveUserInteraction(id, { read: true, readAt });
          } catch (error) {
            logger.error('Failed to save read interaction', error);
          }
        },

        markAsUnread: async (id) => {
          const currentState = get();
          const canTrack = hasPrivacyConsent(currentState.privacySettings, PrivacyDataType.FEED_ACTIVITY);

          set((state) =>
            updateFeedInBothArrays(state, id, (feed) =>
              mergeFeed(feed, {
                userInteraction: mergeUserInteraction(feed.userInteraction, {
                  read: false,
                  readAt: null,
                }),
              })
            )
          );

          if (canTrack) {
            try {
              await get().saveUserInteraction(id, { read: false, readAt: null });
            } catch (error) {
              logger.error('Failed to persist unread interaction', error);
            }
          }
        },

        // Category actions
        setCategories: (categories) => set({ categories }),

        toggleCategory: (categoryId) => set((state) => ({
          categories: state.categories.map((category) =>
            category.id === categoryId
              ? mergeCategory(category, { enabled: !category.enabled })
              : category
          ),
        })),

        setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),

        // Preferences actions
        updatePreferences: (preferences) => set((state) => ({
          preferences: mergePreferences(state.preferences, preferences),
        })),

        resetPreferences: () => set({ preferences: clonePreferences() }),

        // View management actions
        setCurrentView: (view) => set({ currentView: view }),

        setSelectedFeed: (feed) => set({ selectedFeed: feed }),

        // Data operations
        loadFeeds: async (category) => {
          try {
            set({ isLoading: true, error: null });

            const currentState = get();
            const payload = await fetchFeedsFromApi({
              category: category ?? currentState.selectedCategory,
              district: currentState.filters.district ?? null,
              limit: currentState.preferences.itemsPerPage,
              sort: mapSortPreferenceToParam(currentState.preferences.sortBy),
            });

            const nextSelectedCategory = category ?? currentState.selectedCategory;
            set({
              feeds: payload.feeds,
              filteredFeeds: filterFeeds(payload.feeds, currentState.filters),
              isLoading: false,
              selectedCategory: nextSelectedCategory ?? null,
              totalAvailableFeeds: payload.count,
              hasMoreFeeds: payload.count > payload.feeds.length,
            });

            logger.info('Feeds loaded', {
              category: payload.filters.category,
              count: payload.count,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ feeds: [], filteredFeeds: [], isLoading: false, error: errorMessage });
            logger.error('Failed to load feeds:', error instanceof Error ? error : new Error(errorMessage));
          }
        },

        loadCategories: async () => {
          try {
            set({ isLoading: true, error: null });

            const response = await fetch('/api/feeds/categories', {
              method: 'GET',
              headers: { Accept: 'application/json' },
            });

            if (!response.ok) {
              throw new Error('Failed to load categories');
            }

            const raw = await response.json();
            const categories = Array.isArray(raw)
              ? raw
              : Array.isArray(raw?.data)
                ? raw.data
                : Array.isArray(raw?.categories)
                  ? raw.categories
                  : [];

            if (!Array.isArray(categories)) {
              throw new Error('Invalid categories response payload');
            }

            set({
              categories: categories as FeedCategory[],
              isLoading: false,
            });

            logger.info('Feed categories loaded', {
              count: categories.length,
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ error: errorMessage, isLoading: false });
            logger.error('Failed to load categories:', error instanceof Error ? error : new Error(errorMessage));
          }
        },

        saveUserInteraction: async (feedId, interaction) => {
          try {
            set({ isUpdating: true, error: null });

            const response = await fetch('/api/feeds/interactions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ feedId, interaction }),
            });

            if (!response.ok) {
              throw new Error('Failed to save user interaction');
            }

            set({ isUpdating: false });
            logger.info('User interaction saved', {
              feedId,
              interaction
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ error: errorMessage, isUpdating: false });
            logger.error('Failed to save user interaction:', error instanceof Error ? error : new Error(errorMessage));
          }
        },

        // Loading state actions
        setLoading: (loading) => set({ isLoading: loading }),
        setSearching: (searching) => set({ isSearching: searching }),
        setRefreshing: (refreshing) => set({ isRefreshing: refreshing }),
        setUpdating: (updating) => set({ isUpdating: updating }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),

        // 🔒 Privacy management
        setPrivacySettings: (settings) => {
          set({ privacySettings: settings });
          logger.debug('Feed privacy settings updated', {
            canTrackActivity: hasPrivacyConsent(settings, PrivacyDataType.FEED_ACTIVITY),
          });
        },
        setTotalAvailableFeeds: (count) => set({ totalAvailableFeeds: Math.max(0, count) }),
        setHasMoreFeeds: (hasMore) => set({ hasMoreFeeds: hasMore }),
      }),
      {
        name: 'feeds-store',
        storage: createSafeStorage(),
        partialize: (state) => ({
          feeds: state.feeds,
          categories: state.categories,
          preferences: state.preferences,
          filters: state.filters,
          currentView: state.currentView,
        }),
      }
    ),
    { name: 'feeds-store' }
  )
);

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Helper function to update a feed in both feeds and filteredFeeds arrays
 * Eliminates code duplication in feed mutation methods
 *
 * @param state - Current store state
 * @param feedId - ID of the feed to update
 * @param updater - Function to transform the feed
 * @returns Object with updated feeds and filteredFeeds arrays
 */
function updateFeedInBothArrays(
  state: FeedsStore,
  feedId: string,
  updater: (feed: FeedItem) => FeedItem
): { feeds: FeedItem[]; filteredFeeds: FeedItem[] } {
  const updateFeed = (feed: FeedItem) =>
    feed.id === feedId ? updater(feed) : feed;

  return {
    feeds: state.feeds.map(updateFeed),
    filteredFeeds: state.filteredFeeds.map(updateFeed),
  };
}

// ============================================================================
// STORE SELECTORS
// ============================================================================

// Store selectors for optimized re-renders
export const useFeeds = () => useFeedsStore(state => state.feeds);
export const useFilteredFeeds = () => useFeedsStore(state => state.filteredFeeds);
export const useFeedCategories = () => useFeedsStore(state => state.categories);
export const useFeedSearch = () => useFeedsStore(state => state.search);
export const useSelectedFeed = () => useFeedsStore(state => state.selectedFeed);
export const useFeedPreferences = () => useFeedsStore(state => state.preferences);
export const useFeedFilters = () => useFeedsStore(state => state.filters);
export const useFeedsLoading = () => useFeedsStore(state => state.isLoading);
export const useFeedsError = () => useFeedsStore(state => state.error);
export const useFeedsTotalAvailable = () => useFeedsStore(state => state.totalAvailableFeeds);
export const useFeedsHasMore = () => useFeedsStore(state => state.hasMoreFeeds);
export const useFeedsPagination = () => {
  const loadMoreFeeds = useFeedsStore(state => state.loadMoreFeeds);
  const totalAvailable = useFeedsStore(state => state.totalAvailableFeeds);
  const loaded = useFeedsStore(state => state.feeds.length);
  const hasMore = useFeedsStore(state => state.hasMoreFeeds);

  return {
    totalAvailable,
    loaded,
    remaining: Math.max(0, totalAvailable - loaded),
    hasMore,
    loadMoreFeeds,
  };
};

// Action selectors - FIXED: Use individual selectors to prevent infinite re-renders
export const useFeedsActions = () => useFeedsStore(state => state);

// Computed selectors - FIXED: Use individual selectors to prevent infinite re-renders
export const useFeedsStats = () => {
  const totalFeeds = useFeedsStore(state => state.feeds.length);
  const filteredFeeds = useFeedsStore(state => state.filteredFeeds.length);
  const totalCategories = useFeedsStore(state => state.categories.length);
  const enabledCategories = useFeedsStore(state => state.categories.filter(cat => cat.enabled).length);
  const searchResults = useFeedsStore(state => state.search.results.length);
  const totalAvailable = useFeedsStore(state => state.totalAvailableFeeds);
  const hasMoreFeeds = useFeedsStore(state => state.hasMoreFeeds);
  const isLoading = useFeedsStore(state => state.isLoading);
  const isSearching = useFeedsStore(state => state.isSearching);
  const error = useFeedsStore(state => state.error);

  return {
    totalFeeds,
    filteredFeeds,
    totalCategories,
    enabledCategories,
    searchResults,
    totalAvailable,
    hasMoreFeeds,
    isLoading,
    isSearching,
    error,
  };
};

export const useBookmarkedFeeds = () => useFeedsStore(state =>
  state.feeds.filter(feed => feed.userInteraction.bookmarked)
);

export const useUnreadFeeds = () => useFeedsStore(state =>
  state.feeds.filter(feed => !feed.userInteraction.read)
);

export const useLikedFeeds = () => useFeedsStore(state =>
  state.feeds.filter(feed => feed.userInteraction.liked)
);

// Store utilities
export const feedsStoreUtils = {
  /**
   * Get feeds summary
   */
  getFeedsSummary: () => {
    const state = useFeedsStore.getState();
    return {
      totalFeeds: state.feeds.length,
      filteredFeeds: state.filteredFeeds.length,
      totalAvailableFeeds: state.totalAvailableFeeds,
      hasMoreFeeds: state.hasMoreFeeds,
      categories: state.categories.length,
      searchResults: state.search.results.length,
      preferences: state.preferences,
    };
  },

  /**
   * Get feeds by category
   */
  getFeedsByCategory: (category: string) => {
    const state = useFeedsStore.getState();
    return state.feeds.filter(feed => feed.category === category);
  },

  /**
   * Get feeds by type
   */
  getFeedsByType: (type: string) => {
    const state = useFeedsStore.getState();
    return state.feeds.filter(feed => feed.type === type);
  },

  /**
   * Get pagination metadata
   */
  getPagination: () => {
    const state = useFeedsStore.getState();
    return {
      totalAvailableFeeds: state.totalAvailableFeeds,
      loadedFeeds: state.feeds.length,
      hasMoreFeeds: state.hasMoreFeeds,
    };
  },

  /**
   * Get trending feeds
   */
  getTrendingFeeds: () => {
    const state = useFeedsStore.getState();
    return state.feeds
      .slice()
      .sort((a, b) => (b.engagement.likes + b.engagement.shares) - (a.engagement.likes + a.engagement.shares))
      .slice(0, 10);
  },

  /**
   * Get recent feeds
   */
  getRecentFeeds: (limit = 10) => {
    const state = useFeedsStore.getState();
    return state.feeds
      .slice()
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, limit);
  }
};

// Store subscriptions for external integrations
export const feedsStoreSubscriptions = {
  /**
   * Subscribe to feeds changes
   */
  onFeedsChange: (callback: (feeds: FeedItem[]) => void) => {
    return useFeedsStore.subscribe(
      (state) => {
        callback(state.feeds);
      }
    );
  },

  /**
   * Subscribe to search results changes
   */
  onSearchResultsChange: (callback: (results: FeedItem[]) => void) => {
    return useFeedsStore.subscribe(
      (state) => {
        callback(state.search.results);
      }
    );
  },

  /**
   * Subscribe to preferences changes
   */
  onPreferencesChange: (callback: (preferences: FeedPreferences) => void) => {
    return useFeedsStore.subscribe(
      (state) => {
        callback(state.preferences);
      }
    );
  }
};

// Store debugging utilities
export const feedsStoreDebug = {
  /**
   * Log current feeds state
   */
  logState: () => {
    const state = useFeedsStore.getState();
    logger.debug('Feeds Store State', {
      totalFeeds: state.feeds.length,
      filteredFeeds: state.filteredFeeds.length,
      totalAvailableFeeds: state.totalAvailableFeeds,
      hasMoreFeeds: state.hasMoreFeeds,
      categories: state.categories.length,
      searchResults: state.search.results.length,
      currentView: state.currentView,
      selectedCategory: state.selectedCategory,
      isLoading: state.isLoading,
      error: state.error
    });
  },

  /**
   * Log feeds summary
   */
  logSummary: () => {
    const summary = feedsStoreUtils.getFeedsSummary();
    logger.debug('Feeds Summary', summary);
  },

  /**
   * Log feeds by category
   */
  logFeedsByCategory: () => {
    const state = useFeedsStore.getState();
    const byCategory = state.feeds.reduce((acc, feed) => {
      acc[feed.category] = (acc[feed.category] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    logger.debug('Feeds by Category', byCategory);
  },

  /**
   * Reset feeds store
   */
  reset: () => {
    useFeedsStore.getState().clearFilters();
    useFeedsStore.getState().resetPreferences();
    logger.info('Feeds store reset');
  }
};

export type {
  FeedItem,
  FeedCategory,
  FeedFilters,
  FeedPreferences,
  FeedSearch,
  FeedUserInteraction,
  FeedEngagement,
  FeedsStore,
  FeedsApiPayload,
} from './types/feeds';
