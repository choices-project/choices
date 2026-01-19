/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react';

import HashtagPollsFeed from '@/features/feeds/components/HashtagPollsFeed';

jest.mock('@/lib/stores', () => ({
  useFilteredFeeds: jest.fn(),
  useFeedsLoading: jest.fn(),
  useFeedsRefreshing: jest.fn(),
  useFeedsError: jest.fn(),
  useFeedsActions: jest.fn(),
  useTrendingHashtags: jest.fn(),
  useHashtagActions: jest.fn(),
}));

jest.mock('@/hooks/useI18n', () => ({
  useI18n: jest.fn(),
}));

type StoresModule = typeof import('@/lib/stores');
type I18nModule = typeof import('@/hooks/useI18n');

const storesModule = jest.requireMock('@/lib/stores') as {
  [K in keyof StoresModule]: jest.Mock;
};
const i18nModule = jest.requireMock('@/hooks/useI18n') as {
  [K in keyof I18nModule]: jest.Mock;
};

describe('HashtagPollsFeed', () => {
  const mockUseFilteredFeeds = storesModule.useFilteredFeeds as jest.Mock;
  const mockUseFeedsLoading = storesModule.useFeedsLoading as jest.Mock;
  const mockUseFeedsRefreshing = storesModule.useFeedsRefreshing as jest.Mock;
  const mockUseFeedsError = storesModule.useFeedsError as jest.Mock;
  const mockUseFeedsActions = storesModule.useFeedsActions as jest.Mock;
  const mockUseTrendingHashtags = storesModule.useTrendingHashtags as jest.Mock;
  const mockUseHashtagActions = storesModule.useHashtagActions as jest.Mock;

  const mockUseI18n = i18nModule.useI18n as jest.Mock;

  const loadFeeds = jest.fn().mockResolvedValue(undefined);
  const getTrendingHashtags = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseFilteredFeeds.mockReturnValue([
      {
        id: 'poll-1',
        type: 'poll',
        title: 'Climate Action Now',
        summary: 'Act now',
        pollData: { id: 'poll-1', totalVotes: 420 },
        tags: ['ClimateAction', 'Energy'],
        engagement: { likes: 10, shares: 5, comments: 2 },
        publishedAt: '2025-01-05T00:00:00Z',
      },
      {
        id: 'article-1',
        type: 'article',
        title: 'General News',
        tags: ['Misc'],
      },
    ]);
    mockUseFeedsLoading.mockReturnValue(false);
    mockUseFeedsRefreshing.mockReturnValue(false);
    mockUseFeedsError.mockReturnValue(null);
    mockUseFeedsActions.mockReturnValue({ loadFeeds });
    mockUseTrendingHashtags.mockReturnValue([
      'ClimateAction',
      { hashtag_name: 'Energy' },
    ]);
    mockUseHashtagActions.mockReturnValue({ getTrendingHashtags });

    mockUseI18n.mockReturnValue({
      t: (_key: string, params?: Record<string, string | number>) => {
        if (params && 'hashtag' in params) {
          return String(params.hashtag);
        }
        if (params && 'rank' in params) {
          return String(params.rank);
        }
        if (params && 'matches' in params) {
          return String(params.matches);
        }
        if (params && 'value' in params) {
          return String(params.value);
        }
        if (params && 'count' in params) {
          return String(params.count);
        }
        return _key;
      },
      currentLanguage: 'en',
      changeLanguage: jest.fn(),
      isReady: true,
    });
  });

  it('loads feeds and trending hashtags on mount, and renders trending badges', () => {
    const onHashtagSelect = jest.fn();

    render(
      <HashtagPollsFeed
        userId="user-123"
        enableAnalytics
        onHashtagSelect={onHashtagSelect}
      />,
    );

    expect(loadFeeds).toHaveBeenCalledTimes(1);
    expect(getTrendingHashtags).toHaveBeenCalledTimes(1);

    const climateBadge = screen.getAllByText('#ClimateAction')[0];
    if (!climateBadge) {
      throw new Error('Expected a ClimateAction badge to render');
    }
    expect(climateBadge).toBeInTheDocument();

    fireEvent.click(climateBadge);
    expect(onHashtagSelect).toHaveBeenCalledWith('ClimateAction');
  });

  it('invokes onPollSelect when the poll call-to-action is clicked', () => {
    const onPollSelect = jest.fn();

    render(
      <HashtagPollsFeed
        userId="user-123"
        onPollSelect={onPollSelect}
      />,
    );

    const viewPollButton = screen.getByRole('button', {
      name: 'feeds.hashtagPolls.recommended.viewPoll',
    });
    fireEvent.click(viewPollButton);

    expect(onPollSelect).toHaveBeenCalledWith('poll-1');
  });
});
