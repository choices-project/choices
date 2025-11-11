import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type { FeedItem, FeedsStore } from '@/lib/stores/feedsStore';
import {
  createInitialFeedsState,
  feedsStoreCreator,
} from '@/lib/stores/feedsStore';

const createTestFeedsStore = () =>
  create<FeedsStore>()(immer(feedsStoreCreator));

const flushAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

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

    store.getState().setFeeds([civicFeed]);
    await store.getState().bookmarkFeed(civicFeed.id);

    const [updatedFeed] = store.getState().feeds;
    expect(updatedFeed.userInteraction.bookmarked).toBe(true);

    await store.getState().unbookmarkFeed(civicFeed.id);
    expect(store.getState().feeds[0].userInteraction.bookmarked).toBe(false);
  });

  it('loadFeeds fetches data and updates pagination', async () => {
    const store = createTestFeedsStore();
    const feedsResponse = {
      success: true,
      data: {
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
      },
    };

    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => feedsResponse,
    } as Response);

    await store.getState().loadFeeds();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      '/api/feeds?limit=20&sort=newest',
      expect.objectContaining({
        method: 'GET',
        headers: { Accept: 'application/json' },
      }),
    );

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

    const initialResponse = {
      success: true,
      data: {
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
      },
    };

    const additionalResponse = {
      success: true,
      data: {
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
      },
    };

    const responses = [initialResponse, additionalResponse];
    const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(async () => {
      const next = responses.shift();
      if (!next) {
        throw new Error('Unexpected fetch call');
      }
      return {
        ok: true,
        json: async () => next,
      } as Response;
    });

    await store.getState().loadFeeds();
    expect(store.getState().feeds).toHaveLength(2);
    expect(store.getState().hasMoreFeeds).toBe(true);

    await store.getState().loadMoreFeeds();
    const state = store.getState();

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe('/api/feeds?limit=20&sort=newest');
    expect(fetchSpy.mock.calls[1]?.[0]).toBe('/api/feeds?limit=22&sort=newest');
    expect(state.feeds).toHaveLength(4);
    expect(state.hasMoreFeeds).toBe(false);
  });

  it('loadFeeds handles error responses gracefully', async () => {
    const store = createTestFeedsStore();

    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

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
});

