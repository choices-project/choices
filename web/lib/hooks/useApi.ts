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
  ApiError,
  type UserProfile,
  type Poll,
  type Feedback,
  type DashboardData,
  type TrendingHashtag,
  type TrendingPoll,
} from '@/lib/api';

function mergeDefined<T extends object, U extends object>(base: T, extras?: U): T & Partial<U> {
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  if (extras) {
    for (const [k, v] of Object.entries(extras as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = v;
      }
    }
  }
  return out as T & Partial<U>;
}

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
  analytics: (filters?: Record<string, string>) => ['analytics', filters] as const,
  analyticsGeneral: ['analytics', 'general'] as const,
  pollAnalytics: (id: string) => ['analytics', 'poll', id] as const,
  userAnalytics: (id: string) => ['analytics', 'user', id] as const,

  // Health
  health: ['health'] as const,
  healthDatabase: ['health', 'database'] as const,
  healthExtended: ['health', 'extended'] as const,

  // Monitoring (admin)
  monitoring: ['monitoring'] as const,
  monitoringSecurity: ['monitoring', 'security'] as const,
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

  const queryOptions = mergeDefined(
    {
      queryKey: queryKeys.profile,
      queryFn: async () => {
        const data = await get<{ profile: UserProfile }>('/api/profile');
        return data.profile;
      },
      staleTime: 60000, // 1 minute - user profile doesn't change frequently
      gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
      retry: (failureCount, error) => {
        // Don't retry auth errors (401/403) - redirect to login
        if (error instanceof ApiError && error.isAuthError()) {
          return false;
        }
        // Retry other errors up to 2 times for premier UX
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    options as any
  ) as UseQueryOptions<UserProfile>;

  queryOptions.meta = mergeDefined(
    {
      onError: (error: ApiError) => {
        if (error.isAuthError()) {
          router.push('/login');
        }
      },
    },
    options?.meta as any
  ) as any;

  return useQuery(queryOptions);
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

  const mutationOptions = mergeDefined(
    (options ?? {}) as any,
    {
      mutationFn: async (data: Partial<UserProfile>) => {
        return await patch<UserProfile>('/api/profile', data);
      },
      onSuccess: (data: UserProfile) => {
        queryClient.setQueryData(queryKeys.profile, data);
      },
    }
  ) as UseMutationOptions<UserProfile, ApiError, Partial<UserProfile>, unknown>;

  return useMutation(mutationOptions);
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

  const mutationOptions = mergeDefined(
    (options ?? {}) as any,
    {
      mutationFn: async () => {
        await del('/api/profile');
      },
      onSuccess: () => {
        queryClient.clear();
        router.push('/');
      },
    }
  ) as UseMutationOptions<void, ApiError, void, unknown>;

  return useMutation(mutationOptions);
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
  const queryOptions = mergeDefined(
    {
      queryKey: queryKeys.dashboard,
      queryFn: async () => {
        return await get<DashboardData>(`/api/dashboard${useCache ? '' : '?cache=false'}`);
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
      retry: (failureCount, error) => {
        // Don't retry auth errors (401/403)
        if (error instanceof ApiError && error.isAuthError()) {
          return false;
        }
        // Retry other errors up to 2 times for premier UX
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    options as any
  ) as UseQueryOptions<DashboardData>;

  return useQuery(queryOptions);
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
  const queryOptions = mergeDefined(
    {
      queryKey: [...queryKeys.polls, filters] as const,
      queryFn: async () => {
        const params = new URLSearchParams();
        if (filters?.status) params.append('status', filters.status);
        if (filters?.limit) params.append('limit', filters.limit.toString());

        return await get<Poll[]>(`/api/polls?${params}`);
      },
      staleTime: 30000, // 30 seconds - polls may update frequently
      gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache
      retry: (failureCount, error) => {
        // Don't retry auth errors (401/403)
        if (error instanceof ApiError && error.isAuthError()) {
          return false;
        }
        // Retry other errors up to 2 times for premier UX
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    options as any
  ) as UseQueryOptions<Poll[]>;

  return useQuery(queryOptions);
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
  const queryOptions = mergeDefined(
    {
      queryKey: queryKeys.poll(id),
      queryFn: async () => {
        return await get<Poll>(`/api/polls/${id}`);
      },
      staleTime: 60000, // 1 minute - individual poll data
      gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
      retry: (failureCount, error) => {
        // Don't retry auth errors (401/403) or 404 errors (poll not found)
        if (error instanceof ApiError && (error.isAuthError() || error.status === 404)) {
          return false;
        }
        // Retry other errors up to 2 times for premier UX
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    options as any
  ) as UseQueryOptions<Poll>;

  return useQuery(queryOptions);
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

  const mutationOptions = mergeDefined(
    (options ?? {}) as any,
    {
      mutationFn: async ({ pollId, optionId }: { pollId: string; optionId: string }) => {
        await post(`/api/polls/${pollId}/vote`, { option_id: optionId });
      },
      onSuccess: (_: void, variables: { pollId: string }) => {
        queryClient.invalidateQueries({ queryKey: queryKeys.poll(variables.pollId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.polls });
      },
    }
  ) as UseMutationOptions<void, ApiError, { pollId: string; optionId: string }, unknown>;

  return useMutation(mutationOptions);
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
  const queryOptions = mergeDefined(
    {
      queryKey: [...queryKeys.trendingPolls, limit] as const,
      queryFn: async () => {
        const response = await get<{ data: TrendingPoll[] }>(`/api/trending?type=polls&limit=${limit}`);
        return response.data;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
      retry: (failureCount, error) => {
        // Don't retry auth errors (401/403)
        if (error instanceof ApiError && error.isAuthError()) {
          return false;
        }
        // Retry other errors up to 2 times for premier UX
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    options as any
  ) as UseQueryOptions<TrendingPoll[]>;

  return useQuery(queryOptions);
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
  const queryOptions = mergeDefined(
    {
      queryKey: [...queryKeys.trendingHashtags, limit] as const,
      queryFn: async () => {
        const response = await get<{ data: TrendingHashtag[] }>(`/api/trending?type=hashtags&limit=${limit}`);
        return response.data;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes - keep in cache
      retry: (failureCount, error) => {
        // Don't retry auth errors (401/403)
        if (error instanceof ApiError && error.isAuthError()) {
          return false;
        }
        // Retry other errors up to 2 times for premier UX
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    options as any
  ) as UseQueryOptions<TrendingHashtag[]>;

  return useQuery(queryOptions);
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

  const mutationOptions = mergeDefined(
    (options ?? {}) as any,
    {
      mutationFn: async (feedback: Partial<Feedback>) => {
        return await post<Feedback>('/api/feedback', feedback);
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: queryKeys.feedback });
      },
    }
  ) as UseMutationOptions<Feedback, ApiError, Partial<Feedback>, unknown>;

  return useMutation(mutationOptions);
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
  const queryOptions = mergeDefined(
    {
      queryKey: queryKeys.feedbackList(filters),
      queryFn: async () => {
        const params = filters ? new URLSearchParams(filters) : '';
        const response = await get<{ feedback: Feedback[] }>(`/api/feedback${params ? `?${params}` : ''}`);
        return response.feedback;
      },
      staleTime: 30000, // 30 seconds - feedback may update
      gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache
      retry: (failureCount, error) => {
        // Don't retry auth errors (401/403)
        if (error instanceof ApiError && error.isAuthError()) {
          return false;
        }
        // Retry other errors up to 2 times for premier UX
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    options as any
  ) as UseQueryOptions<Feedback[]>;

  return useQuery(queryOptions);
}

// ============================================================================
// ANALYTICS HOOKS
// ============================================================================

/**
 * Get analytics data with caching
 *
 * @example
 * const { data: analytics, isLoading } = useAnalytics({ dateRange: '7d' });
 */
export function useAnalytics(
  filters?: { dateRange?: string; pollId?: string; userType?: string; deviceType?: string },
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) {
  const queryOptions = mergeDefined(
    {
      queryKey: queryKeys.analytics(filters),
      queryFn: async () => {
        const params = new URLSearchParams();
        if (filters?.dateRange) params.append('period', filters.dateRange);
        if (filters?.pollId) params.append('pollId', filters.pollId);
        if (filters?.userType) params.append('userType', filters.userType);
        if (filters?.deviceType) params.append('deviceType', filters.deviceType);

        return await get(`/api/analytics?${params}`);
      },
      staleTime: 30000, // 30 seconds - analytics update frequently
      gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache
      refetchInterval: 30000, // Auto-refresh every 30s
      retry: (failureCount, error) => {
        // Don't retry auth errors (401/403)
        if (error instanceof ApiError && error.isAuthError()) {
          return false;
        }
        // Retry other errors up to 2 times for premier UX
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    options as any
  ) as UseQueryOptions<any>;

  return useQuery(queryOptions);
}

/**
 * Get general analytics data (for AnalyticsPanel)
 *
 * @example
 * const { data: analytics, isLoading } = useAnalyticsGeneral();
 */
export function useAnalyticsGeneral(
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) {
  const queryOptions = mergeDefined(
    {
      queryKey: queryKeys.analyticsGeneral,
      queryFn: async () => {
        try {
          // Add timeout to prevent hanging
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

          try {
            const response = await fetch('/api/analytics?type=general', {
              signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({ error: response.statusText }));
              throw new Error(errorData.error || `Failed to fetch analytics: ${response.statusText}`);
            }

            const data = await response.json();
            return data.data || data; // Handle both { data: {...} } and direct response
          } catch (fetchError) {
            clearTimeout(timeoutId);
            if (fetchError instanceof Error && fetchError.name === 'AbortError') {
              throw new Error('Request timed out. Please try again.');
            }
            throw fetchError;
          }
        } catch (error) {
          // If auth error, return null instead of throwing (allows component to render)
          if (error instanceof Error && (error.message.includes('auth') || error.message.includes('unauthorized'))) {
            return null;
          }
          throw error;
        }
      },
      staleTime: 30000, // 30 seconds - analytics update frequently
      gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache
      refetchInterval: 30000, // Auto-refresh every 30s
      retry: (failureCount, error) => {
        // Don't retry auth errors (401/403)
        if (error instanceof Error && (error.message.includes('auth') || error.message.includes('unauthorized'))) {
          return false;
        }
        // Retry other errors up to 2 times (including 500 errors)
        // React Query will retry network errors and server errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      retryOnMount: false, // Don't retry on mount if query failed (prevents unnecessary requests)
    },
    options as any
  ) as UseQueryOptions<any>;

  return useQuery(queryOptions);
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
  const queryOptions = mergeDefined(
    {
      queryKey: [...queryKeys.health, type] as const,
      queryFn: async () => {
        const url = type === 'basic'
          ? '/api/health'
          : type === 'extended'
            ? '/api/health/extended'
            : `/api/health?type=${type}`;
        return get(url);
      },
      staleTime: 30000, // 30 seconds - health checks update frequently
      gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache
      retry: (failureCount, error) => {
        // Only retry on actual network/server errors (not auth errors)
        if (error instanceof Error && error.message.includes('auth')) {
          return false; // Don't retry auth errors
        }
        // Retry other errors up to 2 times for premier UX
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    options as any
  ) as UseQueryOptions<any>;

  if (type === 'database') {
    queryOptions.refetchInterval = 30000;
  }

  return useQuery(queryOptions);
}

/**
 * Get extended system health status
 *
 * @example
 * const { data: health } = useExtendedHealth();
 */
export function useExtendedHealth(
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) {
  const queryOptions = mergeDefined(
    {
      queryKey: queryKeys.healthExtended,
      queryFn: async () => {
        return get('/api/health/extended');
      },
      staleTime: 30000, // 30 seconds - health checks update frequently
      gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache
      retry: (failureCount, error) => {
        // Only retry on actual network/server errors (not auth errors)
        if (error instanceof ApiError && error.isAuthError()) {
          return false;
        }
        // Retry other errors up to 2 times for premier UX
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchInterval: 60000, // Refetch every minute for real-time monitoring
    },
    options as any
  ) as UseQueryOptions<any>;

  return useQuery(queryOptions);
}

/**
 * Get security monitoring data (rate limiting violations, etc.)
 *
 * @example
 * const { data: monitoring } = useMonitoring({ range: '24h', endpoint: '/api/feeds' });
 */
export function useMonitoring(
  filters?: { range?: '1h' | '24h' | '7d'; endpoint?: string },
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) {
  const queryOptions = mergeDefined(
    {
      queryKey: [...queryKeys.monitoringSecurity, filters] as const,
      queryFn: async () => {
        const params = new URLSearchParams();
        if (filters?.range) params.set('range', filters.range);
        if (filters?.endpoint) params.set('endpoint', filters.endpoint);
        const url = `/api/security/monitoring${params.toString() ? `?${params.toString()}` : ''}`;
        // get() automatically unwraps { success: true, data: {...} } structure
        // Returns the data portion directly
        return get<any>(url);
      },
      staleTime: 30000, // 30 seconds - monitoring data updates frequently
      gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache
      retry: (failureCount, error) => {
        // Only retry on actual network/server errors (not auth errors)
        if (error instanceof ApiError && error.isAuthError()) {
          return false;
        }
        // Retry other errors up to 2 times for premier UX
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchInterval: 60000, // Refetch every minute for real-time monitoring
    },
    options as any
  ) as UseQueryOptions<any>;

  return useQuery(queryOptions);
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

