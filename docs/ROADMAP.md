# Choices Platform Roadmap

_Last updated: November 9, 2025_

This roadmap captures the technical debt and follow-up work surfaced during the ongoing store modernization and documentation refresh. Items are ordered by urgency within each section.

---

## 1. TypeScript Build Failures (High Priority)
- **Feature flag tests:** Harden `featureFlagManager` tests to avoid `undefined` keys (in progress – verify once updated).
- **Core data layers:** Replace references to removed legacy types (`lib/core/database/optimizer.ts`, `lib/database/query-optimizer.ts`) with `@/types/supabase` equivalents end-to-end.
- **Civics financial transparency:** Fix missing type imports and strict-mode index access in `lib/electoral/financial-transparency.ts`.
- **Profile store recursion:** Resolve `TS2589` deep instantiation in `lib/stores/profileStore.ts` by refactoring the state/action types per the standards doc.
- **Civics district heatmap API tests:** Align Supabase mocks with strict type signatures and switch tests to `NextRequest`-aware helpers.
- **Cache invalidation tests:** Update Jest `Mock` usage for new Jest v30 types.
- **Analytics & privacy tests:** Audit strict optional property usage (`exactOptionalPropertyTypes`) across unit suites (poll wizard, notification store, performance store, etc.).

## 2. Linting & Code Quality (High Priority)
- **Import order cleanup:** Standardize ordering across admin analytics components, PWA modules, Next API routes, and Supabase clients.
- **`withOptional` adoption:** Replace direct `undefined` spreads with `withOptional()/stripUndefinedDeep` in admin store, analytics services, PWA modules, civics components, and shared hooks.
- **Accessibility fixes:** Address `jsx-a11y` violations (non-interactive click handlers, stray `tabIndex`, `autoFocus`) in navigation, onboarding, analytics widgets, and admin dashboards.
- **React hook hygiene:** Add missing dependencies to `useEffect/useCallback` hooks in analytics dashboards, contact flows, onboarding steps, and PWA components.
- **Playwright/Jest setup hygiene:** Remove unused arguments, stale `eslint-disable` directives, and empty blocks in archived E2E suites.

## 3. Store Modernization (Medium Priority)
- **Completed:** Notification store (selectors/actions, integration + Playwright coverage, civics election notification dedupe + analytics tests, monitoring widget/API); voter registration store (creator pattern, safe storage, unit suite).
- **In progress:** Profile and user stores (wrap up recursion fixes, port consumers to action hooks).
- **Recent hardening:** Analytics store now shares base loading/error helpers, exports selector bundles via `@/lib/stores`, sports a dedicated harness + unit/RTL coverage, and feeds the new Playwright spec; polls store continues to supply validation helpers for dashboard widgets.
- **Next up:** App, admin, and feeds consumer alignment—apply the standards doc (creator export, memoized selectors, strict persistence payloads) and add per-store harness pages.
- **Testing:** Each store should have unit + RTL suites, plus a Playwright harness when it surfaces user-visible behaviour.

## 4. Feature Completion & Testing (Medium Priority)
- **Analytics real data:** Replace mock responses with Supabase-backed queries, enforce privacy filters, and document the pipeline.
- **Social sharing:** Inventory remaining UI/API wiring, create unit + integration coverage, and document maturity in `docs/FEATURES.md`.
- **Feature flags:** Expand notification/admin Playwright coverage to include flag toggles and audit logging once modernized.
- **Civic Engagement V2:** Build feature-flagged integration tests validating guard rails and service orchestration.

## 5. Documentation & Tooling (Medium Priority)
- **Docs refresh:** Finish rewriting status/feature docs, update README navigation, and archive superseded narratives in `docs/archive/`.
- **Testing playbooks:** Extend `docs/TESTING.md` with additional examples as new harnesses ship.
- **Developer ergonomics:** Add `npm run lint -- <path>` convenience scripts to root for targeted linting.
- **CI enforcement:** Gate pull requests on `tsc --noEmit`, lint, and unit suites once debt backlog is cleared.

## 6. Nice-to-Have Improvements (Lower Priority)
- **Analytics mock refactor:** Replace empty method stubs with structured test doubles to improve coverage signals.
- **SSR polyfill cleanup:** Replace empty polyfill methods with minimal no-op implementations or shared utilities.
- **Archived tests pruning:** Remove or quarantine obsolete E2E suites that no longer reflect product reality.

---

### How to Use This Roadmap
1. **Pick a high-priority slice** and bring it to green (type-safe, lint-clean, tested).
2. Update this document with ownership, status, and newly discovered tasks.
3. Once TypeScript and lint baselines are clean, enforce them in CI to prevent regressions.

For questions or updates, coordinate in `#web-platform`. Let’s chip away at the debt systematically while continuing to protect core functionality.


