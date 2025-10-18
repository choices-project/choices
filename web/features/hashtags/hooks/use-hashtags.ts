/**
 * Hashtag Hooks
 * 
 * React Query hooks for hashtag data management, caching, and mutations
 * Provides optimized data fetching and state management for hashtag operations
 * 
 * Created: December 19, 2024
 * Status: ✅ ACTIVE
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


import {
  getHashtagById,
  getHashtagByName,
  createHashtag,
  updateHashtag,
  deleteHashtag,
  searchHashtags,
  getTrendingHashtags,
  getHashtagSuggestions,
  followHashtag,
  unfollowHashtag,
  getUserHashtags,
  getHashtagAnalytics,
  getHashtagStats,
  validateHashtagName
} from '../lib/hashtag-service';
import type {
  Hashtag,
  UserHashtag,
  HashtagCategory,
  UseHashtagOptions,
  UseHashtagSearchOptions,
  UseTrendingHashtagsOptions,
  UseHashtagSuggestionsOptions
} from '../types';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const hashtagQueryKeys = {
  all: ['hashtags'] as const,
  lists: () => [...hashtagQueryKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) => [...hashtagQueryKeys.lists(), filters] as const,
  details: () => [...hashtagQueryKeys.all, 'detail'] as const,
  detail: (id: string) => [...hashtagQueryKeys.details(), id] as const,
  search: (query: string) => [...hashtagQueryKeys.all, 'search', query] as const,
  trending: (category?: HashtagCategory) => [...hashtagQueryKeys.all, 'trending', category] as const,
  suggestions: (input: string) => [...hashtagQueryKeys.all, 'suggestions', input] as const,
  user: () => [...hashtagQueryKeys.all, 'user'] as const,
  analytics: (id: string, period: string) => [...hashtagQueryKeys.all, 'analytics', id, period] as const,
  stats: () => [...hashtagQueryKeys.all, 'stats'] as const,
  validation: (name: string) => [...hashtagQueryKeys.all, 'validation', name] as const
};

// ============================================================================
// CORE HASHTAG HOOKS
// ============================================================================

/**
 * Get hashtag by ID
 */
export function useHashtag(id: string, options?: UseHashtagOptions) {
  return useQuery({
    queryKey: hashtagQueryKeys.detail(id),
    queryFn: () => getHashtagById(id),
    enabled: !!id && (options?.enabled !== false),
    staleTime: options?.staleTime ?? 5 * 60 * 1000, // 5 minutes
    gcTime: options?.cacheTime ?? 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: options?.refetchOnWindowFocus !== false
  });
}

/**
 * Get hashtag by name
 */
export function useHashtagByName(name: string, options?: UseHashtagOptions) {
  return useQuery({
    queryKey: hashtagQueryKeys.detail(name),
    queryFn: () => getHashtagByName(name),
    enabled: !!name && (options?.enabled !== false),
    staleTime: options?.staleTime ?? 5 * 60 * 1000,
    gcTime: options?.cacheTime ?? 10 * 60 * 1000,
    refetchOnWindowFocus: options?.refetchOnWindowFocus !== false
  });
}

/**
 * Search hashtags
 */
export function useHashtagSearch(options: UseHashtagSearchOptions) {
  return useQuery({
    queryKey: hashtagQueryKeys.search(options.query),
    queryFn: () => searchHashtags({
      query: options.query,
      filters: options.filters || {},
      sort: options.sort,
      limit: options.limit
    }),
    enabled: !!options.query && (options.enabled !== false),
    staleTime: options.staleTime ?? 2 * 60 * 1000, // 2 minutes
    gcTime: options.cacheTime ?? 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: options.refetchOnWindowFocus !== false
  });
}

/**
 * Get trending hashtags
 */
export function useTrendingHashtags(options: UseTrendingHashtagsOptions = {}) {
  return useQuery({
    queryKey: hashtagQueryKeys.trending(options.category),
    queryFn: () => getTrendingHashtags(options.category, options.limit),
    enabled: options.enabled !== false,
    staleTime: options.staleTime ?? 1 * 60 * 1000, // 1 minute
    gcTime: options.cacheTime ?? 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: options.refetchOnWindowFocus !== false,
    refetchInterval: 5 * 60 * 1000 // Refetch every 5 minutes
  });
}

/**
 * Get hashtag suggestions
 */
export function useHashtagSuggestions(options: UseHashtagSuggestionsOptions) {
  return useQuery({
    queryKey: hashtagQueryKeys.suggestions(options.input),
    queryFn: () => getHashtagSuggestions(
      options.input,
      options.context,
      options.limit
    ),
    enabled: !!options.input && options.input.length >= 2 && (options.enabled !== false),
    staleTime: options.staleTime || 30 * 1000, // 30 seconds
    gcTime: options.cacheTime || 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: options.refetchOnWindowFocus !== false
  });
}

/**
 * Get user's followed hashtags
 */
export function useUserHashtags(options?: UseHashtagOptions) {
  return useQuery({
    queryKey: hashtagQueryKeys.user(),
    queryFn: getUserHashtags,
    enabled: options?.enabled !== false,
    staleTime: options?.staleTime || 2 * 60 * 1000, // 2 minutes
    gcTime: options?.cacheTime || 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: options?.refetchOnWindowFocus !== false
  });
}

/**
 * Get hashtag analytics
 */
export function useHashtagAnalytics(
  hashtagId: string,
  period: '24h' | '7d' | '30d' | '90d' | '1y' = '7d',
  options?: UseHashtagOptions
) {
  return useQuery({
    queryKey: hashtagQueryKeys.analytics(hashtagId, period),
    queryFn: () => getHashtagAnalytics(hashtagId, period),
    enabled: !!hashtagId && (options?.enabled !== false),
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
    gcTime: options?.cacheTime || 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: options?.refetchOnWindowFocus !== false
  });
}

/**
 * Get hashtag stats
 */
export function useHashtagStats(options?: UseHashtagOptions) {
  return useQuery({
    queryKey: hashtagQueryKeys.stats(),
    queryFn: getHashtagStats,
    enabled: options?.enabled !== false,
    staleTime: options?.staleTime || 2 * 60 * 1000, // 2 minutes
    gcTime: options?.cacheTime || 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: options?.refetchOnWindowFocus !== false
  });
}

/**
 * Validate hashtag name
 */
export function useHashtagValidation(name: string, options?: UseHashtagOptions) {
  return useQuery({
    queryKey: hashtagQueryKeys.validation(name),
    queryFn: () => validateHashtagName(name),
    enabled: !!name && name.length >= 2 && (options?.enabled !== false),
    staleTime: options?.staleTime || 30 * 1000, // 30 seconds
    gcTime: options?.cacheTime || 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: options?.refetchOnWindowFocus !== false
  });
}

// ============================================================================
// HASHTAG MUTATIONS
// ============================================================================

/**
 * Create hashtag mutation
 */
export function useCreateHashtag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ name, description, category }: { 
      name: string; 
      description?: string; 
      category?: HashtagCategory 
    }) => createHashtag(name, description, category),
    onSuccess: (data) => {
      if (data.success && data.data) {
        // Invalidate and refetch hashtag lists
        queryClient.invalidateQueries({ queryKey: hashtagQueryKeys.lists() });
        queryClient.invalidateQueries({ queryKey: hashtagQueryKeys.stats() });
        
        // Add to cache
        queryClient.setQueryData(
          hashtagQueryKeys.detail(data.data.id),
          data
        );
      }
    },
    onError: (error) => {
      console.error('Failed to create hashtag:', error);
    }
  });
}

/**
 * Update hashtag mutation
 */
export function useUpdateHashtag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Hashtag> }) => 
      updateHashtag(id, updates),
    onSuccess: (data, variables) => {
      if (data.success && data.data) {
        // Update cache
        queryClient.setQueryData(
          hashtagQueryKeys.detail(variables.id),
          data
        );
        
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: hashtagQueryKeys.lists() });
        queryClient.invalidateQueries({ queryKey: hashtagQueryKeys.trending() });
        queryClient.invalidateQueries({ queryKey: hashtagQueryKeys.stats() });
      }
    },
    onError: (error) => {
      console.error('Failed to update hashtag:', error);
    }
  });
}

/**
 * Delete hashtag mutation
 */
export function useDeleteHashtag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteHashtag(id),
    onSuccess: (data, hashtagId) => {
      if (data.success) {
        // Remove from cache
        queryClient.removeQueries({ queryKey: hashtagQueryKeys.detail(hashtagId) });
        
        // Invalidate related queries
        queryClient.invalidateQueries({ queryKey: hashtagQueryKeys.lists() });
        queryClient.invalidateQueries({ queryKey: hashtagQueryKeys.trending() });
        queryClient.invalidateQueries({ queryKey: hashtagQueryKeys.stats() });
        queryClient.invalidateQueries({ queryKey: hashtagQueryKeys.user() });
      }
    },
    onError: (error) => {
      console.error('Failed to delete hashtag:', error);
    }
  });
}

/**
 * Follow hashtag mutation
 */
export function useFollowHashtag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (hashtagId: string) => followHashtag(hashtagId),
    onSuccess: (data) => {
      if (data.success && data.data) {
        // Add to user hashtags cache
        queryClient.setQueryData(
          hashtagQueryKeys.user(),
          (oldData: any) => {
            if (!oldData?.data) return oldData;
            return {
              ...oldData,
              data: [...oldData.data, data.data]
            };
          }
        );
        
        // Invalidate hashtag details
        queryClient.invalidateQueries({ queryKey: hashtagQueryKeys.detail(data.data.hashtag_id) });
        queryClient.invalidateQueries({ queryKey: hashtagQueryKeys.stats() });
      }
    },
    onError: (error) => {
      console.error('Failed to follow hashtag:', error);
    }
  });
}

/**
 * Unfollow hashtag mutation
 */
export function useUnfollowHashtag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (hashtagId: string) => unfollowHashtag(hashtagId),
    onSuccess: (data, hashtagId) => {
      if (data.success) {
        // Remove from user hashtags cache
        queryClient.setQueryData(
          hashtagQueryKeys.user(),
          (oldData: any) => {
            if (!oldData?.data) return oldData;
            return {
              ...oldData,
              data: oldData.data.filter((uh: UserHashtag) => uh.hashtag_id !== hashtagId)
            };
          }
        );
        
        // Invalidate hashtag details
        queryClient.invalidateQueries({ queryKey: hashtagQueryKeys.detail(hashtagId) });
        queryClient.invalidateQueries({ queryKey: hashtagQueryKeys.stats() });
      }
    },
    onError: (error) => {
      console.error('Failed to unfollow hashtag:', error);
    }
  });
}

// ============================================================================
// COMBINED HOOKS
// ============================================================================

/**
 * Combined hashtag data hook
 */
export function useHashtagData(hashtagId: string, options?: UseHashtagOptions) {
  const hashtag = useHashtag(hashtagId, options);
  const analytics = useHashtagAnalytics(hashtagId, '7d', options);
  const userHashtags = useUserHashtags(options);

  return {
    hashtag,
    analytics,
    userHashtags,
    isFollowing: userHashtags.data?.data?.some(
      (uh: UserHashtag) => uh.hashtag_id === hashtagId
    ) || false
  };
}

/**
 * Combined hashtag search hook
 */
export function useHashtagSearchWithSuggestions(
  query: string,
  options?: UseHashtagSearchOptions
) {
  const search = useHashtagSearch({ query, ...options });
  const suggestions = useHashtagSuggestions({
    input: query,
    limit: 5,
    ...options
  });

  return {
    search,
    suggestions,
    isLoading: search.isLoading || suggestions.isLoading,
    error: search.error || suggestions.error
  };
}

/**
 * Combined trending hashtags hook
 */
export function useTrendingHashtagsWithStats(category?: HashtagCategory) {
  const trending = useTrendingHashtags(category ? { category } : {});
  const stats = useHashtagStats();

  return {
    trending,
    stats,
    isLoading: trending.isLoading || stats.isLoading,
    error: trending.error || stats.error
  };
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Get hashtag loading states
 */
export function useHashtagLoadingStates() {
  const userHashtags = useUserHashtags();
  const trending = useTrendingHashtags();
  const stats = useHashtagStats();

  return {
    isLoading: userHashtags.isLoading || trending.isLoading || stats.isLoading,
    isUserHashtagsLoading: userHashtags.isLoading,
    isTrendingLoading: trending.isLoading,
    isStatsLoading: stats.isLoading
  };
}

/**
 * Get hashtag error states
 */
export function useHashtagErrorStates() {
  const userHashtags = useUserHashtags();
  const trending = useTrendingHashtags();
  const stats = useHashtagStats();

  const errors = [
    userHashtags.error,
    trending.error,
    stats.error
  ].filter(Boolean);

  return {
    hasError: errors.length > 0,
    errors,
    userHashtagsError: userHashtags.error,
    trendingError: trending.error,
    statsError: stats.error
  };
}

/**
 * Get hashtag data summary
 */
export function useHashtagDataSummary() {
  const userHashtags = useUserHashtags();
  const trending = useTrendingHashtags();
  const stats = useHashtagStats();

  return {
    followedCount: userHashtags.data?.data?.length || 0,
    trendingCount: trending.data?.data?.length || 0,
    totalHashtags: stats.data?.data?.total_hashtags || 0,
    isLoading: userHashtags.isLoading || trending.isLoading || stats.isLoading,
    hasError: !!(userHashtags.error || trending.error || stats.error)
  };
}
