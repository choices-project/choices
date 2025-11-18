# Onboarding Testing Playbook

_Last updated: 2025-11-13_

This document outlines the test strategy for the onboarding journey now that the authentication harness is stable.

---

## 1. Objectives
- Cover the complete post-auth onboarding funnel (auth setup → profile details → completion) in Playwright, chained off the existing `/e2e/auth-access` harness.
- Validate store interactions (`onboardingStore`, `profileStore`, `userStore`) with MSW-powered fixtures.
- Exercise edge cases (redirect guards, retry flows) without relying on live Supabase data.

---

## 2. Playwright Plan

### 2.1 Harness (`/app/(app)/e2e/onboarding-flow/page.tsx`)
- Exposes helpers via `window.__onboardingFlowHarness`:
  - `reset()`
  - `startOnboarding(seedData?)`
  - `completeAuthStep(input?)`
  - `fillProfileStep(input?)`
  - `setValuesStep(input?)`
  - `completePrivacyStep(input?)`
  - `finish()`
  - `snapshot()`
- Provides read-only selectors for assertions (`currentStep`, `progress`, `isCompleted`, `authData`, `profileData`, `valuesData`, `preferencesData`).
- Sets E2E sentinels on `<html>` (`data-onboarding-flow-ready`, `data-onboarding-flow-step`, `data-onboarding-flow-status`).
- **Accessibility guardrail (2025-11-13):** JSON panels are now focusable `pre` elements with `role="region"` and `tabIndex={0}` to satisfy axe `scrollable-region-focusable`. Preserve this pattern when editing the harness.

### 2.2 Spec (`web/tests/e2e/specs/onboarding-flow.spec.ts`)
- Ships as a11y-first regression:
  1. **Standard completion** — uses helpers to play through auth → profile → values → privacy, then runs axe against the completion state.
  2. **Custom seed data** — seeds alternative profile/values/preference data and verifies axe stays green.
- Additional scenarios (skip auth step, validation errors, passkey path, reset/retry) remain backlog items; add them once we have bandwidth and mock coverage.

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
- Ensure telemetry expectations (completed onboarding metric, profile completion events) are tracked in `plan-gpt5-codex-independent.md`.
- Rollback: note that disabling passkeys now documented in `docs/operations/passkey-rollback-playbook.md`; mirror approach for onboarding if new feature flags introduced.

---

## 5. Next Actions
1. Maintain harness helpers + accessibility guarantees (focusable JSON panels).
2. Author MSW onboarding handlers and enable them in `setupExternalAPIMocks` (still todo).
3. Expand Playwright coverage for skip/auth error states once handlers land.
4. Backfill RTL coverage for remaining onboarding steps.
5. Integrate spec into CI once feeds/dashboard regression is cleared.

