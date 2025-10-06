-- Fix Critical Supabase Issues
-- Created: 2025-10-06
-- Purpose: Address security warnings and missing tables only
-- 
-- INSTRUCTIONS:
-- 1. Copy and paste this entire file into Supabase SQL Editor
-- 2. Run it to fix the critical warnings
-- 3. This will enable RLS and create missing tables

-- 1. CREATE MISSING TABLE: data_quality_metrics
CREATE TABLE IF NOT EXISTS data_quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    representative_id UUID REFERENCES representatives_core(id) ON DELETE CASCADE,
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_type TEXT NOT NULL CHECK (metric_type IN ('score', 'count', 'percentage', 'boolean')),
    data_source TEXT NOT NULL,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
ALTER TABLE representatives_core ENABLE ROW LEVEL SECURITY;
ALTER TABLE representative_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE representative_social_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE representative_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE id_crosswalk ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_metrics ENABLE ROW LEVEL SECURITY;

-- 3. CREATE BASIC RLS POLICIES FOR PUBLIC READ ACCESS
CREATE POLICY "Public can read representatives_core" ON representatives_core
    FOR SELECT USING (true);

CREATE POLICY "Public can read representative_contacts" ON representative_contacts
    FOR SELECT USING (true);

CREATE POLICY "Public can read representative_social_media" ON representative_social_media
    FOR SELECT USING (true);

CREATE POLICY "Public can read representative_photos" ON representative_photos
    FOR SELECT USING (true);

CREATE POLICY "Public can read id_crosswalk" ON id_crosswalk
    FOR SELECT USING (true);

CREATE POLICY "Public can read data_quality_metrics" ON data_quality_metrics
    FOR SELECT USING (true);

-- 4. CREATE RLS POLICIES FOR SERVICE ROLE FULL ACCESS
CREATE POLICY "Service role can manage representatives_core" ON representatives_core
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage representative_contacts" ON representative_contacts
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage representative_social_media" ON representative_social_media
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage representative_photos" ON representative_photos
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage id_crosswalk" ON id_crosswalk
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage data_quality_metrics" ON data_quality_metrics
    FOR ALL USING (auth.role() = 'service_role');
