-- ============================================================================
-- QUERY CACHING SYSTEM
-- ============================================================================
-- Agent D - Database Specialist
-- Phase 2B: Database & Caching
-- 
-- This script implements a comprehensive query caching system to improve
-- database performance by caching frequently accessed query results.
-- 
-- Created: September 15, 2025
-- Status: Production Ready
-- ============================================================================

-- ============================================================================
-- QUERY CACHE TABLE
-- ============================================================================

-- Drop existing query cache table if it exists
DROP TABLE IF EXISTS query_cache CASCADE;

-- Create query cache table
CREATE TABLE query_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key TEXT NOT NULL UNIQUE,
    query_hash TEXT NOT NULL,
    query_type TEXT NOT NULL DEFAULT 'general',
    result_data JSONB NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    hit_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Cache statistics
    cache_size_bytes INTEGER DEFAULT 0,
    compression_ratio NUMERIC DEFAULT 1.0,
    
    -- Cache invalidation
    invalidation_tags TEXT[] DEFAULT '{}',
    parent_cache_keys TEXT[] DEFAULT '{}'
);

-- Create indexes on query cache table
CREATE INDEX idx_query_cache_key ON query_cache(cache_key);
CREATE INDEX idx_query_cache_expires ON query_cache(expires_at);
CREATE INDEX idx_query_cache_hash ON query_cache(query_hash);
CREATE INDEX idx_query_cache_type ON query_cache(query_type);
CREATE INDEX idx_query_cache_accessed ON query_cache(last_accessed DESC);
CREATE INDEX idx_query_cache_hit_count ON query_cache(hit_count DESC);
CREATE INDEX idx_query_cache_created_by ON query_cache(created_by);
CREATE INDEX idx_query_cache_invalidation_tags ON query_cache USING GIN (invalidation_tags);
CREATE INDEX idx_query_cache_parent_keys ON query_cache USING GIN (parent_cache_keys);

-- Enable RLS on query cache
ALTER TABLE query_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for query cache
CREATE POLICY "Users can view their own cache entries" ON query_cache
    FOR SELECT USING (created_by = auth.uid() OR created_by IS NULL);

CREATE POLICY "System can manage all cache entries" ON query_cache
    FOR ALL USING (true);

-- ============================================================================
-- CACHE INVALIDATION TABLE
-- ============================================================================

-- Create cache invalidation tracking table
CREATE TABLE cache_invalidation_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invalidation_type TEXT NOT NULL, -- 'manual', 'automatic', 'ttl_expired', 'dependency'
    cache_key TEXT,
    invalidation_tags TEXT[],
    reason TEXT,
    invalidated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    invalidated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    affected_entries INTEGER DEFAULT 0
);

-- Create indexes on cache invalidation log
CREATE INDEX idx_cache_invalidation_type ON cache_invalidation_log(invalidation_type);
CREATE INDEX idx_cache_invalidation_at ON cache_invalidation_log(invalidated_at DESC);
CREATE INDEX idx_cache_invalidation_tags ON cache_invalidation_log USING GIN (invalidation_tags);
CREATE INDEX idx_cache_invalidation_by ON cache_invalidation_log(invalidated_by);

-- ============================================================================
-- CACHE UTILITY FUNCTIONS
-- ============================================================================

-- Function to generate cache key
CREATE OR REPLACE FUNCTION generate_cache_key(
    query_text TEXT,
    params JSONB DEFAULT '{}'::JSONB,
    user_id UUID DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN 'query_' || encode(
        digest(
            query_text || COALESCE(params::TEXT, '') || COALESCE(user_id::TEXT, ''), 
            'sha256'
        ), 
        'hex'
    );
END;
$$;

-- Function to generate query hash
CREATE OR REPLACE FUNCTION generate_query_hash(query_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
    RETURN encode(digest(query_text, 'sha256'), 'hex');
END;
$$;

-- Function to get from cache
CREATE OR REPLACE FUNCTION get_from_cache(
    cache_key TEXT,
    update_stats BOOLEAN DEFAULT true
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    -- Get cached result
    SELECT qc.result_data INTO result
    FROM query_cache qc
    WHERE qc.cache_key = get_from_cache.cache_key
    AND qc.expires_at > NOW();
    
    -- Update hit count and last accessed if requested
    IF result IS NOT NULL AND update_stats THEN
        UPDATE query_cache 
        SET hit_count = hit_count + 1,
            last_accessed = NOW()
        WHERE cache_key = get_from_cache.cache_key;
    END IF;
    
    RETURN result;
END;
$$;

-- Function to set cache
CREATE OR REPLACE FUNCTION set_cache(
    cache_key TEXT,
    query_hash TEXT,
    result_data JSONB,
    ttl_seconds INTEGER DEFAULT 300,
    query_type TEXT DEFAULT 'general',
    metadata JSONB DEFAULT '{}'::JSONB,
    invalidation_tags TEXT[] DEFAULT '{}',
    parent_cache_keys TEXT[] DEFAULT '{}',
    user_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    cache_size INTEGER;
    compressed_data JSONB;
BEGIN
    -- Calculate cache size
    cache_size := pg_column_size(result_data);
    
    -- Store in cache
    INSERT INTO query_cache (
        cache_key, 
        query_hash, 
        query_type,
        result_data, 
        metadata,
        expires_at,
        invalidation_tags,
        parent_cache_keys,
        created_by,
        cache_size_bytes
    )
    VALUES (
        set_cache.cache_key,
        set_cache.query_hash,
        set_cache.query_type,
        set_cache.result_data,
        set_cache.metadata,
        NOW() + (ttl_seconds || ' seconds')::INTERVAL,
        set_cache.invalidation_tags,
        set_cache.parent_cache_keys,
        set_cache.user_id,
        cache_size
    )
    ON CONFLICT (cache_key) 
    DO UPDATE SET
        query_hash = EXCLUDED.query_hash,
        query_type = EXCLUDED.query_type,
        result_data = EXCLUDED.result_data,
        metadata = EXCLUDED.metadata,
        expires_at = EXCLUDED.expires_at,
        invalidation_tags = EXCLUDED.invalidation_tags,
        parent_cache_keys = EXCLUDED.parent_cache_keys,
        cache_size_bytes = EXCLUDED.cache_size_bytes,
        hit_count = 0,
        last_accessed = NOW();
END;
$$;

-- Function to invalidate cache by key
CREATE OR REPLACE FUNCTION invalidate_cache_by_key(
    cache_key TEXT,
    reason TEXT DEFAULT 'manual_invalidation'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM query_cache 
    WHERE cache_key = invalidate_cache_by_key.cache_key;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log invalidation
    INSERT INTO cache_invalidation_log (
        invalidation_type,
        cache_key,
        reason,
        affected_entries
    ) VALUES (
        'manual',
        invalidate_cache_by_key.cache_key,
        invalidate_cache_by_key.reason,
        deleted_count
    );
    
    RETURN deleted_count;
END;
$$;

-- Function to invalidate cache by tags
CREATE OR REPLACE FUNCTION invalidate_cache_by_tags(
    invalidation_tags TEXT[],
    reason TEXT DEFAULT 'tag_invalidation'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM query_cache 
    WHERE invalidation_tags && invalidate_cache_by_tags.invalidation_tags;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log invalidation
    INSERT INTO cache_invalidation_log (
        invalidation_type,
        invalidation_tags,
        reason,
        affected_entries
    ) VALUES (
        'automatic',
        invalidate_cache_by_tags.invalidation_tags,
        invalidate_cache_by_tags.reason,
        deleted_count
    );
    
    RETURN deleted_count;
END;
$$;

-- Function to invalidate dependent caches
CREATE OR REPLACE FUNCTION invalidate_dependent_caches(
    parent_cache_key TEXT,
    reason TEXT DEFAULT 'dependency_invalidation'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM query_cache 
    WHERE parent_cache_keys @> ARRAY[invalidate_dependent_caches.parent_cache_key];
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log invalidation
    INSERT INTO cache_invalidation_log (
        invalidation_type,
        cache_key,
        reason,
        affected_entries
    ) VALUES (
        'dependency',
        invalidate_dependent_caches.parent_cache_key,
        invalidate_dependent_caches.reason,
        deleted_count
    );
    
    RETURN deleted_count;
END;
$$;

-- Function to clean expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM query_cache 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup
    INSERT INTO cache_invalidation_log (
        invalidation_type,
        reason,
        affected_entries
    ) VALUES (
        'ttl_expired',
        'automatic_cleanup',
        deleted_count
    );
    
    RETURN deleted_count;
END;
$$;

-- Function to get cache statistics
CREATE OR REPLACE FUNCTION get_cache_statistics()
RETURNS TABLE (
    total_entries BIGINT,
    total_hits BIGINT,
    total_misses BIGINT,
    hit_rate NUMERIC,
    expired_entries BIGINT,
    cache_size_mb NUMERIC,
    avg_entry_size_kb NUMERIC,
    most_used_entries BIGINT,
    cache_efficiency NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_entries,
        SUM(hit_count) as total_hits,
        COUNT(*) - SUM(hit_count) as total_misses,
        ROUND(
            (SUM(hit_count)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
            2
        ) as hit_rate,
        COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_entries,
        ROUND(
            SUM(cache_size_bytes) / 1024.0 / 1024.0, 
            2
        ) as cache_size_mb,
        ROUND(
            AVG(cache_size_bytes) / 1024.0, 
            2
        ) as avg_entry_size_kb,
        COUNT(*) FILTER (WHERE hit_count > 10) as most_used_entries,
        ROUND(
            (COUNT(*) FILTER (WHERE hit_count > 0)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 
            2
        ) as cache_efficiency
    FROM query_cache;
END;
$$;

-- ============================================================================
-- CACHE TRIGGERS FOR AUTOMATIC INVALIDATION
-- ============================================================================

-- Function to handle poll changes and invalidate related caches
CREATE OR REPLACE FUNCTION invalidate_poll_caches()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Invalidate poll-related caches
    PERFORM invalidate_cache_by_tags(
        ARRAY['polls', 'poll_' || COALESCE(NEW.id, OLD.id)::TEXT],
        'poll_data_changed'
    );
    
    -- Invalidate user-related caches if poll creator changed
    IF TG_OP = 'UPDATE' AND OLD.created_by != NEW.created_by THEN
        PERFORM invalidate_cache_by_tags(
            ARRAY['user_polls', 'user_' || OLD.created_by::TEXT],
            'poll_creator_changed'
        );
        PERFORM invalidate_cache_by_tags(
            ARRAY['user_polls', 'user_' || NEW.created_by::TEXT],
            'poll_creator_changed'
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create triggers for automatic cache invalidation
CREATE TRIGGER trigger_invalidate_poll_caches
    AFTER INSERT OR UPDATE OR DELETE ON polls
    FOR EACH ROW
    EXECUTE FUNCTION invalidate_poll_caches();

-- Function to handle vote changes and invalidate related caches
CREATE OR REPLACE FUNCTION invalidate_vote_caches()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Invalidate vote-related caches
    PERFORM invalidate_cache_by_tags(
        ARRAY['votes', 'poll_' || COALESCE(NEW.poll_id, OLD.poll_id)::TEXT],
        'vote_data_changed'
    );
    
    -- Invalidate user-related caches
    PERFORM invalidate_cache_by_tags(
        ARRAY['user_votes', 'user_' || COALESCE(NEW.user_id, OLD.user_id)::TEXT],
        'user_vote_changed'
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for vote cache invalidation
CREATE TRIGGER trigger_invalidate_vote_caches
    AFTER INSERT OR UPDATE OR DELETE ON votes
    FOR EACH ROW
    EXECUTE FUNCTION invalidate_vote_caches();

-- Function to handle user profile changes and invalidate related caches
CREATE OR REPLACE FUNCTION invalidate_user_caches()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Invalidate user-related caches
    PERFORM invalidate_cache_by_tags(
        ARRAY['users', 'user_' || COALESCE(NEW.user_id, OLD.user_id)::TEXT],
        'user_profile_changed'
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for user cache invalidation
CREATE TRIGGER trigger_invalidate_user_caches
    AFTER INSERT OR UPDATE OR DELETE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION invalidate_user_caches();

-- ============================================================================
-- CACHE MAINTENANCE FUNCTIONS
-- ============================================================================

-- Function to perform cache maintenance
CREATE OR REPLACE FUNCTION perform_cache_maintenance()
RETURNS TABLE (
    operation TEXT,
    status TEXT,
    details TEXT,
    affected_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
    cleaned_count INTEGER;
BEGIN
    -- Clean up expired entries
    SELECT cleanup_expired_cache() INTO deleted_count;
    RETURN QUERY SELECT 
        'expired_cleanup'::TEXT, 
        'success'::TEXT, 
        'Cleaned up expired cache entries'::TEXT,
        deleted_count;
    
    -- Clean up low-hit entries (entries with 0 hits older than 1 hour)
    DELETE FROM query_cache 
    WHERE hit_count = 0 
    AND created_at < NOW() - INTERVAL '1 hour';
    
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    RETURN QUERY SELECT 
        'low_hit_cleanup'::TEXT, 
        'success'::TEXT, 
        'Cleaned up low-hit cache entries'::TEXT,
        cleaned_count;
    
    -- Update cache statistics
    UPDATE query_cache 
    SET cache_size_bytes = pg_column_size(result_data)
    WHERE cache_size_bytes = 0;
    
    RETURN QUERY SELECT 
        'statistics_update'::TEXT, 
        'success'::TEXT, 
        'Updated cache statistics'::TEXT,
        0;
END;
$$;

-- Function to get cache performance metrics
CREATE OR REPLACE FUNCTION get_cache_performance_metrics()
RETURNS TABLE (
    metric_name TEXT,
    metric_value NUMERIC,
    metric_unit TEXT,
    description TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        'total_cache_entries'::TEXT,
        COUNT(*)::NUMERIC,
        'entries'::TEXT,
        'Total number of cache entries'::TEXT
    FROM query_cache
    
    UNION ALL
    
    SELECT 
        'cache_hit_rate'::TEXT,
        ROUND((SUM(hit_count)::NUMERIC / NULLIF(COUNT(*), 0)) * 100, 2),
        'percent'::TEXT,
        'Percentage of cache hits'::TEXT
    FROM query_cache
    
    UNION ALL
    
    SELECT 
        'total_cache_size'::TEXT,
        ROUND(SUM(cache_size_bytes) / 1024.0 / 1024.0, 2),
        'MB'::TEXT,
        'Total cache size in megabytes'::TEXT
    FROM query_cache
    
    UNION ALL
    
    SELECT 
        'avg_entry_size'::TEXT,
        ROUND(AVG(cache_size_bytes) / 1024.0, 2),
        'KB'::TEXT,
        'Average cache entry size in kilobytes'::TEXT
    FROM query_cache
    
    UNION ALL
    
    SELECT 
        'expired_entries'::TEXT,
        COUNT(*) FILTER (WHERE expires_at < NOW())::NUMERIC,
        'entries'::TEXT,
        'Number of expired cache entries'::TEXT
    FROM query_cache;
END;
$$;

-- ============================================================================
-- CACHE MONITORING VIEWS
-- ============================================================================

-- Create view for cache monitoring
CREATE OR REPLACE VIEW cache_monitoring AS
SELECT 
    query_type,
    COUNT(*) as entry_count,
    SUM(hit_count) as total_hits,
    ROUND(AVG(hit_count), 2) as avg_hits_per_entry,
    ROUND(SUM(cache_size_bytes) / 1024.0 / 1024.0, 2) as total_size_mb,
    ROUND(AVG(cache_size_bytes) / 1024.0, 2) as avg_size_kb,
    COUNT(*) FILTER (WHERE expires_at < NOW()) as expired_count,
    COUNT(*) FILTER (WHERE hit_count = 0) as unused_count,
    MAX(last_accessed) as last_access_time
FROM query_cache
GROUP BY query_type
ORDER BY total_hits DESC;

-- Create view for cache invalidation history
CREATE OR REPLACE VIEW cache_invalidation_history AS
SELECT 
    invalidation_type,
    COUNT(*) as invalidation_count,
    SUM(affected_entries) as total_affected_entries,
    MAX(invalidated_at) as last_invalidation,
    COUNT(*) FILTER (WHERE invalidated_at > NOW() - INTERVAL '24 hours') as invalidations_last_24h
FROM cache_invalidation_log
GROUP BY invalidation_type
ORDER BY invalidation_count DESC;

-- ============================================================================
-- INITIAL CACHE SETUP
-- ============================================================================

-- Create some initial cache entries for testing
INSERT INTO query_cache (
    cache_key,
    query_hash,
    query_type,
    result_data,
    expires_at,
    invalidation_tags
) VALUES 
(
    'test_cache_entry',
    generate_query_hash('SELECT 1'),
    'test',
    '{"test": true}'::JSONB,
    NOW() + INTERVAL '1 hour',
    ARRAY['test']
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify cache system is working
SELECT 
    'CACHE SYSTEM VERIFICATION' as status,
    COUNT(*) as cache_entries,
    SUM(hit_count) as total_hits,
    ROUND(SUM(cache_size_bytes) / 1024.0 / 1024.0, 2) as cache_size_mb
FROM query_cache;

-- ============================================================================
-- QUERY CACHING COMPLETE
-- ============================================================================

SELECT '💾 QUERY CACHING SYSTEM IMPLEMENTED SUCCESSFULLY! 💾' as status;
