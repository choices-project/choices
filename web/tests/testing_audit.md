### Testing Audit (October 2025)

created at: 2025-10-20
updated at: 2025-10-20

This document audits the web application's testing stack: structure, configs, helpers, mocks, and common issues. It is intended to enable another AI or engineer to quickly troubleshoot and improve reliability and speed.

## Executive Summary

- **Frameworks**: Jest (unit/integration), Playwright (E2E), Testing Library, TypeScript.
- **Config shape**: Multi-project Jest with separate client/server configs, Playwright config present, ESLint flat config enabled. Root Jest wires `projects` to client/server and defines coverage reporters and directories.
- **Primary risks found**:
  - Global `moduleNameMapper` forces mocks for feeds/hashtags and `@/lib/auth` in multiple configs, and there are additional virtual mocks in setup files. These collide with per-test `jest.mock(...)` and cause mock shape mismatches (e.g., `mockReturnValue is not a function`).
  - Alias references to non-existent `@/lib/auth` (real auth code is under `@/lib/core/auth` and `@/features/auth`).
  - Duplication of test files across `tests/jest` and `tests/unit` for similar areas (e.g., `hashtags`), increasing maintenance and flake risk.
  - Env logging noise from `dotenv` during tests; can be quieted to speed runs and reduce log churn.

- **Immediate actions recommended**:
  1. Remove global mock mappers for feeds/hashtags and `@/lib/auth` from all Jest configs, and delete virtual mocks for these in setup files. Rely on per-test `jest.mock(...)` within feeds tests.
  2. Remove `@/lib/auth` forced mapping. Mock only real import paths if/when needed (e.g., `@/lib/core/auth/*`).
  3. Consolidate duplicate suites under one hierarchy (`tests/jest/unit/...`) and delete stale duplicates under `tests/unit/...` where overlapping.
  4. Make `.env` logging quiet in Jest setup and Playwright global setup.
  5. Add a dedicated feeds-only Jest tag/path pattern to accelerate focused runs.
  6. Keep only stable global mocks (e.g., `lucide-react`).

## Directory Structure (high-level)

```
web/tests/
  ├─ __mocks__/                # Local route mock(s)
  ├─ auto-fix/                 # Test auto-fix pipeline
  ├─ error-prevention/         # Lint-like tests enforcing style/constraints
  ├─ eslint/                   # (empty or auxiliary)
  ├─ features/                 # Legacy unit tests (pre-Jest restructure)
  ├─ fixtures/                 # Test fixtures (e.g., webauthn types)
  ├─ helpers/                  # Shared helpers for Supabase, DB, etc.
  ├─ integration/              # Legacy integration location
  ├─ jest/                     # Primary Jest test tree
  │  ├─ __mocks__/             # Jest-specific shared mocks (centralized)
  │  ├─ helpers/               # Jest helpers: auth, pwa, rate-limit, store
  │  ├─ integration/           # Jest integration tests
  │  ├─ setup/                 # Jest setup-specific helpers (Supabase)
  │  └─ unit/                  # Jest unit tests by domain (features, lib, perf)
  ├─ playwright/               # Playwright E2E suites + helpers + docs
  ├─ unit/                     # Legacy second unit-tests tree (duplicates)
  └─ utils/                    # Shared test utilities (e.g., hydration)
```

Notes:
- Two parallel trees exist for unit tests: `tests/jest/unit` and `tests/unit`. Prefer the former and plan a migration to eliminate duplication.
- Centralized Jest mocks are correctly placed under `tests/jest/__mocks__` (best practice).

## Jest Configuration

- Root: `web/jest.config.js`
  - Uses `next/jest` to create config; exports a combined config.
  - Has `projects` array wiring:
    - `web/jest.client.config.js` (jsdom, client tests)
    - `web/jest.server.config.js` (node, server tests)
  - Defines results/coverage outputs (`testResultsProcessor`, `coverageReporters`, `coverageDirectory`).
  - Currently forces mappings for feeds/hashtags/auth and `lucide-react`. Keep only icon library mocks.

- Client: `web/jest.client.config.js`
  - `displayName: 'client'`, `testEnvironment: 'jsdom'`.
  - `setupFilesAfterEnv: ['<rootDir>/jest.setup.js']`.
  - `testMatch` includes `tests/jest/unit/**/*.{test,spec}.{js,jsx,ts,tsx}` and app/components.
  - `moduleNameMapper` includes CSS handling and aliases, but also forces app-specific mocks (feeds/hashtags/auth) that should be removed.

- Server: `web/jest.server.config.js`
  - `displayName: 'server'`, `testEnvironment: 'node'`.
  - `setupFilesAfterEnv: ['<rootDir>/jest.server.setup.js']`.
  - `testMatch` includes `tests/jest/**/*.{test,spec}.{js,jsx,ts,tsx}` and `lib`.
  - Also forces app-specific mocks (feeds/hashtags/auth) that should be removed.

- Global setup/teardown (present):
  - `web/jest.global-setup.js`, `web/jest.global-teardown.js` (found in repo), and possibly `jest.results-processor.js`.

### Jest Setup Files

- `web/jest.setup.js` (client/jsdom)
  - Adds `@testing-library/jest-dom`.
  - Loads `.env.local` via `dotenv` and sets test env variables.
  - Provides browser API mocks (`matchMedia`, `Notification`, service worker, PushManager, etc.).
  - Provides fetch/Response/Headers/Request polyfills when missing.
  - Mocks `next/navigation` hooks.
  - Recommendation: Set `dotenv.config({ path: '.env.local', quiet: true })` or guard logging to reduce noise.

- `web/jest.server.setup.js` (node/server)
  - Currently includes explicit mocks for Supabase and Next server, and does not need to add app-specific virtual mocks. Avoid inline `jest.mock` for app modules here; remove any virtual mocks that duplicate per-test behavior.

### Where diagnostics and coverage are written

- Jest coverage reporters and directory are set in root config.
  - See references below for exact settings.
- Playwright HTML reports are emitted under `web/playwright-report/` and JUnit XML under `web/test-results/` per CI steps.

### Project Scripts (from `web/package.json`)

- Focused Jest scripts present, including `test:feeds` using `--selectProjects client server --testPathPatterns=tests/jest/unit/features/feeds`.
- Additional scripts exist for comprehensive run categorization (fast/medium/comprehensive), linting, and types.
- Recommendation: add `test:unit` (jest-only), `test:e2e` (playwright-only), and `test:all` (orchestrated) for clarity.

## Playwright Configuration & Suites

- Config: `web/playwright.config.ts` present.
- Suites live under `web/tests/playwright/e2e/*` and include:
  - Accessibility (WCAG), cross-browser, performance (Core Web Vitals), security, onboarding, voting, unified feed, authentication, admin dashboard.
  - Helpers: `helpers/` (auth-helper, monitoring, reporter, data manager, etc.).
  - Global hooks: `global-setup.ts`, `global-teardown.ts`.
  - Several documentation files with results and roadmaps.
- Recommendation:
  - Ensure `use: { baseURL, trace, video, screenshot }` configured per CI profile.
  - Tag suites for parallelization and selective CI runs.

## ESLint (Flat Config) and TypeScript

- ESLint: `web/eslint.config.mjs` (renamed, exported default) with `ignores` fully migrated from `.eslintignore`.
  - Test overrides should include `languageOptions.globals = { ...globals.jest }` for Jest test files (present).
  - Module type warning fixed by using `.mjs`.

- TypeScript: Tests are TypeScript-heavy; a `tsconfig.eslint.json` may be used for linting; ensure test TS settings include `types: ['jest', 'node']` and proper `paths` matching the app.

## Shared Test Helpers and Fixtures

- `web/tests/jest/helpers/*`: auth, pwa, rate-limit, store helpers.
- `web/tests/helpers/*`: database utils, Supabase mocks/stubs, standardized template, README.
- `web/tests/fixtures/*`: auth/webauthn fixtures.
- `web/tests/jest/setup/supabase-mock.ts`: central Supabase mock utilities for Jest.
- Recommendation: Adopt a single source of truth for Supabase mocks to avoid drift between Jest and Playwright (consider exporting a thin adapter for Playwright’s `global-setup`).

## Mocks

- Centralized Jest mocks: `web/tests/jest/__mocks__/`
  - `auth.js`, `feedsStore.js`, `useHashtags.js` exist to support feeds tests (and others) when explicitly mapped.
  - Best practice: Prefer per-test `jest.mock('path', factory)` inside each suite when behavior varies across tests. Use centralized mocks only for stable, global fake modules (e.g., icon libraries like `lucide-react`).

## Identified Issues & Root Causes

1) `TypeError: mockUseFeeds.mockReturnValue is not a function`
   - Symptom: Feeds tests call `mockReturnValue` on a value that isn’t a jest mock.
   - Cause: A global `moduleNameMapper` provided a plain function (or non-mock) rather than a `jest.fn`, colliding with the suite’s own `jest.mock(...)` declarations.
   - Fix: Remove forced mock mappers for `@/lib/stores/feedsStore` and `@/features/hashtags/hooks/useHashtags` from all Jest configs, and delete the virtual mocks in `jest.setup.js`. Rely on the test-local `jest.mock` seen in the feeds suites. Keep centralized mocks only if the tests import those mapped paths without also calling `jest.mock`.

2) Non-existent `@/lib/auth` alias used in prior mocks
   - Real auth code is under `@/lib/core/auth/*` and `@/features/auth/*`.
   - Fix: Do not map `@/lib/auth` globally. If a suite imports auth, mock the actual imported path(s).

3) Duplicate tests across `tests/jest/unit/...` and `tests/unit/...`
   - Increases maintenance cost and conflicting assumptions.
   - Fix: Migrate remaining `tests/unit` suites into `tests/jest/unit` (or vice versa), delete duplicates, update imports.

4) Verbose dotenv logs during Jest
   - Slows logs and obscures failures.
   - Fix: Quiet dotenv in setup, or centralize env init with `{ override: true, quiet: true }`.

5) Inconsistent mock reset strategy
   - Some suites call `jest.clearAllMocks`, others rely on global state.
   - Fix: Standardize with a shared `beforeEach`/`afterEach` in a setup file for critical global mocks, or explicitly reset in each suite.

## Recommendations (Actionable)

- Jest config hygiene
  - Remove mock mappers for feeds/hashtags/auth from `moduleNameMapper` in root/client/server configs.
  - Delete `jest.mock` virtual declarations for feeds/hashtags from `jest.setup.js`.
  - Keep only stable global mocks mapped (e.g., `lucide-react`).
  - Ensure `projects` include only required patterns; avoid over-broad `testMatch` that doubles execution.

- Feeds tests
  - Keep `jest.mock('@/lib/stores/feedsStore', () => ({ useFeeds: jest.fn() }))` inside the suite, as already present.
  - Remove any global mock that changes that module’s shape.

- Consolidation
  - Choose `tests/jest/unit` as the canonical tree. Move or delete overlapping files under `tests/unit`.
  - Create a migration checklist and PR to track removed duplicates.

- Env & performance
  - Quiet dotenv logs in `jest.setup.js` and `jest.env.setup.js` using `{ quiet: true }`.
  - Consider `testPathIgnorePatterns` for large E2E directories when running unit suites.
  - Consider enabling `maxWorkers` tuning and `cache` to reduce CI wall time.

- Playwright
  - Ensure `global-setup.ts` seeds any necessary test data; isolate state per test with storage state if applicable.
  - Tag specs (`@accessibility`, `@security`, `@performance`) and use CI matrix to parallelize by tag.

- Tooling
  - Add `test:unit`, `test:e2e`, `test:all` npm scripts.
  - Add `jest --listTests` script to debug selection.
  - Consider `@swc/jest` or `ts-jest` config optimization if build times are high.

## Notable Files (for quick navigation)

- Jest configs: `web/jest.config.js`, `web/jest.client.config.js`, `web/jest.server.config.js`
- Jest setup: `web/jest.setup.js`, `web/jest.server.setup.js`
- Central mocks: `web/tests/jest/__mocks__/`
- Feeds tests: `web/tests/jest/unit/features/feeds/*`
- Helpers (Jest): `web/tests/jest/helpers/*`
- Supabase mocks: `web/tests/jest/setup/supabase-mock.ts`, `web/tests/helpers/supabase-mock.ts`
- Playwright suites/config: `web/playwright.config.ts`, `web/tests/playwright/e2e/*`

## Open Work Items (Suggested)

- [ ] Remove global mock mappings for feeds/hashtags/auth in all Jest configs; re-run feeds tests.
- [ ] Remove `jest.setup.js` virtual mocks for feeds/hashtags; align mocks with actual `@/lib/core/auth/*` imports if needed.
- [ ] Consolidate duplicate test trees (`tests/unit` → `tests/jest/unit`).
- [ ] Quiet dotenv logs and standardize env initialization.
- [ ] Add unit/e2e split scripts and CI jobs; tag Playwright suites.
- [ ] Add coverage thresholds and reports if desired (Jest `coverageReporters`).

---
Maintainers: After implementing the above, expect feeds tests to stabilize (mock shape alignment) and overall suite runs to be faster and quieter. Keep centralized mocks minimal, and prefer per-suite `jest.mock` to avoid collisions.

## Environment and Versions

- Runtime
  - Node: 22.19.0
  - npm: 10.9.3
  - Package manager pinned via `packageManager` and `volta`

- Core App
  - Next.js: 15.5.6
  - React: 19.0.0, React DOM: 19.0.0
  - TypeScript: 5.9.3

- Testing (Unit/Integration)
  - Jest: 30.2.0
  - @jest/globals: 30.1.2
  - jest-environment-jsdom: 30.1.2
  - @testing-library/react: 16.3.0
  - @testing-library/jest-dom: 6.8.0
  - @testing-library/user-event: 14.6.1
  - jest-axe: 10.0.0

- Testing (E2E)
  - @playwright/test: 1.56.1
  - @axe-core/playwright: 4.10.2

- Linting
  - eslint: 9.38.0 (flat config)
  - @typescript-eslint/*: 8.46.1
  - eslint-config-next: 15.5.6

- Supabase/DB
  - @supabase/supabase-js: 2.75.1
  - pg: 8.13.1

- Misc
  - dotenv: 17.2.1
  - zustand: 5.0.8
  - lucide-react: 0.546.0

## Configuration Nuggets (useful to other automation)

- Jest projects: `client` (jsdom) and `server` (node) configured via root `projects`.
- Test selection: use `--selectProjects client server` with `--testPathPatterns` for scoped runs (e.g., feeds).
- Aliases: `^@/(.*)$` → `<rootDir>/$1` (ensure tsconfig paths match to avoid resolution drift).
- Setup: `jest.setup.js` and `jest.server.setup.js` provide environment, polyfills, and router mocks.
- Playwright global setup/teardown exist; helpers include monitoring, auth, and data managers.
- Centralized Jest mocks under `tests/jest/__mocks__`; prefer per-suite mocks for modules whose behavior changes per test.

## Code References (diagnostics and problematic mappings)

Root Jest config coverage/reporters and forced mappings:
```107:121:web/jest.config.js
// Test results processor
testResultsProcessor: '<rootDir>/jest.results-processor.js',
// Coverage reporters
coverageReporters: ['text', 'lcov', 'html', 'json'],
// Coverage directory
coverageDirectory: '<rootDir>/coverage',
// Coverage path ignore patterns
coveragePathIgnorePatterns: [
  '/node_modules/',
  '/.next/',
  '/coverage/',
  '/playwright-report/',
  '/test-results/',
  '/archive/',
  // ... more code ...
]
```

Root Jest forced moduleNameMapper entries (to remove except lucide-react):
```60:76:web/jest.config.js
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
  // ... aliases ...
  '^@/lib/auth$': '<rootDir>/tests/jest/__mocks__/auth.js',
  '^@/lib/stores/feedsStore$': '<rootDir>/tests/jest/__mocks__/feedsStore.js',
  '^@/features/hashtags/hooks/useHashtags$': '<rootDir>/tests/jest/__mocks__/useHashtags.js',
  '^lucide-react$': '<rootDir>/__mocks__/lucide-react.js',
}
```

Client/server project configs also force these mappings:
```31:35:web/jest.client.config.js
'^@/lib/auth$': '<rootDir>/__mocks__/auth.js',
'^@/lib/stores/feedsStore$': '<rootDir>/__mocks__/feedsStore.js',
'^@/features/hashtags/hooks/useHashtags$': '<rootDir>/__mocks__/useHashtags.js',
```

```31:34:web/jest.server.config.js
'^@/lib/auth$': '<rootDir>/__mocks__/auth.js',
'^@/lib/stores/feedsStore$': '<rootDir>/__mocks__/feedsStore.js',
'^@/features/hashtags/hooks/useHashtags$': '<rootDir>/__mocks__/useHashtags.js',
```

Virtual mocks present in setup (to delete):
```210:229:web/jest.setup.js
jest.mock('@/lib/stores/feedsStore', () => ({
  useFeeds: jest.fn(() => []),
}), { virtual: true });

jest.mock('@/features/hashtags/hooks/useHashtags', () => ({
  useHashtags: jest.fn(() => ({
    hashtags: [],
    trendingHashtags: [],
    // ... more code ...
  })),
}), { virtual: true });
```

Centralized mock files exist (preferred only if not also mocked per-suite):
```1:3:web/tests/jest/__mocks__/auth.js
// ... existing code ...
```

Playwright artifacts directories used by CI:
```139:153:web/.github/workflows/test.yml
with:
  name: playwright-report-${{ matrix.browser }}
  path: web/playwright-report/
  // ... more code ...
  name: playwright-results-${{ matrix.browser }}
  path: web/test-results/
```

## Current Known Failures (as of this audit)

- Feeds unit tests: `mockUseFeeds.mockReturnValue is not a function` due to global forced mocks colliding with suite-local `jest.mock` declarations. Remove global mappings for the feeds/hashtags modules.

## CI Tips

- For PRs: run `npm run test:unit` first; only run Playwright tags relevant to changed areas.
- Cache Jest and Playwright artifacts between CI jobs to reduce run time.
- Consider `--maxWorkers=50%` for CI stability; raise locally.



