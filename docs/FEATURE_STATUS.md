# Feature Readiness Tracker

_Last updated: February 2026 (Contact Information System: rejected-status storage, admin rep-name search, My Submissions, bulk approve/reject)._

This table mirrors the live flag inventory in `web/lib/core/feature-flags.ts`. Treat it as the “what ships when” planner for Product/Eng. Execution minutiae continue to live in `docs/ROADMAP_SINGLE_SOURCE.md`.

| Feature | Flag Key | Current State | Evidence | Next Steps |
| --- | --- | --- | --- | --- |
| Automated Poll Generation | `AUTOMATED_POLLS` | Not started | – | No API or UI scaffolding detected. Requires product definition. |
| Advanced Privacy (ZK / DP) | `ADVANCED_PRIVACY` | Concept only | – | No differential privacy or ZKP pipelines present. Remove flag or scope a privacy initiative. |
| Social Sharing (Master) | `SOCIAL_SHARING` | Partial (API + poll UI) | `web/app/api/share/route.ts`, `web/features/polls/components/PollShare.tsx` | Persist analytics events (Supabase table + dashboard) and design civics-specific affordances before flipping on by default. |
| Social Sharing – Polls | `SOCIAL_SHARING_POLLS` | Inherits master flag | Same as above | Enable only when master feature has observability + moderation hooks. |
| Social Sharing – Civics | `SOCIAL_SHARING_CIVICS` | Not implemented | – | No civics-specific sharing surfaces. Decide whether to keep the flag. |
| Social Sharing – Visual / OG | `SOCIAL_SHARING_VISUAL`, `SOCIAL_SHARING_OG` | Not implemented | – | No OG/video/image generation pipeline. Remove or plan dedicated project. |
| Social Signup (OAuth) | `SOCIAL_SIGNUP` | Not implemented | Auth flows rely on email + WebAuthn only | Add dedicated OAuth controllers, Supabase provider config, and onboarding UX. |
| Contact Information System | `CONTACT_INFORMATION_SYSTEM` | Beta: APIs, admin UI, My Submissions, rejected-status storage, bulk approve/reject | `web/app/api/contact/*`, `web/app/api/admin/contact/*`, `web/app/(app)/contact/submissions`, `web/features/admin/components/ContactSystemAdmin.tsx` | Admin UI shipped; server-side search (value + rep name); rejected submissions stored with `rejected_at`/`rejection_reason` (migration `20260224000000`); bulk approve/reject API + UI. Graduate to GA after production verification. |
| Civics Testing Strategy | `CIVICS_TESTING_STRATEGY` | Not implemented | – | No automated validation for civics datasets. Needs definition. |
| Device Flow Auth | `DEVICE_FLOW_AUTH` | Developer Preview | `docs/archive/reference/device-flow/`, `web/app/api/auth/device-flow/*`, `web/components/auth/DeviceFlowAuth.tsx` | Add Supabase polling UX, finalize rate limiting, and wire E2E tests (`tests/e2e/specs/push-notifications.spec.ts` currently covers notification tie‑ins only). |
| Performance Optimization Suite | `PERFORMANCE_OPTIMIZATION` | Partially adopted | `web/lib/performance/*`, `web/components/performance/PerformanceMonitor.tsx` | Audit consumers and decide which dashboards opt-in by default. |
| Push Notifications | `PUSH_NOTIFICATIONS` | Beta (Admin + PWA client shipped) | `docs/archive/reference/push-notifications/`, `web/app/api/pwa/notifications/*`, `web/features/pwa/components/NotificationPreferences.tsx`, `tests/e2e/specs/push-notifications.spec.ts` | Complete staged delivery + analytics backfill before rolling out broadly. |
| Accessibility Enhancements | `ACCESSIBILITY` | In QA (dashboards compliant) | `docs/TESTING.md` (NVDA checklist), `web/features/analytics/components/{PollHeatmap,DemographicsChart,TemporalAnalysisChart}.tsx` | Finish keyboard-navigation sweep for legacy feature-flag wrappers; keep axe CI green via `npm run test:e2e:axe`. |
| Internationalisation | `INTERNATIONALIZATION` | In progress (en/es coverage) | `web/app/layout.tsx`, `web/hooks/useI18n.ts`, `components/shared/LanguageSelector.tsx` | Expand locale catalogue, document copy freeze, and wire CI extraction (`npm run i18n:extract`) before enabling. |
| Civic Engagement v2 | `CIVIC_ENGAGEMENT_V2` | Beta (service + docs live, UI pending) | `docs/archive/reference/civics/civic-engagement-v2/`, `web/lib/utils/sophisticated-civic-engagement.ts`, Supabase migrations in `supabase/migrations/2025-01-22_001_enhance_civic_actions_v2.sql` | Surface metrics in admin dashboard and complete integration tests. |
| Analytics – Demographic Insights / Funnels / KPI | `ANALYTICS` | Shipped | `web/app/api/analytics/{funnels,kpi,trust-tiers}` + widgets, `docs/archive/reference/civics/` | Keep Redis cache TTLs tuned; add additional chart exports as requested. |

## Always-On Capabilities

The following flags were moved into `ALWAYS_ENABLED_FLAGS` because the application depends on them for baseline operation. They should be treated as core platform features rather than toggles:

- `PWA`, `ADMIN`, `FEEDBACK_WIDGET`
- `ENHANCED_ONBOARDING`, `ENHANCED_PROFILE`, `ENHANCED_AUTH`, `ENHANCED_DASHBOARD`, `ENHANCED_POLLS`, `ENHANCED_VOTING`
- `CIVICS_ADDRESS_LOOKUP`, `CIVICS_REPRESENTATIVE_DATABASE`, `CIVICS_CAMPAIGN_FINANCE`, `CIVICS_VOTING_RECORDS`
- `CANDIDATE_ACCOUNTABILITY`, `CANDIDATE_CARDS`, `ALTERNATIVE_CANDIDATES`
- `FEATURE_DB_OPTIMIZATION_SUITE`, `ANALYTICS`, `WEBAUTHN` — Passkeys, trust tier (T2), TrustScoreCard, profile/biometric-setup UX; see `docs/WEBAUTHN_DESIGN.md`

These capabilities surface in the admin dashboard as **Locked** entries—attempting to toggle them is blocked at both the API and UI layers.

## Suggested Next Steps

1. **Push Notifications GA** – Validate staged delivery + failure analytics, then graduate the flag.
2. **Contact System GA** – Admin UI shipped; My Submissions with rejected badge; rejected-status storage. Production verification before GA.
3. **Device Flow + OAuth** – Pair the new API routes with Supabase provider config and onboarding copy.
4. **Quarterly Flag Review** – Delete placeholders with no owner; keep this document aligned with each release cycle.

## Ownership & Update Cadence

- **Owner:** Core maintainer
- **Update cadence:** Review on major feature changes and at least monthly
- **Last verified:** TBD

