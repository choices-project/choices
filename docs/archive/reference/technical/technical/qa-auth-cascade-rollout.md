# QA Rollout Plan: Auth Cascade & Store Modernization

_Last updated: November 15, 2025_

## Overview

This document outlines the QA testing plan for the user store modernization initiative, including cross-store cascade behavior, auth flow improvements, and new test coverage.

## What Changed

### Cross-Store Cascade
- **Behavior**: When a user logs out or becomes unauthenticated, the `userStore` now automatically resets `profileStore` and `adminStore` to prevent stale data from persisting.
- **Impact**: Users will no longer see previous users' profile preferences, admin notifications, or other user-specific state after logout or when switching accounts.
- **Files**: `web/lib/stores/userStore.ts` (cascade logic), `web/tests/unit/stores/authCascade.test.ts` (unit coverage)

### Auth Flow Improvements
- **Password login/signup**: Now properly syncs Supabase sessions into the user store via `initializeAuth`/`setSessionAndDerived`, ensuring immediate state consistency.
- **Passkey flows**: Registration and authentication now trigger store updates correctly.
- **Onboarding**: Auth setup step (email OTP, social, passkey, anonymous) properly initializes user state.
- **Dashboard**: Guest users are redirected to `/auth`; authenticated users see personalized content.

### New Test Coverage
- **Unit tests**: `AuthPage`, `RegisterPage`, `AuthSetupStep`, `PersonalDashboard` now have RTL coverage for auth flows.
- **E2E tests**: New Playwright specs for `auth-access`, `dashboard-auth`, `onboarding-auth`, and expanded `admin-navigation`.
- **Shared helpers**: `web/tests/utils/supabase.ts` provides reusable Supabase/WebAuthn mocks for consistent test setup.

## QA Testing Checklist

### Regression Testing

#### Auth Flows
- [ ] **Password login** (`/auth`): Sign in with valid credentials → verify redirect to dashboard/onboarding → verify user state is hydrated
- [ ] **Password signup** (`/auth` or `/register`): Create new account → verify redirect to onboarding → verify session persists after page reload
- [ ] **Passkey registration**: Register a new passkey → verify success message → verify biometric state updates in store
- [ ] **Passkey login**: Sign in with existing passkey → verify redirect → verify session sync
- [ ] **Logout**: Click logout from any authenticated page → verify redirect to login → verify no stale profile/admin data visible

#### Onboarding
- [ ] **Email OTP**: Complete email authentication step → verify session sync → continue to next step
- [ ] **Social login**: Complete Google/GitHub auth → verify session sync → continue onboarding
- [ ] **Passkey setup**: Register passkey during onboarding → verify state updates → continue
- [ ] **Anonymous/Skip**: Choose anonymous or skip auth → verify user store resets → continue onboarding

#### Dashboard
- [ ] **Guest access**: Visit `/dashboard` while logged out → verify redirect to `/auth?redirectTo=/dashboard` → verify guest banner shows
- [ ] **Authenticated access**: Sign in → visit `/dashboard` → verify personalized content loads → verify no guest banner
- [ ] **Logout from dashboard**: Click logout → verify redirect → verify profile/admin stores reset

#### Cross-Store Cascade
- [ ] **Logout cascade**: Sign in → set profile preferences → visit admin dashboard → logout → sign in as different user → verify no previous user's preferences/admin data visible
- [ ] **Session expiry**: Sign in → wait for session to expire (or manually clear cookies) → verify stores reset → verify redirect to auth

### New Test Scenarios

#### Auth Access Harness
- [ ] Navigate to `/e2e/auth-access` → verify harness loads → test passkey registration → verify success indicators
- [ ] Test passkey authentication → verify success message → verify store state updates

#### Dashboard Auth Spec
- [ ] Run `npm run test:e2e tests/e2e/specs/dashboard-auth.spec.ts` → verify guest redirect → verify authenticated state → verify logout cascade

#### Onboarding Auth Spec
- [ ] Run `npm run test:e2e tests/e2e/specs/onboarding-auth.spec.ts` → verify email/passkey/anonymous paths → verify session sync

### Browser Compatibility
- [ ] **Chrome/Edge**: Test passkey flows (Touch ID/Face ID on Mac, Windows Hello on Windows)
- [ ] **Firefox**: Verify fallback behavior when WebAuthn not available
- [ ] **Safari**: Test passkey registration and authentication
- [ ] **Mobile**: Test on iOS Safari and Android Chrome for passkey support

### Edge Cases
- [ ] **Concurrent sessions**: Open two browser tabs → sign in on one → logout on the other → verify both tabs reflect logout
- [ ] **Network errors**: Disconnect network → attempt login → verify error handling → reconnect → verify retry works
- [ ] **Expired sessions**: Sign in → wait for session expiry → attempt to access protected route → verify redirect to auth
- [ ] **Onboarding abandonment**: Start onboarding → close browser → reopen → verify state is preserved or reset appropriately

## Test Data Requirements

### Test Accounts
- Regular user account (for password login/signup)
- Admin account (for admin dashboard testing)
- Test accounts with existing passkeys (for passkey login)

### Environment Setup
- `PLAYWRIGHT_USE_MOCKS=1` for deterministic harness tests
- `PLAYWRIGHT_USE_MOCKS=0` for real backend integration tests
- Supabase test project configured with WebAuthn enabled

## Known Issues & Workarounds

- **Passkey testing**: Some browsers require HTTPS for WebAuthn. Use `localhost` or a staging environment with valid SSL.
- **Session persistence**: Supabase sessions persist in cookies. Clear cookies between test runs or use incognito mode.
- **Harness hydration**: Some harness pages may take 1-2 seconds to fully hydrate. Wait for `data-*-harness="ready"` attributes before interacting.

## Reporting Issues

When reporting bugs, include:
1. **Browser/OS**: e.g., "Chrome 120 on macOS 14"
2. **Test scenario**: Which checklist item failed
3. **Steps to reproduce**: Detailed steps from login to failure
4. **Expected vs actual**: What should happen vs what actually happened
5. **Console errors**: Any errors in browser console or network tab
6. **Store state**: If possible, capture `window.__userStoreHarness` state at failure point

## Coordination Notes

- **Regression cadence**: Add auth cascade scenarios to weekly regression runs
- **Harness usage**: QA can use harness pages (`/e2e/*`) for deterministic testing without needing real backend
- **Test helpers**: QA can reference `web/tests/utils/supabase.ts` for understanding how Supabase is mocked in tests
- **Documentation**: See `docs/STATE_MANAGEMENT.md` for cross-store cascade details

## Success Criteria

✅ All regression checklist items pass  
✅ New Playwright specs run successfully in CI  
✅ No stale user data visible after logout  
✅ Auth flows work consistently across browsers  
✅ Onboarding completes successfully for all auth methods  
✅ Dashboard correctly gates guest vs authenticated access

---

For questions or clarifications, contact the web platform team in `#web-platform` or reference the store modernization roadmap in `scratch/store-modernization-roadmap.md`.

