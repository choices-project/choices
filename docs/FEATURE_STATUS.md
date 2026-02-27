# Feature Readiness Tracker

_Last updated: February 2026 (Contact, Push, Civic Engagement v2 GA; Feature Quarantine; RLS migration 20260226120000)._

This table tracks feature readiness. **Flags in code** live in `web/lib/core/feature-flags.ts`. Some rows describe product ideas without flags. See `docs/FEATURE_FLAGS_AUDIT.md` for the full audit.

| Feature | Flag Key | Current State | Evidence | Next Steps |
| --- | --- | --- | --- | --- |
| Automated Poll Generation | `AUTOMATED_POLLS` | On hold | – | No API or UI. Put on hold until product defines scope. |
| Advanced Privacy (ZK / DP) | `ADVANCED_PRIVACY` | Concept only | – | No differential privacy or ZKP pipelines present. Remove flag or scope a privacy initiative. |
| Social Sharing (Master) | `SOCIAL_SHARING` | Shipped (API + poll UI + persistence + dashboard) | `web/app/api/share/route.ts`, `web/app/api/analytics/shares/route.ts`, `web/features/admin/components/ShareAnalyticsPanel.tsx`, `analytics_events` table | Civics-specific affordances and moderation hooks: future work. |
| Social Sharing – Polls | `SOCIAL_SHARING_POLLS` | Inherits master flag | Same as above | Enable when master has observability + moderation hooks. |
| Social Sharing – Civics | `SOCIAL_SHARING_CIVICS` | On hold | – | No civics-specific sharing surfaces. On hold until product defines scope. |
| Social Sharing – Visual / OG | `SOCIAL_SHARING_VISUAL`, `SOCIAL_SHARING_OG` | On hold | – | No OG/image pipeline. On hold until product defines scope. |
| Social Signup (OAuth) | `SOCIAL_SIGNUP` | Not implemented | Auth flows rely on email + WebAuthn only | Add dedicated OAuth controllers, Supabase provider config, and onboarding UX. |
| Contact Information System | `CONTACT_INFORMATION_SYSTEM` | **GA** (default `true`) | `web/app/api/contact/*`, `web/app/api/admin/contact/*`, `web/app/(app)/contact/submissions`, `web/features/admin/components/ContactSystemAdmin.tsx` | RLS on `representative_contacts` (migration `20260226120000`); 5/min rate limit on submit; admin bulk approve/reject + rep-name search. Run E2E before deploy. |
| Civics Testing Strategy | `CIVICS_TESTING_STRATEGY` | On hold | – | No automated validation. On hold until product defines scope. |
| Device Flow Auth | (no flag) | On hold (usable) | `web/app/api/auth/device-flow/*`, `web/components/auth/DeviceFlowAuth.tsx`, `web/app/auth/device-flow/verify/page.tsx` | Implementation complete. E2E tests and Supabase OAuth provider config: future work. Feature always available at `/auth/device-flow`. |
| Performance Optimization Suite | `PERFORMANCE_OPTIMIZATION` | Partially adopted | `web/lib/performance/*`, `web/components/performance/PerformanceMonitor.tsx` | Audit consumers and decide which dashboards opt-in by default. |
| Push Notifications | `PUSH_NOTIFICATIONS` | **GA** (default `true`) | `web/app/api/pwa/notifications/send/route.ts`, `notification_log` table, `web/features/pwa/components/NotificationPreferences.tsx` | Delivery failure logging + `notification_log`; VAPID keys required. Validate in production. Analytics backfill: future work. |
| Accessibility Enhancements | `ACCESSIBILITY` | In QA (dashboards compliant) | `docs/TESTING.md` (NVDA checklist), `web/features/analytics/components/{PollHeatmap,DemographicsChart,TemporalAnalysisChart}.tsx` | Finish keyboard-navigation sweep for legacy feature-flag wrappers; keep axe CI green via `npm run test:e2e:axe`. |
| Internationalisation | `INTERNATIONALIZATION` | In progress (en/es coverage) | `web/app/layout.tsx`, `web/hooks/useI18n.ts`, `components/shared/LanguageSelector.tsx` | Expand locale catalogue, document copy freeze, and wire CI extraction (`npm run i18n:extract`) before enabling. |
| Civic Engagement v2 | `CIVIC_ENGAGEMENT_V2` | **GA** (default `true`) | `web/app/api/civic-actions/*`, `web/features/civics/components/civic-actions/`, `web/app/(app)/representatives/[id]/page.tsx` | CivicActionList on rep detail with create/sign; target_representative_id filter. Surface metrics in admin dashboard; complete integration tests. |
| Analytics – Demographic Insights / Funnels / KPI | `ANALYTICS` | Shipped | `web/app/api/analytics/{funnels,kpi,trust-tiers}` + widgets, `docs/archive/reference/civics/` | Keep Redis cache TTLs tuned; add additional chart exports as requested. |

## Always-On Capabilities (in `ALWAYS_ENABLED_FLAGS`)

The following flags are defined in `web/lib/core/feature-flags.ts` as always-on. They cannot be toggled:

- `PWA`, `ADMIN`, `FEEDBACK_WIDGET`
- `ENHANCED_ONBOARDING`, `ENHANCED_PROFILE`, `ENHANCED_AUTH`, `ENHANCED_DASHBOARD`, `ENHANCED_POLLS`, `ENHANCED_VOTING`
- `CIVICS_ADDRESS_LOOKUP`, `CANDIDATE_ACCOUNTABILITY`, `CANDIDATE_CARDS`, `ALTERNATIVE_CANDIDATES`
- `FEATURE_DB_OPTIMIZATION_SUITE`, `ANALYTICS`, `WEBAUTHN` — Passkeys, trust tier (T2), TrustScoreCard, profile/biometric-setup UX; see `docs/WEBAUTHN_DESIGN.md`

**Note:** `CIVICS_REPRESENTATIVE_DATABASE`, `CIVICS_CAMPAIGN_FINANCE`, `CIVICS_VOTING_RECORDS` are not in the code; those features are always-on without flags. See `docs/FEATURE_FLAGS_AUDIT.md` for the full inventory.

These capabilities surface in the admin dashboard as **Locked** entries—attempting to toggle them is blocked at both the API and UI layers.

## Representative Champion Flow (Core User Journey)

Users champion causes and engage with representatives through:

1. **Representative detail** (`/representatives/[id]`) – Contact form (submit info), CivicActionList (create/sign petitions), follow, accountability, create bill vote poll
2. **Civic actions** – Create at `/civic-actions/create?representative_id=X` (from rep page); view/sign at `/civic-actions/[id]`
3. **Contact submissions** – Submit email/phone/address for reps; admin approves; "My Submissions" at `/contact/submissions`
4. **Candidate declaration** – Users become candidates via `/candidate/declare`; verification links to `representatives_core`

All flows are GA with appropriate RLS, rate limits, and feature flags.

## Feature Quarantine (Deferred – Superfluous for MVP)

The following features are **explicitly quarantined**. No active development. Revisit only when product defines scope or MVP is stable.

| Flag / Feature | Rationale | Effort to Unquarantine |
| --- | --- | --- |
| `AUTOMATED_POLLS` | No API or UI. No product definition. | Full product spec + API + UI |
| `SOCIAL_SHARING_CIVICS` | No civics-specific sharing surfaces. | New surfaces + moderation hooks |
| `SOCIAL_SHARING_VISUAL`, `SOCIAL_SHARING_OG` | No OG/image pipeline. | Image generation + CDN + meta tags |
| `CIVICS_TESTING_STRATEGY` | No automated civics validation. | Validation pipeline + fixtures |
| `ADVANCED_PRIVACY` | Concept only (ZK/DP). No implementation. | Research + pipeline design |
| `SOCIAL_SIGNUP` (OAuth) | Auth is email + WebAuthn. OAuth not implemented. | Supabase providers + OAuth controllers + onboarding |
| Device Flow Auth | Implementation complete; no flag. E2E + OAuth provider config missing. | E2E specs + Supabase OAuth config |
| `PERFORMANCE_OPTIMIZATION` | Partially adopted. Dashboards opt-in. | Audit consumers; decide defaults |
| `ACCESSIBILITY` | In QA. Dashboards compliant. | Keyboard sweep; axe CI green |
| `INTERNATIONALIZATION` | en/es coverage. Extraction not wired. | Locale catalogue + copy freeze + CI extraction |

**Quarantine policy:** Do not start work on quarantined items for MVP. Remove from registry only when product explicitly deprecates.

## Production Checklists

### Contact Information System (GA – post-launch verification)

- [x] RLS policies on `representative_contacts` (migration `20260226120000`)
- [x] Rate limits: 5 submissions/min on `/api/contact/submit`
- [ ] **Post-deploy:** Verify admin bulk approve/reject and rep-name search in production
- [ ] **Post-deploy:** Run E2E contact specs (requires representatives in test DB)

### Push Notifications (GA – post-launch verification)

- [x] Delivery failure logging to `notification_log`
- [ ] **Post-deploy:** Validate VAPID keys and web-push in production

## Suggested Next Steps

1. **Post-deploy verification** – Run contact E2E; validate push delivery in production.
2. **Quarterly Flag Review** – Delete quarantined placeholders when product deprecates; keep aligned with releases.
3. **Unquarantine only when scoped** – Device Flow OAuth, Social Sharing civics/OG, etc. require product definition first.

## Ownership & Update Cadence

- **Owner:** Core maintainer
- **Update cadence:** Review on major feature changes and at least monthly
- **Last verified:** 2026-02-26 (types, lint, civic-actions integration tests)

