# Public schema index (generated)

**Do not edit by hand.** Regenerate from repository root:

`npm run docs:public-schema-index`

| Source file | `web/types/supabase.ts` |
| Generated | 2026-04-04 |
| Public tables | 93 |
| Public views | 7 |
| Public RPCs (`Database['public']['Functions']`) | 63 |

Cross-check counts: `npm run docs:surface-counts` (includes Next.js `route.ts` tally).

---

## Public tables (alphabetical)

- `admin_activity_log`
- `advanced_analytics_usage`
- `agent_operations`
- `analytics_event_data`
- `analytics_events`
- `audit_logs`
- `biometric_trust_scores`
- `bot_detection_logs`
- `cache_performance_log`
- `candidate_email_challenges`
- `candidate_onboarding`
- `candidate_platforms`
- `candidate_profile_audit`
- `candidate_profiles`
- `candidate_verifications`
- `civic_action_metadata`
- `civic_actions`
- `civic_database_entries`
- `civic_elections`
- `contact_messages`
- `contact_threads`
- `device_flow`
- `feature_usage`
- `feed_interactions`
- `feed_items`
- `feedback`
- `feeds`
- `hashtag_engagement`
- `hashtag_flags`
- `hashtag_usage`
- `hashtag_user_preferences`
- `hashtags`
- `id_crosswalk`
- `idempotency_keys`
- `integrity_signals`
- `message_delivery_logs`
- `moderation_actions`
- `moderation_appeals`
- `moderation_reports`
- `narrative_analysis_results`
- `notification_log`
- `official_email_fast_track`
- `openstates_people_contacts`
- `openstates_people_data`
- `openstates_people_identifiers`
- `openstates_people_other_names`
- `openstates_people_roles`
- `openstates_people_social_media`
- `openstates_people_sources`
- `performance_metrics`
- `permissions`
- `platform_analytics`
- `poll_demographic_insights`
- `poll_options`
- `poll_participation_analytics`
- `poll_rankings`
- `polls`
- `push_subscriptions`
- `query_performance_log`
- `rate_limits`
- `representative_activity`
- `representative_campaign_finance`
- `representative_committees`
- `representative_contacts`
- `representative_crosswalk_enhanced`
- `representative_data_quality`
- `representative_data_sources`
- `representative_divisions`
- `representative_enhanced_crosswalk`
- `representative_follows`
- `representative_overrides`
- `representative_overrides_audit`
- `representative_photos`
- `representative_social_media`
- `representatives_core`
- `role_permissions`
- `roles`
- `site_messages`
- `sync_log`
- `system_health`
- `trending_topics`
- `trust_tier_analytics`
- `trust_tier_progression`
- `user_hashtags`
- `user_profiles`
- `user_roles`
- `user_sessions`
- `vote_integrity_scores`
- `vote_trust_tiers`
- `voter_registration_resources`
- `votes`
- `webauthn_challenges`
- `webauthn_credentials`

---

## Public views (alphabetical)

- `idempotency_monitor`
- `openstates_people_current_roles_v`
- `openstates_people_primary_contacts_v`
- `openstates_people_social_v`
- `openstates_people_sources_v`
- `user_voting_history`
- `voter_registration_resources_view`

---

## Public RPC functions (alphabetical)

- `aggregate_platform_metrics`
- `analyze_database`
- `analyze_geographic_intelligence`
- `analyze_narrative_divergence`
- `analyze_poll_sentiment`
- `analyze_polls_table`
- `analyze_query_performance`
- `analyze_temporal_patterns`
- `calculate_trust_filtered_votes`
- `calculate_trust_weighted_votes`
- `calculate_user_trust_tier`
- `cleanup_expired_audit_logs`
- `cleanup_expired_data`
- `cleanup_expired_device_flows`
- `cleanup_expired_rate_limits`
- `cleanup_idempotency_keys`
- `cleanup_inactive_sessions`
- `cleanup_inactive_subscriptions`
- `cleanup_old_notification_logs`
- `cleanup_old_sync_logs`
- `cleanup_performance_data`
- `create_audit_log`
- `deactivate_non_current_openstates_reps`
- `detect_bot_behavior`
- `determine_status_from_active`
- `exec_sql`
- `get_audit_log_stats`
- `get_comprehensive_analytics`
- `get_dashboard_data`
- `get_duplicate_canonical_ids`
- `get_hashtag_trending_history`
- `get_heatmap`
- `get_performance_recommendations`
- `get_personalized_recommendations`
- `get_platform_stats`
- `get_poll_results_by_trust_tier`
- `get_poll_votes_by_trust_tier`
- `get_real_time_analytics`
- `get_table_columns`
- `get_trust_tier_progression`
- `get_upcoming_elections`
- `get_user_voting_history`
- `link_anonymous_votes_to_user`
- `optimize_database_performance`
- `perform_maintenance_on_tables`
- `rebuild_poll_indexes`
- `refresh_all_materialized_views`
- `refresh_divisions_from_openstates`
- `refresh_materialized_view`
- `refresh_poll_statistics_view`
- `run_maintenance_job`
- `set_status_from_active`
- `show_limit`
- `show_trgm`
- `sync_representatives_from_openstates`
- `update_cache_performance_metrics`
- `update_hashtag_trending_scores`
- `update_poll_demographic_insights`
- `update_poll_statistics`
- `update_poll_vote_count`
- `update_representative_status`
- `update_trending_scores`
- `vacuum_analyze_table`
