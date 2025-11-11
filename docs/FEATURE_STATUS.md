# Feature Readiness Tracker

This document captures the features that still require engineering work before they can be considered production-ready. It is based on the current flag inventory in `web/lib/core/feature-flags.ts`, exploratory code review, and the latest implementation state of each area.

| Feature | Flag Key | Current State | Key References | Notes / Next Steps |
| --- | --- | --- | --- | --- |
| Automated Poll Generation | `AUTOMATED_POLLS` | Not implemented | – | No API or UI scaffolding detected. Requires product definition. |
| Advanced Privacy (ZK / DP) | `ADVANCED_PRIVACY` | Concept only | – | No differential privacy or ZKP pipelines present. Remove flag or scope a privacy initiative. |
| Social Sharing (Master) | `SOCIAL_SHARING` | **Partial** | `web/app/api/share/route.ts`, `web/features/polls/components/PollShare.tsx` | API logs events only; nothing is persisted. UI opens share URLs but lacks analytics, fallback UX, or civics integration. Needs Supabase persistence + admin dashboards. |
| Social Sharing – Polls | `SOCIAL_SHARING_POLLS` | Partial (rides on master flag) | Same as above | Enable only after master feature writes analytics and exposes metrics. |
| Social Sharing – Civics | `SOCIAL_SHARING_CIVICS` | Not implemented | – | No civics-specific sharing surfaces. Decide whether to keep the flag. |
| Social Sharing – Visual | `SOCIAL_SHARING_VISUAL` | Not implemented | – | No OG/video/image generation pipeline. Remove or plan dedicated project. |
| Social Sharing – OpenGraph | `SOCIAL_SHARING_OG` | Not implemented | – | No dynamic OG image service. Needs infra decision. |
| Social Signup (OAuth) | `SOCIAL_SIGNUP` | Not implemented | Auth flows rely on email + WebAuthn only | Add dedicated OAuth controllers, Supabase provider config, and onboarding UX. |
| Contact Information System | `CONTACT_INFORMATION_SYSTEM` | Prototype APIs exist, data incomplete | `web/app/api/contact/*` | Endpoints exist but no consumer UI beyond admin. Clarify scope (CRM vs. MVP) and complete ingestion + notification flows. |
| Civics Testing Strategy | `CIVICS_TESTING_STRATEGY` | Not implemented | – | No automated validation for civics datasets. Needs definition. |
| Device Flow Auth | `DEVICE_FLOW_AUTH` | Not implemented | – | Separate from WebAuthn. Requires OAuth 2.0 Device Authorization Grant handlers, polling UX, rate limiting, and Supabase token issuance. |
| Performance Optimization Suite | `PERFORMANCE_OPTIMIZATION` | Partially implemented | `web/lib/performance/*`, `web/lib/core/database/optimizer.ts` | Plenty of utilities exist but many callers are unused. Audit actual adoption before enabling globally. |
| Push Notifications | `PUSH_NOTIFICATIONS` | Backend scaffolding only | `web/app/api/pwa/notifications/*`, `web/features/pwa/components` | Routes exist but client opt-in + delivery guarantees remain unfinished. Needs testing + product sign-off. |
| Themes / Dark Mode | `THEMES` | Not implemented | – | No theme provider or tokens. Remove flag or schedule UX project. |
| Accessibility Enhancements | `ACCESSIBILITY` | Not implemented | – | Accessibility work is ongoing but not behind a flag. Replace with concrete tasks (e.g., axe audits). |
| Internationalisation | `INTERNATIONALIZATION` | Not implemented | – | No i18n library or localized copy. Define locales or drop the flag. |
| Civic Engagement v2 | `CIVIC_ENGAGEMENT_V2` | WIP module gated behind flag | `web/lib/utils/sophisticated-civic-engagement.ts`, `web/lib/core/feature-flags.ts` | Helpers exist but require Supabase integration, UI surfacing, and QA. |

## Always-On Capabilities

The following flags were moved into `ALWAYS_ENABLED_FLAGS` because the application depends on them for baseline operation. They should be treated as core platform features rather than toggles:

- `PWA`, `ADMIN`, `FEEDBACK_WIDGET`
- `ENHANCED_ONBOARDING`, `ENHANCED_PROFILE`, `ENHANCED_AUTH`, `ENHANCED_DASHBOARD`, `ENHANCED_POLLS`, `ENHANCED_VOTING`
- `CIVICS_ADDRESS_LOOKUP`, `CIVICS_REPRESENTATIVE_DATABASE`, `CIVICS_CAMPAIGN_FINANCE`, `CIVICS_VOTING_RECORDS`
- `CANDIDATE_ACCOUNTABILITY`, `CANDIDATE_CARDS`, `ALTERNATIVE_CANDIDATES`
- `FEATURE_DB_OPTIMIZATION_SUITE`, `ANALYTICS`, `WEBAUTHN`

When planning future work, rely on the real toggles listed in the table above and remove dormant flags rather than carrying long-term technical debt.

These capabilities surface in the admin dashboard as **Locked** entries—attempting to toggle them is blocked at both the API and UI layers.

## Suggested Next Steps

1. **Prioritise Social Sharing** – It has the most scaffolding in place and offers immediate user value once persistence + reporting land.
2. **Decide on OAuth Device Flow vs. WebAuthn Enhancements** – Treat them as separate projects, keeping security implications in mind.
3. **Audit Remaining Flags Each Quarter** – Delete placeholders that do not have a concrete owner or plan.
4. **Use This Document as the Source of Truth** – Update it whenever a project ships or a flag changes ownership.


