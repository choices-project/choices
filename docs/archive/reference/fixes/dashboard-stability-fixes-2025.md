# Dashboard & Admin Dashboard Stability Fixes

## Overview

Applied React stability patterns from `REACT_STABILITY_PATTERNS.md` to all dashboard and admin dashboard components to prevent infinite re-render loops and mounting issues.

## Files Modified

### Dashboard Components

1. **`web/app/(app)/dashboard/page.tsx`**
   - ✅ Removed `dynamic()` wrapper with `ssr: false` (was preventing React from mounting)
   - ✅ Switched to direct import of `PersonalDashboard`
   - ✅ Added `export const dynamic = 'force-dynamic'` for client-side rendering
   - ✅ Removed `Suspense` wrapper (not needed with direct import)
   - ✅ All store actions already use refs pattern
   - ✅ Added admin status check and banner for admin users
   - ✅ Added prominent "Go to Admin Dashboard" button for admin users

2. **`web/features/dashboard/components/PersonalDashboard.tsx`**
   - ✅ **StandardPersonalDashboard**:
     - Added `tRef` for stable translation function
     - Added `updatePreferencesRef` for stable callback
     - Updated `recentPolls` useMemo to use `tRef.current` (removed `t` from deps)
     - Updated `quickActions` useMemo to use `tRef.current` (removed `t` from deps)
     - Updated `errorMessage` to use `tRef.current` in useMemo
     - Updated `dashboardTitle` and `dashboardSubtitle` to use `tRef.current` in useMemo
     - Updated `preferencesRefresher` callback to use `updatePreferencesRef.current` (removed `updatePreferences` from deps)
   - ✅ **HarnessPersonalDashboard**: Already had refs for router and signOut

3. **`web/components/shared/GlobalNavigation.tsx`**
   - ✅ Added `tRef` for stable translation function
   - ✅ Added `authSignOutRef` for stable logout callback
   - ✅ Updated `navigationItems` to use `tRef.current` in useMemo (removed `t` from deps)
   - ✅ Updated `handleLogout` to use `authSignOutRef.current` (removed `authSignOut` from deps)

4. **`web/components/shared/DashboardNavigation.tsx`**
   - ✅ No changes needed - component is simple and doesn't use unstable callbacks

### Admin Dashboard Components

5. **`web/app/(app)/admin/dashboard/page.tsx`**
   - ✅ Removed `dynamic()` wrapper with `ssr: false` (was preventing React from mounting)
   - ✅ Switched to direct import of `ComprehensiveAdminDashboard`
   - ✅ Added `export const dynamic = 'force-dynamic'` for client-side rendering
   - ✅ Removed `Suspense` wrapper
   - ✅ Applied refs pattern for all app store actions (`setCurrentRoute`, `setBreadcrumbs`, `setSidebarActiveSection`)

6. **`web/features/admin/components/ComprehensiveAdminDashboard.tsx`**
   - ✅ Added refs for notification actions:
     - `markAdminNotificationAsReadRef`
     - `clearAllAdminNotificationsRef`
   - ✅ Updated all callback usages to use refs instead of direct function calls
   - ✅ Already had refs for `refreshData`, `getTrendingHashtags`, and `addAdminNotification`

7. **`web/app/(app)/admin/page.tsx`**
   - ✅ Applied refs pattern for:
     - `router` → `routerRef`
     - `resetUserState` → `resetUserStateRef`
     - `setCurrentRoute`, `setBreadcrumbs`, `setSidebarActiveSection` → refs
     - `loadAdminStats` → `loadAdminStatsRef` (used in `checkAdminStatus`)
   - ✅ Updated `handleLogout` to use `useCallback` with refs
   - ✅ Updated `checkAdminStatus` to use `loadAdminStatsRef.current` instead of `loadAdminStats` in dependencies

8. **`web/app/(app)/admin/layout/Header.tsx`**
   - ✅ Applied refs pattern for:
     - `router` → `routerRef`
     - `resetUserState` → `resetUserStateRef`
     - `markAdminNotificationAsRead` → `markAdminNotificationAsReadRef`
   - ✅ Updated `handleLogout` to use `useCallback` with refs

9. **`web/app/(app)/admin/layout/Sidebar.tsx`**
   - ✅ No changes needed - component is simple and doesn't use unstable callbacks

## Key Patterns Applied

### 1. Refs Pattern for Unstable Dependencies
All unstable dependencies (translation functions, router, store actions, callbacks) now use refs:

```typescript
const tRef = useRef(t);
useEffect(() => { tRef.current = t; }, [t]);

const routerRef = useRef(router);
useEffect(() => { routerRef.current = router; }, [router]);

const actionRef = useRef(action);
useEffect(() => { actionRef.current = action; }, [action]);
```

### 2. Removed `dynamic()` Wrapper
Replaced `dynamic()` with `ssr: false` with direct imports and `export const dynamic = 'force-dynamic'`:

```typescript
// ❌ BAD: Prevents React from mounting properly
const Component = dynamic(() => import('...'), { ssr: false });

// ✅ GOOD: Direct import with force-dynamic
import { Component } from '...';
export const dynamic = 'force-dynamic';
```

### 3. Stable Callbacks
All `useCallback` and `useMemo` hooks now have stable dependencies via refs:

```typescript
// ❌ BAD: t in deps causes re-renders
const items = useMemo(() => [
  { label: t('key') }
], [t]);

// ✅ GOOD: Using tRef
const items = useMemo(() => [
  { label: tRef.current('key') }
], []); // Empty deps - using tRef
```

### 4. Admin Dashboard Access
- Added admin status check in dashboard page
- Shows prominent banner with "Go to Admin Dashboard" button for admin users
- Non-blocking check that doesn't interfere with personal dashboard rendering

## Testing

### Production Diagnostic Tests

1. **`web/tests/e2e/specs/production/production-dashboard-deep-diagnostic.spec.ts`**
   - Deep diagnostic test for dashboard page
   - Checks for infinite loops, mounting issues, loading states
   - Tests navigation from global nav
   - Collects console messages, errors, warnings
   - Takes screenshots for debugging

2. **`web/tests/e2e/specs/production/production-admin-dashboard-deep-diagnostic.spec.ts`**
   - Deep diagnostic test for admin dashboard page
   - Checks for infinite loops, mounting issues, loading states
   - Tests admin dashboard navigation from personal dashboard
   - Tests direct navigation to admin dashboard
   - Handles both admin and non-admin users gracefully

### Stability Tests

3. **`web/tests/e2e/specs/dashboard/dashboard-stability.spec.ts`**
   - Tests dashboard renders without infinite loops
   - Tests navigation from global nav
   - Tests dashboard preferences persistence
   - Checks for React error #185 (Maximum update depth exceeded)

4. **`web/tests/e2e/specs/dashboard/admin-dashboard-stability.spec.ts`**
   - Tests admin dashboard renders without infinite loops
   - Tests admin dashboard navigation from personal dashboard
   - Tests admin dashboard tabs work without re-render loops
   - Checks for React error #185

## Diagnostic Test Pattern

Following the pattern from `production-polls-deep-diagnostic.spec.ts`:

1. **Console Message Collection**: Collects all console messages, errors, warnings, and info
2. **State Checking**: Checks loading states, spinners, content visibility multiple times
3. **React State Inspection**: Checks React root, ready state, DOM structure
4. **Screenshot Capture**: Takes full-page screenshots for debugging
5. **Error Element Detection**: Finds and logs any error boundaries or error messages

## Admin Dashboard Access Logic

### Personal Dashboard (`/dashboard`)
- Checks admin status after authentication and profile loading
- Shows banner with "Go to Admin Dashboard" button if user is admin
- Non-blocking check - doesn't prevent dashboard from rendering
- Admin check uses `/api/admin/health?type=status` endpoint

### Admin Dashboard (`/admin/dashboard`)
- Direct access via URL
- Admin layout handles authentication and authorization
- Shows access denied for non-admin users
- Uses same admin health check endpoint

## Verification Checklist

- [x] Dashboard page removes `dynamic()` wrapper
- [x] PersonalDashboard uses refs for all callbacks
- [x] GlobalNavigation uses refs for translation and auth callbacks
- [x] Admin dashboard page removes `dynamic()` wrapper
- [x] ComprehensiveAdminDashboard uses refs for all callbacks
- [x] AdminDashboard (admin/page.tsx) uses refs for router and callbacks
- [x] AdminLayout Header uses refs for router and callbacks
- [x] Admin status check added to dashboard page
- [x] Admin banner with navigation button added
- [x] Production diagnostic tests created
- [x] Stability tests created

## Related Documentation

- `docs/REACT_STABILITY_PATTERNS.md` - Core patterns and principles
- `docs/TROUBLESHOOTING_FEED_AND_FEEDBACK.md` - Related troubleshooting
- `web/tests/e2e/specs/production/production-polls-deep-diagnostic.spec.ts` - Reference test pattern

## Next Steps

1. Run diagnostic tests in production/staging environment
2. Monitor for React error #185 in production logs
3. Verify admin dashboard access works for admin users
4. Check console for any remaining warnings or errors
5. Monitor dashboard page load times and performance

## Notes

- All changes follow the React stability patterns document
- No commits/pushes made (as requested) - ready for review and testing
- Tests are ready to run but require E2E credentials configured
- Admin dashboard access is non-blocking and graceful for non-admin users

