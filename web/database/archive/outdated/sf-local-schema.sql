-- SF Local Trial Database Schema Updates
-- Run these once to set up the schema for SF local government data

-- Divisions table (if you haven't created it yet)
CREATE TABLE IF NOT EXISTS public.civics_divisions (
  ocd_division_id TEXT PRIMARY KEY,
  level TEXT NOT NULL,
  chamber TEXT NOT NULL,
  state TEXT,
  district_number INTEGER,
  name TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Representatives table must have these columns:
ALTER TABLE public.civics_representatives
  ADD COLUMN IF NOT EXISTS ocd_division_id TEXT,
  ADD COLUMN IF NOT EXISTS level TEXT,
  ADD COLUMN IF NOT EXISTS jurisdiction TEXT,
  ADD COLUMN IF NOT EXISTS office TEXT,
  ADD COLUMN IF NOT EXISTS district TEXT;

-- Use a stable "district" for locals (we'll store "CA-SF").
-- Add a uniqueness constraint so upserts merge instead of duplicating rows:
CREATE UNIQUE INDEX IF NOT EXISTS uniq_rep_local
ON public.civics_representatives (level, jurisdiction, office, name);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_divisions_state_chamber
  ON public.civics_divisions (state, chamber);

CREATE INDEX IF NOT EXISTS idx_reps_division 
  ON public.civics_representatives(ocd_division_id);

CREATE INDEX IF NOT EXISTS idx_civics_reps_level 
  ON public.civics_representatives(level);

CREATE INDEX IF NOT EXISTS idx_civics_reps_juris 
  ON public.civics_representatives(jurisdiction);


