-- Add constituent will poll type and bill metadata to polls table
-- Enables constituents to create polls about how they want representatives to vote

-- Add poll_type column (defaults to 'standard' for existing polls)
ALTER TABLE public.polls 
  ADD COLUMN IF NOT EXISTS poll_type VARCHAR(50) DEFAULT 'standard';

-- Add bill metadata columns for constituent will polls
ALTER TABLE public.polls 
  ADD COLUMN IF NOT EXISTS bill_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS representative_id INTEGER,
  ADD COLUMN IF NOT EXISTS bill_title TEXT,
  ADD COLUMN IF NOT EXISTS bill_summary TEXT;

-- Create index for accountability queries
CREATE INDEX IF NOT EXISTS idx_polls_constituent_will 
  ON public.polls(representative_id, bill_id) 
  WHERE poll_type = 'constituent_will';

-- Create index for bill lookups
CREATE INDEX IF NOT EXISTS idx_polls_bill_id 
  ON public.polls(bill_id) 
  WHERE bill_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.polls.poll_type IS 'Type of poll: standard, constituent_will, etc.';
COMMENT ON COLUMN public.polls.bill_id IS 'GovInfo package ID for bill-related polls';
COMMENT ON COLUMN public.polls.representative_id IS 'Representative ID for constituent will polls';
COMMENT ON COLUMN public.polls.bill_title IS 'Bill title for display';
COMMENT ON COLUMN public.polls.bill_summary IS 'Bill summary/description';
