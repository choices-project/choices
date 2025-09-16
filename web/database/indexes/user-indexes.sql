-- ============================================================================
-- USER-SPECIFIC PERFORMANCE INDEXES
-- ============================================================================
-- Agent D - Database Specialist
-- Phase 2B: Database & Caching
-- 
-- This script creates specialized indexes for user-related operations to optimize
-- user lookups, profile queries, authentication, and user analytics.
-- 
-- Created: September 15, 2025
-- Status: Production Ready
-- ============================================================================

-- ============================================================================
-- USER PROFILE LOOKUP OPTIMIZATION
-- ============================================================================

-- User Profiles: Username + Active (username lookups - most common)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_username_lookup 
ON user_profiles(username, is_active) 
WHERE is_active = true;

-- User Profiles: Email + Active (email lookups)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_email_lookup 
ON user_profiles(email, is_active) 
WHERE is_active = true;

-- User Profiles: User ID + Active (user ID lookups)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_user_id_lookup 
ON user_profiles(user_id, is_active) 
WHERE is_active = true;

-- User Profiles: Trust Tier + Active (trust-based filtering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_trust_lookup 
ON user_profiles(trust_tier, is_active) 
WHERE is_active = true;

-- ============================================================================
-- USER ACTIVITY AND ENGAGEMENT INDEXES
-- ============================================================================

-- User Profiles: Created Date + Trust Tier (user registration trends)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_registration_trends 
ON user_profiles(created_at DESC, trust_tier);

-- User Profiles: Updated Date + Active (recently active users)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_recently_active 
ON user_profiles(updated_at DESC, is_active) 
WHERE is_active = true;

-- User Profiles: Trust Tier + Created Date (trust progression)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_trust_progression 
ON user_profiles(trust_tier, created_at DESC);

-- ============================================================================
-- WEBAUTHN CREDENTIAL OPTIMIZATION
-- ============================================================================

-- WebAuthn: User ID + Active + Last Used (credential management)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webauthn_user_credential_mgmt 
ON webauthn_credentials(user_id, is_active, last_used_at DESC) 
WHERE is_active = true;

-- WebAuthn: Credential ID + Active (credential verification)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webauthn_credential_verification 
ON webauthn_credentials(credential_id, is_active) 
WHERE is_active = true;

-- WebAuthn: User ID + Created Date (credential history)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webauthn_user_credential_history 
ON webauthn_credentials(user_id, created_at DESC);

-- WebAuthn: Last Used + Active (stale credential cleanup)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webauthn_stale_credentials 
ON webauthn_credentials(last_used_at, is_active) 
WHERE is_active = true AND last_used_at IS NOT NULL;

-- WebAuthn: Transports + Active (transport-based filtering)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webauthn_transport_filtering 
ON webauthn_credentials USING GIN (transports) 
WHERE is_active = true;

-- ============================================================================
-- USER VOTING BEHAVIOR INDEXES
-- ============================================================================

-- Votes: User ID + Poll ID + Created Date (user voting history)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_user_voting_history 
ON votes(user_id, poll_id, created_at DESC);

-- Votes: User ID + Voting Method + Created Date (voting method preferences)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_user_method_preferences 
ON votes(user_id, voting_method, created_at DESC);

-- Votes: User ID + Created Date (user voting frequency)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_user_voting_frequency 
ON votes(user_id, created_at DESC);

-- Votes: User ID + Is Verified (verification status by user)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_votes_user_verification_status 
ON votes(user_id, is_verified);

-- ============================================================================
-- USER POLL CREATION INDEXES
-- ============================================================================

-- Polls: Created By + Status + Created Date (user's polls)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_polls_user_created_polls 
ON polls(created_by, status, created_at DESC);

-- Polls: Created By + Privacy + Status (user's private polls)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_polls_user_private_polls 
ON polls(created_by, privacy_level, status) 
WHERE privacy_level IN ('private', 'invite-only');

-- Polls: Created By + Category + Status (user's polls by category)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_polls_user_category_polls 
ON polls(created_by, category, status);

-- Polls: Created By + Total Votes + Status (user's popular polls)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_polls_user_popular_polls 
ON polls(created_by, total_votes DESC, status) 
WHERE status = 'active';

-- ============================================================================
-- USER FEEDBACK AND INTERACTION INDEXES
-- ============================================================================

-- Feedback: User ID + Status + Created Date (user feedback history)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedback_user_feedback_history 
ON feedback(user_id, status, created_at DESC) 
WHERE user_id IS NOT NULL;

-- Feedback: User ID + Type + Sentiment (user feedback patterns)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_feedback_user_feedback_patterns 
ON feedback(user_id, type, sentiment) 
WHERE user_id IS NOT NULL;

-- Error Logs: User ID + Severity + Created Date (user error tracking)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_error_logs_user_error_tracking 
ON error_logs(user_id, severity, created_at DESC) 
WHERE user_id IS NOT NULL;

-- ============================================================================
-- USER ANALYTICS AND REPORTING INDEXES
-- ============================================================================

-- User Profiles: Trust Tier + Created Date (trust tier distribution)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_trust_distribution 
ON user_profiles(trust_tier, created_at);

-- User Profiles: Is Active + Created Date (user retention analysis)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_retention_analysis 
ON user_profiles(is_active, created_at);

-- User Profiles: Updated Date + Is Active (user activity analysis)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_activity_analysis 
ON user_profiles(updated_at DESC, is_active);

-- ============================================================================
-- USER SEARCH AND DISCOVERY INDEXES
-- ============================================================================

-- User Profiles: Username full-text search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_username_search 
ON user_profiles USING GIN (to_tsvector('english', username));

-- User Profiles: Bio full-text search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_bio_search 
ON user_profiles USING GIN (to_tsvector('english', bio)) 
WHERE bio IS NOT NULL AND bio != '';

-- User Profiles: Combined search (username + bio)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_combined_search 
ON user_profiles USING GIN (to_tsvector('english', username || ' ' || COALESCE(bio, '')));

-- ============================================================================
-- USER PERFORMANCE MONITORING
-- ============================================================================

-- Create function to get user performance metrics
CREATE OR REPLACE FUNCTION get_user_performance_metrics()
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    trust_tier TEXT,
    total_polls BIGINT,
    total_votes BIGINT,
    total_feedback BIGINT,
    last_activity TIMESTAMP WITH TIME ZONE,
    account_age_days INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.user_id,
        up.username,
        up.trust_tier,
        COUNT(DISTINCT p.id) as total_polls,
        COUNT(DISTINCT v.id) as total_votes,
        COUNT(DISTINCT f.id) as total_feedback,
        GREATEST(
            up.updated_at,
            MAX(p.created_at),
            MAX(v.created_at),
            MAX(f.created_at)
        ) as last_activity,
        EXTRACT(DAYS FROM NOW() - up.created_at)::INTEGER as account_age_days
    FROM user_profiles up
    LEFT JOIN polls p ON up.user_id = p.created_by
    LEFT JOIN votes v ON up.user_id = v.user_id
    LEFT JOIN feedback f ON up.user_id = f.user_id
    WHERE up.is_active = true
    GROUP BY up.user_id, up.username, up.trust_tier, up.created_at, up.updated_at
    ORDER BY last_activity DESC;
END;
$$;

-- Create view for user analytics
CREATE OR REPLACE VIEW user_analytics AS
SELECT 
    up.user_id,
    up.username,
    up.trust_tier,
    up.created_at as registration_date,
    up.updated_at as last_profile_update,
    COUNT(DISTINCT p.id) as polls_created,
    COUNT(DISTINCT v.id) as votes_cast,
    COUNT(DISTINCT f.id) as feedback_submitted,
    COUNT(DISTINCT wc.id) as webauthn_credentials,
    SUM(p.total_votes) as total_votes_received,
    AVG(p.total_votes) as avg_votes_per_poll,
    MAX(GREATEST(p.created_at, v.created_at, f.created_at)) as last_activity,
    CASE 
        WHEN up.updated_at > NOW() - INTERVAL '7 days' THEN 'active'
        WHEN up.updated_at > NOW() - INTERVAL '30 days' THEN 'recent'
        WHEN up.updated_at > NOW() - INTERVAL '90 days' THEN 'inactive'
        ELSE 'dormant'
    END as activity_status
FROM user_profiles up
LEFT JOIN polls p ON up.user_id = p.created_by
LEFT JOIN votes v ON up.user_id = v.user_id
LEFT JOIN feedback f ON up.user_id = f.user_id
LEFT JOIN webauthn_credentials wc ON up.user_id = wc.user_id AND wc.is_active = true
WHERE up.is_active = true
GROUP BY up.user_id, up.username, up.trust_tier, up.created_at, up.updated_at
ORDER BY last_activity DESC;

-- ============================================================================
-- USER INTEGRITY AND SECURITY INDEXES
-- ============================================================================

-- User Profiles: Username uniqueness (already exists as UNIQUE constraint, but adding for performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_username_unique 
ON user_profiles(username) 
WHERE is_active = true;

-- User Profiles: Email uniqueness (already exists as UNIQUE constraint, but adding for performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_email_unique 
ON user_profiles(email) 
WHERE is_active = true;

-- WebAuthn: Credential ID uniqueness (already exists as UNIQUE constraint, but adding for performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webauthn_credential_id_unique 
ON webauthn_credentials(credential_id) 
WHERE is_active = true;

-- ============================================================================
-- USER COVERING INDEXES FOR COMMON QUERIES
-- ============================================================================

-- User Profiles: Covering index for user list queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_list_covering 
ON user_profiles(is_active, trust_tier, created_at DESC) 
INCLUDE (user_id, username, email, avatar_url) 
WHERE is_active = true;

-- User Profiles: Covering index for user search queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_search_covering 
ON user_profiles(is_active, username) 
INCLUDE (user_id, trust_tier, created_at, bio) 
WHERE is_active = true;

-- WebAuthn: Covering index for credential lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webauthn_credential_covering 
ON webauthn_credentials(user_id, is_active) 
INCLUDE (credential_id, public_key, counter, last_used_at) 
WHERE is_active = true;

-- ============================================================================
-- USER MAINTENANCE AND CLEANUP INDEXES
-- ============================================================================

-- User Profiles: Inactive users (cleanup candidates)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_profiles_inactive_cleanup 
ON user_profiles(created_at, updated_at) 
WHERE is_active = false;

-- WebAuthn: Unused credentials (cleanup candidates)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webauthn_unused_cleanup 
ON webauthn_credentials(last_used_at, created_at) 
WHERE is_active = true AND last_used_at IS NULL;

-- WebAuthn: Old credentials (cleanup candidates)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_webauthn_old_cleanup 
ON webauthn_credentials(created_at) 
WHERE is_active = true AND created_at < NOW() - INTERVAL '1 year';

-- ============================================================================
-- USER PERFORMANCE VERIFICATION
-- ============================================================================

-- Verify user indexes were created
SELECT 
    'USER INDEXES SUMMARY' as status,
    COUNT(*) as total_user_indexes,
    COUNT(*) FILTER (WHERE indexname LIKE 'idx_user_profiles_%') as profile_indexes,
    COUNT(*) FILTER (WHERE indexname LIKE 'idx_webauthn_%') as webauthn_indexes,
    COUNT(*) FILTER (WHERE indexname LIKE 'idx_%_covering') as covering_indexes
FROM pg_indexes 
WHERE schemaname = 'public'
AND (indexname LIKE 'idx_user_profiles_%' OR indexname LIKE 'idx_webauthn_%');

-- Show user index sizes
SELECT 
    'USER INDEX SIZES' as status,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as size
FROM pg_indexes 
WHERE schemaname = 'public'
AND (indexname LIKE 'idx_user_profiles_%' OR indexname LIKE 'idx_webauthn_%')
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- ============================================================================
-- USER OPTIMIZATION COMPLETE
-- ============================================================================

SELECT '👤 USER-SPECIFIC INDEXES CREATED SUCCESSFULLY! 👤' as status;
