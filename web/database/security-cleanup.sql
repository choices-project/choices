-- ============================================================================
-- SECURITY CLEANUP SCRIPT FOR CHOICES PLATFORM
-- ============================================================================
-- This script addresses all Supabase Security Advisor warnings and errors:
-- - Removes old/unused tables and policies
-- - Enables RLS on all remaining tables
-- - Creates proper security policies
-- - Cleans up database clutter
-- 
-- Created: September 9, 2025
-- Run this in your Supabase SQL Editor AFTER running clean-database-setup.sql
-- ============================================================================

-- ============================================================================
-- STEP 1: REMOVE ONLY PROBLEMATIC TABLES (Conservative Cleanup)
-- ============================================================================

-- Remove old IA (Identity/Authentication) tables - these are security risks
DROP TABLE IF EXISTS ia_users CASCADE;
DROP TABLE IF EXISTS ia_tokens CASCADE;
DROP TABLE IF EXISTS ia_refresh_tokens CASCADE;
DROP TABLE IF EXISTS ia_verification_sessions CASCADE;
DROP TABLE IF EXISTS ia_webauthn_credentials CASCADE;

-- Remove old PO (Poll) tables - these conflict with current polls table
DROP TABLE IF EXISTS po_polls CASCADE;
DROP TABLE IF EXISTS po_merkle_trees CASCADE;

-- Remove backup tables - these are just clutter
DROP TABLE IF EXISTS user_profiles_backup CASCADE;
DROP TABLE IF EXISTS polls_backup CASCADE;
DROP TABLE IF EXISTS votes_backup CASCADE;
DROP TABLE IF EXISTS error_logs_backup CASCADE;

-- Remove old session tables - these conflict with Supabase Auth
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_sessions_v2 CASCADE;
DROP TABLE IF EXISTS biometric_credentials CASCADE;

-- KEEP these tables - they're useful and not connected to anything else:
-- bias_detection_logs, fact_check_sources, media_polls, media_sources, site_messages

-- ============================================================================
-- STEP 2: ENABLE RLS ON ALL REMAINING TABLES
-- ============================================================================

-- Enable RLS on core tables (should already be enabled from clean-database-setup.sql)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Enable RLS on useful tables that we're keeping (if they exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bias_detection_logs' AND table_schema = 'public') THEN
        ALTER TABLE bias_detection_logs ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fact_check_sources' AND table_schema = 'public') THEN
        ALTER TABLE fact_check_sources ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'media_polls' AND table_schema = 'public') THEN
        ALTER TABLE media_polls ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'media_sources' AND table_schema = 'public') THEN
        ALTER TABLE media_sources ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'site_messages' AND table_schema = 'public') THEN
        ALTER TABLE site_messages ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Enable RLS on ANY other tables that might exist
-- This ensures RLS is enabled on everything, even tables we don't know about
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN (
            'user_profiles', 'polls', 'votes', 'feedback', 'error_logs',
            'bias_detection_logs', 'fact_check_sources', 'media_polls', 
            'media_sources', 'site_messages'
        )
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
        RAISE NOTICE 'Enabled RLS on table: %', table_name;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 3: CLEAN UP ORPHANED POLICIES
-- ============================================================================

-- Drop any orphaned policies from deleted tables
-- (These will fail silently if the policies don't exist)

-- Note: We're keeping bias_detection_logs, fact_check_sources, media_polls, 
-- media_sources, and site_messages, so we'll create proper policies for them instead

-- ============================================================================
-- STEP 4: VERIFY CORE TABLE POLICIES
-- ============================================================================

-- Ensure user_profiles has proper policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;

CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Ensure polls has proper policies
DROP POLICY IF EXISTS "Users can view public polls" ON polls;
DROP POLICY IF EXISTS "Users can view their own polls" ON polls;
DROP POLICY IF EXISTS "Users can create polls" ON polls;
DROP POLICY IF EXISTS "Users can update their own polls" ON polls;
DROP POLICY IF EXISTS "Users can delete their own polls" ON polls;

CREATE POLICY "Users can view public polls" ON polls
  FOR SELECT USING (privacy_level = 'public');

CREATE POLICY "Users can view their own polls" ON polls
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create polls" ON polls
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own polls" ON polls
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own polls" ON polls
  FOR DELETE USING (auth.uid() = created_by);

-- Ensure votes has proper policies
DROP POLICY IF EXISTS "Users can view votes on public polls" ON votes;
DROP POLICY IF EXISTS "Users can view their own votes" ON votes;
DROP POLICY IF EXISTS "Users can create votes" ON votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON votes;

CREATE POLICY "Users can view votes on public polls" ON votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = votes.poll_id 
      AND polls.privacy_level = 'public'
    )
  );

CREATE POLICY "Users can view their own votes" ON votes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create votes" ON votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own votes" ON votes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes" ON votes
  FOR DELETE USING (auth.uid() = user_id);

-- Ensure error_logs has proper policies
DROP POLICY IF EXISTS "Users can view their own error logs" ON error_logs;
DROP POLICY IF EXISTS "System can insert error logs" ON error_logs;

CREATE POLICY "Users can view their own error logs" ON error_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert error logs" ON error_logs
  FOR INSERT WITH CHECK (true);

-- Ensure feedback has proper policies
DROP POLICY IF EXISTS "Anyone can submit feedback" ON feedback;
DROP POLICY IF EXISTS "Users can view their own feedback" ON feedback;

CREATE POLICY "Anyone can submit feedback" ON feedback
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own feedback" ON feedback
  FOR SELECT USING (user_id = auth.uid());

-- ============================================================================
-- STEP 5: CREATE RLS POLICIES FOR USEFUL TABLES WE'RE KEEPING
-- ============================================================================

-- Create policies for bias_detection_logs (if table exists and has user_id column)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bias_detection_logs' AND table_schema = 'public') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bias_detection_logs' AND column_name = 'user_id' AND table_schema = 'public') THEN
            DROP POLICY IF EXISTS "Users can view their own bias detection logs" ON bias_detection_logs;
            DROP POLICY IF EXISTS "Users can create bias detection logs" ON bias_detection_logs;
            
            EXECUTE 'CREATE POLICY "Users can view their own bias detection logs" ON bias_detection_logs FOR SELECT USING (auth.uid() = user_id)';
            EXECUTE 'CREATE POLICY "Users can create bias detection logs" ON bias_detection_logs FOR INSERT WITH CHECK (auth.uid() = user_id)';
        ELSE
            -- If no user_id column, create restrictive policy
            DROP POLICY IF EXISTS "Restrictive bias detection logs policy" ON bias_detection_logs;
            EXECUTE 'CREATE POLICY "Restrictive bias detection logs policy" ON bias_detection_logs FOR ALL USING (false)';
        END IF;
    END IF;
END $$;

-- Create policies for fact_check_sources (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fact_check_sources' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Users can view fact check sources" ON fact_check_sources;
        DROP POLICY IF EXISTS "Users can create fact check sources" ON fact_check_sources;
        
        EXECUTE 'CREATE POLICY "Users can view fact check sources" ON fact_check_sources FOR SELECT USING (true)';
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fact_check_sources' AND column_name = 'created_by' AND table_schema = 'public') THEN
            EXECUTE 'CREATE POLICY "Users can create fact check sources" ON fact_check_sources FOR INSERT WITH CHECK (auth.uid() = created_by)';
        ELSE
            EXECUTE 'CREATE POLICY "Users can create fact check sources" ON fact_check_sources FOR INSERT WITH CHECK (true)';
        END IF;
    END IF;
END $$;

-- Create policies for media_polls (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'media_polls' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Users can view media polls" ON media_polls;
        DROP POLICY IF EXISTS "Users can create media polls" ON media_polls;
        
        EXECUTE 'CREATE POLICY "Users can view media polls" ON media_polls FOR SELECT USING (true)';
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_polls' AND column_name = 'created_by' AND table_schema = 'public') THEN
            EXECUTE 'CREATE POLICY "Users can create media polls" ON media_polls FOR INSERT WITH CHECK (auth.uid() = created_by)';
        ELSE
            EXECUTE 'CREATE POLICY "Users can create media polls" ON media_polls FOR INSERT WITH CHECK (true)';
        END IF;
    END IF;
END $$;

-- Create policies for media_sources (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'media_sources' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Users can view media sources" ON media_sources;
        DROP POLICY IF EXISTS "Users can create media sources" ON media_sources;
        
        EXECUTE 'CREATE POLICY "Users can view media sources" ON media_sources FOR SELECT USING (true)';
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media_sources' AND column_name = 'created_by' AND table_schema = 'public') THEN
            EXECUTE 'CREATE POLICY "Users can create media sources" ON media_sources FOR INSERT WITH CHECK (auth.uid() = created_by)';
        ELSE
            EXECUTE 'CREATE POLICY "Users can create media sources" ON media_sources FOR INSERT WITH CHECK (true)';
        END IF;
    END IF;
END $$;

-- Create policies for site_messages (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'site_messages' AND table_schema = 'public') THEN
        DROP POLICY IF EXISTS "Users can view site messages" ON site_messages;
        DROP POLICY IF EXISTS "Users can create site messages" ON site_messages;
        
        EXECUTE 'CREATE POLICY "Users can view site messages" ON site_messages FOR SELECT USING (true)';
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_messages' AND column_name = 'created_by' AND table_schema = 'public') THEN
            EXECUTE 'CREATE POLICY "Users can create site messages" ON site_messages FOR INSERT WITH CHECK (auth.uid() = created_by)';
        ELSE
            EXECUTE 'CREATE POLICY "Users can create site messages" ON site_messages FOR INSERT WITH CHECK (true)';
        END IF;
    END IF;
END $$;

-- ============================================================================
-- STEP 6: CREATE DEFAULT POLICIES FOR ANY OTHER TABLES
-- ============================================================================

-- Create default restrictive policies for any tables that don't have policies
-- This ensures no table is left without proper access control
DO $$
DECLARE
    table_name text;
    policy_count integer;
BEGIN
    FOR table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        -- Check if table has any policies
        SELECT COUNT(*) INTO policy_count
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = table_name;
        
        -- If no policies exist, create a restrictive default policy
        IF policy_count = 0 THEN
            EXECUTE format('
                CREATE POLICY "Restrictive default policy" ON %I
                FOR ALL USING (false)
            ', table_name);
            RAISE NOTICE 'Created restrictive default policy for table: %', table_name;
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- STEP 7: CLEAN UP ORPHANED FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Drop any orphaned functions that might reference deleted tables
DROP FUNCTION IF EXISTS update_bias_detection_logs_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_fact_check_sources_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_media_polls_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_media_sources_updated_at() CASCADE;
DROP FUNCTION IF EXISTS update_site_messages_updated_at() CASCADE;

-- ============================================================================
-- STEP 6: VERIFY SCHEMA CLEANLINESS
-- ============================================================================

-- Check what tables remain in the public schema
-- This will show in the results to verify cleanup
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- ============================================================================
-- STEP 8: COMPREHENSIVE SECURITY VERIFICATION
-- ============================================================================

-- Check RLS status on all remaining tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled - SECURITY RISK!'
  END as security_status
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY tablename;

-- Check policies on all remaining tables
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- Security summary - tables without RLS (should be empty)
SELECT 
  'SECURITY ALERT: Tables without RLS' as alert_type,
  tablename,
  'RLS is disabled - this is a security risk!' as message
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = false
ORDER BY tablename;

-- Security summary - tables without policies (should be empty)
SELECT 
  'SECURITY ALERT: Tables without policies' as alert_type,
  t.tablename,
  'No RLS policies defined - table is locked down!' as message
FROM pg_tables t
WHERE t.schemaname = 'public' 
AND t.rowsecurity = true
AND NOT EXISTS (
  SELECT 1 FROM pg_policies p 
  WHERE p.schemaname = 'public' 
  AND p.tablename = t.tablename
)
ORDER BY t.tablename;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

SELECT '🔒 COMPREHENSIVE SECURITY CLEANUP COMPLETE! 🔒' as status;

-- Final security summary
SELECT 
  'FINAL SECURITY STATUS' as summary_type,
  COUNT(*) as total_tables,
  COUNT(*) FILTER (WHERE rowsecurity = true) as tables_with_rls,
  COUNT(*) FILTER (WHERE rowsecurity = false) as tables_without_rls,
  CASE 
    WHEN COUNT(*) FILTER (WHERE rowsecurity = false) = 0 
    THEN '✅ ALL TABLES SECURED WITH RLS'
    ELSE '❌ ' || COUNT(*) FILTER (WHERE rowsecurity = false) || ' TABLES WITHOUT RLS'
  END as security_status
FROM pg_tables 
WHERE schemaname = 'public';