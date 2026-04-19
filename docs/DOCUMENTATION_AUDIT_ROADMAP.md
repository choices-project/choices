# Documentation ↔ codebase audit roadmap

_Last updated: April 19, 2026_  
_Audience: new developers and maintainers doing a truth-alignment pass_

This document is the **master checklist** for making every piece of documentation, inline comment, governance rule, and onboarding step **match the actual application** (routes, schema, stores, env, feature flags, security boundaries). It is intentionally detailed so you can execute it in order without guessing what “done” means.

**Progress (April 2026):** `docs/ARCHITECTURE.md`, `docs/TRUST_LAYER.md`, `docs/TESTING.md`, `docs/DATABASE_SCHEMA.md`, `docs/STATE_MANAGEMENT.md`, `docs/DEPLOYMENT.md`, **`docs/ENVIRONMENT_VARIABLES.md`** (Zod vs ad-hoc vs **`next.config.js`**), `docs/API/contracts.md`, `docs/API/README.md`, **`docs/FEEDBACK_AND_ISSUES.md`** (widget vs GitHub Issues), **`docs/README.md`** (“New here?” contributor funnel + **`COPY_FREEZE`** in Operations), `docs/WEBAUTHN_DESIGN.md`, archived **`api-contract-plan.md`** banner, **`docs/SECURITY.md`** (RLS domains, **`apiRateLimiter`** inventory, **`getSupabaseAdminClient`** route patterns + `rg`), `docs/FEATURE_FLAGS.md`, root **`README.md`** (contributor funnel + Volta/Node note), **`web/.env.local.example`**, **`docs/AGENT_SETUP.md`** (MCP + skills + [Vercel coding agents](https://vercel.com/docs/agent-resources/coding-agents)), `AGENTS.md`, **`CONTRIBUTING.md`** (two-`package.json` table, debut checklist, fixed **`governance:check`** / **`verify:docs`** cwd), **`.github/ISSUE_TEMPLATE/*`** (bug / feature / documentation), **`.github/SUPPORT.md`**, consolidated **`.github/PULL_REQUEST_TEMPLATE.md`**, **`.github/README.md`**, **`ci.yml`**. **npm** (repo root): `docs:surface-counts`, `docs:api-inventory`, `docs:public-schema-index`, **`docs:feature-flags`**, **`docs:security-snapshots`**, plus **`verify:doc-links`** (now includes **`docs/`**, root `README`/`CONTRIBUTING`/`AGENTS`/`DEPLOYMENT`, and **`.github/**/*.md`** except workflows), **`verify:store-docs`**, **`verify:architecture-boundaries`**, **`verify:architecture-schema-counts`**, **`verify-env-example.mjs`**, **`verify-mcp-config.mjs`**, all rolled into **`verify:docs`**. §3 below mixes **historical audit notes** with **verification commands**—prefer the scripts over stale prose.

### At a glance — phase status (April 2026)

Use this table before deep-diving §4–§9. “✅” means the **default acceptance criteria** for that phase are met in this repo; **rolling** means ongoing human review, not a one-time checkbox.

| Block | Status | Notes |
|-------|--------|--------|
| **P0** Governance & dead links | ✅ | `scripts/check-governance.js` targets `docs/ROADMAP.md`, `docs/STATE_MANAGEMENT.md`, `docs/API/contracts.md`, `docs/TESTING.md` / changelog (see file). **P0-5:** **`web/.env.local.example`** is committed (gitignore exception **`!.env.local.example`**); **`web/.env.test.local.example`** remains for E2E-only vars. |
| **P1** Counts & inventories | ✅ | `ARCHITECTURE.md` / diagram use **~93 tables, 7 views, ~63 RPCs**; `DATABASE_SCHEMA.md` points at generated index + total RPC count; **P1-9** admin/civics/auth spot-checks are **rolling** on each feature PR. |
| **P2** Security & product logic | ✅ | RLS, rate limits, trust layer, feature flags, WebAuthn docs aligned; **P2-1 stretch** (per-table RLS appendix) still optional. |
| **P3** Testing & contracts | ✅ | Core links done; **P3-4** “massive route inventory uncovered by tests” is **by design**—expand tests when touching an area. |
| **P4** Onboarding | ✅ | **`docs/README.md`** “New here?”; **P4-4** `AGENT_SETUP.md` + rules + `AGENTS.md`; **P4-5–P4-6** GitHub issue/PR templates, **SUPPORT.md**, **`CONTRIBUTING.md`** maintainer debut checklist; **P4-7** **`FEEDBACK_AND_ISSUES.md`** + cohesive issue templates. |
| **P5** Automation | ✅ | `verify:docs` + CI; re-run locally before merge when listed paths change. |
| **§11 A1–A6** Agents / MCP | ✅ doc | **A6** and **§3.8** env drift are **rolling** (quarterly or when tooling/env changes). |

**Full topical index:** [`docs/README.md`](README.md) (operations, API, compliance, archive).

### Deploy / CI verification log (April 19, 2026)

**Scope:** CSRF parity rollout on `main` (double-submit on mutating API routes + client `X-CSRF-Token` / `credentials: 'include'` alignment). Ground-truth for “did CI accept it?” is the Actions run linked below—not this paragraph alone.

| Step | Result | Notes |
|------|--------|--------|
| **Push** | `457959931` → `main` | Commit message: `feat(security): CSRF parity across API routes and browser callers`. |
| **Push (infra + CI pins)** | [`3e0e09c6f`](https://github.com/choices-project/choices/commit/3e0e09c6f271916d49b0a8482a72adaebb6026c2) → `main` | Trivy **`aquasecurity/trivy-action@v0.35.0`**, remove `.cursor/govinfo-mcp` gitlink, **`.gitignore`**. **pages-build-deployment:** [run 24640133184](https://github.com/choices-project/choices/actions/runs/24640133184) **success** (checkout no longer hits missing submodule URL). **CI/CD Pipeline:** [run 24640133332](https://github.com/choices-project/choices/actions/runs/24640133332) for that SHA. |
| **Push (deploy `lint:strict`)** | [`f4c7ccf82`](https://github.com/choices-project/choices/commit/f4c7ccf82) → `main` | **Continuous Deployment** failed **Pre-deployment Validation → Lint (strict mode)** on `import/order` in five files; fixed by reordering **`@/features/auth/lib/csrf-token`** vs UI imports, one blank line in **`api/shared/vote`**, and removing an intra-group blank in **`EnhancedFeedbackWidget`**. |
| **CD: Trivy pre-deploy** | [`d6b6196a7`](https://github.com/choices-project/choices/commit/d6b6196a76140a4f67d5ad8b826acc9e7b0743b0) → `main` | **Continuous Deployment** Trivy previously used **`scan-ref: .`** (entire monorepo), so **Python** lockfiles under **`services/`** produced CRITICAL/HIGH noise unrelated to the **Vercel** app. **Resolution:** **`scan-ref: web`**, **`trivyignores: .trivyignore`**, and **`.trivyignore`** entry **`GHSA-q4gf-8mx6-v5v3`** (Next.js 14 Server Components DoS; same mitigation story as **`GHSA-h25m-26qc-wcjf`**). **Verified:** [Continuous Deployment Pipeline run 24640336706](https://github.com/choices-project/choices/actions/runs/24640336706) **success**. |
| **GitHub Actions** | [Run 24639702397](https://github.com/choices-project/choices/actions/runs/24639702397) | Workflow **CI/CD Pipeline** for that SHA. |
| **Code Quality job** | Passed | Includes `npm run verify:docs`, `lint:strict`, `types:ci`, locale + i18n gates, `web` build. |
| **Contract Tests job** | Passed | `web/tests/contracts/**` (including newer profile/privacy/onboarding suites). |
| **Playwright Smoke job** | Passed | Harness smoke path stayed green. |
| **Unit Tests job** | Failed → **fixed in follow-up** | Failure was **test drift**: `profileStore.test.ts` still expected bare `fetch('/api/profile', { method, body })` after the store began sending **`X-CSRF-Token`** and **`credentials: 'include'`**. Resolution: `jest.mock('@/features/auth/lib/csrf-token')` + updated `toHaveBeenCalledWith` expectations — fix commit **`13363bef3`** on `main`. |
| **Full E2E job** | Failed | Log showed **accessibility-critical** specs (representatives / civics / polls list) plus **`TypeError: fetch failed`** from the dev server—triage as **flake or env**, not attributed to CSRF until reproduced with a narrowed repro. |
| **Playwright Axe A11y job** | Failed | Separate a11y job; same triage bucket as full E2E. |
| **Security Scan job** | Failed → **fixed in follow-up** | **Infrastructure:** `Unable to resolve action aquasecurity/trivy-action@0.24.0`. **Resolution:** pin all workflows to **`aquasecurity/trivy-action@v0.35.0`** (same change across `ci.yml`, `web-ci.yml`, `test.yml`, `deploy.yml`). **Not** caused by application CSRF edits. |
| **CD / Pages checkout** | Failed → **fixed in follow-up** | **Infrastructure:** index had a **gitlink** for `.cursor/govinfo-mcp` without a `.gitmodules` URL (`No url found for submodule path ...`), breaking checkout for jobs that need the full tree. **Resolution:** `git rm --cached .cursor/govinfo-mcp` (drop the stray gitlink only) and **`.gitignore`** `.cursor/govinfo-mcp/` so a local MCP clone is not tracked. |
| **Vercel production** | Not exercised here | After Vercel finishes deploying `main`, manually smoke **login**, **profile preference save**, **vote**, **contact submit** (if feature on), and **poll close** as cookie + CSRF-sensitive flows. |

---

## 1. How to use this roadmap

1. **Treat the codebase as ground truth** for behavior. Treat **generated artifacts** (`web/types/supabase.ts`) as ground truth for the remote schema **as last generated** (regenerate after migrations).
2. **Work in phases** §4–§9 (P0–P5). Do not skip **Phase 0**—broken governance and dead links waste time on every PR. Cross-cutting habits: **§10**; agent/MCP specifics: **§11**; commands: **§12**.
3. When you fix a claim, **add or cite a durable source** (script output, link to generator command, or “verified in file X line Y”) so the next person can re-verify in one step.
4. For **new-developer ergonomics**, prefer one **canonical doc per topic**; archive or clearly label historical docs so search does not surface contradictions.

---

## 2. Ground-truth sources (single sources of truth)

| Dimension | Authoritative source | How to refresh / verify |
|-----------|---------------------|-------------------------|
| HTTP API surface | `web/app/api/**/route.ts` | `npm run docs:surface-counts` (`nextJsRouteHandlers`) + `npm run docs:api-inventory` → `docs/API/inventory.md` |
| Client + server env vars | **`web/lib/config/env.ts`** (Zod, `env` proxy) + ad-hoc `process.env` elsewhere | Inventory + semantics in **`docs/ENVIRONMENT_VARIABLES.md`**; extend **`env.ts`** when a variable should be startup-validated; `rg process.env web/` for drift |
| Supabase tables / views / RPCs | `web/types/supabase.ts` (`Database['public']`) | `npm run types:generate` from `web/` (per `GETTING_STARTED`) + `npm run docs:public-schema-index` + `docs:surface-counts` |
| Zustand stores | `web/lib/stores/*.ts` + `web/lib/stores/index.ts` | Count `*Store.ts`; distinguish **modules** vs **logout cascade** (see §5.2) |
| Feature flags | `web/lib/core/feature-flags.ts` | `npm run docs:feature-flags` → `docs/FEATURE_FLAGS.md` (marked sections); compare narrative to `docs/ROADMAP.md` |
| Auth/session behavior | `web/lib/stores/userStore.ts` (`cascadeDependentStoreReset`), `web/contexts/AuthContext.tsx` | Trace `signOut` / `setSessionAndDerived` |
| RLS & DB constraints | `supabase/migrations/*.sql` (repo root `supabase/`) | Read migrations; do not assume `DATABASE_SCHEMA.md` is exhaustive |
| Doc index & navigation | **`docs/README.md`** | Tables link to deployment, security, API, agent setup, audit roadmap |
| Agent / Cursor / MCP | **`docs/AGENT_SETUP.md`**, **`.cursor/mcp.json`**, **`.cursor/rules/projectruleschoices.mdc`**, **`.agents/skills/`** | After MCP or skill path changes, update **`AGENT_SETUP.md`** and **§11** checklist |
| CI documentation gates | **`.github/workflows/ci.yml`** (`verify:docs`) | Same checks as local `npm run verify:docs`; requires `ripgrep` in CI |
| GitHub contributor UX | **`.github/ISSUE_TEMPLATE/`**, **`PULL_REQUEST_TEMPLATE.md`**, **`SUPPORT.md`**, **`CONTRIBUTING.md`** (workflow + labels) | Relative links in templates checked by **`verify:doc-links`** |
| User feedback vs GitHub Issues | **`docs/FEEDBACK_AND_ISSUES.md`**, **`EnhancedFeedbackWidget`**, **`POST /api/feedback`**, **`.github/ISSUE_TEMPLATE/*`** | Widget success copy + templates stay aligned; **`docs/ARCHITECTURE.md`** “Where to change what” row |

---

## 3. Snapshot: verified inconsistencies (April 2026)

These were verified in this worktree so you can prioritize fixes without rediscovering them.

### 3.1 Governance / pre-commit (`scripts/check-governance.js`)

- **Issue**: `store-governance` required **`docs/ROADMAP_SINGLE_SOURCE.md`**, which **does not exist** at repo root (only under `docs/archive/...`). Any commit touching `web/lib/stores/` would demand updates to a dead path.
- **Issue**: `api-contracts` allowed **`docs/TESTING/api-contract-plan.md`**, which **does not exist** outside **`docs/archive/reference/testing/...`**.
- **Remediation**: Point rules at **active** files (e.g. `docs/ROADMAP.md`, `docs/STATE_MANAGEMENT.md`, `docs/API/contracts.md`, `docs/TESTING.md`, `docs/archive/release-notes/CHANGELOG.md`). *(Applied in repo alongside this roadmap.)*

### 3.2 Architecture & database docs vs generated types

| Historical bad claim | Ground truth (`web/types/supabase.ts`, Apr 2026) | Remediation |
|---------------------|--------------------------------------------------|-------------|
| “70+ tables”, “19 RPC” in old marketing copy | **93** `public.Tables`, **63** `public.Functions`, **7** `public.Views` | Diagram/counts in `docs/ARCHITECTURE.md`; **`npm run docs:surface-counts`** |
| Hand-maintained table/RPC bullets in `DATABASE_SCHEMA.md` | Prior lists **omitted tables** and misclassified **`user_voting_history`** / **`idempotency_monitor`** as tables | **`docs/DATABASE_SCHEMA_PUBLIC_INDEX.generated.md`** via **`npm run docs:public-schema-index`** |

**Views**: seven under `public.Views`, including **`idempotency_monitor`**, **`user_voting_history`**, OpenStates `*_v` helpers, **`voter_registration_resources_view`**.

### 3.3 Zustand stores

- **Store modules** (top-level `*Store.ts` under `web/lib/stores/`, excluding `baseStoreActions.ts`, `index.ts`, `storage.ts`, `types*.ts`, `services/`): **21** files (e.g. `appStore`, `deviceStore`, `performanceStore` exist in addition to cascade stores).
- **Logout cascade** (`userStore.ts` → `cascadeDependentStoreReset`): **17** stores—docs that say “17 stores” without qualification are **ambiguous** (readers think total store count).

### 3.4 API route inventory vs `docs/API/README.md`

- **Cardinality moves with the tree**—verify with `npm run docs:surface-counts` (`nextJsRouteHandlers`) and **`docs/API/inventory.md`** (`npm run docs:api-inventory`). Example: **175** handlers (`docs:surface-counts` **`generatedAt` 2026-04-05** in this clone—re-run after large route changes).
- `docs/API/README.md` documents a **small subset**. High-value spot checks: admin routes, civics (`/api/v1/civics/...`), auth, webhooks—folder names must equal URL segments.

### 3.5 Environment template

- **Remediated (Apr 2026):** **`web/.env.local.example`** lists all **`env.ts`** keys (required block filled with placeholders; optional commented). Root **`README.md`** and **`docs/GETTING_STARTED.md`** use **`cp .env.local.example .env.local`**. **`.gitignore`** un-ignores **`!.env.local.example`** and **`!.env.test.local.example`** under the **`.env.*`** rule.

### 3.6 Supabase CLI working directory

- **Remediated (Apr 2026):** **`docs/GETTING_STARTED.md`** documents `supabase link` from **repository root** (sibling of `web/`), then returning to `web/` for `types:generate` and dev.

### 3.7 Feature flag cross-reference

- **Remediated in `web/` (Apr 2026):** `rg FEATURE_STATUS web/` returns no matches—live code points at **`docs/ROADMAP.md`** for quarantine / product notes. Archive-only docs may still mention `FEATURE_STATUS.md`; that is expected noise under `docs/archive/`.

### 3.8 Zod env schema vs push / `process.env`

- **Remediated (Apr 2026):** **`web/lib/config/env.ts`** names match **`/api/pwa/notifications/send`**: optional server keys **`WEB_PUSH_VAPID_PUBLIC_KEY`**, **`WEB_PUSH_VAPID_PRIVATE_KEY`**, **`WEB_PUSH_VAPID_SUBJECT`** (replacing a mistaken **`WEB_PUSH_PRIVATE_KEY`** entry). **`docs/ENVIRONMENT_VARIABLES.md`** § intro lists the full Zod set vs variables read only ad-hoc (Upstash, Sentry, cron, legacy `VAPID_*` fallbacks, etc.).
- **Follow-up (Apr 2026):** **`getValidatedEnv()`** is the source for Supabase URL/anon/service keys in **`web/utils/supabase/server.ts`**, **`api-route.ts`**, and **`client.ts`** (CI/test placeholders unchanged in **`env.ts`**); **`middleware.ts`** reads **`NEXT_PUBLIC_SUPABASE_URL`** and **`NEXT_PUBLIC_ENABLE_E2E_HARNESS`** via **`env`**. **`NEXT_PUBLIC_ENABLE_E2E_HARNESS`** is read through **`env`** everywhere in app/lib/features code (stores, WebAuthn routes, admin auth, profile/dashboard/civics UI, E2E harness pages); **Playwright configs, `web/tests/e2e/**`, and archived specs** still use **`process.env`** so runners can toggle harness without importing the Next bundle.
- **Also (Apr 2026):** **`ADMIN_MONITORING_KEY`**, Resend/Congress, service-role + public Supabase keys across shared civics/user API routes and civics services, hashtags, **`robots`** / **`sitemap`**, root layout JSON-LD, poll OG image, admin pages, login/diagnostics/representatives, **`/api/health/ingest`** (still allows raw **`SUPABASE_URL`**). Remaining **`process.env`** in app code: ad-hoc flags (**`PLAYWRIGHT_*`**, **`AUTH_RATE_LIMIT_ENABLED`**, **`DEBUG_MIDDLEWARE`**, **`DEBUG_DASHBOARD`**, **`NODE_ENV`**, etc.)—not **`NEXT_PUBLIC_ENABLE_E2E_HARNESS`** outside Playwright/test files.
- **Ongoing drift check (Apr 2026):** `rg -l 'process\.env' web/` still hits **100+** files because **tests**, **Playwright configs**, **`next.config.js`**, **Sentry**, **scripts/**, **E2E harness routes**, and **archived specs** legitimately read the environment without going through **`env`**. For **product** code under `web/app`, `web/lib`, `web/features`, `web/contexts`, `web/hooks`, `web/utils`, plus **`middleware.ts`**, treat new **`process.env`** reads as **candidates** for **`env.ts`** when the value is a **typed, validated** app secret or public flag; otherwise document the exception in **`ENVIRONMENT_VARIABLES.md`**. Re-run **`rg process.env web/`** after env refactors and update this bullet’s narrative if patterns change.

### 3.9 Backlog & rolling maintenance (prioritized)

Work that is **not** fully automatable or is **optional**—pick items by impact.

| Priority | Item | Owner / trigger |
|----------|------|-------------------|
| Env | Migrate remaining **product** `process.env` reads into **`env.ts`** where validation adds value; document exceptions in **`ENVIRONMENT_VARIABLES.md`** (includes **build-time / `next.config.js`** keys outside Zod) | Any PR touching config |
| MCP | Keep **`.cursor/mcp.json`** free of **machine-specific absolute paths**; script-based servers use **`bash .cursor/...`** from repo root. **`govinfo`** requires a local venv under **`.cursor/govinfo-mcp/`** | New clone / MCP edits |
| Agents | **§11 A6**: Re-read [Vercel coding agents](https://vercel.com/docs/agent-resources/coding-agents) when upgrading terminal agent tooling | Quarterly or on Vercel announcements |
| Skills | Diff **`.agents/skills/*`** against upstream Vercel/Supabase skill repos when you want latest agent guidance | Ad hoc |
| P2 stretch | Per-table RLS appendix in **`SECURITY.md`** | Security deep-dive |
| P1-9 | Spot-check new/changed **admin**, **civics**, **auth** routes vs **`docs/API/README.md`** claims | Each relevant PR |
| Product docs | Keep **`docs/ROADMAP.md`** and **`README.md`** marketing claims aligned with **`verify:docs`** counts when you change positioning | Release prep |
| Template links | After editing **`.github/*.md`** or issue templates, run **`npm run verify:doc-links`** or full **`verify:docs`** | Any PR touching GitHub templates |
| Feedback ↔ Issues narrative | Changing **`EnhancedFeedbackWidget`**, **`/api/feedback`**, admin feedback pages, or issue-template “Before you file” text → update **`docs/FEEDBACK_AND_ISSUES.md`** and spot-check **`CONTRIBUTING.md`** / **`SUPPORT.md`** | Any PR touching those surfaces |

### 3.10 Collaborator & GitHub surfaces (Apr 2026 audit)

- **Done:** Single **PR template** (removed duplicate merged template). **Issue templates:** bug, feature, documentation + **`config.yml`** (`blank_issues_enabled: true`). **`.github/SUPPORT.md`** routes questions vs security. **`CONTRIBUTING.md`** clarifies **`web/`** vs **repo root** for `governance:check` / `verify:docs`; **maintainer debut** checklist (labels, Issues, security inboxes). **`docs/GETTING_STARTED.md`** no longer implies **`governance:check`** runs from **`web/`**. **`docs/README.md`** adds **“New here?”** table. **`verify-doc-links.mjs`** extended to **`.github/**/*.md`** (skips **`workflows/`**) so template links stay valid in CI.
- **Rolling:** When the repo is public, ensure GitHub **labels** exist (**`good first issue`**, **`help wanted`**) to match **`CONTRIBUTING.md`**.
- **Cohesion (Apr 2026):** **`docs/FEEDBACK_AND_ISSUES.md`** explains **widget → `/api/feedback` → Admin Feedback** vs **GitHub Issues** for OSS work. **`.github/ISSUE_TEMPLATE/*`** and **`.github/SUPPORT.md`** route product users to the widget; **success UI** in **`EnhancedFeedbackWidget`** nudges code contributors toward Issues.
- **Architecture map (Apr 2026):** **`docs/ARCHITECTURE.md`** § **Where to change what** links the widget, feedback API, admin feedback UI, and **`FEEDBACK_AND_ISSUES.md`** for discoverability.
- **Feedback doc precision (Apr 2026):** **`FEEDBACK_AND_ISSUES.md`** §4 lists admin feedback routes including **generate-issue** / **bulk-generate-issues** (GitHub REST + **`GITHUB_ISSUES_*`** env); **`VISION.md`** i18n line matches **CI** + **`COPY_FREEZE.md`**.
- **Onboarding mesh (Apr 2026):** **`GETTING_STARTED.md`** i18n commands + **`COPY_FREEZE`** / **`CONTRIBUTING`** pointers; **Getting Help** links **`FEEDBACK_AND_ISSUES`**; root **`README.md`** i18n feature line; **`ARCHITECTURE.md`** feedback row points at **`FEEDBACK_AND_ISSUES` §4**; **`AGENTS.md`** reminds agents to update that doc when touching feedback surfaces.

---

## 4. Phase 0 — Fix broken references and CI/governance (P0)

**Goal**: No documentation, comment, or script points at missing paths; pre-commit rules are satisfiable.

| ID | Task | Acceptance criteria |
|----|------|---------------------|
| P0-1 | Update `scripts/check-governance.js` | Triggers reference files that exist **at commit time**; message text matches actual filenames. |
| P0-2 | Grep for **`ROADMAP_SINGLE_SOURCE`**, **`FEATURE_STATUS.md`**, **`docs/TESTING/api-contract-plan`** from non-archive code | Replace with `docs/ROADMAP.md`, canonical feature section, or `docs/TESTING.md` / archive pointer. |
| P0-3 | Root **`README.md`** quick start | Remove or replace `cp .env.local.example`; align with `GETTING_STARTED.md` + `ENVIRONMENT_VARIABLES.md`. |
| P0-4 | **`docs/GETTING_STARTED.md`** Supabase steps | `supabase link` / migrations / `types:generate` document correct **cwd** (repo root vs `web/`). |
| P0-5 | **`web/.env.local.example`** | **Done:** matches **`web/lib/config/env.ts`**; linked from **`README.md`**, **`GETTING_STARTED.md`**, **`ENVIRONMENT_VARIABLES.md`**. |

---

## 5. Phase 1 — Numbers, inventories, and tables of contents (P1)

**Goal**: Every numeric boast in architecture (`stores`, `tables`, `RPCs`, `routes`) is either **accurate** or **explicitly qualified** (“documented subset”, “as of last types generation”).

### 5.1 Database / RPC / views

| ID | Task | Acceptance criteria |
|----|------|---------------------|
| P1-1 | **`docs/ARCHITECTURE.md`**: replace “70+ tables”, “19 RPC” | **Done (Apr 2026):** diagram + narrative use **~93 tables, 7 views, ~63 RPCs** tied to generated types. |
| P1-2 | **`docs/DATABASE_SCHEMA.md`**: RPC section + totals | **Done (Apr 2026):** **“RPC Functions”** links full list in **`DATABASE_SCHEMA_PUBLIC_INDEX.generated.md`**; narrative = **commonly referenced** RPCs only; **63** total stated explicitly. |
| P1-3 | Reconcile **`calculate_trust_weighted_votes`** | **Done (doc policy):** RPC may remain on remote DB / types until dropped by migration; **`docs/DATABASE_SCHEMA.md`** + **`docs/TRUST_LAYER.md`** mark it **legacy / forbidden for product tallies**. Optional later: migration to drop function + regen types. |
| P1-4 | Scripts at repo root | **Done:** **`npm run docs:surface-counts`** (JSON counts). **`npm run docs:public-schema-index`** → generated index; **`verify:docs`** asserts index counts vs `web/types/supabase.ts`. |

### 5.2 State management

| ID | Task | Acceptance criteria |
|----|------|---------------------|
| P1-5 | **`docs/ARCHITECTURE.md`**, **`docs/STATE_MANAGEMENT.md`** | Distinguish **“N Zustand store modules”** vs **“M stores in logout cascade”**; list the **4** stores (example: `userStore`, `appStore`, `deviceStore`, `performanceStore`) **not** in cascade if still true—verify in `userStore.ts`. |
| P1-6 | **`docs/STATE_MANAGEMENT.md`** cascade list | Matches **order and names** in `cascadeDependentStoreReset` exactly. **`verify:store-docs`** enforces counts plus **cascade order** vs **`STATE_MANAGEMENT.md`** and **`ARCHITECTURE.md`** (label map in `scripts/verify-store-docs.mjs`). |

### 5.3 API inventory

| ID | Task | Acceptance criteria |
|----|------|---------------------|
| P1-7 | **`docs/API/inventory.md`** (generated) | Table: path, methods (`npm run docs:api-inventory`); row count must match `nextJsRouteHandlers` from `docs:surface-counts` unless exclusions are documented (`route.ts` only). |
| P1-8 | **`docs/API/README.md`** | **Done:** overview states illustrative sections; links **`inventory.md`** + **`verify:docs`**. |
| P1-9 | Spot-check high-risk areas | Admin routes, civics (`/api/v1/civics/...`), auth, webhooks—folder names = URL segments. |

---

## 6. Phase 2 — Behavior, security, and product logic (P2)

**Goal**: Docs describe what the code **actually enforces** (RLS, rate limits, equal voting, trust-tier semantics).

| ID | Task | Acceptance criteria |
|----|------|---------------------|
| P2-1 | **RLS** | **`docs/SECURITY.md`** — overview + **policy domains** + **service-role** section with **`rg`** inventory; distinct admin-route **count** auto-synced (**`docs:security-snapshots`** / **`verify:docs`**). **Stretch:** per-table policy appendix. |
| P2-2 | **Rate limiting** | **`docs/API/README.md`** + **`docs/SECURITY.md`** — **`apiRateLimiter`** inventory table + auto snapshot (**`docs:security-snapshots`** / **`verify:docs`**); **Postgres `rate_limits` vs Upstash** matrix in **`SECURITY.md`** (DB table not used from `web/` for throttling; Upstash enforces route limits). |
| P2-3 | **Equal voting vs trust-tier analytics** | **`docs/TRUST_LAYER.md`** — “Database analytics (`calculate_trust_*` RPCs)” links `DATABASE_SCHEMA.md`, voting integrity policy, `ROADMAP.md`. |
| P2-4 | **Feature flags** | **`docs/FEATURE_FLAGS.md`** — mutable + always-on tables sync from `feature-flags.ts` via **`npm run docs:feature-flags`**; **`verify:docs`** runs **`generate-feature-flags-doc.mjs --check`**. |
| P2-5 | **WebAuthn / session** | **`docs/WEBAUTHN_DESIGN.md`** — “Sessions, cookies, and logout” + rate-limit bypass pointer to **`authenticate/verify/route.ts`**. |

---

## 7. Phase 3 — Testing and contracts (P3)

**Goal**: What we test matches what we ship; governance “contract” files reflect reality.

| ID | Task | Acceptance criteria |
|----|------|---------------------|
| P3-1 | **`docs/TESTING.md`** | **Updated:** intro + Contracts CI bullets link **`docs/API/contracts.md`** and **`npm run verify:docs`**. |
| P3-2 | **`docs/API/contracts.md`** | **Updated:** “Error codes and helpers” table aligned to **`response-utils.ts`** / **`types.ts`**. |
| P3-3 | Archived **`api-contract-plan.md`** | **Done:** superseded banner in archive file; **`contracts.md`** links it as historical. |
| P3-4 | Contract tests | **`docs/TESTING.md`** — contract file ↔ route table; **`contracts.md`** links to it. Massive inventory still uncovered by design. |

---

## 8. Phase 4 — Onboarding and mental models (P4)

**Goal**: A new developer can answer “where do I change X?” in under five minutes.

| ID | Task | Acceptance criteria |
|----|------|---------------------|
| P4-1 | **`docs/ARCHITECTURE.md`** | **Done:** diagram + tree include **`web/contexts/`**; **Where to change what** links **AuthContext** + WebAuthn doc. |
| P4-2 | **`AGENTS.md` / `CONTRIBUTING.md`** | **Updated:** `AGENTS.md` + governance section in **`CONTRIBUTING.md`** link **`DOCUMENTATION_AUDIT_ROADMAP.md`**. |
| P4-3 | **“Change X → file Y”** mini-index | **`docs/ARCHITECTURE.md`** — “Where to change what” table. |
| P4-4 | **`docs/AGENT_SETUP.md`** | Canonical **Cursor + MCP + skills** entry; distinguishes **Vercel MCP** vs **Vercel AI Gateway**; links [Vercel coding agents](https://vercel.com/docs/agent-resources/coding-agents). Update when **`.cursor/mcp.json`** or skill paths change. |
| P4-5 | **GitHub templates** | **Done:** **`.github/ISSUE_TEMPLATE/*`**, **`.github/PULL_REQUEST_TEMPLATE.md`**, **`.github/SUPPORT.md`**; links verified via **`verify:doc-links`**. |
| P4-6 | **`docs/README.md` onboarding funnel** | **Done:** **“New here?”** table at top links GETTING_STARTED, CONTRIBUTING, ARCHITECTURE, audit roadmap, **`AGENT_SETUP`**. |
| P4-7 | **`docs/FEEDBACK_AND_ISSUES.md`** | **Done:** Explains **widget → `/api/feedback` → `/admin/feedback`** vs **GitHub Issues**; linked from README, CONTRIBUTING, **`FEATURE_FLAGS`**, **`ARCHITECTURE`** (Where to change), **`TESTING`** (harness note), issue templates, **`SUPPORT.md`**; **IssueGenerationPanel** + **`POST .../generate-issue`** / **`bulk-generate-issues`** when **`GITHUB_ISSUES_*`** configured. |

---

## 9. Phase 5 — Automation: prevent doc drift (P5)

| ID | Task | Acceptance criteria |
|----|------|---------------------|
| P5-1 | `npm run verify:docs` | **Implemented:** `scripts/verify-docs.mjs` — `docs/API/inventory.md` total vs `route.ts` count; **`docs/DATABASE_SCHEMA_PUBLIC_INDEX.generated.md`** table/view/RPC counts vs `web/types/supabase.ts` (shared `scripts/lib/surface-counts.mjs` with `docs:surface-counts`); feature-flags `--check`; **`docs/SECURITY.md`** rg snapshots via **`sync-security-snapshots.mjs --check`**; **`scripts/verify-doc-links.mjs`** (**`docs/`** except archive, root **`README`/`CONTRIBUTING`/`AGENTS`/`DEPLOYMENT`**, **`.github/**/*.md`** except **`workflows/`**); **`scripts/verify-store-docs.mjs`**; **`scripts/verify-architecture-boundaries.mjs`**; **`scripts/verify-architecture-schema-counts.mjs`**; **`scripts/verify-env-example.mjs`**; **`scripts/verify-mcp-config.mjs`**; `rg` guard in `web/` for `FEATURE_STATUS.md`, `ROADMAP_SINGLE_SOURCE`, `docs/TESTING/api-contract-plan`. |
| P5-2 | CI job | **`verify:docs`** runs in **`.github/workflows/ci.yml`** (quality job) after installing `ripgrep`. |
| P5-3 | PR + issue templates | **Done:** consolidated **PR** checklist (testing, a11y/i18n, **`verify:docs`**, DCO); **issue** templates for bug / feature / docs; **`verify:doc-links`** covers **`.github`** Markdown. |

---

## 10. New-developer recommendations (cross-cutting)

These are **process and quality** improvements beyond single files.

1. **Prefer one canonical narrative**: `ROADMAP.md` for product status; `ARCHITECTURE.md` for structure; avoid duplicating full lists in multiple places—**link + summary**.
2. **Version tricky claims**: Schema counts, store counts, and route counts should carry **“as of &lt;date&gt;, generated from &lt;artifact&gt;”**.
3. **When archive docs contradict main docs**: add a banner at top of archive: **“Superseded by X—historical only.”**
4. **Type generation**: After every migration PR, require **`web/types/supabase.ts`** update in the same PR—keeps DATABASE_SCHEMA honest.
5. **Security**: Document **service role** usage—see **`docs/SECURITY.md`** § **Service role (`getSupabaseAdminClient`)**; run **`npm run docs:security-snapshots`** when admin-client routes change (keeps snapshot counts in sync).
6. **Agents**: Prefer **Supabase MCP** for schema; **Vercel MCP** for deploy/logs/docs in-editor; **disable `deploy_to_vercel`** (see **`docs/AGENT_SETUP.md`**). Optional: route **CLI coding agents** through [Vercel AI Gateway](https://vercel.com/docs/agent-resources/coding-agents) for unified billing and model choice—team policy only; never commit gateway keys.
7. **GitHub templates:** Editing **`.github/`** Markdown (PR body, issue templates, **SUPPORT**) requires valid **relative** links—**`npm run verify:doc-links`** catches drift before merge.
8. **Feedback vs Issues:** Keep **`docs/FEEDBACK_AND_ISSUES.md`** the single narrative for widget + GitHub triage; cross-links in **ARCHITECTURE**, **FEATURE_FLAGS**, **TESTING** (harness), and **TROUBLESHOOTING** should stay in sync when behavior changes.

---

## 11. AI, MCP, and agent-tooling alignment

**Goal**: Humans and agents use the same **documented** wiring for Cursor, MCP, and optional terminal agents—without conflating **platform MCP** with **LLM API routing**.

| ID | Task | Acceptance criteria |
|----|------|---------------------|
| A1 | **Canonical agent doc** | **`docs/AGENT_SETUP.md`** exists at repo root `docs/`; **`.cursor/rules/projectruleschoices.mdc`** links it; **`AGENTS.md`** points new contributors there for MCP/skills. |
| A2 | **Vercel MCP (in Cursor)** | **`https://mcp.vercel.com`** in **`.cursor/mcp.json`**; rules state **no `deploy_to_vercel`**; doc explains using MCP for **deployments context, logs, product docs**—not for pushing production from the agent. |
| A3 | **Vercel AI Gateway (optional, terminal agents)** | Documented in **`AGENT_SETUP.md`**: [Coding agents](https://vercel.com/docs/agent-resources/coding-agents) — base URL **`https://ai-gateway.vercel.sh`**, single dashboard for spend/traces, compatible with Claude Code / Codex / OpenCode / etc. **Out of repo**: keys live in developer env only. |
| A4 | **Skills SSOT** | Repo skills under **`.agents/skills/`** (`vercel-react-best-practices`, `supabase-postgres-best-practices`); **`.cursor/rules`** names those paths so every clone gets the same guidance. When Vercel or Supabase publish skill updates, sync folders or note divergence in **`AGENT_SETUP.md`**. |
| A5 | **Local MCP bundle** | **`.cursor/mcp-servers/README.md`** documents install + env mapping (e.g. **`CONGRESS_GOV_API_KEY`** → **`CONGRESS_API_KEY`** for LegisMCP / us-gov-open-data per **`mcp.json`**). |
| A6 | **Quarterly skim** | Re-read **`.cursor/mcp.json`** and [Vercel agent docs](https://vercel.com/docs/agent-resources/coding-agents) for new tools or env names; update **`AGENT_SETUP.md`** and this table if the recommended integration changes. |

**Remaining work (rolling):** any new **`process.env`** in product paths (§3.8); **`verify-mcp-config`** rejects `/Users/…` paths in **`mcp.json`**—use repo-relative **`bash .cursor/...`** scripts; **govinfo** still needs a local venv under **`.cursor/govinfo-mcp/`**.

---

## 12. Appendix: quick verification commands

```bash
# Repo root — canonical counts + full public schema lists
npm run docs:surface-counts
npm run docs:public-schema-index
npm run docs:api-inventory
npm run docs:feature-flags
npm run docs:security-snapshots
# Focused checks (also run inside verify:docs):
npm run verify:doc-links   # docs/, root *.md, .github/**/*.md (not workflows/)
npm run verify:store-docs
npm run verify:architecture-boundaries
npm run verify:architecture-schema-counts
npm run verify:env-example
npm run verify:mcp-config
npm run verify:docs

# Store modules (must equal cascade narrative in docs/STATE_MANAGEMENT.md)
ls web/lib/stores/*Store.ts 2>/dev/null | wc -l

# Dead doc pointers from active source (archive excluded)
rg -n "FEATURE_STATUS|ROADMAP_SINGLE_SOURCE|api-contract-plan" --glob '!docs/archive/**' web/

# API routes using Supabase service role (bypasses RLS)
rg -l "getSupabaseAdminClient" web/app/api --glob '**/route.ts' | sort

# process.env in product-ish paths (tune globs; excludes tests/playwright by default)
rg -n 'process\.env' web/app web/lib web/features web/contexts web/hooks web/utils web/middleware.ts 2>/dev/null | head -80
```

---

## 13. Completion definition

This audit is **complete** when:

- **P0** items are ✅ (no broken governance targets; README/env/Supabase cwd accurate; no dead `FEATURE_STATUS` references in active code), including **P0-5** **`.env.local.example`**.
- **P1** numeric and inventory claims match generated sources or are explicitly scoped (**§3.9** tracks rolling spot-checks).
- **P2** security and voting/trust narratives match code paths new developers can trace.
- **P3–P4** testing and onboarding docs reference the same contracts as production (**P4-4** **`AGENT_SETUP`**, **P4-5–P4-7** GitHub templates, feedback vs Issues doc, docs index funnel).
- **P5** (optional but recommended) automation catches the next drift before merge.
- **§11 (A1–A6)** agent/MCP/skills alignment is **documented and kept current** when `.cursor/mcp.json` or Vercel’s coding-agent guidance changes materially.

**Stretch / rolling** items (optional RLS appendix, upstream skill sync) do **not** block calling the audit “complete”; track them in **§3.9**.

---

_Maintenance: update **§3** snapshots (including **§3.10** collaborator/GitHub + feedback cohesion), **§ “At a glance”**, and **P4-5–P4-7** when onboarding, templates, or **`FEEDBACK_AND_ISSUES`** change; bump **Last updated** at the top._
