# Testing Suite Audit & Curation

_Last updated: March 2026_

This document records the testing suite audit and optimizations applied so the application is well-covered, reliable, and maintainable.

## Summary

- **Jest:** 4 projects (client, server, govinfo, contracts); 324 tests; unit, integration, and contract tests. CI uses `npm run check` (types:ci + lint:strict + jest:ci).
- **Playwright:** Single main config (`web/playwright.config.ts`); production config (`web/playwright.production.config.ts`) for live site. Smoke tagged with `@smoke`, a11y with `@axe`. Harness specs run only against dev (skipped in production).
- **CI:** `ci.yml` runs smoke (`--grep @smoke`) and axe (`--grep @axe`); `test.yml` runs a curated E2E list; `production-tests.yml` runs production smoke (production-api + mvp-smoke) and full production E2E with correct config.

## Findings & Fixes Applied (March 2026)

### 1. E2E specs referenced in CI but missing

- **test.yml** and **test:e2e:nav** referenced non-existent files: `dashboard-feeds.spec.ts`, `global-navigation.spec.ts`, `analytics-dashboard-axe.spec.ts`, `analytics-dashboard-screen-reader.spec.ts`, `locale-switch.spec.ts`.
- **Fix:** Curated to existing specs only:
  - **test:e2e:nav** (package.json): `navigation-shell.spec.ts`, `admin-navigation.spec.ts`, `accessibility/critical-pages-a11y.spec.ts`, `accessibility/keyboard-navigation.spec.ts`.
  - **test.yml** E2E job: `dashboard/dashboard-journey.spec.ts`, `navigation-shell.spec.ts`, `admin-navigation.spec.ts`, `accessibility/critical-pages-a11y.spec.ts`, `accessibility/keyboard-navigation.spec.ts`.

### 2. Production workflow pointed at wrong paths and config

- **production-tests.yml** referenced `tests/e2e/specs/production/production-smoke.spec.ts`, `production-expanded.spec.ts`, and `tests/e2e/playwright.config.ts` (dev config). No `production/` subfolder exists; production smoke is `production-api.spec.ts` + `mvp-smoke.spec.ts` in `specs/`.
- **Fix:**
  - Smoke job: run `production-api.spec.ts` and `mvp-smoke.spec.ts` with `playwright.production.config.ts`.
  - Production E2E job: run full suite via `playwright.production.config.ts` (no file list; config’s testIgnore already excludes harness-only specs).
  - API job: run `production-api.spec.ts` with `playwright.production.config.ts`.
  - Push paths: updated to `production-api.spec.ts`, `mvp-smoke.spec.ts`, `playwright.production.config.ts`.

### 3. Tagging and usage

- **@smoke:** Used by `test:e2e:smoke` and CI smoke job. `mvp-smoke.spec.ts` is tagged `@smoke`; `production-api.spec.ts` is tagged `@production` (included in production smoke by explicit file list, not by tag).
- **@axe:** Used by `test:e2e:axe` and CI axe job. Tagged: `critical-pages-a11y.spec.ts`, `admin-navigation.spec.ts`, `keyboard-navigation.spec.ts`.

## Test Layout (curated)

### Jest (web/)

| Project    | Purpose                    | Location / pattern                          |
|-----------|----------------------------|---------------------------------------------|
| client    | Component/app unit tests   | `components/**`, `app/**` *.test.*          |
| server    | Unit + integration         | `tests/unit/**`, `tests/integration/**`, `lib/**`, `tests/api/**` |
| govinfo   | Node-only GovInfo MCP      | `tests/unit/services/govinfo-mcp-service.test.*` |
| contracts | API contract tests         | `tests/contracts/**/*.contract.test.ts` (health, profile, feeds, analytics, admin-breaking-news, **feature-flags-public**) |

### Playwright (web/tests/e2e)

| Category      | Specs / tags                    | When run                          |
|---------------|----------------------------------|-----------------------------------|
| Smoke         | `mvp-smoke.spec.ts` (@smoke)     | `test:e2e:smoke`, CI smoke        |
| Production API| `production-api.spec.ts`         | Production smoke + API job        |
| Production MVP| `mvp-smoke.spec.ts`              | Production smoke                  |
| A11y          | @axe specs                       | `test:e2e:axe`, CI axe            |
| Nav / a11y    | navigation-shell, admin-navigation, critical-pages-a11y, keyboard-navigation | `test:e2e:nav`, test.yml E2E  |
| Harness-only  | feeds-store, polls-store, profile-store, pwa-store, voting-store, dashboard-journey, poll-production | Dev only; skipped in production config |
| Error paths   | `error-paths.spec.ts` (404, contact API 401/400) | `test:e2e` |
| Critical journey | `critical-journey.spec.ts` (landing → auth → dashboard/feed/civics/polls) | `test:e2e` |

## Optimization Recommendations

1. **Keep smoke minimal:** Smoke should stay fast (~20s for production). Avoid adding heavy specs to `@smoke` or the production smoke file list.
2. **Prefer tags over file lists in CI where possible:** CI already uses `--grep @smoke` and `--grep @axe`; test.yml uses a fixed list to control order and scope—only include specs that exist and are stable.
3. **Single Playwright config for dev:** Use `web/playwright.config.ts` for local and CI dev E2E; use `web/playwright.production.config.ts` only for production URL.
4. **Harness readiness:** Use `data-*-harness="ready"` and `window.__*Harness` before interacting; keep `beforeEach` resets to avoid cross-test leakage.
5. **Jest:** Run `npm run test` (all projects) or `npm run check` for CI-style gate; use `--detectOpenHandles` when debugging hangs (open-handles warning is known and documented).

## Commands Quick Reference

| Intent              | Command (from web/) |
|---------------------|---------------------|
| Full CI gate        | `npm run check`     |
| Jest only           | `npm run test`      |
| E2E (dev, all)      | `npm run test:e2e`  |
| E2E smoke (dev)     | `npm run test:e2e:smoke` |
| E2E critical (error + journey) | `npm run test:e2e:critical` |
| E2E a11y            | `npm run test:e2e:axe`   |
| E2E nav + a11y      | `npm run test:e2e:nav`   |
| Production smoke    | `npm run test:e2e:production:smoke` |
| Production full     | `npm run test:e2e:production`      |

## Ownership & Updates

- **Owner:** Core maintainer
- **Update:** When adding/removing E2E specs, changing CI jobs, or renaming tags; keep this audit and `docs/TESTING.md` in sync.
