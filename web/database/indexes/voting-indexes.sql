-- ============================================================================
-- VOTING-SPECIFIC PERFORMANCE INDEXES
-- ============================================================================
-- Agent D - Database Specialist
-- Phase 2B: Database & Caching
-- 
-- This script creates specialized indexes for voting operations to optimize
-- vote counting, result calculation, and voting analytics queries.
-- 
-- Created: September 15, 2025
-- Status: Production Ready
-- ============================================================================

-- ============================================================================
-- VOTE COUNTING OPTIMIZATION INDEXES
-- ============================================================================

-- Votes: Poll + Choice + Verified (vote counting by choice)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_poll_choice_verified 
ON votes(poll_id, choice, is_verified) 
WHERE is_verified = true;

-- Votes: Poll + Voting Method + Verified (vote counting by method)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_poll_method_verified 
ON votes(poll_id, voting_method, is_verified) 
WHERE is_verified = true;

-- Votes: Poll + Created Date + Verified (temporal vote analysis)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_poll_created_verified 
ON votes(poll_id, created_at, is_verified) 
WHERE is_verified = true;

-- ============================================================================
-- VOTING METHOD SPECIFIC INDEXES
-- ============================================================================

-- Single Choice Voting: Poll + Choice (most common voting method)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_single_choice 
ON votes(poll_id, choice) 
WHERE voting_method = 'single' AND is_verified = true;

-- Multiple Choice Voting: Poll + Vote Data (for JSONB queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_multiple_choice 
ON votes(poll_id, vote_data) 
WHERE voting_method = 'multiple' AND is_verified = true;

-- Ranked Choice Voting: Poll + Vote Data (for ranking queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_ranked_choice 
ON votes(poll_id, vote_data) 
WHERE voting_method = 'ranked' AND is_verified = true;

-- Approval Voting: Poll + Vote Data (for approval queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_approval 
ON votes(poll_id, vote_data) 
WHERE voting_method = 'approval' AND is_verified = true;

-- Range Voting: Poll + Vote Data (for range queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_range 
ON votes(poll_id, vote_data) 
WHERE voting_method = 'range' AND is_verified = true;

-- Quadratic Voting: Poll + Vote Data (for quadratic calculations)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_quadratic 
ON votes(poll_id, vote_data) 
WHERE voting_method = 'quadratic' AND is_verified = true;

-- ============================================================================
-- VOTE VERIFICATION INDEXES
-- ============================================================================

-- Votes: Verification Token + Poll (verification lookups)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_verification_token 
ON votes(verification_token, poll_id) 
WHERE verification_token IS NOT NULL;

-- Votes: Unverified votes (verification queue)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_unverified 
ON votes(poll_id, created_at) 
WHERE is_verified = false;

-- Votes: Recently verified (verification analytics)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_recently_verified 
ON votes(poll_id, updated_at) 
WHERE is_verified = true AND updated_at > NOW() - INTERVAL '24 hours';

-- ============================================================================
-- VOTING ANALYTICS INDEXES
-- ============================================================================

-- Votes: User + Poll + Method (user voting patterns)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_user_poll_method 
ON votes(user_id, poll_id, voting_method);

-- Votes: Poll + User + Created (voting timeline)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_poll_user_timeline 
ON votes(poll_id, user_id, created_at DESC);

-- Votes: Method + Created Date (voting method popularity)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_method_popularity 
ON votes(voting_method, created_at DESC);

-- Votes: Poll + Choice + User (choice popularity by user)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_choice_popularity 
ON votes(poll_id, choice, user_id);

-- ============================================================================
-- VOTE DATA JSONB OPTIMIZATION
-- ============================================================================

-- Votes: Vote Data GIN index for complex voting methods
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_data_gin_optimized 
ON votes USING GIN (vote_data) 
WHERE voting_method IN ('multiple', 'ranked', 'approval', 'range', 'quadratic');

-- Votes: Vote Data GIN index for specific voting method queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_data_method_gin 
ON votes USING GIN (vote_data, voting_method) 
WHERE is_verified = true;

-- ============================================================================
-- VOTING PERFORMANCE MONITORING
-- ============================================================================

-- Create function to get voting performance metrics
CREATE OR REPLACE FUNCTION get_voting_performance_metrics()
RETURNS TABLE (
    poll_id UUID,
    total_votes BIGINT,
    verified_votes BIGINT,
    verification_rate NUMERIC,
    avg_votes_per_hour NUMERIC,
    voting_method TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.poll_id,
        COUNT(*) as total_votes,
        COUNT(*) FILTER (WHERE v.is_verified = true) as verified_votes,
        ROUND(
            (COUNT(*) FILTER (WHERE v.is_verified = true)::NUMERIC / COUNT(*)) * 100, 
            2
        ) as verification_rate,
        ROUND(
            COUNT(*)::NUMERIC / GREATEST(
                EXTRACT(EPOCH FROM (MAX(v.created_at) - MIN(v.created_at))) / 3600, 
                1
            ), 
            2
        ) as avg_votes_per_hour,
        v.voting_method
    FROM votes v
    GROUP BY v.poll_id, v.voting_method
    ORDER BY total_votes DESC;
END;
$$;

-- Create view for voting analytics
CREATE OR REPLACE VIEW voting_analytics AS
SELECT 
    p.id as poll_id,
    p.title,
    p.voting_method,
    p.status,
    COUNT(v.id) as total_votes,
    COUNT(v.id) FILTER (WHERE v.is_verified = true) as verified_votes,
    COUNT(v.id) FILTER (WHERE v.is_verified = false) as unverified_votes,
    ROUND(
        (COUNT(v.id) FILTER (WHERE v.is_verified = true)::NUMERIC / NULLIF(COUNT(v.id), 0)) * 100, 
        2
    ) as verification_rate,
    MIN(v.created_at) as first_vote,
    MAX(v.created_at) as last_vote,
    COUNT(DISTINCT v.user_id) as unique_voters
FROM polls p
LEFT JOIN votes v ON p.id = v.poll_id
GROUP BY p.id, p.title, p.voting_method, p.status
ORDER BY total_votes DESC;

-- ============================================================================
-- VOTE COUNTING OPTIMIZATION FUNCTIONS
-- ============================================================================

-- Create function for efficient vote counting by choice
CREATE OR REPLACE FUNCTION count_votes_by_choice(poll_uuid UUID)
RETURNS TABLE (
    choice INTEGER,
    vote_count BIGINT,
    percentage NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_votes BIGINT;
BEGIN
    -- Get total verified votes for the poll
    SELECT COUNT(*) INTO total_votes
    FROM votes 
    WHERE poll_id = poll_uuid AND is_verified = true;
    
    -- Return vote counts by choice
    RETURN QUERY
    SELECT 
        v.choice,
        COUNT(*) as vote_count,
        ROUND((COUNT(*)::NUMERIC / NULLIF(total_votes, 0)) * 100, 2) as percentage
    FROM votes v
    WHERE v.poll_id = poll_uuid AND v.is_verified = true
    GROUP BY v.choice
    ORDER BY vote_count DESC;
END;
$$;

-- Create function for voting method statistics
CREATE OR REPLACE FUNCTION get_voting_method_stats()
RETURNS TABLE (
    voting_method TEXT,
    total_polls BIGINT,
    total_votes BIGINT,
    avg_votes_per_poll NUMERIC,
    most_popular_choice INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.voting_method,
        COUNT(DISTINCT p.id) as total_polls,
        COUNT(v.id) as total_votes,
        ROUND(COUNT(v.id)::NUMERIC / NULLIF(COUNT(DISTINCT p.id), 0), 2) as avg_votes_per_poll,
        MODE() WITHIN GROUP (ORDER BY v.choice) as most_popular_choice
    FROM polls p
    LEFT JOIN votes v ON p.id = v.poll_id AND v.is_verified = true
    GROUP BY p.voting_method
    ORDER BY total_votes DESC;
END;
$$;

-- ============================================================================
-- VOTING INTEGRITY INDEXES
-- ============================================================================

-- Votes: Poll + User + Created (duplicate vote detection)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_duplicate_detection 
ON votes(poll_id, user_id, created_at) 
WHERE is_verified = true;

-- Votes: User + Created Date (user voting frequency)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_user_frequency 
ON votes(user_id, created_at DESC);

-- Votes: Poll + Created Date (voting burst detection)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_poll_burst_detection 
ON votes(poll_id, created_at);

-- ============================================================================
-- VOTING RESULTS OPTIMIZATION
-- ============================================================================

-- Create materialized view for poll results (refreshed periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS poll_results_summary AS
SELECT 
    p.id as poll_id,
    p.title,
    p.voting_method,
    p.status,
    COUNT(v.id) as total_votes,
    COUNT(v.id) FILTER (WHERE v.is_verified = true) as verified_votes,
    COUNT(DISTINCT v.user_id) as unique_voters,
    MIN(v.created_at) as first_vote,
    MAX(v.created_at) as last_vote,
    p.created_at as poll_created,
    p.end_time as poll_end_time
FROM polls p
LEFT JOIN votes v ON p.id = v.poll_id
GROUP BY p.id, p.title, p.voting_method, p.status, p.created_at, p.end_time;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS idx_poll_results_poll_id 
ON poll_results_summary(poll_id);

CREATE INDEX IF NOT EXISTS idx_poll_results_status 
ON poll_results_summary(status);

CREATE INDEX IF NOT EXISTS idx_poll_results_voting_method 
ON poll_results_summary(voting_method);

-- Create function to refresh poll results
CREATE OR REPLACE FUNCTION refresh_poll_results()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY poll_results_summary;
END;
$$;

-- ============================================================================
-- VOTING PERFORMANCE VERIFICATION
-- ============================================================================

-- Verify voting indexes were created
SELECT 
    'VOTING INDEXES SUMMARY' as status,
    COUNT(*) as total_voting_indexes,
    COUNT(*) FILTER (WHERE indexname LIKE 'idx_votes_%') as vote_indexes,
    COUNT(*) FILTER (WHERE indexname LIKE 'idx_votes_%_gin') as gin_indexes,
    COUNT(*) FILTER (WHERE indexname LIKE 'idx_votes_%_verified') as verification_indexes
FROM pg_indexes 
WHERE schemaname = 'public'
AND (indexname LIKE 'idx_votes_%' OR indexname LIKE 'idx_poll_results_%');

-- Show voting index sizes
SELECT 
    'VOTING INDEX SIZES' as status,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_indexes 
WHERE schemaname = 'public'
AND indexname LIKE 'idx_votes_%'
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- ============================================================================
-- VOTING OPTIMIZATION COMPLETE
-- ============================================================================

SELECT '🗳️ VOTING-SPECIFIC INDEXES CREATED SUCCESSFULLY! 🗳️' as status;
