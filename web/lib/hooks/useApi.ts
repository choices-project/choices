/**
 * React Query API Hooks
 *
 * Type-safe React Query hooks for API endpoints.
 * Use these instead of raw API calls for automatic caching, loading states, and error handling.
 *
 * Created: November 6, 2025 (Phase 4)
 * Status: ✅ ACTIVE
 */

import { useQuery, type UseQueryOptions } from '@tanstack/react-query';

import { get, ApiError } from '@/lib/api';

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

// Query keys used internally by the hooks below
const queryKeys = {
  analytics: (filters?: Record<string, string>) => ['analytics', filters] as const,
  analyticsGeneral: ['analytics', 'general'] as const,
  healthExtended: ['health', 'extended'] as const,
  monitoringSecurity: ['monitoring', 'security'] as const,
} as const;

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
