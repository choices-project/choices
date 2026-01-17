# Converting Manual Fetch to React Query

## Current Implementation (Manual Fetch)

### How It Works Now

**File: `web/hooks/useAnalytics.ts`**

```typescript
export function useAnalytics(options: UseAnalyticsOptions = {}): UseAnalyticsReturn {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(autoRefresh);
  const [filters, setFilters] = useState<AnalyticsFilters>(defaultFilters);

  // Manual fetch function
  const fetchData = useCallback(async (_type: string = 'overview', customFilters?: AnalyticsFilters) => {
    if (!analyticsEnabled) {
      setError('Analytics feature is disabled');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const requestFilters = { ...filters, ...(customFilters ?? {}) };
      const queryParams = new URLSearchParams({
        period: requestFilters.dateRange ?? '7d'
      });

      const response = await fetch(`/api/analytics?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        throw new Error('Failed to parse analytics data');
      }
      
      setData(result);
      setLastUpdated(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [analyticsEnabled, filters]);

  // Manual auto-refresh with setInterval
  useEffect(() => {
    if (!analyticsEnabled || !autoRefreshEnabled) {
      return;
    }
    
    fetchData();
    
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [analyticsEnabled, autoRefreshEnabled, refreshInterval, fetchData]);

  return {
    data,
    loading,
    error,
    lastUpdated,
    fetchData,
    refreshData: () => fetchData(),
    // ... other properties
  };
}
```

**File: `web/features/admin/components/AnalyticsPanel.tsx`**

```typescript
export default function AnalyticsPanel({ refreshInterval = 30000 }: AnalyticsPanelProps) {
  const [selectedMetric, setSelectedMetric] = useState<'users' | 'polls' | 'votes' | 'performance'>('users');
  
  // Manual fetch function
  const fetchData = useCallback(async () => {
    setLoadingRef.current(true);
    clearErrorRef.current();

    try {
      const response = await fetch('/api/analytics?type=general');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error('Failed to parse analytics data');
      }

      if (data.dashboard) {
        setDashboardRef.current(data.dashboard);
      }
      if (data.performanceMetrics) {
        setPerformanceMetricsRef.current(data.performanceMetrics);
      }
      // ... update store
    } catch (err) {
      setErrorRef.current(errorMessage);
    } finally {
      setLoadingRef.current(false);
    }
  }, []);  

  // Manual interval refresh
  useEffect(() => {
    void fetchData();

    const interval = setInterval(() => {
      void fetchData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [selectedMetric, refreshInterval, fetchData]);
}
```

### Problems with Current Approach

1. **No Caching**: Every component mount refetches data, even if it's still fresh
2. **Manual State Management**: You have to manually manage `loading`, `error`, and `data` states
3. **No Automatic Refetching**: You have to manually implement `setInterval` for auto-refresh
4. **No Background Refetching**: React Query can refetch in the background when the window regains focus
5. **More Boilerplate**: Lots of `useState`, `useCallback`, `useEffect` code
6. **No Request Deduplication**: If multiple components use the same hook, they each make separate requests
7. **No Optimistic Updates**: Harder to implement optimistic UI updates

---

## How It Should Be (React Query)

### Improved Implementation

**File: `web/lib/hooks/useApi.ts` (add to existing file)**

```typescript
// Add to queryKeys
export const queryKeys = {
  // ... existing keys
  analytics: (filters?: AnalyticsFilters) => ['analytics', filters] as const,
  analyticsGeneral: ['analytics', 'general'] as const,
};

// Add new hook
export function useAnalytics(
  filters?: AnalyticsFilters,
  options?: Omit<UseQueryOptions<AnalyticsData>, 'queryKey' | 'queryFn'>
) {
  const analyticsEnabled = isFeatureEnabled('analytics');
  
  const queryOptions = mergeDefined(
    {
      queryKey: queryKeys.analytics(filters),
      queryFn: async () => {
        if (!analyticsEnabled) {
          throw new Error('Analytics feature is disabled');
        }

        const queryParams = new URLSearchParams({
          period: filters?.dateRange ?? '7d',
          ...(filters?.pollId ? { pollId: filters.pollId } : {}),
          ...(filters?.userType ? { userType: filters.userType } : {}),
          ...(filters?.deviceType ? { deviceType: filters.deviceType } : {}),
        });

        const response = await get<AnalyticsData>(`/api/analytics?${queryParams}`);
        return response;
      },
      staleTime: 30000, // 30 seconds - analytics update frequently
      gcTime: 5 * 60 * 1000, // 5 minutes - keep in cache
      refetchInterval: 30000, // Auto-refresh every 30 seconds
      refetchIntervalInBackground: false, // Don't refetch when tab is in background
      enabled: analyticsEnabled, // Only fetch if analytics is enabled
    },
    options as any
  ) as UseQueryOptions<AnalyticsData>;

  return useQuery(queryOptions);
}

// For AnalyticsPanel (general analytics)
export function useAnalyticsGeneral(
  options?: Omit<UseQueryOptions<any>, 'queryKey' | 'queryFn'>
) {
  const queryOptions = mergeDefined(
    {
      queryKey: queryKeys.analyticsGeneral,
      queryFn: async () => {
        const response = await get('/api/analytics?type=general');
        return response;
      },
      staleTime: 30000,
      gcTime: 5 * 60 * 1000,
      refetchInterval: 30000,
    },
    options as any
  ) as UseQueryOptions<any>;

  return useQuery(queryOptions);
}
```

**File: `web/hooks/useAnalytics.ts` (simplified version)**

```typescript
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAnalytics as useAnalyticsQuery } from '@/lib/hooks/useApi';

export function useAnalytics(options: UseAnalyticsOptions = {}): UseAnalyticsReturn {
  const {
    autoRefresh = true,
    refreshInterval = 30000,
    defaultFilters = {}
  } = options;

  const analyticsEnabled = isFeatureEnabled('analytics');
  const queryClient = useQueryClient();

  // Use React Query hook
  const { 
    data, 
    isLoading: loading, 
    error: queryError,
    dataUpdatedAt 
  } = useAnalyticsQuery(defaultFilters, {
    refetchInterval: autoRefresh ? refreshInterval : false,
    enabled: analyticsEnabled,
  });

  // Convert React Query error to string
  const error = queryError instanceof Error ? queryError.message : null;
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  // Manual refresh function (uses React Query's refetch)
  const refreshData = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.analytics(defaultFilters) });
  }, [queryClient, defaultFilters]);

  // Fetch with custom filters
  const fetchData = useCallback(async (type?: string, customFilters?: AnalyticsFilters) => {
    const filters = { ...defaultFilters, ...(customFilters ?? {}) };
    await queryClient.invalidateQueries({ queryKey: queryKeys.analytics(filters) });
  }, [queryClient, defaultFilters]);

  return {
    data: data ?? null,
    loading,
    error,
    lastUpdated,
    analyticsEnabled,
    fetchData,
    refreshData,
    clearError: () => queryClient.resetQueries({ queryKey: queryKeys.analytics(defaultFilters) }),
    // ... other properties
  };
}
```

**File: `web/features/admin/components/AnalyticsPanel.tsx` (simplified version)**

```typescript
import { useAnalyticsGeneral } from '@/lib/hooks/useApi';

export default function AnalyticsPanel({ refreshInterval = 30000 }: AnalyticsPanelProps) {
  const [selectedMetric, setSelectedMetric] = useState<'users' | 'polls' | 'votes' | 'performance'>('users');
  
  // Use React Query hook - much simpler!
  const { 
    data, 
    isLoading: storeLoading, 
    error: queryError,
    refetch: fetchData 
  } = useAnalyticsGeneral({
    refetchInterval: refreshInterval,
  });

  const storeError = queryError instanceof Error ? queryError.message : null;

  // Update store when data changes
  useEffect(() => {
    if (data) {
      if (data.dashboard) {
        setDashboardRef.current(data.dashboard);
      }
      if (data.performanceMetrics) {
        setPerformanceMetricsRef.current(data.performanceMetrics);
      }
      if (data.userBehavior) {
        updateUserBehaviorRef.current(data.userBehavior);
      }
    }
  }, [data]);

  // Rest of component...
}
```

---

## Benefits of React Query Approach

### 1. **Automatic Caching**
```typescript
// ✅ React Query: Data is cached automatically
const { data } = useAnalytics(); // First call fetches
const { data } = useAnalytics(); // Second call uses cache (if fresh)

// ❌ Manual: Every call fetches
const { data } = useAnalytics(); // Fetches
const { data } = useAnalytics(); // Fetches again!
```

### 2. **Automatic Refetching**
```typescript
// ✅ React Query: Built-in refetchInterval
useQuery({
  queryKey: ['analytics'],
  queryFn: fetchAnalytics,
  refetchInterval: 30000, // Auto-refresh every 30s
});

// ❌ Manual: You have to implement setInterval
useEffect(() => {
  const interval = setInterval(fetchData, 30000);
  return () => clearInterval(interval);
}, []);
```

### 3. **Background Refetching**
```typescript
// ✅ React Query: Refetches when window regains focus
useQuery({
  queryKey: ['analytics'],
  queryFn: fetchAnalytics,
  refetchOnWindowFocus: true, // Automatic!
});

// ❌ Manual: You have to add window focus listeners
useEffect(() => {
  const handleFocus = () => fetchData();
  window.addEventListener('focus', handleFocus);
  return () => window.removeEventListener('focus', handleFocus);
}, []);
```

### 4. **Request Deduplication**
```typescript
// ✅ React Query: Multiple components share the same request
function ComponentA() {
  const { data } = useAnalytics(); // Fetches
}
function ComponentB() {
  const { data } = useAnalytics(); // Uses same request (deduplicated)
}

// ❌ Manual: Each component makes its own request
function ComponentA() {
  const { data } = useAnalytics(); // Fetches
}
function ComponentB() {
  const { data } = useAnalytics(); // Fetches again!
}
```

### 5. **Less Boilerplate**
```typescript
// ✅ React Query: ~10 lines
const { data, isLoading, error } = useQuery({
  queryKey: ['analytics'],
  queryFn: fetchAnalytics,
  staleTime: 30000,
  gcTime: 5 * 60 * 1000,
});

// ❌ Manual: ~50 lines
const [data, setData] = useState(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const fetchData = useCallback(async () => {
  setLoading(true);
  try {
    const response = await fetch('/api/analytics');
    const result = await response.json();
    setData(result);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}, []);
useEffect(() => {
  fetchData();
}, [fetchData]);
```

### 6. **Better Error Handling**
```typescript
// ✅ React Query: Automatic retry with exponential backoff
useQuery({
  queryKey: ['analytics'],
  queryFn: fetchAnalytics,
  retry: 3, // Automatically retries 3 times
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
});

// ❌ Manual: You have to implement retry logic yourself
```

---

## When to Convert

**Convert to React Query when:**
- ✅ You have `fetch()` + `useState` + `useEffect` pattern
- ✅ You're manually managing loading/error states
- ✅ You're implementing auto-refresh with `setInterval`
- ✅ Multiple components need the same data
- ✅ You want automatic caching and background refetching

**Keep manual fetch when:**
- ❌ One-time fetch on mount (optional, but React Query still better)
- ❌ Very simple, non-reusable data fetching
- ❌ You need very custom behavior that React Query doesn't support

---

## Migration Checklist

1. ✅ Add query key to `queryKeys` in `useApi.ts`
2. ✅ Create React Query hook in `useApi.ts` with `staleTime` and `gcTime`
3. ✅ Replace `useState` + `fetch()` with `useQuery`
4. ✅ Replace manual `setInterval` with `refetchInterval`
5. ✅ Remove manual loading/error state management
6. ✅ Test that caching works correctly
7. ✅ Test that auto-refresh works correctly

---

## Summary

**Current (Manual):**
- ❌ No caching
- ❌ Manual state management
- ❌ Manual auto-refresh
- ❌ More boilerplate
- ❌ No request deduplication

**Improved (React Query):**
- ✅ Automatic caching
- ✅ Automatic state management
- ✅ Built-in auto-refresh
- ✅ Less boilerplate
- ✅ Request deduplication
- ✅ Background refetching
- ✅ Automatic retries

