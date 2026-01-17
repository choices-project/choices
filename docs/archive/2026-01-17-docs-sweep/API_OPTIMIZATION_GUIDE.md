# API Optimization Guide - Best Practices

## Date: January 9, 2026

## Overview

This guide explains when and how to apply the optimizations we implemented for admin features to other parts of the codebase.

---

## 🎯 Core Principles

### 1. **React Query Caching** (staleTime & gcTime)
**When to apply:** ALWAYS for React Query hooks that fetch data

**Why:** Without `staleTime` and `gcTime`, React Query refetches data on every component mount, even if the data is still fresh. This causes unnecessary API calls.

**Pattern:**
```typescript
const query = useQuery({
  queryKey: ['my-data'],
  queryFn: fetchMyData,
  staleTime: 30000, // Data is fresh for 30 seconds
  gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  refetchInterval: 30000, // Optional: auto-refresh every 30s
});
```

**Guidelines:**
- **Fast-changing data** (notifications, metrics): `staleTime: 30000` (30s), `gcTime: 5 * 60 * 1000` (5min)
- **Moderate data** (user profiles, polls): `staleTime: 60000` (1min), `gcTime: 10 * 60 * 1000` (10min)
- **Slow-changing data** (settings, config): `staleTime: 5 * 60 * 1000` (5min), `gcTime: 30 * 60 * 1000` (30min)

### 2. **Search Input Debouncing**
**When to apply:** ANY search input that triggers API calls on every keystroke

**Why:** Without debouncing, typing "hello" triggers 5 API calls (h, he, hel, hell, hello). With 500ms debounce, it triggers only 1 call after you stop typing.

**Pattern:**
```typescript
import { useDebounce } from '@/hooks/useDebounce';

function MySearchComponent() {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Debounce search term (500ms delay)
  const debouncedSearch = useDebounce(searchTerm, 500);
  
  // Use debouncedSearch in API calls, not searchTerm
  useEffect(() => {
    if (debouncedSearch) {
      fetchResults(debouncedSearch);
    }
  }, [debouncedSearch]);
  
  return (
    <input
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      // User sees immediate feedback, but API call is debounced
    />
  );
}
```

**Guidelines:**
- **Search inputs**: 300-500ms debounce
- **Filter inputs**: Usually no debounce needed (user selects from dropdown)
- **Auto-complete**: 200-300ms debounce (faster for better UX)

---

## 📋 Features That Need Optimization

### ✅ Already Optimized
- **Admin features** (`web/features/admin/lib/hooks.ts`)
  - ✅ All React Query hooks have `staleTime` and `gcTime`
  - ✅ Feedback search has debouncing

### ⚠️ Needs Review

#### 1. **Analytics Hook** (`web/hooks/useAnalytics.ts`)
**Current:** Uses manual `fetch` with `useState`
**Should:** Convert to React Query with caching

```typescript
// ❌ CURRENT (manual fetch)
const [data, setData] = useState(null);
const fetchData = useCallback(async () => {
  const response = await fetch('/api/analytics');
  setData(await response.json());
}, []);

// ✅ BETTER (React Query)
const { data, isLoading } = useQuery({
  queryKey: ['analytics', filters],
  queryFn: () => fetch('/api/analytics').then(r => r.json()),
  staleTime: 60000, // 1 minute
  gcTime: 10 * 60 * 1000, // 10 minutes
});
```

#### 2. **Hashtag Search** (`web/features/hashtags/hooks/useHashtags.ts`)
**Current:** May not have debouncing
**Should:** Check if search input triggers API calls - if yes, add debouncing

#### 3. **Representative Search** (`web/components/search/EnhancedSearch.tsx`)
**Current:** Uses button click (good!)
**Status:** ✅ No changes needed - user clicks "Search" button, doesn't auto-search

#### 4. **Feed Search** (`web/lib/stores/feedsStore.ts`)
**Current:** Has `/api/feeds/search` endpoint
**Should:** Check if search triggers on every keystroke - if yes, add debouncing

#### 5. **Voting Search** (`web/lib/stores/votingStore.ts`)
**Current:** Has `/api/voting/search` endpoint
**Should:** Check if search triggers on every keystroke - if yes, add debouncing

---

## 🔍 How to Identify What Needs Optimization

### Step 1: Find React Query Hooks
```bash
grep -r "useQuery(" web/features --include="*.ts" --include="*.tsx"
```

**Check each one:**
- Does it have `staleTime`? ❌ → Add it
- Does it have `gcTime`? ❌ → Add it

### Step 2: Find Search Inputs
```bash
grep -r "onChange.*fetch\|input.*search" web --include="*.tsx"
```

**Check each one:**
- Does it call API on every keystroke? ❌ → Add debouncing
- Does it use a button click? ✅ → No changes needed

### Step 3: Find Manual Fetch Calls
```bash
grep -r "fetch.*useState\|fetch.*useEffect" web/features --include="*.ts" --include="*.tsx"
```

**Check each one:**
- Could this use React Query instead? ✅ → Convert it
- Is it a one-time fetch on mount? ✅ → Keep as-is (or convert to React Query)

---

## 📝 Implementation Checklist

When creating a new feature or reviewing existing code:

- [ ] **React Query hooks** have `staleTime` and `gcTime`
- [ ] **Search inputs** that trigger API calls are debounced (300-500ms)
- [ ] **Filter inputs** (dropdowns) don't need debouncing
- [ ] **Manual fetch** calls are converted to React Query when appropriate
- [ ] **Error handling** is implemented for all API calls
- [ ] **Loading states** are shown during data fetching

---

## 🎓 Examples

### Example 1: Converting Manual Fetch to React Query

**Before:**
```typescript
function MyComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    setLoading(true);
    fetch('/api/data')
      .then(r => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);
  
  if (loading) return <Loading />;
  return <div>{data?.name}</div>;
}
```

**After:**
```typescript
function MyComponent() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-data'],
    queryFn: () => fetch('/api/data').then(r => r.json()),
    staleTime: 60000,
    gcTime: 10 * 60 * 1000,
  });
  
  if (isLoading) return <Loading />;
  return <div>{data?.name}</div>;
}
```

**Benefits:**
- Automatic caching
- Automatic refetching on window focus
- Built-in error handling
- Less boilerplate code

### Example 2: Adding Debouncing to Search

**Before:**
```typescript
function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  
  useEffect(() => {
    if (query) {
      fetch(`/api/search?q=${query}`)
        .then(r => r.json())
        .then(setResults);
    }
  }, [query]); // ❌ Triggers on every keystroke!
  
  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

**After:**
```typescript
import { useDebounce } from '@/hooks/useDebounce';

function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const debouncedQuery = useDebounce(query, 500); // ✅ Debounced!
  
  useEffect(() => {
    if (debouncedQuery) {
      fetch(`/api/search?q=${debouncedQuery}`)
        .then(r => r.json())
        .then(setResults);
    }
  }, [debouncedQuery]); // ✅ Only triggers after 500ms of no typing
  
  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

---

## 🚀 Quick Reference

### React Query Caching Values

| Data Type | staleTime | gcTime | Example |
|-----------|-----------|--------|---------|
| Real-time metrics | 30s | 5min | Dashboard stats, notifications |
| User data | 1min | 10min | Profile, preferences |
| Content | 5min | 30min | Polls, articles (if not frequently updated) |
| Settings | 5min | 30min | App settings, feature flags |

### Debounce Delays

| Use Case | Delay | Example |
|----------|-------|---------|
| Search input | 500ms | User search, feedback search |
| Auto-complete | 200-300ms | Address lookup, tag suggestions |
| Filter changes | No debounce | Dropdown selections (instant) |

---

## 📚 Related Documentation

- [Implementation Cheatsheet](../../../scratch/IMPLEMENTATION_CHEATSHEET.md) - General patterns
- [React Query Docs](https://tanstack.com/query/latest) - Official documentation

---

## ✅ Summary

**Always apply these optimizations:**
1. ✅ Add `staleTime` and `gcTime` to ALL React Query hooks
2. ✅ Add debouncing to ALL search inputs that trigger API calls
3. ✅ Convert manual `fetch` + `useState` to React Query when appropriate

**These patterns improve:**
- Performance (fewer API calls)
- User experience (faster responses, less loading)
- Server load (reduced requests)
- Code maintainability (less boilerplate)

