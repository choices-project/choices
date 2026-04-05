# Documentation

_Last updated: April 4, 2026_

## Getting Started

| Need | Read |
|------|------|
| **New contributor?** | [GETTING_STARTED.md](GETTING_STARTED.md) |
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

From repository root, **`npm run verify:docs`** checks that `docs/API/inventory.md` matches the `web/app/api/**/route.ts` tree, that **`docs/DATABASE_SCHEMA_PUBLIC_INDEX.generated.md`** counts (tables / views / RPCs) match **`web/types/supabase.ts`**, that **`docs/FEATURE_FLAGS.md`** matches `web/lib/core/feature-flags.ts`, that auto-generated numeric snapshots in **`docs/SECURITY.md`** (`getSupabaseAdminClient` / `apiRateLimiter.checkLimit` file counts) match **`rg`**, that **relative links** in canonical docs (`docs/**` except `archive/`, plus root `README` / `CONTRIBUTING` / `AGENTS` / `DEPLOYMENT`) resolve to files in the repo, that **Zustand** `*Store.ts` counts and **logout cascade** order (17 stores, documented labels) in **`ARCHITECTURE.md`** / **`STATE_MANAGEMENT.md`** match **`userStore.ts`**, and that **`ARCHITECTURE.md`** **error** / **loading** boundary counts match **`web/app/`**, and that its **Postgres** table / view / RPC **~counts** match **`web/types/supabase.ts`**, and that `web/` does not reference removed doc paths. Run **`npm run verify:doc-links`**, **`npm run verify:store-docs`**, **`npm run verify:architecture-boundaries`**, or **`npm run verify:architecture-schema-counts`** alone for faster checks. After schema, flag, or relevant security-route changes, run **`npm run docs:public-schema-index`**, **`npm run docs:feature-flags`**, and/or **`npm run docs:security-snapshots`** before `verify:docs`.

## Operations

| Topic | Doc |
|-------|-----|
| Deployment | [DEPLOYMENT.md](DEPLOYMENT.md) |
| Security model | [SECURITY.md](SECURITY.md) |
| WebAuthn / passkeys | [WEBAUTHN_DESIGN.md](WEBAUTHN_DESIGN.md) |
| Roadmap & remaining work | [ROADMAP.md](ROADMAP.md) |
| **Documentation ↔ code audit checklist** | [DOCUMENTATION_AUDIT_ROADMAP.md](DOCUMENTATION_AUDIT_ROADMAP.md) |

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
