/**
 * Polls Store Dashboard Widget Regression Tests
 *
 * Regression tests ensuring pollsStore hooks work correctly for dashboard widgets:
 * - useFilteredPollCards regression tests
 * - Dashboard widget data flow
 * - Loading and error state handling in widgets
 * - Poll card transformation and filtering
 *
 * Created: January 2025
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { act, renderHook, waitFor } from '@testing-library/react';

import {
  usePollsStore,
  usePolls,
  useFilteredPollCards,
  usePollsLoading,
  usePollsError,
  usePollsActions,
  usePollPagination,
  useActivePollsCount,
  usePollsStats,
} from '@/lib/stores/pollsStore';

const originalFetch = global.fetch;

describe('Polls Store Dashboard Widget Regression', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      usePollsStore.getState().resetPollsState();
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    global.fetch = originalFetch;
  });

  describe('useFilteredPollCards regression', () => {
    it('returns filtered poll cards for dashboard widget', () => {
      act(() => {
        usePollsStore.setState((state) => {
        state.polls = [
          {
            id: 'poll-1',
            status: 'active',
            title: 'Active Poll',
            category: 'politics',
            tags: ['election'],
            total_votes: 10,
          },
          {
            id: 'poll-2',
            status: 'closed',
            title: 'Closed Poll',
            category: 'politics',
            tags: ['election'],
            total_votes: 5,
          },
          {
            id: 'poll-3',
            status: 'active',
            title: 'Environment Poll',
            category: 'environment',
            tags: ['climate'],
            total_votes: 20,
          },
        ] as any;
        state.filters = {
          status: ['active'],
          category: [],
          tags: [],
          trendingOnly: false,
        };
      });
      });

      const { result } = renderHook(() => useFilteredPollCards());

      expect(result.current).toHaveLength(2);
      expect(result.current[0]?.id).toBe('poll-1');
      expect(result.current[1]?.id).toBe('poll-3');
    });

    it('filters poll cards by category for dashboard widget', () => {
      act(() => {
        usePollsStore.setState((state) => {
        state.polls = [
          {
            id: 'poll-1',
            status: 'active',
            category: 'politics',
            title: 'Politics Poll',
          },
          {
            id: 'poll-2',
            status: 'active',
            category: 'environment',
            title: 'Environment Poll',
          },
        ] as any;
        state.filters = {
          status: ['active'],
          category: ['politics'],
          tags: [],
          trendingOnly: false,
        };
      });
      });

      const { result } = renderHook(() => useFilteredPollCards());

      expect(result.current).toHaveLength(1);
      expect(result.current[0]?.id).toBe('poll-1');
    });

    it('filters poll cards by trendingOnly for dashboard widget', () => {
      act(() => {
        usePollsStore.setState((state) => {
        state.polls = [
          {
            id: 'poll-trending',
            status: 'active',
            trending_position: 1,
            title: 'Trending Poll',
          },
          {
            id: 'poll-regular',
            status: 'active',
            trending_position: undefined,
            title: 'Regular Poll',
          },
        ] as any;
        state.filters = {
          status: ['active'],
          category: [],
          tags: [],
          trendingOnly: true,
        };
      });
      });

      const { result } = renderHook(() => useFilteredPollCards());

      expect(result.current).toHaveLength(1);
      expect(result.current[0]?.id).toBe('poll-trending');
    });

    it('returns empty array when filters exclude all polls', () => {
      act(() => {
        usePollsStore.setState((state) => {
        state.polls = [
          {
            id: 'poll-1',
            status: 'active',
            category: 'politics',
            title: 'Politics Poll',
          },
        ] as any;
        state.filters = {
          status: ['active'],
          category: ['environment'],
          tags: [],
          trendingOnly: false,
        };
      });
      });

      const { result } = renderHook(() => useFilteredPollCards());

      expect(result.current).toHaveLength(0);
    });

    it('maintains stable reference when filters do not change', () => {
      act(() => {
        usePollsStore.setState((state) => {
        state.polls = [
          {
            id: 'poll-1',
            status: 'active',
            title: 'Test Poll',
          },
        ] as any;
        state.filters = {
          status: ['active'],
          category: [],
          tags: [],
          trendingOnly: false,
        };
      });
      });

      const { result, rerender } = renderHook(() => useFilteredPollCards());

      const firstRender = result.current;

      // Update unrelated state
      act(() => {
        usePollsStore.setState((state) => {
          state.uiState.selectedPollId = 'poll-1';
        });
      });

      rerender();

      // Reference should be stable (memoized)
      expect(result.current).toBe(firstRender);
    });
  });

  describe('Dashboard widget data flow regression', () => {
    it('dashboard widget receives polls data via usePolls hook', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            polls: [
              {
                id: 'poll-1',
                status: 'active',
                title: 'Dashboard Poll',
                total_votes: 15,
              },
            ],
          },
          metadata: {
            pagination: {
              total: 1,
              totalPages: 1,
              page: 1,
            },
          },
        }),
      }) as unknown as typeof global.fetch;

      const { result: actionsResult } = renderHook(() => usePollsActions());
      const { result: pollsResult } = renderHook(() => usePolls());

      // Initially empty
      expect(pollsResult.current).toEqual([]);

      // Load polls (as dashboard would)
      await act(async () => {
        await actionsResult.current.loadPolls();
      });

      // Wait for state update
      await waitFor(() => {
        const polls = usePollsStore.getState().polls;
        expect(polls).toHaveLength(1);
      });

      // Hook should return updated data
      const { result: updatedPollsResult } = renderHook(() => usePolls());
      expect(updatedPollsResult.current).toHaveLength(1);
      expect(updatedPollsResult.current[0]?.id).toBe('poll-1');
    });

    it('dashboard widget receives pagination data via usePollPagination hook', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            polls: Array.from({ length: 10 }, (_, i) => ({
              id: `poll-${i}`,
              status: 'active',
              title: `Poll ${i}`,
            })),
          },
          metadata: {
            pagination: {
              total: 25,
              totalPages: 3,
              page: 1,
            },
          },
        }),
      }) as unknown as typeof global.fetch;

      await act(async () => {
        await usePollsStore.getState().loadPolls();
      });

      const { result } = renderHook(() => usePollPagination());

      expect(result.current.totalResults).toBe(25);
      expect(result.current.totalPages).toBe(3);
      expect(result.current.currentPage).toBe(1);
      expect(result.current.itemsPerPage).toBeGreaterThan(0);
    });

    it('dashboard widget receives stats via usePollsStats hook', () => {
      act(() => {
        usePollsStore.setState((state) => {
        state.polls = [
          { id: 'poll-1', status: 'active', total_votes: 10 },
          { id: 'poll-2', status: 'active', total_votes: 20 },
          { id: 'poll-3', status: 'closed', total_votes: 5 },
        ] as any;
      });
      });

      const { result } = renderHook(() => usePollsStats());

      expect(result.current.total).toBe(3);
      expect(result.current.active).toBe(2);
      expect(result.current.closed).toBe(1);
      expect(result.current.totalVotes).toBe(35);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('dashboard widget receives active polls count via useActivePollsCount hook', () => {
      act(() => {
        usePollsStore.setState((state) => {
        state.polls = [
          { id: 'poll-1', status: 'active' },
          { id: 'poll-2', status: 'active' },
          { id: 'poll-3', status: 'closed' },
        ] as any;
      });
      });

      const { result } = renderHook(() => useActivePollsCount());

      expect(result.current).toBe(2);
    });
  });

  describe('Dashboard widget loading states regression', () => {
    it('usePollsLoading provides loading states for dashboard widget', () => {
      act(() => {
        usePollsStore.setState((state) => {
        state.isLoading = true;
        state.isSearching = false;
        state.isVoting = false;
      });
      });

      const { result } = renderHook(() => usePollsLoading());

      expect(result.current).toBe(true);
    });

    it('dashboard widget handles loading state transitions correctly', async () => {
      let resolveFetch: (value: any) => void;
      const pendingFetch = new Promise((resolve) => {
        resolveFetch = resolve;
      });

      global.fetch = jest.fn().mockReturnValue(pendingFetch) as unknown as typeof global.fetch;

      const { result: actionsResult } = renderHook(() => usePollsActions());
      const { result: loadingResult } = renderHook(() => usePollsLoading());

      // Start load (async - loading state will be set inside the async action)
      const loadPromise = actionsResult.current.loadPolls();

      // Wait a bit for loading state to be set
      await waitFor(() => {
        expect(loadingResult.current).toBe(true);
      }, { timeout: 1000 });

      resolveFetch!({
        ok: true,
        json: async () => ({
          success: true,
          data: { polls: [] },
          metadata: { pagination: { total: 0, totalPages: 1, page: 1 } },
        }),
      });

      await act(async () => {
        await loadPromise;
      });

      // Should not be loading after completion
      await waitFor(() => {
        expect(usePollsStore.getState().isLoading).toBe(false);
      });
    });
  });

  describe('Dashboard widget error handling regression', () => {
    it('usePollsError provides error state for dashboard widget', () => {
      act(() => {
        usePollsStore.setState((state) => {
          state.error = 'Failed to load polls';
        });
      });

      const { result } = renderHook(() => usePollsError());

      expect(result.current).toBe('Failed to load polls');
    });

    it('dashboard widget clears error on successful operation', async () => {
      act(() => {
        usePollsStore.getState().setError('Previous error');
      });

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { polls: [] },
          metadata: { pagination: { total: 0, totalPages: 1, page: 1 } },
        }),
      }) as unknown as typeof global.fetch;

      await act(async () => {
        await usePollsStore.getState().loadPolls();
      });

      const { result } = renderHook(() => usePollsError());

      expect(result.current).toBeNull();
    });
  });

  describe('Dashboard widget action hooks regression', () => {
    it('usePollsActions provides stable action references', () => {
      const { result, rerender } = renderHook(() => usePollsActions());

      const firstActions = result.current;

      // Update store state
      act(() => {
        usePollsStore.setState((state) => {
          state.polls = [];
        });
      });

      rerender();

      // Actions should have stable references
      expect(result.current.loadPolls).toBe(firstActions.loadPolls);
      expect(result.current.voteOnPoll).toBe(firstActions.voteOnPoll);
      expect(result.current.setFilters).toBe(firstActions.setFilters);
    });

    it('dashboard widget can call actions multiple times', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { polls: [] },
          metadata: { pagination: { total: 0, totalPages: 1, page: 1 } },
        }),
      }) as unknown as typeof global.fetch;

      const { result } = renderHook(() => usePollsActions());

      await act(async () => {
        await result.current.loadPolls();
      });
      await act(async () => {
        await result.current.loadPolls();
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Dashboard widget poll card transformation regression', () => {
    it('poll cards are properly transformed for dashboard display', () => {
      act(() => {
        usePollsStore.setState((state) => {
        state.polls = [
          {
            id: 'poll-1',
            status: 'active',
            title: 'Test Poll',
            description: 'Test description',
            total_votes: 10,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ] as any;
        state.filters = {
          status: ['active'],
          category: [],
          tags: [],
          trendingOnly: false,
        };
      });
      });

      const { result } = renderHook(() => useFilteredPollCards());

      expect(result.current).toHaveLength(1);
      const card = result.current[0];
      expect(card).toBeDefined();
      expect(card?.id).toBe('poll-1');
      expect(card?.title).toBe('Test Poll');
    });

    it('poll cards maintain vote history information', () => {
      act(() => {
        usePollsStore.setState((state) => {
        state.polls = [
          {
            id: 'poll-1',
            status: 'active',
            title: 'Voted Poll',
            userVote: 'option-1',
            userVoteId: 'vote-1',
          },
        ] as any;
        state.filters = {
          status: ['active'],
          category: [],
          tags: [],
          trendingOnly: false,
        };
        state.voteHistory = {
          'poll-1': {
            hasVoted: true,
            optionId: 'option-1',
            voteId: 'vote-1',
            lastVotedAt: new Date().toISOString(),
            source: 'server',
          },
        };
      });
      });

      const { result } = renderHook(() => useFilteredPollCards());

      expect(result.current).toHaveLength(1);
      expect(usePollsStore.getState().hasUserVoted('poll-1')).toBe(true);
    });
  });
});

