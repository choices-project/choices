-- migrate:up
-- Ensure legacy databases pick up hardened search_path and view settings
DO $$
DECLARE
  target_functions text[] := ARRAY[
    'aggregate_platform_metrics',
    'analyze_geographic_intelligence',
    'analyze_narrative_divergence',
    'analyze_poll_sentiment',
    'analyze_polls_table',
    'analyze_query_performance',
    'analyze_temporal_patterns',
    'calculate_trust_filtered_votes',
    'calculate_trust_weighted_votes',
    'calculate_user_trust_tier',
    'cleanup_expired_audit_logs',
    'cleanup_expired_data',
    'cleanup_expired_rate_limits',
    'cleanup_idempotency_keys',
    'cleanup_inactive_sessions',
    'cleanup_inactive_subscriptions',
    'cleanup_old_notification_logs',
    'cleanup_old_sync_logs',
    'cleanup_performance_data',
    'create_audit_log',
    'detect_bot_behavior',
    'exec_sql',
    'get_audit_log_stats',
    'get_comprehensive_analytics',
    'get_hashtag_trending_history',
    'get_heatmap',
    'get_performance_recommendations',
    'get_personalized_recommendations',
    'get_poll_results_by_trust_tier',
    'get_poll_votes_by_trust_tier',
    'get_real_time_analytics',
    'get_trust_tier_progression',
    'get_user_voting_history',
    'link_anonymous_votes_to_user',
    'optimize_database_performance',
    'rebuild_poll_indexes',
    'refresh_poll_statistics_view',
    'run_maintenance_job',
    'update_biometric_trust_scores_updated_at',
    'update_cache_performance_metrics',
    'update_candidate_platforms_updated_at',
    'update_civic_database_entries_updated_at',
    'update_contact_thread_message_count',
    'update_contact_threads_updated_at',
    'update_feed_timestamp',
    'update_hashtag_follower_count',
    'update_hashtag_trending_scores',
    'update_hashtag_usage_count',
    'update_poll_demographic_insights',
    'update_poll_statistics',
    'update_trending_scores',
    'update_updated_at_column'
  ];
  fn regprocedure;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = ANY(target_functions)
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = pg_catalog, public;', fn);
  END LOOP;
END $$;

DO $$
DECLARE
  target_functions text[] := ARRAY[
    'refresh_mv_table_columns'
  ];
  fn regprocedure;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'meta'
      AND p.proname = ANY(target_functions)
  LOOP
    EXECUTE format('ALTER FUNCTION %s SET search_path = pg_catalog, meta, public;', fn);
  END LOOP;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_views WHERE schemaname = 'public' AND viewname = 'idempotency_monitor'
  ) THEN
    EXECUTE 'ALTER VIEW public.idempotency_monitor SET (security_invoker = true)';
  END IF;
END $$;

-- migrate:down
-- No-op: hardened configuration is safe to keep
SELECT 1;

