# API Optimization Checklist

## Quick Reference for New Developers

### ✅ Always Do This

1. **React Query Hooks** - ALWAYS add `staleTime` and `gcTime`:
   ```typescript
   useQuery({
     queryKey: ['my-data'],
     queryFn: fetchData,
     staleTime: 30000,  // ← REQUIRED
     gcTime: 5 * 60 * 1000,  // ← REQUIRED
   })
   ```

2. **Search Inputs** - ALWAYS debounce if they trigger API calls:
   ```typescript
   const debouncedSearch = useDebounce(searchTerm, 500);
   // Use debouncedSearch in API calls, not searchTerm
   ```

3. **Manual Fetch** - Consider converting to React Query:
   ```typescript
   // ❌ Avoid: Manual fetch + useState
   const [data, setData] = useState(null);
   useEffect(() => {
     fetch('/api/data').then(r => r.json()).then(setData);
   }, []);
   
   // ✅ Prefer: React Query
   const { data } = useQuery({
     queryKey: ['my-data'],
     queryFn: () => fetch('/api/data').then(r => r.json()),
     staleTime: 60000,
     gcTime: 10 * 60 * 1000,
   });
   ```

### 📋 Current Status

#### ✅ Optimized
- Admin hooks (`web/features/admin/lib/hooks.ts`) - All have caching
- Feedback search (`web/app/(app)/admin/feedback/page.tsx`) - Has debouncing

#### ⚠️ Needs Review
- `web/lib/hooks/useApi.ts` - Some hooks have `staleTime`, but not all have `gcTime`
- `web/hooks/useAnalytics.ts` - Uses manual fetch, should convert to React Query
- Hashtag search - Check if needs debouncing
- Feed search - Check if needs debouncing
- Voting search - Check if needs debouncing

### 🎯 When to Apply

**Apply React Query caching:**
- ✅ Every `useQuery()` hook
- ✅ Data that doesn't change every second
- ✅ User data, profiles, settings

**Apply debouncing:**
- ✅ Search inputs that trigger API calls
- ✅ Auto-complete inputs
- ❌ Dropdown filters (no debounce needed)
- ❌ Button-triggered searches (no debounce needed)

**Convert to React Query:**
- ✅ Manual `fetch()` + `useState` patterns
- ✅ Components with loading/error state management
- ❌ One-time fetches on mount (optional, but recommended)

### 📚 Documentation
- [Full Guide](./API_OPTIMIZATION_GUIDE.md) - Detailed explanation
- [Implementation Cheatsheet](../../../scratch/IMPLEMENTATION_CHEATSHEET.md) - General patterns

