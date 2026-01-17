# State Management Architecture Decision

## Current Approach: React Query + Zustand Hybrid

### ✅ This IS the Right Choice

**Industry Standard Pattern:**
- React Query (TanStack Query) = Server State (API data, caching, refetching)
- Zustand = Client State (UI preferences, event tracking, local state)

**Why This Works:**
1. **Each tool does what it's best at**
   - React Query: Fetching, caching, background refetching, request deduplication
   - Zustand: Event tracking, UI preferences, shared client state

2. **Recommended by both libraries**
   - React Query docs: "Use React Query for server state, Zustand/Redux for client state"
   - Zustand docs: "Use Zustand for client state, React Query for server state"

3. **Common pattern in modern apps**
   - Used by companies like Vercel, Linear, GitHub
   - Best practice in React community

---

## Alternative Approaches (Why They're Not Better)

### ❌ Option 1: Pure React Query (Remove Zustand)

**What it would look like:**
```typescript
// Everything in React Query
const { data: dashboard } = useQuery(['analytics']);
const { data: events } = useQuery(['events']);
// No Zustand at all
```

**Problems:**
- ❌ Lose event tracking capabilities (Zustand handles this well)
- ❌ Lose UI preferences (theme, filters, etc.)
- ❌ Lose shared client state across components
- ❌ React Query isn't designed for event tracking

**Verdict:** Not better - we'd lose important functionality

---

### ❌ Option 2: Pure Zustand (Remove React Query)

**What it would look like:**
```typescript
// Everything in Zustand
const { dashboard, fetchDashboard } = useAnalyticsStore();
// Manual caching, manual refetching, manual deduplication
```

**Problems:**
- ❌ Manual caching is complex and error-prone
- ❌ No automatic request deduplication
- ❌ No background refetching
- ❌ More boilerplate code
- ❌ Harder to handle loading/error states

**Verdict:** Not better - React Query handles server state much better

---

### ✅ Option 3: Hybrid (Current Approach)

**What it looks like:**
```typescript
// React Query for server state
const { data } = useQuery(['analytics'], fetchAnalytics);

// Zustand for client state
const { trackEvent, preferences } = useAnalyticsStore();

// Sync React Query → Zustand where needed
useEffect(() => {
  if (data) setDashboard(data.dashboard);
}, [data]);
```

**Benefits:**
- ✅ React Query handles fetching/caching automatically
- ✅ Zustand handles event tracking and preferences
- ✅ Each tool does what it's best at
- ✅ Industry standard pattern

**Verdict:** ✅ This is the right choice

---

## What Zustand is Used For (Should Stay in Zustand)

### 1. Event Tracking
```typescript
const { trackEvent, trackPageView, trackUserAction } = useAnalyticsActions();
// ✅ Zustand is perfect for this - not server state
```

### 2. UI Preferences
```typescript
const { preferences, setPreferences } = useAnalyticsStore();
// ✅ Client state - should stay in Zustand
```

### 3. Session Management
```typescript
const { sessionId, setSessionId } = useAnalyticsStore();
// ✅ Client state - should stay in Zustand
```

### 4. Shared Client State
```typescript
const { selectedMetric, setSelectedMetric } = useAnalyticsStore();
// ✅ UI state - should stay in Zustand
```

---

## What Should Use React Query (Server State)

### 1. API Data Fetching
```typescript
// ✅ React Query for fetching
const { data: dashboard } = useQuery(['analytics'], fetchAnalytics);
```

### 2. Caching
```typescript
// ✅ React Query handles caching automatically
useQuery({
  queryKey: ['analytics'],
  queryFn: fetchAnalytics,
  staleTime: 30000, // Automatic caching
});
```

### 3. Auto-refresh
```typescript
// ✅ React Query handles auto-refresh
useQuery({
  queryKey: ['analytics'],
  queryFn: fetchAnalytics,
  refetchInterval: 30000, // Automatic refresh
});
```

---

## Implementation Strategy

### Phase 1: Analytics Hooks (Current)
- ✅ Convert `useAnalytics` to use React Query
- ✅ Convert `AnalyticsPanel` to use React Query
- ✅ Keep Zustand for event tracking and preferences
- ✅ Sync React Query → Zustand where needed

### Phase 2: Other Manual Fetch Patterns
- ✅ Convert other `fetch()` + `useState` patterns to React Query
- ✅ Keep Zustand for client state (preferences, UI state)
- ✅ Maintain hybrid pattern throughout

### Phase 3: Optimization
- ✅ Review all React Query hooks for proper `staleTime`/`gcTime`
- ✅ Ensure all search inputs are debounced
- ✅ Verify Zustand stores are only used for client state

---

## Summary

**✅ Current Approach (React Query + Zustand Hybrid) is Correct:**
- Industry standard pattern
- Recommended by both libraries
- Each tool does what it's best at
- No substantially better alternative exists

**✅ Implementation Plan:**
1. Convert analytics hooks to React Query
2. Keep Zustand for event tracking and preferences
3. Sync React Query → Zustand where needed
4. Apply pattern to other manual fetch patterns

**✅ This is the right choice - proceed with implementation!**

## Ownership & Update Cadence

- **Owner:** Core maintainer
- **Update cadence:** Review on major feature changes and at least monthly
- **Last verified:** TBD

