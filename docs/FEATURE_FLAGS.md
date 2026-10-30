# Feature flags

_Last updated: April 4, 2026_

## Canonical sources

| What | Where |
|------|--------|
| **Registry & defaults** | [`web/lib/core/feature-flags.ts`](../web/lib/core/feature-flags.ts) — `FEATURE_FLAGS`, `MINIMAL_CORE_FLAGS`, `RESTORE_FLAGS`, helpers |
| **Product / quarantine narrative** | [`docs/ROADMAP.md`](ROADMAP.md) |
| **Runtime exposure to clients** | `GET /api/feature-flags` (implementation under `web/app/api/feature-flags/`) |
| **In-app feedback vs GitHub Issues** | [`FEEDBACK_AND_ISSUES.md`](FEEDBACK_AND_ISSUES.md) (relates to **`FEEDBACK_WIDGET`** + **`NEXT_PUBLIC_DISABLE_FEEDBACK_WIDGET`**) |

There is **no** separate `FEATURE_STATUS.md` in active docs; archived copies may mention it under `docs/archive/`.

## Mutable flags (`FEATURE_FLAGS`)

These are the **runtime-togglable** entries in `FEATURE_FLAGS` (minimal-core and restore capabilities are separate lists in the same file):

<!-- AUTO-GENERATED:FEATURE_FLAGS_MUTABLE_TABLE -->

| Key | Default (code) | Notes |
|-----|----------------|--------|
| `AUTOMATED_POLLS` | `false` | @deprecated @quarantined No implementation. See docs/ROADMAP.md (quarantine / feature notes). |
| `SOCIAL_SHARING` | `false` | — |
| `SOCIAL_SHARING_POLLS` | `false` | — |
| `SOCIAL_SHARING_CIVICS` | `false` | @deprecated @quarantined No civics-specific sharing surfaces. See docs/ROADMAP.md (quarantine / feature notes). |
| `SOCIAL_SHARING_VISUAL` | `false` | @deprecated @quarantined No OG/visual pipeline. See docs/ROADMAP.md (quarantine / feature notes). |
| `SOCIAL_SHARING_OG` | `false` | @deprecated @quarantined No OG/visual pipeline. See docs/ROADMAP.md (quarantine / feature notes). |
| `CONTACT_INFORMATION_SYSTEM` | `false` | restore: contact UI archived |
| `CIVICS_TESTING_STRATEGY` | `false` | @deprecated @quarantined No automated civics validation. See docs/ROADMAP.md (quarantine / feature notes). |
| `PUSH_NOTIFICATIONS` | `false` | restore: PWA push UI archived |
| `CIVIC_ENGAGEMENT_V2` | `false` | restore: civics UI archived |

<!-- END AUTO-GENERATED:FEATURE_FLAGS_MUTABLE_TABLE -->

## Minimal core (always on — `MINIMAL_CORE_FLAGS`)

Shipped in v0.1 UI/API; `featureFlagManager` treats these as **always** `true`.

<!-- AUTO-GENERATED:MINIMAL_CORE_BODY -->

- `FEEDBACK_WIDGET`
- `ENHANCED_PROFILE`
- `ENHANCED_POLLS`
- `ENHANCED_VOTING`
- `ENHANCED_AUTH`

<!-- END AUTO-GENERATED:MINIMAL_CORE_BODY -->

## Restore backlog (default off — `RESTORE_FLAGS`)

Full-platform capabilities; default **`false`** via `RESTORE_FEATURE_FLAGS` until UI is restored from `web/_archive/`. Override via `FEATURE_FLAGS_OVERRIDE` when testing restore.

<!-- AUTO-GENERATED:RESTORE_FLAGS_BODY -->

- `PWA`
- `ADMIN`
- `ENHANCED_ONBOARDING`
- `ENHANCED_DASHBOARD`
- `CIVICS_ADDRESS_LOOKUP`
- `CANDIDATE_ACCOUNTABILITY`
- `CANDIDATE_CARDS`
- `ALTERNATIVE_CANDIDATES`
- `FEATURE_DB_OPTIMIZATION_SUITE`
- `ANALYTICS`
- `WEBAUTHN`

<!-- END AUTO-GENERATED:RESTORE_FLAGS_BODY -->

**When changing flags:** update `feature-flags.ts`, run **`npm run docs:feature-flags`** (repo root), then `docs/ROADMAP.md` (and release notes if user-visible). Run **`npm run verify:docs`** from repo root before pushing.

## Where flags are read

- **Server:** API routes and server components may import helpers from `@/lib/core/feature-flags`.
- **Client:** Prefer `GET /api/feature-flags` or existing hooks/components that consume that payload—avoid duplicating default booleans in UI-only constants.

See also: [`DOCUMENTATION_AUDIT_ROADMAP.md`](DOCUMENTATION_AUDIT_ROADMAP.md) § Phase 2 (feature-flag table task) for tightening cross-links over time.
