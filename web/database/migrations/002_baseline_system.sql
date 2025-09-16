-- ============================================================================
-- CHOICES PLATFORM - MIGRATION 002: BASELINE SYSTEM
-- ============================================================================
-- Phase 1: Database & Schema Implementation
-- Agent A - Database Specialist
-- 
-- This migration adds baseline system features including:
-- - Lifecycle control indexes
-- - Results views
-- - Advanced RLS policies with lifecycle restrictions
-- - Performance optimizations
-- 
-- Created: September 15, 2025
-- Status: Production Ready
-- ============================================================================

-- ============================================================================
-- ADDITIONAL INDEXES FOR BASELINE SYSTEM
-- ============================================================================

-- Polls lifecycle indexes
CREATE INDEX IF NOT EXISTS idx_polls_baseline_at ON polls(baseline_at);
CREATE INDEX IF NOT EXISTS idx_polls_locked_at ON polls(locked_at);
CREATE INDEX IF NOT EXISTS idx_polls_allow_post_close ON polls(allow_post_close);

-- Votes verification indexes
CREATE INDEX IF NOT EXISTS idx_votes_verification ON votes(is_verified);
CREATE INDEX IF NOT EXISTS idx_votes_voting_method ON votes(voting_method);

-- WebAuthn credentials indexes
CREATE INDEX IF NOT EXISTS idx_webauthn_active ON webauthn_credentials(is_active);
CREATE INDEX IF NOT EXISTS idx_webauthn_last_used ON webauthn_credentials(last_used_at);

-- User profiles trust tier index
CREATE INDEX IF NOT EXISTS idx_user_profiles_trust_tier ON user_profiles(trust_tier);

-- Feedback priority and sentiment indexes
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON feedback(priority);
CREATE INDEX IF NOT EXISTS idx_feedback_sentiment ON feedback(sentiment);

-- ============================================================================
-- RESULTS VIEWS
-- ============================================================================

-- ============================================================================
-- LIVE RESULTS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW poll_results_live_view AS
SELECT 
  p.id as poll_id,
  p.title,
  p.voting_method,
  p.status,
  p.total_votes,
  p.participation,
  p.created_at,
  p.end_time,
  p.baseline_at,
  p.locked_at,
  
  -- Vote counts by choice
  COALESCE(vote_counts.choice_0, 0) as choice_0_votes,
  COALESCE(vote_counts.choice_1, 0) as choice_1_votes,
  COALESCE(vote_counts.choice_2, 0) as choice_2_votes,
  COALESCE(vote_counts.choice_3, 0) as choice_3_votes,
  COALESCE(vote_counts.choice_4, 0) as choice_4_votes,
  COALESCE(vote_counts.choice_5, 0) as choice_5_votes,
  COALESCE(vote_counts.choice_6, 0) as choice_6_votes,
  COALESCE(vote_counts.choice_7, 0) as choice_7_votes,
  COALESCE(vote_counts.choice_8, 0) as choice_8_votes,
  COALESCE(vote_counts.choice_9, 0) as choice_9_votes,
  
  -- Total votes and percentages
  COALESCE(vote_counts.total_votes, 0) as actual_total_votes,
  CASE 
    WHEN COALESCE(vote_counts.total_votes, 0) > 0 THEN
      ROUND((COALESCE(vote_counts.choice_0, 0)::DECIMAL / vote_counts.total_votes) * 100, 2)
    ELSE 0 
  END as choice_0_percentage,
  CASE 
    WHEN COALESCE(vote_counts.total_votes, 0) > 0 THEN
      ROUND((COALESCE(vote_counts.choice_1, 0)::DECIMAL / vote_counts.total_votes) * 100, 2)
    ELSE 0 
  END as choice_1_percentage,
  CASE 
    WHEN COALESCE(vote_counts.total_votes, 0) > 0 THEN
      ROUND((COALESCE(vote_counts.choice_2, 0)::DECIMAL / vote_counts.total_votes) * 100, 2)
    ELSE 0 
  END as choice_2_percentage,
  CASE 
    WHEN COALESCE(vote_counts.total_votes, 0) > 0 THEN
      ROUND((COALESCE(vote_counts.choice_3, 0)::DECIMAL / vote_counts.total_votes) * 100, 2)
    ELSE 0 
  END as choice_3_percentage,
  CASE 
    WHEN COALESCE(vote_counts.total_votes, 0) > 0 THEN
      ROUND((COALESCE(vote_counts.choice_4, 0)::DECIMAL / vote_counts.total_votes) * 100, 2)
    ELSE 0 
  END as choice_4_percentage,
  CASE 
    WHEN COALESCE(vote_counts.total_votes, 0) > 0 THEN
      ROUND((COALESCE(vote_counts.choice_5, 0)::DECIMAL / vote_counts.total_votes) * 100, 2)
    ELSE 0 
  END as choice_5_percentage,
  CASE 
    WHEN COALESCE(vote_counts.total_votes, 0) > 0 THEN
      ROUND((COALESCE(vote_counts.choice_6, 0)::DECIMAL / vote_counts.total_votes) * 100, 2)
    ELSE 0 
  END as choice_6_percentage,
  CASE 
    WHEN COALESCE(vote_counts.total_votes, 0) > 0 THEN
      ROUND((COALESCE(vote_counts.choice_7, 0)::DECIMAL / vote_counts.total_votes) * 100, 2)
    ELSE 0 
  END as choice_7_percentage,
  CASE 
    WHEN COALESCE(vote_counts.total_votes, 0) > 0 THEN
      ROUND((COALESCE(vote_counts.choice_8, 0)::DECIMAL / vote_counts.total_votes) * 100, 2)
    ELSE 0 
  END as choice_8_percentage,
  CASE 
    WHEN COALESCE(vote_counts.total_votes, 0) > 0 THEN
      ROUND((COALESCE(vote_counts.choice_9, 0)::DECIMAL / vote_counts.total_votes) * 100, 2)
    ELSE 0 
  END as choice_9_percentage,
  
  -- Metadata
  NOW() as results_calculated_at,
  'live' as results_type

FROM polls p
LEFT JOIN (
  SELECT 
    poll_id,
    COUNT(*) as total_votes,
    COUNT(CASE WHEN choice = 0 THEN 1 END) as choice_0,
    COUNT(CASE WHEN choice = 1 THEN 1 END) as choice_1,
    COUNT(CASE WHEN choice = 2 THEN 1 END) as choice_2,
    COUNT(CASE WHEN choice = 3 THEN 1 END) as choice_3,
    COUNT(CASE WHEN choice = 4 THEN 1 END) as choice_4,
    COUNT(CASE WHEN choice = 5 THEN 1 END) as choice_5,
    COUNT(CASE WHEN choice = 6 THEN 1 END) as choice_6,
    COUNT(CASE WHEN choice = 7 THEN 1 END) as choice_7,
    COUNT(CASE WHEN choice = 8 THEN 1 END) as choice_8,
    COUNT(CASE WHEN choice = 9 THEN 1 END) as choice_9
  FROM votes 
  WHERE is_verified = true
  GROUP BY poll_id
) vote_counts ON p.id = vote_counts.poll_id;

-- ============================================================================
-- BASELINE RESULTS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW poll_results_baseline_view AS
SELECT 
  p.id as poll_id,
  p.title,
  p.voting_method,
  p.status,
  p.total_votes,
  p.participation,
  p.created_at,
  p.end_time,
  p.baseline_at,
  p.locked_at,
  
  -- Vote counts by choice (as of baseline time)
  COALESCE(baseline_vote_counts.choice_0, 0) as choice_0_votes,
  COALESCE(baseline_vote_counts.choice_1, 0) as choice_1_votes,
  COALESCE(baseline_vote_counts.choice_2, 0) as choice_2_votes,
  COALESCE(baseline_vote_counts.choice_3, 0) as choice_3_votes,
  COALESCE(baseline_vote_counts.choice_4, 0) as choice_4_votes,
  COALESCE(baseline_vote_counts.choice_5, 0) as choice_5_votes,
  COALESCE(baseline_vote_counts.choice_6, 0) as choice_6_votes,
  COALESCE(baseline_vote_counts.choice_7, 0) as choice_7_votes,
  COALESCE(baseline_vote_counts.choice_8, 0) as choice_8_votes,
  COALESCE(baseline_vote_counts.choice_9, 0) as choice_9_votes,
  
  -- Total votes and percentages (as of baseline time)
  COALESCE(baseline_vote_counts.total_votes, 0) as actual_total_votes,
  CASE 
    WHEN COALESCE(baseline_vote_counts.total_votes, 0) > 0 THEN
      ROUND((COALESCE(baseline_vote_counts.choice_0, 0)::DECIMAL / baseline_vote_counts.total_votes) * 100, 2)
    ELSE 0 
  END as choice_0_percentage,
  CASE 
    WHEN COALESCE(baseline_vote_counts.total_votes, 0) > 0 THEN
      ROUND((COALESCE(baseline_vote_counts.choice_1, 0)::DECIMAL / baseline_vote_counts.total_votes) * 100, 2)
    ELSE 0 
  END as choice_1_percentage,
  CASE 
    WHEN COALESCE(baseline_vote_counts.total_votes, 0) > 0 THEN
      ROUND((COALESCE(baseline_vote_counts.choice_2, 0)::DECIMAL / baseline_vote_counts.total_votes) * 100, 2)
    ELSE 0 
  END as choice_2_percentage,
  CASE 
    WHEN COALESCE(baseline_vote_counts.total_votes, 0) > 0 THEN
      ROUND((COALESCE(baseline_vote_counts.choice_3, 0)::DECIMAL / baseline_vote_counts.total_votes) * 100, 2)
    ELSE 0 
  END as choice_3_percentage,
  CASE 
    WHEN COALESCE(baseline_vote_counts.total_votes, 0) > 0 THEN
      ROUND((COALESCE(baseline_vote_counts.choice_4, 0)::DECIMAL / baseline_vote_counts.total_votes) * 100, 2)
    ELSE 0 
  END as choice_4_percentage,
  CASE 
    WHEN COALESCE(baseline_vote_counts.total_votes, 0) > 0 THEN
      ROUND((COALESCE(baseline_vote_counts.choice_5, 0)::DECIMAL / baseline_vote_counts.total_votes) * 100, 2)
    ELSE 0 
  END as choice_5_percentage,
  CASE 
    WHEN COALESCE(baseline_vote_counts.total_votes, 0) > 0 THEN
      ROUND((COALESCE(baseline_vote_counts.choice_6, 0)::DECIMAL / baseline_vote_counts.total_votes) * 100, 2)
    ELSE 0 
  END as choice_6_percentage,
  CASE 
    WHEN COALESCE(baseline_vote_counts.total_votes, 0) > 0 THEN
      ROUND((COALESCE(baseline_vote_counts.choice_7, 0)::DECIMAL / baseline_vote_counts.total_votes) * 100, 2)
    ELSE 0 
  END as choice_7_percentage,
  CASE 
    WHEN COALESCE(baseline_vote_counts.total_votes, 0) > 0 THEN
      ROUND((COALESCE(baseline_vote_counts.choice_8, 0)::DECIMAL / baseline_vote_counts.total_votes) * 100, 2)
    ELSE 0 
  END as choice_8_percentage,
  CASE 
    WHEN COALESCE(baseline_vote_counts.total_votes, 0) > 0 THEN
      ROUND((COALESCE(baseline_vote_counts.choice_9, 0)::DECIMAL / baseline_vote_counts.total_votes) * 100, 2)
    ELSE 0 
  END as choice_9_percentage,
  
  -- Metadata
  p.baseline_at as results_calculated_at,
  'baseline' as results_type

FROM polls p
LEFT JOIN (
  SELECT 
    poll_id,
    COUNT(*) as total_votes,
    COUNT(CASE WHEN choice = 0 THEN 1 END) as choice_0,
    COUNT(CASE WHEN choice = 1 THEN 1 END) as choice_1,
    COUNT(CASE WHEN choice = 2 THEN 1 END) as choice_2,
    COUNT(CASE WHEN choice = 3 THEN 1 END) as choice_3,
    COUNT(CASE WHEN choice = 4 THEN 1 END) as choice_4,
    COUNT(CASE WHEN choice = 5 THEN 1 END) as choice_5,
    COUNT(CASE WHEN choice = 6 THEN 1 END) as choice_6,
    COUNT(CASE WHEN choice = 7 THEN 1 END) as choice_7,
    COUNT(CASE WHEN choice = 8 THEN 1 END) as choice_8,
    COUNT(CASE WHEN choice = 9 THEN 1 END) as choice_9
  FROM votes 
  WHERE is_verified = true
    AND created_at <= (
      SELECT baseline_at FROM polls WHERE polls.id = votes.poll_id
    )
  GROUP BY poll_id
) baseline_vote_counts ON p.id = baseline_vote_counts.poll_id
WHERE p.baseline_at IS NOT NULL;

-- ============================================================================
-- DRIFT RESULTS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW poll_results_drift_view AS
SELECT 
  live.poll_id,
  live.title,
  live.voting_method,
  live.status,
  live.created_at,
  live.end_time,
  live.baseline_at,
  live.locked_at,
  
  -- Live results
  live.actual_total_votes as live_total_votes,
  live.choice_0_votes as live_choice_0_votes,
  live.choice_1_votes as live_choice_1_votes,
  live.choice_2_votes as live_choice_2_votes,
  live.choice_3_votes as live_choice_3_votes,
  live.choice_4_votes as live_choice_4_votes,
  live.choice_5_votes as live_choice_5_votes,
  live.choice_6_votes as live_choice_6_votes,
  live.choice_7_votes as live_choice_7_votes,
  live.choice_8_votes as live_choice_8_votes,
  live.choice_9_votes as live_choice_9_votes,
  
  -- Baseline results
  COALESCE(baseline.actual_total_votes, 0) as baseline_total_votes,
  COALESCE(baseline.choice_0_votes, 0) as baseline_choice_0_votes,
  COALESCE(baseline.choice_1_votes, 0) as baseline_choice_1_votes,
  COALESCE(baseline.choice_2_votes, 0) as baseline_choice_2_votes,
  COALESCE(baseline.choice_3_votes, 0) as baseline_choice_3_votes,
  COALESCE(baseline.choice_4_votes, 0) as baseline_choice_4_votes,
  COALESCE(baseline.choice_5_votes, 0) as baseline_choice_5_votes,
  COALESCE(baseline.choice_6_votes, 0) as baseline_choice_6_votes,
  COALESCE(baseline.choice_7_votes, 0) as baseline_choice_7_votes,
  COALESCE(baseline.choice_8_votes, 0) as baseline_choice_8_votes,
  COALESCE(baseline.choice_9_votes, 0) as baseline_choice_9_votes,
  
  -- Vote count differences
  live.actual_total_votes - COALESCE(baseline.actual_total_votes, 0) as total_vote_drift,
  live.choice_0_votes - COALESCE(baseline.choice_0_votes, 0) as choice_0_drift,
  live.choice_1_votes - COALESCE(baseline.choice_1_votes, 0) as choice_1_drift,
  live.choice_2_votes - COALESCE(baseline.choice_2_votes, 0) as choice_2_drift,
  live.choice_3_votes - COALESCE(baseline.choice_3_votes, 0) as choice_3_drift,
  live.choice_4_votes - COALESCE(baseline.choice_4_votes, 0) as choice_4_drift,
  live.choice_5_votes - COALESCE(baseline.choice_5_votes, 0) as choice_5_drift,
  live.choice_6_votes - COALESCE(baseline.choice_6_votes, 0) as choice_6_drift,
  live.choice_7_votes - COALESCE(baseline.choice_7_votes, 0) as choice_7_drift,
  live.choice_8_votes - COALESCE(baseline.choice_8_votes, 0) as choice_8_drift,
  live.choice_9_votes - COALESCE(baseline.choice_9_votes, 0) as choice_9_drift,
  
  -- Percentage differences
  live.choice_0_percentage - COALESCE(baseline.choice_0_percentage, 0) as choice_0_percentage_drift,
  live.choice_1_percentage - COALESCE(baseline.choice_1_percentage, 0) as choice_1_percentage_drift,
  live.choice_2_percentage - COALESCE(baseline.choice_2_percentage, 0) as choice_2_percentage_drift,
  live.choice_3_percentage - COALESCE(baseline.choice_3_percentage, 0) as choice_3_percentage_drift,
  live.choice_4_percentage - COALESCE(baseline.choice_4_percentage, 0) as choice_4_percentage_drift,
  live.choice_5_percentage - COALESCE(baseline.choice_5_percentage, 0) as choice_5_percentage_drift,
  live.choice_6_percentage - COALESCE(baseline.choice_6_percentage, 0) as choice_6_percentage_drift,
  live.choice_7_percentage - COALESCE(baseline.choice_7_percentage, 0) as choice_7_percentage_drift,
  live.choice_8_percentage - COALESCE(baseline.choice_8_percentage, 0) as choice_8_percentage_drift,
  live.choice_9_percentage - COALESCE(baseline.choice_9_percentage, 0) as choice_9_percentage_drift,
  
  -- Drift analysis
  CASE 
    WHEN COALESCE(baseline.actual_total_votes, 0) > 0 THEN
      ROUND(((live.actual_total_votes - COALESCE(baseline.actual_total_votes, 0))::DECIMAL / baseline.actual_total_votes) * 100, 2)
    ELSE 0 
  END as total_vote_drift_percentage,
  
  -- Metadata
  NOW() as drift_calculated_at,
  'drift' as results_type

FROM poll_results_live_view live
LEFT JOIN poll_results_baseline_view baseline ON live.poll_id = baseline.poll_id
WHERE live.baseline_at IS NOT NULL;

-- ============================================================================
-- ADVANCED RLS POLICIES WITH LIFECYCLE RESTRICTIONS
-- ============================================================================

-- Drop and recreate polls update policy with lifecycle restrictions
DROP POLICY IF EXISTS "Users can update their own polls" ON polls;
CREATE POLICY "Users can update their own polls" ON polls
  FOR UPDATE USING (
    auth.uid() = created_by 
    AND locked_at IS NULL -- Cannot update locked polls
  );

-- Drop and recreate votes create policy with lifecycle restrictions
DROP POLICY IF EXISTS "Users can create votes" ON votes;
CREATE POLICY "Users can create votes" ON votes
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = votes.poll_id 
      AND polls.status = 'active'
      AND (polls.end_time IS NULL OR polls.end_time > NOW())
      AND polls.locked_at IS NULL
    )
  );

-- Drop and recreate votes update policy with lifecycle restrictions
DROP POLICY IF EXISTS "Users can update their own votes" ON votes;
CREATE POLICY "Users can update their own votes" ON votes
  FOR UPDATE USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = votes.poll_id 
      AND polls.status = 'active'
      AND (polls.allow_post_close = true OR polls.end_time IS NULL OR polls.end_time > NOW())
      AND polls.locked_at IS NULL
    )
  );

-- ============================================================================
-- VIEW COMMENTS
-- ============================================================================

COMMENT ON VIEW poll_results_live_view IS 'Current live results for all polls with vote counts and percentages';
COMMENT ON VIEW poll_results_baseline_view IS 'Baseline results captured at specific timestamp for comparison';
COMMENT ON VIEW poll_results_drift_view IS 'Comparison between live and baseline results showing vote drift';

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- This completes the baseline system migration.
-- The database now supports full poll lifecycle management and results analysis.
