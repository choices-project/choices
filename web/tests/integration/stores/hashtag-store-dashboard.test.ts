/**
 * Hashtag Store Dashboard Integration Tests
 *
 * Integration tests verifying hashtagStore works correctly when used by dashboard components:
 * - Trending hashtags integration with dashboard
 * - Loading states for dashboard widgets
 * - Error handling in dashboard context
 * - Selector hooks used by dashboard components
 *
 * Created: January 2025
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react';

import type { TrendingHashtag } from '@/features/hashtags/types';
import {
  useHashtagStore,
  useTrendingHashtags,
  useHashtagActions,
  useHashtagLoading,
  useHashtagError,
  hashtagStoreCreator,
} from '@/lib/stores/hashtagStore';

const mockHashtagService = {
  getTrendingHashtags: jest.fn(),
  searchHashtags: jest.fn(),
  followHashtag: jest.fn(),
  getUserHashtags: jest.fn(),
};

jest.mock('@/features/hashtags/lib/hashtag-service', () => mockHashtagService);

jest.mock('@/lib/utils/logger', () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockLogger,
    logger: mockLogger,
  };
});

describe('Hashtag Store Dashboard Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useHashtagStore.getState().resetHashtagStore();
  });

  describe('Trending Hashtags Dashboard Integration', () => {
    it('useTrendingHashtags hook returns trending hashtags for dashboard', () => {
      const mockTrending: TrendingHashtag[] = [
        {
          hashtag: {
            id: 'hashtag-1',
            name: 'climate',
            displayName: 'Climate',
            category: 'environment',
            description: 'Climate action',
            usageCount: 100,
            trendScore: 5.5,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          trendScore: 5.5,
          growthRate: 10.5,
        },
        {
          hashtag: {
            id: 'hashtag-2',
            name: 'politics',
            displayName: 'Politics',
            category: 'politics',
            description: 'Political discussions',
            usageCount: 200,
            trendScore: 4.5,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          trendScore: 4.5,
          growthRate: 8.5,
        },
      ];

      useHashtagStore.setState((state) => {
        state.trendingHashtags = mockTrending;
      });

      const { result } = renderHook(() => useTrendingHashtags());

      expect(result.current).toEqual(mockTrending);
    });

    it('dashboard can fetch trending hashtags via useHashtagActions', async () => {
      const mockTrending: TrendingHashtag[] = [
        {
          hashtag: {
            id: 'hashtag-1',
            name: 'climate',
            displayName: 'Climate',
            category: 'environment',
            description: 'Climate action',
            usageCount: 100,
            trendScore: 5.5,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          trendScore: 5.5,
          growthRate: 10.5,
        },
      ];

      mockHashtagService.getTrendingHashtags.mockResolvedValue({
        success: true,
        data: mockTrending,
      });

      const { result } = renderHook(() => useHashtagActions());

      await result.current.getTrendingHashtags(undefined, 6);

      await waitFor(() => {
        const trending = useHashtagStore.getState().trendingHashtags;
        expect(trending).toHaveLength(1);
        expect(trending[0]?.hashtag.name).toBe('climate');
      });
    });

    it('dashboard handles loading state while fetching trending hashtags', async () => {
      let resolvePromise: (value: any) => void;
      const pendingPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockHashtagService.getTrendingHashtags.mockReturnValue(pendingPromise);

      const { result: actionsResult } = renderHook(() => useHashtagActions());
      const { result: loadingResult } = renderHook(() => useHashtagLoading());

      // Start fetch (this triggers a dynamic import, so the service call happens asynchronously)
      const fetchPromise = actionsResult.current.getTrendingHashtags(undefined, 6);

      // Wait for the dynamic import to complete and the service to be called
      // Loading state should not be set for trending hashtags (by design)
      // This is intentional - trending hashtags are optional enhancements
      await waitFor(() => {
        expect(mockHashtagService.getTrendingHashtags).toHaveBeenCalled();
      }, { timeout: 1000 });

      resolvePromise!({
        success: true,
        data: [],
      });

      await fetchPromise;

      // Verify loading states are correct
      expect(loadingResult.current.isLoading).toBe(false);
      expect(loadingResult.current.isSearching).toBe(false);
    });
  });

  describe('Dashboard Loading States Integration', () => {
    it('useHashtagLoading provides all loading states for dashboard', () => {
      useHashtagStore.setState((state) => {
        state.isLoading = true;
        state.isSearching = false;
        state.isFollowing = false;
        state.isCreating = false;
      });

      const { result } = renderHook(() => useHashtagLoading());

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isSearching).toBe(false);
      expect(result.current.isFollowing).toBe(false);
      expect(result.current.isCreating).toBe(false);
    });

    it('dashboard can check loading state without causing re-renders', () => {
      useHashtagStore.setState((state) => {
        state.isLoading = true;
      });

      const { result, rerender } = renderHook(() => useHashtagLoading());

      expect(result.current.isLoading).toBe(true);

      // Update unrelated state
      useHashtagStore.setState((state) => {
        state.hashtags = [];
      });

      rerender();

      // Loading state should remain stable (memoized)
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Dashboard Error Handling Integration', () => {
    it('useHashtagError provides error states for dashboard error handling', () => {
      useHashtagStore.setState((state) => {
        state.error = 'General error';
        state.searchError = null;
        state.followError = 'Follow failed';
      });

      const { result } = renderHook(() => useHashtagError());

      expect(result.current.error).toBe('General error');
      expect(result.current.searchError).toBeNull();
      expect(result.current.followError).toBe('Follow failed');
      expect(result.current.hasError).toBe(true);
    });

    it('dashboard can handle errors gracefully when trending fetch fails', async () => {
      mockHashtagService.getTrendingHashtags.mockResolvedValue({
        success: false,
        error: 'Failed to fetch trending hashtags',
      });

      const { result: actionsResult } = renderHook(() => useHashtagActions());
      const { result: errorResult } = renderHook(() => useHashtagError());

      await actionsResult.current.getTrendingHashtags(undefined, 6);

      // Trending hashtags silently fail (no error state set)
      // This is by design to prevent unnecessary re-renders
      await waitFor(() => {
        expect(errorResult.current.error).toBeNull();
        expect(errorResult.current.hasError).toBe(false);
      });

      // Trending hashtags should remain empty
      const trending = useHashtagStore.getState().trendingHashtags;
      expect(trending).toEqual([]);
    });
  });

  describe('Dashboard Selector Hooks Integration', () => {
    it('dashboard can use multiple selector hooks efficiently', () => {
      useHashtagStore.setState((state) => {
        state.trendingHashtags = [
          {
            hashtag: {
              id: 'hashtag-1',
              name: 'climate',
              displayName: 'Climate',
              category: 'environment',
              description: 'Climate action',
              usageCount: 100,
              trendScore: 5.5,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
            trendScore: 5.5,
            growthRate: 10.5,
          },
        ];
        state.isLoading = false;
        state.error = null;
      });

      const { result: trendingResult } = renderHook(() => useTrendingHashtags());
      const { result: loadingResult } = renderHook(() => useHashtagLoading());
      const { result: errorResult } = renderHook(() => useHashtagError());

      expect(trendingResult.current).toHaveLength(1);
      expect(loadingResult.current.isLoading).toBe(false);
      expect(errorResult.current.hasError).toBe(false);
    });

    it('selector hooks maintain stable references across re-renders', () => {
      const { result: trendingResult, rerender } = renderHook(() => useTrendingHashtags());

      const firstRender = trendingResult.current;

      // Update unrelated state
      useHashtagStore.setState((state) => {
        state.hashtags = [];
      });

      rerender();

      // Reference should be stable if trending hashtags didn't change
      expect(trendingResult.current).toBe(firstRender);
    });
  });

  describe('Dashboard Action Hooks Integration', () => {
    it('useHashtagActions provides stable action references for dashboard', () => {
      const { result, rerender } = renderHook(() => useHashtagActions());

      const firstActions = result.current;

      // Update store state
      useHashtagStore.setState((state) => {
        state.hashtags = [];
      });

      rerender();

      // Actions should have stable references
      expect(result.current.getTrendingHashtags).toBe(firstActions.getTrendingHashtags);
      expect(result.current.searchHashtags).toBe(firstActions.searchHashtags);
      expect(result.current.followHashtag).toBe(firstActions.followHashtag);
    });

    it('dashboard can call actions multiple times without issues', async () => {
      mockHashtagService.getTrendingHashtags.mockResolvedValue({
        success: true,
        data: [],
      });

      const { result } = renderHook(() => useHashtagActions());

      await result.current.getTrendingHashtags(undefined, 6);
      await result.current.getTrendingHashtags(undefined, 10);

      expect(mockHashtagService.getTrendingHashtags).toHaveBeenCalledTimes(2);
    });
  });

  describe('Dashboard Widget Data Flow', () => {
    it('dashboard widget receives trending hashtags data flow', async () => {
      const mockTrending: TrendingHashtag[] = [
        {
          hashtag: {
            id: 'hashtag-1',
            name: 'climate',
            displayName: 'Climate',
            category: 'environment',
            description: 'Climate action',
            usageCount: 100,
            trendScore: 5.5,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          trendScore: 5.5,
          growthRate: 10.5,
        },
      ];

      mockHashtagService.getTrendingHashtags.mockResolvedValue({
        success: true,
        data: mockTrending,
      });

      const { result: actionsResult } = renderHook(() => useHashtagActions());
      const { result: trendingResult } = renderHook(() => useTrendingHashtags());

      // Initially empty
      expect(trendingResult.current).toEqual([]);

      // Fetch trending hashtags (as dashboard would)
      await actionsResult.current.getTrendingHashtags(undefined, 6);

      // Wait for state update
      await waitFor(() => {
        const updated = useHashtagStore.getState().trendingHashtags;
        expect(updated).toHaveLength(1);
      });

      // Hook should return updated data
      const { result: updatedTrendingResult } = renderHook(() => useTrendingHashtags());
      expect(updatedTrendingResult.current).toHaveLength(1);
      expect(updatedTrendingResult.current[0]?.hashtag.name).toBe('climate');
    });

    it('dashboard widget handles empty trending hashtags gracefully', () => {
      useHashtagStore.setState((state) => {
        state.trendingHashtags = [];
      });

      const { result } = renderHook(() => useTrendingHashtags());

      expect(result.current).toEqual([]);
      expect(result.current.length).toBe(0);
    });
  });
});

