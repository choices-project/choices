/**
 * @fileoverview Minimal Hashtag Store - Fallback Implementation
 * 
 * A lightweight hashtag store that doesn't depend on database tables.
 * Used when the full hashtag system isn't available.
 * 
 * @author Choices Platform Team
 * @created 2025-10-24
 * @version 2.0.0
 * @since 1.0.0
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// Minimal hashtag interface
type MinimalHashtag = {
  id: string;
  name: string;
  display_name: string;
  usage_count: number;
  is_trending: boolean;
  category?: string;
  hashtag?: any;
  hashtags?: any[];
  is_featured?: boolean;
  follower_count?: number;
  trend_score?: number;
  growth_rate?: number;
  current_position?: number;
}

// Minimal hashtag store state
type MinimalHashtagStore = {
  hashtags: MinimalHashtag[];
  trendingHashtags: MinimalHashtag[];
  searchResults: MinimalHashtag[];
  followedHashtags: MinimalHashtag[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  getTrendingHashtags: () => Promise<void>;
  searchHashtags: (query: any) => Promise<void>;
  clearError: () => void;
  setCategory: (category: string) => void;
  setSortBy: (sortBy: string) => void;
  setTimeRange: (timeRange: string) => void;
  setSearchQuery: (query: string) => void;
};

// Create minimal hashtag store
export const useHashtagStore = create<MinimalHashtagStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      hashtags: [],
      trendingHashtags: [],
      searchResults: [],
      followedHashtags: [],
      isLoading: false,
      error: null,
      
      // Actions
      getTrendingHashtags: async () => {
        set({ isLoading: true, error: null });
        try {
          // Return mock trending hashtags
          const mockTrending = [
            { id: '1', name: 'politics', display_name: 'Politics', usage_count: 150, is_trending: true },
            { id: '2', name: 'environment', display_name: 'Environment', usage_count: 120, is_trending: true },
            { id: '3', name: 'civics', display_name: 'Civics', usage_count: 100, is_trending: true },
            { id: '4', name: 'community', display_name: 'Community', usage_count: 80, is_trending: true },
            { id: '5', name: 'activism', display_name: 'Activism', usage_count: 60, is_trending: true }
          ];
          
          set({ 
            trendingHashtags: mockTrending,
            hashtags: mockTrending,
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: 'Failed to load trending hashtags',
            isLoading: false 
          });
        }
      },
      
      searchHashtags: async (query: any) => {
        set({ isLoading: true, error: null });
        try {
          // Mock search functionality
          const mockResults = [
            { id: '1', name: 'politics', display_name: 'Politics', usage_count: 150, is_trending: true },
            { id: '2', name: 'environment', display_name: 'Environment', usage_count: 120, is_trending: true }
          ];
          
          set({ 
            hashtags: mockResults,
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: 'Failed to search hashtags',
            isLoading: false 
          });
        }
      },
      
      clearError: () => set({ error: null }),
      
      setCategory: (category: string) => {
        // Mock implementation
        console.log('Setting category:', category);
      },
      
      setSortBy: (sortBy: string) => {
        // Mock implementation
        console.log('Setting sort by:', sortBy);
      },
      
      setTimeRange: (timeRange: string) => {
        // Mock implementation
        console.log('Setting time range:', timeRange);
      },
      
      setSearchQuery: (query: string) => {
        // Mock implementation
        console.log('Setting search query:', query);
      }
    }),
    { name: 'minimal-hashtag-store' }
  )
);

// Export minimal selectors
export const useHashtagActions = () => {
  const store = useHashtagStore();
  return {
    getTrendingHashtags: store.getTrendingHashtags,
    searchHashtags: store.searchHashtags,
    clearError: store.clearError,
    setCategory: store.setCategory,
    setSortBy: store.setSortBy,
    setTimeRange: store.setTimeRange,
    setSearchQuery: store.setSearchQuery
  };
};

export const useHashtagStats = () => {
  const store = useHashtagStore();
  return {
    trendingCount: store.trendingHashtags.length,
    followedCount: store.followedHashtags.length
  };
};

// Export minimal utilities
export const hashtagStoreUtils = {
  reset: () => useHashtagStore.setState({
    hashtags: [],
    trendingHashtags: [],
    isLoading: false,
    error: null
  })
};

export const hashtagStoreDebug = {
  logState: () => console.log('Minimal hashtag store state:', useHashtagStore.getState()),
  reset: () => hashtagStoreUtils.reset()
};

