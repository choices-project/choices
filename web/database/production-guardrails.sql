-- Production Guardrails for Civics System
-- Canonical crosswalk, source precedence, and data integrity

-- 1. Canonical Crosswalk Table
CREATE TABLE IF NOT EXISTS public.civics_person_xref (
  person_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bioguide TEXT UNIQUE,
  govtrack_id INTEGER UNIQUE,
  openstates_id TEXT UNIQUE,
  fec_candidate_id TEXT UNIQUE,
  propublica_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add person_id FK to representatives table
ALTER TABLE public.civics_representatives 
ADD COLUMN IF NOT EXISTS person_id UUID REFERENCES public.civics_person_xref(person_id),
ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS external_id TEXT NOT NULL DEFAULT 'unknown',
ADD COLUMN IF NOT EXISTS data_origin TEXT NOT NULL DEFAULT 'api' CHECK (data_origin IN ('manual', 'api')),
ADD COLUMN IF NOT EXISTS valid_from TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS valid_to TIMESTAMPTZ DEFAULT 'infinity'::timestamptz;

-- 3. Unique constraint for source + external_id
CREATE UNIQUE INDEX IF NOT EXISTS uniq_rep_source_external 
ON public.civics_representatives (source, external_id) 
WHERE valid_to = 'infinity'::timestamptz;

-- 4. Source Precedence Configuration
CREATE TABLE IF NOT EXISTS public.civics_source_precedence (
  level TEXT NOT NULL,
  source TEXT NOT NULL,
  precedence_order INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (level, source)
);

-- Insert precedence rules
INSERT INTO public.civics_source_precedence (level, source, precedence_order) VALUES
  ('federal', 'propublica_api', 1),
  ('federal', 'govtrack_api', 2),
  ('state', 'openstates_api', 1),
  ('state', 'manual_verification', 2),
  ('local', 'manual_verification', 1),
  ('local', 'google_civic_api', 2)
ON CONFLICT (level, source) DO UPDATE SET
  precedence_order = EXCLUDED.precedence_order,
  is_active = EXCLUDED.is_active;

-- 5. Expected Counts Gate
CREATE TABLE IF NOT EXISTS public.civics_expected_counts (
  id SERIAL PRIMARY KEY,
  level TEXT NOT NULL,
  jurisdiction TEXT NOT NULL,
  expected_count INTEGER NOT NULL,
  actual_count INTEGER,
  count_date DATE NOT NULL DEFAULT CURRENT_DATE,
  drift_percentage DECIMAL(5,2),
  is_within_threshold BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Data Quality Thresholds
CREATE TABLE IF NOT EXISTS public.civics_quality_thresholds (
  id SERIAL PRIMARY KEY,
  level TEXT NOT NULL,
  min_quality_score INTEGER DEFAULT 85,
  max_freshness_days INTEGER DEFAULT 7,
  alert_threshold_percentage DECIMAL(5,2) DEFAULT 2.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.civics_quality_thresholds (level, min_quality_score, max_freshness_days) VALUES
  ('federal', 90, 7),
  ('state', 85, 14),
  ('local', 80, 30)
ON CONFLICT DO NOTHING;

-- 7. RLS Policies for Security
ALTER TABLE public.civics_representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.civics_contact_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.civics_social_engagement ENABLE ROW LEVEL SECURITY;

-- Public read access for representatives
CREATE POLICY "Public read access for representatives" ON public.civics_representatives
  FOR SELECT USING (true);

CREATE POLICY "Public read access for contact info" ON public.civics_contact_info
  FOR SELECT USING (true);

CREATE POLICY "Public read access for social media" ON public.civics_social_engagement
  FOR SELECT USING (true);

-- 8. Public Views for Client Access
CREATE OR REPLACE VIEW public.v_representatives_public AS
SELECT 
  r.person_id,
  r.id,
  r.name,
  r.party,
  r.office,
  r.level,
  r.jurisdiction,
  r.district,
  r.data_source,
  r.data_quality_score,
  r.last_updated,
  r.valid_from,
  r.valid_to,
  -- Source attribution
  CASE 
    WHEN r.data_source = 'govtrack_api' THEN 'GovTrack.us'
    WHEN r.data_source = 'openstates_api' THEN 'OpenStates.org'
    WHEN r.data_source = 'propublica_api' THEN 'ProPublica'
    WHEN r.data_source = 'google_civic_api' THEN 'Google Civic Information API'
    WHEN r.data_source = 'manual_verification_sf' THEN 'San Francisco City Clerk'
    WHEN r.data_source = 'manual_verification_la' THEN 'Los Angeles City Clerk'
    ELSE 'Unknown Source'
  END as source_attribution,
  CASE 
    WHEN r.data_source = 'govtrack_api' THEN 'https://www.govtrack.us'
    WHEN r.data_source = 'openstates_api' THEN 'https://openstates.org'
    WHEN r.data_source = 'propublica_api' THEN 'https://projects.propublica.org/api-docs/congress-api'
    WHEN r.data_source = 'google_civic_api' THEN 'https://developers.google.com/civic-information'
    ELSE NULL
  END as source_url
FROM public.civics_representatives r
WHERE r.valid_to = 'infinity'::timestamptz;

-- 9. Data Integrity Functions
CREATE OR REPLACE FUNCTION check_count_drift(
  p_level TEXT,
  p_jurisdiction TEXT,
  p_actual_count INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
  v_expected_count INTEGER;
  v_drift_percentage DECIMAL(5,2);
  v_threshold DECIMAL(5,2);
BEGIN
  -- Get expected count from last successful run
  SELECT expected_count INTO v_expected_count
  FROM public.civics_expected_counts
  WHERE level = p_level 
    AND jurisdiction = p_jurisdiction
    AND is_within_threshold = TRUE
  ORDER BY count_date DESC
  LIMIT 1;
  
  -- Get threshold
  SELECT alert_threshold_percentage INTO v_threshold
  FROM public.civics_quality_thresholds
  WHERE level = p_level;
  
  -- Calculate drift
  IF v_expected_count IS NOT NULL AND v_expected_count > 0 THEN
    v_drift_percentage := ABS(p_actual_count - v_expected_count) * 100.0 / v_expected_count;
    
    -- Log the count check
    INSERT INTO public.civics_expected_counts (
      level, jurisdiction, expected_count, actual_count, 
      drift_percentage, is_within_threshold
    ) VALUES (
      p_level, p_jurisdiction, v_expected_count, p_actual_count,
      v_drift_percentage, v_drift_percentage <= v_threshold
    );
    
    RETURN v_drift_percentage <= v_threshold;
  END IF;
  
  -- If no expected count, allow first run
  INSERT INTO public.civics_expected_counts (
    level, jurisdiction, expected_count, actual_count,
    drift_percentage, is_within_threshold
  ) VALUES (
    p_level, p_jurisdiction, p_actual_count, p_actual_count,
    0.0, TRUE
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 10. Minimal FEC Integration Table
CREATE TABLE IF NOT EXISTS public.civics_fec_minimal (
  id SERIAL PRIMARY KEY,
  person_id UUID REFERENCES public.civics_person_xref(person_id),
  fec_candidate_id TEXT NOT NULL,
  election_cycle INTEGER NOT NULL,
  total_receipts DECIMAL(15,2) DEFAULT 0,
  cash_on_hand DECIMAL(15,2) DEFAULT 0,
  data_source TEXT DEFAULT 'fec_api',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(person_id, election_cycle)
);

-- 11. Minimal Voting Records Table
CREATE TABLE IF NOT EXISTS public.civics_votes_minimal (
  id SERIAL PRIMARY KEY,
  person_id UUID REFERENCES public.civics_person_xref(person_id),
  vote_id TEXT NOT NULL,
  bill_title TEXT,
  vote_date DATE NOT NULL,
  vote_position TEXT NOT NULL,
  party_position TEXT,
  chamber TEXT NOT NULL,
  data_source TEXT DEFAULT 'govtrack_api',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_person_xref_bioguide ON public.civics_person_xref(bioguide);
CREATE INDEX IF NOT EXISTS idx_person_xref_govtrack ON public.civics_person_xref(govtrack_id);
CREATE INDEX IF NOT EXISTS idx_person_xref_fec ON public.civics_person_xref(fec_candidate_id);

CREATE INDEX IF NOT EXISTS idx_reps_person_id ON public.civics_representatives(person_id);
CREATE INDEX IF NOT EXISTS idx_reps_source_external ON public.civics_representatives(source, external_id);
CREATE INDEX IF NOT EXISTS idx_reps_valid_period ON public.civics_representatives(valid_from, valid_to);

CREATE INDEX IF NOT EXISTS idx_fec_minimal_person_cycle ON public.civics_fec_minimal(person_id, election_cycle);
CREATE INDEX IF NOT EXISTS idx_votes_minimal_person_date ON public.civics_votes_minimal(person_id, vote_date DESC);

-- 13. Update Triggers
CREATE TRIGGER set_person_xref_updated_at
  BEFORE UPDATE ON public.civics_person_xref
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_fec_minimal_updated_at
  BEFORE UPDATE ON public.civics_fec_minimal
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_votes_minimal_updated_at
  BEFORE UPDATE ON public.civics_votes_minimal
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 14. Comments for Documentation
COMMENT ON TABLE public.civics_person_xref IS 'Canonical crosswalk table linking representatives across all data sources';
COMMENT ON TABLE public.civics_source_precedence IS 'Defines source precedence order for data conflicts';
COMMENT ON TABLE public.civics_expected_counts IS 'Tracks expected vs actual counts for drift detection';
COMMENT ON TABLE public.civics_quality_thresholds IS 'Quality and freshness thresholds by government level';

COMMENT ON COLUMN public.civics_representatives.person_id IS 'Canonical person identifier across all sources';
COMMENT ON COLUMN public.civics_representatives.source IS 'Data source identifier (govtrack_api, openstates_api, etc.)';
COMMENT ON COLUMN public.civics_representatives.external_id IS 'External system identifier for this representative';
COMMENT ON COLUMN public.civics_representatives.data_origin IS 'Whether data is from API or manual verification';
COMMENT ON COLUMN public.civics_representatives.valid_from IS 'Start of validity period for temporal accuracy';
COMMENT ON COLUMN public.civics_representatives.valid_to IS 'End of validity period (infinity for current)';

COMMENT ON FUNCTION check_count_drift IS 'Validates that actual counts are within ±2% of expected counts';
