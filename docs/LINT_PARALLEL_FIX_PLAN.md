## Lint Fix Plan for Parallel Agents

This document splits the current ESLint issues into 4 discrete, parallelizable workstreams. Each section includes:
- Scope and rules to satisfy
- Exact files (from latest lint run)
- Fix patterns with examples
- Acceptance criteria and validation command

When in doubt, prefer minimal, mechanical edits that do not change behavior.

### Global context
- Run lint locally: `npm --prefix web run lint:strict`
- Auto-fix safe items first: `npm --prefix web run lint:fix` (already applied once; remaining items require manual fixes)
- Target Node ≥ 24; TypeScript strict; ESLint 9; exactOptionalPropertyTypes is on
- Logger utilities available in `@/lib/utils/logger` (prefer `logger.warn`, `logger.error` over `console`)

---

## 1) Eliminate non-null assertions and unsafe patterns

Rules to satisfy:
- `@typescript-eslint/no-non-null-assertion`
- `no-restricted-syntax` (applies specifically to “= undefined”; use conditional spread or delete)

Files (exact from latest lint):
- `web/app/api/admin/audit-logs/route.ts` (87, 91, 117, 121)
- `web/app/api/analytics/temporal/route.ts` (139, 143)
- `web/app/api/analytics/trends/route.ts` (109)
- `web/app/api/analytics/trust-tiers/route.ts` (70)
- `web/app/api/auth/register/route.ts` (69, 70, 71)
- `web/app/api/contact/messages/route.ts` (183–185)
- `web/app/api/contact/threads/route.ts` (254, 256)
- `web/app/api/shared/poll/[id]/route.ts` (11, 12)
- `web/app/api/shared/vote/route.ts` (19, 20)
- `web/app/api/site-messages/route.ts` (31, 32)
- `web/app/api/user/activity-log/route.ts` (62, 66)
- `web/app/api/user/trust-tier-progression/[id]/route.ts` (12, 13)
- `web/app/api/user/voting-history/[id]/route.ts` (12, 13)
- `web/app/api/v1/civics/heatmap/route.ts` (90)
- `web/components/auth/PasskeyLogin.tsx` (117)
- `web/components/lazy/UserManagement.tsx` (183)
- `web/features/admin/lib/feedback-tracker.ts` (308)
- `web/features/analytics/components/TemporalAnalysisChart.tsx` (953, 956)
- `web/features/analytics/components/TrendsChart.tsx` (268–271)
- `web/features/analytics/hooks/useEnhancedAnalytics.ts` (493, 494)
- `web/features/auth/lib/dpop-middleware.ts` (97, 98)
- `web/features/auth/lib/service-auth.ts` (28, 56)
- `web/features/auth/lib/service-role-admin.ts` (25, 26)
- `web/features/civics/components/AddressLookupForm.tsx` (see Hooks in Section 2, but ensure no non-null)
- `web/features/pwa/lib/PWAAnalytics.ts` (330, 394)
- `web/hooks/useDeviceDetection.ts` (131)
- `web/lib/database/connection-pool.ts` (218, 265, 447, 503)
- `web/lib/electoral/financial-transparency.ts` (404)
- `web/lib/electoral/geographic-feed.ts` (185)
- `web/lib/http/safeFetch.ts` (108)
- `web/lib/integrations/google-civic/error-handling.ts` (235)
- `web/lib/privacy/dp.ts` (418)
- `web/lib/privacy/linddun-analysis.ts` (345, 352)
- `web/lib/services/civics-integration.ts` (181, 240)
- `web/lib/utils/network-optimizer.ts` (72)
- `web/utils/code-splitting.ts` (115, 194, 261, 362)
- `web/utils/privacy/encryption.ts` (81)
- `web/utils/supabase/server.ts` (40) — also `no-restricted-syntax` (“= undefined”)
- `web/lib/vote/finalize.ts` (750)

Fix patterns:
- Replace `value!` with safe guards:
  ```ts
  // Before
  const x = obj!.field;
  // After
  if (!obj) { return errorResponse('Missing obj', 400); }
  const x = obj.field;
  ```
- Or fallback coercion:
  ```ts
  const s = maybeString ?? '';
  ```
- For “= undefined” flags, use conditional spread/remove keys:
  ```ts
  // Before
  payload.foo = undefined;
  // After
  const { foo, ...rest } = payload;
  // or when constructing:
  const payload = { ...(cond ? { foo } : {}) };
  ```

Acceptance:
- No remaining `no-non-null-assertion` or `no-restricted-syntax` errors
- Type checks pass

Validation:
- `npm --prefix web run lint:strict`

---

## 2) React Hooks rules, unused variables/params, and accessibility

Rules to satisfy:
- `react-hooks/rules-of-hooks` (no conditional hooks)
- `react-hooks/exhaustive-deps` (complete deps)
- `unused-imports/no-unused-vars`, `unused-imports/no-unused-imports`
- `jsx-a11y/*` (interactive handlers on non-interactive elements; tabindex)

Files:
- Hooks violations (must refactor code flow to avoid calling hooks conditionally):
  - `web/components/shared/FeatureWrapper.tsx` (67, 146, 228)
  - `web/features/civics/components/AddressLookupForm.tsx` (82, 120, 125, 133)
  - `web/features/onboarding/components/AuthSetupStep.tsx` (249)
  - `web/features/onboarding/components/ProfilePage.tsx` (74, 83)
  - `web/features/pwa/components/PWAUserProfile.tsx` (172, 173)
  - `web/features/pwa/hooks/useFeatureFlags.ts` (77)
- Missing dependencies (add deps or wrap creators with useMemo/useCallback):
  - `web/features/analytics/components/TrendsChart.tsx` (275) — add `getTrend` or restructure
  - `web/components/business/analytics/PollResults.tsx` (useEffect deps: fetchResults)
  - `web/components/business/contact/MessageThread.tsx` (useEffect deps: loadMessages)
  - `web/features/admin/components/AnalyticsPanel.tsx` (useCallback deps)
  - `web/features/pwa/components/PWAFeatures.tsx` (useCallback/useEffect deps: pwa)
  - `web/features/analytics/hooks/useEnhancedAnalytics.ts` (multiple)
  - `web/features/polls/components/AccessiblePollWizard.tsx` (useMemo deps: shareInfo)
  - `web/features/polls/components/PollHashtagIntegration.tsx` (useEffect deps)
- Unused variables/imports:
  - `web/app/(app)/polls/page.tsx` (handle* handlers unused)
  - `web/features/analytics/components/PollHeatmap.tsx` (cardHeadingId, cardDescriptionId, chartRegionId, summaryCards)
  - `web/features/analytics/components/TrendsChart.tsx` (chartAxesDescriptionId, chartAxesDescription)
  - `web/features/analytics/lib/analytics-service.ts` (ErrorWithCode)
  - Many others flagged in output (search `unused-imports`)
- Accessibility:
  - Remove `tabIndex` on non-interactive elements; replace spans/divs with buttons/anchors or add proper roles and key handlers.
  - Files: `web/app/(app)/e2e/onboarding-flow/page.tsx`, `web/components/DeviceList.tsx`, `web/components/accessible/*`, `web/components/navigation/BurgerMenu.tsx`, `web/components/shared/*`, `web/features/voting/components/*`

Fix patterns:
- Conditional hooks → hoist branches below hooks or compute condition in variables:
  ```ts
  // Before
  if (cond) { const x = useMemo(...); }
  // After
  const x = useMemo(..., [deps]);
  if (!cond) { /* ignore x or use default */ }
  ```
- Missing deps: add function/value to deps, or wrap function creation in `useCallback`/`useMemo` to stabilize
- Unused handlers: remove declarations or wire up in JSX
- a11y: turn clickable div/span into `<button>` or add role="button" tabIndex={0} and key handlers

Acceptance:
- No `react-hooks/*`, `unused-imports/*`, or `jsx-a11y/*` errors in listed files

Validation:
- `npm --prefix web run lint:strict`

---

## 3) Import hygiene, logging, and boundaries

Rules to satisfy:
- `import/order`
- `no-console` (allow only warn/error)
- `@typescript-eslint/consistent-type-imports` (no `import()` type annotations)
- `no-restricted-imports` (canonical path for "@/lib/http/origin")
- `boundaries/element-types` (lib files importing app)

Files:
- Import order:
  - `web/app/api/candidates/verify/official-email/route.ts` (order of util/logger)
  - `web/app/api/csp-report/route.ts` (same)
  - `web/app/api/feedback/route.ts` (same)
  - `web/app/api/pwa/notifications/send/route.ts` (same)
  - `web/app/api/v1/auth/webauthn/native/*/route.ts` (same)
  - tests: `web/tests/unit/analytics/auth-analytics-durations.test.ts`, `web/tests/unit/civics/env-guard.test.ts`
- No console:
  - `web/features/analytics/components/widgets/WidgetDashboard.tsx`
  - `web/features/analytics/components/widgets/WidgetRenderer.tsx`
  - `web/lib/stores/widgetStore.ts`
  - `web/tmp/analytics-debug.cjs` (consider delete or disable rule for tmp dir)
- Consistent type imports:
  - `web/features/pwa/hooks/usePWAUtils.ts` (avoid `import()` type annotations)
  - `web/lib/validation/validator.ts` (line 301)
- Restricted imports (canonical origin):
  - `web/lib/core/auth/middleware.ts`
  - `web/lib/core/auth/require-user.ts`
- Boundaries (lib importing app):
  - `web/features/auth/lib/api.ts` (2 instances)
  - `web/tests/unit/app/*` warnings can be ignored or adjust config

Fix patterns:
- Import order:
  1) Node/externals, 2) absolute `@/...`, 3) relative, with blank lines between groups
- Replace console.* with `logger.warn`, `logger.error`, or remove
- Replace `type Foo = import('...').Foo` with `import type { Foo } from '...'` at top-level
- Replace `@/lib/http/origin` non-canonical with canonical specified by lint (use quoted path `"@/lib/http/origin"`)

Acceptance:
- No `import/order`, `no-console`, `consistent-type-imports`, or `no-restricted-imports` errors in listed files

Validation:
- `npm --prefix web run lint:strict`

---

## 4) API/Routes and Misc Cleanup (unused args, empty blocks, duplicates)

Rules to satisfy:
- `unused-imports/no-unused-vars` for unused parameters/vars (`/^_/` convention)
- `no-empty` (empty blocks)
- `no-redeclare` (duplicate identifier)
- Misc tmp/test issues (prefer disabling or scoping)

Files:
- Unused params in routes:
  - `web/app/api/candidates/verify/official-email/route.ts` (`request` unused) → rename to `_request`
  - `web/app/api/pwa/notifications/subscribe/route.ts` (storeSubscription/data) → remove or prefix `_`
  - `web/app/(app)/polls/page.tsx` (handlers unused): remove or wire
- Empty blocks:
  - `web/lib/stores/onboardingStore.ts` (439)
- Duplicates:
  - `web/features/polls/components/PollHashtagIntegration.tsx` (`PollHashtagIntegration` already defined)
- Temp scripts/tests:
  - `web/tmp/analytics-debug.cjs` — use `/* eslint-env node */` and `/* global console */` or delete if obsolete
  - test import/order warnings — add blank lines between import groups

Fix patterns:
- Prefix unused params with `_`:
  ```ts
  export async function POST(_req: NextRequest) { ... }
  ```
- Remove empty blocks or add a comment with a TODO and a no-empty exception if necessary:
  ```ts
  // eslint-disable-next-line no-empty
  if (cond) { /* no-op by design */ }
  ```
- Remove duplicate declarations or merge exports

Acceptance:
- No remaining `unused-*`, `no-empty`, `no-redeclare` in listed files; tmp file either fixed or ignored

Validation:
- `npm --prefix web run lint:strict`

---

## Final Checklist for Each Agent
- Ensure TypeScript build remains clean: `npm --prefix web run types:ci`
- Run `npm --prefix web run lint:strict` and confirm 0 errors (warnings may remain if acceptable)
- Keep edits surgical; avoid behavior changes without tests
- Prefer logger over console; fix imports; no conditional hooks; no non-null assertions


