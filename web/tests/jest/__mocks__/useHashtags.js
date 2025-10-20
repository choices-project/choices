const useHashtags = jest.fn(() => ({
  hashtags: [],
  trendingHashtags: [],
  userHashtags: [],
  isLoading: false,
  error: null,
  loadTrendingHashtags: jest.fn(),
  searchHashtags: jest.fn(),
  followHashtag: jest.fn(),
  unfollowHashtag: jest.fn(),
  getTrendingHashtags: jest.fn(),
  refresh: jest.fn(),
}));

module.exports = { useHashtags };


