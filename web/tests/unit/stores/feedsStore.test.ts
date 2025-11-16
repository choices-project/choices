import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

jest.mock('@/lib/utils/privacy-guard', () => ({
  hasPrivacyConsent: jest.fn().mockReturnValue(true),
  PrivacyDataType: { FEED_ACTIVITY: 'FEED_ACTIVITY' },
}));

jest.mock('@/lib/stores/services/feedsService', () => {
  const actual = jest.requireActual('@/lib/stores/services/feedsService');
  return {
    ...actual,
    fetchFeedsFromApi: jest.fn(),
  };
});

import type { FeedItem, FeedsStore } from '@/lib/stores/feedsStore';
import {
  createInitialFeedsState,
  feedsStoreCreator,
} from '@/lib/stores/feedsStore';
import { fetchFeedsFromApi } from '@/lib/stores/services/feedsService';
import { hasPrivacyConsent } from '@/lib/utils/privacy-guard';

const createTestFeedsStore = () =>
  create<FeedsStore>()(immer(feedsStoreCreator));

const fetchFeedsFromApiMock =
  fetchFeedsFromApi as jest.MockedFunction<typeof fetchFeedsFromApi>;

beforeEach(() => {
  fetchFeedsFromApiMock.mockReset();
  fetchFeedsFromApiMock.mockResolvedValue({
    feeds: [],
    count: 0,
    filters: {
      category: 'all',
      district: null,
      sort: 'trending',
    },
    pagination: {
      total: 0,
      limit: 0,
      offset: 0,
      hasMore: false,
    },
  });
});

const createFeed = (overrides: Partial<FeedItem> = {}): FeedItem => ({
  id: 'feed-1',
  title: 'Representative passes bill',
  content: 'Detailed content about the new bill.',
  summary: 'Summary of the bill update.',
  author: {
    id: 'author-1',
    name: 'Representative Smith',
    avatar: undefined,
    verified: true,
  },
  category: 'civics',
  tags: ['civics', 'legislation'],
  type: 'article',
  source: {
    name: 'Civic Source',
    url: 'https://example.com',
    logo: undefined,
    verified: true,
  },
  publishedAt: new Date('2025-01-01T00:00:00Z').toISOString(),
  updatedAt: new Date('2025-01-01T00:00:00Z').toISOString(),
  readTime: 3,
  engagement: {
    likes: 0,
    shares: 0,
    comments: 0,
    views: 0,
  },
  userInteraction: {
    liked: false,
    shared: false,
    bookmarked: false,
    read: false,
    readAt: null,
  },
  metadata: {
    language: 'en',
  },
  district: null,
  ...overrides,
});

describe('feedsStore', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('initializes with default state', () => {
    const store = createTestFeedsStore();
    const initial = createInitialFeedsState();

    expect(store.getState().feeds).toEqual(initial.feeds);
    expect(store.getState().filteredFeeds).toEqual(initial.filteredFeeds);
    expect(store.getState().filters).toEqual(initial.filters);
    expect(store.getState().preferences).toEqual(initial.preferences);
    expect(store.getState().error).toBe(initial.error);
  });

  it('setFeeds stores feeds and updates filtered list', () => {
    const store = createTestFeedsStore();
    const civicFeed = createFeed();
    const educationFeed = createFeed({
      id: 'feed-2',
      category: 'education',
      tags: ['education'],
    });

    store.getState().setFeeds([civicFeed, educationFeed]);

    expect(store.getState().feeds).toHaveLength(2);
    expect(store.getState().filteredFeeds).toHaveLength(2);

    store.getState().setFilters({ tags: ['education'] });

    expect(store.getState().filters.tags).toEqual(['education']);
    expect(store.getState().filteredFeeds).toHaveLength(1);
    expect(store.getState().filteredFeeds[0]).toMatchObject({
      id: 'feed-2',
      category: 'education',
    });
  });

  it('bookmarkFeed toggles bookmark state', async () => {
    const store = createTestFeedsStore();
    const civicFeed = createFeed();
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    store.getState().setFeeds([civicFeed]);
    await store.getState().bookmarkFeed(civicFeed.id);

    const [updatedFeed] = store.getState().feeds;
    expect(updatedFeed.userInteraction.bookmarked).toBe(true);

    await store.getState().unbookmarkFeed(civicFeed.id);
    expect(store.getState().feeds[0].userInteraction.bookmarked).toBe(false);

    fetchSpy.mockRestore();
  });

  it('searchFeeds handles network errors gracefully', async () => {
    const store = createTestFeedsStore();
    const error = new Error('network failure');

    jest.spyOn(global, 'fetch').mockRejectedValueOnce(error);

    await store.getState().searchFeeds('civics');

    const state = store.getState();
    expect(state.error).toMatch(/network failure/i);
    expect(state.isSearching).toBe(false);
  });

  it('loadFeeds fetches data and updates pagination', async () => {
    const store = createTestFeedsStore();
    const feedsPayload = {
      feeds: [
        createFeed({ id: 'feed-1' }),
        createFeed({ id: 'feed-2' }),
        createFeed({ id: 'feed-3' }),
      ],
      count: 3,
      filters: {
        category: 'all',
        district: null,
        sort: 'trending',
      },
    pagination: {
      total: 3,
      limit: 20,
      offset: 0,
      hasMore: false,
    },
    };

    fetchFeedsFromApiMock.mockResolvedValueOnce(feedsPayload);

    await store.getState().loadFeeds();

    expect(fetchFeedsFromApiMock).toHaveBeenCalledTimes(1);
    expect(fetchFeedsFromApiMock).toHaveBeenCalledWith({
      category: null,
      district: null,
      limit: 20,
    offset: 0,
      sort: 'newest',
    });

    const state = store.getState();
    expect(state.feeds).toHaveLength(3);
    expect(state.filteredFeeds).toHaveLength(3);
    expect(state.totalAvailableFeeds).toBe(3);
    expect(state.hasMoreFeeds).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('loadMoreFeeds appends new items and respects hasMore flag', async () => {
    const store = createTestFeedsStore();

    const initialPayload = {
      feeds: [
        createFeed({ id: 'feed-1' }),
        createFeed({ id: 'feed-2' }),
      ],
      count: 4,
      filters: {
        category: 'all',
        district: null,
        sort: 'newest',
      },
    pagination: {
      total: 4,
      limit: 20,
      offset: 0,
      hasMore: true,
    },
    };

    const additionalPayload = {
      feeds: [
        createFeed({ id: 'feed-3' }),
        createFeed({ id: 'feed-4' }),
      ],
      count: 4,
      filters: {
        category: 'all',
        district: null,
        sort: 'newest',
      },
    pagination: {
      total: 4,
      limit: 20,
      offset: 2,
      hasMore: false,
    },
    };

    fetchFeedsFromApiMock
      .mockResolvedValueOnce(initialPayload)
      .mockResolvedValueOnce(additionalPayload);

    await store.getState().loadFeeds();
    expect(store.getState().feeds).toHaveLength(2);
    expect(store.getState().hasMoreFeeds).toBe(true);

    await store.getState().loadMoreFeeds();
    const state = store.getState();

    expect(fetchFeedsFromApiMock).toHaveBeenCalledTimes(2);
    expect(fetchFeedsFromApiMock.mock.calls[0]?.[0]).toEqual({
      category: null,
      district: null,
      limit: 20,
    offset: 0,
      sort: 'newest',
    });
    expect(fetchFeedsFromApiMock.mock.calls[1]?.[0]).toEqual({
      category: null,
      district: null,
    limit: 20,
    offset: 2,
      sort: 'newest',
    });
    expect(state.feeds).toHaveLength(4);
    expect(state.hasMoreFeeds).toBe(false);
  });

  it('loadFeeds handles error responses gracefully', async () => {
    const store = createTestFeedsStore();

    fetchFeedsFromApiMock.mockRejectedValueOnce(
      new Error('Failed to fetch feeds (status 500)'),
    );

    await store.getState().loadFeeds();

    const state = store.getState();
    expect(state.feeds).toHaveLength(0);
    expect(state.filteredFeeds).toHaveLength(0);
    expect(state.error).toMatch(/Failed to fetch feeds/i);
    expect(state.isLoading).toBe(false);
  });

  it('resetFeedsState clears mutable state while respecting options', () => {
    const store = createTestFeedsStore();
    const civicFeed = createFeed();

    store.getState().setFeeds([civicFeed]);
    store.getState().setFilters({ tags: ['civics'], district: 'NY-12' });
    store.getState().updatePreferences({ sortBy: 'popular' });

    store.getState().resetFeedsState({
      preserveFilters: false,
      preservePreferences: false,
      preserveRecentSearches: false,
    });

    const state = store.getState();

    expect(state.feeds).toHaveLength(0);
    expect(state.filteredFeeds).toHaveLength(0);
    expect(state.filters.tags).toHaveLength(0);
    expect(state.preferences.sortBy).toBe('newest');
    expect(state.totalAvailableFeeds).toBe(0);
    expect(state.hasMoreFeeds).toBe(false);
  });

  it('loadMoreFeeds merges unique feed items without duplicates', async () => {
    const store = createTestFeedsStore();

    const initialPayload = {
      feeds: [
        createFeed({ id: 'feed-1' }),
        createFeed({ id: 'feed-2' }),
      ],
      count: 3,
      filters: {
        category: 'all',
        district: null,
        sort: 'newest',
      },
    pagination: {
      total: 3,
      limit: 20,
      offset: 0,
      hasMore: true,
    },
    };
    const additionalPayload = {
      feeds: [
        createFeed({ id: 'feed-2' }),
        createFeed({ id: 'feed-3' }),
      ],
      count: 3,
      filters: {
        category: 'all',
        district: null,
        sort: 'newest',
      },
    pagination: {
      total: 3,
      limit: 20,
      offset: 2,
      hasMore: false,
    },
    };

    fetchFeedsFromApiMock
      .mockResolvedValueOnce(initialPayload)
      .mockResolvedValueOnce(additionalPayload);

    await store.getState().loadFeeds();
    expect(store.getState().feeds).toHaveLength(2);
    expect(store.getState().hasMoreFeeds).toBe(true);

    await store.getState().loadMoreFeeds();
    const feedIds = store.getState().feeds.map((feed) => feed.id);

    expect(feedIds).toEqual(['feed-1', 'feed-2', 'feed-3']);
    expect(new Set(feedIds).size).toBe(feedIds.length);
    expect(store.getState().hasMoreFeeds).toBe(false);
  });

  it('likeFeed respects privacy consent when persisting interactions', async () => {
    const store = createTestFeedsStore();
    const feed = createFeed();

    store.getState().setFeeds([feed]);

    const privacyMock =
      hasPrivacyConsent as jest.MockedFunction<typeof hasPrivacyConsent>;

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    privacyMock.mockReturnValueOnce(false);
    privacyMock.mockReturnValueOnce(false);

    await store.getState().likeFeed(feed.id);

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(store.getState().feeds[0].userInteraction.liked).toBe(true);

    store.getState().setFeeds([createFeed({ id: feed.id })]);

    privacyMock.mockReturnValue(true);

    await store.getState().likeFeed(feed.id);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe('/api/feeds/interactions');

    fetchSpy.mockRestore();
  });
});

