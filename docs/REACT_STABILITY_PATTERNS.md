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

## Critical Anti-Pattern: Passing Entire Store Through Context

**NEVER** do this:

```typescript
// ❌ BAD: This causes infinite re-renders!
export function UserStoreProvider({ children }) {
  const userStore = useUserStore() // Returns entire state - changes on every update!
  
  return (
    <UserStoreContext.Provider value={userStore}>
      {children}
    </UserStoreContext.Provider>
  )
}
```

This is catastrophic because:
1. `useUserStore()` without a selector returns the entire state object
2. The state object reference changes on EVERY store update
3. Context value change triggers ALL consumers to re-render
4. Re-renders can trigger more state updates → infinite loop

**Solution**: Use Zustand stores directly with selectors, not through React context:

```typescript
// ✅ GOOD: Use selectors directly in components
const user = useUserStore(state => state.user)
const setUser = useUserStore(state => state.setUser)
```

## Next.js Router Instability

The `useRouter()` hook from `next/navigation` can return a new object reference on re-renders, causing useEffect dependencies to trigger unnecessarily.

```typescript
// ❌ BAD: router in deps can cause re-runs
const router = useRouter();
useEffect(() => {
  if (!profile) router.replace('/auth');
}, [profile, router]);

// ✅ GOOD: Use ref for router
const router = useRouter();
const routerRef = useRef(router);
useEffect(() => { routerRef.current = router; }, [router]);

useEffect(() => {
  if (!profile) routerRef.current.replace('/auth');
}, [profile]); // router removed from deps
```

## Files Fixed for Stability (December 18, 2025)

The following files were audited and fixed for infinite re-render issues:

### Core Infrastructure
- `contexts/AuthContext.tsx` - Stabilized all store action selectors with refs
- `lib/providers/UserStoreProvider.tsx` - Removed unstable context value
- `hooks/useI18n.ts` - Stabilized `t` function with ref
- `hooks/useSystemThemeSync.ts` - Stabilized `updateSystemTheme` with ref

### Feed Components
- `features/feeds/components/providers/FeedDataProvider.tsx` - Both Harness and Standard providers
- `features/feeds/hooks/useFeedAnalytics.ts` - Stabilized all tracking callbacks

### Dashboard & Profile
- `app/(app)/dashboard/page.tsx` - Router ref
- `features/dashboard/components/PersonalDashboard.tsx` - Router and action refs
- `app/(app)/profile/page.tsx` - Router ref
- `app/(app)/profile/edit/page.tsx` - Router ref  
- `app/(app)/profile/biometric-setup/page.tsx` - Router ref
- `features/profile/hooks/useUserDistrict.ts` - Memoized return object

### Other Components
- `app/(app)/candidate/dashboard/page.tsx` - Router ref
- `components/auth/DeviceFlowAuth.tsx` - Router and callback refs
- `components/shared/AppShell.tsx` - Device initialization ref
- `features/polls/hooks/usePollCreatedListener.ts` - Notification and router refs

### E2E Harnesses
- `app/(app)/e2e/dashboard-journey/page.tsx` - Notification action refs
- `app/(app)/e2e/auth-access/page.tsx` - Biometric action refs

### Store Hooks
- `lib/stores/feedsStore.ts` - `useFeedsPagination` memoized return value

### General Hooks
- `hooks/useAuth.ts` - Memoized return value
- `hooks/useSocialSharing.ts` - Memoized return value
- `hooks/useI18n.ts` - Memoized return value (used in 72+ places!)
- `hooks/useFollowRepresentative.ts` - Memoized return value

---

## Production Issues: Hydration, Error Handling, and Resilience

This section documents patterns for fixing production issues discovered during deployment, focusing on root causes rather than workarounds.

### 1. React Hydration Mismatches (Error #185)

**Problem**: React error #185 occurs when server-rendered HTML doesn't match client-rendered HTML, causing the entire page to crash with "Something went wrong".

**Root Cause**: Components using client-only APIs (like `Intl.NumberFormat`, `localStorage`, browser APIs) during SSR, or components that render differently on server vs client.

**❌ BAD: Suppressing Warnings**
```typescript
// This is a workaround, not a fix
<div suppressHydrationWarning>
  {typeof window !== 'undefined' ? clientValue : serverValue}
</div>
```

**✅ GOOD: Client-Only Rendering with `dynamic()`**
```typescript
// app/(app)/polls/page.tsx
'use client';

import dynamic from 'next/dynamic';

// Client-only component - never renders on server
function PollsPageContent() {
  // Component logic here
  // Can safely use client-only APIs
}

// Export as dynamically imported client-only component
// Using dynamic() with ssr: false prevents server-side rendering entirely
// This is the proper way to handle client-only content - no suppressHydrationWarning needed
// The component will only render on the client, eliminating hydration mismatches at the source
export default dynamic(() => Promise.resolve(PollsPageContent), {
  ssr: false,
  loading: () => (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    </div>
  ),
});
```

**When to Use**:
- Components that use browser-only APIs (`localStorage`, `window`, `navigator`)
- Components using `Intl` formatters that may differ between server/client
- Components with complex client-side state that can't be serialized
- Components that depend on Zustand store hydration from localStorage

**Alternative: `isMounted` Pattern for Partial Client-Only Logic**

If you can't make the entire component client-only, use `isMounted` to gate client-only APIs:

```typescript
// features/polls/components/PollFiltersPanel.tsx
const [isMounted, setIsMounted] = React.useState(false);

React.useEffect(() => {
  setIsMounted(true);
}, []);

// Only use formatters after mount to prevent hydration mismatches
const numberFormatter = useMemo(() => {
  if (!isMounted) return null;
  return new Intl.NumberFormat(currentLanguage ?? undefined);
}, [isMounted, currentLanguage]);

const formattedTrendingCount = isMounted && numberFormatter
  ? numberFormatter.format(trendingCount)
  : String(trendingCount); // Fallback for SSR
```

**Key Principle**: Fix hydration mismatches at the source by ensuring server and client render the same initial content, or by making the component entirely client-only.

### 2. API Error Handling: Graceful Degradation

**Problem**: API endpoints returning 500 errors crash entire pages, even when the feature is non-critical.

**Root Cause**: Missing error handling or throwing errors instead of returning empty states.

**❌ BAD: Throwing Errors**
```typescript
// app/api/representatives/my/route.ts
const { data, error } = await supabase.from('representative_follows').select('*');

if (error) {
  return errorResponse('Failed to fetch', 500); // Crashes the page!
}
```

**✅ GOOD: Graceful Degradation**
```typescript
// app/api/representatives/my/route.ts
try {
  const { data: followed, error: followedError } = await supabase
    .from('representative_follows')
    .select('*')
    .eq('user_id', user.id);

  if (followedError) {
    logger.error('Error fetching followed representatives:', followedError);
    // If table doesn't exist, RLS issue, or any error, return empty array instead of 500
    // This allows pages to load even if representatives feature isn't fully set up
    if (
      followedError.code === '42P01' || // Table doesn't exist
      followedError.code === 'PGRST116' || // RLS issue
      followedError.message?.includes('permission denied')
    ) {
      logger.warn('Representatives table not accessible, returning empty list');
      return successResponse({
        representatives: [],
        total: 0,
        limit,
        offset,
        hasMore: false
      });
    }
    return errorResponse('Failed to fetch followed representatives', 500);
  }

  // ... process data
} catch (error) {
  // Catch any unexpected errors and return empty array instead of 500
  // This ensures pages can still load even if there's an unexpected error
  logger.error('Unexpected error in /api/representatives/my:', error);
  return successResponse({
    representatives: [],
    total: 0,
    limit,
    offset,
    hasMore: false
  });
}
```

**Store-Level Error Handling**:

```typescript
// lib/stores/representativeStore.ts
getUserRepresentatives: async () => {
  setLoading(true);
  clearError();

  try {
    const response = await fetch('/api/representatives/my');

    if (!response.ok) {
      if (response.status === 401) {
        // Clear state for unauthorized users
        setState((state) => {
          state.userRepresentativeEntries = [];
          state.userRepresentatives = [];
          state.followedRepresentatives = [];
          state.userRepresentativesTotal = 0;
          state.userRepresentativesHasMore = false;
          state.error = 'Please sign in to view your followed representatives';
        });
        return [];
      }
      throw new Error('Failed to fetch user representatives');
    }

    // ... process data
  } catch (error) {
    logger.warn('RepresentativeStore.getUserRepresentatives error (non-critical):', error);
    // Don't set error state for API failures - allow pages to render without representatives
    // Only set error for critical issues
    if (error instanceof Error && !error.message.includes('Failed to fetch')) {
      setError(error.message);
    }
    setState((state) => {
      state.userRepresentativeEntries = [];
      state.userRepresentatives = [];
      state.followedRepresentatives = [];
      state.userRepresentativesTotal = 0;
      state.userRepresentativesHasMore = false;
    });
    return [];
  } finally {
    setLoading(false);
  }
},
```

**Component-Level Error Handling**:

```typescript
// features/dashboard/components/PersonalDashboard.tsx
const refreshDashboard = async () => {
  await Promise.all([
    refetchProfile(),
    loadPolls(),
    getTrendingHashtags(undefined, 6),
    getUserRepresentatives().catch((error) => {
      // Log warning but don't crash the dashboard
      logger.warn('Failed to refresh user representatives (non-critical):', error);
    }),
  ]);
};
```

**Key Principle**: Non-critical features should fail gracefully, allowing the rest of the page to load. Return empty arrays/objects instead of throwing errors.

### 3. Service Worker: Filtering Non-Cacheable URL Schemes

**Problem**: Service worker throws `TypeError: Failed to execute 'put' on 'Cache': Request scheme 'chrome-extension' is unsupported` when trying to cache browser extension resources.

**Root Cause**: Service worker attempting to cache URLs with unsupported schemes (`chrome-extension://`, `moz-extension://`, etc.).

**❌ BAD: Caching All URLs**
```javascript
// public/service-worker.js
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response && response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone()); // ❌ Fails for chrome-extension://
  }
  return response;
}
```

**✅ GOOD: Filtering Cacheable Schemes**
```javascript
// public/service-worker.js
// Check if a URL scheme is cacheable (exclude chrome-extension://, moz-extension://, etc.)
function isCacheableScheme(url) {
  try {
    const urlObj = new URL(url);
    // Only cache http/https URLs - exclude extension schemes and other non-cacheable schemes
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

async function cacheFirst(request, cacheName) {
  // Skip caching for non-cacheable URL schemes (e.g., chrome-extension://)
  if (!isCacheableScheme(request.url)) {
    try {
      return await fetch(request);
    } catch (error) {
      console.warn('[SW] Failed to fetch non-cacheable URL', request.url, error);
      return new Response('Resource not available', { status: 503 });
    }
  }

  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      // Only cache if the URL scheme is cacheable
      if (isCacheableScheme(request.url)) {
        cache.put(request, response.clone());
      }
    }
    return response;
  } catch (error) {
    console.error('[SW] cacheFirst failed', error);
    if (isPageRequest(request)) {
      return offlineResponse(request);
    }
    return new Response('Offline', { status: 503 });
  }
}
```

**Key Principle**: Always validate URL schemes before attempting to cache. Only cache `http://` and `https://` URLs.

### 4. Content Security Policy: Environment-Aware Configuration

**Problem**: CSP blocks development/preview tools (like Vercel feedback widget) in production, or allows them in production when they shouldn't be.

**Root Cause**: Static CSP configuration that doesn't account for different environments.

**❌ BAD: Static CSP**
```javascript
// next.config.js
'script-src': [
  "'self'",
  'https://vercel.live', // ❌ Always allowed, even in production
],
```

**✅ GOOD: Environment-Aware CSP**
```javascript
// next.config.js
async headers() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isReportOnly = process.env.CSP_REPORT_ONLY === 'true';
  // Check if we're in a Vercel preview environment (not production)
  const isVercelPreview = process.env.VERCEL_ENV === 'preview' || 
                          process.env.VERCEL_ENV === 'development';

  const cspDirectives = {
    production: {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        "'unsafe-inline'", // Required for Next.js
        "'unsafe-eval'", // Required for Next.js development
        // Only include vercel.live in preview/development environments, not production
        ...(isVercelPreview ? ['https://vercel.live'] : []),
        'https://vercel.com', // Vercel analytics (safe for production)
        'https://challenges.cloudflare.com', // Turnstile
      ],
      'connect-src': [
        "'self'",
        'https://*.supabase.co',
        ...(isVercelPreview ? ['https://vercel.live'] : []), // Conditionally include
        'https://vitals.vercel-insights.com',
      ],
      // ... other directives
    },
  };
  // ... rest of CSP configuration
}
```

**Key Principle**: Use environment variables to conditionally include development/preview tools in CSP. Never allow them in production.

### 5. Sign Out: Using `replace` Instead of `href`

**Problem**: After sign out, users can navigate back to authenticated pages using the browser back button.

**Root Cause**: Using `window.location.href` or `router.push()` which adds to browser history.

**❌ BAD: Adding to History**
```typescript
// contexts/AuthContext.tsx
const signOut = async () => {
  await supabase.auth.signOut();
  window.location.href = '/landing'; // ❌ Adds to history
  // or
  router.push('/landing'); // ❌ Also adds to history
};
```

**✅ GOOD: Replacing History Entry**
```typescript
// contexts/AuthContext.tsx
const signOut = async () => {
  try {
    // Clear local state first
    storeSignOut();
    initializeAuth(null, null, false);
    setSession(null);
    setUser(null);

    // Clear localStorage and sessionStorage
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
      window.sessionStorage.clear();
    }

    // Call logout API endpoint to properly clear cookies
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5_000);

    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        logger.warn('Logout API call failed, attempting direct signOut');
        const supabase = await getSupabaseBrowserClient();
        await supabase.auth.signOut().catch((err) => {
          logger.warn('Direct Supabase signOut also failed:', err);
        });
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      // Fallback to direct Supabase signOut
      if (fetchError instanceof Error && fetchError.name !== 'AbortError') {
        const supabase = await getSupabaseBrowserClient();
        await supabase.auth.signOut();
      }
    }

    // Always redirect, even if API calls fail
    // Use replace instead of href to prevent back button issues
    if (typeof window !== 'undefined') {
      window.location.replace('/landing'); // ✅ Replaces history entry
    }
  } catch (error) {
    logger.error('Failed to sign out:', error);
    // Still clear state and redirect even if logout fails
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.location.replace('/landing');
    }
  }
};
```

**Key Principle**: Use `window.location.replace()` for redirects after sign out to prevent users from navigating back to authenticated pages.

### 6. Error Boundaries: Catching React Errors

**Problem**: Unhandled React errors crash the entire application, showing a blank screen.

**Root Cause**: No error boundaries to catch errors in the component tree.

**✅ GOOD: Implementing Error Boundaries**
```typescript
// components/shared/ErrorBoundary.tsx
'use client';

import React, { Component, type ReactNode } from 'react';
import logger from '@/lib/utils/logger';

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('ErrorBoundary caught error:', { error, errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          className="flex items-center justify-center min-h-[400px] px-4"
          data-testid="error-boundary"
          role="alert"
        >
          <div className="text-center max-w-md">
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              aria-label="Reload page to retry"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Usage in Layout**:
```typescript
// app/(app)/layout.tsx
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <FontProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <UserStoreProvider>
            <ServiceWorkerProvider>
              <ErrorBoundary> {/* Wrap entire app */}
                <AppShell navigation={<GlobalNavigation />}>
                  {children}
                </AppShell>
              </ErrorBoundary>
            </ServiceWorkerProvider>
          </UserStoreProvider>
        </AuthProvider>
      </QueryClientProvider>
    </FontProvider>
  );
}
```

**Key Principle**: Wrap the entire application and individual pages with error boundaries to prevent a single error from crashing the entire app.

### 7. Loading Timeouts: Preventing Infinite Loading States

**Problem**: Pages show loading spinners indefinitely if API calls hang or fail silently.

**Root Cause**: No timeout mechanism for loading states.

**✅ GOOD: Implementing Loading Timeouts**
```typescript
// app/(app)/profile/page.tsx
const [loadingTimeout, setLoadingTimeout] = useState(false);

useEffect(() => {
  if (!(profileLoading && !profile && !profileError)) {
    setLoadingTimeout(false);
    return;
  }
  const timeout = setTimeout(() => {
    setLoadingTimeout(true);
  }, 15_000); // 15 second timeout
  return () => {
    clearTimeout(timeout);
  };
}, [profileLoading, profile, profileError]);

if ((profileLoading && !profile && !profileError) || loadingTimeout) {
  return (
    <ErrorBoundary>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">
            {loadingTimeout ? 'Loading is taking longer than expected...' : 'Loading profile...'}
          </p>
          {loadingTimeout && (
            <button
              onClick={() => {
                void refetch();
                setLoadingTimeout(false);
              }}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}
```

**Key Principle**: Always implement timeouts for loading states and provide users with a way to retry or reload.

### 8. API Request Timeouts: Preventing Hanging Requests

**Problem**: API requests can hang indefinitely, causing poor UX and resource leaks.

**Root Cause**: No timeout mechanism for fetch requests.

**✅ GOOD: Using AbortController with Timeout**
```typescript
// features/profile/lib/profile-service.ts
export async function getCurrentProfile(): Promise<ProfileActionResult> {
  // Add timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30_000); // 30 second timeout

  try {
    const response = await fetch('/api/profile', {
      signal: controller.signal,
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const apiData = await response.json();
    const profile = transformApiResponseToProfile(apiData);

    if (!profile) {
      return {
        success: false,
        error: 'Failed to load profile data',
      };
    }

    return {
      success: true,
      data: profile,
    };
  } catch (error) {
    clearTimeout(timeoutId); // Always clear timeout
    logger.error('Error fetching profile:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch profile',
    };
  }
}
```

**Alternative: Using AbortSignal.timeout() (Modern Browsers)**
```typescript
// Modern browsers support AbortSignal.timeout()
const response = await fetch('/api/profile', {
  signal: AbortSignal.timeout(30_000), // 30 second timeout
  method: 'GET',
  credentials: 'include',
});
```

**Key Principle**: Always implement timeouts for API requests to prevent hanging and provide better error handling.

### 9. Admin User Redirect Logic

**Problem**: Admin users are incorrectly redirected to onboarding when their profile isn't immediately available.

**Root Cause**: Aggressive redirect logic that doesn't account for admin users or loading states.

**✅ GOOD: Checking Admin Status Before Redirect**
```typescript
// app/(app)/dashboard/page.tsx
const [isCheckingAdmin, setIsCheckingAdmin] = useState(false);
const adminCheckRef = useRef<boolean>(false);

useEffect(() => {
  if (shouldBypassAuth) {
    return;
  }
  // First check if user is authenticated - if not, redirect to auth
  if (!isUserLoading && !isAuthenticated) {
    logger.debug('🚨 Dashboard: Unauthenticated user - redirecting to auth');
    routerRef.current.replace('/auth');
    return;
  }
  // If authenticated but no profile, check if user is admin first
  // Admin users should have profiles, but if profile is still loading or missing,
  // we should check admin status before redirecting to onboarding
  if (!isLoading && isAuthenticated && !profile && !isCheckingAdmin) {
    const checkAdminAndRedirect = async () => {
      if (adminCheckRef.current) {
        return; // Already checking
      }
      adminCheckRef.current = true;
      setIsCheckingAdmin(true);

      try {
        const response = await fetch('/api/admin/health?type=status', {
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          signal: AbortSignal.timeout(5_000), // 5 second timeout
        });

        if (response.ok) {
          // User is admin - allow access to dashboard (they can navigate to admin dashboard)
          logger.debug('🚨 Dashboard: No profile but user is admin - allowing dashboard access');
          setIsCheckingAdmin(false);
          adminCheckRef.current = false;
          return; // Don't redirect
        } else if (response.status === 401 || response.status === 403) {
          // Not admin or not authenticated - redirect to onboarding
          logger.debug('🚨 Dashboard: User is not admin (401/403) - redirecting to onboarding');
        }
      } catch (error) {
        // If admin check fails or times out, assume not admin and redirect
        logger.debug('🚨 Dashboard: Admin check failed or user is not admin - redirecting to onboarding', error);
      }

      // Not admin or check failed - redirect to onboarding
      logger.debug('🚨 Dashboard: No profile found - redirecting to onboarding');
      setIsCheckingAdmin(false);
      adminCheckRef.current = false;
      routerRef.current.replace('/onboarding');
    };

    void checkAdminAndRedirect();
  }
}, [isLoading, isUserLoading, isAuthenticated, profile, isCheckingAdmin]);
```

**Key Principle**: Always check admin status before redirecting authenticated users to onboarding. Account for loading states and provide fallbacks.

### 10. Polls Page: Store Hook Stability and Refs Pattern

**Problem**: React error #185 on polls page in production, caused by infinite re-render loops from unstable store hook return values and callbacks.

**Root Cause**: 
1. `usePollPagination` returned a new object on every render (not using `useShallow`)
2. Store actions (`loadPolls`, `setFilters`, etc.) in `useEffect` and `useCallback` dependency arrays
3. Translation function `t` in dependency arrays (even though stable, better to use refs)

**✅ GOOD: Using `useShallow` for Store Hooks**

```typescript
// lib/stores/pollsStore.ts
export const usePollPagination = () =>
  usePollsStore(
    useShallow((state) => ({
      currentPage: state.search.currentPage,
      totalPages: state.search.totalPages,
      totalResults: state.search.totalResults,
      itemsPerPage: state.preferences.itemsPerPage,
    })),
  );
```

**✅ GOOD: Using Refs for Store Actions**

```typescript
// app/(app)/polls/page.tsx
const {
  loadPolls,
  setFilters,
  setTrendingOnly,
  setCurrentPage,
} = usePollsActions();

// Use refs for store actions to prevent infinite re-renders
const loadPollsRef = useRef(loadPolls);
const setFiltersRef = useRef(setFilters);
const setTrendingOnlyRef = useRef(setTrendingOnly);
const setCurrentPageRef = useRef(setCurrentPage);

React.useEffect(() => {
  loadPollsRef.current = loadPolls;
  setFiltersRef.current = setFilters;
  setTrendingOnlyRef.current = setTrendingOnly;
  setCurrentPageRef.current = setCurrentPage;
}, [loadPolls, setFilters, setTrendingOnly, setCurrentPage]);

// Use refs in callbacks and effects
useEffect(() => {
  if (initializedRef.current) {
    return;
  }
  initializedRef.current = true;
  setCurrentPageRef.current(1);
  setTrendingOnlyRef.current(false);
  setFiltersRef.current({ status: [] });
  loadPollsRef.current().catch((error) => {
    logger.warn('Failed to load polls (non-critical):', error);
  });
}, []); // Empty deps - using refs
```

**✅ GOOD: Using Refs for Translation Function**

```typescript
// Even though t is stable from useI18n, using refs ensures no dependency issues
const tRef = useRef(t);

React.useEffect(() => {
  tRef.current = t;
}, [t]);

// Use in useMemo and callbacks
const paginationLabel = useMemo(() => {
  if (!isMounted || !numberFormatter) {
    return `${paginationStart}-${paginationEnd} of ${pagination.totalResults}`;
  }
  return tRef.current('polls.page.pagination.showing', {
    start: numberFormatter.format(paginationStart),
    end: numberFormatter.format(paginationEnd),
    total: numberFormatter.format(pagination.totalResults),
  });
}, [isMounted, numberFormatter, paginationEnd, paginationStart, pagination.totalResults]); // t removed
```

**Key Principle**: Always use `useShallow` when store hooks return objects, and use refs for any callbacks/functions that might change identity (store actions, translation functions, router, etc.).

---

*Last updated: December 18, 2025*
*Related commits: cf6a358f, da2ee76d, 02f7276c, 5c73afba, 0c48f7df, c48f0e67, a8198885*

