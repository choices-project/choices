'use client';

import { useState, useEffect, useCallback } from 'react';

import { 
  searchHashtags, 
  getTrendingHashtags, 
  followHashtag, 
  unfollowHashtag,
  getUserHashtags,
  getHashtagSuggestions
} from '../lib/hashtag-service';
import type { 
  Hashtag, 
  HashtagSearchResponse, 
  TrendingHashtag, 
  UserHashtag, 
  HashtagSuggestion,
  HashtagSearchQuery 
} from '../types';

type UseHashtagsOptions = {
  autoLoad?: boolean;
  refreshInterval?: number;
}

export function useHashtags(options: UseHashtagsOptions = {}) {
  const { autoLoad = true, refreshInterval = 0 } = options;
  
  const [hashtags, setHashtags] = useState<Hashtag[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<TrendingHashtag[]>([]);
  const [userHashtags, setUserHashtags] = useState<UserHashtag[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load trending hashtags
  const loadTrendingHashtags = useCallback(async (limit = 10) => {
    try {
      setIsLoading(true);
      setError(null);
      
        const result = await getTrendingHashtags('politics', limit);
      if (result.success && result.data) {
        setTrendingHashtags(result.data);
      } else {
        setError(result.error || 'Failed to load trending hashtags');
      }
    } catch (err) {
      setError('Failed to load trending hashtags');
      console.error('Trending hashtags error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load user's followed hashtags
  const loadUserHashtags = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await getUserHashtags();
      if (result.success && result.data) {
        setUserHashtags(result.data);
      } else {
        setError(result.error || 'Failed to load user hashtags');
      }
    } catch (err) {
      setError('Failed to load user hashtags');
      console.error('User hashtags error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Search hashtags
  const searchHashtagsQuery = useCallback(async (query: HashtagSearchQuery) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await searchHashtags(query);
      if (result.success && result.data) {
        setHashtags(result.data.hashtags);
        return result.data;
      } else {
        setError(result.error || 'Failed to search hashtags');
        return null;
      }
    } catch (err) {
      setError('Failed to search hashtags');
      console.error('Search hashtags error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Follow hashtag
  const followHashtagAction = useCallback(async (hashtagId: string) => {
    try {
      setError(null);
      
      const result = await followHashtag(hashtagId);
      if (result.success && result.data) {
        // Add to user hashtags
        setUserHashtags(prev => [...prev, result.data!]);
        return true;
      } else {
        setError(result.error || 'Failed to follow hashtag');
        return false;
      }
    } catch (err) {
      setError('Failed to follow hashtag');
      console.error('Follow hashtag error:', err);
      return false;
    }
  }, []);

  // Unfollow hashtag
  const unfollowHashtagAction = useCallback(async (hashtagId: string) => {
    try {
      setError(null);
      
      const result = await unfollowHashtag(hashtagId);
      if (result.success) {
        // Remove from user hashtags
        setUserHashtags(prev => prev.filter(uh => uh.hashtag_id !== hashtagId));
        return true;
      } else {
        setError(result.error || 'Failed to unfollow hashtag');
        return false;
      }
    } catch (err) {
      setError('Failed to unfollow hashtag');
      console.error('Unfollow hashtag error:', err);
      return false;
    }
  }, []);

  // Get hashtag suggestions
  const getSuggestions = useCallback(async (input: string, limit = 5) => {
    try {
      setError(null);
      
      const result = await getHashtagSuggestions(input, undefined, limit);
      if (result.success && result.data) {
        return result.data;
      } else {
        setError(result.error || 'Failed to get suggestions');
        return [];
      }
    } catch (err) {
      setError('Failed to get suggestions');
      console.error('Suggestions error:', err);
      return [];
    }
  }, []);

  // Check if user is following a hashtag
  const isFollowingHashtag = useCallback((hashtagId: string) => {
    return userHashtags.some(uh => uh.hashtag_id === hashtagId);
  }, [userHashtags]);

  // Auto-load on mount
  useEffect(() => {
    if (autoLoad) {
      loadTrendingHashtags();
      loadUserHashtags();
    }
  }, [autoLoad, loadTrendingHashtags, loadUserHashtags]);

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        loadTrendingHashtags();
        loadUserHashtags();
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [refreshInterval, loadTrendingHashtags, loadUserHashtags]);

  return {
    // State
    hashtags,
    trendingHashtags,
    userHashtags,
    isLoading,
    error,
    
    // Actions
    loadTrendingHashtags,
    loadUserHashtags,
    searchHashtagsQuery,
    followHashtagAction,
    unfollowHashtagAction,
    getSuggestions,
    isFollowingHashtag,
    
    // Utilities
    clearError: () => setError(null),
    refresh: () => {
      loadTrendingHashtags();
      loadUserHashtags();
    }
  };
}

type UseHashtagSearchOptions = {
  debounceMs?: number;
  minQueryLength?: number;
}

export function useHashtagSearch(options: UseHashtagSearchOptions = {}) {
  const { debounceMs = 300, minQueryLength = 2 } = options;
  
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<HashtagSearchResponse | null>(null);
  const [suggestions, setSuggestions] = useState<HashtagSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    if (query.length < minQueryLength) {
      setResults(null);
      setSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setIsLoading(true);
        setError(null);

        const searchQuery: HashtagSearchQuery = {
          query,
          limit: 20,
          offset: 0
        };

        const searchResult = await searchHashtags(searchQuery);
        if (searchResult.success && searchResult.data) {
          setResults(searchResult.data);
        } else {
          setError(searchResult.error || 'Search failed');
        }

        // Also get suggestions
        const suggestionsResult = await getHashtagSuggestions(query, undefined, 5);
        if (suggestionsResult.success && suggestionsResult.data) {
          setSuggestions(suggestionsResult.data);
        }
      } catch (err) {
        setError('Search failed');
        console.error('Search error:', err);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, debounceMs, minQueryLength]);

  return {
    query,
    setQuery,
    results,
    suggestions,
    isLoading,
    error,
    clearError: () => setError(null)
  };
}
