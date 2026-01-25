-- Add constituent will poll type and bill metadata to polls table
-- Enables constituents to create polls about how they want representatives to vote
-- 
-- Following Supabase best practices:
-- - Use TEXT instead of VARCHAR (schema-data-types)
-- - Index foreign key columns (schema-foreign-key-indexes)
-- - Use partial indexes for filtered queries (query-partial-indexes)

-- Add poll_type column (defaults to 'standard' for existing polls)
-- Using TEXT per best practice: "Strings: use text, not varchar(n) unless constraint needed"
ALTER TABLE public.polls 
  ADD COLUMN IF NOT EXISTS poll_type TEXT DEFAULT 'standard';

-- Add check constraint for poll_type enum values
-- Using DO block since PostgreSQL doesn't support IF NOT EXISTS for constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.polls'::regclass 
    AND conname = 'polls_poll_type_check'
  ) THEN
    ALTER TABLE public.polls 
      ADD CONSTRAINT polls_poll_type_check 
      CHECK (poll_type IN ('standard', 'constituent_will'));
  END IF;
END $$;

-- Add bill metadata columns for constituent will polls
ALTER TABLE public.polls 
  ADD COLUMN IF NOT EXISTS bill_id TEXT,
  ADD COLUMN IF NOT EXISTS representative_id INTEGER,
  ADD COLUMN IF NOT EXISTS bill_title TEXT,
  ADD COLUMN IF NOT EXISTS bill_summary TEXT;

-- Index foreign key column (best practice: always index FK columns)
-- This enables fast JOINs and CASCADE operations
CREATE INDEX IF NOT EXISTS idx_polls_representative_id 
  ON public.polls(representative_id) 
  WHERE representative_id IS NOT NULL;

-- Create composite partial index for accountability queries
-- Partial index: only indexes constituent_will polls (smaller, faster)
-- Composite: supports queries filtering by both representative_id and bill_id
CREATE INDEX IF NOT EXISTS idx_polls_constituent_will 
  ON public.polls(representative_id, bill_id) 
  WHERE poll_type = 'constituent_will';

-- Create partial index for bill lookups (only non-null bill_ids)
CREATE INDEX IF NOT EXISTS idx_polls_bill_id 
  ON public.polls(bill_id) 
  WHERE bill_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.polls.poll_type IS 'Type of poll: standard, constituent_will, etc.';
COMMENT ON COLUMN public.polls.bill_id IS 'GovInfo package ID for bill-related polls';
COMMENT ON COLUMN public.polls.representative_id IS 'Representative ID for constituent will polls (FK to representatives_core)';
COMMENT ON COLUMN public.polls.bill_title IS 'Bill title for display';
COMMENT ON COLUMN public.polls.bill_summary IS 'Bill summary/description';
