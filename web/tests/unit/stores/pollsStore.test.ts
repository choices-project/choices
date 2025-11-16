import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type { PollsStore } from '@/lib/stores/pollsStore';
import {
  createInitialPollsState,
  createPollsActions,
} from '@/lib/stores/pollsStore';
import type { PollCreatePayload } from '@/lib/polls/wizard/submission';

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
    expect(state.voteHistory).toEqual({});
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
      status: 200,
      json: async () => ({}),
    }) as unknown as typeof global.fetch;

    const result = await store.getState().voteOnPoll('poll-1', 'option-1');

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
    expect(result.success).toBe(true);
  });

  it('hasUserVoted reflects server-provided metadata', () => {
    const store = createTestPollsStore();
    const poll = {
      id: 'poll-server-metadata',
      status: 'active',
      userVote: 'choice-1',
    } as unknown as Parameters<PollsStore['setPolls']>[0][number];

    store.getState().setPolls([poll]);

    expect(store.getState().hasUserVoted('poll-server-metadata')).toBe(true);
  });

  it('hasUserVoted tracks optimistic vote history across vote and undo actions', async () => {
    const store = createTestPollsStore();
    const poll = {
      id: 'poll-history',
      status: 'active',
      total_votes: 0,
    } as unknown as Parameters<PollsStore['setPolls']>[0][number];

    store.getState().setPolls([poll]);

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ totalVotes: 1, voteId: 'vote-1' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ totalVotes: 0 }),
      }) as unknown as typeof global.fetch;

    await store.getState().voteOnPoll('poll-history', 'option-1');
    expect(store.getState().hasUserVoted('poll-history')).toBe(true);

    await store.getState().undoVote('poll-history');
    expect(store.getState().hasUserVoted('poll-history')).toBe(false);
    expect(store.getState().voteHistory['poll-history']).toBeUndefined();
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
      status: 500,
      json: async () => ({}),
    }) as unknown as typeof global.fetch;

    const result = await store.getState().voteOnPoll('poll-1', 'option-1');

    const state = store.getState();
    expect(result.success).toBe(false);
    expect(state.error).toBe(result.message);
    expect(state.isVoting).toBe(false);
    expect(state.polls[0].total_votes).toBe(0);
  });

  it('searchPolls updates search state', async () => {
    const store = createTestPollsStore();

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          polls: [
        {
          id: 'poll-1',
          status: 'active',
          title: 'Climate Action',
              userVote: null,
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

  it('setSearchQuery tracks recent searches without duplicates', () => {
    const store = createTestPollsStore();

    store.getState().setSearchQuery('climate');
    store.getState().setSearchQuery('Climate');
    store.getState().setSearchQuery('education');

    expect(store.getState().search.recentSearches).toEqual(['education', 'Climate']);
    expect(store.getState().search.query).toBe('education');
  });

  it('setFilters normalizes values and applies trending toggle', () => {
    const store = createTestPollsStore();

    store.getState().setFilters({ status: ['active', 'invalid'], trendingOnly: true });

    const filters = store.getState().filters;
    expect(filters.status).toEqual(['active']);
    expect(filters.trendingOnly).toBe(true);
  });

  it('setItemsPerPage recalculates total pages when results exist', () => {
    const store = createTestPollsStore();

    store.setState((state) => {
      state.search.totalResults = 45;
      state.search.totalPages = 3;
    });

    store.getState().setItemsPerPage(25);

    const state = store.getState();
    expect(state.preferences.itemsPerPage).toBe(25);
    expect(state.search.totalPages).toBe(2);
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

  it('createPoll returns structured success result', async () => {
    const store = createTestPollsStore();
    const payload: PollCreatePayload = {
      title: 'Transit Improvements',
      question: 'Transit Improvements',
      description: 'Share your feedback on the proposed transit upgrades.',
      category: 'infrastructure',
      tags: ['transit'],
      options: [{ text: 'Support' }, { text: 'Oppose' }],
      settings: {
        allowMultipleVotes: false,
        allowAnonymousVotes: true,
        requireAuthentication: false,
        showResultsBeforeClose: true,
        allowComments: true,
        allowSharing: true,
        privacyLevel: 'public',
      },
      metadata: {},
    };

    const mockRequest = jest.fn().mockResolvedValue({
      success: true,
      ok: true,
      status: 201,
      data: { id: 'poll-created', title: 'Transit Improvements' },
      durationMs: 123,
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
        id: 'poll-created',
        status: 'draft',
        title: 'Transit Improvements',
          userVote: null,
        },
      }),
    }) as unknown as typeof global.fetch;

    const result = await store.getState().createPoll(payload, { request: mockRequest });
    await new Promise((resolve) => setImmediate(resolve));

    expect(mockRequest).toHaveBeenCalledWith(payload, undefined);
    expect(result.success).toBe(true);
    expect(store.getState().error).toBeNull();
    expect(global.fetch).toHaveBeenCalledWith('/api/polls/poll-created');
    expect(store.getState().polls[0]?.id).toBe('poll-created');
  });

  it('createPoll surfaces error details when request fails', async () => {
    const store = createTestPollsStore();
    const payload: PollCreatePayload = {
      title: 'Library Upgrade',
      question: 'Library Upgrade',
      description: 'Should we renovate the community library?',
      category: 'community',
      tags: ['library'],
      options: [{ text: 'Yes' }, { text: 'No' }],
      settings: {
        allowMultipleVotes: false,
        allowAnonymousVotes: false,
        requireAuthentication: true,
        showResultsBeforeClose: false,
        allowComments: false,
        allowSharing: false,
        privacyLevel: 'unlisted',
      },
      metadata: {},
    };

    const failure = {
      success: false as const,
      status: 422,
      message: 'Title already exists',
      reason: 'validation' as const,
      fieldErrors: { title: 'Duplicate title' },
    };

    const mockRequest = jest.fn().mockResolvedValue(failure);

    const result = await store.getState().createPoll(payload, { request: mockRequest });

    expect(mockRequest).toHaveBeenCalledWith(payload, undefined);
    expect(result).toEqual(failure);
    expect(store.getState().error).toBe('Title already exists');
  });
});

