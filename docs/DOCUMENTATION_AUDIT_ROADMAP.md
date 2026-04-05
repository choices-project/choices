# Documentation ↔ codebase audit roadmap

_Last updated: April 4, 2026_  
_Audience: new developers and maintainers doing a truth-alignment pass_

This document is the **master checklist** for making every piece of documentation, inline comment, governance rule, and onboarding step **match the actual application** (routes, schema, stores, env, feature flags, security boundaries). It is intentionally detailed so you can execute it in order without guessing what “done” means.

**Progress (April 2026):** `docs/ARCHITECTURE.md`, `docs/TRUST_LAYER.md`, `docs/TESTING.md`, `docs/DATABASE_SCHEMA.md`, `docs/STATE_MANAGEMENT.md`, `docs/DEPLOYMENT.md`, `docs/API/contracts.md`, `docs/API/README.md`, `docs/WEBAUTHN_DESIGN.md`, archived **`api-contract-plan.md`** banner, **`docs/SECURITY.md`** (RLS domains, **`apiRateLimiter`** inventory, **`getSupabaseAdminClient`** route patterns + `rg`), `docs/FEATURE_FLAGS.md`, `AGENTS.md`, `CONTRIBUTING.md`, `.github/PULL_REQUEST_TEMPLATE.md`, **`ci.yml`**. **npm** (repo root): `docs:surface-counts`, `docs:api-inventory`, `docs:public-schema-index`, **`docs:feature-flags`**, **`docs:security-snapshots`**, plus focused **`verify:doc-links`**, **`verify:store-docs`**, **`verify:architecture-boundaries`**, all rolled into **`verify:docs`**. §3 below mixes **historical audit notes** with **verification commands**—prefer the scripts over stale prose.

---

## 1. How to use this roadmap

1. **Treat the codebase as ground truth** for behavior. Treat **generated artifacts** (`web/types/supabase.ts`) as ground truth for the remote schema **as last generated** (regenerate after migrations).
2. **Work in phases** (§4–§8). Do not skip **Phase 0**—broken governance and dead links waste time on every PR.
3. When you fix a claim, **add or cite a durable source** (script output, link to generator command, or “verified in file X line Y”) so the next person can re-verify in one step.
4. For **new-developer ergonomics**, prefer one **canonical doc per topic**; archive or clearly label historical docs so search does not surface contradictions.

---

## 2. Ground-truth sources (single sources of truth)

| Dimension | Authoritative source | How to refresh / verify |
|-----------|---------------------|-------------------------|
| HTTP API surface | `web/app/api/**/route.ts` | `npm run docs:surface-counts` (`nextJsRouteHandlers`) + `npm run docs:api-inventory` → `docs/API/inventory.md` |
| Client + server env vars | `web/` usage of `process.env` / `NEXT_PUBLIC_*` + Zod startup schema (if any) | Ripgrep `process.env`; align `docs/ENVIRONMENT_VARIABLES.md` |
| Supabase tables / views / RPCs | `web/types/supabase.ts` (`Database['public']`) | `npm run types:generate` from `web/` (per `GETTING_STARTED`) + `npm run docs:public-schema-index` + `docs:surface-counts` |
| Zustand stores | `web/lib/stores/*.ts` + `web/lib/stores/index.ts` | Count `*Store.ts`; distinguish **modules** vs **logout cascade** (see §5.2) |
| Feature flags | `web/lib/core/feature-flags.ts` | `npm run docs:feature-flags` → `docs/FEATURE_FLAGS.md` (marked sections); compare narrative to `docs/ROADMAP.md` |
| Auth/session behavior | `web/lib/stores/userStore.ts` (`cascadeDependentStoreReset`), `web/contexts/AuthContext.tsx` | Trace `signOut` / `setSessionAndDerived` |
| RLS & DB constraints | `supabase/migrations/*.sql` (repo root `supabase/`) | Read migrations; do not assume `DATABASE_SCHEMA.md` is exhaustive |

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

- **Cardinality moves with the tree**—verify with `npm run docs:surface-counts` (`nextJsRouteHandlers`) and **`docs/API/inventory.md`** (`npm run docs:api-inventory`). Example: **175** handlers on 2026-04-04 in this clone.
- `docs/API/README.md` documents a **small subset**. High-value spot checks: admin routes, civics (`/api/v1/civics/...`), auth, webhooks—folder names must equal URL segments.

### 3.5 Environment template

- **Remediated (Apr 2026):** Root **`README.md`** quick start tells contributors to create `web/.env.local` manually and points at **`docs/GETTING_STARTED.md`** (no `cp` from a non-existent `.env.local.example`). Optional tracked template remains **P0-5** if you want one checked in.

### 3.6 Supabase CLI working directory

- **Remediated (Apr 2026):** **`docs/GETTING_STARTED.md`** documents `supabase link` from **repository root** (sibling of `web/`), then returning to `web/` for `types:generate` and dev.

### 3.7 Feature flag cross-reference

- **Remediated in `web/` (Apr 2026):** `rg FEATURE_STATUS web/` returns no matches—live code points at **`docs/ROADMAP.md`** for quarantine / product notes. Archive-only docs may still mention `FEATURE_STATUS.md`; that is expected noise under `docs/archive/`.

---

## 4. Phase 0 — Fix broken references and CI/governance (P0)

**Goal**: No documentation, comment, or script points at missing paths; pre-commit rules are satisfiable.

| ID | Task | Acceptance criteria |
|----|------|---------------------|
| P0-1 | Update `scripts/check-governance.js` | Triggers reference files that exist **at commit time**; message text matches actual filenames. |
| P0-2 | Grep for **`ROADMAP_SINGLE_SOURCE`**, **`FEATURE_STATUS.md`**, **`docs/TESTING/api-contract-plan`** from non-archive code | Replace with `docs/ROADMAP.md`, canonical feature section, or `docs/TESTING.md` / archive pointer. |
| P0-3 | Root **`README.md`** quick start | Remove or replace `cp .env.local.example`; align with `GETTING_STARTED.md` + `ENVIRONMENT_VARIABLES.md`. |
| P0-4 | **`docs/GETTING_STARTED.md`** Supabase steps | `supabase link` / migrations / `types:generate` document correct **cwd** (repo root vs `web/`). |
| P0-5 | Optional: add **`web/.env.local.example`** | Lists all keys **names-only** or safe placeholders; matches Zod/schema; linked from README. If you **do not** add the file, P0-3 must explicitly say “create file manually—no template committed.” |

---

## 5. Phase 1 — Numbers, inventories, and tables of contents (P1)

**Goal**: Every numeric boast in architecture (`stores`, `tables`, `RPCs`, `routes`) is either **accurate** or **explicitly qualified** (“documented subset”, “as of last types generation”).

### 5.1 Database / RPC / views

| ID | Task | Acceptance criteria |
|----|------|---------------------|
| P1-1 | **`docs/ARCHITECTURE.md`**: replace “70+ tables”, “19 RPC” | Use **generated counts** or say “see `web/types/supabase.ts` / run `scripts/…`”. Include **view** count if you mention analytics. |
| P1-2 | **`docs/DATABASE_SCHEMA.md`**: RPC section title | Rename to **“Key RPC functions (documented subset)”** or **“RPC catalog”** with full list vs migration names; add **“Total RPCs in generated types: N”**. |
| P1-3 | Reconcile **`calculate_trust_weighted_votes`** | **Done (doc policy):** RPC may remain on remote DB / types until dropped by migration; **`docs/DATABASE_SCHEMA.md`** + **`docs/TRUST_LAYER.md`** mark it **legacy / forbidden for product tallies**. Optional later: migration to drop function + regen types. |
| P1-4 | Scripts at repo root | **`npm run docs:surface-counts`** (JSON counts) and **`npm run docs:public-schema-index`** (full table/view/RPC lists). Optional: fold into **`npm run verify:docs`** (P5). |

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

---

## 9. Phase 5 — Automation: prevent doc drift (P5)

| ID | Task | Acceptance criteria |
|----|------|---------------------|
| P5-1 | `npm run verify:docs` | **Implemented:** `scripts/verify-docs.mjs` — `docs/API/inventory.md` total vs `route.ts` count; **`docs/DATABASE_SCHEMA_PUBLIC_INDEX.generated.md`** table/view/RPC counts vs `web/types/supabase.ts` (shared `scripts/lib/surface-counts.mjs` with `docs:surface-counts`); feature-flags `--check`; **`docs/SECURITY.md`** rg snapshots via **`sync-security-snapshots.mjs --check`**; **`scripts/verify-doc-links.mjs`**; **`scripts/verify-store-docs.mjs`** (`*Store.ts` + cascade order); **`scripts/verify-architecture-boundaries.mjs`** (`web/app` `error.tsx` / `loading.tsx` counts vs **`ARCHITECTURE.md`**); `rg` guard in `web/` for `FEATURE_STATUS.md`, `ROADMAP_SINGLE_SOURCE`, `docs/TESTING/api-contract-plan`. |
| P5-2 | CI job | **`verify:docs`** runs in **`.github/workflows/ci.yml`** (quality job) after installing `ripgrep`. |
| P5-3 | PR template | **Updated:** checklist item for **`npm run verify:docs`** when API routes change. |

---

## 10. New-developer recommendations (cross-cutting)

These are **process and quality** improvements beyond single files.

1. **Prefer one canonical narrative**: `ROADMAP.md` for product status; `ARCHITECTURE.md` for structure; avoid duplicating full lists in multiple places—**link + summary**.
2. **Version tricky claims**: Schema counts, store counts, and route counts should carry **“as of &lt;date&gt;, generated from &lt;artifact&gt;”**.
3. **When archive docs contradict main docs**: add a banner at top of archive: **“Superseded by X—historical only.”**
4. **Type generation**: After every migration PR, require **`web/types/supabase.ts`** update in the same PR—keeps DATABASE_SCHEMA honest.
5. **Security**: Document **service role** usage—see **`docs/SECURITY.md`** § **Service role (`getSupabaseAdminClient`)**; run **`npm run docs:security-snapshots`** when admin-client routes change (keeps snapshot counts in sync).

---

## 11. Appendix: quick verification commands

```bash
# Repo root — canonical counts + full public schema lists
npm run docs:surface-counts
npm run docs:public-schema-index
npm run docs:api-inventory
npm run docs:feature-flags
npm run docs:security-snapshots
# Focused checks (also run inside verify:docs):
npm run verify:doc-links
npm run verify:store-docs
npm run verify:architecture-boundaries
npm run verify:docs

# Store modules (must equal cascade narrative in docs/STATE_MANAGEMENT.md)
ls web/lib/stores/*Store.ts 2>/dev/null | wc -l

# Dead doc pointers from active source (archive excluded)
rg -n "FEATURE_STATUS|ROADMAP_SINGLE_SOURCE|api-contract-plan" --glob '!docs/archive/**' web/

# API routes using Supabase service role (bypasses RLS)
rg -l "getSupabaseAdminClient" web/app/api --glob '**/route.ts' | sort
```

---

## 12. Completion definition

This audit is **complete** when:

- **P0** items are ✅ (no broken governance targets; README/env/Supabase cwd accurate; no dead `FEATURE_STATUS` references in active code).
- **P1** numeric and inventory claims match generated sources or are explicitly scoped.
- **P2** security and voting/trust narratives match code paths new developers can trace.
- **P3–P4** testing and onboarding docs reference the same contracts as production.
- **P5** (optional but recommended) automation catches the next drift before merge.

---

_Maintenance: update the “Snapshot” section when you complete phases or regenerate types; bump “Last updated” at the top._
