/**
 * Unit tests for feedsStore
 *
 * Covers initial state, setFeeds, setFilters, bookmarkFeed, loadFeeds, loadMoreFeeds,
 * and error handling. ROADMAP 4.2 Store test harnesses.
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type { FeedItem } from '@/lib/stores/types/feeds';
import type { FeedsStore } from '@/lib/stores/feedsStore';
import {
  createInitialFeedsState,
  feedsStoreCreator,
} from '@/lib/stores/feedsStore';
import { fetchFeedsFromApi } from '@/lib/stores/services/feedsService';
import { hasPrivacyConsent } from '@/lib/utils/privacy-guard';

jest.mock('@/lib/utils/privacy-guard', () => ({
  hasPrivacyConsent: jest.fn().mockReturnValue(true),
  PrivacyDataType: { FEED_ACTIVITY: 'FEED_ACTIVITY' },
}));

jest.mock('@/lib/utils/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() },
}));

jest.mock('@/lib/stores/services/feedsService', () => {
  const actual = jest.requireActual('@/lib/stores/services/feedsService');
  return {
    ...actual,
    fetchFeedsFromApi: jest.fn(),
  };
});

const createTestFeedsStore = () =>
  create<FeedsStore>()(immer(feedsStoreCreator as Parameters<typeof create<FeedsStore>>[0]));

const fetchFeedsFromApiMock =
  fetchFeedsFromApi as jest.MockedFunction<typeof fetchFeedsFromApi>;

const createFeed = (overrides: Partial<FeedItem> = {}): FeedItem => ({
  id: 'feed-1',
  title: 'Representative passes bill',
  content: 'Detailed content about the new bill.',
  summary: 'Summary of the bill update.',
  author: {
    id: 'author-1',
    name: 'Representative Smith',
    verified: true,
  },
  category: 'civics',
  tags: ['civics', 'legislation'],
  type: 'article',
  source: {
    name: 'Civic Source',
    url: 'https://example.com',
    verified: true,
  },
  publishedAt: new Date('2025-01-01T00:00:00Z').toISOString(),
  updatedAt: new Date('2025-01-01T00:00:00Z').toISOString(),
  readTime: 3,
  engagement: {
    likes: 0,
    shares: 0,
    comments: 0,
    bookmarks: 0,
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

const defaultApiPayload = {
  feeds: [],
  count: 0,
  filters: {
    category: 'all',
    district: null,
    sort: 'trending',
  },
  pagination: {
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  },
};

beforeEach(() => {
  fetchFeedsFromApiMock.mockReset();
  fetchFeedsFromApiMock.mockResolvedValue(defaultApiPayload);
});

describe('feedsStore', () => {
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

  it('loadFeeds fetches data and updates state', async () => {
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
    const state = store.getState();
    expect(state.feeds).toHaveLength(3);
    expect(state.filteredFeeds).toHaveLength(3);
    expect(state.totalAvailableFeeds).toBe(3);
    expect(state.hasMoreFeeds).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('loadMoreFeeds appends items when hasMore is true', async () => {
    const store = createTestFeedsStore();

    const initialPayload = {
      feeds: [createFeed({ id: 'feed-1' }), createFeed({ id: 'feed-2' })],
      count: 4,
      filters: { category: 'all', district: null, sort: 'newest' },
      pagination: { total: 4, limit: 20, offset: 0, hasMore: true },
    };

    const additionalPayload = {
      feeds: [createFeed({ id: 'feed-3' }), createFeed({ id: 'feed-4' })],
      count: 4,
      filters: { category: 'all', district: null, sort: 'newest' },
      pagination: { total: 4, limit: 20, offset: 2, hasMore: false },
    };

    fetchFeedsFromApiMock
      .mockResolvedValueOnce(initialPayload)
      .mockResolvedValueOnce(additionalPayload);

    await store.getState().loadFeeds();
    expect(store.getState().feeds).toHaveLength(2);

    await store.getState().loadMoreFeeds();
    expect(store.getState().feeds).toHaveLength(4);
    expect(store.getState().hasMoreFeeds).toBe(false);
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
    expect(updatedFeed?.userInteraction.bookmarked).toBe(true);

    await store.getState().unbookmarkFeed(civicFeed.id);
    expect(store.getState().feeds[0]?.userInteraction.bookmarked).toBe(false);

    fetchSpy.mockRestore();
  });

  it('searchFeeds handles network errors gracefully', async () => {
    const store = createTestFeedsStore();
    jest.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('network failure'));

    await store.getState().searchFeeds('civics');

    const state = store.getState();
    expect(state.error).toMatch(/network failure|Failed/i);
    expect(state.isSearching).toBe(false);
  });

  it('resetFeedsState clears feeds and filters when preserveFilters is false', () => {
    const store = createTestFeedsStore();
    store.getState().setFeeds([createFeed(), createFeed({ id: 'feed-2' })]);
    store.getState().setFilters({ tags: ['civics'] });

    store.getState().resetFeedsState({ preserveFilters: false });

    expect(store.getState().feeds).toHaveLength(0);
    expect(store.getState().filteredFeeds).toHaveLength(0);
    expect(store.getState().filters.tags).toEqual([]);
  });
});
