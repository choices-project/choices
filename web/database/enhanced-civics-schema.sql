-- Enhanced Civics Schema with FEC and Voting Behavior Data
-- This extends the existing civics schema with campaign finance and voting records

-- Campaign Finance Data (FEC)
CREATE TABLE IF NOT EXISTS public.civics_campaign_finance (
  id SERIAL PRIMARY KEY,
  representative_id INTEGER REFERENCES public.civics_representatives(id) ON DELETE CASCADE,
  fec_candidate_id TEXT, -- FEC candidate identifier
  committee_id TEXT, -- FEC committee identifier
  election_year INTEGER NOT NULL,
  total_receipts DECIMAL(15,2) DEFAULT 0,
  total_disbursements DECIMAL(15,2) DEFAULT 0,
  cash_on_hand DECIMAL(15,2) DEFAULT 0,
  individual_contributions DECIMAL(15,2) DEFAULT 0,
  pac_contributions DECIMAL(15,2) DEFAULT 0,
  party_contributions DECIMAL(15,2) DEFAULT 0,
  self_financing DECIMAL(15,2) DEFAULT 0,
  other_contributions DECIMAL(15,2) DEFAULT 0,
  contribution_breakdown JSONB, -- Detailed breakdown by source
  top_contributors JSONB, -- Top 10 contributors
  industry_contributions JSONB, -- Contributions by industry
  raw_fec_data JSONB, -- Complete FEC response
  data_source TEXT DEFAULT 'fec_api',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voting Records and Behavior Analysis
CREATE TABLE IF NOT EXISTS public.civics_votes (
  id SERIAL PRIMARY KEY,
  representative_id INTEGER REFERENCES public.civics_representatives(id) ON DELETE CASCADE,
  vote_id TEXT, -- GovTrack vote ID
  bill_id TEXT, -- Bill identifier
  bill_title TEXT,
  bill_summary TEXT,
  vote_date DATE NOT NULL,
  vote_position TEXT NOT NULL, -- 'yes', 'no', 'not_voting', 'present'
  vote_type TEXT, -- 'passage', 'amendment', 'motion', etc.
  chamber TEXT NOT NULL, -- 'house', 'senate'
  session INTEGER, -- Congressional session
  congress INTEGER, -- Congress number
  roll_call INTEGER,
  vote_result TEXT, -- 'passed', 'failed', etc.
  party_position TEXT, -- How the party voted overall
  raw_vote_data JSONB, -- Complete vote data
  data_source TEXT DEFAULT 'govtrack_api',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voting Behavior Analysis (Aggregated)
CREATE TABLE IF NOT EXISTS public.civics_voting_behavior (
  id SERIAL PRIMARY KEY,
  representative_id INTEGER REFERENCES public.civics_representatives(id) ON DELETE CASCADE,
  analysis_period TEXT NOT NULL, -- 'current_session', 'last_2_years', 'career'
  total_votes INTEGER DEFAULT 0,
  votes_with_party INTEGER DEFAULT 0,
  votes_against_party INTEGER DEFAULT 0,
  party_unity_score DECIMAL(5,2), -- Percentage voting with party
  bipartisan_score DECIMAL(5,2), -- Percentage of bipartisan votes
  missed_votes INTEGER DEFAULT 0,
  attendance_rate DECIMAL(5,2), -- Percentage of votes attended
  key_vote_positions JSONB, -- Positions on key votes
  voting_patterns JSONB, -- Analysis of voting patterns
  ideology_score DECIMAL(5,2), -- Political ideology score (-100 to 100)
  leadership_support_score DECIMAL(5,2), -- Support for party leadership
  data_source TEXT DEFAULT 'govtrack_api',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Policy Positions and Issue Stances
CREATE TABLE IF NOT EXISTS public.civics_policy_positions (
  id SERIAL PRIMARY KEY,
  representative_id INTEGER REFERENCES public.civics_representatives(id) ON DELETE CASCADE,
  issue_category TEXT NOT NULL, -- 'economy', 'healthcare', 'environment', etc.
  issue_name TEXT NOT NULL,
  position TEXT, -- 'support', 'oppose', 'neutral', 'mixed'
  confidence_score DECIMAL(5,2), -- Confidence in position (0-100)
  evidence_sources JSONB, -- Sources supporting this position
  last_vote_date DATE, -- Most recent vote on this issue
  position_notes TEXT,
  data_source TEXT DEFAULT 'vote_analysis',
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Representatives Table (add FEC and voting fields)
ALTER TABLE public.civics_representatives 
ADD COLUMN IF NOT EXISTS fec_candidate_id TEXT,
ADD COLUMN IF NOT EXISTS fec_committee_id TEXT,
ADD COLUMN IF NOT EXISTS govtrack_id TEXT,
ADD COLUMN IF NOT EXISTS votesmart_id TEXT,
ADD COLUMN IF NOT EXISTS opensecrets_id TEXT,
ADD COLUMN IF NOT EXISTS last_fec_update TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_vote_update TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS campaign_finance_available BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS voting_records_available BOOLEAN DEFAULT FALSE;

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_campaign_finance_rep_year 
ON public.civics_campaign_finance (representative_id, election_year);

CREATE INDEX IF NOT EXISTS idx_campaign_finance_fec_id 
ON public.civics_campaign_finance (fec_candidate_id);

CREATE INDEX IF NOT EXISTS idx_votes_rep_date 
ON public.civics_votes (representative_id, vote_date DESC);

CREATE INDEX IF NOT EXISTS idx_votes_bill_id 
ON public.civics_votes (bill_id);

CREATE INDEX IF NOT EXISTS idx_voting_behavior_rep_period 
ON public.civics_voting_behavior (representative_id, analysis_period);

CREATE INDEX IF NOT EXISTS idx_policy_positions_rep_issue 
ON public.civics_policy_positions (representative_id, issue_category);

CREATE INDEX IF NOT EXISTS idx_reps_fec_id 
ON public.civics_representatives (fec_candidate_id);

CREATE INDEX IF NOT EXISTS idx_reps_govtrack_id 
ON public.civics_representatives (govtrack_id);

-- Update trigger for all tables
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_campaign_finance_updated_at
  BEFORE UPDATE ON public.civics_campaign_finance
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_votes_updated_at
  BEFORE UPDATE ON public.civics_votes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_voting_behavior_updated_at
  BEFORE UPDATE ON public.civics_voting_behavior
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_policy_positions_updated_at
  BEFORE UPDATE ON public.civics_policy_positions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Views for easy querying
CREATE OR REPLACE VIEW public.representative_financial_summary AS
SELECT 
  r.id,
  r.name,
  r.office,
  r.level,
  r.jurisdiction,
  cf.election_year,
  cf.total_receipts,
  cf.total_disbursements,
  cf.cash_on_hand,
  cf.individual_contributions,
  cf.pac_contributions,
  cf.self_financing,
  cf.last_updated as finance_last_updated
FROM public.civics_representatives r
LEFT JOIN public.civics_campaign_finance cf ON r.id = cf.representative_id
WHERE cf.election_year = (
  SELECT MAX(election_year) 
  FROM public.civics_campaign_finance cf2 
  WHERE cf2.representative_id = r.id
);

CREATE OR REPLACE VIEW public.representative_voting_summary AS
SELECT 
  r.id,
  r.name,
  r.office,
  r.level,
  r.jurisdiction,
  vb.analysis_period,
  vb.total_votes,
  vb.party_unity_score,
  vb.bipartisan_score,
  vb.attendance_rate,
  vb.ideology_score,
  vb.last_updated as voting_last_updated
FROM public.civics_representatives r
LEFT JOIN public.civics_voting_behavior vb ON r.id = vb.representative_id
WHERE vb.analysis_period = 'current_session';

-- Comments for documentation
COMMENT ON TABLE public.civics_campaign_finance IS 'FEC campaign finance data for representatives';
COMMENT ON TABLE public.civics_votes IS 'Individual voting records from GovTrack';
COMMENT ON TABLE public.civics_voting_behavior IS 'Aggregated voting behavior analysis';
COMMENT ON TABLE public.civics_policy_positions IS 'Inferred policy positions based on voting records';

COMMENT ON COLUMN public.civics_campaign_finance.fec_candidate_id IS 'FEC candidate identifier (e.g., S8CA00584)';
COMMENT ON COLUMN public.civics_campaign_finance.committee_id IS 'FEC committee identifier';
COMMENT ON COLUMN public.civics_campaign_finance.contribution_breakdown IS 'JSON breakdown of contribution sources';
COMMENT ON COLUMN public.civics_campaign_finance.top_contributors IS 'JSON array of top 10 contributors';

COMMENT ON COLUMN public.civics_votes.vote_position IS 'How the representative voted: yes, no, not_voting, present';
COMMENT ON COLUMN public.civics_votes.party_position IS 'How the majority of the party voted';
COMMENT ON COLUMN public.civics_voting_behavior.party_unity_score IS 'Percentage of votes aligned with party majority';
COMMENT ON COLUMN public.civics_voting_behavior.ideology_score IS 'Political ideology score (-100 liberal to +100 conservative)';
