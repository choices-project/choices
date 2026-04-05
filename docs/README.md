# Documentation

_Last updated: April 5, 2026_

## New here?

| Goal | Start with |
|------|------------|
| Run the app locally | [GETTING_STARTED.md](GETTING_STARTED.md) |
| Submit a PR or report a bug | [../CONTRIBUTING.md](../CONTRIBUTING.md), [../CODE_OF_CONDUCT.md](../CODE_OF_CONDUCT.md), [../SECURITY.md](../SECURITY.md) |
| Understand the codebase | [ARCHITECTURE.md](ARCHITECTURE.md) → [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md) |
| Keep docs accurate with code | [DOCUMENTATION_AUDIT_ROADMAP.md](DOCUMENTATION_AUDIT_ROADMAP.md), then `npm run verify:docs` (repo root) |
| Cursor / MCP / AI assistants | [AGENT_SETUP.md](AGENT_SETUP.md) |
| Product feedback vs GitHub Issues | [FEEDBACK_AND_ISSUES.md](FEEDBACK_AND_ISSUES.md) |

## Getting Started

| Need | Read |
|------|------|
| **New contributor?** | [GETTING_STARTED.md](GETTING_STARTED.md) · [CONTRIBUTING.md](../CONTRIBUTING.md) |
| Project vision | [VISION.md](VISION.md) |
| Trust layer (verification, equal votes) | [TRUST_LAYER.md](TRUST_LAYER.md) |
| Community guidelines | [COMMUNITY_GUIDELINES.md](COMMUNITY_GUIDELINES.md) |
| Theory of change (optional deep read) | [THEORY_OF_CHANGE.md](THEORY_OF_CHANGE.md) |
| System architecture | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Contributing workflow | [../CONTRIBUTING.md](../CONTRIBUTING.md) |

## Developer Reference

| Topic | Doc |
|-------|-----|
| Architecture & codebase structure | [ARCHITECTURE.md](ARCHITECTURE.md) |
| State management (Zustand) | [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md) |
| Testing guide | [TESTING.md](TESTING.md) |
| Environment variables | [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) |
| Database schema | [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md) · full `public` lists: [DATABASE_SCHEMA_PUBLIC_INDEX.generated.md](DATABASE_SCHEMA_PUBLIC_INDEX.generated.md) (`npm run docs:public-schema-index`) |
| API documentation | [API/README.md](API/README.md) |
| Feature flags | [FEATURE_FLAGS.md](FEATURE_FLAGS.md) |
| Troubleshooting | [TROUBLESHOOTING.md](TROUBLESHOOTING.md) |
| In-app feedback vs Issues | [FEEDBACK_AND_ISSUES.md](FEEDBACK_AND_ISSUES.md) |

From repository root, **`npm run verify:docs`** runs the inline checks below (API inventory vs `route.ts`, generated public index vs **`web/types/supabase.ts`**, **`rg`** guard for removed doc paths in **`web/`**), then the focused scripts in order: feature-flags `--check`, SECURITY snapshots `--check`, links, Zustand cascade, App Router boundaries, ARCHITECTURE Postgres counts, **`web/.env.local.example`** vs **`web/lib/config/env.ts`**, **`.cursor/mcp.json`** (no machine absolute paths).

| Focused script | What it validates |
|----------------|-------------------|
| `verify:doc-links` | Relative links in `docs/**` (skips `archive/`), root `README` / `CONTRIBUTING` / `AGENTS` / `DEPLOYMENT`, and `.github/**/*.md` (skips `workflows/`) |
| `verify:store-docs` | `*Store.ts` count + `cascadeDependentStoreReset` order vs **`ARCHITECTURE.md`** / **`STATE_MANAGEMENT.md`** |
| `verify:architecture-boundaries` | `web/app/global-error.tsx` + counts of `error.tsx` / `loading.tsx` vs **`ARCHITECTURE.md`** |
| `verify:architecture-schema-counts` | Diagram + Database § in **`ARCHITECTURE.md`** vs **`web/types/supabase.ts`** |
| `verify:env-example` | Every Zod key in **`web/lib/config/env.ts`** appears in **`web/.env.local.example`** (active or `# KEY=`) |
| `verify:mcp-config` | **`.cursor/mcp.json`** contains no `/Users/…` or `/home/…` absolute paths |

**Regenerate** (then re-run `verify:docs`) when sources change:

| Generator | Writes / updates |
|-----------|------------------|
| `docs:api-inventory` | `docs/API/inventory.md` |
| `docs:public-schema-index` | `docs/DATABASE_SCHEMA_PUBLIC_INDEX.generated.md` |
| `docs:feature-flags` | Marked sections in `docs/FEATURE_FLAGS.md` |
| `docs:security-snapshots` | Marked snapshots in `docs/SECURITY.md` |
| `docs:surface-counts` | *(stdout only)* JSON counts for hand-edited prose |

Requires **ripgrep** (`rg`) on `PATH` (CI installs it before `verify:docs`).

## Operations

| Topic | Doc |
|-------|-----|
| Deployment | [DEPLOYMENT.md](DEPLOYMENT.md) |
| Release copy freeze (i18n) | [COPY_FREEZE.md](COPY_FREEZE.md) |
| Security model | [SECURITY.md](SECURITY.md) |
| WebAuthn / passkeys | [WEBAUTHN_DESIGN.md](WEBAUTHN_DESIGN.md) |
| Roadmap & remaining work | [ROADMAP.md](ROADMAP.md) |
| **Documentation ↔ code audit checklist** | [DOCUMENTATION_AUDIT_ROADMAP.md](DOCUMENTATION_AUDIT_ROADMAP.md) |
| Cursor / MCP / agent skills | [AGENT_SETUP.md](AGENT_SETUP.md) |

## Compliance

| Topic | Doc |
|-------|-----|
| Privacy policy | [PRIVACY_POLICY.md](PRIVACY_POLICY.md) |
| Security practices | [SECURITY.md](SECURITY.md) |

## API Reference

- [API/README.md](API/README.md) — Overview and authentication
- [API/inventory.md](API/inventory.md) — Full route handler listing (regenerate from repo root: `npm run docs:api-inventory`)
- [API/contracts.md](API/contracts.md) — Response format standards
- [API/civic-actions.md](API/civic-actions.md) — Civic actions API
- [API/response-guide.md](API/response-guide.md) — Response patterns

## Archive

Historical documentation (completed audits, legacy status trackers, feature-specific docs) lives under `docs/archive/`. See [archive/README.md](archive/README.md) for the index.
