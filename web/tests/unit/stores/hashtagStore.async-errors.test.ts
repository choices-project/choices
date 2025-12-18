/**
 * Hashtag Store Async Error Coverage Tests
 *
 * Tests for async operations error handling in hashtagStore:
 * - searchHashtags error handling
 * - followHashtag error handling
 * - unfollowHashtag error handling
 * - createHashtag error handling
 * - updateHashtag error handling
 * - deleteHashtag error handling
 * - getTrendingHashtags error handling
 * - getUserHashtags error handling
 * - getHashtagAnalytics error handling
 * - validateHashtagName error handling
 *
 * Created: January 2025
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import { useHashtagStore } from '@/lib/stores/hashtagStore';

const mockHashtagService = {
  searchHashtags: jest.fn(),
  followHashtag: jest.fn(),
  unfollowHashtag: jest.fn(),
  createHashtag: jest.fn(),
  updateHashtag: jest.fn(),
  deleteHashtag: jest.fn(),
  getTrendingHashtags: jest.fn(),
  getUserHashtags: jest.fn(),
  getHashtagAnalytics: jest.fn(),
  validateHashtagName: jest.fn(),
  updateUserPreferences: jest.fn(),
  getUserPreferences: jest.fn(),
  getHashtagStats: jest.fn(),
  getProfileHashtagIntegration: jest.fn(),
  getPollHashtagIntegration: jest.fn(),
  getFeedHashtagIntegration: jest.fn(),
};

jest.mock('@/features/hashtags/lib/hashtag-service', () => mockHashtagService);

jest.mock('@/lib/utils/logger', () => {
  const loggerMock = {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  };
  return {
    __esModule: true,
    default: loggerMock,
    logger: loggerMock,
  };
});

describe('Hashtag Store Async Error Coverage', () => {
  let store: typeof useHashtagStore;

  beforeEach(() => {
    jest.clearAllMocks();
    store = useHashtagStore;
    store.setState((state) => {
      state.error = null;
      state.searchError = null;
      state.followError = null;
      state.createError = null;
    });
    store.getState().clearHashtagStore();
  });

  describe('searchHashtags error handling', () => {
    it('handles network errors during search', async () => {
      const networkError = new Error('Network request failed');
      mockHashtagService.searchHashtags.mockRejectedValue(networkError);

      await store.getState().searchHashtags({ query: 'test' });

      expect(store.getState().searchError).toBeTruthy();
      expect(store.getState().isSearching).toBe(false);
      expect(store.getState().searchResults).toBeNull();
    });

    it('handles API errors during search', async () => {
      mockHashtagService.searchHashtags.mockResolvedValue({
        success: false,
        error: 'Invalid search query',
      });

      await store.getState().searchHashtags({ query: '' });

      expect(store.getState().searchError).toBeTruthy();
      expect(store.getState().isSearching).toBe(false);
    });

    it('handles timeout errors during search', async () => {
      const timeoutError = new Error('Request timeout');
      mockHashtagService.searchHashtags.mockRejectedValue(timeoutError);

      await store.getState().searchHashtags({ query: 'test' });

      expect(store.getState().searchError).toBeTruthy();
      expect(store.getState().isSearching).toBe(false);
    });
  });

  describe('followHashtag error handling', () => {
    it('handles network errors during follow', async () => {
      const networkError = new Error('Network request failed');
      mockHashtagService.followHashtag.mockRejectedValue(networkError);

      const result = await store.getState().followHashtag('hashtag-1');

      expect(result).toBe(false);
      expect(store.getState().followError).toBeTruthy();
      expect(store.getState().isFollowing).toBe(false);
    });

    it('handles API errors during follow', async () => {
      mockHashtagService.followHashtag.mockResolvedValue({
        success: false,
        error: 'Hashtag not found',
      });

      const result = await store.getState().followHashtag('invalid-id');

      expect(result).toBe(false);
      expect(store.getState().followError).toBeTruthy();
      expect(store.getState().isFollowing).toBe(false);
    });

    it('handles duplicate follow errors', async () => {
      mockHashtagService.followHashtag.mockResolvedValue({
        success: false,
        error: 'Already following this hashtag',
      });

      const result = await store.getState().followHashtag('hashtag-1');

      expect(result).toBe(false);
      expect(store.getState().followError).toBeTruthy();
    });
  });

  describe('unfollowHashtag error handling', () => {
    it('handles network errors during unfollow', async () => {
      const networkError = new Error('Network request failed');
      mockHashtagService.unfollowHashtag.mockRejectedValue(networkError);

      const result = await store.getState().unfollowHashtag('hashtag-1');

      expect(result).toBe(false);
      expect(store.getState().followError).toBeTruthy();
      expect(store.getState().isUnfollowing).toBe(false);
    });

    it('handles API errors during unfollow', async () => {
      mockHashtagService.unfollowHashtag.mockResolvedValue({
        success: false,
        error: 'Not following this hashtag',
      });

      const result = await store.getState().unfollowHashtag('hashtag-1');

      expect(result).toBe(false);
      expect(store.getState().followError).toBeTruthy();
    });
  });

  describe('createHashtag error handling', () => {
    it('handles network errors during creation', async () => {
      const networkError = new Error('Network request failed');
      mockHashtagService.createHashtag.mockRejectedValue(networkError);

      const result = await store.getState().createHashtag('testhashtag');

      expect(result).toBeNull();
      expect(store.getState().createError).toBeTruthy();
      expect(store.getState().isCreating).toBe(false);
    });

    it('handles validation errors during creation', async () => {
      mockHashtagService.createHashtag.mockResolvedValue({
        success: false,
        error: 'Invalid hashtag name',
      });

      const result = await store.getState().createHashtag('invalid name with spaces');

      expect(result).toBeNull();
      expect(store.getState().createError).toBeTruthy();
    });

    it('handles duplicate hashtag errors', async () => {
      mockHashtagService.createHashtag.mockResolvedValue({
        success: false,
        error: 'Hashtag already exists',
      });

      const result = await store.getState().createHashtag('existinghashtag');

      expect(result).toBeNull();
      expect(store.getState().createError).toBeTruthy();
    });
  });

  describe('getTrendingHashtags error handling', () => {
    // Note: getTrendingHashtags silently fails without setting error state
    // because trending hashtags are an optional enhancement, not critical functionality.
    // This prevents error states from triggering unnecessary re-renders.

    it('silently handles network errors during trending fetch', async () => {
      const networkError = new Error('Network request failed');
      mockHashtagService.getTrendingHashtags.mockRejectedValue(networkError);

      await store.getState().getTrendingHashtags();

      // Error is NOT set - silent failure for optional feature
      expect(store.getState().error).toBeNull();
      // Trending hashtags remain empty
      expect(store.getState().trendingHashtags).toEqual([]);
    });

    it('silently handles API errors during trending fetch', async () => {
      mockHashtagService.getTrendingHashtags.mockResolvedValue({
        success: false,
        error: 'Failed to fetch trending hashtags',
      });

      await store.getState().getTrendingHashtags();

      // Error is NOT set - silent failure for optional feature
      expect(store.getState().error).toBeNull();
    });
  });

  describe('getUserHashtags error handling', () => {
    it('handles network errors during user hashtags fetch', async () => {
      const networkError = new Error('Network request failed');
      mockHashtagService.getUserHashtags.mockRejectedValue(networkError);

      await store.getState().getUserHashtags();

      expect(store.getState().error).toBeTruthy();
      expect(store.getState().isLoading).toBe(false);
    });

    it('handles authentication errors during user hashtags fetch', async () => {
      mockHashtagService.getUserHashtags.mockResolvedValue({
        success: false,
        error: 'Authentication required',
      });

      await store.getState().getUserHashtags();

      expect(store.getState().error).toBeTruthy();
    });
  });

  describe('getHashtagAnalytics error handling', () => {
    it('handles network errors during analytics fetch', async () => {
      const networkError = new Error('Network request failed');
      mockHashtagService.getHashtagAnalytics.mockRejectedValue(networkError);

      const result = await store.getState().getHashtagAnalytics('hashtag-1');

      expect(result).toBeNull();
      expect(store.getState().error).toBeNull();
    });

    it('handles not found errors during analytics fetch', async () => {
      mockHashtagService.getHashtagAnalytics.mockResolvedValue({
        success: false,
        error: 'Hashtag not found',
      });

      const result = await store.getState().getHashtagAnalytics('invalid-id');

      expect(result).toBeNull();
      expect(store.getState().error).toBeNull();
    });
  });

  describe('validateHashtagName error handling', () => {
    it('handles network errors during validation', async () => {
      const networkError = new Error('Network request failed');
      mockHashtagService.validateHashtagName.mockRejectedValue(networkError);

      const result = await store.getState().validateHashtagName('testhashtag');

      expect(result).toBeNull();
      expect(store.getState().error).toBeNull();
    });

    it('handles API errors during validation', async () => {
      mockHashtagService.validateHashtagName.mockResolvedValue({
        success: false,
        error: 'Validation service unavailable',
      });

      const result = await store.getState().validateHashtagName('testhashtag');

      expect(result).toBeNull();
      expect(store.getState().error).toBeNull();
    });
  });

  describe('updateUserPreferences error handling', () => {
    it('handles network errors during preferences update', async () => {
      store.setState((state) => {
        state.userPreferences = {
          userId: 'user-123',
          hashtagFilters: {},
          notificationPreferences: {},
          followedHashtags: [],
          primaryHashtags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      });

      mockHashtagService.updateUserPreferences.mockResolvedValue({
        success: false,
        error: 'Network request failed',
      });

      const result = await store.getState().updateUserPreferences({
        hashtagFilters: { selectedCategory: 'politics' },
      });

      expect(result).toBe(false);
      expect(store.getState().error).toBe('Network request failed');
      expect(store.getState().isUpdating).toBe(false);
    });
  });

  describe('Error state cleanup', () => {
    it('clears all errors when clearErrors is called', async () => {
      store.getState().setSearchError('Search error');
      store.getState().setFollowError('Follow error');
      store.getState().setCreateError('Create error');
      store.setState((state) => {
        state.error = 'General error';
      });

      store.getState().clearErrors();

      expect(store.getState().searchError).toBeNull();
      expect(store.getState().followError).toBeNull();
      expect(store.getState().createError).toBeNull();
      expect(store.getState().error).toBeNull();
    });

    it('clears errors on successful operations', async () => {
      store.getState().setSearchError('Previous error');
      mockHashtagService.searchHashtags.mockResolvedValue({
        success: true,
        data: { hashtags: [], count: 0 },
      });

      await store.getState().searchHashtags({ query: 'test' });

      expect(store.getState().searchError).toBeNull();
    });
  });
});

