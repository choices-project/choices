-- Database Schema Check for Civics 2.0
-- Run this in Supabase SQL Editor to check the actual database structure

-- 1. Check if representatives_core table exists and get its columns
SELECT 
    'representatives_core' as table_name,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'representatives_core' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if id_crosswalk table exists and get its columns
SELECT 
    'id_crosswalk' as table_name,
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'id_crosswalk' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. List all tables in the public schema
SELECT 
    'ALL_TABLES' as info_type,
    table_name, 
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- 4. Check if representatives_core has data and what columns are available
SELECT 
    'representatives_core_sample' as info_type,
    *
FROM representatives_core 
LIMIT 1;

-- 5. Check if id_crosswalk has data and what columns are available  
SELECT 
    'id_crosswalk_sample' as info_type,
    *
FROM id_crosswalk 
LIMIT 1;

-- 6. Check for any tables with 'canonical' in the name
SELECT 
    'CANONICAL_TABLES' as info_type,
    table_name, 
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name ILIKE '%canonical%'
ORDER BY table_name;

-- 7. Check for any tables with 'crosswalk' in the name
SELECT 
    'CROSSWALK_TABLES' as info_type,
    table_name, 
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public'
AND table_name ILIKE '%crosswalk%'
ORDER BY table_name;
