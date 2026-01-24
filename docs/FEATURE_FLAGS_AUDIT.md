# Feature Flags Audit

**Date:** January 2026  
**Scope:** `web/lib/core/feature-flags.ts`, `FeatureWrapper`, `isFeatureEnabled` usage, API, and admin store.

This audit identifies which flags are **implemented and used**, which are **redundant or effectively always-on**, and which are **scrapped or never wired**. It complements [FEATURE_STATUS.md](./FEATURE_STATUS.md).

---

## 1. Admin dashboard reference

The **Feature Flags Management** UI (Admin dashboard) shows:

| Metric | Value |
|--------|--------|
| **Total flags** | 26 |
| **Enabled** (mutable, on) | 1 → `PUSH_NOTIFICATIONS` |
| **Disabled** (mutable, off) | 9 |
| **Locked** (always-on) | 16 |

**Locked (16):** `ADMIN`, `ALTERNATIVE_CANDIDATES`, `ANALYTICS`, `CANDIDATE_ACCOUNTABILITY`, `CANDIDATE_CARDS`, `CIVICS_ADDRESS_LOOKUP`, `ENHANCED_AUTH`, `ENHANCED_DASHBOARD`, `ENHANCED_ONBOARDING`, `ENHANCED_POLLS`, `ENHANCED_PROFILE`, `ENHANCED_VOTING`, `FEATURE_DB_OPTIMIZATION_SUITE`, `FEEDBACK_WIDGET`, `PWA`, `WEBAUTHN`.

**Disabled (9):** `AUTOMATED_POLLS`, `CIVIC_ENGAGEMENT_V2`, `CIVICS_TESTING_STRATEGY`, `CONTACT_INFORMATION_SYSTEM`, `SOCIAL_SHARING`, `SOCIAL_SHARING_CIVICS`, `SOCIAL_SHARING_OG`, `SOCIAL_SHARING_POLLS`, `SOCIAL_SHARING_VISUAL`.

**Removed (Jan 2026):** `SOCIAL_SIGNUP`, `DEVICE_FLOW_AUTH`, `THEMES`, `ACCESSIBILITY`, `INTERNATIONALIZATION`, `PERFORMANCE_OPTIMIZATION`, `ADVANCED_PRIVACY`, `CIVICS_REPRESENTATIVE_DATABASE`, `CIVICS_CAMPAIGN_FINANCE`, `CIVICS_VOTING_RECORDS` — see §3.2.

Categories shown in UI: **core** (locked), **future**, **privacy**, **performance**, **civics**, **auth**, **system**.

---

## 2. Summary

| Category | Count | Notes |
|----------|--------|------|
| **Always-on (ALWAYS_ENABLED_FLAGS)** | 16 | Core capabilities; no longer toggles. Matches Locked in admin UI. |
| **Mutable, used in app** | 5 | `SOCIAL_SHARING`, `SOCIAL_SHARING_POLLS`, `CIVIC_ENGAGEMENT_V2`, `CONTACT_INFORMATION_SYSTEM`, `PUSH_NOTIFICATIONS`. |
| **Mutable, admin-only / placeholder** | 5 | `AUTOMATED_POLLS`, `CIVICS_TESTING_STRATEGY`, `SOCIAL_SHARING_CIVICS`, `SOCIAL_SHARING_VISUAL`, `SOCIAL_SHARING_OG` — no `isFeatureEnabled` usage. |
| **Removed (Jan 2026)** | 10 | §3.2 flags: OAuth, device-flow, themes, a11y, i18n, performance, advanced privacy, civics rep/campaign/voting. |
| **Dead FeatureWrapper helpers** | 7 | `AuthFeature`, `VotingFeature`, `DatabaseFeature`, `APIFeature`, `UIFeature`, `AuditFeature`, `ExperimentalUIFeature`. `AdvancedPrivacyFeature` removed with flag. |

---

## 3. Pipedreams vs implemented

### 3.1 Pipedreams — long‑ago ideas, no real implementation

These flags refer to **features that were never built** or only have scraps (e.g. archived e2e, quarantine scripts). No production code paths depend on them. **Safe to remove or keep as placeholders** if you ever resurrect the idea.

| Flag | Status | Evidence |
|------|--------|----------|
| **AUTOMATED_POLLS** | Not started | No API, no UI. FEATURE_STATUS: "Requires product definition." Quarantine script references `automated-polls`; no live code. |
| **CIVICS_TESTING_STRATEGY** | Not implemented | No automated civics validation. No `isFeatureEnabled` usage. |
| **SOCIAL_SHARING_CIVICS** | Not implemented | No civics-specific sharing surfaces. Flag unused. |
| **SOCIAL_SHARING_VISUAL**, **SOCIAL_SHARING_OG** | Not implemented | No OG / visual / image pipeline. Flags unused. |
| **ENHANCED_ONBOARDING**, **ENHANCED_PROFILE**, **ENHANCED_AUTH**, **ENHANCED_DASHBOARD**, **ENHANCED_POLLS**, **ENHANCED_VOTING** | Legacy labels only | Never checked anywhere. No feature logic tied to these names. Effectively branding placeholders. |
| **CANDIDATE_ACCOUNTABILITY**, **CANDIDATE_CARDS**, **ALTERNATIVE_CANDIDATES** | Pipedreams | Only in flag defs + **archived** e2e (`candidate-accountability-card`). No current UI uses them. Representative detail shows campaign finance anyway, ungated. |

### 3.2 Implemented but not properly flagged — **removed (Jan 2026)**

These **features exist and are used** in production. The flags were **removed** because they were either redundant (feature always on) or never gated. The features remain; only the flags are gone.

| Former flag | Implementation (unchanged) |
|-------------|----------------------------|
| **SOCIAL_SIGNUP** | OAuth (Google, GitHub) live in `AuthPageClient`, `AuthSetupStep`, device-flow verify. |
| **DEVICE_FLOW_AUTH** | `/api/auth/device-flow/*`, `DeviceFlowAuth.tsx`, verify page. |
| **THEMES** | `ThemeSelector`, AppShell, FeedCore, `data-theme`. |
| **ACCESSIBILITY** | A11y (axe, NVDA, analytics components). |
| **INTERNATIONALIZATION** | `useI18n`, `LanguageSelector`, layout, polls, auth, analytics. |
| **PERFORMANCE_OPTIMIZATION** | `PerformanceMonitor`, `performanceStore`, `/api/admin/performance`, `createPerformanceMonitor`. |
| **ADVANCED_PRIVACY** | DP (`lib/privacy/dp`, `PrivatePollResults`, social-discovery), ZKP (`zero-knowledge-proofs`). `AdvancedPrivacyFeature` wrapper removed. |
| **CIVICS_REPRESENTATIVE_DATABASE**, **CIVICS_CAMPAIGN_FINANCE**, **CIVICS_VOTING_RECORDS** | Orchestrator, `/api/v1/civics/representative/[id]`, `representative_campaign_finance`, geographic-feed, rep detail page. |

### 3.3 Properly flagged (implementation + gate)

| Flag | Implementation | Gating |
|------|----------------|--------|
| **SOCIAL_SHARING** | Share API, ShareAnalyticsPanel, poll share | `isFeatureEnabled('SOCIAL_SHARING')` in share route + panel. |
| **SOCIAL_SHARING_POLLS** | PollShare | `isFeatureEnabled('SOCIAL_SHARING_POLLS')` in PollShare. |
| **CIVIC_ENGAGEMENT_V2** | Civic-actions API, sophisticated-civic-engagement, CreateCivicActionForm, etc. | Gated in API + UI. |
| **CONTACT_INFORMATION_SYSTEM** | Contact API (`/api/contact/*`), ContactRepresentativesSection, ContactModal, BulkContactModal | `useFeatureFlag('CONTACT_INFORMATION_SYSTEM')` in contact UI. |
| **PUSH_NOTIFICATIONS** | PWA notifications, subscribe/send | Default on; used via PWA. |
| **PWA**, **ADMIN**, **FEEDBACK_WIDGET**, **ANALYTICS**, **WEBAUTHN**, **CIVICS_ADDRESS_LOOKUP** | Used in app/API | Always-on **and** checked where relevant. |

---

## 4. Always-on flags (ALWAYS_ENABLED_FLAGS / Locked)

These are **always enabled** and cannot be disabled. Any `isFeatureEnabled(...)` check for them is redundant for toggling but may serve as documentation or a theoretical kill-switch (currently impossible).

| Flag | Usage |
|------|--------|
| `PWA` | PWA API routes (manifest, status, subscribe, send, offline sync), `pwa/index`, `pwa-auth-integration` |
| `ADMIN` | Admin dashboard, feature-flag UI |
| `FEEDBACK_WIDGET` | `EnhancedFeedbackWidget` |
| `ENHANCED_*` (6) | Not directly checked; likely legacy branding |
| `CIVICS_ADDRESS_LOOKUP` | `AddressLookupForm`, `PrivacyStatusBadge`, civics + lib `privacy-utils` |
| `CANDIDATE_ACCOUNTABILITY`, `CANDIDATE_CARDS`, `ALTERNATIVE_CANDIDATES` | No direct usage |
| `FEATURE_DB_OPTIMIZATION_SUITE` | **Optimizer only** (`web/lib/core/database/optimizer.ts`, 5 checks). Always true → effectively redundant. |
| `ANALYTICS` | `election-notifications` route, `lib/core/services/analytics`, `lib/services/analytics` |
| `WEBAUTHN` | `BalancedOnboardingFlow` (FeatureWrapper), `WebAuthnFeatures`, PWA status route |

**Recommendation:** Remove `isFeatureEnabled('FEATURE_DB_OPTIMIZATION_SUITE')` guards from the optimizer, or keep a single gate as a documented “kill switch” and add a comment that the flag is always-on (so future changes could make it mutable if desired).

---

## 5. Mutable flags with app usage

| Flag | Default | Where used |
|------|---------|------------|
| `SOCIAL_SHARING` | `false` | `GET/POST /api/share`, `ShareAnalyticsPanel` |
| `SOCIAL_SHARING_POLLS` | `false` | `PollShare` |
| `CIVIC_ENGAGEMENT_V2` | `false` | Civic-actions API (`route`, `[id]`, `sign`), `civic-actions-integration`, `sophisticated-civic-engagement`, `CreateCivicActionForm`, `CivicActionList`, `CivicActionCard` |
| `CONTACT_INFORMATION_SYSTEM` | `false` | `ContactRepresentativesSection`, `ContactModal`, `BulkContactModal` (`useFeatureFlag`) |
| `PUSH_NOTIFICATIONS` | `true` | Used indirectly via PWA (e.g. subscribe/send). Dependency: `PWA`. |

---

## 6. Mutable flags with no app usage (admin-only / placeholder)

Defined in `FEATURE_FLAGS`, categorised in admin, but **no `isFeatureEnabled` or `useFeatureFlag` usage** in application or API code:

| Flag | Note |
|------|------|
| `AUTOMATED_POLLS` | Not started (per FEATURE_STATUS). No API or UI. |
| `CIVICS_TESTING_STRATEGY` | Not implemented. No usage. |
| `SOCIAL_SHARING_CIVICS` | No civics-specific sharing surfaces. |
| `SOCIAL_SHARING_VISUAL`, `SOCIAL_SHARING_OG` | No OG/visual pipeline. |

**Recommendation:** Remove or deprecate if no owner; keep §3.1 pipedreams in mind.

---

## 7. FeatureWrapper convenience components

`FeatureWrapper` uses `useFeatureFlag(feature)` (PWA hook → app store / `featureFlagManager`). The following helpers use **flag IDs that do not exist** in `FEATURE_FLAGS` or `ALIASES`:

| Component | Flag ID | Result |
|-----------|---------|--------|
| `AuthFeature` | `authentication` | Unknown → always disabled |
| `VotingFeature` | `voting` | Unknown → always disabled |
| `DatabaseFeature` | `database` | Unknown → always disabled |
| `APIFeature` | `api` | Unknown → always disabled |
| `UIFeature` | `ui` | Unknown → always disabled |
| `AuditFeature` | `audit` | Unknown → always disabled |
| `ExperimentalUIFeature` | `experimentalUI` | Unknown → always disabled |

These are **never used** in app code (only in `FeatureWrapper.test`). Valid aliases exist for: `AnalyticsFeature` → `analytics`, `PWAFeature` → `pwa`, `AdminFeature` → `admin`, `AIFeaturesFeature` → `aiFeatures`. `AdvancedPrivacyFeature` was removed with the `ADVANCED_PRIVACY` flag.

**Recommendation:** Remove the dead wrappers (`AuthFeature`, `VotingFeature`, `DatabaseFeature`, `APIFeature`, `UIFeature`, `AuditFeature`, `ExperimentalUIFeature`) or remap them to real flag IDs. Prefer removal if there is no product use.

---

## 8. Implementation notes

### 8.1 API vs app store

- **GET /api/feature-flags** returns `flags` from `featureFlagManager.getAllFlags()` (Map → object of `FeatureFlag` descriptors).
- PWA `useFeatureFlags` fetches and calls `setFeatureFlags(flagUpdates)`, spreading `data.flags` into `Record<string, boolean>`.
- `getAllFlags()` returns `Map<id, FeatureFlag>`, so `data.flags[id]` is an **object**, not a boolean. Casting to `boolean` is misleading; production behaviour relies on object truthiness. Prefer returning `Record<string, boolean>` (e.g. `id → descriptor.enabled`) from the API, or use `loadFeatureFlags` with a proper array shape.

### 8.2 E2E harness

When `NEXT_PUBLIC_ENABLE_E2E_HARNESS=1`, `FeatureWrapper` always renders children and PWA `useFeatureFlags` skips fetch and uses `featureFlagManager` directly. Behaviour differs from normal client path.

---

## 9. Recommended actions

**Done (Jan 2026):** §3.2 flags **removed** — `SOCIAL_SIGNUP`, `DEVICE_FLOW_AUTH`, `THEMES`, `ACCESSIBILITY`, `INTERNATIONALIZATION`, `PERFORMANCE_OPTIMIZATION`, `ADVANCED_PRIVACY`, `CIVICS_REPRESENTATIVE_DATABASE`, `CIVICS_CAMPAIGN_FINANCE`, `CIVICS_VOTING_RECORDS`. `AdvancedPrivacyFeature` wrapper removed.

**Remaining:**

1. **Pipedreams (§3.1):** Remove or deprecate flags with no implementation: `AUTOMATED_POLLS`, `CIVICS_TESTING_STRATEGY`, `SOCIAL_SHARING_CIVICS`, `SOCIAL_SHARING_VISUAL`, `SOCIAL_SHARING_OG`. Consider dropping `ENHANCED_*` and `CANDIDATE_ACCOUNTABILITY` / `CANDIDATE_CARDS` / `ALTERNATIVE_CANDIDATES` if they remain unused.
2. **Optimizer:** Remove or consolidate the five `FEATURE_DB_OPTIMIZATION_SUITE` checks (always-on); add a short comment if retained.
3. **Dead wrappers:** Remove `AuthFeature`, `VotingFeature`, `DatabaseFeature`, `APIFeature`, `UIFeature`, `AuditFeature`, `ExperimentalUIFeature` from `FeatureWrapper.tsx`, or remap to real flags.
4. **API contract:** Have GET /api/feature-flags return `flags: Record<string, boolean>` (or use `loadFeatureFlags`) so the client always uses booleans.
5. **FEATURE_STATUS:** Update to reflect removed flags; civics rep/campaign/voting, OAuth, DP/ZKP, etc. as implemented where accurate.

---

## 10. Reference: usage locations

| Flag | Locations |
|------|-----------|
| `FEATURE_DB_OPTIMIZATION_SUITE` | `web/lib/core/database/optimizer.ts` (5×) |
| `SOCIAL_SHARING` | `web/app/api/share/route.ts`, `ShareAnalyticsPanel` |
| `SOCIAL_SHARING_POLLS` | `web/features/polls/components/PollShare.tsx` |
| `CIVIC_ENGAGEMENT_V2` | Civic-actions API, `civic-actions-integration`, `sophisticated-civic-engagement`, `CreateCivicActionForm`, `CivicActionList`, `CivicActionCard` |
| `CONTACT_INFORMATION_SYSTEM` | `ContactRepresentativesSection`, `ContactModal`, `BulkContactModal` |
| `PWA` | PWA API routes, `pwa/index`, `pwa-auth-integration` |
| `ANALYTICS` | `election-notifications` route, analytics services |
| `WEBAUTHN` | `BalancedOnboardingFlow`, `WebAuthnFeatures`, PWA status |
| `CIVICS_ADDRESS_LOOKUP` | `AddressLookupForm`, `PrivacyStatusBadge`, `privacy-utils` (civics + lib) |
| `FEEDBACK_WIDGET` | `EnhancedFeedbackWidget` |

---

*See also: [FEATURE_STATUS.md](./FEATURE_STATUS.md), [feature-flags.ts](../web/lib/core/feature-flags.ts), [FeatureWrapper](../web/components/shared/FeatureWrapper.tsx).*
