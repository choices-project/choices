-- Comprehensive RLS Policies for Client-Side Access
-- These policies ensure proper access control while allowing the app to function
-- Created: December 18, 2025
-- 
-- This migration safely checks if each table exists before applying policies

-- Helper function to safely create policies
CREATE OR REPLACE FUNCTION create_policy_if_not_exists(
  p_table_name text,
  p_policy_name text,
  p_command text,
  p_role text,
  p_using_expr text,
  p_check_expr text DEFAULT NULL
) RETURNS void AS $$
DECLARE
  policy_sql text;
BEGIN
  -- Check if table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = p_table_name
  ) THEN
    RAISE NOTICE 'Table % does not exist, skipping policy %', p_table_name, p_policy_name;
    RETURN;
  END IF;
  
  -- Enable RLS on table
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', p_table_name);
  
  -- Check if policy already exists
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = p_table_name AND policyname = p_policy_name
  ) THEN
    RAISE NOTICE 'Policy % on % already exists, skipping', p_policy_name, p_table_name;
    RETURN;
  END IF;
  
  -- Build policy SQL
  IF p_role IS NULL OR p_role = '' THEN
    policy_sql := format('CREATE POLICY %I ON public.%I FOR %s USING (%s)', 
                         p_policy_name, p_table_name, p_command, p_using_expr);
  ELSIF p_check_expr IS NOT NULL THEN
    policy_sql := format('CREATE POLICY %I ON public.%I FOR %s TO %s WITH CHECK (%s)', 
                         p_policy_name, p_table_name, p_command, p_role, p_check_expr);
  ELSE
    policy_sql := format('CREATE POLICY %I ON public.%I FOR %s TO %s USING (%s)', 
                         p_policy_name, p_table_name, p_command, p_role, p_using_expr);
  END IF;
  
  EXECUTE policy_sql;
  RAISE NOTICE 'Created policy % on %', p_policy_name, p_table_name;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PUBLIC READ ACCESS (anyone can read, no authentication required)
-- ============================================================================

SELECT create_policy_if_not_exists('polls', 'polls_public_read', 'SELECT', NULL, 'true');
SELECT create_policy_if_not_exists('feed_items', 'feed_items_public_read', 'SELECT', NULL, 'true');
SELECT create_policy_if_not_exists('feeds', 'feeds_public_read', 'SELECT', NULL, 'true');
SELECT create_policy_if_not_exists('representatives_core', 'representatives_public_read', 'SELECT', NULL, 'true');
SELECT create_policy_if_not_exists('elections', 'elections_public_read', 'SELECT', NULL, 'true');
SELECT create_policy_if_not_exists('candidates', 'candidates_public_read', 'SELECT', NULL, 'true');
SELECT create_policy_if_not_exists('site_messages', 'site_messages_public_read', 'SELECT', NULL, 'true');
SELECT create_policy_if_not_exists('geographic_lookups', 'geographic_lookups_public_read', 'SELECT', NULL, 'true');
SELECT create_policy_if_not_exists('zip_to_ocd', 'zip_to_ocd_public_read', 'SELECT', NULL, 'true');
SELECT create_policy_if_not_exists('latlon_to_ocd', 'latlon_to_ocd_public_read', 'SELECT', NULL, 'true');
SELECT create_policy_if_not_exists('state_districts', 'state_districts_public_read', 'SELECT', NULL, 'true');
SELECT create_policy_if_not_exists('redistricting_history', 'redistricting_history_public_read', 'SELECT', NULL, 'true');
SELECT create_policy_if_not_exists('civic_database_entries', 'civic_database_entries_public_read', 'SELECT', NULL, 'true');
SELECT create_policy_if_not_exists('hashtags', 'hashtags_public_read', 'SELECT', NULL, 'true');
SELECT create_policy_if_not_exists('hashtag_trends', 'hashtag_trends_public_read', 'SELECT', NULL, 'true');
SELECT create_policy_if_not_exists('hashtag_co_occurrence', 'hashtag_co_occurrence_public_read', 'SELECT', NULL, 'true');
SELECT create_policy_if_not_exists('hashtag_content', 'hashtag_content_public_read', 'SELECT', NULL, 'true');
SELECT create_policy_if_not_exists('user_profiles', 'user_profiles_public_read', 'SELECT', NULL, 'true');

-- ============================================================================
-- AUTHENTICATED READ ACCESS (logged-in users only)
-- ============================================================================

SELECT create_policy_if_not_exists('poll_votes', 'poll_votes_authenticated_read', 'SELECT', 'authenticated', 'true');
SELECT create_policy_if_not_exists('votes', 'votes_authenticated_read', 'SELECT', 'authenticated', 'true');
SELECT create_policy_if_not_exists('poll_demographic_insights', 'poll_demographic_insights_authenticated_read', 'SELECT', 'authenticated', 'true');
SELECT create_policy_if_not_exists('hashtag_engagement', 'hashtag_engagement_authenticated_read', 'SELECT', 'authenticated', 'true');
SELECT create_policy_if_not_exists('hashtag_usage', 'hashtag_usage_authenticated_read', 'SELECT', 'authenticated', 'true');

-- ============================================================================
-- USER-OWNED DATA (users can only access their own data)
-- ============================================================================

SELECT create_policy_if_not_exists('user_profiles', 'user_profiles_owner_update', 'UPDATE', 'authenticated', 'auth.uid() = user_id');
SELECT create_policy_if_not_exists('user_sessions', 'user_sessions_owner_access', 'ALL', 'authenticated', 'auth.uid() = user_id');
SELECT create_policy_if_not_exists('user_hashtags', 'user_hashtags_owner_access', 'ALL', 'authenticated', 'auth.uid() = user_id');
SELECT create_policy_if_not_exists('hashtag_user_preferences', 'hashtag_user_preferences_owner_access', 'ALL', 'authenticated', 'auth.uid() = user_id');
SELECT create_policy_if_not_exists('webauthn_credentials', 'webauthn_credentials_owner_access', 'ALL', 'authenticated', 'auth.uid() = user_id');
SELECT create_policy_if_not_exists('feed_interactions', 'feed_interactions_owner_access', 'ALL', 'authenticated', 'auth.uid() = user_id');

-- ============================================================================
-- WRITE POLICIES
-- ============================================================================

SELECT create_policy_if_not_exists('poll_votes', 'poll_votes_insert_own', 'INSERT', 'authenticated', NULL, 'auth.uid() = user_id');
SELECT create_policy_if_not_exists('votes', 'votes_insert_own', 'INSERT', 'authenticated', NULL, 'auth.uid() = user_id');
SELECT create_policy_if_not_exists('feedback', 'feedback_insert', 'INSERT', NULL, NULL, 'true');
SELECT create_policy_if_not_exists('hashtag_flags', 'hashtag_flags_insert', 'INSERT', 'authenticated', NULL, 'true');

-- ============================================================================
-- ANALYTICS TABLES (allow inserts for tracking)
-- ============================================================================

SELECT create_policy_if_not_exists('analytics_events', 'analytics_events_insert', 'INSERT', NULL, NULL, 'true');
SELECT create_policy_if_not_exists('feature_usage', 'feature_usage_insert', 'INSERT', NULL, NULL, 'true');
SELECT create_policy_if_not_exists('platform_analytics', 'platform_analytics_insert', 'INSERT', NULL, NULL, 'true');
SELECT create_policy_if_not_exists('trust_tier_analytics', 'trust_tier_analytics_insert', 'INSERT', NULL, NULL, 'true');
SELECT create_policy_if_not_exists('system_health', 'system_health_insert', 'INSERT', NULL, NULL, 'true');

-- Clean up helper function
DROP FUNCTION IF EXISTS create_policy_if_not_exists(text, text, text, text, text, text);

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Public read: polls, feed_items, feeds, representatives_core, elections, 
--              candidates, site_messages, geographic tables, hashtag tables,
--              user_profiles
-- Authenticated read: poll_votes, votes, poll_demographic_insights, 
--                     hashtag_engagement, hashtag_usage
-- Owner-only: user_sessions, user_hashtags, hashtag_user_preferences,
--             webauthn_credentials, feed_interactions
-- Insert allowed: feedback, analytics tables, poll_votes, votes
