/**
 * Hashtag Store Async Error Coverage Tests
 *
 * Tests for async operations error handling in hashtagStore:
 * - searchHashtags, followHashtag, unfollowHashtag, createHashtag
 * - getTrendingHashtags, getUserHashtags, getHashtagAnalytics
 * - validateHashtagName, updateUserPreferences
 * - Error state cleanup
 *
 * Created: January 2025
 * Un-archived: Store modernization lower-priority work
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
  beforeEach(() => {
    jest.clearAllMocks();
    const store = useHashtagStore.getState();
    store.clearHashtagStore();
    useHashtagStore.setState((state) => {
      state.error = null;
      state.searchError = null;
      state.followError = null;
      state.createError = null;
    });
  });

  describe('searchHashtags error handling', () => {
    it('handles network errors during search', async () => {
      const networkError = new Error('Network request failed');
      mockHashtagService.searchHashtags.mockRejectedValue(networkError);

      await useHashtagStore.getState().searchHashtags({ query: 'test' });

      expect(useHashtagStore.getState().searchError).toBeTruthy();
      expect(useHashtagStore.getState().isSearching).toBe(false);
      expect(useHashtagStore.getState().searchResults).toBeNull();
    });

    it('handles API errors during search', async () => {
      mockHashtagService.searchHashtags.mockResolvedValue({
        success: false,
        error: 'Invalid search query',
      });

      await useHashtagStore.getState().searchHashtags({ query: '' });

      expect(useHashtagStore.getState().searchError).toBeTruthy();
      expect(useHashtagStore.getState().isSearching).toBe(false);
    });

    it('handles timeout errors during search', async () => {
      const timeoutError = new Error('Request timeout');
      mockHashtagService.searchHashtags.mockRejectedValue(timeoutError);

      await useHashtagStore.getState().searchHashtags({ query: 'test' });

      expect(useHashtagStore.getState().searchError).toBeTruthy();
      expect(useHashtagStore.getState().isSearching).toBe(false);
    });
  });

  describe('followHashtag error handling', () => {
    it('handles network errors during follow', async () => {
      const networkError = new Error('Network request failed');
      mockHashtagService.followHashtag.mockRejectedValue(networkError);

      const result = await useHashtagStore.getState().followHashtag('hashtag-1');

      expect(result).toBe(false);
      expect(useHashtagStore.getState().followError).toBeTruthy();
      expect(useHashtagStore.getState().isFollowing).toBe(false);
    });

    it('handles API errors during follow', async () => {
      mockHashtagService.followHashtag.mockResolvedValue({
        success: false,
        error: 'Hashtag not found',
      });

      const result = await useHashtagStore.getState().followHashtag('invalid-id');

      expect(result).toBe(false);
      expect(useHashtagStore.getState().followError).toBeTruthy();
      expect(useHashtagStore.getState().isFollowing).toBe(false);
    });

    it('handles duplicate follow errors', async () => {
      mockHashtagService.followHashtag.mockResolvedValue({
        success: false,
        error: 'Already following this hashtag',
      });

      const result = await useHashtagStore.getState().followHashtag('hashtag-1');

      expect(result).toBe(false);
      expect(useHashtagStore.getState().followError).toBeTruthy();
    });
  });

  describe('unfollowHashtag error handling', () => {
    it('handles network errors during unfollow', async () => {
      const networkError = new Error('Network request failed');
      mockHashtagService.unfollowHashtag.mockRejectedValue(networkError);

      const result = await useHashtagStore
        .getState()
        .unfollowHashtag('hashtag-1');

      expect(result).toBe(false);
      expect(useHashtagStore.getState().followError).toBeTruthy();
      expect(useHashtagStore.getState().isUnfollowing).toBe(false);
    });

    it('handles API errors during unfollow', async () => {
      mockHashtagService.unfollowHashtag.mockResolvedValue({
        success: false,
        error: 'Not following this hashtag',
      });

      const result = await useHashtagStore
        .getState()
        .unfollowHashtag('hashtag-1');

      expect(result).toBe(false);
      expect(useHashtagStore.getState().followError).toBeTruthy();
    });
  });

  describe('createHashtag error handling', () => {
    it('handles network errors during creation', async () => {
      const networkError = new Error('Network request failed');
      mockHashtagService.createHashtag.mockRejectedValue(networkError);

      const result = await useHashtagStore.getState().createHashtag('testhashtag');

      expect(result).toBeNull();
      expect(useHashtagStore.getState().createError).toBeTruthy();
      expect(useHashtagStore.getState().isCreating).toBe(false);
    });

    it('handles validation errors during creation', async () => {
      mockHashtagService.createHashtag.mockResolvedValue({
        success: false,
        error: 'Invalid hashtag name',
      });

      const result = await useHashtagStore
        .getState()
        .createHashtag('invalid name with spaces');

      expect(result).toBeNull();
      expect(useHashtagStore.getState().createError).toBeTruthy();
    });

    it('handles duplicate hashtag errors', async () => {
      mockHashtagService.createHashtag.mockResolvedValue({
        success: false,
        error: 'Hashtag already exists',
      });

      const result = await useHashtagStore
        .getState()
        .createHashtag('existinghashtag');

      expect(result).toBeNull();
      expect(useHashtagStore.getState().createError).toBeTruthy();
    });
  });

  describe('getTrendingHashtags error handling', () => {
    it('silently handles network errors during trending fetch', async () => {
      const networkError = new Error('Network request failed');
      mockHashtagService.getTrendingHashtags.mockRejectedValue(networkError);

      await useHashtagStore.getState().getTrendingHashtags();

      expect(useHashtagStore.getState().error).toBeNull();
      expect(useHashtagStore.getState().trendingHashtags).toEqual([]);
    });

    it('silently handles API errors during trending fetch', async () => {
      mockHashtagService.getTrendingHashtags.mockResolvedValue({
        success: false,
        error: 'Failed to fetch trending hashtags',
      });

      await useHashtagStore.getState().getTrendingHashtags();

      expect(useHashtagStore.getState().error).toBeNull();
    });
  });

  describe('getUserHashtags error handling', () => {
    it('handles network errors during user hashtags fetch', async () => {
      const networkError = new Error('Network request failed');
      mockHashtagService.getUserHashtags.mockRejectedValue(networkError);

      await useHashtagStore.getState().getUserHashtags();

      expect(useHashtagStore.getState().error).toBeTruthy();
      expect(useHashtagStore.getState().isLoading).toBe(false);
    });

    it('handles authentication errors during user hashtags fetch', async () => {
      mockHashtagService.getUserHashtags.mockResolvedValue({
        success: false,
        error: 'Authentication required',
      });

      await useHashtagStore.getState().getUserHashtags();

      expect(useHashtagStore.getState().error).toBeTruthy();
    });
  });

  describe('getHashtagAnalytics error handling', () => {
    it('handles network errors during analytics fetch', async () => {
      const networkError = new Error('Network request failed');
      mockHashtagService.getHashtagAnalytics.mockRejectedValue(networkError);

      const result = await useHashtagStore
        .getState()
        .getHashtagAnalytics('hashtag-1');

      expect(result).toBeNull();
      expect(useHashtagStore.getState().error).toBeNull();
    });

    it('handles not found errors during analytics fetch', async () => {
      mockHashtagService.getHashtagAnalytics.mockResolvedValue({
        success: false,
        error: 'Hashtag not found',
      });

      const result = await useHashtagStore
        .getState()
        .getHashtagAnalytics('invalid-id');

      expect(result).toBeNull();
      expect(useHashtagStore.getState().error).toBeNull();
    });
  });

  describe('validateHashtagName error handling', () => {
    it('handles network errors during validation', async () => {
      const networkError = new Error('Network request failed');
      mockHashtagService.validateHashtagName.mockRejectedValue(networkError);

      const result = await useHashtagStore
        .getState()
        .validateHashtagName('testhashtag');

      expect(result).toBeNull();
      expect(useHashtagStore.getState().error).toBeNull();
    });

    it('handles API errors during validation', async () => {
      mockHashtagService.validateHashtagName.mockResolvedValue({
        success: false,
        error: 'Validation service unavailable',
      });

      const result = await useHashtagStore
        .getState()
        .validateHashtagName('testhashtag');

      expect(result).toBeNull();
      expect(useHashtagStore.getState().error).toBeNull();
    });
  });

  describe('updateUserPreferences error handling', () => {
    it('handles API errors during preferences update', async () => {
      useHashtagStore.setState((state) => {
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

      const result = await useHashtagStore
        .getState()
        .updateUserPreferences({
          hashtagFilters: { selectedCategory: 'politics' },
        });

      expect(result).toBe(false);
      expect(useHashtagStore.getState().isUpdating).toBe(false);
    });
  });

  describe('Error state cleanup', () => {
    it('clears all errors when clearErrors is called', async () => {
      useHashtagStore.getState().setSearchError('Search error');
      useHashtagStore.getState().setFollowError('Follow error');
      useHashtagStore.getState().setCreateError('Create error');
      useHashtagStore.setState((state) => {
        state.error = 'General error';
      });

      useHashtagStore.getState().clearErrors();

      expect(useHashtagStore.getState().searchError).toBeNull();
      expect(useHashtagStore.getState().followError).toBeNull();
      expect(useHashtagStore.getState().createError).toBeNull();
      expect(useHashtagStore.getState().error).toBeNull();
    });

    it('clears errors on successful operations', async () => {
      useHashtagStore.getState().setSearchError('Previous error');
      mockHashtagService.searchHashtags.mockResolvedValue({
        success: true,
        data: { hashtags: [], count: 0 },
      });

      await useHashtagStore.getState().searchHashtags({ query: 'test' });

      expect(useHashtagStore.getState().searchError).toBeNull();
    });
  });
});
