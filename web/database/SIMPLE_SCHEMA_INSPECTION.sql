-- ============================================================================
-- SIMPLE SCHEMA INSPECTION - Run these queries one by one
-- ============================================================================

-- 1. ALL TABLES IN PUBLIC SCHEMA
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. RLS STATUS FOR ALL TABLES
SELECT schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 3. ALL COLUMNS (first 20 tables)
SELECT table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position
LIMIT 100;

-- 4. ALL INDEXES
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 5. ALL RLS POLICIES
SELECT schemaname, tablename, policyname, roles, cmd, qual as using_expr
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 6. TABLE SIZES
SELECT schemaname, relname as tablename, n_live_tup as live_rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_live_tup DESC;
