-- Cache table for database-level caching
-- This table stores frequently accessed data to reduce query load

-- Create cache table
CREATE TABLE IF NOT EXISTS cache (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for cache performance
CREATE INDEX IF NOT EXISTS idx_cache_expires_at ON cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_cache_updated_at ON cache(updated_at);

-- Create function to clean expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get cache value with automatic expiration check
CREATE OR REPLACE FUNCTION get_cache_value(cache_key TEXT)
RETURNS TEXT AS $$
DECLARE
  cache_value TEXT;
BEGIN
  SELECT value INTO cache_value
  FROM cache
  WHERE key = cache_key AND expires_at > NOW();
  
  RETURN cache_value;
END;
$$ LANGUAGE plpgsql;

-- Create function to set cache value
CREATE OR REPLACE FUNCTION set_cache_value(
  cache_key TEXT,
  cache_value TEXT,
  ttl_seconds INTEGER DEFAULT 300
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO cache (key, value, expires_at)
  VALUES (cache_key, cache_value, NOW() + (ttl_seconds || ' seconds')::INTERVAL)
  ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    expires_at = EXCLUDED.expires_at,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create function to invalidate cache by pattern
CREATE OR REPLACE FUNCTION invalidate_cache_pattern(pattern TEXT)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM cache WHERE key LIKE pattern;
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get cache statistics
CREATE OR REPLACE FUNCTION get_cache_stats()
RETURNS TABLE(
  total_entries BIGINT,
  expired_entries BIGINT,
  active_entries BIGINT,
  cache_size_mb NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_entries,
    COUNT(*) FILTER (WHERE expires_at < NOW())::BIGINT as expired_entries,
    COUNT(*) FILTER (WHERE expires_at >= NOW())::BIGINT as active_entries,
    ROUND(pg_total_relation_size('cache') / 1024.0 / 1024.0, 2) as cache_size_mb
  FROM cache;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cache_updated_at_trigger
  BEFORE UPDATE ON cache
  FOR EACH ROW
  EXECUTE FUNCTION update_cache_updated_at();

-- Create RLS policies for cache table
ALTER TABLE cache ENABLE ROW LEVEL SECURITY;

-- Allow system to manage cache
CREATE POLICY "System can manage cache" ON cache
  FOR ALL USING (true);

-- Create scheduled job to clean expired cache (runs every hour)
-- Note: This requires pg_cron extension to be enabled
-- SELECT cron.schedule('clean-expired-cache', '0 * * * *', 'SELECT clean_expired_cache();');

-- Insert some initial cache entries for testing
INSERT INTO cache (key, value, expires_at) VALUES
  ('test_key_1', '{"message": "test value 1"}', NOW() + INTERVAL '1 hour'),
  ('test_key_2', '{"message": "test value 2"}', NOW() + INTERVAL '30 minutes')
ON CONFLICT (key) DO NOTHING;

-- Create view for cache monitoring
CREATE OR REPLACE VIEW cache_monitor AS
SELECT 
  key,
  LENGTH(value) as value_size,
  expires_at,
  created_at,
  updated_at,
  CASE 
    WHEN expires_at < NOW() THEN 'expired'
    WHEN expires_at < NOW() + INTERVAL '5 minutes' THEN 'expiring_soon'
    ELSE 'active'
  END as status
FROM cache
ORDER BY updated_at DESC;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON cache TO authenticated;
GRANT EXECUTE ON FUNCTION get_cache_value(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION set_cache_value(TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION invalidate_cache_pattern(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_cache_stats() TO authenticated;
GRANT SELECT ON cache_monitor TO authenticated;

-- Create function to get cache hit/miss statistics
CREATE OR REPLACE FUNCTION get_cache_performance_stats()
RETURNS TABLE(
  cache_hits BIGINT,
  cache_misses BIGINT,
  hit_rate NUMERIC,
  avg_cache_size NUMERIC,
  total_cleaned_entries BIGINT
) AS $$
DECLARE
  total_requests BIGINT;
  hit_count BIGINT;
  miss_count BIGINT;
BEGIN
  -- This would track actual cache hits/misses
  -- For now, return placeholder data
  RETURN QUERY
  SELECT 
    0::BIGINT as cache_hits,
    0::BIGINT as cache_misses,
    0.0::NUMERIC as hit_rate,
    0.0::NUMERIC as avg_cache_size,
    0::BIGINT as total_cleaned_entries;
END;
$$ LANGUAGE plpgsql;

-- Create function to warm up cache with frequently accessed data
CREATE OR REPLACE FUNCTION warm_up_cache()
RETURNS VOID AS $$
BEGIN
  -- Cache user count
  PERFORM set_cache_value(
    'stats:user_count',
    (SELECT COUNT(*)::TEXT FROM user_profiles),
    3600 -- 1 hour
  );
  
  -- Cache poll count
  PERFORM set_cache_value(
    'stats:poll_count',
    (SELECT COUNT(*)::TEXT FROM polls),
    1800 -- 30 minutes
  );
  
  -- Cache vote count
  PERFORM set_cache_value(
    'stats:vote_count',
    (SELECT COUNT(*)::TEXT FROM votes),
    1800 -- 30 minutes
  );
  
  -- Cache recent polls
  PERFORM set_cache_value(
    'polls:recent',
    (SELECT json_agg(p.*)::TEXT 
     FROM (SELECT * FROM polls ORDER BY created_at DESC LIMIT 10) p),
    900 -- 15 minutes
  );
END;
$$ LANGUAGE plpgsql;

-- Create function to get cache keys by pattern
CREATE OR REPLACE FUNCTION get_cache_keys(pattern TEXT DEFAULT '%')
RETURNS TABLE(key TEXT, expires_at TIMESTAMP WITH TIME ZONE) AS $$
BEGIN
  RETURN QUERY
  SELECT c.key, c.expires_at
  FROM cache c
  WHERE c.key LIKE pattern
  ORDER BY c.updated_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions for cache management functions
GRANT EXECUTE ON FUNCTION warm_up_cache() TO authenticated;
GRANT EXECUTE ON FUNCTION get_cache_keys(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_cache_performance_stats() TO authenticated;

-- Create index for cache key patterns
CREATE INDEX IF NOT EXISTS idx_cache_key_pattern ON cache USING gin(key gin_trgm_ops);

-- Add comment to table
COMMENT ON TABLE cache IS 'Database-level cache for frequently accessed data to improve performance';
COMMENT ON COLUMN cache.key IS 'Cache key (should be unique)';
COMMENT ON COLUMN cache.value IS 'Cached value (JSON or text)';
COMMENT ON COLUMN cache.expires_at IS 'Expiration timestamp';
COMMENT ON COLUMN cache.created_at IS 'When the cache entry was created';
COMMENT ON COLUMN cache.updated_at IS 'When the cache entry was last updated';
