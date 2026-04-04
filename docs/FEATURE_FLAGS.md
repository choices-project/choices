# Feature flags

_Last updated: April 4, 2026_

## Canonical sources

| What | Where |
|------|--------|
| **Registry & defaults** | [`web/lib/core/feature-flags.ts`](../web/lib/core/feature-flags.ts) — `FEATURE_FLAGS`, `ALWAYS_ENABLED_FLAGS`, helpers |
| **Product / quarantine narrative** | [`docs/ROADMAP.md`](ROADMAP.md) |
| **Runtime exposure to clients** | `GET /api/feature-flags` (implementation under `web/app/api/feature-flags/`) |

There is **no** separate `FEATURE_STATUS.md` in active docs; archived copies may mention it under `docs/archive/`.

## Mutable flags (`FEATURE_FLAGS`)

These are the **runtime-togglable** entries in `FEATURE_FLAGS` (always-on capabilities live in `ALWAYS_ENABLED_FLAGS` in the same file):

| Key | Default (code) | Notes |
|-----|----------------|--------|
| `AUTOMATED_POLLS` | `false` | Quarantined; see `ROADMAP.md` |
| `SOCIAL_SHARING` | `false` | Parent for social variants |
| `SOCIAL_SHARING_POLLS` | `false` | |
| `SOCIAL_SHARING_CIVICS` | `false` | |
| `SOCIAL_SHARING_VISUAL` | `false` | |
| `SOCIAL_SHARING_OG` | `false` | |
| `CONTACT_INFORMATION_SYSTEM` | `true` | GA contact flow |
| `CIVICS_TESTING_STRATEGY` | `false` | Quarantined |
| `PUSH_NOTIFICATIONS` | `true` | |
| `CIVIC_ENGAGEMENT_V2` | `true` | Civic actions surfaces |

**When changing flags:** update `feature-flags.ts`, then `docs/ROADMAP.md` (and release notes if user-visible). Run **`npm run verify:docs`** from repo root before pushing.

## Where flags are read

- **Server:** API routes and server components may import helpers from `@/lib/core/feature-flags`.
- **Client:** Prefer `GET /api/feature-flags` or existing hooks/components that consume that payload—avoid duplicating default booleans in UI-only constants.

See also: [`DOCUMENTATION_AUDIT_ROADMAP.md`](DOCUMENTATION_AUDIT_ROADMAP.md) § Phase 2 (feature-flag table task) for tightening cross-links over time.
