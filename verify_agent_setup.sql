-- Agent Setup Verification Script
-- Run this in your Supabase SQL Editor to verify agent infrastructure is properly configured
-- This checks the agent_operations table and related policies

-- ============================================================================
-- 1. Check agent_operations table exists
-- ============================================================================
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'agent_operations';

-- Expected: Should see agent_operations with rls_enabled = true

-- ============================================================================
-- 2. Check agent_operations table structure
-- ============================================================================
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'agent_operations'
ORDER BY ordinal_position;

-- Expected columns:
-- - id (uuid, primary key)
-- - agent_id (text, not null)
-- - agent_version (text, nullable)
-- - operation_type (text, not null)
-- - table_name (text, nullable)
-- - function_name (text, nullable)
-- - user_context (uuid, nullable, references auth.users)
-- - request_metadata (jsonb, default '{}')
-- - result_status (text, not null)
-- - error_message (text, nullable)
-- - row_count (integer, nullable)
-- - duration (integer, nullable)
-- - created_at (timestamptz, default now())

-- ============================================================================
-- 3. Check agent_operations indexes
-- ============================================================================
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename = 'agent_operations'
ORDER BY indexname;

-- Expected indexes:
-- - idx_agent_operations_agent_id
-- - idx_agent_operations_created_at
-- - idx_agent_operations_user_context (partial, where user_context IS NOT NULL)
-- - idx_agent_operations_table_name (partial, where table_name IS NOT NULL)
-- - idx_agent_operations_result_status

-- ============================================================================
-- 4. Check agent_operations RLS policies
-- ============================================================================
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'agent_operations'
ORDER BY policyname;

-- Expected policies:
-- 1. agent_operations_service_full (ALL, service_role)
-- 2. agent_operations_admin_read (SELECT, authenticated, admin only)

-- ============================================================================
-- 5. Check agent_operations table permissions
-- ============================================================================
SELECT
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name = 'agent_operations'
  AND grantee IN ('authenticated', 'service_role', 'anon')
ORDER BY grantee, privilege_type;

-- Expected:
-- - service_role: ALL privileges
-- - authenticated: SELECT privilege

-- ============================================================================
-- 6. Check service role policies for agent-accessible tables
-- ============================================================================
SELECT
  tablename,
  policyname,
  roles,
  cmd as command
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'polls',
    'votes',
    'poll_rankings',
    'vote_integrity_scores',
    'integrity_signals',
    'analytics_events',
    'analytics_event_data',
    'bot_detection_logs',
    'user_profiles',
    'poll_options'
  )
  AND 'service_role' = ANY(roles)
ORDER BY tablename, policyname;

-- Expected service_role policies:
-- - polls: polls_service_full
-- - votes: votes_service_full
-- - poll_rankings: poll_rankings_service_full
-- - vote_integrity_scores: vote_integrity_scores_service_full
-- - integrity_signals: integrity_signals_service_full
-- - analytics_events: analytics_events_service_full
-- - analytics_event_data: analytics_event_data_service_full
-- - bot_detection_logs: bot_detection_logs_service_full
-- - user_profiles: user_profiles_service_read (SELECT only)
-- - poll_options: poll_options_service_full

-- ============================================================================
-- 7. Verify agent_operations can be written to (service role test)
-- ============================================================================
-- This query should succeed if run as service_role
-- Note: This is a read-only verification - actual writes should be tested via API

SELECT
  'agent_operations table is accessible' as status,
  COUNT(*) as existing_records
FROM public.agent_operations;

-- ============================================================================
-- 8. Summary: Agent infrastructure status
-- ============================================================================
SELECT
  'Agent Infrastructure Status' as check_type,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agent_operations')
    THEN '✅ agent_operations table exists'
    ELSE '❌ agent_operations table missing'
  END as table_status,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = 'agent_operations'
        AND policyname = 'agent_operations_service_full'
    )
    THEN '✅ Service role policy exists'
    ELSE '❌ Service role policy missing'
  END as service_role_policy,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE schemaname = 'public'
        AND tablename = 'agent_operations'
        AND indexname = 'idx_agent_operations_agent_id'
    )
    THEN '✅ Indexes created'
    ELSE '❌ Indexes missing'
  END as indexes_status,
  (
    SELECT COUNT(*)
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'polls', 'votes', 'poll_rankings', 'vote_integrity_scores',
        'integrity_signals', 'analytics_events', 'analytics_event_data',
        'bot_detection_logs', 'user_profiles', 'poll_options'
      )
      AND 'service_role' = ANY(roles)
  ) as service_role_policies_count;

-- Expected: Should show all ✅ and service_role_policies_count >= 10

-- ============================================================================
-- 9. Check for any agent operations logged (if any exist)
-- ============================================================================
SELECT
  agent_id,
  COUNT(*) as operation_count,
  COUNT(*) FILTER (WHERE result_status = 'success') as success_count,
  COUNT(*) FILTER (WHERE result_status = 'error') as error_count,
  COUNT(*) FILTER (WHERE result_status = 'rate_limited') as rate_limited_count,
  AVG(duration) FILTER (WHERE duration IS NOT NULL) as avg_duration_ms,
  MIN(created_at) as first_operation,
  MAX(created_at) as last_operation
FROM public.agent_operations
GROUP BY agent_id
ORDER BY operation_count DESC
LIMIT 10;

-- This will show agent activity if any operations have been logged
