# Database Tables Verification Report

**Generated**: 2025-11-02T20:57:08.729Z

**Supabase Project**: https://muqwrehywjrbaeerjgfb.supabase.co

## Summary

- **Total Expected Tables**: 29
- **Existing Tables**: 29 ✅
- **Missing Tables**: 0 ❌
- **Query Errors**: 0

## Existing Tables

| Table | Category | Status | Feature Flag |
|-------|----------|--------|--------------|
| user_profiles | core | ✅ Exists | - |
| polls | core | ✅ Exists | - |
| votes | core | ✅ Exists | - |
| feedback | core | ✅ Exists | - |
| error_logs | core | ✅ Exists | - |
| webauthn_credentials | webauthn | ✅ Exists | WEBAUTHN: true |
| webauthn_challenges | webauthn | ✅ Exists | WEBAUTHN: true |
| civics_person_xref | civics | ✅ Exists | - |
| civics_representatives | civics | ✅ Exists | - |
| civics_votes_minimal | civics | ✅ Exists | - |
| civics_fec_minimal | civics | ✅ Exists | - |
| civics_quality_thresholds | civics | ✅ Exists | - |
| civics_expected_counts | civics | ✅ Exists | - |
| civics_source_precedence | civics | ✅ Exists | - |
| device_flows | device-flow | ✅ Exists | DEVICE_FLOW_AUTH: false |
| contact_threads | contact | ✅ Exists | CONTACT_INFORMATION_SYSTEM: false |
| contact_messages | contact | ✅ Exists | CONTACT_INFORMATION_SYSTEM: false |
| message_templates | contact | ✅ Exists | CONTACT_INFORMATION_SYSTEM: false |
| notification_subscriptions | notifications | ✅ Exists | PUSH_NOTIFICATIONS: false |
| notification_history | notifications | ✅ Exists | PUSH_NOTIFICATIONS: false |
| poll_narratives | narrative | ✅ Exists | POLL_NARRATIVE_SYSTEM: false |
| verified_facts | narrative | ✅ Exists | POLL_NARRATIVE_SYSTEM: false |
| community_facts | narrative | ✅ Exists | POLL_NARRATIVE_SYSTEM: false |
| fact_votes | narrative | ✅ Exists | POLL_NARRATIVE_SYSTEM: false |
| narrative_moderation | narrative | ✅ Exists | POLL_NARRATIVE_SYSTEM: false |
| zk_nullifiers | privacy | ✅ Exists | ADVANCED_PRIVACY: false |
| zk_artifacts | privacy | ✅ Exists | ADVANCED_PRIVACY: false |
| oauth_accounts | social | ✅ Exists | SOCIAL_SIGNUP: false |
| civic_database_entries | analytics | ✅ Exists | - |

## Missing Tables

| Table | Category | Status | Feature Flag |
|-------|----------|--------|--------------|

## Recommendations

- **INFO**: WebAuthn tables exist - feature should be functional
- **INFO**: device_flows exists - DEVICE_FLOW_AUTH feature may be ready to enable
- **INFO**: contact_threads exists - CONTACT_INFORMATION_SYSTEM feature may be ready to enable
- **INFO**: notification_subscriptions exists - PUSH_NOTIFICATIONS feature may be ready to enable
- **INFO**: poll_narratives exists - POLL_NARRATIVE_SYSTEM feature may be ready to enable
