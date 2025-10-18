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

// Feed data types
interface FeedItem {
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

interface FeedCategory {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  count: number;
  enabled: boolean;
}

interface FeedFilters {
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

interface FeedPreferences {
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

interface FeedSearch {
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
interface FeedsStore {
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
            feed.id === id ? { ...feed, ...updates } : feed
          ),
          filteredFeeds: state.filteredFeeds.map(feed =>
            feed.id === id ? { ...feed, ...updates } : feed
          ),
        })),
        
        removeFeed: (id) => set((state) => ({
          feeds: state.feeds.filter(feed => feed.id !== id),
          filteredFeeds: state.filteredFeeds.filter(feed => feed.id !== id),
        })),
        
        refreshFeeds: async () => {
          const { isRefreshing } = get();
          if (isRefreshing) return; // Prevent multiple simultaneous calls
          
          try {
            set({ isRefreshing: true, error: null });
            
            const response = await fetch('/api/feeds', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ category: null }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to refresh feeds');
            }
            
            const feeds = await response.json();
            set({ feeds, filteredFeeds: feeds, isRefreshing: false });
            
            logger.info('Feeds refreshed successfully');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ error: errorMessage, isRefreshing: false });
            logger.error('Failed to refresh feeds:', error instanceof Error ? error : new Error(errorMessage));
          }
        },
        
        loadMoreFeeds: async () => {
          const { isLoading } = get();
          if (isLoading) return; // Prevent multiple simultaneous calls
          
          try {
            set({ isLoading: true, error: null });
            
            const response = await fetch('/api/feeds', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ category: null }),
            });
            
            if (!response.ok) {
              throw new Error('Failed to load more feeds');
            }
            
            const newFeeds = await response.json();
            set((state) => ({
              feeds: [...state.feeds, ...newFeeds],
              filteredFeeds: [...state.filteredFeeds, ...newFeeds],
              isLoading: false
            }));
            
            logger.info('More feeds loaded');
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            set({ error: errorMessage, isLoading: false });
            logger.error('Failed to load more feeds:', error instanceof Error ? error : new Error(errorMessage));
          }
        },
        
        // Filtering and search actions
        setFilters: (filters) => set((state) => {
          const newFilters = { ...state.filters, ...filters };
          
          // Apply filters to feeds
          const filtered = state.feeds.filter(feed => {
            if (newFilters.categories && newFilters.categories.length > 0 && !newFilters.categories.includes(feed.category)) {
              return false;
            }
            if (newFilters.types && newFilters.types.length > 0 && !newFilters.types.includes(feed.type)) {
              return false;
            }
            if (newFilters.sources && newFilters.sources.length > 0 && !newFilters.sources.includes(feed.source.name)) {
              return false;
            }
            if (newFilters.readStatus === 'read' && !feed.userInteraction.read) {
              return false;
            }
            if (newFilters.readStatus === 'unread' && feed.userInteraction.read) {
              return false;
            }
            if (newFilters.tags && newFilters.tags.length > 0 && !newFilters.tags.some(tag => feed.tags.includes(tag))) {
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
            logger.error('Failed to search feeds:', error instanceof Error ? error : new Error(errorMessage));
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
              ? { 
                  ...feed,
                  userInteraction: { ...feed.userInteraction, liked: true },
                  engagement: { ...feed.engagement, likes: feed.engagement.likes + 1 }
                }
              : feed
          ),
          filteredFeeds: state.filteredFeeds.map(feed =>
            feed.id === id 
              ? { 
                  ...feed,
                  userInteraction: { ...feed.userInteraction, liked: true },
                  engagement: { ...feed.engagement, likes: feed.engagement.likes + 1 }
                }
              : feed
          ),
        })),
        
        unlikeFeed: (id) => set((state) => ({
          feeds: state.feeds.map(feed =>
            feed.id === id 
              ? { 
                  ...feed,
                  userInteraction: { ...feed.userInteraction, liked: false },
                  engagement: { ...feed.engagement, likes: Math.max(0, feed.engagement.likes - 1) }
                }
              : feed
          ),
          filteredFeeds: state.filteredFeeds.map(feed =>
            feed.id === id 
              ? { 
                  ...feed,
                  userInteraction: { ...feed.userInteraction, liked: false },
                  engagement: { ...feed.engagement, likes: Math.max(0, feed.engagement.likes - 1) }
                }
              : feed
          ),
        })),
        
        shareFeed: (id) => set((state) => ({
          feeds: state.feeds.map(feed =>
            feed.id === id 
              ? { 
                  ...feed,
                  userInteraction: { ...feed.userInteraction, shared: true },
                  engagement: { ...feed.engagement, shares: feed.engagement.shares + 1 }
                }
              : feed
          ),
          filteredFeeds: state.filteredFeeds.map(feed =>
            feed.id === id 
              ? { 
                  ...feed,
                  userInteraction: { ...feed.userInteraction, shared: true },
                  engagement: { ...feed.engagement, shares: feed.engagement.shares + 1 }
                }
              : feed
          ),
        })),
        
        bookmarkFeed: (id) => set((state) => ({
          feeds: state.feeds.map(feed =>
            feed.id === id 
              ? { ...feed, userInteraction: { ...feed.userInteraction, bookmarked: true } }
              : feed
          ),
          filteredFeeds: state.filteredFeeds.map(feed =>
            feed.id === id 
              ? { ...feed, userInteraction: { ...feed.userInteraction, bookmarked: true } }
              : feed
          ),
        })),
        
        unbookmarkFeed: (id) => set((state) => ({
          feeds: state.feeds.map(feed =>
            feed.id === id 
              ? { ...feed, userInteraction: { ...feed.userInteraction, bookmarked: false } }
              : feed
          ),
          filteredFeeds: state.filteredFeeds.map(feed =>
            feed.id === id 
              ? { ...feed, userInteraction: { ...feed.userInteraction, bookmarked: false } }
              : feed
          ),
        })),
        
        markAsRead: (id) => set((state) => ({
          feeds: state.feeds.map(feed =>
            feed.id === id 
              ? { 
                  ...feed,
                  userInteraction: { 
                    ...feed.userInteraction, 
                    read: true, 
                    readAt: new Date().toISOString() 
                  }
                }
              : feed
          ),
          filteredFeeds: state.filteredFeeds.map(feed =>
            feed.id === id 
              ? { 
                  ...feed,
                  userInteraction: { 
                    ...feed.userInteraction, 
                    read: true, 
                    readAt: new Date().toISOString() 
                  }
                }
              : feed
          ),
        })),
        
        markAsUnread: (id) => set((state) => ({
          feeds: state.feeds.map(feed =>
            feed.id === id 
              ? { 
                  ...feed,
                  userInteraction: { 
                    ...feed.userInteraction, 
                    read: false, 
                    readAt: undefined 
                  }
                }
              : feed
          ),
          filteredFeeds: state.filteredFeeds.map(feed =>
            feed.id === id 
              ? { 
                  ...feed,
                  userInteraction: { 
                    ...feed.userInteraction, 
                    read: false, 
                    readAt: undefined 
                  }
                }
              : feed
          ),
        })),
        
        // Category actions
        setCategories: (categories) => set({ categories }),
        
        toggleCategory: (categoryId) => set((state) => ({
          categories: state.categories.map(category =>
            category.id === categoryId 
              ? { ...category, enabled: !category.enabled }
              : category
          )
        })),
        
        setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),
        
        // Preferences actions
        updatePreferences: (preferences) => set((state) => ({
          preferences: { ...state.preferences, ...preferences }
        })),
        
        resetPreferences: () => set({ preferences: defaultPreferences }),
        
        // View management actions
        setCurrentView: (view) => set({ currentView: view }),
        
        setSelectedFeed: (feed) => set({ selectedFeed: feed }),
        
        // Data operations
        loadFeeds: async (category) => {
          try {
            set({ isLoading: true, error: null });
            
            const response = await fetch('/api/feeds', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ category }),
            });
            
            if (response && response.ok) {
              const feeds = await response.json();
              set({ feeds, filteredFeeds: feeds, isLoading: false });
              
              logger.info('Feeds loaded', {
                category,
                count: feeds.length
              });
            } else {
              // No fallback data - just set empty state
              set({ feeds: [], filteredFeeds: [], isLoading: false });
            }
          } catch (error) {
            // No fallback data - just set empty state on error
            set({ feeds: [], filteredFeeds: [], isLoading: false });
            logger.info('API error, using empty state:', { error: error instanceof Error ? error.message : 'Unknown error' });
          }
        },
        
        loadCategories: async () => {
          try {
            set({ isLoading: true, error: null });
            
            const response = await fetch('/api/feeds/categories');
            
            if (!response.ok) {
              throw new Error('Failed to load categories');
            }
            
            const categories = await response.json();
            set({ categories, isLoading: false });
            
            logger.info('Feed categories loaded', {
              count: categories.length
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

// Action selectors - FIXED: Use individual selectors to prevent infinite re-renders
export const useFeedsActions = () => useFeedsStore(state => state);

// Computed selectors - FIXED: Use individual selectors to prevent infinite re-renders
export const useFeedsStats = () => {
  const totalFeeds = useFeedsStore(state => state.feeds.length);
  const filteredFeeds = useFeedsStore(state => state.filteredFeeds.length);
  const totalCategories = useFeedsStore(state => state.categories.length);
  const enabledCategories = useFeedsStore(state => state.categories.filter(cat => cat.enabled).length);
  const searchResults = useFeedsStore(state => state.search.results.length);
  const isLoading = useFeedsStore(state => state.isLoading);
  const isSearching = useFeedsStore(state => state.isSearching);
  const error = useFeedsStore(state => state.error);
  
  return {
    totalFeeds,
    filteredFeeds,
    totalCategories,
    enabledCategories,
    searchResults,
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
  getRecentFeeds: (limit = 10) => {
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
      acc[feed.category] = (acc[feed.category] || 0) + 1;
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
