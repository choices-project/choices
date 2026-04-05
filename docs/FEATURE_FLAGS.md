# Feature flags

_Last updated: April 4, 2026_

## Canonical sources

| What | Where |
|------|--------|
| **Registry & defaults** | [`web/lib/core/feature-flags.ts`](../web/lib/core/feature-flags.ts) — `FEATURE_FLAGS`, `ALWAYS_ENABLED_FLAGS`, helpers |
| **Product / quarantine narrative** | [`docs/ROADMAP.md`](ROADMAP.md) |
| **Runtime exposure to clients** | `GET /api/feature-flags` (implementation under `web/app/api/feature-flags/`) |
| **In-app feedback vs GitHub Issues** | [`FEEDBACK_AND_ISSUES.md`](FEEDBACK_AND_ISSUES.md) (relates to **`FEEDBACK_WIDGET`** + **`NEXT_PUBLIC_DISABLE_FEEDBACK_WIDGET`**) |

There is **no** separate `FEATURE_STATUS.md` in active docs; archived copies may mention it under `docs/archive/`.

## Mutable flags (`FEATURE_FLAGS`)

These are the **runtime-togglable** entries in `FEATURE_FLAGS` (always-on capabilities live in `ALWAYS_ENABLED_FLAGS` in the same file):

<!-- AUTO-GENERATED:FEATURE_FLAGS_MUTABLE_TABLE -->

| Key | Default (code) | Notes |
|-----|----------------|--------|
| `AUTOMATED_POLLS` | `false` | @deprecated @quarantined No implementation. See docs/ROADMAP.md (quarantine / feature notes). |
| `SOCIAL_SHARING` | `false` | — |
| `SOCIAL_SHARING_POLLS` | `false` | — |
| `SOCIAL_SHARING_CIVICS` | `false` | @deprecated @quarantined No civics-specific sharing surfaces. See docs/ROADMAP.md (quarantine / feature notes). |
| `SOCIAL_SHARING_VISUAL` | `false` | @deprecated @quarantined No OG/visual pipeline. See docs/ROADMAP.md (quarantine / feature notes). |
| `SOCIAL_SHARING_OG` | `false` | @deprecated @quarantined No OG/visual pipeline. See docs/ROADMAP.md (quarantine / feature notes). |
| `CONTACT_INFORMATION_SYSTEM` | `true` | GA: RLS, rate limits, admin UI, My Submissions, bulk approve/reject |
| `CIVICS_TESTING_STRATEGY` | `false` | @deprecated @quarantined No automated civics validation. See docs/ROADMAP.md (quarantine / feature notes). |
| `PUSH_NOTIFICATIONS` | `true` | ✅ ENABLED - Production ready (January 2025) |
| `CIVIC_ENGAGEMENT_V2` | `true` | Shipped: API + UI on rep detail; CivicActionList with create/sign |

<!-- END AUTO-GENERATED:FEATURE_FLAGS_MUTABLE_TABLE -->

## Always-on capabilities (`ALWAYS_ENABLED_FLAGS`)

`featureFlagManager` treats these as **always** `true`; they are not toggled via `FEATURE_FLAGS_OVERRIDE` or admin disable.

<!-- AUTO-GENERATED:ALWAYS_ENABLED_BODY -->

- `PWA`
- `ADMIN`
- `FEEDBACK_WIDGET`
- `ENHANCED_ONBOARDING`
- `ENHANCED_PROFILE`
- `ENHANCED_AUTH`
- `ENHANCED_DASHBOARD`
- `ENHANCED_POLLS`
- `ENHANCED_VOTING`
- `CIVICS_ADDRESS_LOOKUP`
- `CANDIDATE_ACCOUNTABILITY`
- `CANDIDATE_CARDS`
- `ALTERNATIVE_CANDIDATES`
- `FEATURE_DB_OPTIMIZATION_SUITE`
- `ANALYTICS`
- `WEBAUTHN`

<!-- END AUTO-GENERATED:ALWAYS_ENABLED_BODY -->

**When changing flags:** update `feature-flags.ts`, run **`npm run docs:feature-flags`** (repo root), then `docs/ROADMAP.md` (and release notes if user-visible). Run **`npm run verify:docs`** from repo root before pushing.

## Where flags are read

- **Server:** API routes and server components may import helpers from `@/lib/core/feature-flags`.
- **Client:** Prefer `GET /api/feature-flags` or existing hooks/components that consume that payload—avoid duplicating default booleans in UI-only constants.

See also: [`DOCUMENTATION_AUDIT_ROADMAP.md`](DOCUMENTATION_AUDIT_ROADMAP.md) § Phase 2 (feature-flag table task) for tightening cross-links over time.
