-- ============================================================================
-- MATERIALIZED VIEWS FOR COMPLEX AGGREGATIONS
-- ============================================================================
-- Agent D - Database Specialist
-- Phase 2B: Database & Caching
-- 
-- This script creates materialized views for complex aggregations and
-- frequently accessed data to improve query performance.
-- 
-- Created: September 15, 2025
-- Status: Production Ready
-- ============================================================================

-- ============================================================================
-- POLL RESULTS MATERIALIZED VIEW
-- ============================================================================

-- Drop existing materialized view if it exists
DROP MATERIALIZED VIEW IF EXISTS poll_results_mv CASCADE;

-- Create comprehensive poll results materialized view
CREATE MATERIALIZED VIEW poll_results_mv AS
SELECT 
    p.id as poll_id,
    p.title,
    p.description,
    p.voting_method,
    p.category,
    p.privacy_level,
    p.status,
    p.created_by,
    p.created_at,
    p.end_time,
    p.total_votes,
    p.participation,
    p.baseline_at,
    p.locked_at,
    up.username as creator_username,
    up.trust_tier as creator_trust_tier,
    up.email as creator_email,
    
    -- Vote statistics
    COUNT(v.id) as actual_vote_count,
    COUNT(v.id) FILTER (WHERE v.is_verified = true) as verified_vote_count,
    COUNT(v.id) FILTER (WHERE v.is_verified = false) as unverified_vote_count,
    COUNT(DISTINCT v.user_id) as unique_voters,
    
    -- Vote timing
    MIN(v.created_at) as first_vote_time,
    MAX(v.created_at) as last_vote_time,
    EXTRACT(EPOCH FROM (MAX(v.created_at) - MIN(v.created_at))) / 3600 as voting_duration_hours,
    
    -- Vote rate calculations
    CASE 
        WHEN EXTRACT(EPOCH FROM (MAX(v.created_at) - MIN(v.created_at))) > 0 
        THEN COUNT(v.id) / (EXTRACT(EPOCH FROM (MAX(v.created_at) - MIN(v.created_at))) / 3600)
        ELSE 0
    END as votes_per_hour,
    
    -- Verification rate
    CASE 
        WHEN COUNT(v.id) > 0 
        THEN ROUND((COUNT(v.id) FILTER (WHERE v.is_verified = true)::NUMERIC / COUNT(v.id)) * 100, 2)
        ELSE 0
    END as verification_rate,
    
    -- Choice statistics
    COUNT(DISTINCT v.choice) as unique_choices_selected,
    MODE() WITHIN GROUP (ORDER BY v.choice) as most_popular_choice,
    
    -- Poll status
    CASE 
        WHEN p.end_time IS NOT NULL AND p.end_time < NOW() THEN 'expired'
        WHEN p.status = 'active' THEN 'active'
        WHEN p.status = 'closed' THEN 'closed'
        WHEN p.status = 'draft' THEN 'draft'
        ELSE p.status
    END as current_status,
    
    -- Age calculations
    EXTRACT(DAYS FROM NOW() - p.created_at) as poll_age_days,
    CASE 
        WHEN p.end_time IS NOT NULL 
        THEN EXTRACT(DAYS FROM p.end_time - p.created_at)
        ELSE NULL
    END as poll_duration_days
    
FROM polls p
LEFT JOIN user_profiles up ON p.created_by = up.user_id
LEFT JOIN votes v ON p.id = v.poll_id
GROUP BY p.id, p.title, p.description, p.voting_method, p.category, 
         p.privacy_level, p.status, p.created_by, p.created_at, p.end_time,
         p.total_votes, p.participation, p.baseline_at, p.locked_at,
         up.username, up.trust_tier, up.email;

-- Create indexes on poll results materialized view
CREATE INDEX idx_poll_results_mv_poll_id ON poll_results_mv(poll_id);
CREATE INDEX idx_poll_results_mv_status ON poll_results_mv(current_status);
CREATE INDEX idx_poll_results_mv_voting_method ON poll_results_mv(voting_method);
CREATE INDEX idx_poll_results_mv_category ON poll_results_mv(category);
CREATE INDEX idx_poll_results_mv_creator ON poll_results_mv(created_by);
CREATE INDEX idx_poll_results_mv_created_at ON poll_results_mv(created_at DESC);
CREATE INDEX idx_poll_results_mv_vote_count ON poll_results_mv(actual_vote_count DESC);
CREATE INDEX idx_poll_results_mv_verification_rate ON poll_results_mv(verification_rate DESC);
CREATE INDEX idx_poll_results_mv_privacy_status ON poll_results_mv(privacy_level, current_status);

-- ============================================================================
-- USER ACTIVITY MATERIALIZED VIEW
-- ============================================================================

-- Drop existing materialized view if it exists
DROP MATERIALIZED VIEW IF EXISTS user_activity_mv CASCADE;

-- Create comprehensive user activity materialized view
CREATE MATERIALIZED VIEW user_activity_mv AS
SELECT 
    up.user_id,
    up.username,
    up.email,
    up.trust_tier,
    up.avatar_url,
    up.bio,
    up.created_at as registration_date,
    up.updated_at as last_profile_update,
    up.is_active,
    
    -- Poll creation statistics
    COUNT(DISTINCT p.id) as polls_created,
    COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'active') as active_polls,
    COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'closed') as closed_polls,
    COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'draft') as draft_polls,
    SUM(p.total_votes) as total_votes_received,
    AVG(p.total_votes) as avg_votes_per_poll,
    MAX(p.total_votes) as max_votes_per_poll,
    
    -- Voting statistics
    COUNT(DISTINCT v.id) as votes_cast,
    COUNT(DISTINCT v.poll_id) as polls_voted_on,
    COUNT(DISTINCT v.id) FILTER (WHERE v.is_verified = true) as verified_votes_cast,
    COUNT(DISTINCT v.voting_method) as voting_methods_used,
    
    -- Feedback statistics
    COUNT(DISTINCT f.id) as feedback_submitted,
    COUNT(DISTINCT f.id) FILTER (WHERE f.type = 'bug') as bug_reports,
    COUNT(DISTINCT f.id) FILTER (WHERE f.type = 'feature') as feature_requests,
    COUNT(DISTINCT f.id) FILTER (WHERE f.sentiment = 'positive') as positive_feedback,
    COUNT(DISTINCT f.id) FILTER (WHERE f.sentiment = 'negative') as negative_feedback,
    
    -- WebAuthn credentials
    COUNT(DISTINCT wc.id) as total_credentials,
    COUNT(DISTINCT wc.id) FILTER (WHERE wc.is_active = true) as active_credentials,
    MAX(wc.last_used_at) as last_credential_use,
    
    -- Activity calculations
    MAX(GREATEST(
        COALESCE(p.created_at, '1900-01-01'::timestamp),
        COALESCE(v.created_at, '1900-01-01'::timestamp),
        COALESCE(f.created_at, '1900-01-01'::timestamp),
        COALESCE(up.updated_at, '1900-01-01'::timestamp)
    )) as last_activity,
    
    -- Activity status classification
    CASE 
        WHEN MAX(GREATEST(
            COALESCE(p.created_at, '1900-01-01'::timestamp),
            COALESCE(v.created_at, '1900-01-01'::timestamp),
            COALESCE(f.created_at, '1900-01-01'::timestamp),
            COALESCE(up.updated_at, '1900-01-01'::timestamp)
        )) > NOW() - INTERVAL '7 days' THEN 'active'
        WHEN MAX(GREATEST(
            COALESCE(p.created_at, '1900-01-01'::timestamp),
            COALESCE(v.created_at, '1900-01-01'::timestamp),
            COALESCE(f.created_at, '1900-01-01'::timestamp),
            COALESCE(up.updated_at, '1900-01-01'::timestamp)
        )) > NOW() - INTERVAL '30 days' THEN 'recent'
        WHEN MAX(GREATEST(
            COALESCE(p.created_at, '1900-01-01'::timestamp),
            COALESCE(v.created_at, '1900-01-01'::timestamp),
            COALESCE(f.created_at, '1900-01-01'::timestamp),
            COALESCE(up.updated_at, '1900-01-01'::timestamp)
        )) > NOW() - INTERVAL '90 days' THEN 'inactive'
        ELSE 'dormant'
    END as activity_status,
    
    -- Account age
    EXTRACT(DAYS FROM NOW() - up.created_at) as account_age_days,
    
    -- Engagement score (weighted combination of activities)
    (
        COUNT(DISTINCT p.id) * 2 +  -- Poll creation
        COUNT(DISTINCT v.id) * 1 +  -- Voting
        COUNT(DISTINCT f.id) * 1.5  -- Feedback
    ) as engagement_score
    
FROM user_profiles up
LEFT JOIN polls p ON up.user_id = p.created_by
LEFT JOIN votes v ON up.user_id = v.user_id
LEFT JOIN feedback f ON up.user_id = f.user_id
LEFT JOIN webauthn_credentials wc ON up.user_id = wc.user_id
WHERE up.is_active = true
GROUP BY up.user_id, up.username, up.email, up.trust_tier, up.avatar_url, 
         up.bio, up.created_at, up.updated_at, up.is_active;

-- Create indexes on user activity materialized view
CREATE INDEX idx_user_activity_mv_user_id ON user_activity_mv(user_id);
CREATE INDEX idx_user_activity_mv_username ON user_activity_mv(username);
CREATE INDEX idx_user_activity_mv_trust_tier ON user_activity_mv(trust_tier);
CREATE INDEX idx_user_activity_mv_activity_status ON user_activity_mv(activity_status);
CREATE INDEX idx_user_activity_mv_last_activity ON user_activity_mv(last_activity DESC);
CREATE INDEX idx_user_activity_mv_engagement_score ON user_activity_mv(engagement_score DESC);
CREATE INDEX idx_user_activity_mv_polls_created ON user_activity_mv(polls_created DESC);
CREATE INDEX idx_user_activity_mv_votes_cast ON user_activity_mv(votes_cast DESC);

-- ============================================================================
-- VOTING ANALYTICS MATERIALIZED VIEW
-- ============================================================================

-- Drop existing materialized view if it exists
DROP MATERIALIZED VIEW IF EXISTS voting_analytics_mv CASCADE;

-- Create comprehensive voting analytics materialized view
CREATE MATERIALIZED VIEW voting_analytics_mv AS
SELECT 
    p.id as poll_id,
    p.title,
    p.voting_method,
    p.category,
    p.status,
    p.created_at as poll_created,
    p.end_time as poll_end_time,
    
    -- Vote counts
    COUNT(v.id) as total_votes,
    COUNT(v.id) FILTER (WHERE v.is_verified = true) as verified_votes,
    COUNT(v.id) FILTER (WHERE v.is_verified = false) as unverified_votes,
    COUNT(DISTINCT v.user_id) as unique_voters,
    
    -- Vote timing
    MIN(v.created_at) as first_vote,
    MAX(v.created_at) as last_vote,
    EXTRACT(EPOCH FROM (MAX(v.created_at) - MIN(v.created_at))) / 3600 as voting_duration_hours,
    
    -- Vote rate
    CASE 
        WHEN EXTRACT(EPOCH FROM (MAX(v.created_at) - MIN(v.created_at))) > 0 
        THEN COUNT(v.id) / (EXTRACT(EPOCH FROM (MAX(v.created_at) - MIN(v.created_at))) / 3600)
        ELSE 0
    END as votes_per_hour,
    
    -- Verification rate
    CASE 
        WHEN COUNT(v.id) > 0 
        THEN ROUND((COUNT(v.id) FILTER (WHERE v.is_verified = true)::NUMERIC / COUNT(v.id)) * 100, 2)
        ELSE 0
    END as verification_rate,
    
    -- Choice analysis
    COUNT(DISTINCT v.choice) as unique_choices_selected,
    MODE() WITHIN GROUP (ORDER BY v.choice) as most_popular_choice,
    
    -- Choice distribution (for single choice voting)
    COUNT(v.id) FILTER (WHERE v.choice = 1) as choice_1_votes,
    COUNT(v.id) FILTER (WHERE v.choice = 2) as choice_2_votes,
    COUNT(v.id) FILTER (WHERE v.choice = 3) as choice_3_votes,
    COUNT(v.id) FILTER (WHERE v.choice = 4) as choice_4_votes,
    COUNT(v.id) FILTER (WHERE v.choice = 5) as choice_5_votes,
    
    -- Voting method distribution
    COUNT(v.id) FILTER (WHERE v.voting_method = 'single') as single_votes,
    COUNT(v.id) FILTER (WHERE v.voting_method = 'multiple') as multiple_votes,
    COUNT(v.id) FILTER (WHERE v.voting_method = 'ranked') as ranked_votes,
    COUNT(v.id) FILTER (WHERE v.voting_method = 'approval') as approval_votes,
    COUNT(v.id) FILTER (WHERE v.voting_method = 'range') as range_votes,
    COUNT(v.id) FILTER (WHERE v.voting_method = 'quadratic') as quadratic_votes,
    
    -- Temporal analysis
    COUNT(v.id) FILTER (WHERE v.created_at > NOW() - INTERVAL '1 hour') as votes_last_hour,
    COUNT(v.id) FILTER (WHERE v.created_at > NOW() - INTERVAL '24 hours') as votes_last_day,
    COUNT(v.id) FILTER (WHERE v.created_at > NOW() - INTERVAL '7 days') as votes_last_week,
    
    -- Poll completion status
    CASE 
        WHEN p.end_time IS NOT NULL AND p.end_time < NOW() THEN 'completed'
        WHEN p.status = 'closed' THEN 'closed'
        WHEN p.status = 'active' THEN 'ongoing'
        ELSE p.status
    END as completion_status
    
FROM polls p
LEFT JOIN votes v ON p.id = v.poll_id
GROUP BY p.id, p.title, p.voting_method, p.category, p.status, p.created_at, p.end_time;

-- Create indexes on voting analytics materialized view
CREATE INDEX idx_voting_analytics_mv_poll_id ON voting_analytics_mv(poll_id);
CREATE INDEX idx_voting_analytics_mv_voting_method ON voting_analytics_mv(voting_method);
CREATE INDEX idx_voting_analytics_mv_category ON voting_analytics_mv(category);
CREATE INDEX idx_voting_analytics_mv_status ON voting_analytics_mv(status);
CREATE INDEX idx_voting_analytics_mv_total_votes ON voting_analytics_mv(total_votes DESC);
CREATE INDEX idx_voting_analytics_mv_verification_rate ON voting_analytics_mv(verification_rate DESC);
CREATE INDEX idx_voting_analytics_mv_completion_status ON voting_analytics_mv(completion_status);
CREATE INDEX idx_voting_analytics_mv_poll_created ON voting_analytics_mv(poll_created DESC);

-- ============================================================================
-- SYSTEM PERFORMANCE MATERIALIZED VIEW
-- ============================================================================

-- Drop existing materialized view if it exists
DROP MATERIALIZED VIEW IF EXISTS system_performance_mv CASCADE;

-- Create system performance materialized view
CREATE MATERIALIZED VIEW system_performance_mv AS
SELECT 
    'polls' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE status = 'active') as active_records,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as records_last_24h,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as records_last_7d,
    MAX(created_at) as last_record_created,
    MIN(created_at) as first_record_created
FROM polls

UNION ALL

SELECT 
    'votes' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE is_verified = true) as active_records,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as records_last_24h,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as records_last_7d,
    MAX(created_at) as last_record_created,
    MIN(created_at) as first_record_created
FROM votes

UNION ALL

SELECT 
    'user_profiles' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE is_active = true) as active_records,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as records_last_24h,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as records_last_7d,
    MAX(created_at) as last_record_created,
    MIN(created_at) as first_record_created
FROM user_profiles

UNION ALL

SELECT 
    'webauthn_credentials' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE is_active = true) as active_records,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as records_last_24h,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as records_last_7d,
    MAX(created_at) as last_record_created,
    MIN(created_at) as first_record_created
FROM webauthn_credentials

UNION ALL

SELECT 
    'feedback' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE status IN ('open', 'in_progress')) as active_records,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as records_last_24h,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as records_last_7d,
    MAX(created_at) as last_record_created,
    MIN(created_at) as first_record_created
FROM feedback

UNION ALL

SELECT 
    'error_logs' as table_name,
    COUNT(*) as total_records,
    COUNT(*) FILTER (WHERE severity IN ('high', 'critical')) as active_records,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as records_last_24h,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as records_last_7d,
    MAX(created_at) as last_record_created,
    MIN(created_at) as first_record_created
FROM error_logs;

-- Create indexes on system performance materialized view
CREATE INDEX idx_system_performance_mv_table_name ON system_performance_mv(table_name);
CREATE INDEX idx_system_performance_mv_total_records ON system_performance_mv(total_records DESC);
CREATE INDEX idx_system_performance_mv_active_records ON system_performance_mv(active_records DESC);

-- ============================================================================
-- MATERIALIZED VIEW REFRESH FUNCTIONS
-- ============================================================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_materialized_views()
RETURNS TABLE (
    view_name TEXT,
    refresh_start TIMESTAMP WITH TIME ZONE,
    refresh_end TIMESTAMP WITH TIME ZONE,
    duration INTERVAL,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    start_time TIMESTAMP WITH TIME ZONE;
    end_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Refresh poll results
    start_time := NOW();
    REFRESH MATERIALIZED VIEW CONCURRENTLY poll_results_mv;
    end_time := NOW();
    RETURN QUERY SELECT 
        'poll_results_mv'::TEXT, 
        start_time, 
        end_time, 
        end_time - start_time, 
        'success'::TEXT;
    
    -- Refresh user activity
    start_time := NOW();
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_activity_mv;
    end_time := NOW();
    RETURN QUERY SELECT 
        'user_activity_mv'::TEXT, 
        start_time, 
        end_time, 
        end_time - start_time, 
        'success'::TEXT;
    
    -- Refresh voting analytics
    start_time := NOW();
    REFRESH MATERIALIZED VIEW CONCURRENTLY voting_analytics_mv;
    end_time := NOW();
    RETURN QUERY SELECT 
        'voting_analytics_mv'::TEXT, 
        start_time, 
        end_time, 
        end_time - start_time, 
        'success'::TEXT;
    
    -- Refresh system performance
    start_time := NOW();
    REFRESH MATERIALIZED VIEW CONCURRENTLY system_performance_mv;
    end_time := NOW();
    RETURN QUERY SELECT 
        'system_performance_mv'::TEXT, 
        start_time, 
        end_time, 
        end_time - start_time, 
        'success'::TEXT;
END;
$$;

-- Function to refresh specific materialized view
CREATE OR REPLACE FUNCTION refresh_materialized_view(view_name TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    start_time TIMESTAMP WITH TIME ZONE;
    end_time TIMESTAMP WITH TIME ZONE;
    duration INTERVAL;
BEGIN
    start_time := NOW();
    
    CASE view_name
        WHEN 'poll_results_mv' THEN
            REFRESH MATERIALIZED VIEW CONCURRENTLY poll_results_mv;
        WHEN 'user_activity_mv' THEN
            REFRESH MATERIALIZED VIEW CONCURRENTLY user_activity_mv;
        WHEN 'voting_analytics_mv' THEN
            REFRESH MATERIALIZED VIEW CONCURRENTLY voting_analytics_mv;
        WHEN 'system_performance_mv' THEN
            REFRESH MATERIALIZED VIEW CONCURRENTLY system_performance_mv;
        ELSE
            RETURN 'ERROR: Unknown materialized view: ' || view_name;
    END CASE;
    
    end_time := NOW();
    duration := end_time - start_time;
    
    RETURN 'SUCCESS: Refreshed ' || view_name || ' in ' || duration;
END;
$$;

-- ============================================================================
-- MATERIALIZED VIEW MONITORING
-- ============================================================================

-- Function to get materialized view statistics
CREATE OR REPLACE FUNCTION get_materialized_view_stats()
RETURNS TABLE (
    view_name TEXT,
    size_mb NUMERIC,
    row_count BIGINT,
    last_refresh TIMESTAMP WITH TIME ZONE,
    refresh_duration INTERVAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        mv.matviewname::TEXT,
        ROUND(pg_total_relation_size(mv.matviewname::regclass) / 1024.0 / 1024.0, 2) as size_mb,
        (SELECT COUNT(*) FROM poll_results_mv) as row_count,
        mv.last_refresh,
        mv.refresh_duration
    FROM pg_matviews mv
    WHERE mv.schemaname = 'public'
    ORDER BY pg_total_relation_size(mv.matviewname::regclass) DESC;
END;
$$;

-- ============================================================================
-- INITIAL DATA POPULATION
-- ============================================================================

-- Populate all materialized views with initial data
REFRESH MATERIALIZED VIEW poll_results_mv;
REFRESH MATERIALIZED VIEW user_activity_mv;
REFRESH MATERIALIZED VIEW voting_analytics_mv;
REFRESH MATERIALIZED VIEW system_performance_mv;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify materialized views were created
SELECT 
    'MATERIALIZED VIEWS CREATED' as status,
    matviewname,
    pg_size_pretty(pg_total_relation_size(matviewname::regclass)) as size
FROM pg_matviews 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(matviewname::regclass) DESC;

-- ============================================================================
-- MATERIALIZED VIEWS COMPLETE
-- ============================================================================

SELECT '📊 MATERIALIZED VIEWS CREATED SUCCESSFULLY! 📊' as status;
