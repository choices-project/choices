# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Choices is a privacy-first participatory democracy platform (Next.js 14 App Router + Supabase). The main application lives in `web/`. The project is structured for **human contributors and collaborators**: see `README.md` (contributor table), `CONTRIBUTING.md`, and `CODE_OF_CONDUCT.md`. See `docs/GETTING_STARTED.md` for developer setup. For **Cursor MCP**, **project rules**, **skills**, and optional **Vercel AI Gateway** (CLI agents), see **`docs/AGENT_SETUP.md`**. When you touch **API routes**, **stores**, or **DB/schema docs**, follow **`docs/DOCUMENTATION_AUDIT_ROADMAP.md`** so inventories and contracts stay aligned. When you change the **feedback widget**, **`/api/feedback`**, **admin feedback**, or **GitHub issue templates**, keep **`docs/FEEDBACK_AND_ISSUES.md`** (§4 for admin API truth) aligned with the code.

### Runtime requirements

- **Node.js 24.11.0** and **npm 11.6.1** (enforced by `web/package.json` `engines` and `packageManager` fields). Use `nvm` to install.
- Dependencies: `cd web && npm install`
- Playwright Chromium (for E2E): `cd web && npx playwright install --with-deps chromium`

### Environment variables

From `web/`, you can start with **`cp .env.local.example .env.local`** (all keys from Zod; edit values). For a **minimal CI-style** setup, create `web/.env.local` with at least:

```
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=fake-dev-key-for-ci-only
SUPABASE_SERVICE_ROLE_KEY=dev-only-secret
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_E2E_HARNESS=1
PLAYWRIGHT_USE_MOCKS=1
```

These CI-safe placeholder values allow the dev server and E2E smoke tests to run without a real Supabase project. Pages that fetch from Supabase will show error/empty states, but routing, rendering, and harness pages work correctly.

### Key commands

| Task | Command |
|------|---------|
| Doc / inventory parity (repo root) | `npm run verify:docs` (bundles link, store, boundary, SECURITY, feature-flag, and schema checks—[`docs/README.md`](docs/README.md)) |
| Dev server (from `web/`) | `npm run dev` (port 3000) |
| Lint (from `web/`) | `npm run lint` |
| Type check (app code) | `npm run types:ci` |
| Unit tests | `npm run test` (Jest) |
| E2E smoke tests | `npm run test:e2e:smoke` |
| Full E2E | `npm run test:e2e` |
| Build | `npm run build` |

Refer to `web/package.json` scripts and `docs/TESTING.md` for the full list.

### Gotchas

- The `npm run type-check` (which uses `tsconfig.json`) reports errors on test setup files (`tests/setup.ts`); use `npm run types:ci` instead, which uses `tsconfig.ci.json` and excludes test infrastructure.
- The dev server uses Babel (not SWC) due to a custom `.babelrc` — first compile of a page is slower, but hot reload works.
- Playwright's `webServer` config auto-starts the dev server with the right env vars. Only start a server manually if you need to debug or use a headed browser.
- E2E smoke tests use `PLAYWRIGHT_USE_MOCKS=1` and `NEXT_PUBLIC_ENABLE_E2E_HARNESS=1` to run without real external services.
- When `NEXT_PUBLIC_ENABLE_E2E_HARNESS=1` is set, the middleware bypasses authentication. Tests that verify auth redirects must skip in harness mode (see `auth-redirects.spec.ts` pattern).
- Tests that require real Supabase (registration, poll creation with credentials) should `test.skip()` when `PLAYWRIGHT_USE_MOCKS=1`.
- Security audit uses `scripts/audit-high.js` with documented allowlist for known Next.js 14 advisories (mitigated by Vercel deployment). Entries have expiration dates.
- Some Jest test failures (e.g., in `tests/integration/feeds/`, `tests/unit/supabase/`) are pre-existing and not caused by environment setup.
- **MCP servers** (LegisMCP, Playwright, US Gov Open Data): Run `cd .cursor/mcp-servers && npm install` after clone. If npx cache errors occur, use `npm_config_cache=/tmp/npm-mcp-cache npm install`. See `docs/archive/2026-03-consolidation/AGENT_SETUP.md`.
