import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type { PollsStore } from '@/lib/stores/pollsStore';
import {
  createInitialPollsState,
  createPollsActions,
} from '@/lib/stores/pollsStore';

const createTestPollsStore = () =>
  create<PollsStore>()(
    immer((set, get, _api) =>
      Object.assign(createInitialPollsState(), createPollsActions(set, get))
    )
  );

describe('pollsStore', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    jest.restoreAllMocks();
    global.fetch = originalFetch;
  });

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
  });

  it('setPolls replaces poll list', () => {
    const store = createTestPollsStore();
    const poll = {
      id: 'poll-1',
      status: 'active',
      title: 'Climate Action',
    } as unknown as Parameters<PollsStore['setPolls']>[0][number];

    store.getState().setPolls([poll]);

    expect(store.getState().polls).toEqual([poll]);
    expect(store.getState().lastFetchedAt).not.toBeNull();
  });

  it('voteOnPoll increments total votes and clears voting flag', async () => {
    const store = createTestPollsStore();
    const poll = {
      id: 'poll-1',
      status: 'active',
      total_votes: 2,
    } as unknown as Parameters<PollsStore['setPolls']>[0][number];

    store.getState().setPolls([poll]);

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    }) as unknown as typeof global.fetch;

    await store.getState().voteOnPoll('poll-1', 'option-1');

    const state = store.getState();
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/polls/vote',
      expect.objectContaining({
        method: 'POST',
      })
    );
    expect(state.polls[0].total_votes).toBe(3);
    expect(state.isVoting).toBe(false);
    expect(state.uiState.votingInProgress).toEqual([]);
    expect(state.error).toBeNull();
  });

  it('voteOnPoll captures errors from failed requests', async () => {
    const store = createTestPollsStore();
    const poll = {
      id: 'poll-1',
      status: 'active',
      total_votes: 0,
    } as unknown as Parameters<PollsStore['setPolls']>[0][number];

    store.getState().setPolls([poll]);

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
    }) as unknown as typeof global.fetch;

    await store.getState().voteOnPoll('poll-1', 'option-1');

    const state = store.getState();
    expect(state.error).toBe('Failed to vote on poll');
    expect(state.isVoting).toBe(false);
    expect(state.polls[0].total_votes).toBe(0);
  });

  it('searchPolls updates search state', async () => {
    const store = createTestPollsStore();

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 'poll-1',
          status: 'active',
          title: 'Climate Action',
        },
      ],
    }) as unknown as typeof global.fetch;

    await store.getState().searchPolls('climate');

    const state = store.getState();
    expect((global.fetch as jest.Mock)).toHaveBeenCalled();
    const [requestUrl] = (global.fetch as jest.Mock).mock.calls[0];
    expect(requestUrl).toContain('/api/polls?');
    expect(requestUrl).toContain('search=climate');
    expect(state.search.query).toBe('climate');
    expect(state.search.results).toHaveLength(1);
    expect(state.isSearching).toBe(false);
    expect(state.error).toBeNull();
    expect(state.polls).toHaveLength(1);
    expect(state.lastFetchedAt).not.toBeNull();
  });

  it('resetPollsState restores defaults', () => {
    const store = createTestPollsStore();

    store.getState().setPolls([
      {
        id: 'poll-1',
        status: 'active',
      } as unknown as Parameters<PollsStore['setPolls']>[0][number],
    ]);
    store.getState().setFilters({ status: ['closed'] });
    store.getState().setView('grid');
    store.getState().setVoting(true);

    store.getState().resetPollsState();

    const state = store.getState();
    expect(state.polls).toEqual([]);
    expect(state.filters.status).toEqual(['active']);
    expect(state.preferences.defaultView).toBe('list');
    expect(state.isVoting).toBe(false);
    expect(state.filters.trendingOnly).toBe(false);
    expect(state.lastFetchedAt).toBeNull();
  });
});

