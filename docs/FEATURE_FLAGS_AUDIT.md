# Feature Flags Comprehensive Audit

**Date:** February 2026  
**Audience:** New developers  
**Scope:** All feature flag usage across the codebase

This audit documents the current state of the feature flag system, identifies issues, and provides recommendations for correct setup and optimal usage.

### New developer quick start

1. **Adding a flag check?** → See §6 Developer Guide (decision tree + examples).
2. **Production defaults?** → Set `FEATURE_FLAGS_OVERRIDE` in Vercel (JSON, e.g. `{"CONTACT_INFORMATION_SYSTEM":true}`).
3. **Adding a new flag?** → Add to `web/lib/core/feature-flags.ts`, then document in `FEATURE_STATUS.md`.

---

## 1. Architecture Overview

### 1.1 Core Components

| Component | Path | Purpose |
|-----------|------|---------|
| **Registry** | `web/lib/core/feature-flags.ts` | Single source of truth: `ALWAYS_ENABLED_FLAGS`, `FEATURE_FLAGS`, `featureFlagManager`, `isFeatureEnabled()` |
| **API** | `web/app/api/feature-flags/route.ts` | GET (read) and PATCH (toggle); admin-only in production; returns `flags` + `flagsSimple` |
| **Public API** | `web/app/api/feature-flags/public/route.ts` | GET returns `Record<string, boolean>`; no auth; used by PWA hook |
| **Main hook** | `web/hooks/useFeatureFlags.ts` | Uses `featureFlagManager` directly; no API fetch; client-only |
| **PWA hook** | `web/features/pwa/hooks/useFeatureFlags.ts` | Fetches from `/api/feature-flags/public`, syncs with `appStore` |
| **Admin UI** | `web/features/admin/components/FeatureFlags.tsx` | Uses `adminStore` + PATCH API; toggles update both server and client |
| **Admin store** | `web/lib/stores/adminStore.ts` | Syncs with `featureFlagManager`; `toggleFeatureFlag` calls API + local update |

### 1.2 Data Flow

```
feature-flags.ts (module)
    ├── Server: mutableFlags (in-memory, per Node process)
    │   ├── GET /api/feature-flags (admin) + GET /api/feature-flags/public (no auth)
    │   └── API routes, isFeatureEnabled() in API handlers
    └── Client: mutableFlags (in-memory, per browser)
        ├── adminStore → featureFlagManager (on toggle)
        ├── web/hooks/useFeatureFlags → featureFlagManager (no fetch)
        └── PWA hook → fetch /api/feature-flags/public → appStore.features
```

**Critical:** Server and client have **separate module instances**. Admin PATCH updates the server. Regular users receive server state via PWA hook fetching `/api/feature-flags/public`.

---

## 2. Flag Inventory (as of Feb 2026)

### 2.1 Always-On (ALWAYS_ENABLED_FLAGS)

These cannot be toggled. Defined in `web/lib/core/feature-flags.ts`:

- `PWA`, `ADMIN`, `FEEDBACK_WIDGET`
- `ENHANCED_ONBOARDING`, `ENHANCED_PROFILE`, `ENHANCED_AUTH`, `ENHANCED_DASHBOARD`, `ENHANCED_POLLS`, `ENHANCED_VOTING`
- `CIVICS_ADDRESS_LOOKUP`, `CANDIDATE_ACCOUNTABILITY`, `CANDIDATE_CARDS`, `ALTERNATIVE_CANDIDATES`
- `FEATURE_DB_OPTIMIZATION_SUITE`, `ANALYTICS`, `WEBAUTHN`

### 2.2 Mutable (FEATURE_FLAGS)

| Flag | Default | Usage |
|------|--------|-------|
| `AUTOMATED_POLLS` | false | **Quarantined** – No implementation |
| `SOCIAL_SHARING` | false | `api/share`, `ShareAnalyticsPanel` |
| `SOCIAL_SHARING_POLLS` | false | `PollShare` |
| `SOCIAL_SHARING_CIVICS` | false | **Quarantined** – No implementation |
| `SOCIAL_SHARING_VISUAL` | false | **Quarantined** – No implementation |
| `SOCIAL_SHARING_OG` | false | **Quarantined** – No implementation |
| `CONTACT_INFORMATION_SYSTEM` | **true** (GA) | Contact API, admin UI, My Submissions, modals |
| `CIVICS_TESTING_STRATEGY` | false | **Quarantined** – No implementation |
| `PUSH_NOTIFICATIONS` | true (GA) | PWA notifications |
| `CIVIC_ENGAGEMENT_V2` | **true** (GA) | Civic-actions API, integration, UI components |

See `docs/FEATURE_STATUS.md` § Feature Quarantine for deferred items.

### 2.3 Flags in FEATURE_STATUS.md but NOT in Code

These appear in `docs/FEATURE_STATUS.md` but are **not** defined in `feature-flags.ts`:

- `ADVANCED_PRIVACY`, `SOCIAL_SIGNUP`, `DEVICE_FLOW_AUTH`, `PERFORMANCE_OPTIMIZATION`, `ACCESSIBILITY`, `INTERNATIONALIZATION`
- `CIVICS_REPRESENTATIVE_DATABASE`, `CIVICS_CAMPAIGN_FINANCE`, `CIVICS_VOTING_RECORDS` (listed as "Always-On" in docs but not in code)

---

## 3. Issues Identified

### 3.1 Critical: PWA Hook API Response Parsing

**Location:** `web/features/pwa/hooks/useFeatureFlags.ts`

**Problem:** The API returns `{ success: true, data: { flags, enabledFlags, disabledFlags, systemInfo }, metadata }`. The hook uses `data.flags` instead of `data.data.flags`. Additionally, `flags` is `Record<string, FeatureFlag>` (objects with `enabled`), not `Record<string, boolean>`. The hook casts `value as boolean`, which stores objects instead of booleans, causing `isEnabled` to return truthy for all flags that exist (including disabled ones).

**Impact:** Components using `useFeatureFlag` from the PWA hook (ContactSystemAdmin, ContactModal, etc.) may see incorrect flag states. Non-admin users get 401 from `/api/feature-flags` in production, so they never receive server state; they rely on `features` being empty and `isEnabled` returning `false`.

**Fix:** Use `data.data?.flags`, parse `value.enabled` from each `FeatureFlag` object, and pass `Record<string, boolean>` to `setFeatureFlags`.

### 3.2 Two Different useFeatureFlags Hooks

**Locations:**

- `web/hooks/useFeatureFlags.ts` – uses `featureFlagManager` directly, no API fetch
- `web/features/pwa/hooks/useFeatureFlags.ts` – fetches from API, syncs with appStore

**Different APIs:**

- Main: `isEnabled(flagId)`, `getFlagsByCategory('core'|'optional'|'experimental')`, `manager`, etc.
- PWA: `isEnabled(flagId)`, `flags: Record<string, boolean>`, `fetchFlags`, `getFlagsByCategory(category: string)`, etc.

**Usage:** `FeatureWrapper`, `ContactModal`, `ContactRepresentativesSection`, etc. use the **PWA** hook. `analytics/page.tsx` uses the **main** hook.

**Recommendation:** Consolidate or clearly document which hook to use. For components that need server-side flag state, prefer the PWA hook (once fixed) or ensure the main hook is only used for client-only flags.

### 3.3 Persistence (Partial)

**Solution:** `FEATURE_FLAGS_OVERRIDE` env var (JSON) applies overrides at module load. Set in Vercel/deployment to persist production defaults across restarts. Admin toggles still reset on restart; env overrides provide a baseline. For full persistence, consider a DB table.

### 3.4 Public Flags Endpoint (Resolved)

**Solution:** `GET /api/feature-flags/public` returns `Record<string, boolean>` without auth. The PWA hook fetches from this endpoint so non-admins receive server-side flag state. Admin `GET /api/feature-flags` (full metadata) remains admin-only.

### 3.5 getFlagsByCategory Mismatch

**Problem:** Main hook types `getFlagsByCategory(category: 'core' | 'optional' | 'experimental')`, but `CATEGORY_MAP` in `feature-flags.ts` uses: `core`, `future`, `privacy`, `performance`, `civics`, `auth`, `system`, `analytics`. There is no `optional` or `experimental` category.

**Impact:** `getFlagsByCategory('optional')` or `getFlagsByCategory('experimental')` returns `[]`.

### 3.6 FeatureWrapper Helpers (Resolved)

The dead helpers (`AuthFeature`, `VotingFeature`, `DatabaseFeature`, etc.) were removed. The remaining helpers use valid flag IDs: `AnalyticsFeature` → `analytics`, `PWAFeature` → `pwa`, `AdminFeature` → `admin`, `AIFeaturesFeature` → `aiFeatures`.

### 3.7 FEATURE_STATUS vs Code Drift

`docs/FEATURE_STATUS.md` lists flags and features that are not in the codebase. This can mislead developers. See §2.3.

---

## 4. Usage Map

| Location | Method | Flag(s) |
|----------|--------|---------|
| `api/share/route.ts` | `isFeatureEnabled` | SOCIAL_SHARING |
| `api/contact/*` | `isFeatureEnabled` | CONTACT_INFORMATION_SYSTEM |
| `api/civic-actions/*` | `isFeatureEnabled` | CIVIC_ENGAGEMENT_V2 |
| `api/pwa/*` | `isFeatureEnabled` | PWA |
| `api/analytics/shares` | `isFeatureEnabled` | SOCIAL_SHARING |
| `lib/core/database/optimizer.ts` | `isFeatureEnabled` | FEATURE_DB_OPTIMIZATION_SUITE |
| `lib/core/services/analytics` | `isFeatureEnabled` | analytics |
| `lib/utils/civic-actions-integration.ts` | `isFeatureEnabled` | CIVIC_ENGAGEMENT_V2 |
| `lib/utils/sophisticated-civic-engagement.ts` | `isFeatureEnabled` | CIVIC_ENGAGEMENT_V2 |
| `lib/civics/privacy-utils.ts` | `isFeatureEnabled` | CIVICS_ADDRESS_LOOKUP |
| `features/civics/*` | `isFeatureEnabled` | CIVICS_ADDRESS_LOOKUP, CIVIC_ENGAGEMENT_V2 |
| `features/contact/*` | `useFeatureFlag` (PWA) | CONTACT_INFORMATION_SYSTEM |
| `features/polls/components/PollShare.tsx` | `isFeatureEnabled` | SOCIAL_SHARING_POLLS |
| `features/auth/components/WebAuthnFeatures.tsx` | FeatureWrapper | webauthn |
| `app/(app)/analytics/page.tsx` | `useFeatureFlags` (main) | isEnabled |

---

## 5. Recommended Fixes (Priority Order)

### Completed (Feb 2026)

- **P0:** Fix PWA hook API parsing – uses `data.data?.flags`, prefers `flagsSimple`, extracts `value.enabled` from `FeatureFlag` objects.
- **P1:** Add `GET /api/feature-flags/public` – returns `Record<string, boolean>` without auth; PWA hook fetches from it.
- **P1:** Align FEATURE_STATUS.md with code – documented flags vs product ideas; corrected Always-On list.
- **P2:** Fix getFlagsByCategory – added `CATEGORY_ALIASES` (optional→future, experimental→future) in `feature-flags.ts`.
- **P2:** Dead FeatureWrapper helpers – already removed; only valid helpers remain.
- **API:** Added `flagsSimple` to admin GET response for easier client consumption.

### Completed (Continued)

- **P2:** Document hooks – added §6 Developer Guide with decision tree and examples.
- **P3:** Env-based persistence – `FEATURE_FLAGS_OVERRIDE` applies overrides at module load (see `docs/ENVIRONMENT_VARIABLES.md`).
- **P3:** Pipedream flags – added `@deprecated` JSDoc to AUTOMATED_POLLS, CIVICS_TESTING_STRATEGY, SOCIAL_SHARING_CIVICS, SOCIAL_SHARING_VISUAL, SOCIAL_SHARING_OG.

### Remaining

- **P3:** Full persistence – DB table for admin toggles if env overrides are insufficient.

---

## 6. Developer Guide: Which Hook to Use

Use this decision tree when adding feature-flag checks:

```
Are you in an API route or non-React code?
  → YES: Use isFeatureEnabled(flagId) from '@/lib/core/feature-flags'

Are you in a React component?
  → Need server-side flag state (what admin toggled)?
    → YES: Use useFeatureFlag(flagId) from '@/features/pwa/hooks/useFeatureFlags'
  → Need to toggle/manage flags or use getFlagsByCategory?
    → YES: Use useFeatureFlags() from '@/hooks/useFeatureFlags'
  → Just conditional render?
    → Use <FeatureWrapper feature="flag-id"> from '@/components/shared/FeatureWrapper'
```

### Examples

| Scenario | Import | Usage |
|----------|--------|-------|
| API route gate | `import { isFeatureEnabled } from '@/lib/core/feature-flags'` | `if (!isFeatureEnabled('CONTACT_INFORMATION_SYSTEM')) return 403` |
| Component: show/hide by flag | `import { useFeatureFlag } from '@/features/pwa/hooks/useFeatureFlags'` | `const { enabled } = useFeatureFlag('CONTACT_INFORMATION_SYSTEM'); if (!enabled) return null` |
| Component: conditional wrapper | `import { FeatureWrapper } from '@/components/shared/FeatureWrapper'` | `<FeatureWrapper feature="contact-information-system"><ContactSection /></FeatureWrapper>` |
| Admin/analytics: full manager | `import { useFeatureFlags } from '@/hooks/useFeatureFlags'` | `const { isEnabled, getFlagsByCategory } = useFeatureFlags()` |

### Rule of thumb

- **Default to PWA hook** (`@/features/pwa/hooks/useFeatureFlags`) for React components—it fetches server state so users see admin toggles.
- **Use main hook** (`@/hooks/useFeatureFlags`) only when you need `toggle`, `enable`, `disable`, or `getFlagsByCategory` without a network fetch.

### Valid flag IDs and aliases

See `web/lib/core/feature-flags.ts`.
- Aliases: `pwa`, `admin`, `analytics`, `civics`, `social-sharing`, `civic-engagement-v2`, `webauthn`, etc.

### Adding a new flag

1. Add to `FEATURE_FLAGS` (mutable) or `ALWAYS_ENABLED_FLAGS` in `feature-flags.ts`.
2. Add alias in `ALIASES` if needed.
3. Add to `CATEGORY_MAP` and admin `CATEGORY_PRESETS` if needed.
4. Document in `FEATURE_STATUS.md`.

---

## 7. Related Documents

- [FEATURE_STATUS.md](./FEATURE_STATUS.md) – Product readiness tracker
- [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) – `FEATURE_FLAGS_OVERRIDE` for production persistence
- [archive/2026-02-docs-consolidation/FEATURE_FLAGS_AUDIT.md](./archive/2026-02-docs-consolidation/FEATURE_FLAGS_AUDIT.md) – Previous audit (Jan 2026)
