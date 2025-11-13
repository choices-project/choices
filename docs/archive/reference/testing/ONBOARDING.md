# Onboarding Testing Playbook

_Last updated: 2025-11-12_

This document outlines the test strategy for the onboarding journey now that the authentication harness is stable.

---

## 1. Objectives
- Cover the complete post-auth onboarding funnel (auth setup → profile details → completion) in Playwright, chained off the existing `/e2e/auth-access` harness.
- Validate store interactions (`onboardingStore`, `profileStore`, `userStore`) with MSW-powered fixtures.
- Exercise edge cases (redirect guards, retry flows) without relying on live Supabase data.

---

## 2. Playwright Plan

### 2.1 Harness (`/app/(app)/e2e/onboarding-flow/page.tsx`)
- Expose onboarding helpers via `window.__onboardingHarness`:
  - `startOnboarding(seedData?)`
  - `completeAuthStep(method)`
  - `fillProfile(details)`
  - `submitOnboarding()`
  - `resetStores()`
- Provide read-only selectors for assertions:
  - `onboardingProgress`, `currentStep`, `profileDraft`, `userStoreSnapshot`.
- Surface E2E sentinels (`data-testid="onboarding-harness-ready"`).

### 2.2 Spec (`web/tests/e2e/specs/onboarding-flow.spec.ts`)
1. **Happy Path**
   - Assumes user authenticated via auth harness.
   - Completes auth setup (magic link simulated), fills profile, observes redirect to dashboard sentinel.
2. **Skip Auth Step**
   - Chooses “Skip for now”, verifies warning modal, ensures onboarding completion still persists.
3. **Profile Validation Errors**
   - Submits empty profile, asserts error summary surfaced and store error flags set.
4. **Passkey Path**
   - Calls `passkeyAPI.beginRegister` stub, ensures userStore biometric flags propagate through onboarding summary.
5. **Reset / Retry**
   - Uses harness `resetStores` to simulate rerun, ensures onboarding restarts at step one.

### 2.3 MSW Fixtures
- Extend `web/tests/msw/` with:
  - `onboardingHandlers.ts` – `/api/onboarding/progress`, `/api/onboarding/complete`, `/api/profile`.
  - Update `tests/e2e/helpers/e2e-setup.ts` to enable `onboarding` flag and inject handlers.

### 2.4 Environment
- Reuse Playwright default config (`tests/e2e/playwright.config.ts`).
- Ensure `NEXT_PUBLIC_ENABLE_E2E_HARNESS=1` (already set).
- Add any onboarding-specific feature flags via `webServer.env` section if needed.

---

## 3. Store & Selector Coverage
- Add RTL coverage for each onboarding step:
  - `AuthSetupStep` (already shipped).
  - `ProfileDetailsStep`, `InterestsStep`, `SummaryStep` (todo).
- Use `UserStoreProvider` to simulate store state transitions and assert on `onboardingStore` persistence.
- Verify selectors exposed in `onboardingStore.ts` have corresponding unit tests (merging into `web/tests/unit/onboarding/`).
- The global Jest setup now keeps `navigator` mutable and ships WebAuthn/polyfill stubs. When authoring new tests, favour asynchronous queries (`findByRole`, `findByTestId`) so the harness state has time to hydrate before you fire events, and override individual navigator properties with `Object.defineProperty` if you need to simulate platform-specific behaviour.

---

## 4. Telemetry & Rollback Hooks
- Update `docs/testing/AUTH.md` once onboarding Playwright spec is chained, noting combined run command.
- Ensure telemetry expectations (completed onboarding metric, profile completion events) are tracked in `plan-auth-onboarding-consolidated.md`.
- Rollback: note that disabling passkeys now documented in `docs/operations/passkey-rollback-playbook.md`; mirror approach for onboarding if new feature flags introduced.

---

## 5. Next Actions
1. Scaffold onboarding harness page and expose helpers.
2. Author MSW handlers (`onboardingHandlers.ts`) and wire into `setupExternalAPIMocks`.
3. Create Playwright spec skeleton with scenarios above.
4. Backfill RTL coverage for remaining onboarding steps.
5. Integrate spec into CI once green locally.

