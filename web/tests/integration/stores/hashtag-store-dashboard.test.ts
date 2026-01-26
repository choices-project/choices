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
 * Un-archived: Store modernization lower-priority work
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { renderHook, waitFor } from '@testing-library/react';

import type { Hashtag, TrendingHashtag } from '@/features/hashtags/types';
import {
  useHashtagStore,
  useTrendingHashtags,
  useHashtagActions,
  useHashtagLoading,
  useHashtagError,
} from '@/lib/stores/hashtagStore';

const mockHashtagService = {
  getTrendingHashtags: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  searchHashtags: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  followHashtag: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
  getUserHashtags: jest.fn<(...args: unknown[]) => Promise<unknown>>(),
};

const createHashtag = (overrides: Partial<Hashtag> = {}): Hashtag => ({
  id: 'hashtag-1',
  name: 'climate',
  display_name: 'Climate',
  category: 'environment',
  description: 'Climate action',
  usage_count: 100,
  is_trending: true,
  is_verified: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

const createTrendingHashtag = (
  overrides: Partial<TrendingHashtag> = {},
): TrendingHashtag => ({
  hashtag: createHashtag(),
  trend_score: 5.5,
  growth_rate: 10.5,
  peak_usage: 200,
  time_period: '7d',
  ...overrides,
});

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
        createTrendingHashtag({
          hashtag: createHashtag({
            id: 'hashtag-1',
            name: 'climate',
            display_name: 'Climate',
            category: 'environment',
            description: 'Climate action',
            usage_count: 100,
          }),
          trend_score: 5.5,
          growth_rate: 10.5,
        }),
        createTrendingHashtag({
          hashtag: createHashtag({
            id: 'hashtag-2',
            name: 'politics',
            display_name: 'Politics',
            category: 'politics',
            description: 'Political discussions',
            usage_count: 200,
          }),
          trend_score: 4.5,
          growth_rate: 8.5,
        }),
      ];

      useHashtagStore.setState((state) => {
        state.trendingHashtags = mockTrending;
      });

      const { result } = renderHook(() => useTrendingHashtags());

      expect(result.current).toEqual(mockTrending);
    });

    it('dashboard can fetch trending hashtags via useHashtagActions', async () => {
      const mockTrending: TrendingHashtag[] = [
        createTrendingHashtag({
          hashtag: createHashtag({
            id: 'hashtag-1',
            name: 'climate',
            display_name: 'Climate',
            category: 'environment',
            description: 'Climate action',
            usage_count: 100,
          }),
          trend_score: 5.5,
          growth_rate: 10.5,
        }),
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
      let resolvePromise: (value: unknown) => void;
      const pendingPromise = new Promise<unknown>((resolve) => {
        resolvePromise = resolve;
      });

      mockHashtagService.getTrendingHashtags.mockReturnValue(pendingPromise);

      const { result: actionsResult } = renderHook(() => useHashtagActions());
      const { result: loadingResult } = renderHook(() => useHashtagLoading());

      const fetchPromise = actionsResult.current.getTrendingHashtags(undefined, 6);

      await waitFor(
        () => {
          expect(mockHashtagService.getTrendingHashtags).toHaveBeenCalled();
        },
        { timeout: 2000 },
      );

      resolvePromise!({
        success: true,
        data: [],
      });

      await fetchPromise;

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

      useHashtagStore.setState((state) => {
        state.hashtags = [];
      });

      rerender();

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

      await waitFor(() => {
        expect(errorResult.current.error).toBeNull();
        expect(errorResult.current.hasError).toBe(false);
      });

      const trending = useHashtagStore.getState().trendingHashtags;
      expect(trending).toEqual([]);
    });
  });

  describe('Dashboard Selector Hooks Integration', () => {
    it('dashboard can use multiple selector hooks efficiently', () => {
      useHashtagStore.setState((state) => {
        state.trendingHashtags = [
          createTrendingHashtag({
            hashtag: createHashtag({
              id: 'hashtag-1',
              name: 'climate',
              display_name: 'Climate',
              category: 'environment',
              description: 'Climate action',
              usage_count: 100,
            }),
            trend_score: 5.5,
            growth_rate: 10.5,
          }),
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
      const { result: trendingResult, rerender } = renderHook(() =>
        useTrendingHashtags(),
      );

      const firstRender = trendingResult.current;

      useHashtagStore.setState((state) => {
        state.hashtags = [];
      });

      rerender();

      expect(trendingResult.current).toBe(firstRender);
    });
  });

  describe('Dashboard Action Hooks Integration', () => {
    it('useHashtagActions provides stable action references for dashboard', () => {
      const { result, rerender } = renderHook(() => useHashtagActions());

      const firstActions = result.current;

      useHashtagStore.setState((state) => {
        state.hashtags = [];
      });

      rerender();

      expect(result.current.getTrendingHashtags).toBe(
        firstActions.getTrendingHashtags,
      );
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
        createTrendingHashtag({
          hashtag: createHashtag({
            id: 'hashtag-1',
            name: 'climate',
            display_name: 'Climate',
            category: 'environment',
            description: 'Climate action',
            usage_count: 100,
          }),
          trend_score: 5.5,
          growth_rate: 10.5,
        }),
      ];

      mockHashtagService.getTrendingHashtags.mockResolvedValue({
        success: true,
        data: mockTrending,
      });

      const { result: actionsResult } = renderHook(() => useHashtagActions());
      const { result: trendingResult } = renderHook(() => useTrendingHashtags());

      expect(trendingResult.current).toEqual([]);

      await actionsResult.current.getTrendingHashtags(undefined, 6);

      await waitFor(() => {
        const updated = useHashtagStore.getState().trendingHashtags;
        expect(updated).toHaveLength(1);
      });

      const { result: updatedTrendingResult } = renderHook(() =>
        useTrendingHashtags(),
      );
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
