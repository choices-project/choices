-- Comprehensive RLS Verification Script
-- Run this in your Supabase SQL Editor to verify RLS is properly configured
-- This checks all tables related to voting and integrity scoring

-- ============================================================================
-- 1. Check RLS Status for poll_rankings
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'poll_rankings';

-- List all policies on poll_rankings
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
  AND tablename = 'poll_rankings'
ORDER BY policyname;

-- Expected policies for poll_rankings:
-- 1. poll_rankings_insert_own (INSERT, authenticated)
-- 2. poll_rankings_select_own (SELECT, authenticated)
-- 3. poll_rankings_update_own (UPDATE, authenticated)
-- 4. poll_rankings_delete_own (DELETE, authenticated)
-- 5. poll_rankings_service_full (ALL, service_role)

-- ============================================================================
-- 2. Check RLS Status for vote_integrity_scores
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'vote_integrity_scores';

-- List all policies on vote_integrity_scores
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
  AND tablename = 'vote_integrity_scores'
ORDER BY policyname;

-- Expected policies for vote_integrity_scores:
-- 1. vote_integrity_scores_insert_own (INSERT, authenticated)
-- 2. vote_integrity_scores_select_own (SELECT, authenticated)
-- 3. vote_integrity_scores_admin_read (SELECT, authenticated, admin only)
-- 4. vote_integrity_scores_service_full (ALL, service_role)

-- ============================================================================
-- 3. Check RLS Status for integrity_signals
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename = 'integrity_signals';

-- List all policies on integrity_signals
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
  AND tablename = 'integrity_signals'
ORDER BY policyname;

-- Expected policies for integrity_signals:
-- 1. integrity_signals_insert_own (INSERT, authenticated)
-- 2. integrity_signals_select_own (SELECT, authenticated)
-- 3. integrity_signals_admin_read (SELECT, authenticated, admin only)
-- 4. integrity_signals_service_full (ALL, service_role)

-- ============================================================================
-- 4. Check Table Permissions (GRANT statements)
-- ============================================================================
SELECT 
  grantee,
  table_schema,
  table_name,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('poll_rankings', 'vote_integrity_scores', 'integrity_signals')
  AND grantee IN ('authenticated', 'service_role', 'anon')
ORDER BY table_name, grantee, privilege_type;

-- ============================================================================
-- 5. Summary: Count policies per table
-- ============================================================================
SELECT 
  tablename,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ' ORDER BY policyname) as policy_names
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('poll_rankings', 'vote_integrity_scores', 'integrity_signals')
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- 6. Check if service_role policies exist (critical for admin client)
-- ============================================================================
SELECT 
  tablename,
  policyname,
  roles,
  cmd as command
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('poll_rankings', 'vote_integrity_scores', 'integrity_signals')
  AND 'service_role' = ANY(roles)
ORDER BY tablename, policyname;

-- Expected: Should see service_role policies for all three tables
