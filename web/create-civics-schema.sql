-- Civics Database Schema Creation
-- Created: October 8, 2025
-- Purpose: Add civics tables to existing polling platform database

-- Create the representatives_core table with JSONB columns for enhanced data
CREATE TABLE IF NOT EXISTS public.representatives_core (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    office VARCHAR(100),
    level VARCHAR(50),
    state VARCHAR(10),
    district VARCHAR(50),
    party VARCHAR(100),
    bioguide_id VARCHAR(20) UNIQUE,
    openstates_id VARCHAR(50),
    fec_id VARCHAR(20),
    google_civic_id VARCHAR(50),
    legiscan_id VARCHAR(50),
    congress_gov_id VARCHAR(50),
    govinfo_id VARCHAR(50),
    wikipedia_url TEXT,
    ballotpedia_url TEXT,
    twitter_handle VARCHAR(100),
    facebook_url TEXT,
    instagram_handle VARCHAR(100),
    linkedin_url TEXT,
    youtube_channel VARCHAR(100),
    primary_email VARCHAR(255),
    primary_phone VARCHAR(50),
    primary_website TEXT,
    primary_photo_url TEXT,
    term_start_date DATE,
    term_end_date DATE,
    next_election_date DATE,
    data_quality_score INTEGER DEFAULT 0,
    data_sources TEXT[],
    last_verified TIMESTAMP,
    verification_status VARCHAR(50) DEFAULT 'unverified',
    created_at TIMESTAMP DEFAULT NOW(),
    last_updated TIMESTAMP DEFAULT NOW(),
    
    -- JSONB columns for enhanced data
    enhanced_contacts JSONB DEFAULT '[]'::jsonb,
    enhanced_photos JSONB DEFAULT '[]'::jsonb,
    enhanced_activity JSONB DEFAULT '[]'::jsonb,
    enhanced_social_media JSONB DEFAULT '[]'::jsonb
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_representatives_core_bioguide_id ON public.representatives_core(bioguide_id);
CREATE INDEX IF NOT EXISTS idx_representatives_core_state ON public.representatives_core(state);
CREATE INDEX IF NOT EXISTS idx_representatives_core_level ON public.representatives_core(level);
CREATE INDEX IF NOT EXISTS idx_representatives_core_office ON public.representatives_core(office);
CREATE INDEX IF NOT EXISTS idx_representatives_core_party ON public.representatives_core(party);

-- Create indexes for JSONB columns
CREATE INDEX IF NOT EXISTS idx_representatives_core_enhanced_contacts ON public.representatives_core USING GIN (enhanced_contacts);
CREATE INDEX IF NOT EXISTS idx_representatives_core_enhanced_photos ON public.representatives_core USING GIN (enhanced_photos);
CREATE INDEX IF NOT EXISTS idx_representatives_core_enhanced_activity ON public.representatives_core USING GIN (enhanced_activity);
CREATE INDEX IF NOT EXISTS idx_representatives_core_enhanced_social_media ON public.representatives_core USING GIN (enhanced_social_media);

-- Enable Row Level Security (RLS) - disabled for now to allow service role access
ALTER TABLE public.representatives_core DISABLE ROW LEVEL SECURITY;

-- Grant permissions to service role
GRANT ALL ON public.representatives_core TO service_role;
GRANT USAGE, SELECT ON SEQUENCE public.representatives_core_id_seq TO service_role;

-- Insert a test record to verify the table works
INSERT INTO public.representatives_core (
    name, office, level, state, party, bioguide_id,
    enhanced_contacts, enhanced_photos, enhanced_activity, enhanced_social_media,
    data_quality_score, data_sources, verification_status
) VALUES (
    'Test Representative',
    'US House',
    'federal',
    'NY',
    'Democratic',
    'TEST001',
    '[{"type": "website", "value": "https://example.com", "source": "test", "isPrimary": true, "isVerified": true}]'::jsonb,
    '[{"url": "https://example.com/photo.jpg", "source": "test", "altText": "Test photo"}]'::jsonb,
    '[{"type": "test", "title": "Test Activity", "description": "Test description", "date": "2025-10-08T15:00:00Z", "source": "test"}]'::jsonb,
    '[]'::jsonb,
    75,
    ARRAY['test'],
    'verified'
) ON CONFLICT (bioguide_id) DO NOTHING;

-- Verify the table was created and populated
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN enhanced_contacts != '[]'::jsonb THEN 1 END) as with_contacts,
    COUNT(CASE WHEN enhanced_photos != '[]'::jsonb THEN 1 END) as with_photos,
    COUNT(CASE WHEN enhanced_activity != '[]'::jsonb THEN 1 END) as with_activity
FROM public.representatives_core;

