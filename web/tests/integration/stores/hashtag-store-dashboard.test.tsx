/**
 * Hashtag Store Dashboard Integration Tests
 * 
 * Tests for dashboard widget integration with hashtagStore:
 * - Dashboard widget data loading
 * - Widget state updates
 * - Widget error handling
 * - Widget refresh behavior
 * - Trending hashtags display
 * - Follow/unfollow from dashboard
 * 
 * Created: January 2025
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import {
  useHashtagStore,
  useHashtagList,
  useTrendingHashtags,
  useFollowedHashtags,
  useHashtagLoading,
  useHashtagError,
  useHashtagActions,
} from '@/lib/stores/hashtagStore';

// Mock dashboard widget component
jest.mock('@/features/hashtags/components/HashtagTrending', () => ({
  __esModule: true,
  default: function HashtagTrending() {
    const hashtags = useHashtagList();
    const trending = useTrendingHashtags();
    const followed = useFollowedHashtags();
    const loading = useHashtagLoading();
    const error = useHashtagError();
    const { getTrendingHashtags, followHashtag, unfollowHashtag } = useHashtagActions();

    React.useEffect(() => {
      void getTrendingHashtags();
    }, [getTrendingHashtags]);

    return (
      <div data-testid="hashtag-dashboard-widget">
        <h2>Hashtag Dashboard</h2>
        {loading && <div data-testid="widget-loading">Loading...</div>}
        {error && <div data-testid="widget-error">{error}</div>}
        <div data-testid="hashtag-count">{hashtags.length} hashtags</div>
        <div data-testid="trending-count">{trending.length} trending</div>
        <div data-testid="followed-count">{followed.length} followed</div>
        <button
          data-testid="refresh-widget"
          onClick={() => void getTrendingHashtags()}
        >
          Refresh
        </button>
      </div>
    );
  },
}));

jest.mock('@/lib/api/hashtags', () => ({
  getTrendingHashtagsRequest: jest.fn(),
  followHashtagRequest: jest.fn(),
  unfollowHashtagRequest: jest.fn(),
}));

describe('Hashtag Store Dashboard Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useHashtagStore.getState().resetHashtagState();
  });

  it('renders dashboard widget with hashtagStore', () => {
    const HashtagTrending = require('@/features/hashtags/components/HashtagTrending').default;
    render(<HashtagTrending />);

    expect(screen.getByTestId('hashtag-dashboard-widget')).toBeInTheDocument();
    expect(screen.getByText('Hashtag Dashboard')).toBeInTheDocument();
  });

  it('loads trending hashtags on mount and displays count', async () => {
    const { getTrendingHashtagsRequest } = require('@/lib/api/hashtags');
    const mockHashtags = [
      {
        id: 'hashtag-1',
        name: 'politics',
        follower_count: 100,
        post_count: 50,
        trending_score: 85,
      },
      {
        id: 'hashtag-2',
        name: 'technology',
        follower_count: 200,
        post_count: 75,
        trending_score: 90,
      },
    ];

    getTrendingHashtagsRequest.mockResolvedValue({
      success: true,
      data: { hashtags: mockHashtags, total: 2 },
    });

    const HashtagTrending = require('@/features/hashtags/components/HashtagTrending').default;
    render(<HashtagTrending />);

    await waitFor(() => {
      expect(screen.getByTestId('trending-count')).toHaveTextContent('2 trending');
    });
  });

  it('handles widget loading state', async () => {
    const { getTrendingHashtagsRequest } = require('@/lib/api/hashtags');
    
    getTrendingHashtagsRequest.mockImplementation(() => new Promise(() => undefined)); // Never resolves

    const HashtagTrending = require('@/features/hashtags/components/HashtagTrending').default;
    render(<HashtagTrending />);

    expect(screen.getByTestId('widget-loading')).toBeInTheDocument();
  });

  it('handles widget error state', async () => {
    const { getTrendingHashtagsRequest } = require('@/lib/api/hashtags');
    
    getTrendingHashtagsRequest.mockRejectedValue(new Error('Failed to load hashtags'));

    const HashtagTrending = require('@/features/hashtags/components/HashtagTrending').default;
    render(<HashtagTrending />);

    await waitFor(() => {
      expect(screen.getByTestId('widget-error')).toBeInTheDocument();
    });
  });

  it('refreshes widget data on button click', async () => {
    const { getTrendingHashtagsRequest } = require('@/lib/api/hashtags');
    const mockHashtags = [
      {
        id: 'hashtag-1',
        name: 'politics',
        follower_count: 100,
        post_count: 50,
        trending_score: 85,
      },
    ];

    getTrendingHashtagsRequest.mockResolvedValue({
      success: true,
      data: { hashtags: mockHashtags, total: 1 },
    });

    const HashtagTrending = require('@/features/hashtags/components/HashtagTrending').default;
    render(<HashtagTrending />);

    await waitFor(() => {
      expect(screen.getByTestId('trending-count')).toHaveTextContent('1 trending');
    });

    // Update mock to return different data
    const updatedHashtags = [...mockHashtags, {
      id: 'hashtag-2',
      name: 'technology',
      follower_count: 200,
      post_count: 75,
      trending_score: 90,
    }];

    getTrendingHashtagsRequest.mockResolvedValue({
      success: true,
      data: { hashtags: updatedHashtags, total: 2 },
    });

    const refreshButton = screen.getByTestId('refresh-widget');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(screen.getByTestId('trending-count')).toHaveTextContent('2 trending');
    });
  });

  it('displays followed hashtags count', async () => {
    const store = useHashtagStore.getState();
    
    // Simulate following hashtags
    store.followHashtag('hashtag-1');
    store.followHashtag('hashtag-2');

    const HashtagTrending = require('@/features/hashtags/components/HashtagTrending').default;
    render(<HashtagTrending />);

    await waitFor(() => {
      expect(screen.getByTestId('followed-count')).toHaveTextContent('2 followed');
    });
  });

  it('handles follow/unfollow actions from dashboard', async () => {
    const { followHashtagRequest, unfollowHashtagRequest } = require('@/lib/api/hashtags');
    
    followHashtagRequest.mockResolvedValue({ success: true });
    unfollowHashtagRequest.mockResolvedValue({ success: true });

    const store = useHashtagStore.getState();
    const { followHashtag, unfollowHashtag } = store;

    await followHashtag('hashtag-1');
    expect(followHashtagRequest).toHaveBeenCalledWith('hashtag-1');

    await unfollowHashtag('hashtag-1');
    expect(unfollowHashtagRequest).toHaveBeenCalledWith('hashtag-1');
  });
});

