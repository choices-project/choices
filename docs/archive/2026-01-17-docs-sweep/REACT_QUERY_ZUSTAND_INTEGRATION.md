# React Query + Zustand Integration Pattern

## Current Architecture

### How It Works Now

**Zustand Store** (`analyticsStore.ts`):
- Stores: `dashboard`, `performanceMetrics`, `userBehavior`, `loading`, `error`
- Actions: `setDashboard()`, `setPerformanceMetrics()`, `updateUserBehavior()`, `setLoading()`, `setError()`
- Selectors: `useAnalyticsDashboard()`, `useAnalyticsMetrics()`, `useAnalyticsLoading()`, `useAnalyticsError()`

**AnalyticsPanel** (`AnalyticsPanel.tsx`):
```typescript
// 1. Read from Zustand store
const dashboard = useAnalyticsDashboard();
const performanceMetrics = useAnalyticsMetrics();
const storeLoading = useAnalyticsLoading();
const storeError = useAnalyticsError();

// 2. Get Zustand actions
const { setDashboard, setPerformanceMetrics, updateUserBehavior, setLoading, setError } = useAnalyticsActions();

// 3. Manual fetch
const fetchData = useCallback(async () => {
  setLoading(true); // Update Zustand store
  
  const response = await fetch('/api/analytics?type=general');
  const data = await response.json();
  
  setDashboard(data.dashboard); // Update Zustand store
  setPerformanceMetrics(data.performanceMetrics); // Update Zustand store
  updateUserBehavior(data.userBehavior); // Update Zustand store
  
  setLoading(false); // Update Zustand store
}, []);

// 4. Manual refresh interval
useEffect(() => {
  fetchData();
  const interval = setInterval(fetchData, 30000);
  return () => clearInterval(interval);
}, []);
```

**Other Components**:
```typescript
// Components read from Zustand store
const dashboard = useAnalyticsDashboard(); // ✅ Works
const metrics = useAnalyticsMetrics(); // ✅ Works
```

---

## Converted Architecture (Hybrid Approach)

### How It Should Work

**React Query** handles:
- ✅ Fetching data from API
- ✅ Caching (staleTime, gcTime)
- ✅ Auto-refresh (refetchInterval)
- ✅ Request deduplication
- ✅ Background refetching

**Zustand Store** handles:
- ✅ Client state (UI preferences, tracking settings)
- ✅ Event tracking (`trackEvent`, `trackPageView`)
- ✅ State that needs to persist across components
- ✅ State that multiple components need to share

**Integration Pattern**:
```typescript
// React Query fetches → Updates Zustand → Components read from Zustand
```

---

## Converted Implementation

### Step 1: Add React Query Hook

**File: `web/lib/hooks/useApi.ts`**

```typescript
// Add to queryKeys
export const queryKeys = {
  // ... existing keys
  analyticsGeneral: ['analytics', 'general'] as const,
};

// Add new hook
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
      staleTime: 30000, // 30 seconds
      gcTime: 5 * 60 * 1000, // 5 minutes
      refetchInterval: 30000, // Auto-refresh every 30s
    },
    options as any
  ) as UseQueryOptions<any>;

  return useQuery(queryOptions);
}
```

### Step 2: Update AnalyticsPanel (Hybrid Approach)

**File: `web/features/admin/components/AnalyticsPanel.tsx`**

```typescript
import { useAnalyticsGeneral } from '@/lib/hooks/useApi';
import {
  useAnalyticsActions,
  useAnalyticsDashboard,
  useAnalyticsError,
  useAnalyticsLoading,
  useAnalyticsMetrics,
} from '@/lib/stores/analyticsStore';

export default function AnalyticsPanel({ refreshInterval = 30000 }: AnalyticsPanelProps) {
  const [selectedMetric, setSelectedMetric] = useState<'users' | 'polls' | 'votes' | 'performance'>('users');

  // ✅ STILL READ FROM ZUSTAND (components continue to work)
  const dashboard = useAnalyticsDashboard();
  const performanceMetrics = useAnalyticsMetrics();
  const storeLoading = useAnalyticsLoading();
  const storeError = useAnalyticsError();
  const {
    setDashboard,
    setPerformanceMetrics,
    updateUserBehavior,
    setLoading,
    setError,
    clearError,
  } = useAnalyticsActions();

  // ✅ NEW: Use React Query for fetching
  const { 
    data, 
    isLoading: queryLoading, 
    error: queryError,
    refetch: refetchData 
  } = useAnalyticsGeneral({
    refetchInterval: refreshInterval,
  });

  // ✅ SYNC: Update Zustand store when React Query data changes
  useEffect(() => {
    if (data) {
      if (data.dashboard) {
        setDashboard(data.dashboard); // Update Zustand
      }
      if (data.performanceMetrics) {
        setPerformanceMetrics(data.performanceMetrics); // Update Zustand
      }
      if (data.userBehavior) {
        updateUserBehavior(data.userBehavior); // Update Zustand
      }
    }
  }, [data, setDashboard, setPerformanceMetrics, updateUserBehavior]);

  // ✅ SYNC: Update Zustand loading state
  useEffect(() => {
    setLoading(queryLoading);
  }, [queryLoading, setLoading]);

  // ✅ SYNC: Update Zustand error state
  useEffect(() => {
    if (queryError) {
      setError(queryError instanceof Error ? queryError.message : 'Failed to load analytics');
    } else {
      clearError();
    }
  }, [queryError, setError, clearError]);

  // ✅ Manual refresh still works (now uses React Query)
  const handleRefresh = useCallback(() => {
    void refetchData();
  }, [refetchData]);

  // Rest of component unchanged - still reads from Zustand!
  if (storeLoading) {
    return <LoadingSkeleton />;
  }

  if (storeError) {
    return (
      <ErrorCard 
        error={storeError}
        onRetry={handleRefresh} // Uses React Query refetch
      />
    );
  }

  // ✅ Component still uses Zustand selectors
  return (
    <div>
      <Dashboard data={dashboard} /> {/* From Zustand */}
      <Metrics data={performanceMetrics} /> {/* From Zustand */}
    </div>
  );
}
```

---

## Why This Works

### ✅ Zustand Store Remains Intact

**All existing components continue to work:**
```typescript
// ✅ Still works - reads from Zustand
const dashboard = useAnalyticsDashboard();
const metrics = useAnalyticsMetrics();
const loading = useAnalyticsLoading();
const error = useAnalyticsError();

// ✅ Still works - uses Zustand actions
const { trackEvent, trackPageView } = useAnalyticsActions();
```

### ✅ React Query Adds Benefits

**Without breaking anything:**
- ✅ Automatic caching (reduces API calls)
- ✅ Request deduplication (multiple components share one request)
- ✅ Background refetching (when window regains focus)
- ✅ Automatic retries (with exponential backoff)
- ✅ Less boilerplate (no manual `setInterval`)

### ✅ Best of Both Worlds

**React Query** = Server state (fetching, caching, refetching)
**Zustand** = Client state (UI preferences, event tracking, shared state)

---

## Migration Checklist

1. ✅ Add React Query hook to `useApi.ts`
2. ✅ Update `AnalyticsPanel` to use React Query for fetching
3. ✅ Sync React Query data → Zustand store (in `useEffect`)
4. ✅ Sync React Query loading/error → Zustand store
5. ✅ Keep all Zustand selectors unchanged
6. ✅ Test that existing components still work
7. ✅ Test that caching works correctly
8. ✅ Test that auto-refresh works correctly

---

## Example: Complete Conversion

### Before (Manual Fetch)

```typescript
// ❌ Manual fetch + Zustand
const fetchData = useCallback(async () => {
  setLoading(true);
  const response = await fetch('/api/analytics');
  const data = await response.json();
  setDashboard(data.dashboard);
  setLoading(false);
}, []);

useEffect(() => {
  fetchData();
  const interval = setInterval(fetchData, 30000);
  return () => clearInterval(interval);
}, []);
```

### After (React Query + Zustand)

```typescript
// ✅ React Query fetches + Zustand stores
const { data, isLoading } = useAnalyticsGeneral({
  refetchInterval: 30000,
});

useEffect(() => {
  if (data?.dashboard) {
    setDashboard(data.dashboard); // Sync to Zustand
  }
}, [data, setDashboard]);

useEffect(() => {
  setLoading(isLoading); // Sync to Zustand
}, [isLoading, setLoading]);

// Components still read from Zustand
const dashboard = useAnalyticsDashboard(); // ✅ Works!
```

---

## Summary

**✅ Zustand Store is NOT broken:**
- All selectors continue to work
- All actions continue to work
- Components don't need to change

**✅ React Query adds benefits:**
- Automatic caching
- Request deduplication
- Background refetching
- Less boilerplate

**✅ Hybrid approach:**
- React Query = Server state (fetching)
- Zustand = Client state (UI, tracking, preferences)
- Sync React Query → Zustand in `useEffect`

**This is a common pattern** - React Query for server state, Zustand for client state!

