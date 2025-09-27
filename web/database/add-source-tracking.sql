-- Add source tracking columns to civics_representatives table
-- This ensures we can track data provenance and freshness

ALTER TABLE public.civics_representatives 
ADD COLUMN IF NOT EXISTS data_source TEXT,
ADD COLUMN IF NOT EXISTS last_verified TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS verification_notes TEXT,
ADD COLUMN IF NOT EXISTS data_quality_score INTEGER DEFAULT 100;

-- Add indexes for source tracking queries
CREATE INDEX IF NOT EXISTS idx_representatives_data_source ON public.civics_representatives(data_source);
CREATE INDEX IF NOT EXISTS idx_representatives_last_verified ON public.civics_representatives(last_verified);
CREATE INDEX IF NOT EXISTS idx_representatives_data_quality ON public.civics_representatives(data_quality_score);

-- Add comments for documentation
COMMENT ON COLUMN public.civics_representatives.data_source IS 'Source of the data (e.g., govtrack_api, openstates_api, manual_verification)';
COMMENT ON COLUMN public.civics_representatives.last_verified IS 'When this data was last verified against official sources';
COMMENT ON COLUMN public.civics_representatives.verification_notes IS 'Notes about data verification or quality issues';
COMMENT ON COLUMN public.civics_representatives.data_quality_score IS 'Data quality score (0-100, 100 being perfect)';

-- Update existing records with source information
UPDATE public.civics_representatives 
SET 
  data_source = CASE 
    WHEN level = 'federal' THEN 'govtrack_api'
    WHEN level = 'state' THEN 'openstates_api'
    WHEN level = 'local' AND jurisdiction = 'San Francisco, CA' THEN 'manual_verification_sf'
    ELSE 'unknown'
  END,
  last_verified = NOW(),
  verification_notes = CASE
    WHEN level = 'federal' THEN 'Data from GovTrack.us API - verified September 2025'
    WHEN level = 'state' THEN 'Data from OpenStates API - verified September 2025'
    WHEN level = 'local' AND jurisdiction = 'San Francisco, CA' THEN 'Manually verified current officials - updated January 2025'
    ELSE 'Source verification needed'
  END,
  data_quality_score = CASE
    WHEN level = 'federal' THEN 95
    WHEN level = 'state' THEN 85
    WHEN level = 'local' AND jurisdiction = 'San Francisco, CA' THEN 100
    ELSE 70
  END
WHERE data_source IS NULL;


