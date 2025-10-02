-- ============================================================================
-- COMPLETE DATABASE SCHEMA INSPECTION
-- ============================================================================
-- Run this in Supabase SQL Editor to get the complete database schema
-- This will show all tables, columns, constraints, indexes, and RLS status
-- ============================================================================

-- 1. ALL TABLES IN PUBLIC SCHEMA
SELECT 
  'TABLES' as section,
  table_name,
  table_type,
  'N/A' as additional_info
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. ALL COLUMNS WITH DETAILS
SELECT 
  'COLUMNS' as section,
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;

-- 3. RLS STATUS FOR ALL TABLES
SELECT 
  'RLS_STATUS' as section,
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled,
  'N/A' as additional_info
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 4. ALL INDEXES
SELECT 
  'INDEXES' as section,
  schemaname,
  tablename,
  indexname,
  indexdef,
  'N/A' as additional_info
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 5. ALL CONSTRAINTS
SELECT 
  'CONSTRAINTS' as section,
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  'N/A' as additional_info
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- 6. ALL RLS POLICIES
SELECT 
  'RLS_POLICIES' as section,
  schemaname, 
  tablename, 
  policyname, 
  roles, 
  cmd, 
  qual as using_expr,
  with_check as check_expr
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 7. FOREIGN KEY RELATIONSHIPS
SELECT 
  'FOREIGN_KEYS' as section,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  'N/A' as additional_info
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 8. TABLE SIZES (ROW COUNTS)
SELECT 
  'TABLE_SIZES' as section,
  schemaname,
  relname as tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates,
  n_tup_del as deletes,
  n_live_tup as live_rows,
  n_dead_tup as dead_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;

-- 9. SLOW QUERIES (if any)
SELECT 
  'SLOW_QUERIES' as section,
  query,
  calls,
  total_exec_time as total_time,
  mean_exec_time as mean_time,
  'N/A' as additional_info
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- Queries taking more than 1 second on average
ORDER BY mean_exec_time DESC
LIMIT 10;

-- 10. EXTENSIONS
SELECT 
  'EXTENSIONS' as section,
  extname,
  extversion,
  'N/A' as additional_info,
  'N/A' as additional_info2
FROM pg_extension
ORDER BY extname;
