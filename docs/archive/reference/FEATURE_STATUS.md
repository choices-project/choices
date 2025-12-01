# Feature Readiness Tracker

This document captures feature readiness and maps to the live flag inventory in `web/lib/core/feature-flags.ts`. Treat this as the source for product/engineering coordination; track execution details in `docs/ROADMAP_SINGLE_SOURCE.md`.

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
| Contact Information System | `CONTACT_INFORMATION_SYSTEM` | Alpha: APIs + ingestion complete, UI pending | `docs/CONTACT_SYSTEM_SCOPE.md`, `docs/CONTACT_SYSTEM_COMPLETION.md`, `web/app/api/contact/*` | Ship admin UI + notification hooks; add MSW fixtures and Playwright coverage before graduating to beta. |
| Civics Testing Strategy | `CIVICS_TESTING_STRATEGY` | Not implemented | – | No automated validation for civics datasets. Needs definition. |
| Device Flow Auth | `DEVICE_FLOW_AUTH` | Not implemented | – | Separate from WebAuthn. Requires OAuth 2.0 Device Authorization Grant handlers, polling UX, rate limiting, and Supabase token issuance. |
| Performance Optimization Suite | `PERFORMANCE_OPTIMIZATION` | Partially implemented | `web/lib/performance/*`, `web/lib/core/database/optimizer.ts` | Plenty of utilities exist but many callers are unused. Audit actual adoption before enabling globally. |
| Push Notifications | `PUSH_NOTIFICATIONS` | Backend scaffolding only | `web/app/api/pwa/notifications/*`, `web/features/pwa/components` | Routes exist but client opt-in + delivery guarantees remain unfinished. Needs testing + product sign-off. |
| Themes / Dark Mode | `THEMES` | Not implemented | – | No theme provider or tokens. Remove flag or schedule UX project. |
| Accessibility Enhancements | `ACCESSIBILITY` | Not implemented (tracked as tasks) | `qa/i18n-accessibility-playbook.md` | Work is ongoing outside flags. Use the QA playbook and roadmap tasks (axe audits, SR transcripts). |
| Internationalisation | `INTERNATIONALIZATION` | **In progress** | `web/app/layout.tsx`, `web/hooks/useI18n.ts`, `web/messages/*.json` | `next-intl` provider, locale middleware, and `LanguageSelector` ship with `en`/`es`. Finish extraction tooling & lint (`npm run i18n:extract`) and expand catalogue coverage before enabling flag. |
| Civic Engagement v2 | `CIVIC_ENGAGEMENT_V2` | WIP module gated behind flag | `web/lib/utils/sophisticated-civic-engagement.ts`, `web/lib/core/feature-flags.ts` | Helpers exist but require Supabase integration, UI surfacing, and QA. |
| Analytics – Demographic Insights | `ANALYTICS` | Implemented (precomputed) | `supabase/migrations/*_update_poll_demographic_insights.sql`, `web/features/analytics/lib/analytics-service.ts` | `poll_demographic_insights` table + RPC implemented; service reads precomputed insights with fallback. Trigger keeps insights fresh on writes. |

## Always-On Capabilities

The following flags were moved into `ALWAYS_ENABLED_FLAGS` because the application depends on them for baseline operation. They should be treated as core platform features rather than toggles:

- `PWA`, `ADMIN`, `FEEDBACK_WIDGET`
- `ENHANCED_ONBOARDING`, `ENHANCED_PROFILE`, `ENHANCED_AUTH`, `ENHANCED_DASHBOARD`, `ENHANCED_POLLS`, `ENHANCED_VOTING`
- `CIVICS_ADDRESS_LOOKUP`, `CIVICS_REPRESENTATIVE_DATABASE`, `CIVICS_CAMPAIGN_FINANCE`, `CIVICS_VOTING_RECORDS`
- `CANDIDATE_ACCOUNTABILITY`, `CANDIDATE_CARDS`, `ALTERNATIVE_CANDIDATES`
- `FEATURE_DB_OPTIMIZATION_SUITE`, `ANALYTICS`, `WEBAUTHN`

When planning future work, rely on the real toggles listed in the table above and remove dormant flags rather than carrying long-term technical debt. Execution tracking lives in `docs/ROADMAP_SINGLE_SOURCE.md`.

These capabilities surface in the admin dashboard as **Locked** entries—attempting to toggle them is blocked at both the API and UI layers.

## Suggested Next Steps

1. **Prioritise Social Sharing** – It has the most scaffolding in place and offers immediate user value once persistence + reporting land.
2. **Decide on OAuth Device Flow vs. WebAuthn Enhancements** – Treat them as separate projects, keeping security implications in mind.
3. **Audit Remaining Flags Each Quarter** – Delete placeholders that do not have a concrete owner or plan.
4. **Adopt Precomputed Analytics** – Prefer reads from `poll_demographic_insights`; schedule batch recompute for legacy data if needed.
4. **Use This Document as the Source of Truth** – Update it whenever a project ships or a flag changes ownership.


