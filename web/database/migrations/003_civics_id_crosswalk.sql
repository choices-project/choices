-- ============================================================================
-- CHOICES PLATFORM - MIGRATION 003: CIVICS ID CROSSWALK SYSTEM
-- ============================================================================
-- Phase: Civics Data Ingestion Implementation
-- Purpose: Canonical ID system to prevent join failures and data inconsistencies
-- 
-- Created: January 15, 2025
-- Status: Production Ready
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ID CROSSWALK SYSTEM
-- ============================================================================

-- Canonical ID mapping for all entities across data sources
CREATE TABLE IF NOT EXISTS id_crosswalk (
  entity_uuid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('person','committee','bill','jurisdiction','election')),
  canonical_id TEXT NOT NULL,
  source TEXT NOT NULL,
  source_id TEXT NOT NULL,
  attrs JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique source + source_id combinations
  UNIQUE (source, source_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_id_crosswalk_entity_type_canonical ON id_crosswalk (entity_type, canonical_id);
CREATE INDEX IF NOT EXISTS idx_id_crosswalk_source ON id_crosswalk (source);
CREATE INDEX IF NOT EXISTS idx_id_crosswalk_canonical_id ON id_crosswalk (canonical_id);

-- ============================================================================
-- CIVICS CORE TABLES
-- ============================================================================

-- Candidates table with canonical ID integration
CREATE TABLE IF NOT EXISTS candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_id TEXT NOT NULL UNIQUE, -- Links to id_crosswalk
  name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  party TEXT CHECK (party IN ('D','R','I','L','G','N','U')),
  office TEXT NOT NULL,
  chamber TEXT CHECK (chamber IN ('house', 'senate', 'state_house', 'state_senate', 'local')),
  state TEXT NOT NULL CHECK (LENGTH(state) = 2),
  district TEXT,
  level TEXT NOT NULL CHECK (level IN ('federal', 'state', 'local')),
  
  -- Contact Information
  email TEXT,
  phone TEXT,
  website TEXT,
  photo_url TEXT,
  
  -- Social Media
  social_media JSONB DEFAULT '{}',
  
  -- Geographic Data
  ocd_division_id TEXT,
  jurisdiction_ids TEXT[],
  
  -- Verification
  verified BOOLEAN DEFAULT FALSE,
  verification_method TEXT,
  verification_date TIMESTAMPTZ,
  
  -- Data Quality
  data_sources TEXT[] NOT NULL,
  quality_score DECIMAL(3,2) DEFAULT 0.0 CHECK (quality_score >= 0 AND quality_score <= 1),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Provenance
  provenance JSONB DEFAULT '{}',
  license_key TEXT
);

-- Indexes for candidates
CREATE INDEX IF NOT EXISTS idx_candidates_canonical_id ON candidates (canonical_id);
CREATE INDEX IF NOT EXISTS idx_candidates_state_district ON candidates (state, district);
CREATE INDEX IF NOT EXISTS idx_candidates_office_level ON candidates (office, level);
CREATE INDEX IF NOT EXISTS idx_candidates_verified ON candidates (verified);
CREATE INDEX IF NOT EXISTS idx_candidates_quality_score ON candidates (quality_score);

-- Elections table
CREATE TABLE IF NOT EXISTS elections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_id TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('general', 'primary', 'special', 'runoff')),
  level TEXT NOT NULL CHECK (level IN ('federal', 'state', 'local')),
  state TEXT NOT NULL CHECK (LENGTH(state) = 2),
  district TEXT,
  
  -- Dates
  election_date DATE NOT NULL,
  registration_deadline DATE,
  early_voting_start DATE,
  early_voting_end DATE,
  
  -- Geographic
  ocd_division_id TEXT,
  jurisdiction_ids TEXT[],
  
  -- Status
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'completed')),
  results_available BOOLEAN DEFAULT FALSE,
  
  -- Data Quality
  data_sources TEXT[] NOT NULL,
  quality_score DECIMAL(3,2) DEFAULT 0.0 CHECK (quality_score >= 0 AND quality_score <= 1),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Provenance
  provenance JSONB DEFAULT '{}',
  license_key TEXT
);

-- Indexes for elections
CREATE INDEX IF NOT EXISTS idx_elections_canonical_id ON elections (canonical_id);
CREATE INDEX IF NOT EXISTS idx_elections_date ON elections (election_date);
CREATE INDEX IF NOT EXISTS idx_elections_state_type ON elections (state, type);
CREATE INDEX IF NOT EXISTS idx_elections_status ON elections (status);

-- Campaign Finance table
CREATE TABLE IF NOT EXISTS campaign_finance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id),
  committee_id TEXT,
  committee_name TEXT,
  cycle INTEGER NOT NULL,
  
  -- Financial Totals
  total_receipts DECIMAL(15,2) DEFAULT 0.0,
  total_disbursements DECIMAL(15,2) DEFAULT 0.0,
  cash_on_hand DECIMAL(15,2) DEFAULT 0.0,
  debt DECIMAL(15,2) DEFAULT 0.0,
  
  -- Contribution Breakdown
  individual_contributions DECIMAL(15,2) DEFAULT 0.0,
  pac_contributions DECIMAL(15,2) DEFAULT 0.0,
  party_contributions DECIMAL(15,2) DEFAULT 0.0,
  self_financing DECIMAL(15,2) DEFAULT 0.0,
  
  -- Independence Metrics
  independence_score DECIMAL(3,2) DEFAULT 0.0 CHECK (independence_score >= 0 AND independence_score <= 1),
  top_donor_percentage DECIMAL(5,2) DEFAULT 0.0,
  corporate_donor_percentage DECIMAL(5,2) DEFAULT 0.0,
  
  -- Data Quality
  data_sources TEXT[] NOT NULL,
  quality_score DECIMAL(3,2) DEFAULT 0.0 CHECK (quality_score >= 0 AND quality_score <= 1),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Provenance
  provenance JSONB DEFAULT '{}',
  license_key TEXT
);

-- Indexes for campaign finance
CREATE INDEX IF NOT EXISTS idx_campaign_finance_candidate ON campaign_finance (candidate_id);
CREATE INDEX IF NOT EXISTS idx_campaign_finance_cycle ON campaign_finance (cycle);
CREATE INDEX IF NOT EXISTS idx_campaign_finance_independence ON campaign_finance (independence_score);

-- Contributions table
CREATE TABLE IF NOT EXISTS contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id),
  committee_id TEXT,
  
  -- Contributor Information (PII-protected)
  contributor_name_hash TEXT, -- Hashed for privacy
  contributor_city TEXT,
  contributor_state TEXT CHECK (LENGTH(contributor_state) = 2),
  contributor_zip5 TEXT,
  contributor_employer TEXT,
  contributor_occupation TEXT,
  
  -- Contribution Details
  amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
  contribution_date DATE NOT NULL,
  contribution_type TEXT CHECK (contribution_type IN ('individual', 'pac', 'party', 'self')),
  
  -- Industry Classification
  sector TEXT,
  industry TEXT,
  
  -- Data Quality
  data_sources TEXT[] NOT NULL,
  quality_score DECIMAL(3,2) DEFAULT 0.0 CHECK (quality_score >= 0 AND quality_score <= 1),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Provenance
  provenance JSONB DEFAULT '{}',
  license_key TEXT,
  
  -- Retention policy
  retention_until DATE
);

-- Indexes for contributions
CREATE INDEX IF NOT EXISTS idx_contributions_candidate ON contributions (candidate_id);
CREATE INDEX IF NOT EXISTS idx_contributions_amount ON contributions (amount);
CREATE INDEX IF NOT EXISTS idx_contributions_date ON contributions (contribution_date);
CREATE INDEX IF NOT EXISTS idx_contributions_sector ON contributions (sector);
CREATE INDEX IF NOT EXISTS idx_contributions_retention ON contributions (retention_until);

-- Voting Records table
CREATE TABLE IF NOT EXISTS voting_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id),
  
  -- Vote Information
  bill_id TEXT,
  bill_title TEXT,
  bill_subject TEXT,
  vote TEXT NOT NULL CHECK (vote IN ('yea', 'nay', 'present', 'not_voting')),
  vote_date DATE NOT NULL,
  chamber TEXT,
  
  -- Bill Details
  bill_type TEXT CHECK (bill_type IN ('house', 'senate', 'concurrent')),
  bill_number TEXT,
  congress_number INTEGER,
  
  -- Context
  vote_description TEXT,
  vote_question TEXT,
  
  -- Data Quality
  data_sources TEXT[] NOT NULL,
  quality_score DECIMAL(3,2) DEFAULT 0.0 CHECK (quality_score >= 0 AND quality_score <= 1),
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Provenance
  provenance JSONB DEFAULT '{}',
  license_key TEXT
);

-- Indexes for voting records
CREATE INDEX IF NOT EXISTS idx_voting_records_candidate ON voting_records (candidate_id);
CREATE INDEX IF NOT EXISTS idx_voting_records_bill ON voting_records (bill_id);
CREATE INDEX IF NOT EXISTS idx_voting_records_date ON voting_records (vote_date);
CREATE INDEX IF NOT EXISTS idx_voting_records_vote ON voting_records (vote);

-- ============================================================================
-- DATA LICENSES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_licenses (
  license_key TEXT PRIMARY KEY,
  source_name TEXT NOT NULL,
  attribution_text TEXT NOT NULL,
  display_requirements TEXT,
  cache_ttl_seconds INTEGER,
  usage_restrictions JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEPENDENCE SCORE METHODOLOGY
-- ============================================================================

CREATE TABLE IF NOT EXISTS independence_score_methodology (
  version TEXT PRIMARY KEY,
  formula TEXT NOT NULL,
  data_sources TEXT[] NOT NULL,
  confidence_interval DECIMAL(3,2),
  experimental BOOLEAN DEFAULT TRUE,
  methodology_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INGESTION CURSORS
-- ============================================================================

CREATE TABLE IF NOT EXISTS ingest_cursors (
  source TEXT PRIMARY KEY,
  cursor JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DATA QUALITY AUDIT
-- ============================================================================

CREATE TABLE IF NOT EXISTS data_quality_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  
  -- Quality Metrics
  completeness_score DECIMAL(3,2) DEFAULT 0.0 CHECK (completeness_score >= 0 AND completeness_score <= 1),
  accuracy_score DECIMAL(3,2) DEFAULT 0.0 CHECK (accuracy_score >= 0 AND accuracy_score <= 1),
  consistency_score DECIMAL(3,2) DEFAULT 0.0 CHECK (consistency_score >= 0 AND consistency_score <= 1),
  timeliness_score DECIMAL(3,2) DEFAULT 0.0 CHECK (timeliness_score >= 0 AND timeliness_score <= 1),
  overall_score DECIMAL(3,2) DEFAULT 0.0 CHECK (overall_score >= 0 AND overall_score <= 1),
  
  -- Data Sources
  primary_source TEXT,
  secondary_sources TEXT[],
  conflict_resolution TEXT,
  
  -- Audit Trail
  last_validation TIMESTAMPTZ DEFAULT NOW(),
  validation_method TEXT,
  issues_found TEXT[],
  resolved_issues TEXT[],
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for data quality audit
CREATE INDEX IF NOT EXISTS idx_data_quality_table ON data_quality_audit (table_name);
CREATE INDEX IF NOT EXISTS idx_data_quality_record ON data_quality_audit (record_id);
CREATE INDEX IF NOT EXISTS idx_data_quality_score ON data_quality_audit (overall_score);

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to normalize bill IDs
CREATE OR REPLACE FUNCTION norm_bill_id(congress INTEGER, bill_type TEXT, number INTEGER)
RETURNS TEXT LANGUAGE SQL IMMUTABLE AS $$
  SELECT LOWER(congress::TEXT || '-' || REPLACE(bill_type, '.', '') || '-' || number::TEXT)
$$;

-- Function to validate state codes
CREATE OR REPLACE FUNCTION validate_state_code(state_code TEXT)
RETURNS BOOLEAN AS $$
  SELECT state_code IN ('AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC');
$$ LANGUAGE SQL IMMUTABLE;

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE id_crosswalk ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE elections ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_finance ENABLE ROW LEVEL SECURITY;
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE voting_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE independence_score_methodology ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingest_cursors ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_quality_audit ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (can be customized based on requirements)
-- For now, allow authenticated users to read all data
CREATE POLICY "Allow authenticated read access" ON id_crosswalk FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON candidates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON elections FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON campaign_finance FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON contributions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON voting_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON data_licenses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON independence_score_methodology FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON ingest_cursors FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON data_quality_audit FOR SELECT TO authenticated USING (true);

-- ============================================================================
-- INITIAL DATA SEEDING
-- ============================================================================

-- Insert initial data licenses
INSERT INTO data_licenses (license_key, source_name, attribution_text, display_requirements, cache_ttl_seconds) VALUES
('congress-gov', 'Congress.gov', 'Data provided by Congress.gov', 'Must display attribution', 86400),
('fec', 'Federal Election Commission', 'Data provided by the Federal Election Commission', 'Must display attribution', 86400),
('open-states', 'Open States', 'Data provided by Open States', 'Must display attribution', 86400),
('opensecrets', 'OpenSecrets', 'Data provided by OpenSecrets', 'Must display attribution', 86400),
('google-civic', 'Google Civic Information API', 'Data provided by Google Civic Information API', 'Must display attribution', 3600),
('govtrack', 'GovTrack.us', 'Data provided by GovTrack.us', 'Must display attribution', 86400)
ON CONFLICT (license_key) DO NOTHING;

-- Insert initial independence score methodology
INSERT INTO independence_score_methodology (version, formula, data_sources, confidence_interval, experimental, methodology_url) VALUES
('1.0', 'independence_score = 100 - (pac_percentage * 0.4 + top10_donor_percentage * 0.3 + corporate_percentage * 0.3)', 
 ARRAY['fec', 'opensecrets'], 0.05, true, 'https://choices-platform.com/methodology/independence-score')
ON CONFLICT (version) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE id_crosswalk IS 'Canonical ID mapping system to prevent join failures across data sources';
COMMENT ON TABLE candidates IS 'Candidates with canonical ID integration and comprehensive data quality tracking';
COMMENT ON TABLE elections IS 'Elections with canonical ID integration and geographic mapping';
COMMENT ON TABLE campaign_finance IS 'Campaign finance data with independence scoring and cycle-based partitioning';
COMMENT ON TABLE contributions IS 'Individual contributions with PII protection and industry classification';
COMMENT ON TABLE voting_records IS 'Voting records with bill information and context';
COMMENT ON TABLE data_licenses IS 'Data source licensing and attribution requirements';
COMMENT ON TABLE independence_score_methodology IS 'Transparent methodology for independence scoring';
COMMENT ON TABLE ingest_cursors IS 'Resumable ingestion state tracking';
COMMENT ON TABLE data_quality_audit IS 'Comprehensive data quality tracking and audit trails';
