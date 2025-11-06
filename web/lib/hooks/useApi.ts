/**
 * React Query API Hooks
 *
 * Type-safe React Query hooks for all API endpoints.
 * Use these instead of raw API calls for automatic caching, loading states, and error handling.
 *
 * Created: November 6, 2025 (Phase 4)
 * Status: ✅ ACTIVE
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import {
  get,
  post,
  patch,
  del,
  type ApiError,
  type UserProfile,
  type Poll,
  type Feedback,
  type DashboardData,
  type TrendingHashtag,
  type TrendingPoll,
} from '@/lib/api';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const queryKeys = {
  // Profile
  profile: ['profile'] as const,
  profileExport: ['profile', 'export'] as const,

  // Dashboard
  dashboard: ['dashboard'] as const,
  adminDashboard: ['admin', 'dashboard'] as const,

  // Polls
  polls: ['polls'] as const,
  poll: (id: string) => ['polls', id] as const,
  pollResults: (id: string) => ['polls', id, 'results'] as const,
  trendingPolls: ['polls', 'trending'] as const,

  // Feedback
  feedback: ['feedback'] as const,
  feedbackList: (filters?: Record<string, string>) =>
    ['feedback', 'list', filters] as const,

  // Trending
  trendingHashtags: ['trending', 'hashtags'] as const,
  trendingTopics: ['trending', 'topics'] as const,

  // Analytics
  analytics: ['analytics'] as const,
  pollAnalytics: (id: string) => ['analytics', 'poll', id] as const,
  userAnalytics: (id: string) => ['analytics', 'user', id] as const,

  // Health
  health: ['health'] as const,
  healthDatabase: ['health', 'database'] as const,
} as const;

// ============================================================================
// PROFILE HOOKS
// ============================================================================

/**
 * Get user profile with automatic caching
 *
 * @example
 * const { data: profile, isLoading, error } = useProfile();
 */
export function useProfile(options?: Omit<UseQueryOptions<UserProfile>, 'queryKey' | 'queryFn'>) {
  const router = useRouter();

  return useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => {
      const data = await get<{ profile: UserProfile }>('/api/profile');
      return data.profile;
    },
    ...options,
    meta: {
      onError: (error: ApiError) => {
        if (error.isAuthError()) {
          router.push('/login');
        }
      },
      ...options?.meta,
    },
  });
}

/**
 * Update user profile with automatic cache invalidation
 *
 * @example
 * const updateProfile = useUpdateProfile();
 * await updateProfile.mutateAsync({ display_name: 'John Doe' });
 */
export function useUpdateProfile(
  options?: Omit<UseMutationOptions<UserProfile, ApiError, Partial<UserProfile>, unknown>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: async (data: Partial<UserProfile>) => {
      return await patch<UserProfile>('/api/profile', data);
    },
    onSuccess: (data, variables, context) => {
      // Update cache immediately
      queryClient.setQueryData(queryKeys.profile, data);
    },
  });
}

/**
 * Delete user profile
 *
 * @example
 * const deleteProfile = useDeleteProfile();
 * await deleteProfile.mutateAsync();
 */
export function useDeleteProfile(
  options?: Omit<UseMutationOptions<void, ApiError, void, unknown>, 'mutationFn'>
) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    ...options,
    mutationFn: async () => {
      await del('/api/profile');
    },
    onSuccess: () => {
      queryClient.clear();
      router.push('/');
    },
  });
}

// ============================================================================
// DASHBOARD HOOKS
// ============================================================================

/**
 * Get dashboard data with caching
 *
 * @example
 * const { data: dashboard, isLoading } = useDashboard();
 */
export function useDashboard(
  useCache: boolean = true,
  options?: Omit<UseQueryOptions<DashboardData>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => {
      return await get<DashboardData>(`/api/dashboard${useCache ? '' : '?cache=false'}`);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

// ============================================================================
// POLL HOOKS
// ============================================================================

/**
 * Get list of polls
 *
 * @example
 * const { data: polls } = usePolls({ status: 'active' });
 */
export function usePolls(
  filters?: { status?: string; limit?: number },
  options?: Omit<UseQueryOptions<Poll[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...queryKeys.polls, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.limit) params.append('limit', filters.limit.toString());

      return await get<Poll[]>(`/api/polls?${params}`);
    },
    ...options,
  });
}

/**
 * Get single poll by ID
 *
 * @example
 * const { data: poll } = usePoll('poll-123');
 */
export function usePoll(
  id: string,
  options?: Omit<UseQueryOptions<Poll>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.poll(id),
    queryFn: async () => {
      return await get<Poll>(`/api/polls/${id}`);
    },
    ...options,
  });
}

/**
 * Vote on a poll
 *
 * @example
 * const vote = useVote();
 * await vote.mutateAsync({ pollId: 'poll-123', optionId: 'option-1' });
 */
export function useVote(
  options?: Omit<UseMutationOptions<void, ApiError, { pollId: string; optionId: string }, unknown>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: async ({ pollId, optionId }) => {
      await post(`/api/polls/${pollId}/vote`, { option_id: optionId });
    },
    onSuccess: (_, variables) => {
      // Invalidate poll data to refetch with new vote count
      queryClient.invalidateQueries({ queryKey: queryKeys.poll(variables.pollId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.polls });
    },
  });
}

// ============================================================================
// TRENDING HOOKS
// ============================================================================

/**
 * Get trending polls
 *
 * @example
 * const { data: trending } = useTrendingPolls(10);
 */
export function useTrendingPolls(
  limit: number = 10,
  options?: Omit<UseQueryOptions<TrendingPoll[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...queryKeys.trendingPolls, limit],
    queryFn: async () => {
      const response = await get<{ data: TrendingPoll[] }>(`/api/trending?type=polls&limit=${limit}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

/**
 * Get trending hashtags
 *
 * @example
 * const { data: hashtags } = useTrendingHashtags(20);
 */
export function useTrendingHashtags(
  limit: number = 20,
  options?: Omit<UseQueryOptions<TrendingHashtag[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...queryKeys.trendingHashtags, limit],
    queryFn: async () => {
      const response = await get<{ data: TrendingHashtag[] }>(`/api/trending?type=hashtags&limit=${limit}`);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
}

// ============================================================================
// FEEDBACK HOOKS
// ============================================================================

/**
 * Submit feedback
 *
 * @example
 * const submitFeedback = useSubmitFeedback();
 * await submitFeedback.mutateAsync({ type: 'bug', title: 'Bug report', ... });
 */
export function useSubmitFeedback(
  options?: Omit<UseMutationOptions<Feedback, ApiError, Partial<Feedback>, unknown>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: async (feedback: Partial<Feedback>) => {
      return await post<Feedback>('/api/feedback', feedback);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.feedback });
    },
  });
}

/**
 * Get feedback list (admin)
 *
 * @example
 * const { data: feedbackList } = useFeedbackList({ status: 'open', type: 'bug' });
 */
export function useFeedbackList(
  filters?: Record<string, string>,
  options?: Omit<UseQueryOptions<Feedback[]>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.feedbackList(filters),
    queryFn: async () => {
      const params = filters ? new URLSearchParams(filters) : '';
      const response = await get<{ feedback: Feedback[] }>(`/api/feedback${params ? `?${params}` : ''}`);
      return response.feedback;
    },
    ...options,
  });
}

// ============================================================================
// HEALTH HOOKS (for monitoring/admin)
// ============================================================================

/**
 * Get system health status
 *
 * @example
 * const { data: health } = useHealth('database');
 */
export function useHealth(
  type: 'basic' | 'database' | 'extended' | 'all' = 'basic',
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: [...queryKeys.health, type],
    queryFn: async () => {
      const url = type === 'basic' ? '/api/health' :
                  type === 'extended' ? '/api/health/extended' :
                  `/api/health?type=${type}`;
      return await get(url);
    },
    ...(type === 'database' ? { refetchInterval: 30000 } : {}), // Conditionally add refetchInterval
    ...options,
  });
}

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Prefetch data for faster navigation
 *
 * @example
 * const prefetch = usePrefetch();
 * await prefetch.profile();
 */
export function usePrefetch() {
  const queryClient = useQueryClient();

  return {
    profile: () => queryClient.prefetchQuery({
      queryKey: queryKeys.profile,
      queryFn: async () => {
        const data = await get<{ profile: UserProfile }>('/api/profile');
        return data.profile;
      },
    }),
    dashboard: () => queryClient.prefetchQuery({
      queryKey: queryKeys.dashboard,
      queryFn: async () => await get<DashboardData>('/api/dashboard'),
    }),
    polls: () => queryClient.prefetchQuery({
      queryKey: queryKeys.polls,
      queryFn: async () => await get<Poll[]>('/api/polls'),
    }),
  };
}

/**
 * Invalidate all queries (useful after logout)
 *
 * @example
 * const { invalidateAll } = useInvalidateQueries();
 * invalidateAll();
 */
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () => queryClient.invalidateQueries(),
    invalidateProfile: () => queryClient.invalidateQueries({ queryKey: queryKeys.profile }),
    invalidateDashboard: () => queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
    invalidatePolls: () => queryClient.invalidateQueries({ queryKey: queryKeys.polls }),
    invalidateFeedback: () => queryClient.invalidateQueries({ queryKey: queryKeys.feedback }),
  };
}

