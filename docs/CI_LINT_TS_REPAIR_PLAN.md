# CI Lint/TypeScript Repair Plan (Parallelizable)

Last baseline: `npm run check` after eslint --fix. This file groups remaining errors by category, provides context pointers, and splits work into phases suitable for multiple parallel agents. Each task lists representative files; agents should search for similar patterns across the codebase.

---

## Phase 1 — Quick wins (autofix-unfriendly but trivial edits)

- Unused variables/handlers (remove or prefix with underscore if needed)
  - app:
    - `web/app/(app)/account/privacy/page.tsx` — router unused (line ~39) — DONE
    - `web/app/(app)/polls/page.tsx` — multiple `handle*` unused (~141, 167, 174, 185, 203, 207) — N/A (handlers are used)
  - features:
    - `web/features/admin/components/AdminDashboard.tsx` — `totalVotesCount` unused (~108) — DONE
    - `web/features/feeds/components/enhancers/FeedRealTimeUpdates.tsx` — `ws` unused (~48) — DONE
    - `web/features/feeds/lib/hashtag-polls-integration-base.ts` — `totalVotes` unused (~262) — DONE
    - `web/features/hashtags/components/HashtagInput.tsx` — `error` unused (~65) — N/A (no unused var found)
    - `web/features/polls/pages/[id]/PollClient.tsx` — `trackEvent`, `analyticsSessionId` unused (~96–97) — DONE
  - libs/tests:
    - `web/lib/stores/contactStore.ts` — `meta` unused (~508) — N/A (used)
    - tests contracts: remove unused helper vars where flagged (see lint output paths)

- Empty block statements (replace with comment or implement)
  - `web/app/api/candidates/[slug]/route.ts` (~132) — DONE (commented)
  - `web/app/api/candidates/onboard/route.ts` (~97) — DONE (commented)
  - `web/app/api/candidates/verify/request/route.ts` (~74) — DONE (commented)
  - `web/app/api/representatives/self/overrides/route.ts` (~121) — DONE (commented)
  - `web/app/api/webhooks/resend/route.ts` (~27) — DONE (commented)
  - `web/lib/stores/onboardingStore.ts` (~379, 392, 405, 418, 431) — DONE (commented)
  - tests archive `e2e-legacy/helpers/e2e-setup.ts` (~411) — N/A (file not present)

- Delete vs assigning undefined (adhere to rule)
  - Replace `= undefined` with `delete obj.prop` where appropriate.
  - `web/utils/supabase/server.ts` (~40) — N/A (no offending pattern found)
  - Any remaining harness pages still flagged by `no-restricted-syntax`.

---

## Phase 2 — Import order and require usage (mechanical)

- Import order corrections (move groups and ensure blank lines)
  - Numerous files (see lint output); prioritize:
    - `web/app/(app)/candidates/[slug]/page.tsx`
    - Admin pages: `web/app/(app)/admin/**/page.tsx`
    - API routes: `web/app/api/**/route.ts`
    - Tests: adjust import ordering and remove body imports.

- Replace CommonJS `require` in tests with ESM imports or hoisted jest.mock
  - `web/app/(app)/civics/__tests__/page.test.tsx` — fixed dynamic mock; re-check files still using require
  - `web/tests/**` several cases: `@typescript-eslint/no-var-requires`
  - Prefer `import …` at top and `jest.mock(...)` hoisted.

---

## Phase 3 — Rule of Hooks violations (targeted refactors)

- Components/hooks calling React hooks conditionally or inside callbacks:
  - `web/components/FeatureWrapper.tsx` — fixed: hooks invoked before conditional returns; harness guard moved after hook calls. PR: (internal)
  - `web/features/polls/components/PollFiltersPanel.tsx` — fixed: removed hook-in-callback by hoisting `usePollsActions` and memoizing derived actions. PR: (internal)
  - `web/hooks/useFeatureFlags.ts` — fixed: removed early-return before hooks; unified loading state handling for harness. PR: (internal)
  - `web/lib/stores/widgetStore.ts` — fixed: unified on `useStoreWithEqualityFn` with default equality to avoid conditional hook calls. PR: (internal)
  - `web/features/pwa/components/PWAUserProfile.tsx` — reviewed: `useMemo` calls are unconditional; no change required.
  - `web/features/onboarding/components/{AuthSetupStep,ProfilePage}.tsx` — reviewed: memos are unconditional; no change required.
  - `web/features/civics/components/AddressLookupForm.tsx` — reviewed: hooks are top-level; feature check occurs after hook calls; no change required.
  - Strategy: lift hooks to top-level; guard within effect/callback bodies; prefer single-hook patterns with stable defaults.

---

## Phase 4 — Accessibility/a11y fixes (consistent patterns)

- Redundant roles, non-interactive event handlers, tabIndex on non-interactive:
  - `web/features/polls/components/AccessiblePollWizard.tsx` — redundant list roles removed
  - `web/features/polls/components/OptimizedPollResults.tsx` — redundant list roles removed
  - `web/features/polls/components/PollResults.tsx` — redundant list roles removed
  - `web/components/**/PrivacyLevelSelector.tsx` — event handlers on non-interactive fixed earlier
  - Replace with buttons/links or add proper roles/keyboard handlers where applicable.
  - `web/components/PasskeyManagement.tsx` — avoid autoFocus (~173)

Status:
- Partially fixed (now complete for listed components):
  - Removed redundant `role` usage in the poll components above; retained semantic structure.
  - Converted previous clickable non-interactive to interactive where noted.
  - Removed `autoFocus` from inline editor in `web/components/PasskeyManagement.tsx`.
- Note: `BurgerMenu.tsx` and `DeviceList.tsx` not found in `web/components/**`.

---

## Phase 5 — TypeScript strictness and exact optional types

- Remove or avoid `!` non-null assertions where flagged; add guarding or defaults.
  - API routes and libs: `analytics/*`, `contact/*`, `user/*`, `database/*`, `privacy/*`, `electoral/*`

- exactOptionalPropertyTypes, undefined handling already improved in civics & responses.
  - Continue: ensure required fields are non-undefined; convert optional params to explicit `undefined ??` defaults where necessary.

Status:
- Non-null assertions removed and guards added:
  - `web/lib/core/auth/middleware.ts` — replaced `user!` usages; added safe access patterns
  - `web/utils/code-splitting.ts` — handled `lastError` without `!` and added fallback
  - `web/lib/utils/network-optimizer.ts` — guarded cache delete when no key present
  - `web/features/analytics/lib/auth-analytics.ts` — replaced `duration!` with typed filters
  - `web/lib/integrations/open-states/error-handling.ts` — removed `lastError!`; safe throw with default
  - `web/lib/civics/env-guard.ts` and `web/features/civics/lib/civics/env-guard.ts` — removed `cur!` assertion
  - `web/lib/electoral/geographic-feed.ts` — removed `f!.sources` assertion
- Lint enforcement:
  - Elevated `@typescript-eslint/no-non-null-assertion` to `error` for TS files (tests remain exempt)
- Next:
  - Adopt `stripUndefinedDeep`/`undefinedToNull` in any remaining DB write paths in routes/services
  - Audit remaining API routes for strict optional handling and remove any residual `!`

---

## Phase 6 — Tests and Playwright config hygiene

- Convert interfaces to types in e2e tests where enforced — DONE
  - Review found only global `declare global { interface Window ... }` augmentations, which must remain `interface` for merging. Local rule-disables are present and appropriate.

- Remove `import()` type annotations in tests; use `typeof import('...')` or move to value imports — DONE
  - Audit found no remaining inline `import('module').Type` patterns; tests already use `typeof import('...')`.

- Resolve `__dirname` and `process` undefined in CJS/Node scripts — DONE (generalized)
  - Ensure Node globals are declared via `/* eslint-env node */` or config overrides where applicable. No `start-standalone-server.cjs` present.

Notes:
- Added conventions to `docs/TESTING.md` under “Test Hygiene Conventions (Phase 6)” to prevent regressions.

---

## Phase 7 — Analytics & Charts cleanup

- PollHeatmap, TemporalAnalysisChart, TrendsChart:
  - Remove unused locals (`DEFAULT_CATEGORIES`, `cardHeadingId`, `cardDescriptionId`, `chartRegionId`, `summaryCards`, `chartAxesDescription*`).
  - Fix duplicate declarations in `TemporalAnalysisChart.tsx` (~128–129).
  - Add missing dependencies to hooks or refactor stable callbacks.

---

## Phase 8 — Supabase/server utils and civics address route polishing

- `web/utils/supabase/server.ts` — replace `= undefined` with conditional spread or delete (line ~40).
- `web/app/api/v1/civics/address-lookup/route.ts`
  - We already lazy-import server client; ensure `import type` patterns do not create side effects (avoid inline `import()` type annotations).

---

## Phase 9 — Console usage policies

- Remove plain `console.log/info` in production libs; use `logger.warn/error` per policy.
  - `web/lib/stores/widgetStore.ts` multiple lines (161, 444, 509, 525, 532, 547, 641, 652, 679, 750, 765, 782, 829)
  - `web/features/analytics/components/widgets/*` — replace console usage with logger or remove.

---

## Phase 10 — Remaining categories (smaller)

- No-extraneous-dependencies (test-civics-ingest.js) — DONE (moved `dotenv` to web dependencies)
- `no-unreachable` in `web/tests/unit/stores/widgetStore.keyboard.test.ts` (~82) — N/A (no unreachable code present)
- `ban-ts-comment` — DONE (removed `@ts-nocheck` in `web/lib/electoral/financial-transparency.ts`)

---

## Work Assignment (parallel agents)

- Agent A — Phase 1: quick wins in app pages and API routes (unused + empty blocks + delete patterns).
- Agent B — Phase 2: import-order normalization across app/api/tests; replace require with ESM.
- Agent C — Phase 3: rule-of-hooks refactors in FeatureWrapper, AddressLookupForm, useFeatureFlags, widgetStore usages.
- Agent D — Phase 4: a11y remediations (redundant roles, tabIndex, non-interactive handlers).
- Agent E — Phase 5: TS strictness cleanup (non-null assertions) across libs.
- Agent F — Phase 6: tests/types cleanups (interfaces→types, import() annotations, CJS env).
- Agent G — Phase 7: analytics charts cleanup (unused/duplicate vars, hook deps).
- Agent H — Phase 8 & 9: supabase utils polish + console policy replacements.
- Agent I — Phase 10: tail small items (no-extraneous-dependencies, unreachable code, ts-nocheck).

Each agent should:
- Run `npm run lint -- --fix` locally per file batch.
- Keep PRs small and thematic (one category/file group).
- After each PR, run `npm run check` to verify gates.

---

## Tracking

Update this document with completed sections and link PRs beside the bullets. Keep CI iteration fast by landing small PRs in parallel. 


