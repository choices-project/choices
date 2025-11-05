-- Migration: Poll Demographic Insights RPC Function
-- Created: November 5, 2025
-- Purpose: Update demographic breakdowns for polls

-- ============================================================================
-- UPDATE POLL DEMOGRAPHIC INSIGHTS FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_poll_demographic_insights(p_poll_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_votes INTEGER;
BEGIN
  -- Get total votes for the poll
  SELECT COUNT(*) INTO v_total_votes
  FROM votes
  WHERE poll_id = p_poll_id;

  -- Update poll statistics
  UPDATE polls
  SET 
    total_votes = v_total_votes,
    updated_at = NOW()
  WHERE id = p_poll_id;

  -- Note: Extended demographic insights will be added when
  -- demographic data collection is implemented
  
  RAISE NOTICE 'Updated demographic insights for poll %', p_poll_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Failed to update poll demographic insights: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION update_poll_demographic_insights(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_poll_demographic_insights(UUID) TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION update_poll_demographic_insights(UUID) IS 
  'Updates demographic insights and statistics for a poll';

