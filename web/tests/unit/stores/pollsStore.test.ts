import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type { PollCreatePayload } from '@/lib/polls/wizard/submission';
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

describe('pollsStore selectors and computed values (RTL)', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    jest.restoreAllMocks();
    global.fetch = originalFetch;
  });

  it('polls state is accessible via store', () => {
    const store = createTestPollsStore();
    const poll = {
      id: 'poll-1',
      status: 'active',
      title: 'Test Poll',
    } as unknown as Parameters<PollsStore['setPolls']>[0][number];

    store.getState().setPolls([poll]);

    const polls = store.getState().polls;
    expect(polls).toHaveLength(1);
    expect(polls[0]?.id).toBe('poll-1');
  });

  it('loading state is accessible via store', () => {
    const store = createTestPollsStore();

    store.getState().setLoading(true);
    expect(store.getState().isLoading).toBe(true);

    store.getState().setLoading(false);
    expect(store.getState().isLoading).toBe(false);
  });

  it('error state is accessible via store', () => {
    const store = createTestPollsStore();

    store.getState().setError('Test error');
    expect(store.getState().error).toBe('Test error');

    store.getState().clearError();
    expect(store.getState().error).toBeNull();
  });

  it('lastFetchedAt timestamp is updated when polls are set', () => {
    const store = createTestPollsStore();

    expect(store.getState().lastFetchedAt).toBeNull();

    const poll = {
      id: 'poll-1',
      status: 'active',
    } as unknown as Parameters<PollsStore['setPolls']>[0][number];

    store.getState().setPolls([poll]);
    expect(store.getState().lastFetchedAt).not.toBeNull();
  });

  it('actions maintain stable references', () => {
    const store = createTestPollsStore();
    const actions1 = store.getState();
    const actions2 = store.getState();

    // Actions should be stable references
    expect(actions1.loadPolls).toBe(actions2.loadPolls);
    expect(actions1.voteOnPoll).toBe(actions2.voteOnPoll);
    expect(actions1.setFilters).toBe(actions2.setFilters);
  });
});

describe('pollsStore dashboard widget regression tests', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    jest.restoreAllMocks();
    global.fetch = originalFetch;
  });

  describe('getFilteredPolls for dashboard widgets', () => {
    it('filters polls by status for dashboard widget', () => {
      const store = createTestPollsStore();
      const activePoll = {
        id: 'poll-active',
        status: 'active',
        title: 'Active Poll',
      } as unknown as Parameters<PollsStore['setPolls']>[0][number];
      const closedPoll = {
        id: 'poll-closed',
        status: 'closed',
        title: 'Closed Poll',
      } as unknown as Parameters<PollsStore['setPolls']>[0][number];

      store.getState().setPolls([activePoll, closedPoll]);
      store.getState().setFilters({ status: ['active'] });

      const filteredPolls = store.getState().getFilteredPolls();
      expect(filteredPolls).toHaveLength(1);
      expect(filteredPolls[0]?.id).toBe('poll-active');
    });

    it('filters polls by category for dashboard widget', () => {
      const store = createTestPollsStore();
      const politicsPoll = {
        id: 'poll-politics',
        status: 'active',
        category: 'politics',
        title: 'Politics Poll',
      } as unknown as Parameters<PollsStore['setPolls']>[0][number];
      const environmentPoll = {
        id: 'poll-environment',
        status: 'active',
        category: 'environment',
        title: 'Environment Poll',
      } as unknown as Parameters<PollsStore['setPolls']>[0][number];

      store.getState().setPolls([politicsPoll, environmentPoll]);
      store.getState().setFilters({ status: ['active'], category: ['politics'] });

      const filteredPolls = store.getState().getFilteredPolls();
      expect(filteredPolls).toHaveLength(1);
      expect(filteredPolls[0]?.id).toBe('poll-politics');
    });

    it('filters polls by trendingOnly for dashboard widget', () => {
      const store = createTestPollsStore();
      const trendingPoll = {
        id: 'poll-trending',
        status: 'active',
        trending_position: 1,
        title: 'Trending Poll',
      } as unknown as Parameters<PollsStore['setPolls']>[0][number];
      const regularPoll = {
        id: 'poll-regular',
        status: 'active',
        trending_position: undefined,
        title: 'Regular Poll',
      } as unknown as Parameters<PollsStore['setPolls']>[0][number];

      store.getState().setPolls([trendingPoll, regularPoll]);
      store.getState().setFilters({ status: ['active'], trendingOnly: true });

      const filteredPolls = store.getState().getFilteredPolls();
      expect(filteredPolls).toHaveLength(1);
      expect(filteredPolls[0]?.id).toBe('poll-trending');
    });

    it('filters polls by tags for dashboard widget', () => {
      const store = createTestPollsStore();
      const taggedPoll = {
        id: 'poll-tagged',
        status: 'active',
        tags: ['climate', 'environment'],
        title: 'Tagged Poll',
      } as unknown as Parameters<PollsStore['setPolls']>[0][number];
      const untaggedPoll = {
        id: 'poll-untagged',
        status: 'active',
        tags: ['politics'],
        title: 'Untagged Poll',
      } as unknown as Parameters<PollsStore['setPolls']>[0][number];

      store.getState().setPolls([taggedPoll, untaggedPoll]);
      store.getState().setFilters({ status: ['active'], tags: ['climate'] });

      const filteredPolls = store.getState().getFilteredPolls();
      expect(filteredPolls).toHaveLength(1);
      expect(filteredPolls[0]?.id).toBe('poll-tagged');
    });

    it('returns all polls when no filters applied for dashboard widget', () => {
      const store = createTestPollsStore();
      const poll1 = {
        id: 'poll-1',
        status: 'active',
        title: 'Poll 1',
      } as unknown as Parameters<PollsStore['setPolls']>[0][number];
      const poll2 = {
        id: 'poll-2',
        status: 'active',
        title: 'Poll 2',
      } as unknown as Parameters<PollsStore['setPolls']>[0][number];

      store.getState().setPolls([poll1, poll2]);
      store.getState().setFilters({ status: ['active'] });

      const filteredPolls = store.getState().getFilteredPolls();
      expect(filteredPolls).toHaveLength(2);
    });

    it('returns empty array when filters exclude all polls for dashboard widget', () => {
      const store = createTestPollsStore();
      const poll = {
        id: 'poll-1',
        status: 'active',
        category: 'politics',
        title: 'Politics Poll',
      } as unknown as Parameters<PollsStore['setPolls']>[0][number];

      store.getState().setPolls([poll]);
      store.getState().setFilters({ status: ['active'], category: ['environment'] });

      const filteredPolls = store.getState().getFilteredPolls();
      expect(filteredPolls).toHaveLength(0);
    });
  });

  describe('dashboard widget data consistency', () => {
    it('poll cards maintain consistent structure for dashboard rendering', async () => {
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
                title: 'Test Poll',
                description: 'Test description',
                total_votes: 10,
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

      await store.getState().loadPolls();

      const polls = store.getState().polls;
      expect(polls).toHaveLength(1);
      expect(polls[0]).toMatchObject({
        id: 'poll-1',
        status: 'active',
        title: 'Test Poll',
      });
    });

    it('dashboard widget handles vote history correctly', () => {
      const store = createTestPollsStore();
      const poll = {
        id: 'poll-1',
        status: 'active',
        userVote: 'option-1',
        userVoteId: 'vote-1',
        title: 'Voted Poll',
      } as unknown as Parameters<PollsStore['setPolls']>[0][number];

      store.getState().setPolls([poll]);

      expect(store.getState().hasUserVoted('poll-1')).toBe(true);
      expect(store.getState().voteHistory['poll-1']).toBeDefined();
    });

    it('dashboard widget can determine if user can vote', () => {
      const store = createTestPollsStore();
      const activePoll = {
        id: 'poll-active',
        status: 'active',
        closed_at: null,
        title: 'Active Poll',
      } as unknown as Parameters<PollsStore['setPolls']>[0][number];
      const closedPoll = {
        id: 'poll-closed',
        status: 'closed',
        closed_at: new Date().toISOString(),
        title: 'Closed Poll',
      } as unknown as Parameters<PollsStore['setPolls']>[0][number];

      store.getState().setPolls([activePoll, closedPoll]);

      expect(store.getState().canUserVote('poll-active')).toBe(true);
      expect(store.getState().canUserVote('poll-closed')).toBe(false);
    });
  });

  describe('dashboard widget loading states', () => {
    it('dashboard widget receives correct loading state', async () => {
      const store = createTestPollsStore();
      let resolveFetch: (value: any) => void;
      const pendingFetch = new Promise((resolve) => {
        resolveFetch = resolve;
      });

      global.fetch = jest.fn().mockReturnValue(pendingFetch) as unknown as typeof global.fetch;

      const loadPromise = store.getState().loadPolls();

      expect(store.getState().isLoading).toBe(true);

      resolveFetch!({
        ok: true,
        json: async () => ({
          success: true,
          data: { polls: [] },
          metadata: { pagination: { total: 0, totalPages: 1, page: 1 } },
        }),
      });

      await loadPromise;

      expect(store.getState().isLoading).toBe(false);
    });

    it('dashboard widget handles search loading state', async () => {
      const store = createTestPollsStore();
      let resolveFetch: (value: any) => void;
      const pendingFetch = new Promise((resolve) => {
        resolveFetch = resolve;
      });

      global.fetch = jest.fn().mockReturnValue(pendingFetch) as unknown as typeof global.fetch;

      const searchPromise = store.getState().searchPolls('test');

      expect(store.getState().isSearching).toBe(true);

      resolveFetch!({
        ok: true,
        json: async () => ({
          success: true,
          data: { polls: [] },
          metadata: { pagination: { total: 0, totalPages: 1, page: 1 } },
        }),
      });

      await searchPromise;

      expect(store.getState().isSearching).toBe(false);
    });
  });

  describe('dashboard widget error handling', () => {
    it('dashboard widget receives error state on load failure', async () => {
      const store = createTestPollsStore();

      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({}),
      }) as unknown as typeof global.fetch;

      await store.getState().loadPolls();

      expect(store.getState().error).toBeTruthy();
      expect(store.getState().isLoading).toBe(false);
    });

    it('dashboard widget clears error on successful load', async () => {
      const store = createTestPollsStore();

      // Set initial error
      store.getState().setError('Previous error');

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          data: { polls: [] },
          metadata: { pagination: { total: 0, totalPages: 1, page: 1 } },
        }),
      }) as unknown as typeof global.fetch;

      await store.getState().loadPolls();

      expect(store.getState().error).toBeNull();
    });
  });

  describe('dashboard widget pagination', () => {
    it('dashboard widget receives correct pagination data', async () => {
      const store = createTestPollsStore();

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

      await store.getState().loadPolls();

      const state = store.getState();
      expect(state.search.totalResults).toBe(25);
      expect(state.search.totalPages).toBe(3);
      expect(state.search.currentPage).toBe(1);
    });

    it('dashboard widget handles pagination changes', () => {
      const store = createTestPollsStore();

      store.getState().setCurrentPage(2);
      expect(store.getState().search.currentPage).toBe(2);

      store.getState().setItemsPerPage(25);
      expect(store.getState().preferences.itemsPerPage).toBe(25);
    });
  });

  describe('dashboard widget preferences', () => {
    it('dashboard widget respects view preferences', () => {
      const store = createTestPollsStore();

      store.getState().setView('grid');
      expect(store.getState().preferences.defaultView).toBe('grid');

      store.getState().setView('list');
      expect(store.getState().preferences.defaultView).toBe('list');
    });

    it('dashboard widget persists preferences', () => {
      const store = createTestPollsStore();

      store.getState().updatePreferences({
        defaultView: 'grid',
        sortBy: 'trending',
        itemsPerPage: 50,
      });

      const prefs = store.getState().preferences;
      expect(prefs.defaultView).toBe('grid');
      expect(prefs.sortBy).toBe('trending');
      expect(prefs.itemsPerPage).toBe(50);
    });
  });
});

