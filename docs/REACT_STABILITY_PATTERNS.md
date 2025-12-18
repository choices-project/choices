# React Stability Patterns: Preventing Infinite Re-render Loops

## The Problem

React Error #185 ("Maximum update depth exceeded") occurs when components re-render infinitely. In this codebase, the root cause has consistently been **unstable callback/function references** in hooks and components.

## Root Cause Analysis

When a function is created inside a component or hook, it gets a new identity on every render. If that function is:
1. Used in a `useEffect` dependency array
2. Passed as a prop to a child component
3. Used in another `useCallback`'s dependency array

...it can trigger cascading re-renders that become infinite loops.

### Common Culprits

1. **Translation functions (`t` from `useTranslations`)** - `next-intl`'s `useTranslations()` may return a new function reference on each render
2. **Store action selectors** - Zustand selectors like `useStore(state => state.someAction)` 
3. **Custom hook return values** - Hooks that return objects/functions without memoization
4. **Callbacks with changing dependencies** - `useCallback` with deps that change frequently

## The Solution: Refs Pattern

Use `useRef` to hold the latest value of any dependency that would otherwise cause instability:

```typescript
// ❌ BAD: t changes every render, causing handleError to change
const handleError = useCallback((msg: string) => {
  showNotification(t('error.title'), msg);
}, [t, showNotification]);

// ✅ GOOD: Use refs for stable callback identity
const tRef = useRef(t);
useEffect(() => { tRef.current = t; }, [t]);

const showNotificationRef = useRef(showNotification);
useEffect(() => { showNotificationRef.current = showNotification; }, [showNotification]);

const handleError = useCallback((msg: string) => {
  showNotificationRef.current(tRef.current('error.title'), msg);
}, []); // Empty deps = stable identity
```

## Patterns Applied in This Codebase

### 1. `useI18n` Hook (`web/hooks/useI18n.ts`)

```typescript
const rawTranslateRef = useRef(rawTranslate);
useEffect(() => { rawTranslateRef.current = rawTranslate; }, [rawTranslate]);

const t = useCallback((key: string, params?: TranslationParams): string => {
  return rawTranslateRef.current(key, params);
}, []); // Empty deps - t is now stable
```

### 2. `useFeedAnalytics` Hook (`web/features/feeds/hooks/useFeedAnalytics.ts`)

```typescript
const feedIdRef = useRef(feedId);
const userIdRef = useRef(userId);
useEffect(() => { feedIdRef.current = feedId; }, [feedId]);
useEffect(() => { userIdRef.current = userId; }, [userId]);

const trackItemShare = useCallback((itemId: string) => {
  trackEventRef.current({
    feedId: feedIdRef.current,
    userId: userIdRef.current,
    // ...
  });
}, []); // Empty deps - stable callback
```

### 3. `FeedDataProvider` Component (`web/features/feeds/components/providers/FeedDataProvider.tsx`)

```typescript
// Refs for all store actions
const likeFeedActionRef = useRef(likeFeedAction);
useEffect(() => { likeFeedActionRef.current = likeFeedAction; }, [likeFeedAction]);

const clearErrorActionRef = useRef(clearErrorAction);
useEffect(() => { clearErrorActionRef.current = clearErrorAction; }, [clearErrorAction]);

// Handler with stable identity
const handleLike = useCallback(async (itemId: string) => {
  clearErrorActionRef.current();
  await likeFeedActionRef.current(itemId);
}, []); // Empty deps
```

### 4. `useSystemThemeSync` Hook (`web/hooks/useSystemThemeSync.ts`)

```typescript
const updateSystemThemeRef = useRef(updateSystemTheme);
useEffect(() => { updateSystemThemeRef.current = updateSystemTheme; }, [updateSystemTheme]);

useEffect(() => {
  updateSystemThemeRef.current(systemTheme);
}, [systemPrefersDark]); // Only depend on the value, not the callback
```

### 5. `usePollCreatedListener` Hook (`web/features/polls/hooks/usePollCreatedListener.ts`)

```typescript
const addNotificationRef = useRef(addNotification);
useEffect(() => { addNotificationRef.current = addNotification; }, [addNotification]);

const routerRef = useRef(router);
useEffect(() => { routerRef.current = router; }, [router]);

const handlePollCreated = useCallback((event: Event) => {
  addNotificationRef.current({ /* ... */ });
  routerRef.current.push(`/polls/${id}`);
}, []); // Empty deps
```

## Checklist for New Hooks/Components

When creating hooks or components that use callbacks:

- [ ] Does any `useCallback` depend on `t` (translation function)? → Use `tRef`
- [ ] Does any `useCallback` depend on store actions? → Use refs for each action
- [ ] Does any `useCallback` depend on `router`? → Use `routerRef`
- [ ] Does any `useCallback` depend on notification functions? → Use refs
- [ ] Does the hook return functions that consumers might use in effects? → Ensure stable identity
- [ ] Are objects being created inline in hooks? → Wrap in `useMemo`

## Debugging Infinite Loops

1. **Check console for React Error #185** - This confirms an infinite loop
2. **Look at the stack trace** - Find which component is re-rendering
3. **Check `useEffect` dependencies** - Are any callbacks in the deps array?
4. **Check `useCallback` dependencies** - Are any deps changing every render?
5. **Use React DevTools Profiler** - See which components re-render and why

## ESLint Considerations

When using this pattern, you may need to disable the `react-hooks/exhaustive-deps` rule:

```typescript
// eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // Intentionally empty - using refs for stability
```

This is acceptable when:
- You're using refs that are kept in sync with `useEffect`
- The callback intentionally reads from refs at call time, not capture time

## Files Modified During This Fix Session

- `web/hooks/useI18n.ts` - Stabilized `t` function
- `web/hooks/useSystemThemeSync.ts` - Stabilized theme update callbacks
- `web/features/feeds/hooks/useFeedAnalytics.ts` - Stabilized all tracking callbacks
- `web/features/feeds/components/providers/FeedDataProvider.tsx` - Stabilized all handlers in **BOTH** providers (HarnessFeedDataProvider AND StandardFeedDataProvider)
- `web/features/polls/hooks/usePollCreatedListener.ts` - Stabilized event handler
- `web/features/profile/hooks/useUserDistrict.ts` - Memoized return object
- `web/components/shared/AppShell.tsx` - Stabilized device initialization
- `web/lib/stores/hashtagStore.ts` - Made hashtag loading non-blocking (no error state)
- `web/app/providers.tsx` - Added i18n fallback to prevent crashes on missing translations

## Critical Gotcha: Multiple Code Paths

**IMPORTANT**: Some components have multiple implementations or providers for different environments:

```typescript
// FeedDataProvider.tsx has TWO providers!
const IS_E2E_HARNESS = process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1';

function HarnessFeedDataProvider(...) { /* E2E testing */ }
function StandardFeedDataProvider(...) { /* Production */ }

export default function FeedDataProvider(props) {
  if (IS_E2E_HARNESS) {
    return <HarnessFeedDataProvider {...props} />;
  }
  return <StandardFeedDataProvider {...props} />;
}
```

When fixing stability issues, **check ALL code paths** - not just the one you think is being used.

## Related Issues

- Missing i18n keys can cause crashes → Added `getMessageFallback` to `NextIntlClientProvider`
- Store errors triggering re-renders → Made some store operations silent (log warnings instead)

---

*Last updated: December 18, 2025*
*Related commits: cf6a358f, da2ee76d, 02f7276c*

