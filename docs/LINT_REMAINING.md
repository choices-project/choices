## Remaining ESLint Workstreams (web)

All listed workstreams are now completed and validated. Lint passes with zero errors across the web workspace. Any narrowly justified warnings are scoped to mocks/polyfills only.

Summary:
- 1) React Hooks compliance — completed
- 2) Accessibility and interactive semantics — completed
- 3) Unused variables/imports and small hygiene — completed
- 4) Non-null assertions, restricted imports, and regex/eslint specifics — completed
- 5) Mocks, polyfills, and intentionally empty implementations — completed (scoped)

This breaks the current lint output into five parallelizable workstreams. Each section lists rules, files, and expected fixes.

### 1) React Hooks compliance (rules-of-hooks, exhaustive-deps)
- Rules: `react-hooks/rules-of-hooks`, `react-hooks/exhaustive-deps`, `no-redeclare` (hook collisions)
- Targets:
  - `app/(app)/e2e/feeds-store/page.tsx` — add `updatePreferences` to deps
  - `features/analytics/components/widgets/WidgetDashboard.tsx` — complete deps
  - `features/analytics/hooks/useEnhancedAnalytics.ts` — complete deps for callbacks
  - `features/auth/components/PasskeyLogin.tsx` — complete deps for callback
  - `features/civics/components/AddressLookupForm.tsx` — remove conditional `useCallback`/`useEffect`
  - `features/onboarding/components/AuthSetupStep.tsx` — avoid conditional `useMemo`
  - `features/onboarding/components/ProfilePage.tsx` — avoid conditional `useMemo`
  - `features/polls/components/AccessiblePollWizard.tsx` — include `shareInfo` in deps
  - `features/pwa/components/PWAUserProfile.tsx` — avoid conditional `useMemo`
  - `features/pwa/hooks/useFeatureFlags.ts` — effect should depend on `fetchFlags`
  - `features/admin/components/AnalyticsPanel.tsx` — fix duplicate `fetchData` (no-redeclare) and deps
- Acceptance: zero `react-hooks/*` errors/warnings; no conditional hook calls; no redeclarations.

### 2) Accessibility and interactive semantics (jsx-a11y)
- Rules: `jsx-a11y/*` (no-noninteractive-tabindex, click-events-have-key-events, no-static-element-interactions, no-noninteractive-element-interactions, no-autofocus)
- Targets:
  - `app/(app)/e2e/onboarding-flow/page.tsx` — remove `tabIndex` on non-interactive
  - `components/DeviceList.tsx` and `components/shared/DeviceList.tsx` — use buttons/links or add role+key handlers appropriately; remove non-interactive `tabIndex`
  - `components/accessible/ProgressiveRanking.tsx`, `components/accessible/RankingInterface.tsx` — same as above
  - `components/candidate/FilingChecklist.tsx` — add keyboard handlers or convert to button
  - `components/shared/BurgerMenu.tsx` — ensure all clickable non-interactive elements have roles and keyboard support
  - `features/admin/components/NotificationSystem.tsx` — same
  - `features/pwa/components/PWAFeatures.tsx` — remove non-interactive `tabIndex`
  - `features/voting/components/ApprovalVoting.tsx`, `MultipleChoiceVoting.tsx`, `SingleChoiceVoting.tsx` — use buttons or add roles+key handlers
  - `features/auth/components/PasskeyManagement.tsx` — avoid `autoFocus`
- Acceptance: zero `jsx-a11y/*` errors/warnings in these files.

### 3) Unused variables/imports and small hygiene
- Rules: `unused-imports/no-unused-vars`, `no-empty-pattern`, `no-redeclare` where related
- Targets:
  - `app/(app)/polls/page.tsx` — remove unused handlers (`handleFilterChange`, `handleCategoryChange`, `handleSearchSubmit`)
  - `features/analytics/components/PollHeatmap.tsx` — remove unused ids (`cardHeadingId`, `cardDescriptionId`, `chartRegionId`) and `summaryCards`
  - `features/analytics/components/TrendsChart.tsx` — remove `axisStats` if unused
  - `features/analytics/components/widgets/PWAOfflineQueueWidget.tsx` — replace empty object pattern
  - `features/feeds/components/UnifiedFeedRefactored.tsx` — remove unused `maxItems`
  - `features/feeds/components/core/FeedCore.tsx` — remove unused `showScrollTop`, `scrollToTop`
  - `features/hashtags/components/HashtagInput.tsx` — remove unused `error`; memoize `handleAddHashtag`
  - `features/onboarding/components/AuthSetupStep.tsx` — remove unused `onBack`, `signOut`
  - `lib/stores/contactStore.ts` — remove unused `meta`
  - `lib/stores/pwaStore.ts` — remove unused `update`
  - `lib/stores/representativeStore.ts` — remove unused `extractDivisionIds`
  - `features/voting/lib/pollAdapters.ts` — remove unused `totalVotes`
  - `jest.setup.js` — remove unused `_`
- Acceptance: zero `unused-*` and `no-empty-pattern` errors in listed files.

### 4) Non-null assertions, restricted imports, and regex/eslint specifics
- Rules: `@typescript-eslint/no-non-null-assertion`, `no-restricted-imports`, `no-useless-escape`
- Targets:
  - Non-null assertions:
    - `features/admin/lib/feedback-tracker.ts` (308)
    - `lib/privacy/dp.ts` (418)
    - `lib/privacy/linddun-analysis.ts` (345, 352)
    - `lib/services/civics-integration.ts` (181, 240)
    - `lib/stores/contactStore.ts` (690)
    - `lib/vote/finalize.ts` (750)
  - Restricted import (canonical origin):
    - `lib/core/auth/middleware.ts`
    - `lib/core/auth/require-user.ts`
  - Regex escape:
    - `features/civics/lib/civics/privacy-utils.ts` — remove unnecessary `\\.` escape
  - Also: `app/(app)/e2e/voting-store/page.tsx` — replace `= undefined` with conditional spread/delete
- Acceptance: zero remaining violations of these rules.

### 5) Mocks, polyfills, and intentionally empty implementations
- Rules: `@typescript-eslint/no-empty-function`, constructors, and test-specific warnings
- Targets (consider scoping with file-level disables where appropriate):
  - `lib/core/services/analytics/index.ts` — empty methods; add TODOs/implementations or scoped disable
  - `ssr-polyfills.ts` — polyfill no-op methods; add scoped disable per block
  - `features/pwa/hooks/useFeatureFlags.ts` — empty `fetchFlags` in harness; annotate or guard with env flag, or scoped disable
  - Tests under `web/tests/**` — empty handlers and dynamic require warnings; add inline disables or adapt test doubles
  - Contract/e2e tests — same pattern for no-op listeners
- Acceptance: warnings either resolved or explicitly and narrowly disabled with rationale.

---

Validation
- Run: `npm --prefix web run lint:strict`
- Expected: errors 0; warnings 0 (or narrowly scoped in Section 5 where explicitly justified).



