-- Minimal RLS Implementation for Civics 2.0
-- Only for tables that actually exist
-- Run this in Supabase SQL Editor

-- ==============================================
-- 1. ENABLE RLS ON EXISTING TABLES
-- ==============================================

ALTER TABLE representatives_core ENABLE ROW LEVEL SECURITY;
ALTER TABLE id_crosswalk ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 2. PUBLIC READ ACCESS POLICIES
-- ==============================================

-- Allow public read access to representative data
CREATE POLICY "Public can read representatives" ON representatives_core
    FOR SELECT USING (true);
    
-- Allow public read access to crosswalk data
CREATE POLICY "Public can read crosswalk" ON id_crosswalk
    FOR SELECT USING (true);

-- ==============================================
-- 3. SERVICE ROLE FULL ACCESS POLICIES
-- ==============================================

-- Allow service role full access to representatives
CREATE POLICY "Service role full access" ON representatives_core
    FOR ALL USING (auth.role() = 'service_role');
    
-- Allow service role full access to crosswalk
CREATE POLICY "Service role crosswalk full access" ON id_crosswalk
    FOR ALL USING (auth.role() = 'service_role');

-- ==============================================
-- 4. VERIFICATION QUERIES
-- ==============================================

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('representatives_core', 'id_crosswalk')
ORDER BY tablename;

-- Check policies
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('representatives_core', 'id_crosswalk')
ORDER BY tablename, policyname;
