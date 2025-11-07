/**
 * Hashtag Store - Zustand Implementation
 * 
 * Comprehensive hashtag state management with Zustand integration
 * Handles hashtag data, search, trending, user interactions, and cross-feature integration
 * 
 * Created: October 10, 2025
 * Status: ✅ INTEGRATED
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import type {
  Hashtag,
  UserHashtag,
  TrendingHashtag,
  HashtagSearchQuery,
  HashtagSearchResponse,
  HashtagSuggestion,
  HashtagAnalytics,
  HashtagCategory
} from '@/features/hashtags/types';
import { withOptional } from '@/lib/util/objects';
import logger from '@/lib/utils/logger';

import { createSafeStorage } from './storage';
import type { BaseStore } from './types';

// Additional type definitions for hashtag store
type HashtagUserPreferences = {
  defaultCategory: HashtagCategory;
  autoFollowTrending: boolean;
  notificationSettings: {
    newTrending: boolean;
    mentions: boolean;
    follows: boolean;
  };
}

type ProfileHashtagIntegration = {
  id: string;
  profile_id: string;
  hashtag_id: string;
  is_primary: boolean;
  created_at: string;
}

type PollHashtagIntegration = {
  id: string;
  poll_id: string;
  hashtag_id: string;
  relevance_score: number;
  created_at: string;
}

type FeedHashtagIntegration = {
  id: string;
  feed_id: string;
  hashtag_id: string;
  weight: number;
  created_at: string;
}

type HashtagValidation = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const defaultHashtagFilters: HashtagStore['filters'] = {
  selectedCategory: 'all',
  sortBy: 'trend_score',
  timeRange: '24h',
  searchQuery: '',
};

const mergeHashtag = (hashtag: Hashtag, updates: Partial<Hashtag>) =>
  withOptional(hashtag, updates as Record<string, unknown>) as Hashtag;

const mergeFilters = (
  filters: HashtagStore['filters'],
  updates: Partial<HashtagStore['filters']>
) => withOptional(filters, updates as Record<string, unknown>) as HashtagStore['filters'];

const mergeUserPreferences = (
  preferences: HashtagUserPreferences,
  updates: Partial<HashtagUserPreferences>
) => withOptional(preferences, updates as Record<string, unknown>) as HashtagUserPreferences;

const cloneFilters = () => withOptional(defaultHashtagFilters);


// Hashtag store state interface
type HashtagStore = {
  // Core hashtag data
  hashtags: Hashtag[];
  userHashtags: UserHashtag[];
  trendingHashtags: TrendingHashtag[];
  
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
  isSearching: boolean;
  isFollowing: boolean;
  isUnfollowing: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  
  // Error states
  searchError: string | null;
  followError: string | null;
  createError: string | null;
  
  // Actions - Core hashtag operations
  setHashtags: (hashtags: Hashtag[]) => void;
  addHashtag: (hashtag: Hashtag) => void;
  updateHashtag: (id: string, updates: Partial<Hashtag>) => void;
  removeHashtag: (id: string) => void;
  
  // Actions - Search and discovery
  searchHashtags: (query: HashtagSearchQuery) => Promise<void>;
  getTrendingHashtags: (category?: HashtagCategory) => Promise<void>;
  getSuggestions: (input: string, context?: string) => Promise<void>;
  clearSearch: () => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  
  // Actions - User interactions
  followHashtag: (hashtagId: string) => Promise<boolean>;
  unfollowHashtag: (hashtagId: string) => Promise<boolean>;
  createHashtag: (name: string, description?: string, category?: HashtagCategory) => Promise<Hashtag | null>;
  getUserHashtags: () => Promise<void>;
  setPrimaryHashtags: (hashtagIds: string[]) => void;
  
  // Actions - Preferences
  updateUserPreferences: (preferences: Partial<HashtagUserPreferences>) => Promise<boolean>;
  getUserPreferences: () => Promise<void>;
  
  // Actions - Analytics
  getHashtagAnalytics: (hashtagId: string, period?: '24h' | '7d' | '30d' | '90d' | '1y') => Promise<HashtagAnalytics | null>;
  getHashtagStats: () => Promise<void>;
  
  // Actions - Cross-feature integration
  getProfileIntegration: (userId: string) => Promise<ProfileHashtagIntegration | null>;
  getPollIntegration: (pollId: string) => Promise<PollHashtagIntegration | null>;
  getFeedIntegration: (feedId: string) => Promise<FeedHashtagIntegration | null>;
  
  // Actions - Validation
  validateHashtagName: (name: string) => Promise<HashtagValidation | null>;
  
  // Actions - Filters
  setFilter: (filter: Partial<HashtagStore['filters']>) => void;
  resetFilters: () => void;
  setCategory: (category: HashtagCategory | 'all') => void;
  setSortBy: (sortBy: 'trend_score' | 'usage' | 'growth' | 'alphabetical') => void;
  setTimeRange: (timeRange: '24h' | '7d' | '30d') => void;
  setSearchQuery: (query: string) => void;
  
  // Actions - Loading states
  setSearching: (searching: boolean) => void;
  setFollowing: (following: boolean) => void;
  setUnfollowing: (unfollowing: boolean) => void;
  setCreating: (creating: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setDeleting: (deleting: boolean) => void;
  
  // Actions - Error handling
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
  
  // Reset and cleanup
  resetHashtagStore: () => void;
  clearHashtagStore: () => void;
} & BaseStore

// Create hashtag store with middleware
export const useHashtagStore = create<HashtagStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        hashtags: [],
        userHashtags: [],
        trendingHashtags: [],
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
        
        // Base store actions
        setLoading: (loading) => set((state) => {
          state.isLoading = loading;
        }),
        
        setError: (error) => set((state) => {
          state.error = error;
        }),
        
        clearError: () => set((state) => {
          state.error = null;
        }),
        
        // Core hashtag operations
        setHashtags: (hashtags) => set((state) => {
          state.hashtags = hashtags;
        }),
        
        addHashtag: (hashtag) => set((state) => {
          const existingIndex = state.hashtags.findIndex(h => h.id === hashtag.id);
          if (existingIndex >= 0) {
            state.hashtags[existingIndex] = hashtag;
          } else {
            state.hashtags.push(hashtag);
          }
        }),
        
        updateHashtag: (id, updates) => set((state) => {
          const index = state.hashtags.findIndex(h => h.id === id);
          if (index >= 0) {
            const existing = state.hashtags[index];
            if (existing) {
              state.hashtags[index] = mergeHashtag(existing, updates);
            }
          }
        }),
        
        removeHashtag: (id) => set((state) => {
          state.hashtags = state.hashtags.filter(h => h.id !== id);
        }),
        
        // Search and discovery
        searchHashtags: async (query) => {
          set((state) => {
            state.isSearching = true;
            state.searchError = null;
          });
          
          try {
            const { searchHashtags: searchService } = await import('@/features/hashtags/lib/hashtag-service');
            const result = await searchService(query);
            
            if (result.success && result.data) {
              set((state) => {
                state.searchResults = result.data ?? null;
                state.isSearching = false;
              });
            } else {
              set((state) => {
                state.searchError = result.error ?? 'Search failed';
                state.isSearching = false;
              });
            }
          } catch (error) {
            set((state) => {
              state.searchError = error instanceof Error ? error.message : 'Search failed';
              state.isSearching = false;
            });
          }
        },
        
        getTrendingHashtags: async (category) => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });
          
          try {
            const { getTrendingHashtags: getTrendingService } = await import('@/features/hashtags/lib/hashtag-service');
            const result = await getTrendingService(category);
            
            if (result.success && result.data) {
              set((state) => {
                state.trendingHashtags = result.data ?? [];
                state.isLoading = false;
              });
            } else {
              set((state) => {
                state.error = result.error ?? 'Failed to fetch trending hashtags';
                state.isLoading = false;
              });
            }
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to fetch trending hashtags';
              state.isLoading = false;
            });
          }
        },
        
        getSuggestions: async (input, context) => {
          try {
            const { getHashtagSuggestions: getSuggestionsService } = await import('@/features/hashtags/lib/hashtag-service');
            const result = await getSuggestionsService(input, context);
            
            if (result.success && result.data) {
              set((state) => {
                state.suggestions = result.data ?? [];
              });
            }
          } catch (error) {
            logger.error('Failed to get suggestions:', error);
          }
        },
        
        clearSearch: () => set((state) => {
          state.searchResults = null;
          state.suggestions = [];
          state.searchError = null;
        }),
        
        addRecentSearch: (query) => set((state) => {
          const recentSearches = state.recentSearches.filter(q => q !== query);
          recentSearches.unshift(query);
          state.recentSearches = recentSearches.slice(0, 10); // Keep only last 10
        }),
        
        clearRecentSearches: () => set((state) => {
          state.recentSearches = [];
        }),
        
        // User interactions
        followHashtag: async (hashtagId) => {
          set((state) => {
            state.isFollowing = true;
            state.followError = null;
          });
          
          try {
            const { followHashtag: followService } = await import('@/features/hashtags/lib/hashtag-service');
            const result = await followService(hashtagId);
            
            if (result.success && result.data) {
              set((state) => {
                if (result.data) {
                  state.userHashtags.push(result.data);
                }
                state.followedHashtags.push(hashtagId);
                state.isFollowing = false;
              });
              return true;
            } else {
              set((state) => {
                state.followError = result.error ?? 'Failed to follow hashtag';
                state.isFollowing = false;
              });
              return false;
            }
          } catch (error) {
            set((state) => {
              state.followError = error instanceof Error ? error.message : 'Failed to follow hashtag';
              state.isFollowing = false;
            });
            return false;
          }
        },
        
        unfollowHashtag: async (hashtagId) => {
          set((state) => {
            state.isUnfollowing = true;
            state.followError = null;
          });
          
          try {
            const { unfollowHashtag: unfollowService } = await import('@/features/hashtags/lib/hashtag-service');
            const result = await unfollowService(hashtagId);
            
            if (result.success) {
              set((state) => {
                state.userHashtags = state.userHashtags.filter(uh => uh.hashtag_id !== hashtagId);
                state.followedHashtags = state.followedHashtags.filter(id => id !== hashtagId);
                state.primaryHashtags = state.primaryHashtags.filter(id => id !== hashtagId);
                state.isUnfollowing = false;
              });
              return true;
            } else {
              set((state) => {
                state.followError = result.error ?? 'Failed to unfollow hashtag';
                state.isUnfollowing = false;
              });
              return false;
            }
          } catch (error) {
            set((state) => {
              state.followError = error instanceof Error ? error.message : 'Failed to unfollow hashtag';
              state.isUnfollowing = false;
            });
            return false;
          }
        },
        
        createHashtag: async (name, description, category) => {
          set((state) => {
            state.isCreating = true;
            state.createError = null;
          });
          
          try {
            const { createHashtag: createService } = await import('@/features/hashtags/lib/hashtag-service');
            const result = await createService(name, description, category);
            
            if (result.success && result.data) {
              set((state) => {
                if (result.data) {
                  state.hashtags.push(result.data);
                }
                state.isCreating = false;
              });
              return result.data;
            } else {
              set((state) => {
                state.createError = result.error ?? 'Failed to create hashtag';
                state.isCreating = false;
              });
              return null;
            }
          } catch (error) {
            set((state) => {
              state.createError = error instanceof Error ? error.message : 'Failed to create hashtag';
              state.isCreating = false;
            });
            return null;
          }
        },
        
        getUserHashtags: async () => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });
          
          try {
            const { getUserHashtags: getUserHashtagsService } = await import('@/features/hashtags/lib/hashtag-service');
            const result = await getUserHashtagsService();
            
            if (result.success && result.data) {
              set((state) => {
                state.userHashtags = result.data ?? [];
                state.followedHashtags = (result.data ?? []).map(uh => uh.hashtag_id);
                state.primaryHashtags = (result.data ?? []).filter(uh => (uh as any).is_primary).map(uh => uh.hashtag_id);
                state.isLoading = false;
              });
            } else {
              set((state) => {
                state.error = result.error ?? 'Failed to fetch user hashtags';
                state.isLoading = false;
              });
            }
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to fetch user hashtags';
              state.isLoading = false;
            });
          }
        },
        
        setPrimaryHashtags: (hashtagIds) => set((state) => {
          state.primaryHashtags = hashtagIds;
        }),
        
        // Preferences
        updateUserPreferences: async (preferences) => {
          set((state) => {
            state.isUpdating = true;
            state.error = null;
          });
          
          try {
            const { updateUserPreferences: updatePreferencesService } = await import('@/features/hashtags/lib/hashtag-service');
            const result = await updatePreferencesService(preferences);
            
            if (result.success) {
              set((state) => {
                if (state.userPreferences) {
                  state.userPreferences = mergeUserPreferences(state.userPreferences, preferences);
                }
                state.isUpdating = false;
              });
              return true;
            } else {
              set((state) => {
                state.error = result.error ?? 'Failed to update preferences';
                state.isUpdating = false;
              });
              return false;
            }
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to update preferences';
              state.isUpdating = false;
            });
            return false;
          }
        },
        
        getUserPreferences: async () => {
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });
          
          try {
            const { getUserPreferences: getPreferencesService } = await import('@/features/hashtags/lib/hashtag-service');
            const result = await getPreferencesService();
            
            if (result.success && result.data) {
              set((state) => {
                state.userPreferences = withOptional(result.data) as HashtagUserPreferences;
                state.isLoading = false;
              });
            } else {
              set((state) => {
                state.error = result.error ?? 'Failed to fetch preferences';
                state.isLoading = false;
              });
            }
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to fetch preferences';
              state.isLoading = false;
            });
          }
        },
        
        // Analytics
        getHashtagAnalytics: async (hashtagId, period: '24h' | '7d' | '30d' | '90d' | '1y' = '7d') => {
          try {
            const { getHashtagAnalytics: getAnalyticsService } = await import('@/features/hashtags/lib/hashtag-service');
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
          set((state) => {
            state.isLoading = true;
            state.error = null;
          });
          
          try {
            const { getHashtagStats: getStatsService } = await import('@/features/hashtags/lib/hashtag-service');
            const result = await getStatsService();
            
            if (result.success && result.data) {
              set((state) => {
                // Store stats in state for future use
                state.isLoading = false;
              });
            } else {
              set((state) => {
                state.error = result.error ?? 'Failed to fetch hashtag stats';
                state.isLoading = false;
              });
            }
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to fetch hashtag stats';
              state.isLoading = false;
            });
          }
        },
        
        // Cross-feature integration
        getProfileIntegration: async (userId) => {
          try {
            const { getProfileHashtagIntegration: getProfileIntegrationService } = await import('@/features/hashtags/lib/hashtag-service');
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
            const { getPollHashtagIntegration: getPollIntegrationService } = await import('@/features/hashtags/lib/hashtag-service');
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
            const { getFeedHashtagIntegration: getFeedIntegrationService } = await import('@/features/hashtags/lib/hashtag-service');
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
        
        // Validation
        validateHashtagName: async (name) => {
          try {
            const { validateHashtagName: validateService } = await import('@/features/hashtags/lib/hashtag-service');
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
        
        // Filter actions
        setFilter: (filter) => set((state) => {
          state.filters = mergeFilters(state.filters, filter);
        }),
        
        resetFilters: () => set((state) => {
          state.filters = cloneFilters();
        }),
        
        setCategory: (category) => set((state) => {
          state.filters.selectedCategory = category;
        }),
        
        setSortBy: (sortBy) => set((state) => {
          state.filters.sortBy = sortBy;
        }),
        
        setTimeRange: (timeRange) => set((state) => {
          state.filters.timeRange = timeRange;
        }),
        
        setSearchQuery: (query) => set((state) => {
          state.filters.searchQuery = query;
        }),
        
        // Loading states
        setSearching: (searching) => set((state) => {
          state.isSearching = searching;
        }),
        
        setFollowing: (following) => set((state) => {
          state.isFollowing = following;
        }),
        
        setUnfollowing: (unfollowing) => set((state) => {
          state.isUnfollowing = unfollowing;
        }),
        
        setCreating: (creating) => set((state) => {
          state.isCreating = creating;
        }),
        
        setUpdating: (updating) => set((state) => {
          state.isUpdating = updating;
        }),
        
        setDeleting: (deleting) => set((state) => {
          state.isDeleting = deleting;
        }),
        
        // Error handling
        setSearchError: (error) => set((state) => {
          state.searchError = error;
        }),
        
        setFollowError: (error) => set((state) => {
          state.followError = error;
        }),
        
        setCreateError: (error) => set((state) => {
          state.createError = error;
        }),
        
        clearErrors: () => set((state) => {
          state.error = null;
          state.searchError = null;
          state.followError = null;
          state.createError = null;
        }),
        
        // Getters and utilities
        getHashtagById: (id) => {
          const state = get();
          return state.hashtags.find(h => h.id === id);
        },
        
        getHashtagByName: (name) => {
          const state = get();
          return state.hashtags.find(h => h.name === name);
        },
        
        isFollowingHashtag: (hashtagId) => {
          const state = get();
          return state.followedHashtags.includes(hashtagId);
        },
        
        getFollowedHashtags: () => {
          const state = get();
          return state.userHashtags.map(uh => uh.hashtag);
        },
        
        getTrendingHashtagsByCategory: (category) => {
          const state = get();
          return state.trendingHashtags.filter(th => th.hashtag.category === category);
        },
        
        getHashtagSuggestions: (input) => {
          const state = get();
          return state.suggestions.filter(s => 
            s.hashtag.name.toLowerCase().includes(input.toLowerCase()) ||
            (s.hashtag.display_name ?? s.hashtag.name).toLowerCase().includes(input.toLowerCase())
          );
        },
        
        // Reset and cleanup
        resetHashtagStore: () => set((state) => {
          state.hashtags = [];
          state.userHashtags = [];
          state.trendingHashtags = [];
          state.searchResults = null;
          state.suggestions = [];
          state.recentSearches = [];
          state.userPreferences = null;
          state.followedHashtags = [];
          state.primaryHashtags = [];
          state.filters = cloneFilters();
          state.isLoading = false;
          state.isSearching = false;
          state.isFollowing = false;
          state.isUnfollowing = false;
          state.isCreating = false;
          state.isUpdating = false;
          state.isDeleting = false;
          state.error = null;
          state.searchError = null;
          state.followError = null;
          state.createError = null;
        }),
        
        clearHashtagStore: () => {
          get().resetHashtagStore();
        }
      })),
      {
        name: 'hashtag-store',
        storage: createSafeStorage(),
        partialize: (state) => ({
          hashtags: state.hashtags,
          userHashtags: state.userHashtags,
          trendingHashtags: state.trendingHashtags,
          recentSearches: state.recentSearches,
          userPreferences: state.userPreferences,
          followedHashtags: state.followedHashtags,
          primaryHashtags: state.primaryHashtags
        })
      }
    ),
    {
      name: 'hashtag-store'
    }
  )
);

// Hashtag store selectors for common use cases
export const hashtagSelectors = {
  // Core hashtag data
  hashtags: (state: HashtagStore) => state.hashtags,
  userHashtags: (state: HashtagStore) => state.userHashtags,
  trendingHashtags: (state: HashtagStore) => state.trendingHashtags,
  
  // Filter selectors
  filters: (state: HashtagStore) => state.filters,
  selectedCategory: (state: HashtagStore) => state.filters.selectedCategory,
  sortBy: (state: HashtagStore) => state.filters.sortBy,
  timeRange: (state: HashtagStore) => state.filters.timeRange,
  searchQuery: (state: HashtagStore) => state.filters.searchQuery,
  
  // Search and discovery
  searchResults: (state: HashtagStore) => state.searchResults,
  suggestions: (state: HashtagStore) => state.suggestions,
  recentSearches: (state: HashtagStore) => state.recentSearches,
  
  // User data
  followedHashtags: (state: HashtagStore) => state.followedHashtags,
  primaryHashtags: (state: HashtagStore) => state.primaryHashtags,
  userPreferences: (state: HashtagStore) => state.userPreferences,
  
  // Loading states
  isLoading: (state: HashtagStore) => state.isLoading,
  isSearching: (state: HashtagStore) => state.isSearching,
  isFollowing: (state: HashtagStore) => state.isFollowing,
  isUnfollowing: (state: HashtagStore) => state.isUnfollowing,
  isCreating: (state: HashtagStore) => state.isCreating,
  isUpdating: (state: HashtagStore) => state.isUpdating,
  isDeleting: (state: HashtagStore) => state.isDeleting,
  
  // Error states
  hasError: (state: HashtagStore) => !!state.error,
  error: (state: HashtagStore) => state.error,
  searchError: (state: HashtagStore) => state.searchError,
  followError: (state: HashtagStore) => state.followError,
  createError: (state: HashtagStore) => state.createError,
  
  // Statistics
  followedCount: (state: HashtagStore) => state.followedHashtags.length,
  trendingCount: (state: HashtagStore) => state.trendingHashtags.length,
  searchResultCount: (state: HashtagStore) => state.searchResults?.hashtags.length ?? 0
};

// Hashtag store hooks for common patterns
export const useHashtags = () => useHashtagStore((state) => ({
  hashtags: state.hashtags,
  userHashtags: state.userHashtags,
  trendingHashtags: state.trendingHashtags,
  followedHashtags: state.followedHashtags,
  primaryHashtags: state.primaryHashtags
}));

export const useHashtagSearch = () => useHashtagStore((state) => ({
  searchResults: state.searchResults,
  suggestions: state.suggestions,
  recentSearches: state.recentSearches,
  isSearching: state.isSearching,
  searchError: state.searchError
}));

export const useHashtagLoading = () => useHashtagStore((state) => ({
  isLoading: state.isLoading,
  isSearching: state.isSearching,
  isFollowing: state.isFollowing,
  isUnfollowing: state.isUnfollowing,
  isCreating: state.isCreating,
  isUpdating: state.isUpdating,
  isDeleting: state.isDeleting
}));

export const useHashtagError = () => useHashtagStore((state) => ({
  error: state.error,
  searchError: state.searchError,
  followError: state.followError,
  createError: state.createError,
  hasError: !!(state.error ?? state.searchError ?? state.followError ?? state.createError)
}));

export const useHashtagActions = () => useHashtagStore((state) => ({
  searchHashtags: state.searchHashtags,
  getTrendingHashtags: state.getTrendingHashtags,
  getSuggestions: state.getSuggestions,
  followHashtag: state.followHashtag,
  unfollowHashtag: state.unfollowHashtag,
  createHashtag: state.createHashtag,
  getUserHashtags: state.getUserHashtags,
  getHashtagAnalytics: state.getHashtagAnalytics,
  clearSearch: state.clearSearch,
  clearErrors: state.clearErrors,
  setFilter: state.setFilter,
  resetFilters: state.resetFilters,
  setCategory: state.setCategory,
  setSortBy: state.setSortBy,
  setTimeRange: state.setTimeRange,
  setSearchQuery: state.setSearchQuery
}));

// Filter selectors
export const useHashtagFilters = () => useHashtagStore((state) => state.filters);
export const useHashtagCategory = () => useHashtagStore((state) => state.filters.selectedCategory);
export const useHashtagSortBy = () => useHashtagStore((state) => state.filters.sortBy);
export const useHashtagTimeRange = () => useHashtagStore((state) => state.filters.timeRange);
export const useHashtagSearchQuery = () => useHashtagStore((state) => state.filters.searchQuery);

export const useHashtagStats = () => useHashtagStore((state) => ({
  followedCount: state.followedHashtags.length,
  trendingCount: state.trendingHashtags.length,
  searchResultCount: state.searchResults?.hashtags.length ?? 0,
  recentSearchesCount: state.recentSearches.length
}));

// Hashtag store utilities
export const hashtagStoreUtils = {
  // Initialize hashtag store
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
  
  // Reset hashtag store
  reset: () => {
    useHashtagStore.getState().resetHashtagStore();
  },
  
  // Get hashtag by ID
  getHashtagById: (id: string) => {
    return useHashtagStore.getState().getHashtagById(id);
  },
  
  // Get hashtag by name
  getHashtagByName: (name: string) => {
    return useHashtagStore.getState().getHashtagByName(name);
  },
  
  // Check if following hashtag
  isFollowingHashtag: (hashtagId: string) => {
    return useHashtagStore.getState().isFollowingHashtag(hashtagId);
  },
  
  // Get followed hashtags
  getFollowedHashtags: () => {
    return useHashtagStore.getState().getFollowedHashtags();
  }
};

// Hashtag store subscriptions
export const hashtagStoreSubscriptions = {
  // Subscribe to hashtag changes
  onHashtagsChange: (callback: (hashtags: Hashtag[]) => void) => {
    let previousHashtags: Hashtag[] = [];
    return useHashtagStore.subscribe((state) => {
      if (state.hashtags !== previousHashtags) {
        previousHashtags = state.hashtags;
        callback(state.hashtags);
      }
    });
  },
  
  // Subscribe to user hashtag changes
  onUserHashtagsChange: (callback: (userHashtags: UserHashtag[]) => void) => {
    let previousUserHashtags: UserHashtag[] = [];
    return useHashtagStore.subscribe((state) => {
      if (state.userHashtags !== previousUserHashtags) {
        previousUserHashtags = state.userHashtags;
        callback(state.userHashtags);
      }
    });
  },
  
  // Subscribe to trending hashtag changes
  onTrendingHashtagsChange: (callback: (trendingHashtags: TrendingHashtag[]) => void) => {
    let previousTrendingHashtags: TrendingHashtag[] = [];
    return useHashtagStore.subscribe((state) => {
      if (state.trendingHashtags !== previousTrendingHashtags) {
        previousTrendingHashtags = state.trendingHashtags;
        callback(state.trendingHashtags);
      }
    });
  },
  
  // Subscribe to search results changes
  onSearchResultsChange: (callback: (searchResults: HashtagSearchResponse | null) => void) => {
    let previousSearchResults: HashtagSearchResponse | null = null;
    return useHashtagStore.subscribe((state) => {
      if (state.searchResults !== previousSearchResults) {
        previousSearchResults = state.searchResults;
        callback(state.searchResults);
      }
    });
  },
  
  // Subscribe to filter changes
  onFiltersChange: (callback: (filters: HashtagStore['filters']) => void) => {
    let previousFilters: HashtagStore['filters'] = cloneFilters();
    return useHashtagStore.subscribe((state) => {
      if (JSON.stringify(state.filters) !== JSON.stringify(previousFilters)) {
        previousFilters = withOptional(state.filters);
        callback(state.filters);
      }
    });
  }
};

// Hashtag store debugging
export const hashtagStoreDebug = {
  // Log current state
  logState: () => {
    const state = useHashtagStore.getState();
    logger.info('Hashtag store state:', state);
  },
  
  // Reset store
  reset: () => {
    hashtagStoreUtils.reset();
  },
  
  // Clear all data
  clearAll: () => {
    useHashtagStore.getState().clearHashtagStore();
  }
};
