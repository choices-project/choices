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

import { useMemo } from 'react';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';

import { logger } from '@/lib/utils/logger';
import { PrivacyDataType, hasPrivacyConsent } from '@/lib/utils/privacy-guard';


import { createBaseStoreActions } from './baseStoreActions';
import { fetchFeedsFromApi, parseFeedSearchPayload } from './services/feedsService';
import { createSafeStorage } from './storage';

import type {
  FeedCategory,
  FeedFilters,
  FeedItem,
  FeedPreferences,
  FeedSearch,
  FeedEngagement,
  FeedUserInteraction,
  FeedsStore,
  FeedsApiPayload,
  FeedsState,
  FeedsActions,
  ResetFeedsStateOptions,
  FeedUpdateInput,
} from './types/feeds';
import type { PrivacySettings } from '@/types/profile';
import type { StateCreator } from 'zustand';

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

const mergeFeed = (feed: FeedItem, updates: FeedUpdateInput) =>
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

const hasFeedActivityConsent = (settings: PrivacySettings | null): boolean =>
  hasPrivacyConsent(settings, PrivacyDataType.FEED_ACTIVITY);

const withFeedAnalyticsConsent = async <T>(
  state: FeedsState,
  handler: () => Promise<T> | T,
): Promise<T | undefined> => {
  if (!hasFeedActivityConsent(state.privacySettings)) {
    logger.debug('Feed interaction not tracked - privacy consent missing.');
    return undefined;
  }
  return handler();
};

const showFeedSuccessToast = async (title: string, message: string, privacySettings: PrivacySettings | null) => {
  if (hasFeedActivityConsent(privacySettings)) {
    const { notificationStoreUtils } = await import('./notificationStore');
    notificationStoreUtils.createSuccess(title, message, 3000);
  }
};

type FeedsStoreCreator = StateCreator<
  FeedsStore,
  [['zustand/immer', never], ['zustand/persist', unknown], ['zustand/devtools', never]]
>;

const createInitialFeedSearch = (): FeedSearch => ({
  query: '',
  results: [],
  totalResults: 0,
  currentPage: 1,
  totalPages: 1,
  filters: cloneFilters(),
  suggestions: [],
  recentSearches: [],
});

export const createInitialFeedsState = (overrides: Partial<FeedsState> = {}): FeedsState => ({
  feeds: [],
  filteredFeeds: [],
  categories: [],
  search: createInitialFeedSearch(),
  currentView: defaultPreferences.defaultView,
  selectedFeed: null,
  selectedCategory: null,
  filters: cloneFilters(),
  preferences: clonePreferences(),
  privacySettings: null,
  totalAvailableFeeds: 0,
  hasMoreFeeds: false,
  isLoading: false,
  isSearching: false,
  isRefreshing: false,
  isUpdating: false,
  error: null,
  ...overrides,
});

const applyFeedMutation = (
  state: FeedsState,
  feedId: string,
  updater: (feed: FeedItem) => FeedItem
) => {
  state.feeds = state.feeds.map((feed) =>
    feed.id === feedId ? updater(feed) : feed
  );
  state.filteredFeeds = state.filteredFeeds.map((feed) =>
    feed.id === feedId ? updater(feed) : feed
  );
};

const deriveTotalAvailableFeeds = (payload: FeedsApiPayload, fallback: number) =>
  payload.pagination?.total ?? payload.count ?? fallback;

const deriveHasMoreFeeds = (
  payload: FeedsApiPayload,
  requestedLimit: number,
  appendedCount: number,
  nextLength: number,
): boolean => {
  if (typeof payload.pagination?.hasMore === 'boolean') {
    return payload.pagination.hasMore;
  }

  const total = deriveTotalAvailableFeeds(payload, nextLength);
  if (total > nextLength) {
    return true;
  }

  if (payload.feeds.length === 0 || appendedCount <= 0) {
    return false;
  }

  return payload.feeds.length === requestedLimit;
};

const createFeedsActions = (
  set: Parameters<FeedsStoreCreator>[0],
  get: Parameters<FeedsStoreCreator>[1]
): FeedsActions => {
  const setState = set as unknown as (recipe: (draft: FeedsStore) => void) => void;
  const baseActions = createBaseStoreActions<FeedsStore>(setState);

  return {
    ...baseActions,
    setFeeds: (feeds) =>
      setState((state) => {
        state.feeds = feeds;
        state.filteredFeeds = filterFeeds(feeds, state.filters);
        state.totalAvailableFeeds = feeds.length;
        state.hasMoreFeeds = false;
      }),
    addFeed: (feed) =>
      setState((state) => {
        const nextFeeds = prependItem(state.feeds, feed);
        state.feeds = nextFeeds;
        state.filteredFeeds = filterFeeds(nextFeeds, state.filters);
        state.totalAvailableFeeds = state.totalAvailableFeeds + 1;
      }),
    updateFeed: (id, updates) =>
      setState((state) => {
        applyFeedMutation(state, id, (feed) => mergeFeed(feed, updates));
      }),
    removeFeed: (id) =>
      setState((state) => {
        state.feeds = state.feeds.filter((feed) => feed.id !== id);
        state.filteredFeeds = state.filteredFeeds.filter((feed) => feed.id !== id);
        state.totalAvailableFeeds = Math.max(0, state.totalAvailableFeeds - 1);
        state.hasMoreFeeds = state.totalAvailableFeeds > state.feeds.length;
      }),
    refreshFeeds: async () => {
      if (get().isRefreshing) {
        return;
      }
      baseActions.clearError();
      setState((state) => {
        state.isRefreshing = true;
      });

      try {
        const currentState = get();
        const limit = currentState.preferences.itemsPerPage;
        const payload = await fetchFeedsFromApi({
          category: currentState.selectedCategory,
          district: currentState.filters.district ?? null,
          limit,
          offset: 0,
          sort: mapSortPreferenceToParam(currentState.preferences.sortBy),
        });

        setState((state) => {
          const previousLength = state.feeds.length;
          state.feeds = payload.feeds;
          state.filteredFeeds = filterFeeds(payload.feeds, state.filters);
          state.totalAvailableFeeds = deriveTotalAvailableFeeds(
            payload,
            payload.feeds.length,
          );
          const appendedCount = state.feeds.length - previousLength;
          state.hasMoreFeeds = deriveHasMoreFeeds(
            payload,
            limit,
            appendedCount,
            state.feeds.length,
          );
          state.isRefreshing = false;
        });

        logger.info('Feeds refreshed successfully', {
          count: payload.count,
          category: payload.filters.category,
          district: payload.filters.district,
        });

        // Success-toast analytics wiring
        await showFeedSuccessToast(
          'Feeds Refreshed',
          `Loaded ${payload.count} feeds`,
          get().privacySettings
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        baseActions.setError(errorMessage);
        setState((state) => {
          state.isRefreshing = false;
        });
        logger.error(
          'Failed to refresh feeds:',
          error instanceof Error ? error : new Error(errorMessage)
        );
      }
    },
    loadMoreFeeds: async () => {
      const currentState = get();
      if (currentState.isLoading || !currentState.hasMoreFeeds) {
        return;
      }

      baseActions.clearError();
      baseActions.setLoading(true);

      try {
        const limit = currentState.preferences.itemsPerPage;
        const offset = currentState.feeds.length;
        const payload = await fetchFeedsFromApi({
          category: currentState.selectedCategory,
          district: currentState.filters.district ?? null,
          limit,
          offset,
          sort: mapSortPreferenceToParam(currentState.preferences.sortBy),
        });

        setState((state) => {
          const previousLength = state.feeds.length;
          const mergedFeeds = mergeUniqueFeeds(state.feeds, payload.feeds);
          state.feeds = mergedFeeds;
          state.filteredFeeds = filterFeeds(mergedFeeds, state.filters);
          state.totalAvailableFeeds = deriveTotalAvailableFeeds(
            payload,
            Math.max(mergedFeeds.length, state.totalAvailableFeeds),
          );
          const appendedCount = mergedFeeds.length - previousLength;
          state.hasMoreFeeds = deriveHasMoreFeeds(
            payload,
            limit,
            appendedCount,
            mergedFeeds.length,
          );
        });

        logger.info('More feeds loaded', {
          appended: payload.feeds.length,
          total: get().feeds.length,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        baseActions.setError(errorMessage);
        logger.error(
          'Failed to load more feeds:',
          error instanceof Error ? error : new Error(errorMessage)
        );
      } finally {
        baseActions.setLoading(false);
      }
    },
    setFilters: (filters) =>
      setState((state) => {
        const newFilters = mergeFilters(state.filters, filters);
        state.filters = newFilters;
        state.filteredFeeds = filterFeeds(state.feeds, newFilters);
      }),
    clearFilters: () =>
      setState((state) => {
        const resetFilters = cloneFilters();
        state.filters = resetFilters;
        state.filteredFeeds = filterFeeds(state.feeds, resetFilters);
      }),
    searchFeeds: async (query) => {
      baseActions.clearError();
      setState((state) => {
        state.isSearching = true;
      });

      try {
        const response = await fetch('/api/feeds/search', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) {
          throw new Error('Failed to search feeds');
        }

        const payload = parseFeedSearchPayload(await response.json());

        setState((state) => {
          state.search = mergeSearchState(state.search, {
            query,
            results: payload.items,
            totalResults: payload.total,
            currentPage: 1,
            totalPages: Math.max(
              1,
              Math.ceil(payload.total / state.preferences.itemsPerPage)
            ),
            suggestions: payload.suggestions ?? [],
            recentSearches: prependItem(
              state.search.recentSearches.filter((item) => item !== query),
              query
            ).slice(0, 10),
          });
        });

        logger.info('Feeds searched', {
          query,
          returned: payload.items.length,
          total: payload.total,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        baseActions.setError(errorMessage);
        logger.error(
          'Failed to search feeds:',
          error instanceof Error ? error : new Error(errorMessage)
        );
      } finally {
        setState((state) => {
          state.isSearching = false;
        });
      }
    },
    setSearchQuery: (query) =>
      setState((state) => {
        state.search = mergeSearchState(state.search, { query });
      }),
    clearSearch: () =>
      setState((state) => {
        state.search = mergeSearchState(state.search, {
          query: '',
          results: [],
          totalResults: 0,
          currentPage: 1,
          totalPages: 1,
          suggestions: [],
        });
      }),
    likeFeed: async (id) => {
      const currentState = get();

      if (!hasFeedActivityConsent(currentState.privacySettings)) {
        logger.debug('Feed like not tracked - no user consent', { feedId: id });
      }

      setState((state) => {
        applyFeedMutation(state, id, (feed) =>
          mergeFeed(feed, {
            userInteraction: mergeUserInteraction(feed.userInteraction, {
              liked: true,
            }),
            engagement: mergeEngagement(feed.engagement, {
              likes: feed.engagement.likes + 1,
            }),
          }),
        );
      });

      try {
        await withFeedAnalyticsConsent(currentState, () =>
          get().saveUserInteraction(id, { liked: true }),
        );
      } catch (error) {
        logger.error('Failed to save like interaction', error);
      }
    },
    unlikeFeed: async (id) => {
      const currentState = get();

      setState((state) => {
        applyFeedMutation(state, id, (feed) =>
          mergeFeed(feed, {
            userInteraction: mergeUserInteraction(feed.userInteraction, {
              liked: false,
            }),
            engagement: mergeEngagement(feed.engagement, {
              likes: Math.max(0, feed.engagement.likes - 1),
            }),
          })
        );
      });

      try {
        await withFeedAnalyticsConsent(currentState, () =>
          get().saveUserInteraction(id, { liked: false }),
        );
      } catch (error) {
        logger.error('Failed to persist unlike interaction', error);
      }
    },
    shareFeed: (id) =>
      setState((state) => {
        applyFeedMutation(state, id, (feed) =>
          mergeFeed(feed, {
            userInteraction: mergeUserInteraction(feed.userInteraction, {
              shared: true,
            }),
            engagement: mergeEngagement(feed.engagement, {
              shares: feed.engagement.shares + 1,
            }),
          })
        );
      }),
    bookmarkFeed: async (id) => {
      const currentState = get();

      setState((state) => {
        applyFeedMutation(state, id, (feed) =>
          mergeFeed(feed, {
            userInteraction: mergeUserInteraction(feed.userInteraction, {
              bookmarked: true,
            }),
          }),
        );
      });

      try {
        await withFeedAnalyticsConsent(currentState, () =>
          get().saveUserInteraction(id, { bookmarked: true }),
        );
      } catch (error) {
        logger.error('Failed to save bookmark interaction', error);
      }
    },
    unbookmarkFeed: async (id) => {
      const currentState = get();

      setState((state) => {
        applyFeedMutation(state, id, (feed) =>
          mergeFeed(feed, {
            userInteraction: mergeUserInteraction(feed.userInteraction, {
              bookmarked: false,
            }),
          })
        );
      });

      try {
        await withFeedAnalyticsConsent(currentState, () =>
          get().saveUserInteraction(id, { bookmarked: false }),
        );
      } catch (error) {
        logger.error('Failed to remove bookmark interaction', error);
      }
    },
    markAsRead: async (id) => {
      const currentState = get();

      if (!hasFeedActivityConsent(currentState.privacySettings)) {
        logger.debug('Feed read tracking skipped - no user consent', { feedId: id });
        return;
      }

      const readAt = new Date().toISOString();

      setState((state) => {
        applyFeedMutation(state, id, (feed) =>
          mergeFeed(feed, {
            userInteraction: mergeUserInteraction(feed.userInteraction, {
              read: true,
              readAt,
            }),
          })
        );
      });

      try {
        await withFeedAnalyticsConsent(currentState, () =>
          get().saveUserInteraction(id, { read: true, readAt }),
        );
      } catch (error) {
        logger.error('Failed to save read interaction', error);
      }
    },
    markAsUnread: async (id) => {
      const currentState = get();

      setState((state) => {
        applyFeedMutation(state, id, (feed) =>
          mergeFeed(feed, {
            userInteraction: mergeUserInteraction(feed.userInteraction, {
              read: false,
              readAt: null,
            }),
          })
        );
      });

      try {
        await withFeedAnalyticsConsent(currentState, () =>
          get().saveUserInteraction(id, { read: false, readAt: null }),
        );
      } catch (error) {
        logger.error('Failed to persist unread interaction', error);
      }
    },
    setCategories: (categories) =>
      setState((state) => {
        state.categories = categories;
      }),
    toggleCategory: (categoryId) =>
      setState((state) => {
        state.categories = state.categories.map((category) =>
          category.id === categoryId
            ? mergeCategory(category, { enabled: !category.enabled })
            : category
        );
      }),
    setSelectedCategory: (categoryId) =>
      setState((state) => {
        state.selectedCategory = categoryId;
      }),
    updatePreferences: (preferences) =>
      setState((state) => {
        state.preferences = mergePreferences(state.preferences, preferences);
      }),
    resetPreferences: () =>
      setState((state) => {
        state.preferences = clonePreferences();
      }),
    setCurrentView: (view) =>
      setState((state) => {
        state.currentView = view;
      }),
    setSelectedFeed: (feed) =>
      setState((state) => {
        state.selectedFeed = feed;
      }),
    loadFeeds: async (category) => {
      baseActions.clearError();
      baseActions.setLoading(true);

      try {
        const currentState = get();
        const limit = currentState.preferences.itemsPerPage;
        const payload = await fetchFeedsFromApi({
          category: category ?? currentState.selectedCategory,
          district: currentState.filters.district ?? null,
          limit,
          offset: 0,
          sort: mapSortPreferenceToParam(currentState.preferences.sortBy),
        });

        setState((state) => {
          const previousLength = state.feeds.length;
          state.feeds = payload.feeds;
          state.filteredFeeds = filterFeeds(payload.feeds, state.filters);
          state.selectedCategory = category ?? currentState.selectedCategory ?? null;
          state.totalAvailableFeeds = deriveTotalAvailableFeeds(
            payload,
            payload.feeds.length,
          );
          const appendedCount = state.feeds.length - previousLength;
          state.hasMoreFeeds = deriveHasMoreFeeds(
            payload,
            limit,
            appendedCount,
            state.feeds.length,
          );
        });

        logger.debug('Feeds loaded', {
          category: payload.filters.category,
          count: payload.count,
        });

        // Success-toast analytics wiring
        await showFeedSuccessToast(
          'Feeds Loaded',
          `Loaded ${payload.count} feeds`,
          get().privacySettings
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState((state) => {
          state.feeds = [];
          state.filteredFeeds = [];
        });
        baseActions.setError(errorMessage);
        logger.error(
          'Failed to load feeds:',
          error instanceof Error ? error : new Error(errorMessage)
        );
      } finally {
        baseActions.setLoading(false);
      }
    },
    loadCategories: async () => {
      baseActions.clearError();
      baseActions.setLoading(true);

      try {
        const response = await fetch('/api/feeds/categories', {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });

        const payload = (await response.json().catch(() => null)) as
          | {
              success?: boolean;
              data?: unknown;
              categories?: unknown;
            }
          | null;

        if (!response.ok || payload?.success === false) {
          throw new Error('Failed to load categories');
        }

        const raw = payload?.data ?? payload?.categories ?? payload;
        const rawObject =
          raw && typeof raw === 'object'
            ? (raw as { data?: unknown; categories?: unknown })
            : undefined;
        const categories = Array.isArray(raw)
          ? raw
          : Array.isArray(rawObject?.data)
            ? rawObject?.data
            : Array.isArray(rawObject?.categories)
              ? rawObject?.categories
              : [];

        if (!Array.isArray(categories)) {
          throw new Error('Invalid categories response payload');
        }

        setState((state) => {
          state.categories = categories as FeedCategory[];
        });

        logger.info('Feed categories loaded', {
          count: categories.length,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        baseActions.setError(errorMessage);
        logger.error(
          'Failed to load categories:',
          error instanceof Error ? error : new Error(errorMessage)
        );
      } finally {
        baseActions.setLoading(false);
      }
    },
    saveUserInteraction: async (feedId, interaction) => {
      baseActions.clearError();
      setState((state) => {
        state.isUpdating = true;
      });

      try {
        const response = await fetch('/api/feeds/interactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feedId, interaction }),
        });

        const payload = (await response.json().catch(() => null)) as { success?: boolean } | null;

        if (!response.ok || payload?.success === false) {
          throw new Error('Failed to save user interaction');
        }

        logger.info('User interaction saved', {
          feedId,
          interaction,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        baseActions.setError(errorMessage);
        logger.error(
          'Failed to save user interaction:',
          error instanceof Error ? error : new Error(errorMessage)
        );
      } finally {
        setState((state) => {
          state.isUpdating = false;
        });
      }
    },
    setSearching: (searching) =>
      setState((state) => {
        state.isSearching = searching;
      }),
    setRefreshing: (refreshing) =>
      setState((state) => {
        state.isRefreshing = refreshing;
      }),
    setUpdating: (updating) =>
      setState((state) => {
        state.isUpdating = updating;
      }),
    setTotalAvailableFeeds: (count) =>
      setState((state) => {
        state.totalAvailableFeeds = Math.max(0, count);
      }),
    setHasMoreFeeds: (hasMore) =>
      setState((state) => {
        state.hasMoreFeeds = hasMore;
      }),
    setPrivacySettings: (settings) => {
      setState((state) => {
        state.privacySettings = settings;
      });
      logger.debug('Feed privacy settings updated', {
        canTrackActivity: hasPrivacyConsent(
          settings,
          PrivacyDataType.FEED_ACTIVITY
        ),
      });
    },
    resetFeedsState: (options: ResetFeedsStateOptions = {}) => {
      const {
        preserveFilters = true,
        preservePreferences = true,
        preserveRecentSearches = true,
      } = options;

      setState((state) => {
        const preservedFilters = preserveFilters ? state.filters : cloneFilters();
        const preservedPreferences = preservePreferences
          ? state.preferences
          : clonePreferences();
        const preservedRecentSearches = preserveRecentSearches
          ? state.search.recentSearches
          : [];

        const nextState = createInitialFeedsState({
          filters: preserveFilters ? preservedFilters : cloneFilters(),
          preferences: preservePreferences ? preservedPreferences : clonePreferences(),
        });

        Object.assign(state, nextState);
        state.search.recentSearches = preservedRecentSearches;
        state.filters = preservedFilters;
        state.preferences = preservedPreferences;
      });
    },
  };
};

export const feedsStoreCreator: FeedsStoreCreator = (set, get) => ({
  ...createInitialFeedsState(),
  ...createFeedsActions(set, get),
});

type PersistedFeedsState = Pick<
  FeedsState,
  'preferences' | 'filters' | 'currentView' | 'selectedCategory'
> & {
  recentSearches?: string[];
};

export const useFeedsStore = create<FeedsStore>()(
  devtools(
    persist(
      immer(feedsStoreCreator),
      {
        name: 'feeds-store',
        storage: createSafeStorage(),
        partialize: (state) => ({
          preferences: state.preferences,
          filters: state.filters,
          currentView: state.currentView,
          selectedCategory: state.selectedCategory,
          recentSearches: state.search.recentSearches,
        }),
        merge: (persistedState, currentState) => {
          const { recentSearches, ...rest } =
            (persistedState as PersistedFeedsState) ?? {};
          const merged = {
            ...currentState,
            ...rest,
          } as FeedsStore;

          if (recentSearches) {
            merged.search = {
              ...currentState.search,
              recentSearches,
            };
          }

          return merged;
        },
      }
    ),
    { name: 'feeds-store' }
  )
);

export const feedsSelectors = {
  feeds: (state: FeedsStore) => state.feeds,
  filteredFeeds: (state: FeedsStore) => state.filteredFeeds,
  categories: (state: FeedsStore) => state.categories,
  search: (state: FeedsStore) => state.search,
  selectedFeed: (state: FeedsStore) => state.selectedFeed,
  preferences: (state: FeedsStore) => state.preferences,
  filters: (state: FeedsStore) => state.filters,
  currentView: (state: FeedsStore) => state.currentView,
  selectedCategory: (state: FeedsStore) => state.selectedCategory,
  isLoading: (state: FeedsStore) => state.isLoading,
  isSearching: (state: FeedsStore) => state.isSearching,
  isRefreshing: (state: FeedsStore) => state.isRefreshing,
  isUpdating: (state: FeedsStore) => state.isUpdating,
  error: (state: FeedsStore) => state.error,
  totalAvailableFeeds: (state: FeedsStore) => state.totalAvailableFeeds,
  hasMoreFeeds: (state: FeedsStore) => state.hasMoreFeeds,
};

export const useFeeds = () => useFeedsStore(feedsSelectors.feeds);
export const useFilteredFeeds = () => useFeedsStore(feedsSelectors.filteredFeeds);
export const useFeedCategories = () => useFeedsStore(feedsSelectors.categories);
export const useFeedSearch = () => useFeedsStore(feedsSelectors.search);
export const useSelectedFeed = () => useFeedsStore(feedsSelectors.selectedFeed);
export const useFeedPreferences = () =>
  useFeedsStore(feedsSelectors.preferences);
export const useFeedFilters = () => useFeedsStore(feedsSelectors.filters);
export const useFeedsLoading = () => useFeedsStore(feedsSelectors.isLoading);
export const useFeedsError = () => useFeedsStore(feedsSelectors.error);
export const useFeedsRefreshing = () => useFeedsStore(feedsSelectors.isRefreshing);
export const useFeedsTotalAvailable = () =>
  useFeedsStore(feedsSelectors.totalAvailableFeeds);
export const useFeedsHasMore = () => useFeedsStore(feedsSelectors.hasMoreFeeds);
export const useFeedsPagination = () => {
  const totalAvailable = useFeedsStore(feedsSelectors.totalAvailableFeeds);
  const loaded = useFeedsStore((state) => state.feeds.length);
  const hasMore = useFeedsStore(feedsSelectors.hasMoreFeeds);
  const loadMoreFeeds = useFeedsStore((state) => state.loadMoreFeeds);

  return useMemo(
    () => ({
      totalAvailable,
      loaded,
      remaining: Math.max(0, totalAvailable - loaded),
      hasMore,
      loadMoreFeeds,
    }),
    [totalAvailable, loaded, hasMore, loadMoreFeeds]
  );
};

const selectFeedsActions = (state: FeedsStore) => ({
  setFeeds: state.setFeeds,
  addFeed: state.addFeed,
  updateFeed: state.updateFeed,
  removeFeed: state.removeFeed,
  refreshFeeds: state.refreshFeeds,
  loadMoreFeeds: state.loadMoreFeeds,
  setFilters: state.setFilters,
  clearFilters: state.clearFilters,
  searchFeeds: state.searchFeeds,
  setSearchQuery: state.setSearchQuery,
  clearSearch: state.clearSearch,
  likeFeed: state.likeFeed,
  unlikeFeed: state.unlikeFeed,
  shareFeed: state.shareFeed,
  bookmarkFeed: state.bookmarkFeed,
  unbookmarkFeed: state.unbookmarkFeed,
  markAsRead: state.markAsRead,
  markAsUnread: state.markAsUnread,
  setCategories: state.setCategories,
  toggleCategory: state.toggleCategory,
  setSelectedCategory: state.setSelectedCategory,
  updatePreferences: state.updatePreferences,
  resetPreferences: state.resetPreferences,
  setCurrentView: state.setCurrentView,
  setSelectedFeed: state.setSelectedFeed,
  loadFeeds: state.loadFeeds,
  loadCategories: state.loadCategories,
  saveUserInteraction: state.saveUserInteraction,
  setSearching: state.setSearching,
  setRefreshing: state.setRefreshing,
  setUpdating: state.setUpdating,
  setLoading: state.setLoading,
  setError: state.setError,
  clearError: state.clearError,
  setTotalAvailableFeeds: state.setTotalAvailableFeeds,
  setHasMoreFeeds: state.setHasMoreFeeds,
  setPrivacySettings: state.setPrivacySettings,
  resetFeedsState: state.resetFeedsState,
});

// Use useShallow to prevent infinite loops from selector object creation
export function useFeedsActions() {
  return useFeedsStore(useShallow(selectFeedsActions));
}

export const selectFeedById =
  (id: string) =>
  (state: FeedsStore): FeedItem | null =>
    state.feeds.find((feed) => feed.id === id) ??
    state.filteredFeeds.find((feed) => feed.id === id) ??
    null;

export const useFeedById = (id: string) => {
  const selector = useMemo(() => selectFeedById(id), [id]);
  return useFeedsStore(selector);
};

export const useFeedsStats = () => {
  const { totalFeeds, filteredFeeds, totalCategories, enabledCategories, searchResults, totalAvailable, hasMoreFeeds, isLoading, isSearching, error } = useFeedsStore(
    useShallow((state) => ({
      totalFeeds: state.feeds.length,
      filteredFeeds: state.filteredFeeds.length,
      totalCategories: state.categories.length,
      enabledCategories: state.categories.filter((cat) => cat.enabled).length,
      searchResults: state.search.results.length,
      totalAvailable: state.totalAvailableFeeds,
      hasMoreFeeds: state.hasMoreFeeds,
      isLoading: state.isLoading,
      isSearching: state.isSearching,
      error: state.error,
    })),
  );
  return useMemo(
    () => ({
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
    }),
    [totalFeeds, filteredFeeds, totalCategories, enabledCategories, searchResults, totalAvailable, hasMoreFeeds, isLoading, isSearching, error],
  );
};

export const useBookmarkedFeeds = () => {
  const feeds = useFeedsStore((state) => state.feeds);
  return useMemo(
    () => feeds.filter((feed) => feed.userInteraction.bookmarked),
    [feeds],
  );
};

export const useUnreadFeeds = () => {
  const feeds = useFeedsStore((state) => state.feeds);
  return useMemo(
    () => feeds.filter((feed) => !feed.userInteraction.read),
    [feeds],
  );
};

export const useLikedFeeds = () => {
  const feeds = useFeedsStore((state) => state.feeds);
  return useMemo(
    () => feeds.filter((feed) => feed.userInteraction.liked),
    [feeds],
  );
};

export const feedsStoreUtils = {
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
  getFeedById: (id: string) => {
    const state = useFeedsStore.getState();
    return (
      state.feeds.find((feed) => feed.id === id) ??
      state.filteredFeeds.find((feed) => feed.id === id) ??
      null
    );
  },
  getFeedsByCategory: (category: string) => {
    const state = useFeedsStore.getState();
    return state.feeds.filter((feed) => feed.category === category);
  },
  getFeedsByType: (type: string) => {
    const state = useFeedsStore.getState();
    return state.feeds.filter((feed) => feed.type === type);
  },
  getPagination: () => {
    const state = useFeedsStore.getState();
    return {
      totalAvailableFeeds: state.totalAvailableFeeds,
      loadedFeeds: state.feeds.length,
      hasMoreFeeds: state.hasMoreFeeds,
    };
  },
  getTrendingFeeds: () => {
    const state = useFeedsStore.getState();
    return state.feeds
      .slice()
      .sort(
        (a, b) =>
          b.engagement.likes + b.engagement.shares -
          (a.engagement.likes + a.engagement.shares)
      )
      .slice(0, 10);
  },
  getRecentFeeds: (limit = 10) => {
    const state = useFeedsStore.getState();
    return state.feeds
      .slice()
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      )
      .slice(0, limit);
  },
};

export const feedsStoreSubscriptions = {
  onFeedsChange: (callback: (feeds: FeedItem[]) => void) =>
    useFeedsStore.subscribe((state) => {
      callback(state.feeds);
    }),
  onSearchResultsChange: (callback: (results: FeedItem[]) => void) =>
    useFeedsStore.subscribe((state) => {
      callback(state.search.results);
    }),
  onPreferencesChange: (callback: (preferences: FeedPreferences) => void) =>
    useFeedsStore.subscribe((state) => {
      callback(state.preferences);
    }),
};

export const feedsStoreDebug = {
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
      error: state.error,
    });
  },
  logSummary: () => {
    const summary = feedsStoreUtils.getFeedsSummary();
    logger.debug('Feeds Summary', summary);
  },
  logFeedsByCategory: () => {
    const state = useFeedsStore.getState();
    const byCategory = state.feeds.reduce<Record<string, number>>((acc, feed) => {
      acc[feed.category] = (acc[feed.category] ?? 0) + 1;
      return acc;
    }, {});
    logger.debug('Feeds by Category', byCategory);
  },
  reset: (options?: ResetFeedsStateOptions) => {
    useFeedsStore.getState().resetFeedsState(options);
    logger.info('Feeds store reset');
  },
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

