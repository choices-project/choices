-- Simple Schema Check - Run these one at a time

-- 1. Get all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. Get all columns for each table
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;

-- 3. Get table row counts (simple approach)
SELECT 
    schemaname,
    relname as table_name,
    n_live_tup as row_count
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY relname;
