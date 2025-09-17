-- Complete Civics Database Schema
-- Run this once to set up the complete schema for federal, state, and local government data

-- Enable pgcrypto if not already
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Divisions table (OCD divisions)
CREATE TABLE IF NOT EXISTS public.civics_divisions (
  ocd_division_id TEXT PRIMARY KEY,                          -- e.g. ocd-division/country:us/state:ca/cd:12
  level TEXT NOT NULL,                                       -- 'federal' | 'state' | 'local'
  chamber TEXT NOT NULL,                                     -- 'us_senate' | 'us_house' | 'state_upper' | 'state_lower' | 'local_city'
  state TEXT,                                                -- 'CA'
  district_number INTEGER,                                   -- null for statewide seats
  name TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Representatives table
CREATE TABLE IF NOT EXISTS public.civics_representatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  party TEXT,
  office TEXT NOT NULL,        -- 'U.S. House', 'State Senate', etc.
  level TEXT,                  -- 'federal' | 'state' | 'local'
  jurisdiction TEXT,           -- 'US' | 'CA' | 'San Francisco, CA'
  district TEXT,               -- 'CA-12' or 'CA-SF' for local
  ocd_division_id TEXT,        -- Google Civic OCD division id
  contact JSONB,               -- email, phone, website
  raw_payload JSONB NOT NULL,  -- full API response
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Addresses table (for future address lookup functionality)
CREATE TABLE IF NOT EXISTS public.civics_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address_hash TEXT NOT NULL UNIQUE,
  normalized_address TEXT NOT NULL,
  state TEXT,
  district TEXT,               -- e.g. 'CA-12'
  confidence NUMERIC,          -- 0..1
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  reps JSONB,                  -- raw representative payload
  sources TEXT[] DEFAULT ARRAY['google-civic'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign finance data (for future integration)
CREATE TABLE IF NOT EXISTS public.civics_campaign_finance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id TEXT NOT NULL,
  candidate_name TEXT NOT NULL,
  office TEXT NOT NULL,
  state TEXT,
  district TEXT,
  party TEXT,
  cycle INTEGER NOT NULL,
  total_receipts NUMERIC,
  total_disbursements NUMERIC,
  cash_on_hand NUMERIC,
  debt NUMERIC,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Voting records (for future integration)
CREATE TABLE IF NOT EXISTS public.civics_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  representative_id UUID REFERENCES public.civics_representatives(id),
  bill_id TEXT NOT NULL,
  bill_title TEXT,
  vote_position TEXT NOT NULL, -- 'yes', 'no', 'abstain', 'not_voting'
  vote_date DATE NOT NULL,
  chamber TEXT NOT NULL,
  session TEXT,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_divisions_state_chamber
  ON public.civics_divisions (state, chamber);

CREATE INDEX IF NOT EXISTS idx_reps_division 
  ON public.civics_representatives(ocd_division_id);

CREATE INDEX IF NOT EXISTS idx_civics_reps_level 
  ON public.civics_representatives(level);

CREATE INDEX IF NOT EXISTS idx_civics_reps_juris 
  ON public.civics_representatives(jurisdiction);

CREATE INDEX IF NOT EXISTS idx_civics_reps_district 
  ON public.civics_representatives(district);

CREATE INDEX IF NOT EXISTS idx_civics_addr_state_district
  ON public.civics_addresses (state, district);

CREATE INDEX IF NOT EXISTS idx_civics_finance_candidate_cycle
  ON public.civics_campaign_finance (candidate_id, cycle);

CREATE INDEX IF NOT EXISTS idx_civics_votes_rep_date
  ON public.civics_votes (representative_id, vote_date);

-- Uniqueness constraints to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS uniq_rep_local
  ON public.civics_representatives (level, jurisdiction, office, name);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_finance_candidate_cycle
  ON public.civics_campaign_finance (candidate_id, cycle);

-- Helpful function to keep updated_at fresh
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

-- Triggers for automatic timestamp updates
DROP TRIGGER IF EXISTS trg_civics_addresses_updated ON public.civics_addresses;
CREATE TRIGGER trg_civics_addresses_updated
  BEFORE UPDATE ON public.civics_addresses
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

DROP TRIGGER IF EXISTS trg_civics_finance_updated ON public.civics_campaign_finance;
CREATE TRIGGER trg_civics_finance_updated
  BEFORE UPDATE ON public.civics_campaign_finance
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Optional: Add foreign key constraint (safe to skip if you prefer flexibility)
-- ALTER TABLE public.civics_representatives
--   ADD CONSTRAINT fk_civics_rep_div FOREIGN KEY (ocd_division_id)
--   REFERENCES public.civics_divisions(ocd_division_id);


