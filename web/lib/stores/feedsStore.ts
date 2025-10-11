/**
 * Feeds Store - Zustand Implementation
 * 
 * Comprehensive content feed state management including feed data,
 * filtering, search, user preferences, and content interactions.
 * Consolidates feed state management and content preferences.
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { persist } from 'zustand/middleware';
import { logger } from '@/lib/utils/logger';
import { withOptional } from '@/lib/utils/objects';

// Feed data types
type FeedItem = {
  id: string;
  title: string;
  content: string;
  summary: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    verified: boolean;
  };
  category: string;
  tags: string[];
  type: 'article' | 'video' | 'podcast' | 'poll' | 'event' | 'news';
  source: {
    name: string;
    url: string;
    logo?: string;
    verified: boolean;
  };
  publishedAt: string;
  updatedAt: string;
  readTime: number; // minutes
  engagement: {
    likes: number;
    shares: number;
    comments: number;
    views: number;
  };
  userInteraction: {
    liked: boolean;
    shared: boolean;
    bookmarked: boolean;
    read: boolean;
    readAt?: string;
  };
  metadata: {
    image?: string;
    videoUrl?: string;
    audioUrl?: string;
    externalUrl?: string;
    location?: string;
    language: string;
  };
}

type FeedCategory = {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  count: number;
  enabled: boolean;
}

type FeedFilters = {
  categories: string[];
  types: string[];
  sources: string[];
  dateRange: {
    start: string;
    end: string;
  };
  readStatus: 'all' | 'read' | 'unread';
  engagement: 'all' | 'popular' | 'trending';
  language: string;
  tags: string[];
}

type FeedPreferences = {
  defaultView: 'list' | 'grid' | 'magazine';
  sortBy: 'newest' | 'oldest' | 'popular' | 'trending' | 'relevance';
  itemsPerPage: number;
  autoRefresh: boolean;
  refreshInterval: number; // minutes
  notifications: {
    newContent: boolean;
    trendingContent: boolean;
    categoryUpdates: boolean;
    authorUpdates: boolean;
  };
  privacy: {
    showReadHistory: boolean;
    showBookmarks: boolean;
    showLikes: boolean;
    shareActivity: boolean;
  };
  content: {
    showImages: boolean;
    showVideos: boolean;
    showAudio: boolean;
    autoPlay: boolean;
    quality: 'low' | 'medium' | 'high';
  };
}

type FeedSearch = {
  query: string;
  results: FeedItem[];
  totalResults: number;
  currentPage: number;
  totalPages: number;
  filters: FeedFilters;
  suggestions: string[];
  recentSearches: string[];
}

// Feeds store state interface
type FeedsStore = {
  // Feed data
  feeds: FeedItem[];
  filteredFeeds: FeedItem[];
  categories: FeedCategory[];
  search: FeedSearch;
  
  // UI state
  currentView: 'list' | 'grid' | 'magazine';
  selectedFeed: FeedItem | null;
  selectedCategory: string | null;
  
  // Filters and preferences
  filters: FeedFilters;
  preferences: FeedPreferences;
  
  // Loading states
  isLoading: boolean;
  isSearching: boolean;
  isRefreshing: boolean;
  isUpdating: boolean;
  error: string | null;
  
  // Actions - Feed management
  setFeeds: (feeds: FeedItem[]) => void;
  addFeed: (feed: FeedItem) => void;
  updateFeed: (id: string, updates: Partial<FeedItem>) => void;
  removeFeed: (id: string) => void;
  refreshFeeds: () => Promise<void>;
  loadMoreFeeds: () => Promise<void>;
  
  // Actions - Filtering and search
  setFilters: (filters: Partial<FeedFilters>) => void;
  clearFilters: () => void;
  searchFeeds: (query: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  clearSearch: () => void;
  
  // Actions - Feed interactions
  likeFeed: (id: string) => void;
  unlikeFeed: (id: string) => void;
  shareFeed: (id: string) => void;
  bookmarkFeed: (id: string) => void;
  unbookmarkFeed: (id: string) => void;
  markAsRead: (id: string) => void;
  markAsUnread: (id: string) => void;
  
  // Actions - Categories
  setCategories: (categories: FeedCategory[]) => void;
  toggleCategory: (categoryId: string) => void;
  setSelectedCategory: (categoryId: string | null) => void;
  
  // Actions - Preferences
  updatePreferences: (preferences: Partial<FeedPreferences>) => void;
  resetPreferences: () => void;
  
  // Actions - View management
  setCurrentView: (view: 'list' | 'grid' | 'magazine') => void;
  setSelectedFeed: (feed: FeedItem | null) => void;
  
  // Actions - Data operations
  loadFeeds: (category?: string) => Promise<void>;
  loadCategories: () => Promise<void>;
  saveUserInteraction: (feedId: string, interaction: Partial<FeedItem['userInteraction']>) => Promise<void>;
  
  // Actions - Loading states
  setLoading: (loading: boolean) => void;
  setSearching: (searching: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

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
  language: 'en',
  tags: [],
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
          filters: defaultFilters,
          suggestions: [],
          recentSearches: [],
        },
        currentView: 'list',
        selectedFeed: null,
        selectedCategory: null,
        filters: defaultFilters,
        preferences: defaultPreferences,
        isLoading: false,
        isSearching: false,
        isRefreshing: false,
        isUpdating: false,
        error: null,
        
        // Feed management actions
        setFeeds: (feeds) => set({ feeds, filteredFeeds: feeds }),
        
        addFeed: (feed) => set((state) => ({
          feeds: [feed, ...state.feeds],
          filteredFeeds: [feed, ...state.filteredFeeds],
        })),
        
        updateFeed: (id, updates) => set((state) => ({
          feeds: state.feeds.map(feed =>
            feed.id === id ? withOptional(feed, updates) : feed
          ),
          filteredFeeds: state.filteredFeeds.map(feed =>
            feed.id === id ? withOptional(feed, updates) : feed
          ),
        })),
        
        removeFeed: (id) => set((state) => ({
          feeds: state.feeds.filter(feed => feed.id !== id),
          filteredFeeds: state.filteredFeeds.filter(feed => feed.id !== id),
        })),
        
        refreshFeeds: async () => {
          const { setRefreshing, setError, loadFeeds } = get();
          
          try {
            setRefreshing(true);
            setError(null);
            
            await loadFeeds();
            
            logger.info('Feeds refreshed successfully');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to refresh feeds:', errorMessage);
          } finally {
            setRefreshing(false);
          }
        },
        
        loadMoreFeeds: async () => {
          const { setLoading, setError, loadFeeds } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            await loadFeeds();
            
            logger.info('More feeds loaded');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to load more feeds:', errorMessage);
          } finally {
            setLoading(false);
          }
        },
        
        // Filtering and search actions
        setFilters: (filters) => set((state) => {
          const newFilters = withOptional(state.filters, filters);
          
          // Apply filters to feeds
          const filtered = state.feeds.filter(feed => {
            if (newFilters.categories.length > 0 && !newFilters.categories.includes(feed.category)) {
              return false;
            }
            if (newFilters.types.length > 0 && !newFilters.types.includes(feed.type)) {
              return false;
            }
            if (newFilters.sources.length > 0 && !newFilters.sources.includes(feed.source.name)) {
              return false;
            }
            if (newFilters.readStatus === 'read' && !feed.userInteraction.read) {
              return false;
            }
            if (newFilters.readStatus === 'unread' && feed.userInteraction.read) {
              return false;
            }
            if (newFilters.tags.length > 0 && !newFilters.tags.some(tag => feed.tags.includes(tag))) {
              return false;
            }
            return true;
          });
          
          return { filters: newFilters, filteredFeeds: filtered };
        }),
        
        clearFilters: () => set((state) => ({
          filters: defaultFilters,
          filteredFeeds: state.feeds,
        })),
        
        searchFeeds: async (query) => {
          const { setSearching, setError } = get();
          
          try {
            setSearching(true);
            setError(null);
            
            const response = await fetch('/api/feeds/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ query }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to search feeds');
            }
            
            const results = await response.json();
            
            set((state) => ({
              search: {
                ...state.search,
                query,
                results: results.items,
                totalResults: results.total,
                currentPage: 1,
                totalPages: Math.ceil(results.total / state.preferences.itemsPerPage),
              },
            }));
            
            logger.info('Feeds searched', {
              query,
              results: results.items.length,
              total: results.total
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to search feeds:', errorMessage);
          } finally {
            setSearching(false);
          }
        },
        
        setSearchQuery: (query) => set((state) => ({
          search: { ...state.search, query }
        })),
        
        clearSearch: () => set((state) => ({
          search: {
            ...state.search,
            query: '',
            results: [],
            totalResults: 0,
            currentPage: 1,
            totalPages: 1,
          }
        })),
        
        // Feed interaction actions
        likeFeed: (id) => set((state) => ({
          feeds: state.feeds.map(feed =>
            feed.id === id 
              ? withOptional(feed, { 
                  userInteraction: withOptional(feed.userInteraction, { liked: true }),
                  engagement: withOptional(feed.engagement, { likes: feed.engagement.likes + 1 })
                })
              : feed
          ),
          filteredFeeds: state.filteredFeeds.map(feed =>
            feed.id === id 
              ? withOptional(feed, { 
                  userInteraction: withOptional(feed.userInteraction, { liked: true }),
                  engagement: { ...feed.engagement, likes: feed.engagement.likes + 1 }
                })
              : feed
          ),
        })),
        
        unlikeFeed: (id) => set((state) => ({
          feeds: state.feeds.map(feed =>
            feed.id === id 
              ? withOptional(feed, { 
                  userInteraction: withOptional(feed.userInteraction, { liked: false }),
                  engagement: withOptional(feed.engagement, { likes: Math.max(0, feed.engagement.likes - 1) })
                })
              : feed
          ),
          filteredFeeds: state.filteredFeeds.map(feed =>
            feed.id === id 
              ? withOptional(feed, { 
                  userInteraction: withOptional(feed.userInteraction, { liked: false }),
                  engagement: withOptional(feed.engagement, { likes: Math.max(0, feed.engagement.likes - 1) })
                })
              : feed
          ),
        })),
        
        shareFeed: (id) => set((state) => ({
          feeds: state.feeds.map(feed =>
            feed.id === id 
              ? withOptional(feed, { 
                  userInteraction: withOptional(feed.userInteraction, { shared: true }),
                  engagement: withOptional(feed.engagement, { shares: feed.engagement.shares + 1 })
                })
              : feed
          ),
          filteredFeeds: state.filteredFeeds.map(feed =>
            feed.id === id 
              ? withOptional(feed, { 
                  userInteraction: withOptional(feed.userInteraction, { shared: true }),
                  engagement: withOptional(feed.engagement, { shares: feed.engagement.shares + 1 })
                })
              : feed
          ),
        })),
        
        bookmarkFeed: (id) => set((state) => ({
          feeds: state.feeds.map(feed =>
            feed.id === id 
              ? withOptional(feed, { userInteraction: withOptional(feed.userInteraction, { bookmarked: true }) })
              : feed
          ),
          filteredFeeds: state.filteredFeeds.map(feed =>
            feed.id === id 
              ? withOptional(feed, { userInteraction: withOptional(feed.userInteraction, { bookmarked: true }) })
              : feed
          ),
        })),
        
        unbookmarkFeed: (id) => set((state) => ({
          feeds: state.feeds.map(feed =>
            feed.id === id 
              ? withOptional(feed, { userInteraction: withOptional(feed.userInteraction, { bookmarked: false }) })
              : feed
          ),
          filteredFeeds: state.filteredFeeds.map(feed =>
            feed.id === id 
              ? withOptional(feed, { userInteraction: withOptional(feed.userInteraction, { bookmarked: false }) })
              : feed
          ),
        })),
        
        markAsRead: (id) => set((state) => ({
          feeds: state.feeds.map(feed =>
            feed.id === id 
              ? withOptional(feed, { 
                  userInteraction: withOptional(feed.userInteraction, { 
                    read: true, 
                    readAt: new Date().toISOString() 
                  })
                })
              : feed
          ),
          filteredFeeds: state.filteredFeeds.map(feed =>
            feed.id === id 
              ? withOptional(feed, { 
                  userInteraction: withOptional(feed.userInteraction, { 
                    read: true, 
                    readAt: new Date().toISOString() 
                  })
                })
              : feed
          ),
        })),
        
        markAsUnread: (id) => set((state) => ({
          feeds: state.feeds.map(feed =>
            feed.id === id 
              ? withOptional(feed, { 
                  userInteraction: withOptional(feed.userInteraction, { 
                    read: false, 
                    readAt: undefined 
                  })
                })
              : feed
          ),
          filteredFeeds: state.filteredFeeds.map(feed =>
            feed.id === id 
              ? withOptional(feed, { 
                  userInteraction: withOptional(feed.userInteraction, { 
                    read: false, 
                    readAt: undefined 
                  })
                })
              : feed
          ),
        })),
        
        // Category actions
        setCategories: (categories) => set({ categories }),
        
        toggleCategory: (categoryId) => set((state) => ({
          categories: state.categories.map(category =>
            category.id === categoryId 
              ? withOptional(category, { enabled: !category.enabled })
              : category
          )
        })),
        
        setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),
        
        // Preferences actions
        updatePreferences: (preferences) => set((state) => ({
          preferences: withOptional(state.preferences, preferences)
        })),
        
        resetPreferences: () => set({ preferences: defaultPreferences }),
        
        // View management actions
        setCurrentView: (view) => set({ currentView: view }),
        
        setSelectedFeed: (feed) => set({ selectedFeed: feed }),
        
        // Data operations
        loadFeeds: async (category) => {
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            const response = await fetch('/api/feeds', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ category }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to load feeds');
            }
            
            const feeds = await response.json();
            set({ feeds, filteredFeeds: feeds });
            
            logger.info('Feeds loaded', {
              category,
              count: feeds.length
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to load feeds:', errorMessage);
          } finally {
            setLoading(false);
          }
        },
        
        loadCategories: async () => {
          const { setLoading, setError } = get();
          
          try {
            setLoading(true);
            setError(null);
            
            const response = await fetch('/api/feeds/categories');
            
            if (!response.ok) {
              throw new Error('Failed to load categories');
            }
            
            const categories = await response.json();
            set({ categories });
            
            logger.info('Feed categories loaded', {
              count: categories.length
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to load categories:', errorMessage);
          } finally {
            setLoading(false);
          }
        },
        
        saveUserInteraction: async (feedId, interaction) => {
          const { setUpdating, setError } = get();
          
          try {
            setUpdating(true);
            setError(null);
            
            const response = await fetch('/api/feeds/interactions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ feedId, interaction }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to save user interaction');
            }
            
            logger.info('User interaction saved', {
              feedId,
              interaction
            });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            logger.error('Failed to save user interaction:', errorMessage);
          } finally {
            setUpdating(false);
          }
        },
        
        // Loading state actions
        setLoading: (loading) => set({ isLoading: loading }),
        setSearching: (searching) => set({ isSearching: searching }),
        setRefreshing: (refreshing) => set({ isRefreshing: refreshing }),
        setUpdating: (updating) => set({ isUpdating: updating }),
        setError: (error) => set({ error }),
        clearError: () => set({ error: null }),
      }),
      {
        name: 'feeds-store',
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

// Action selectors
export const useFeedsActions = () => useFeedsStore(state => ({
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
  setLoading: state.setLoading,
  setSearching: state.setSearching,
  setRefreshing: state.setRefreshing,
  setUpdating: state.setUpdating,
  setError: state.setError,
  clearError: state.clearError,
}));

// Computed selectors
export const useFeedsStats = () => useFeedsStore(state => ({
  totalFeeds: state.feeds.length,
  filteredFeeds: state.filteredFeeds.length,
  totalCategories: state.categories.length,
  enabledCategories: state.categories.filter(cat => cat.enabled).length,
  searchResults: state.search.results.length,
  isLoading: state.isLoading,
  isSearching: state.isSearching,
  error: state.error,
}));

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
   * Get trending feeds
   */
  getTrendingFeeds: () => {
    const state = useFeedsStore.getState();
    return state.feeds
      .sort((a, b) => (b.engagement.likes + b.engagement.shares) - (a.engagement.likes + a.engagement.shares))
      .slice(0, 10);
  },
  
  /**
   * Get recent feeds
   */
  getRecentFeeds: (limit: number = 10) => {
    const state = useFeedsStore.getState();
    return state.feeds
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
      (state) => state.feeds,
      (feeds, prevFeeds) => {
        if (feeds !== prevFeeds) {
          callback(feeds);
        }
      }
    );
  },
  
  /**
   * Subscribe to search results changes
   */
  onSearchResultsChange: (callback: (results: FeedItem[]) => void) => {
    return useFeedsStore.subscribe(
      (state) => state.search.results,
      (results, prevResults) => {
        if (results !== prevResults) {
          callback(results);
        }
      }
    );
  },
  
  /**
   * Subscribe to preferences changes
   */
  onPreferencesChange: (callback: (preferences: FeedPreferences) => void) => {
    return useFeedsStore.subscribe(
      (state) => state.preferences,
      (preferences, prevPreferences) => {
        if (preferences !== prevPreferences) {
          callback(preferences);
        }
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
    console.log('Feeds Store State:', {
      totalFeeds: state.feeds.length,
      filteredFeeds: state.filteredFeeds.length,
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
    console.log('Feeds Summary:', summary);
  },
  
  /**
   * Log feeds by category
   */
  logFeedsByCategory: () => {
    const state = useFeedsStore.getState();
    const byCategory = state.feeds.reduce((acc, feed) => {
      acc[feed.category] = (acc[feed.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    console.log('Feeds by Category:', byCategory);
  },
  
  /**
   * Reset feeds store
   */
  reset: () => {
    useFeedsStore.getState().clearFilters();
    useFeedsStore.getState().resetPreferences();
    console.log('Feeds store reset');
  }
};
