-- ============================================================================
-- PHASE 1: DUAL-TRACK RESULTS ARCHITECTURE MIGRATION
-- ============================================================================
-- Agent A1 - Infrastructure Specialist
-- 
-- This migration implements the dual-track results architecture for the
-- Ranked Choice Democracy Revolution platform.
-- 
-- Features:
-- - Dual-track results (official vs trends)
-- - Immutable snapshots for auditability
-- - Post-close voting with proper separation
-- - Enhanced RLS policies for ballot integrity
-- 
-- Created: January 15, 2025
-- Status: Phase 1 Implementation
-- ============================================================================

-- ============================================================================
-- 1. ADD DUAL-TRACK FIELDS TO POLLS TABLE
-- ============================================================================

-- Add close_at timestamp for official results cutoff
ALTER TABLE polls 
  ADD COLUMN IF NOT EXISTS close_at TIMESTAMPTZ;

-- Add allow_postclose flag for trend voting
ALTER TABLE polls 
  ADD COLUMN IF NOT EXISTS allow_postclose BOOLEAN DEFAULT false;

-- Add index for close_at queries
CREATE INDEX IF NOT EXISTS idx_polls_close_at ON polls(close_at);

-- Add index for allow_postclose queries
CREATE INDEX IF NOT EXISTS idx_polls_allow_postclose ON polls(allow_postclose);

-- ============================================================================
-- 2. CREATE IMMUTABLE SNAPSHOTS TABLE
-- ============================================================================

-- Create poll_snapshots table for official results
CREATE TABLE IF NOT EXISTS poll_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  taken_at TIMESTAMPTZ NOT NULL,
  results JSONB NOT NULL,
  total_ballots INTEGER NOT NULL,
  checksum TEXT NOT NULL,
  merkle_root TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one snapshot per poll
  UNIQUE(poll_id)
);

-- Add indexes for poll_snapshots
CREATE INDEX IF NOT EXISTS idx_poll_snapshots_poll_id ON poll_snapshots(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_snapshots_taken_at ON poll_snapshots(taken_at DESC);
CREATE INDEX IF NOT EXISTS idx_poll_snapshots_checksum ON poll_snapshots(checksum);

-- ============================================================================
-- 3. CREATE VOTES PARTITIONED VIEW
-- ============================================================================

-- Helper view to classify ballots by time (official vs post-close)
CREATE OR REPLACE VIEW votes_partitioned AS
SELECT 
  v.*,
  (v.created_at > p.close_at) AS is_postclose,
  CASE 
    WHEN v.created_at <= p.close_at THEN 'official'
    WHEN v.created_at > p.close_at AND p.allow_postclose = true THEN 'trend'
    ELSE 'invalid'
  END AS vote_type
FROM votes v 
JOIN polls p ON p.id = v.poll_id;

-- ============================================================================
-- 4. ENHANCED RLS POLICIES FOR BALLOT INTEGRITY
-- ============================================================================

-- Drop existing vote policies to replace with enhanced ones
DROP POLICY IF EXISTS "Users can create votes" ON votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON votes;

-- Enhanced vote creation policy with dual-track support
CREATE POLICY "votes_insert_dual_track" ON votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM polls p 
      WHERE p.id = votes.poll_id 
      AND p.status = 'active'
      AND p.locked_at IS NULL
      AND (
        -- Allow voting before close
        (p.close_at IS NULL OR p.close_at > NOW())
        OR 
        -- Allow post-close voting if enabled
        (p.close_at IS NOT NULL AND p.close_at <= NOW() AND p.allow_postclose = true)
      )
    )
  );

-- Enhanced vote update policy with dual-track support
CREATE POLICY "votes_update_dual_track" ON votes
  FOR UPDATE USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM polls p 
      WHERE p.id = votes.poll_id 
      AND p.status = 'active'
      AND p.locked_at IS NULL
      AND (
        -- Allow updates before close
        (p.close_at IS NULL OR p.close_at > NOW())
        OR 
        -- Allow post-close updates if enabled
        (p.close_at IS NOT NULL AND p.close_at <= NOW() AND p.allow_postclose = true)
      )
    )
  );

-- Policy to prevent vote updates after poll is locked
CREATE POLICY "votes_no_update_after_lock" ON votes
  FOR UPDATE USING (
    NOT EXISTS (
      SELECT 1 FROM polls p 
      WHERE p.id = votes.poll_id 
      AND p.locked_at IS NOT NULL
    )
  );

-- ============================================================================
-- 5. CREATE SNAPSHOT MANAGEMENT FUNCTIONS
-- ============================================================================

-- Function to create a poll snapshot
CREATE OR REPLACE FUNCTION create_poll_snapshot(
  p_poll_id UUID,
  p_taken_at TIMESTAMPTZ DEFAULT NOW()
) RETURNS UUID AS $$
DECLARE
  snapshot_id UUID;
  poll_data RECORD;
  official_ballots INTEGER;
  results_data JSONB;
  checksum_value TEXT;
BEGIN
  -- Get poll data
  SELECT * INTO poll_data FROM polls WHERE id = p_poll_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Poll not found: %', p_poll_id;
  END IF;
  
  -- Count official ballots (before close_at)
  SELECT COUNT(*) INTO official_ballots
  FROM votes v
  WHERE v.poll_id = p_poll_id
  AND (poll_data.close_at IS NULL OR v.created_at <= poll_data.close_at);
  
  -- Generate results data (placeholder - will be filled by IRV engine)
  results_data := jsonb_build_object(
    'poll_id', p_poll_id,
    'taken_at', p_taken_at,
    'total_ballots', official_ballots,
    'status', 'calculated'
  );
  
  -- Generate checksum (placeholder - will be filled by IRV engine)
  checksum_value := encode(digest(
    p_poll_id::text || p_taken_at::text || official_ballots::text, 
    'sha256'
  ), 'hex');
  
  -- Create snapshot
  INSERT INTO poll_snapshots (
    poll_id, taken_at, results, total_ballots, checksum
  ) VALUES (
    p_poll_id, p_taken_at, results_data, official_ballots, checksum_value
  ) RETURNING id INTO snapshot_id;
  
  -- Update poll status
  UPDATE polls 
  SET 
    status = 'closed',
    locked_at = p_taken_at,
    updated_at = NOW()
  WHERE id = p_poll_id;
  
  RETURN snapshot_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get official results
CREATE OR REPLACE FUNCTION get_official_results(p_poll_id UUID)
RETURNS TABLE (
  poll_id UUID,
  taken_at TIMESTAMPTZ,
  results JSONB,
  total_ballots INTEGER,
  checksum TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ps.poll_id,
    ps.taken_at,
    ps.results,
    ps.total_ballots,
    ps.checksum
  FROM poll_snapshots ps
  WHERE ps.poll_id = p_poll_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get trend results (post-close votes)
CREATE OR REPLACE FUNCTION get_trend_results(p_poll_id UUID)
RETURNS TABLE (
  poll_id UUID,
  new_ballots INTEGER,
  trend_data JSONB
) AS $$
DECLARE
  poll_data RECORD;
  new_ballot_count INTEGER;
BEGIN
  -- Get poll data
  SELECT * INTO poll_data FROM polls WHERE id = p_poll_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Poll not found: %', p_poll_id;
  END IF;
  
  -- Count new ballots (after close_at)
  SELECT COUNT(*) INTO new_ballot_count
  FROM votes v
  WHERE v.poll_id = p_poll_id
  AND poll_data.close_at IS NOT NULL 
  AND v.created_at > poll_data.close_at;
  
  -- Return trend data
  RETURN QUERY
  SELECT 
    p_poll_id,
    new_ballot_count,
    jsonb_build_object(
      'new_ballots', new_ballot_count,
      'since_close', poll_data.close_at,
      'status', 'trending'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 6. CREATE AUDIT TRAIL FUNCTIONS
-- ============================================================================

-- Function to generate Merkle root for ballot verification
CREATE OR REPLACE FUNCTION generate_merkle_root(p_poll_id UUID)
RETURNS TEXT AS $$
DECLARE
  ballot_hashes TEXT[];
  merkle_root TEXT;
BEGIN
  -- Get all ballot hashes for the poll
  SELECT ARRAY_AGG(
    encode(digest(v.id::text || v.created_at::text, 'sha256'), 'hex')
  ) INTO ballot_hashes
  FROM votes v
  WHERE v.poll_id = p_poll_id
  ORDER BY v.created_at;
  
  -- Generate Merkle root (simplified - in production, use proper Merkle tree)
  merkle_root := encode(digest(array_to_string(ballot_hashes, ''), 'sha256'), 'hex');
  
  RETURN merkle_root;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to verify ballot inclusion
CREATE OR REPLACE FUNCTION verify_ballot_inclusion(
  p_poll_id UUID,
  p_vote_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  vote_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM votes v
    WHERE v.id = p_vote_id
    AND v.poll_id = p_poll_id
  ) INTO vote_exists;
  
  RETURN vote_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. CREATE RLS POLICIES FOR SNAPSHOTS
-- ============================================================================

-- Enable RLS on poll_snapshots
ALTER TABLE poll_snapshots ENABLE ROW LEVEL SECURITY;

-- Users can view snapshots for public polls
CREATE POLICY "Users can view snapshots for public polls" ON poll_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls p
      WHERE p.id = poll_snapshots.poll_id
      AND p.privacy_level = 'public'
    )
  );

-- Users can view snapshots for their own polls
CREATE POLICY "Users can view snapshots for their own polls" ON poll_snapshots
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls p
      WHERE p.id = poll_snapshots.poll_id
      AND p.created_by = auth.uid()
    )
  );

-- System can create snapshots (via functions)
CREATE POLICY "System can create snapshots" ON poll_snapshots
  FOR INSERT WITH CHECK (true);

-- ============================================================================
-- 8. CREATE TRIGGERS FOR AUTOMATIC UPDATES
-- ============================================================================

-- Trigger to update poll status when close_at is set
CREATE OR REPLACE FUNCTION update_poll_status_on_close()
RETURNS TRIGGER AS $$
BEGIN
  -- If close_at is set and poll is still active, update status
  IF NEW.close_at IS NOT NULL AND NEW.status = 'active' THEN
    NEW.status := 'closed';
    NEW.updated_at := NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_poll_status_on_close
  BEFORE UPDATE ON polls
  FOR EACH ROW
  EXECUTE FUNCTION update_poll_status_on_close();

-- ============================================================================
-- 9. ADD COMMENTS AND DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE poll_snapshots IS 'Immutable snapshots of poll results for auditability and official results';
COMMENT ON VIEW votes_partitioned IS 'View classifying votes as official (before close) or trend (after close)';

COMMENT ON COLUMN polls.close_at IS 'Timestamp when poll closes for official results';
COMMENT ON COLUMN polls.allow_postclose IS 'Whether voting is allowed after poll closes (for trends)';

COMMENT ON COLUMN poll_snapshots.taken_at IS 'Timestamp when snapshot was taken';
COMMENT ON COLUMN poll_snapshots.results IS 'JSONB containing calculated results';
COMMENT ON COLUMN poll_snapshots.total_ballots IS 'Number of ballots included in snapshot';
COMMENT ON COLUMN poll_snapshots.checksum IS 'SHA256 checksum of snapshot data';
COMMENT ON COLUMN poll_snapshots.merkle_root IS 'Merkle root for ballot verification';

-- ============================================================================
-- 10. VERIFICATION QUERIES
-- ============================================================================

-- Verify the migration was successful
DO $$
BEGIN
  -- Check if new columns exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'polls' AND column_name = 'close_at'
  ) THEN
    RAISE EXCEPTION 'Migration failed: close_at column not found';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'polls' AND column_name = 'allow_postclose'
  ) THEN
    RAISE EXCEPTION 'Migration failed: allow_postclose column not found';
  END IF;
  
  -- Check if poll_snapshots table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'poll_snapshots'
  ) THEN
    RAISE EXCEPTION 'Migration failed: poll_snapshots table not found';
  END IF;
  
  -- Check if votes_partitioned view exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_name = 'votes_partitioned'
  ) THEN
    RAISE EXCEPTION 'Migration failed: votes_partitioned view not found';
  END IF;
  
  RAISE NOTICE 'Dual-track results architecture migration completed successfully!';
END;
$$;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- This completes the dual-track results architecture implementation.
-- Next: Implement IRV engine with deterministic tie-breaking.
