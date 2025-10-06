-- Complete Database Schema Audit
-- Run these queries in Supabase SQL Editor to get the entire schema

-- 1. Get ALL tables in the public schema (no assumptions)
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Get ALL columns for ALL tables in public schema
SELECT 
    table_name,
    column_name,
    ordinal_position,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;

-- 3. Get ALL indexes in public schema
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 4. Get ALL RLS policies in public schema
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

-- 5. Get ALL foreign key relationships
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
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

-- 6. Get table row counts for ALL tables (safe approach)
SELECT 
    schemaname,
    relname as tablename,
    n_tup_ins as inserts,
    n_tup_upd as updates,
    n_tup_del as deletes,
    n_live_tup as live_rows,
    n_dead_tup as dead_rows
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY relname;

-- 7. Get ALL views in public schema
SELECT 
    schemaname,
    viewname,
    viewowner,
    definition
FROM pg_views 
WHERE schemaname = 'public'
ORDER BY viewname;

-- 8. Get ALL functions in public schema
SELECT 
    routine_name,
    routine_type,
    data_type as return_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- 9. Get ALL enums in public schema
SELECT 
    t.typname as enum_name,
    e.enumlabel as enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;
