-- RLS (Row Level Security) Implementation for Civics 2.0
-- Comprehensive security policies for all tables

-- ==============================================
-- 1. ENABLE RLS ON ALL TABLES
-- ==============================================

-- Core tables
ALTER TABLE representatives_core ENABLE ROW LEVEL SECURITY;
ALTER TABLE representative_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE representative_social_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE representative_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE representative_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE representative_committees ENABLE ROW LEVEL SECURITY;
ALTER TABLE representative_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE representative_speeches ENABLE ROW LEVEL SECURITY;
ALTER TABLE representative_accountability ENABLE ROW LEVEL SECURITY;

-- Crosswalk and metadata tables
ALTER TABLE id_crosswalk ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingestion_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_tracking ENABLE ROW LEVEL SECURITY;

-- ==============================================
-- 2. REPRESENTATIVES_CORE RLS POLICIES
-- ==============================================

-- Public read access for all representatives
CREATE POLICY "Public can read representatives" ON representatives_core
    FOR SELECT USING (true);

-- Service role can do everything
CREATE POLICY "Service role full access" ON representatives_core
    FOR ALL USING (auth.role() = 'service_role');

-- Authenticated users can read
CREATE POLICY "Authenticated users can read" ON representatives_core
    FOR SELECT USING (auth.role() = 'authenticated');

-- ==============================================
-- 3. CONTACTS RLS POLICIES
-- ==============================================

-- Public read access for contact info
CREATE POLICY "Public can read contacts" ON representative_contacts
    FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role contacts full access" ON representative_contacts
    FOR ALL USING (auth.role() = 'service_role');

-- ==============================================
-- 4. SOCIAL MEDIA RLS POLICIES
-- ==============================================

-- Public read access for social media
CREATE POLICY "Public can read social media" ON representative_social_media
    FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role social media full access" ON representative_social_media
    FOR ALL USING (auth.role() = 'service_role');

-- ==============================================
-- 5. PHOTOS RLS POLICIES
-- ==============================================

-- Public read access for photos
CREATE POLICY "Public can read photos" ON representative_photos
    FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role photos full access" ON representative_photos
    FOR ALL USING (auth.role() = 'service_role');

-- ==============================================
-- 6. ACTIVITY RLS POLICIES
-- ==============================================

-- Public read access for activity
CREATE POLICY "Public can read activity" ON representative_activity
    FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role activity full access" ON representative_activity
    FOR ALL USING (auth.role() = 'service_role');

-- ==============================================
-- 7. COMMITTEES RLS POLICIES
-- ==============================================

-- Public read access for committees
CREATE POLICY "Public can read committees" ON representative_committees
    FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role committees full access" ON representative_committees
    FOR ALL USING (auth.role() = 'service_role');

-- ==============================================
-- 8. BILLS RLS POLICIES
-- ==============================================

-- Public read access for bills
CREATE POLICY "Public can read bills" ON representative_bills
    FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role bills full access" ON representative_bills
    FOR ALL USING (auth.role() = 'service_role');

-- ==============================================
-- 9. SPEECHES RLS POLICIES
-- ==============================================

-- Public read access for speeches
CREATE POLICY "Public can read speeches" ON representative_speeches
    FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role speeches full access" ON representative_speeches
    FOR ALL USING (auth.role() = 'service_role');

-- ==============================================
-- 10. ACCOUNTABILITY RLS POLICIES
-- ==============================================

-- Public read access for accountability data
CREATE POLICY "Public can read accountability" ON representative_accountability
    FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role accountability full access" ON representative_accountability
    FOR ALL USING (auth.role() = 'service_role');

-- ==============================================
-- 11. CROSSWALK RLS POLICIES
-- ==============================================

-- Public read access for crosswalk (needed for canonical ID resolution)
CREATE POLICY "Public can read crosswalk" ON id_crosswalk
    FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role crosswalk full access" ON id_crosswalk
    FOR ALL USING (auth.role() = 'service_role');

-- ==============================================
-- 12. METADATA TABLES RLS POLICIES
-- ==============================================

-- Data quality metrics - public read
CREATE POLICY "Public can read data quality" ON data_quality_metrics
    FOR SELECT USING (true);

-- Service role full access
CREATE POLICY "Service role data quality full access" ON data_quality_metrics
    FOR ALL USING (auth.role() = 'service_role');

-- Ingestion logs - service role only (sensitive)
CREATE POLICY "Service role ingestion logs only" ON ingestion_logs
    FOR ALL USING (auth.role() = 'service_role');

-- API usage tracking - service role only (sensitive)
CREATE POLICY "Service role API tracking only" ON api_usage_tracking
    FOR ALL USING (auth.role() = 'service_role');

-- ==============================================
-- 13. ADDITIONAL SECURITY MEASURES
-- ==============================================

-- Create indexes for performance with RLS
CREATE INDEX IF NOT EXISTS idx_representatives_core_state ON representatives_core(state);
CREATE INDEX IF NOT EXISTS idx_representatives_core_office ON representatives_core(office);
CREATE INDEX IF NOT EXISTS idx_representatives_core_level ON representatives_core(level);
CREATE INDEX IF NOT EXISTS idx_representatives_core_active ON representatives_core(active);

-- Create indexes for crosswalk performance
CREATE INDEX IF NOT EXISTS idx_id_crosswalk_canonical_id ON id_crosswalk(canonical_id);
CREATE INDEX IF NOT EXISTS idx_id_crosswalk_source ON id_crosswalk(source);
CREATE INDEX IF NOT EXISTS idx_id_crosswalk_source_id ON id_crosswalk(source_id);

-- ==============================================
-- 14. AUDIT LOGGING (Optional but recommended)
-- ==============================================

-- Create audit table for sensitive operations
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    user_id UUID,
    old_data JSONB,
    new_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on audit log
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Only service role can access audit logs
CREATE POLICY "Service role audit access only" ON audit_log
    FOR ALL USING (auth.role() = 'service_role');

-- ==============================================
-- 15. VERIFICATION
-- ==============================================

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'representatives_core',
    'representative_contacts',
    'representative_social_media',
    'representative_photos',
    'representative_activity',
    'representative_committees',
    'representative_bills',
    'representative_speeches',
    'representative_accountability',
    'id_crosswalk',
    'data_quality_metrics',
    'ingestion_logs',
    'api_usage_tracking'
)
ORDER BY tablename;

-- Check policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
