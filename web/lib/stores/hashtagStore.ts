/**
 * Hashtag Store - Zustand Implementation
 *
 * Comprehensive hashtag state management with Zustand integration.
 * Handles hashtag data, search, trending, user interactions, and cross-feature integration.
 *
 * Created: October 10, 2025
 * Status: ✅ MODERNIZED
 */

import { useMemo } from 'react';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';

import type {
  FeedHashtagIntegration,
  Hashtag,
  HashtagAnalytics,
  HashtagCategory,
  HashtagActivity,
  HashtagSearchQuery,
  HashtagSearchResponse,
  HashtagSuggestion,
  HashtagUserPreferences,
  HashtagValidation,
  PollHashtagIntegration,
  ProfileHashtagIntegration,
  TrendingHashtag,
  UpdateHashtagUserPreferencesInput,
  UserHashtag,
} from '@/features/hashtags/types';

import logger from '@/lib/utils/logger';

import { createBaseStoreActions } from './baseStoreActions';
import { createSafeStorage } from './storage';

import type { BaseStore } from './types';
import type { StateCreator } from 'zustand';

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const defaultHashtagFilters: HashtagStoreState['filters'] = {
  selectedCategory: 'all',
  sortBy: 'trend_score',
  timeRange: '24h',
  searchQuery: '',
};

const mergeHashtag = (hashtag: Hashtag, updates: Partial<Hashtag>): Hashtag => ({
  ...hashtag,
  ...updates,
});

const mergeFilters = (
  filters: HashtagStoreState['filters'],
  updates: Partial<HashtagStoreState['filters']>
): HashtagStoreState['filters'] => ({
  ...filters,
  ...updates,
});

const mergeHashtagUserPreferences = (
  current: HashtagUserPreferences,
  updates: Partial<HashtagUserPreferences>
): HashtagUserPreferences => {
  const merged: HashtagUserPreferences = {
    ...current,
    hashtagFilters: { ...(current.hashtagFilters ?? {}) },
    notificationPreferences: { ...(current.notificationPreferences ?? {}) },
  };

  if (updates.followedHashtags !== undefined) {
    merged.followedHashtags = updates.followedHashtags;
  }

  if (updates.hashtagFilters !== undefined) {
    merged.hashtagFilters = {
      ...merged.hashtagFilters,
      ...updates.hashtagFilters,
    };
  }

  if (updates.notificationPreferences !== undefined) {
    merged.notificationPreferences = {
      ...merged.notificationPreferences,
      ...updates.notificationPreferences,
    };
  }

  if (updates.userId !== undefined) {
    merged.userId = updates.userId;
  }

  if (updates.createdAt !== undefined) {
    merged.createdAt = updates.createdAt;
  }

  if (updates.updatedAt !== undefined) {
    merged.updatedAt = updates.updatedAt;
  }

  return merged;
};

const cloneFilters = (): HashtagStoreState['filters'] => ({
  ...defaultHashtagFilters,
});

export type HashtagStatsSummary = {
  totalHashtags: number;
  trendingCount: number;
  verifiedCount: number;
  categories: Record<string, number>;
  topHashtags: Hashtag[];
  recentActivity: HashtagActivity[];
  systemHealth: {
    apiResponseTime: number;
    cacheHitRate: number;
    databasePerformance: number;
    errorRate: number;
  };
};

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type HashtagStoreState = {
  // Core hashtag data
  hashtags: Hashtag[];
  userHashtags: UserHashtag[];
  trendingHashtags: TrendingHashtag[];
  analyticsSummary: HashtagStatsSummary | null;

  // Search and discovery
  searchResults: HashtagSearchResponse | null;
  suggestions: HashtagSuggestion[];
  recentSearches: string[];

  // User preferences and settings
  userPreferences: HashtagUserPreferences | null;
  followedHashtags: string[];
  primaryHashtags: string[];

  // Filter state
  filters: {
    selectedCategory: HashtagCategory | 'all';
    sortBy: 'trend_score' | 'usage' | 'growth' | 'alphabetical';
    timeRange: '24h' | '7d' | '30d';
    searchQuery: string;
  };

  // Loading states
  isLoading: boolean;
  isSearching: boolean;
  isFollowing: boolean;
  isUnfollowing: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;

  // Error states
  error: string | null;
  searchError: string | null;
  followError: string | null;
  createError: string | null;
};

type HashtagStoreActions = Pick<BaseStore, 'setLoading' | 'setError' | 'clearError'> & {
  // Core hashtag operations
  setHashtags: (hashtags: Hashtag[]) => void;
  addHashtag: (hashtag: Hashtag) => void;
  updateHashtag: (id: string, updates: Partial<Hashtag>) => void;
  removeHashtag: (id: string) => void;

  // Search and discovery
  searchHashtags: (query: HashtagSearchQuery) => Promise<void>;
  getTrendingHashtags: (category?: HashtagCategory, limit?: number) => Promise<void>;
  getSuggestions: (input: string, context?: string) => Promise<void>;
  clearSearch: () => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;

  // User interactions
  followHashtag: (hashtagId: string) => Promise<boolean>;
  unfollowHashtag: (hashtagId: string) => Promise<boolean>;
  createHashtag: (
    name: string,
    description?: string,
    category?: HashtagCategory
  ) => Promise<Hashtag | null>;
  getUserHashtags: () => Promise<void>;
  setPrimaryHashtags: (hashtagIds: string[]) => void;

  // Preferences
  updateUserPreferences: (
    preferences: Partial<HashtagUserPreferences>
  ) => Promise<boolean>;
  getUserPreferences: () => Promise<void>;

  // Analytics
  getHashtagAnalytics: (
    hashtagId: string,
    period?: '24h' | '7d' | '30d' | '90d' | '1y'
  ) => Promise<HashtagAnalytics | null>;
  getHashtagStats: () => Promise<void>;

  // Cross-feature integration
  getProfileIntegration: (userId: string) => Promise<ProfileHashtagIntegration | null>;
  getPollIntegration: (pollId: string) => Promise<PollHashtagIntegration | null>;
  getFeedIntegration: (feedId: string) => Promise<FeedHashtagIntegration | null>;

  // Validation
  validateHashtagName: (name: string) => Promise<HashtagValidation | null>;

  // Filters
  setFilter: (filter: Partial<HashtagStoreState['filters']>) => void;
  resetFilters: () => void;
  setCategory: (category: HashtagCategory | 'all') => void;
  setSortBy: (sortBy: 'trend_score' | 'usage' | 'growth' | 'alphabetical') => void;
  setTimeRange: (timeRange: '24h' | '7d' | '30d') => void;
  setSearchQuery: (query: string) => void;

  // Loading state setters
  setSearching: (searching: boolean) => void;
  setFollowing: (following: boolean) => void;
  setUnfollowing: (unfollowing: boolean) => void;
  setCreating: (creating: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setDeleting: (deleting: boolean) => void;

  // Error helpers
  setSearchError: (error: string | null) => void;
  setFollowError: (error: string | null) => void;
  setCreateError: (error: string | null) => void;
  clearErrors: () => void;

  // Getters and utilities
  getHashtagById: (id: string) => Hashtag | undefined;
  getHashtagByName: (name: string) => Hashtag | undefined;
  isFollowingHashtag: (hashtagId: string) => boolean;
  getFollowedHashtags: () => Hashtag[];
  getTrendingHashtagsByCategory: (category: HashtagCategory) => TrendingHashtag[];
  getHashtagSuggestions: (input: string) => HashtagSuggestion[];

  // Reset helpers
  resetHashtagStore: (options?: {
    preserveFilters?: boolean;
    preservePreferences?: boolean;
    preserveRecentSearches?: boolean;
  }) => void;
  clearHashtagStore: () => void;
};

type HashtagStore = HashtagStoreState & HashtagStoreActions;

type HashtagStoreCreator = StateCreator<
  HashtagStore,
  [['zustand/immer', never], ['zustand/persist', unknown], ['zustand/devtools', never]]
>;

// -----------------------------------------------------------------------------
// Initial State
// -----------------------------------------------------------------------------

const createInitialHashtagState = (
  overrides: Partial<HashtagStoreState> = {}
): HashtagStoreState => ({
  hashtags: [],
  userHashtags: [],
  trendingHashtags: [],
  analyticsSummary: null,
  searchResults: null,
  suggestions: [],
  recentSearches: [],
  userPreferences: null,
  followedHashtags: [],
  primaryHashtags: [],
  filters: cloneFilters(),
  isLoading: false,
  isSearching: false,
  isFollowing: false,
  isUnfollowing: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,
  searchError: null,
  followError: null,
  createError: null,
  ...overrides,
});

// -----------------------------------------------------------------------------
// Actions
// -----------------------------------------------------------------------------

const createHashtagActions = (
  set: Parameters<HashtagStoreCreator>[0],
  get: Parameters<HashtagStoreCreator>[1],
): HashtagStoreActions => {
  const setState = set as unknown as (recipe: (draft: HashtagStore) => void) => void;
  const baseActions = createBaseStoreActions<HashtagStore>(setState);

  return {
    ...baseActions,
    setHashtags: (hashtags) =>
      setState((state) => {
        state.hashtags = hashtags;
      }),
    addHashtag: (hashtag) =>
      setState((state) => {
        const existingIndex = state.hashtags.findIndex((h) => h.id === hashtag.id);
        if (existingIndex >= 0) {
          state.hashtags[existingIndex] = hashtag;
        } else {
          state.hashtags.push(hashtag);
        }
      }),
    updateHashtag: (id, updates) =>
      setState((state) => {
        const index = state.hashtags.findIndex((h) => h.id === id);
        if (index >= 0) {
          const existing = state.hashtags[index];
          if (existing) {
            state.hashtags[index] = mergeHashtag(existing, updates);
          }
        }
      }),
    removeHashtag: (id) =>
      setState((state) => {
        state.hashtags = state.hashtags.filter((h) => h.id !== id);
      }),
    searchHashtags: async (query) => {
      setState((state) => {
        state.isSearching = true;
        state.searchError = null;
      });

      try {
        const { searchHashtags: searchService } = await import(
          '@/features/hashtags/lib/hashtag-service'
        );
        const result = await searchService(query);

        if (result.success && result.data) {
          setState((state) => {
            state.searchResults = result.data ?? null;
            state.isSearching = false;
          });
        } else {
          setState((state) => {
            state.searchError = result.error ?? 'Search failed';
            state.isSearching = false;
          });
        }
      } catch (error) {
        setState((state) => {
          state.searchError =
            error instanceof Error ? error.message : 'Search failed';
          state.isSearching = false;
        });
      }
    },
    getTrendingHashtags: async (category, limit) => {
      // Don't set loading state for hashtags - they're optional enhancement
      // and setting loading/error states can trigger unnecessary re-renders

      try {
        const { getTrendingHashtags: getTrendingService } = await import(
          '@/features/hashtags/lib/hashtag-service'
        );
        const result = await getTrendingService(category, limit);

        if (result.success && result.data) {
          setState((state) => {
            state.trendingHashtags = result.data ?? [];
          });
        } else {
          // Silently fail - hashtags are optional, don't set error state
          logger.warn('Failed to fetch trending hashtags:', result.error);
        }
      } catch (error) {
        // Silently fail - hashtags are optional, don't set error state
        logger.warn('Failed to fetch trending hashtags:', error);
      }
      // No finally block needed - we're not managing loading state for hashtags
    },
    getSuggestions: async (input, context) => {
      try {
        const { getHashtagSuggestions: getSuggestionsService } = await import(
          '@/features/hashtags/lib/hashtag-service'
        );
        const result = await getSuggestionsService(input, context);

        if (result.success && result.data) {
          setState((state) => {
            state.suggestions = result.data ?? [];
          });
        }
      } catch (error) {
        logger.error('Failed to get suggestions:', error);
      }
    },
    clearSearch: () =>
      setState((state) => {
        state.searchResults = null;
        state.suggestions = [];
        state.searchError = null;
      }),
    addRecentSearch: (query) =>
      setState((state) => {
        const recentSearches = state.recentSearches.filter((q) => q !== query);
        recentSearches.unshift(query);
        state.recentSearches = recentSearches.slice(0, 10);
      }),
    clearRecentSearches: () =>
      setState((state) => {
        state.recentSearches = [];
      }),
    followHashtag: async (hashtagId) => {
      setState((state) => {
        state.isFollowing = true;
        state.followError = null;
      });

      try {
        const { followHashtag: followService } = await import(
          '@/features/hashtags/lib/hashtag-service'
        );
        const result = await followService(hashtagId);

        if (result.success && result.data) {
          setState((state) => {
            if (result.data) {
              state.userHashtags.push(result.data);
            }
            if (!state.followedHashtags.includes(hashtagId)) {
              state.followedHashtags.push(hashtagId);
            }
            state.isFollowing = false;
          });
          return true;
        } else {
          setState((state) => {
            state.followError = result.error ?? 'Failed to follow hashtag';
            state.isFollowing = false;
          });
          return false;
        }
      } catch (error) {
        setState((state) => {
          state.followError =
            error instanceof Error ? error.message : 'Failed to follow hashtag';
          state.isFollowing = false;
        });
        return false;
      }
    },
    unfollowHashtag: async (hashtagId) => {
      setState((state) => {
        state.isUnfollowing = true;
        state.followError = null;
      });

      try {
        const { unfollowHashtag: unfollowService } = await import(
          '@/features/hashtags/lib/hashtag-service'
        );
        const result = await unfollowService(hashtagId);

        if (result.success) {
          setState((state) => {
            state.userHashtags = state.userHashtags.filter(
              (uh) => uh.hashtag_id !== hashtagId
            );
            state.followedHashtags = state.followedHashtags.filter(
              (id) => id !== hashtagId
            );
            state.primaryHashtags = state.primaryHashtags.filter(
              (id) => id !== hashtagId
            );
            state.isUnfollowing = false;
          });
          return true;
        } else {
          setState((state) => {
            state.followError = result.error ?? 'Failed to unfollow hashtag';
            state.isUnfollowing = false;
          });
          return false;
        }
      } catch (error) {
        setState((state) => {
          state.followError =
            error instanceof Error ? error.message : 'Failed to unfollow hashtag';
          state.isUnfollowing = false;
        });
        return false;
      }
    },
    createHashtag: async (name, description, category) => {
      setState((state) => {
        state.isCreating = true;
        state.createError = null;
      });

      try {
        const { createHashtag: createService } = await import(
          '@/features/hashtags/lib/hashtag-service'
        );
        const result = await createService(name, description, category);

        if (result.success && result.data) {
          const createdHashtag = result.data;
          setState((state) => {
            state.hashtags.push(createdHashtag);
            state.isCreating = false;
          });
          return createdHashtag;
        } else {
          setState((state) => {
            state.createError = result.error ?? 'Failed to create hashtag';
            state.isCreating = false;
          });
          return null;
        }
      } catch (error) {
        setState((state) => {
          state.createError =
            error instanceof Error ? error.message : 'Failed to create hashtag';
          state.isCreating = false;
        });
        return null;
      }
    },
    getUserHashtags: async () => {
      baseActions.clearError();
      baseActions.setLoading(true);

      try {
        const { getUserHashtags: getUserHashtagsService } = await import(
          '@/features/hashtags/lib/hashtag-service'
        );
        const result = await getUserHashtagsService();

        if (result.success && result.data) {
          setState((state) => {
            state.userHashtags = result.data ?? [];
            state.followedHashtags = (result.data ?? []).map((uh) => uh.hashtag_id);
            state.primaryHashtags = (result.data ?? [])
              .filter((uh) => uh.is_primary)
              .map((uh) => uh.hashtag_id);
          });
        } else {
          baseActions.setError(result.error ?? 'Failed to fetch user hashtags');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch user hashtags';
        baseActions.setError(errorMessage);
      } finally {
        baseActions.setLoading(false);
      }
    },
    setPrimaryHashtags: (hashtagIds) =>
      setState((state) => {
        state.primaryHashtags = hashtagIds;
      }),
    updateUserPreferences: async (updates) => {
      baseActions.clearError();
      setState((state) => {
        state.isUpdating = true;
      });

      try {
        const currentPreferences = get().userPreferences;
        if (!currentPreferences?.userId) {
          setState((state) => {
            state.error = 'User preferences are not loaded';
            state.isUpdating = false;
          });
          return false;
        }

        const payload: UpdateHashtagUserPreferencesInput = {
          userId: currentPreferences.userId,
          ...(updates.followedHashtags !== undefined
            ? { followedHashtags: updates.followedHashtags }
            : {}),
          ...(updates.hashtagFilters !== undefined
            ? { hashtagFilters: updates.hashtagFilters }
            : {}),
          ...(updates.notificationPreferences !== undefined
            ? { notificationPreferences: updates.notificationPreferences }
            : {}),
        };

        if (Object.keys(payload).length === 1) {
          setState((state) => {
            state.isUpdating = false;
          });
          return true;
        }

        const { updateUserPreferences: updatePreferencesService } = await import(
          '@/features/hashtags/lib/hashtag-service'
        );
        const result = await updatePreferencesService(payload);

        if (result.success) {
          setState((state) => {
            if (result.data !== undefined) {
              state.userPreferences = result.data ?? null;
            } else if (state.userPreferences) {
              state.userPreferences = mergeHashtagUserPreferences(
                state.userPreferences,
                updates
              );
              state.userPreferences.updatedAt = new Date().toISOString();
            }
            state.isUpdating = false;
          });
          return true;
        } else {
          baseActions.setError(result.error ?? 'Failed to update preferences');
          setState((state) => {
            state.isUpdating = false;
          });
          return false;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to update preferences';
        baseActions.setError(errorMessage);
        setState((state) => {
          state.isUpdating = false;
        });
        return false;
      }
    },
    getUserPreferences: async () => {
      baseActions.clearError();
      baseActions.setLoading(true);

      try {
        const { getUserPreferences: getPreferencesService } = await import(
          '@/features/hashtags/lib/hashtag-service'
        );
        const result = await getPreferencesService();

        if (result.success && result.data) {
          setState((state) => {
            state.userPreferences = result.data ?? null;
          });
        } else {
          baseActions.setError(result.error ?? 'Failed to fetch preferences');
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch preferences';
        baseActions.setError(errorMessage);
      } finally {
        baseActions.setLoading(false);
      }
    },
    getHashtagAnalytics: async (hashtagId, period = '7d') => {
      try {
        const { getHashtagAnalytics: getAnalyticsService } = await import(
          '@/features/hashtags/lib/hashtag-service'
        );
        const result = await getAnalyticsService(hashtagId, period);

        if (result.success && result.data) {
          return result.data;
        }
        return null;
      } catch (error) {
        logger.error('Failed to get hashtag analytics:', error);
        return null;
      }
    },
    getHashtagStats: async () => {
      baseActions.clearError();
      baseActions.setLoading(true);

      try {
        const { getHashtagStats: getStatsService } = await import(
          '@/features/hashtags/lib/hashtag-service'
        );
        const result = await getStatsService();

        if (!result.success || !result.data) {
          baseActions.setError(result.error ?? 'Failed to fetch hashtag stats');
          setState((state) => {
            state.analyticsSummary = null;
          });
        } else {
          const data = result.data as Record<string, unknown>;
          const systemHealthRaw =
            (data.system_health as Record<string, number> | undefined) ??
            (data.systemHealth as Record<string, number> | undefined) ??
            {};

          const summary: HashtagStatsSummary = {
            totalHashtags:
              (data.totalHashtags as number | undefined) ??
              (data.total_hashtags as number | undefined) ??
              0,
            trendingCount:
              (data.trendingCount as number | undefined) ??
              (data.trending_count as number | undefined) ??
              0,
            verifiedCount:
              (data.verifiedCount as number | undefined) ??
              (data.verified_count as number | undefined) ??
              0,
            categories:
              (data.categories as Record<string, number> | undefined) ??
              (data.categoryBreakdown as Record<string, number> | undefined) ??
              {},
            topHashtags:
              (data.topHashtags as Hashtag[] | undefined) ??
              (data.top_hashtags as Hashtag[] | undefined) ??
              [],
            recentActivity:
              (data.recentActivity as HashtagActivity[] | undefined) ??
              (data.recent_activity as HashtagActivity[] | undefined) ??
              [],
            systemHealth: {
              apiResponseTime:
                (systemHealthRaw.api_response_time as number | undefined) ??
                (systemHealthRaw.apiResponseTime as number | undefined) ??
                0,
              cacheHitRate:
                (systemHealthRaw.cache_hit_rate as number | undefined) ??
                (systemHealthRaw.cacheHitRate as number | undefined) ??
                0,
              databasePerformance:
                (systemHealthRaw.database_performance as number | undefined) ??
                (systemHealthRaw.databasePerformance as number | undefined) ??
                0,
              errorRate:
                (systemHealthRaw.error_rate as number | undefined) ??
                (systemHealthRaw.errorRate as number | undefined) ??
                0,
            },
          };

          setState((state) => {
            state.analyticsSummary = summary;
          });
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch hashtag stats';
        baseActions.setError(errorMessage);
        setState((state) => {
          state.analyticsSummary = null;
        });
      } finally {
        baseActions.setLoading(false);
      }
    },
    getProfileIntegration: async (userId) => {
      try {
        const { getProfileHashtagIntegration: getProfileIntegrationService } =
          await import('@/features/hashtags/lib/hashtag-service');
        const result = await getProfileIntegrationService(userId);

        if (result.success && result.data) {
          return result.data;
        }
        return null;
      } catch (error) {
        logger.error('Failed to get profile integration:', error);
        return null;
      }
    },
    getPollIntegration: async (pollId) => {
      try {
        const { getPollHashtagIntegration: getPollIntegrationService } =
          await import('@/features/hashtags/lib/hashtag-service');
        const result = await getPollIntegrationService(pollId);

        if (result.success && result.data) {
          return result.data;
        }
        return null;
      } catch (error) {
        logger.error('Failed to get poll integration:', error);
        return null;
      }
    },
    getFeedIntegration: async (feedId) => {
      try {
        const { getFeedHashtagIntegration: getFeedIntegrationService } = await import(
          '@/features/hashtags/lib/hashtag-service'
        );
        const result = await getFeedIntegrationService(feedId);

        if (result.success && result.data) {
          return result.data;
        }
        return null;
      } catch (error) {
        logger.error('Failed to get feed integration:', error);
        return null;
      }
    },
    validateHashtagName: async (name) => {
      try {
        const { validateHashtagName: validateService } = await import(
          '@/features/hashtags/lib/hashtag-service'
        );
        const result = await validateService(name);

        if (result.success && result.data) {
          return result.data;
        }
        return null;
      } catch (error) {
        logger.error('Failed to validate hashtag name:', error);
        return null;
      }
    },
    setFilter: (filter) =>
      setState((state) => {
        state.filters = mergeFilters(state.filters, filter);
      }),
    resetFilters: () =>
      setState((state) => {
        state.filters = cloneFilters();
      }),
    setCategory: (category) =>
      setState((state) => {
        state.filters.selectedCategory = category;
      }),
    setSortBy: (sortBy) =>
      setState((state) => {
        state.filters.sortBy = sortBy;
      }),
    setTimeRange: (timeRange) =>
      setState((state) => {
        state.filters.timeRange = timeRange;
      }),
    setSearchQuery: (query) =>
      setState((state) => {
        state.filters.searchQuery = query;
      }),
    setSearching: (searching) =>
      setState((state) => {
        state.isSearching = searching;
      }),
    setFollowing: (following) =>
      setState((state) => {
        state.isFollowing = following;
      }),
    setUnfollowing: (unfollowing) =>
      setState((state) => {
        state.isUnfollowing = unfollowing;
      }),
    setCreating: (creating) =>
      setState((state) => {
        state.isCreating = creating;
      }),
    setUpdating: (updating) =>
      setState((state) => {
        state.isUpdating = updating;
      }),
    setDeleting: (deleting) =>
      setState((state) => {
        state.isDeleting = deleting;
      }),
    setSearchError: (error) =>
      setState((state) => {
        state.searchError = error;
      }),
    setFollowError: (error) =>
      setState((state) => {
        state.followError = error;
      }),
    setCreateError: (error) =>
      setState((state) => {
        state.createError = error;
      }),
    clearErrors: () =>
      setState((state) => {
        state.error = null;
        state.searchError = null;
        state.followError = null;
        state.createError = null;
      }),
    getHashtagById: (id) => get().hashtags.find((h) => h.id === id),
    getHashtagByName: (name) => get().hashtags.find((h) => h.name === name),
    isFollowingHashtag: (hashtagId) => get().followedHashtags.includes(hashtagId),
    getFollowedHashtags: () => {
      const state = get();
      return state.userHashtags.map((uh) => uh.hashtag);
    },
    getTrendingHashtagsByCategory: (category) =>
      get().trendingHashtags.filter((th) => th.hashtag.category === category),
    getHashtagSuggestions: (input) => {
      const state = get();
      return state.suggestions.filter(
        (s) =>
          s.hashtag.name.toLowerCase().includes(input.toLowerCase()) ||
          (s.hashtag.display_name ?? s.hashtag.name)
            .toLowerCase()
            .includes(input.toLowerCase())
      );
    },
    resetHashtagStore: (options = {}) => {
      const {
        preserveFilters = true,
        preservePreferences = true,
        preserveRecentSearches = true,
      } = options;

      setState((state) => {
        const preservedFilters = preserveFilters ? state.filters : cloneFilters();
        const preservedPreferences = preservePreferences
          ? state.userPreferences
          : null;
        const preservedRecentSearches = preserveRecentSearches
          ? state.recentSearches.slice()
          : [];
        const preservedFollowed = preservePreferences
          ? state.followedHashtags.slice()
          : [];
        const preservedPrimary = preservePreferences
          ? state.primaryHashtags.slice()
          : [];

        const nextState = createInitialHashtagState({
          filters: preservedFilters,
          userPreferences: preservedPreferences,
          followedHashtags: preservedFollowed,
          primaryHashtags: preservedPrimary,
          recentSearches: preservedRecentSearches,
        });

        Object.assign(state, nextState);
      });
    },
    clearHashtagStore: () => {
      get().resetHashtagStore({
        preserveFilters: false,
        preservePreferences: false,
        preserveRecentSearches: false,
      });
    },
  };
};

// -----------------------------------------------------------------------------
// Store Creation
// -----------------------------------------------------------------------------

export const hashtagStoreCreator: HashtagStoreCreator = (set, get) => ({
  ...createInitialHashtagState(),
  ...createHashtagActions(set, get),
});

type PersistedHashtagStore = {
  userPreferences: HashtagUserPreferences | null;
  followedHashtags: string[];
  primaryHashtags: string[];
  filters: HashtagStoreState['filters'];
  recentSearches: string[];
};

export const useHashtagStore = create<HashtagStore>()(
  devtools(
    persist(
      immer(hashtagStoreCreator),
      {
        name: 'hashtag-store',
        storage: createSafeStorage(),
        partialize: (state) => ({
          userPreferences: state.userPreferences,
          followedHashtags: state.followedHashtags,
          primaryHashtags: state.primaryHashtags,
          filters: state.filters,
          recentSearches: state.recentSearches,
        }),
        merge: (persistedState, currentState) => {
          const persisted = (persistedState ?? {}) as Partial<PersistedHashtagStore>;
          return {
            ...currentState,
            userPreferences:
              persisted.userPreferences ?? currentState.userPreferences,
            followedHashtags:
              persisted.followedHashtags ?? currentState.followedHashtags,
            primaryHashtags:
              persisted.primaryHashtags ?? currentState.primaryHashtags,
            filters: persisted.filters ?? currentState.filters,
            recentSearches:
              persisted.recentSearches ?? currentState.recentSearches,
          };
        },
      }
    ),
    {
      name: 'hashtag-store',
    }
  )
);

// -----------------------------------------------------------------------------
// Selectors & Hooks
// -----------------------------------------------------------------------------

export const hashtagSelectors = {
  hashtags: (state: HashtagStore) => state.hashtags,
  userHashtags: (state: HashtagStore) => state.userHashtags,
  trendingHashtags: (state: HashtagStore) => state.trendingHashtags,
  analyticsSummary: (state: HashtagStore) => state.analyticsSummary,
  filters: (state: HashtagStore) => state.filters,
  selectedCategory: (state: HashtagStore) => state.filters.selectedCategory,
  sortBy: (state: HashtagStore) => state.filters.sortBy,
  timeRange: (state: HashtagStore) => state.filters.timeRange,
  searchQuery: (state: HashtagStore) => state.filters.searchQuery,
  searchResults: (state: HashtagStore) => state.searchResults,
  suggestions: (state: HashtagStore) => state.suggestions,
  recentSearches: (state: HashtagStore) => state.recentSearches,
  followedHashtags: (state: HashtagStore) => state.followedHashtags,
  primaryHashtags: (state: HashtagStore) => state.primaryHashtags,
  userPreferences: (state: HashtagStore) => state.userPreferences,
  isLoading: (state: HashtagStore) => state.isLoading,
  isSearching: (state: HashtagStore) => state.isSearching,
  isFollowing: (state: HashtagStore) => state.isFollowing,
  isUnfollowing: (state: HashtagStore) => state.isUnfollowing,
  isCreating: (state: HashtagStore) => state.isCreating,
  isUpdating: (state: HashtagStore) => state.isUpdating,
  isDeleting: (state: HashtagStore) => state.isDeleting,
  hasError: (state: HashtagStore) => !!state.error,
  error: (state: HashtagStore) => state.error,
  searchError: (state: HashtagStore) => state.searchError,
  followError: (state: HashtagStore) => state.followError,
  createError: (state: HashtagStore) => state.createError,
  followedCount: (state: HashtagStore) => state.followedHashtags.length,
  trendingCount: (state: HashtagStore) => state.trendingHashtags.length,
  searchResultCount: (state: HashtagStore) => state.searchResults?.hashtags.length ?? 0,
};

export const useHashtagSearch = () => {
  const searchResults = useHashtagStore((state) => state.searchResults);
  const suggestions = useHashtagStore((state) => state.suggestions);
  const recentSearches = useHashtagStore((state) => state.recentSearches);
  const isSearching = useHashtagStore((state) => state.isSearching);
  const searchError = useHashtagStore((state) => state.searchError);

  return useMemo(
    () => ({
      searchResults,
      suggestions,
      recentSearches,
      isSearching,
      searchError,
    }),
    [searchResults, suggestions, recentSearches, isSearching, searchError],
  );
};

export const useHashtagLoading = () => {
  // Use a single selector with useShallow to get all loading states at once
  // This reduces subscriptions from 7 to 1 and ensures stable object reference
  const { isLoading, isSearching, isFollowing, isUnfollowing, isCreating, isUpdating, isDeleting } = useHashtagStore(
    useShallow((state) => ({
      isLoading: state.isLoading,
      isSearching: state.isSearching,
      isFollowing: state.isFollowing,
      isUnfollowing: state.isUnfollowing,
      isCreating: state.isCreating,
      isUpdating: state.isUpdating,
      isDeleting: state.isDeleting,
    })),
  );

  return useMemo(
    () => ({
      isLoading,
      isSearching,
      isFollowing,
      isUnfollowing,
      isCreating,
      isUpdating,
      isDeleting,
    }),
    [isLoading, isSearching, isFollowing, isUnfollowing, isCreating, isUpdating, isDeleting],
  );
};

export const useHashtagError = () => {
  // Use a single selector with useShallow to get all error states at once
  // This reduces subscriptions from 4 to 1 and ensures stable object reference
  const { error, searchError, followError, createError } = useHashtagStore(
    useShallow((state) => ({
      error: state.error,
      searchError: state.searchError,
      followError: state.followError,
      createError: state.createError,
    })),
  );

  return useMemo(
    () => ({
      error,
      searchError,
      followError,
      createError,
      hasError: !!(error ?? searchError ?? followError ?? createError),
    }),
    [error, searchError, followError, createError],
  );
};

// Selector for hashtag actions - stable reference
const selectHashtagActions = (state: HashtagStore) => ({
  searchHashtags: state.searchHashtags,
  getTrendingHashtags: state.getTrendingHashtags,
  getSuggestions: state.getSuggestions,
  followHashtag: state.followHashtag,
  unfollowHashtag: state.unfollowHashtag,
  createHashtag: state.createHashtag,
  getUserHashtags: state.getUserHashtags,
  getHashtagAnalytics: state.getHashtagAnalytics,
  getHashtagStats: state.getHashtagStats,
  validateHashtagName: state.validateHashtagName,
  clearSearch: state.clearSearch,
  clearErrors: state.clearErrors,
  setFilter: state.setFilter,
  resetFilters: state.resetFilters,
  setCategory: state.setCategory,
  setSortBy: state.setSortBy,
  setTimeRange: state.setTimeRange,
  setSearchQuery: state.setSearchQuery,
});

export function useHashtagActions() {
  return useHashtagStore(useShallow(selectHashtagActions));
}

export const useHashtagFilters = () => useHashtagStore((state) => state.filters);
export const useHashtagCategory = () =>
  useHashtagStore((state) => state.filters.selectedCategory);
export const useHashtagSortBy = () =>
  useHashtagStore((state) => state.filters.sortBy);
export const useHashtagTimeRange = () =>
  useHashtagStore((state) => state.filters.timeRange);
export const useHashtagSearchQuery = () =>
  useHashtagStore((state) => state.filters.searchQuery);

export const useTrendingHashtags = () => useHashtagStore((state) => state.trendingHashtags);

export const useHashtagStats = () =>
  useHashtagStore((state) => ({
    followedCount: state.followedHashtags.length,
    trendingCount: state.trendingHashtags.length,
    searchResultCount: state.searchResults?.hashtags.length ?? 0,
    recentSearchesCount: state.recentSearches.length,
  }));

export const useHashtagList = () => useHashtagStore((state) => state.hashtags);
export const useFollowedHashtags = () => useHashtagStore((state) => state.followedHashtags);
export const usePrimaryHashtags = () => useHashtagStore((state) => state.primaryHashtags);
export const useHashtagAnalyticsSummary = () =>
  useHashtagStore((state) => state.analyticsSummary);
export const useUserHashtags = () => useHashtagStore((state) => state.userHashtags);
export const useHashtagSuggestions = () => useHashtagStore((state) => state.suggestions);
export const useHashtagSearchResults = () =>
  useHashtagStore((state) => state.searchResults);

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

export const hashtagStoreUtils = {
  initialize: async () => {
    const state = useHashtagStore.getState();
    if (state.trendingHashtags.length > 0 || state.isLoading) {
      return;
    }

    try {
      await state.getTrendingHashtags();
    } catch (error) {
      logger.error('Failed to initialize hashtag store', error);
    }
  },
  reset: () => {
    useHashtagStore.getState().resetHashtagStore();
  },
  getHashtagById: (id: string) => useHashtagStore.getState().getHashtagById(id),
  getHashtagByName: (name: string) => useHashtagStore.getState().getHashtagByName(name),
  isFollowingHashtag: (hashtagId: string) =>
    useHashtagStore.getState().isFollowingHashtag(hashtagId),
  getFollowedHashtags: () => useHashtagStore.getState().getFollowedHashtags(),
};

export const hashtagStoreSubscriptions = {
  onHashtagsChange: (callback: (hashtags: Hashtag[]) => void) => {
    let previousHashtags: Hashtag[] = [];
    return useHashtagStore.subscribe((state) => {
      if (state.hashtags !== previousHashtags) {
        previousHashtags = state.hashtags;
        callback(state.hashtags);
      }
    });
  },
  onUserHashtagsChange: (callback: (userHashtags: UserHashtag[]) => void) => {
    let previousUserHashtags: UserHashtag[] = [];
    return useHashtagStore.subscribe((state) => {
      if (state.userHashtags !== previousUserHashtags) {
        previousUserHashtags = state.userHashtags;
        callback(state.userHashtags);
      }
    });
  },
  onTrendingHashtagsChange: (callback: (trendingHashtags: TrendingHashtag[]) => void) => {
    let previousTrendingHashtags: TrendingHashtag[] = [];
    return useHashtagStore.subscribe((state) => {
      if (state.trendingHashtags !== previousTrendingHashtags) {
        previousTrendingHashtags = state.trendingHashtags;
        callback(state.trendingHashtags);
      }
    });
  },
  onSearchResultsChange: (
    callback: (searchResults: HashtagSearchResponse | null) => void,
  ) => {
    let previousSearchResults: HashtagSearchResponse | null = null;
    return useHashtagStore.subscribe((state) => {
      if (state.searchResults !== previousSearchResults) {
        previousSearchResults = state.searchResults;
        callback(state.searchResults);
      }
    });
  },
  onFiltersChange: (callback: (filters: HashtagStoreState['filters']) => void) => {
    let previousFilters: HashtagStoreState['filters'] = cloneFilters();
    return useHashtagStore.subscribe((state) => {
      if (JSON.stringify(state.filters) !== JSON.stringify(previousFilters)) {
        previousFilters = { ...state.filters };
        callback(state.filters);
      }
    });
  },
};

export const hashtagStoreDebug = {
  logState: () => {
    const state = useHashtagStore.getState();
    logger.info('Hashtag store state:', state);
  },
  reset: () => {
    hashtagStoreUtils.reset();
  },
  clearAll: () => {
    useHashtagStore.getState().clearHashtagStore();
  },
};

