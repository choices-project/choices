/** @jest-environment jsdom */

import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import FeedDataProvider from '@/features/feeds/components/providers/FeedDataProvider';
import { useFeedsStore } from '@/lib/stores/feedsStore';
import type { GenericFeedItem } from '@/lib/stores/types/feeds';

jest.mock('@/lib/stores', () => {
  const actual = jest.requireActual('@/lib/stores');
  return {
    ...actual,
    useUser: jest.fn(() => ({ id: 'integration-user' })),
    useHashtagActions: jest.fn(() => ({
      getTrendingHashtags: jest.fn().mockResolvedValue(undefined),
    })),
    useTrendingHashtags: jest.fn(() => []),
  };
});

type RenderProps = React.ComponentProps<typeof FeedDataProvider>['children'];
type ArticleFeedItem = GenericFeedItem & { type: 'article' };

const createFeed = (overrides: Partial<GenericFeedItem> = {}): ArticleFeedItem => ({
  id: 'feed-1',
  title: 'Feed Title 1',
  content: 'Feed content',
  summary: 'Summary',
  author: {
    id: 'author-1',
    name: 'Author',
    verified: true,
  },
  category: 'civics',
  tags: ['civics'],
  source: {
    name: 'Source',
    url: 'https://example.com',
    verified: true,
  },
  publishedAt: new Date('2025-01-01T00:00:00Z').toISOString(),
  updatedAt: new Date('2025-01-01T00:00:00Z').toISOString(),
  readTime: 2,
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
  type: 'article',
});

const FeedConsumer: React.FC<{ children: RenderProps }> = ({ children }) => (
  <FeedDataProvider userId="integration-user" enableInfiniteScroll maxItems={10}>
    {children}
  </FeedDataProvider>
);

const FeedRenderer: RenderProps = ({
  feeds,
  isLoading,
  error,
  onLoadMore,
  hasMore,
}) => (
  <div>
    <div data-testid="loading">{isLoading ? 'loading' : 'loaded'}</div>
    {error ? <div role="alert">{error}</div> : null}
    <ul>
      {feeds.map((feed) => (
        <li key={feed.id}>{feed.title}</li>
      ))}
    </ul>
    {onLoadMore ? (
      <button onClick={() => onLoadMore()} disabled={!hasMore}>
        Load More
      </button>
    ) : null}
  </div>
);

describe('FeedDataProvider integration', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    act(() => {
      useFeedsStore
        .getState()
        .resetFeedsState({
          preserveFilters: false,
          preservePreferences: false,
          preserveRecentSearches: false,
        });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads feeds on mount and renders items, handling pagination', async () => {
    const initialResponse = {
      success: true,
      data: {
        feeds: [
          createFeed({
            id: 'feed-1',
            title: 'Feed Title 1',
          }),
        ],
        count: 2,
        filters: {
          category: 'all',
          district: null,
          sort: 'trending',
        },
        pagination: { hasMore: true, total: 2, limit: 20, offset: 0 },
      },
    };

    const loadMoreResponse = {
      success: true,
      data: {
        feeds: [
          createFeed({
            id: 'feed-2',
            title: 'Feed Title 2',
          }),
        ],
        count: 2,
        filters: {
          category: 'all',
          district: null,
          sort: 'trending',
        },
        pagination: { hasMore: false, total: 2, limit: 20, offset: 1 },
      },
    };

    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => initialResponse,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => loadMoreResponse,
      } as Response);

    render(
      <FeedConsumer>
        {(props) => <FeedRenderer {...props} />}
      </FeedConsumer>
    );

    await waitFor(() => {
      expect(screen.getByText('Feed Title 1')).toBeInTheDocument();
    });

    expect(screen.getByTestId('loading')).toHaveTextContent('loaded');
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/api/feeds'),
      expect.any(Object)
    );

    act(() => {
      screen.getByText('Load More').click();
    });

    await waitFor(() => {
      expect(screen.getByText('Feed Title 2')).toBeInTheDocument();
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('surfaces errors when feed loading fails', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    } as Response);

    render(
      <FeedConsumer>
        {(props) => <FeedRenderer {...props} />}
      </FeedConsumer>
    );

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/failed to load feeds/i);
    });

    const state = useFeedsStore.getState();
    expect(state.feeds).toHaveLength(0);
    expect(state.filteredFeeds).toHaveLength(0);
  });
});




