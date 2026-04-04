/**
 * Unit tests for pollsStore
 *
 * Covers initial state, setPolls, filters, hasUserVoted, and vote history.
 * ROADMAP 4.2 Store test harnesses.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type { PollsStore } from '@/lib/stores/pollsStore';
import {
  createInitialPollsState,
  createPollsActions,
} from '@/lib/stores/pollsStore';

const createTestPollsStore = () =>
  create<PollsStore>()(
    immer((set, get) =>
      Object.assign(createInitialPollsState(), createPollsActions(set, get))
    )
  );

describe('pollsStore', () => {
  it('initializes with default state', () => {
    const store = createTestPollsStore();
    const state = store.getState();

    expect(state.polls).toEqual([]);
    expect(state.uiState).toEqual({
      selectedPollId: null,
      expandedPollIds: [],
      votingInProgress: [],
    });
    expect(state.filters.status).toEqual(['active']);
    expect(state.preferences.defaultView).toBe('list');
    expect(state.search.query).toBe('');
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.filters.trendingOnly).toBe(false);
    expect(state.lastFetchedAt).toBeNull();
    expect(state.voteHistory).toEqual({});
  });

  it('setPolls replaces poll list', () => {
    const store = createTestPollsStore();
    const poll = {
      id: 'poll-1',
      status: 'active',
      title: 'Climate Action',
      total_votes: 0,
    } as Parameters<PollsStore['setPolls']>[0][number];

    store.getState().setPolls([poll]);

    expect(store.getState().polls).toHaveLength(1);
    expect(store.getState().polls[0]).toMatchObject({ id: 'poll-1', title: 'Climate Action' });
    expect(store.getState().lastFetchedAt).not.toBeNull();
  });

  it('setFilters updates filter state', () => {
    const store = createTestPollsStore();
    store.getState().setFilters({ status: ['closed'] });

    expect(store.getState().filters.status).toEqual(['closed']);

    store.getState().setFilters({ trendingOnly: true });
    expect(store.getState().filters.trendingOnly).toBe(true);
  });

  it('clearFilters resets to defaults', () => {
    const store = createTestPollsStore();
    store.getState().setFilters({ status: ['closed'], trendingOnly: true });
    store.getState().clearFilters();

    expect(store.getState().filters.status).toEqual(['active']);
    expect(store.getState().filters.trendingOnly).toBe(false);
  });

  it('hasUserVoted reflects server-provided metadata', () => {
    const store = createTestPollsStore();
    const poll = {
      id: 'poll-server-metadata',
      status: 'active',
      userVote: 'choice-1',
    } as Parameters<PollsStore['setPolls']>[0][number];

    store.getState().setPolls([poll]);

    expect(store.getState().hasUserVoted('poll-server-metadata')).toBe(true);
    expect(store.getState().hasUserVoted('poll-nonexistent')).toBe(false);
  });

  it('setSearchQuery updates search state', () => {
    const store = createTestPollsStore();
    store.getState().setSearchQuery('climate');

    expect(store.getState().search.query).toBe('climate');
  });

  it('clearSearch resets search', () => {
    const store = createTestPollsStore();
    store.getState().setSearchQuery('climate');
    store.getState().clearSearch();

    expect(store.getState().search.query).toBe('');
  });
});
