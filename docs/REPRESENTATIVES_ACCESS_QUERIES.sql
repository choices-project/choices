-- ============================================================================
-- Representatives/Civics Data Access Verification Queries
-- Run these in Supabase SQL Editor to verify data accessibility
-- ============================================================================

-- ============================================================================
-- 1. Check what tables exist related to representatives/civics
-- ============================================================================

SELECT
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
    table_name LIKE '%representative%'
    OR table_name LIKE '%civics%'
  )
ORDER BY table_name;

-- ============================================================================
-- 2. Check if representatives_core table exists and has data
-- ============================================================================

SELECT
  'representatives_core' as table_name,
  COUNT(*) as total_rows,
  COUNT(*) FILTER (WHERE is_active = true) as active_rows,
  COUNT(DISTINCT state) as states_count,
  COUNT(DISTINCT level) as levels_count,
  MIN(created_at) as earliest_record,
  MAX(updated_at) as latest_update
FROM representatives_core;

-- Sample of data (first 5 records)
SELECT
  id,
  name,
  office,
  level,
  state,
  party,
  is_active,
  data_quality_score
FROM representatives_core
WHERE is_active = true
ORDER BY data_quality_score DESC, name
LIMIT 5;

-- ============================================================================
-- 3. Check if civics_representatives table exists and has data
-- ============================================================================

-- This may fail if table doesn't exist - that's okay
SELECT
  'civics_representatives' as table_name,
  COUNT(*) as total_rows,
  COUNT(*) FILTER (WHERE valid_to = 'infinity') as valid_rows,
  COUNT(DISTINCT jurisdiction) as jurisdictions_count,
  COUNT(DISTINCT level) as levels_count,
  MIN(last_updated) as earliest_record,
  MAX(last_updated) as latest_update
FROM civics_representatives;

-- Sample of data (first 5 records)
SELECT
  id,
  name,
  office,
  level,
  jurisdiction,
  district,
  party,
  valid_to
FROM civics_representatives
WHERE valid_to = 'infinity'
ORDER BY last_updated DESC
LIMIT 5;

-- ============================================================================
-- 4. Check RLS policies on representatives_core
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
  AND tablename = 'representatives_core'
ORDER BY policyname;

-- Check if RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'representatives_core';

-- ============================================================================
-- 5. Check RLS policies on civics_representatives (if exists)
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
  AND tablename = 'civics_representatives'
ORDER BY policyname;

-- Check if RLS is enabled (if table exists)
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'civics_representatives';

-- ============================================================================
-- 6. Test anonymous (public) access to representatives_core
-- ============================================================================

-- Test as anonymous role (simulating public access)
SET ROLE anon;

-- Should return data if RLS policy allows public read
SELECT
  COUNT(*) as accessible_count,
  COUNT(*) FILTER (WHERE is_active = true) as active_accessible_count
FROM representatives_core;

-- Reset role
RESET ROLE;

-- ============================================================================
-- 7. Test anonymous (public) access to civics_representatives (if exists)
-- ============================================================================

SET ROLE anon;

-- Should return data if RLS policy allows public read
-- This may fail if table doesn't exist - that's okay
SELECT
  COUNT(*) as accessible_count,
  COUNT(*) FILTER (WHERE valid_to = 'infinity') as valid_accessible_count
FROM civics_representatives;

RESET ROLE;

-- ============================================================================
-- 8. Check related tables that may be needed
-- ============================================================================

-- Check for related representative tables
SELECT
  table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND (
    table_name LIKE 'representative_%'
    OR table_name LIKE 'representatives_%'
  )
ORDER BY table_name;

-- Check data in related tables
SELECT
  'representative_photos' as table_name,
  COUNT(*) as total_rows
FROM representative_photos
UNION ALL
SELECT
  'representative_contacts' as table_name,
  COUNT(*) as total_rows
FROM representative_contacts
UNION ALL
SELECT
  'representative_social_media' as table_name,
  COUNT(*) as total_rows
FROM representative_social_media
UNION ALL
SELECT
  'representative_divisions' as table_name,
  COUNT(*) as total_rows
FROM representative_divisions
UNION ALL
SELECT
  'representative_follows' as table_name,
  COUNT(*) as total_rows
FROM representative_follows;

-- ============================================================================
-- 9. Verify structure matches what endpoints expect
-- ============================================================================

-- Check columns in representatives_core
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'representatives_core'
ORDER BY ordinal_position;

-- Check columns in civics_representatives (if exists)
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'civics_representatives'
ORDER BY ordinal_position;

-- ============================================================================
-- SUMMARY: Expected Results
-- ============================================================================
--
-- representatives_core:
--   - Should exist ✅
--   - Should have RLS enabled ✅
--   - Should have public read policy ✅
--   - Should have data (active rows > 0) ✅
--   - Should be accessible to anonymous users ✅
--
-- civics_representatives:
--   - May or may not exist ⚠️
--   - If exists, should have RLS enabled ⚠️
--   - If exists, should have public read policy ⚠️
--   - If exists, should have data ⚠️
--   - If exists, should be accessible to anonymous users ⚠️
--
-- Issue: If civics_representatives doesn't exist, v1/civics endpoints will fail
-- Solution: Either create civics_representatives table/view OR update v1/civics
--           endpoints to query representatives_core directly

