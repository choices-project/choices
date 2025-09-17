-- Enhanced Contact Information Schema
-- This extends the civics schema with comprehensive contact and social media data

-- Contact Information Table
CREATE TABLE IF NOT EXISTS public.civics_contact_info (
  id SERIAL PRIMARY KEY,
  representative_id INTEGER REFERENCES public.civics_representatives(id) ON DELETE CASCADE,
  
  -- Official Contact Information
  official_email TEXT,
  official_phone TEXT,
  official_fax TEXT,
  official_website TEXT,
  
  -- Office Addresses (JSON array for multiple offices)
  office_addresses JSONB DEFAULT '[]'::jsonb,
  
  -- Social Media Profiles
  social_media JSONB DEFAULT '{}'::jsonb, -- {twitter: "@handle", facebook: "url", instagram: "@handle", etc.}
  
  -- Communication Preferences
  preferred_contact_method TEXT, -- 'email', 'phone', 'mail', 'social'
  response_time_expectation TEXT, -- 'same_day', 'within_week', 'within_month'
  
  -- Data Quality and Source Tracking
  data_source TEXT DEFAULT 'api_collection',
  last_verified TIMESTAMPTZ DEFAULT NOW(),
  verification_notes TEXT,
  data_quality_score INTEGER DEFAULT 100,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Social Media Engagement Tracking
CREATE TABLE IF NOT EXISTS public.civics_social_engagement (
  id SERIAL PRIMARY KEY,
  representative_id INTEGER REFERENCES public.civics_representatives(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'twitter', 'facebook', 'instagram', 'youtube', 'tiktok'
  handle TEXT NOT NULL,
  url TEXT,
  
  -- Engagement Metrics (updated periodically)
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  last_post_date TIMESTAMPTZ,
  
  -- Verification Status
  verified BOOLEAN DEFAULT FALSE,
  official_account BOOLEAN DEFAULT TRUE,
  
  -- Data Source
  data_source TEXT DEFAULT 'social_api',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Communication History (for tracking engagement)
CREATE TABLE IF NOT EXISTS public.civics_communication_log (
  id SERIAL PRIMARY KEY,
  representative_id INTEGER REFERENCES public.civics_representatives(id) ON DELETE CASCADE,
  user_id TEXT, -- Optional: if you want to track user interactions
  
  -- Communication Details
  communication_type TEXT NOT NULL, -- 'email', 'phone', 'mail', 'social_dm', 'form_submission'
  subject TEXT,
  message_preview TEXT, -- First 200 chars for privacy
  status TEXT DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'replied', 'ignored'
  
  -- Response Tracking
  response_received BOOLEAN DEFAULT FALSE,
  response_time_hours INTEGER, -- Hours to response
  response_quality TEXT, -- 'helpful', 'generic', 'unhelpful', 'none'
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Representatives Table (add contact fields)
ALTER TABLE public.civics_representatives 
ADD COLUMN IF NOT EXISTS contact_info_available BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS social_media_available BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_contact_update TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS contact_quality_score INTEGER DEFAULT 0;

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_contact_info_rep 
ON public.civics_contact_info (representative_id);

CREATE INDEX IF NOT EXISTS idx_social_engagement_rep_platform 
ON public.civics_social_engagement (representative_id, platform);

CREATE INDEX IF NOT EXISTS idx_communication_log_rep_date 
ON public.civics_communication_log (representative_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reps_contact_available 
ON public.civics_representatives (contact_info_available);

CREATE INDEX IF NOT EXISTS idx_reps_social_available 
ON public.civics_representatives (social_media_available);

-- Update triggers
CREATE TRIGGER set_contact_info_updated_at
  BEFORE UPDATE ON public.civics_contact_info
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_social_engagement_updated_at
  BEFORE UPDATE ON public.civics_social_engagement
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_communication_log_updated_at
  BEFORE UPDATE ON public.civics_communication_log
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Views for easy querying
CREATE OR REPLACE VIEW public.representative_contact_summary AS
SELECT 
  r.id,
  r.name,
  r.office,
  r.level,
  r.jurisdiction,
  r.party,
  ci.official_email,
  ci.official_phone,
  ci.official_website,
  ci.social_media,
  ci.office_addresses,
  ci.preferred_contact_method,
  ci.data_quality_score as contact_quality_score,
  ci.last_verified as contact_last_verified,
  r.contact_info_available,
  r.social_media_available
FROM public.civics_representatives r
LEFT JOIN public.civics_contact_info ci ON r.id = ci.representative_id;

CREATE OR REPLACE VIEW public.representative_social_summary AS
SELECT 
  r.id,
  r.name,
  r.office,
  r.level,
  r.jurisdiction,
  se.platform,
  se.handle,
  se.url,
  se.followers_count,
  se.engagement_rate,
  se.verified,
  se.official_account,
  se.last_updated as social_last_updated
FROM public.civics_representatives r
LEFT JOIN public.civics_social_engagement se ON r.id = se.representative_id;

-- Functions for contact data management
CREATE OR REPLACE FUNCTION update_representative_contact_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Update the representative's contact availability status
  UPDATE public.civics_representatives 
  SET 
    contact_info_available = TRUE,
    last_contact_update = NOW(),
    contact_quality_score = NEW.data_quality_score
  WHERE id = NEW.representative_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_contact_status_on_insert
  AFTER INSERT ON public.civics_contact_info
  FOR EACH ROW EXECUTE FUNCTION update_representative_contact_status();

CREATE TRIGGER update_contact_status_on_update
  AFTER UPDATE ON public.civics_contact_info
  FOR EACH ROW EXECUTE FUNCTION update_representative_contact_status();

-- Function to get contact methods for a representative
CREATE OR REPLACE FUNCTION get_representative_contact_methods(rep_id INTEGER)
RETURNS TABLE (
  method TEXT,
  value TEXT,
  verified BOOLEAN,
  quality_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'email'::TEXT as method,
    ci.official_email as value,
    (ci.data_quality_score >= 90) as verified,
    ci.data_quality_score as quality_score
  FROM public.civics_contact_info ci
  WHERE ci.representative_id = rep_id AND ci.official_email IS NOT NULL
  
  UNION ALL
  
  SELECT 
    'phone'::TEXT as method,
    ci.official_phone as value,
    (ci.data_quality_score >= 90) as verified,
    ci.data_quality_score as quality_score
  FROM public.civics_contact_info ci
  WHERE ci.representative_id = rep_id AND ci.official_phone IS NOT NULL
  
  UNION ALL
  
  SELECT 
    'website'::TEXT as method,
    ci.official_website as value,
    (ci.data_quality_score >= 90) as verified,
    ci.data_quality_score as quality_score
  FROM public.civics_contact_info ci
  WHERE ci.representative_id = rep_id AND ci.official_website IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE public.civics_contact_info IS 'Comprehensive contact information for representatives';
COMMENT ON TABLE public.civics_social_engagement IS 'Social media profiles and engagement metrics';
COMMENT ON TABLE public.civics_communication_log IS 'Log of communications with representatives';

COMMENT ON COLUMN public.civics_contact_info.office_addresses IS 'JSON array of office locations with full addresses';
COMMENT ON COLUMN public.civics_contact_info.social_media IS 'JSON object with social media handles and URLs';
COMMENT ON COLUMN public.civics_contact_info.preferred_contact_method IS 'Representative preferred method of contact';
COMMENT ON COLUMN public.civics_contact_info.response_time_expectation IS 'Expected response time for communications';

COMMENT ON COLUMN public.civics_social_engagement.followers_count IS 'Number of followers/subscribers';
COMMENT ON COLUMN public.civics_social_engagement.engagement_rate IS 'Average engagement rate percentage';
COMMENT ON COLUMN public.civics_social_engagement.verified IS 'Whether the account is verified by the platform';
COMMENT ON COLUMN public.civics_social_engagement.official_account IS 'Whether this is an official government account';

COMMENT ON COLUMN public.civics_communication_log.communication_type IS 'Type of communication sent';
COMMENT ON COLUMN public.civics_communication_log.response_quality IS 'Quality assessment of any response received';
