'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  useHashtagActions,
  useHashtagError,
  useHashtagList,
  useHashtagLoading,
  useHashtagSearchResults,
  useHashtagSuggestions,
  useTrendingHashtags,
  useUserHashtags,
} from '@/lib/stores';
import { useHashtagStore } from '@/lib/stores/hashtagStore';

import type {
  HashtagSearchQuery,
} from '../types';

type UseHashtagsOptions = {
  autoLoad?: boolean;
  refreshInterval?: number;
};

export function useHashtags(options: UseHashtagsOptions = {}) {
  const { autoLoad = true, refreshInterval = 0 } = options;

  const hashtagList = useHashtagList();
  const trendingHashtags = useTrendingHashtags();
  const userHashtags = useUserHashtags();
  const {
    isLoading: storeLoading,
    isSearching,
    isFollowing,
    isUnfollowing,
    isCreating,
    isUpdating,
    isDeleting,
  } = useHashtagLoading();
  const {
    error,
    searchError,
    followError,
    createError,
    hasError,
  } = useHashtagError();
  const searchResults = useHashtagSearchResults();
  const {
    getTrendingHashtags,
    getUserHashtags,
    followHashtag,
    unfollowHashtag,
    getSuggestions,
    searchHashtags,
    clearErrors,
  } = useHashtagActions();

  type TrendingCategory = Parameters<typeof getTrendingHashtags>[0];

  const loadTrendingHashtags = useCallback(
    async (category: TrendingCategory | 'all' = 'politics', limit = 10) => {
      const normalizedCategory =
        category === 'all' ? undefined : (category as TrendingCategory | undefined);
      await getTrendingHashtags(normalizedCategory, limit);
    },
    [getTrendingHashtags],
  );

  const loadUserHashtags = useCallback(async () => {
    await getUserHashtags();
  }, [getUserHashtags]);

  useEffect(() => {
    if (!autoLoad) {
      return;
    }

    void loadTrendingHashtags('politics', 10);
    void loadUserHashtags();
  }, [autoLoad, loadTrendingHashtags, loadUserHashtags]);

  useEffect(() => {
    if (refreshInterval <= 0) {
      return;
    }

    const intervalId = setInterval(() => {
      void loadTrendingHashtags('politics', 10);
      void loadUserHashtags();
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval, loadTrendingHashtags, loadUserHashtags]);

  const followHashtagAction = useCallback(
    async (hashtagId: string) => followHashtag(hashtagId),
    [followHashtag],
  );

  const unfollowHashtagAction = useCallback(
    async (hashtagId: string) => unfollowHashtag(hashtagId),
    [unfollowHashtag],
  );

  const getSuggestionsAction = useCallback(
    async (input: string, limit = 5) => {
      await getSuggestions(input);
      const currentSuggestions = useHashtagStore.getState().suggestions;
      return currentSuggestions.slice(0, limit);
    },
    [getSuggestions],
  );

  const searchHashtagsQuery = useCallback(
    async (query: HashtagSearchQuery) => {
      await searchHashtags(query);
      return useHashtagStore.getState().searchResults ?? null;
    },
    [searchHashtags],
  );

  const isFollowingHashtag = useCallback(
    (hashtagId: string) => useHashtagStore.getState().isFollowingHashtag(hashtagId),
    [],
  );

  const refresh = useCallback(() => {
    void loadTrendingHashtags('politics', 10);
    void loadUserHashtags();
  }, [loadTrendingHashtags, loadUserHashtags]);

  const clearError = useCallback(() => {
    clearErrors();
  }, [clearErrors]);

  const combinedError = useMemo(
    () => error ?? searchError ?? followError ?? createError ?? null,
    [error, searchError, followError, createError],
  );

  const isLoading =
    storeLoading || isSearching || isFollowing || isUnfollowing || isCreating || isUpdating || isDeleting;

  const combinedHashtags = useMemo(
    () => searchResults?.hashtags ?? hashtagList,
    [searchResults, hashtagList],
  );

  return {
    hashtags: combinedHashtags,
    trendingHashtags,
    userHashtags,
    isLoading,
    error: combinedError,
    loadTrendingHashtags,
    loadUserHashtags,
    searchHashtagsQuery,
    followHashtagAction,
    unfollowHashtagAction,
    getSuggestions: getSuggestionsAction,
    isFollowingHashtag,
    clearError,
    refresh,
    hasError,
  };
}

type UseHashtagSearchOptions = {
  debounceMs?: number;
  minQueryLength?: number;
};

export function useHashtagSearch(options: UseHashtagSearchOptions = {}) {
  const { debounceMs = 300, minQueryLength = 2 } = options;

  const [query, setQuery] = useState('');

  const searchResults = useHashtagSearchResults();
  const suggestions = useHashtagSuggestions();
  const { isSearching } = useHashtagLoading();
  const { searchError } = useHashtagError();
  const { searchHashtags, getSuggestions, clearErrors, clearSearch } = useHashtagActions();

  // Refs for stable action callbacks
  const searchHashtagsRef = useRef(searchHashtags);
  useEffect(() => { searchHashtagsRef.current = searchHashtags; }, [searchHashtags]);
  const getSuggestionsRef = useRef(getSuggestions);
  useEffect(() => { getSuggestionsRef.current = getSuggestions; }, [getSuggestions]);
  const clearSearchRef = useRef(clearSearch);
  useEffect(() => { clearSearchRef.current = clearSearch; }, [clearSearch]);
  const clearErrorsRef = useRef(clearErrors);
  useEffect(() => { clearErrorsRef.current = clearErrors; }, [clearErrors]);

  useEffect(() => {
    if (query.length < minQueryLength) {
      clearSearchRef.current();
      return;
    }

    const timeoutId = setTimeout(() => {
      void searchHashtagsRef.current({
        query,
        limit: 20,
        offset: 0,
      });
      void getSuggestionsRef.current(query);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [query, debounceMs, minQueryLength]);  

  const clearError = useCallback(() => {
    clearErrorsRef.current();
  }, []);  

  return {
    query,
    setQuery,
    results: searchResults,
    suggestions,
    isLoading: isSearching,
    error: searchError,
    clearError,
  };
}
