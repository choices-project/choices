-- Migration: Performance Monitoring Tables Only
-- Date: November 3, 2025
-- Purpose: Add remaining performance monitoring schema from main migration
--
-- Note: This applies only the performance monitoring parts that weren't created
-- Part 1 (columns + poll_participation_analytics) was already applied successfully

-- ============================================================================
-- CREATE PERFORMANCE MONITORING TABLES
-- ============================================================================

BEGIN;

-- 1. General Performance Metrics Table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Metric identification
  metric_name TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  
  -- Context
  table_name TEXT,
  endpoint TEXT,
  query_hash TEXT,
  
  -- User context (optional)
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  
  -- Additional metadata (flexible)
  tags JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Auto-expiry (30 days retention)
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Constraints
  CONSTRAINT valid_metric_value CHECK (metric_value >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_perf_metrics_name_date 
  ON performance_metrics(metric_name, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_perf_metrics_type 
  ON performance_metrics(metric_type, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_perf_metrics_expires 
  ON performance_metrics(expires_at);

CREATE INDEX IF NOT EXISTS idx_perf_metrics_table 
  ON performance_metrics(table_name, recorded_at DESC) 
  WHERE table_name IS NOT NULL;

-- 2. Query Performance Log Table
CREATE TABLE IF NOT EXISTS query_performance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Query identification
  query_hash TEXT NOT NULL,
  query_signature TEXT NOT NULL,
  query_type TEXT NOT NULL,
  table_name TEXT,
  
  -- Performance metrics
  execution_time_ms NUMERIC NOT NULL CHECK (execution_time_ms >= 0),
  planning_time_ms NUMERIC CHECK (planning_time_ms >= 0),
  rows_affected INTEGER CHECK (rows_affected >= 0),
  rows_scanned INTEGER CHECK (rows_scanned >= 0),
  buffer_reads INTEGER,
  buffer_hits INTEGER,
  
  -- Computed columns
  slow_query BOOLEAN GENERATED ALWAYS AS (execution_time_ms > 1000) STORED,
  cache_efficiency NUMERIC GENERATED ALWAYS AS (
    CASE 
      WHEN buffer_reads > 0 THEN (buffer_hits::NUMERIC / buffer_reads::NUMERIC) * 100
      ELSE NULL 
    END
  ) STORED,
  
  -- Context
  user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  client_ip INET,
  user_agent TEXT,
  endpoint TEXT,
  
  -- Timestamps
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Constraints
  CONSTRAINT valid_execution_time CHECK (execution_time_ms >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_query_perf_hash_date 
  ON query_performance_log(query_hash, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_query_perf_slow 
  ON query_performance_log(slow_query, recorded_at DESC) 
  WHERE slow_query = TRUE;

CREATE INDEX IF NOT EXISTS idx_query_perf_table 
  ON query_performance_log(table_name, recorded_at DESC) 
  WHERE table_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_query_perf_expires 
  ON query_performance_log(expires_at);

-- 3. Cache Performance Log Table
CREATE TABLE IF NOT EXISTS cache_performance_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Cache identification
  cache_key TEXT NOT NULL,
  cache_operation TEXT NOT NULL CHECK (cache_operation IN ('HIT', 'MISS', 'SET', 'DELETE', 'INVALIDATE')),
  cache_type TEXT DEFAULT 'memory' CHECK (cache_type IN ('memory', 'redis', 'cdn', 'database')),
  namespace TEXT,
  
  -- Performance metrics
  operation_time_ms NUMERIC CHECK (operation_time_ms >= 0),
  cache_size_bytes INTEGER CHECK (cache_size_bytes >= 0),
  ttl_seconds INTEGER CHECK (ttl_seconds > 0),
  
  -- Computed efficiency
  is_hit BOOLEAN GENERATED ALWAYS AS (cache_operation = 'HIT') STORED,
  
  -- Timestamps
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  
  -- Constraints
  CONSTRAINT valid_cache_operation CHECK (cache_operation IN ('HIT', 'MISS', 'SET', 'DELETE', 'INVALIDATE'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cache_perf_key_date 
  ON cache_performance_log(cache_key, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_cache_perf_operation 
  ON cache_performance_log(cache_operation, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_cache_perf_type 
  ON cache_performance_log(cache_type, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_cache_perf_expires 
  ON cache_performance_log(expires_at);

CREATE INDEX IF NOT EXISTS idx_cache_perf_efficiency 
  ON cache_performance_log(cache_key, is_hit, recorded_at DESC);

COMMIT;

-- ============================================================================
-- CREATE RPC FUNCTIONS
-- ============================================================================

BEGIN;

-- 1. Analyze Query Performance
CREATE OR REPLACE FUNCTION analyze_query_performance(
  p_query_hash TEXT,
  p_query_signature TEXT,
  p_query_type TEXT,
  p_execution_time_ms NUMERIC,
  p_planning_time_ms NUMERIC DEFAULT NULL,
  p_rows_affected INTEGER DEFAULT NULL,
  p_rows_scanned INTEGER DEFAULT NULL,
  p_buffer_reads INTEGER DEFAULT NULL,
  p_buffer_hits INTEGER DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_client_ip INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO query_performance_log (
    query_hash, query_signature, query_type,
    execution_time_ms, planning_time_ms,
    rows_affected, rows_scanned,
    buffer_reads, buffer_hits,
    user_id, session_id, client_ip, user_agent
  ) VALUES (
    p_query_hash, p_query_signature, p_query_type,
    p_execution_time_ms, p_planning_time_ms,
    p_rows_affected, p_rows_scanned,
    p_buffer_reads, p_buffer_hits,
    p_user_id, p_session_id, p_client_ip, p_user_agent
  )
  RETURNING id INTO v_log_id;
  
  IF p_execution_time_ms > 5000 THEN
    RAISE NOTICE 'CRITICAL: Slow query detected - % ms: %', p_execution_time_ms, p_query_signature;
  ELSIF p_execution_time_ms > 1000 THEN
    RAISE NOTICE 'WARNING: Slow query detected - % ms: %', p_execution_time_ms, p_query_signature;
  END IF;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update Cache Performance Metrics
CREATE OR REPLACE FUNCTION update_cache_performance_metrics(
  p_cache_key TEXT,
  p_operation TEXT,
  p_operation_time_ms NUMERIC DEFAULT NULL,
  p_cache_size_bytes INTEGER DEFAULT NULL,
  p_ttl_seconds INTEGER DEFAULT NULL,
  p_cache_type TEXT DEFAULT 'memory'
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO cache_performance_log (
    cache_key, cache_operation, operation_time_ms,
    cache_size_bytes, ttl_seconds, cache_type
  ) VALUES (
    p_cache_key, p_operation, p_operation_time_ms,
    p_cache_size_bytes, p_ttl_seconds, p_cache_type
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Cleanup Performance Data
CREATE OR REPLACE FUNCTION cleanup_performance_data()
RETURNS JSONB AS $$
DECLARE
  v_perf_metrics_deleted INTEGER;
  v_query_logs_deleted INTEGER;
  v_cache_logs_deleted INTEGER;
BEGIN
  DELETE FROM performance_metrics WHERE expires_at < NOW();
  GET DIAGNOSTICS v_perf_metrics_deleted = ROW_COUNT;
  
  DELETE FROM query_performance_log WHERE expires_at < NOW();
  GET DIAGNOSTICS v_query_logs_deleted = ROW_COUNT;
  
  DELETE FROM cache_performance_log WHERE expires_at < NOW();
  GET DIAGNOSTICS v_cache_logs_deleted = ROW_COUNT;
  
  RETURN jsonb_build_object(
    'performance_metrics_deleted', v_perf_metrics_deleted,
    'query_logs_deleted', v_query_logs_deleted,
    'cache_logs_deleted', v_cache_logs_deleted,
    'cleanup_time', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Get Performance Recommendations
CREATE OR REPLACE FUNCTION get_performance_recommendations()
RETURNS TABLE(
  recommendation_type TEXT,
  severity TEXT,
  description TEXT,
  affected_tables TEXT[],
  suggested_action TEXT,
  estimated_impact TEXT,
  occurrence_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'slow_queries'::TEXT,
    CASE 
      WHEN COUNT(*) > 100 THEN 'critical'::TEXT
      WHEN COUNT(*) > 50 THEN 'high'::TEXT
      ELSE 'medium'::TEXT
    END,
    'Multiple slow queries detected'::TEXT,
    ARRAY_AGG(DISTINCT table_name)::TEXT[],
    'Review and optimize queries'::TEXT,
    '50-90% improvement'::TEXT,
    COUNT(*)
  FROM query_performance_log
  WHERE slow_query = TRUE 
    AND recorded_at > NOW() - INTERVAL '7 days'
  GROUP BY 1
  HAVING COUNT(*) > 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Run Maintenance Job
CREATE OR REPLACE FUNCTION run_maintenance_job(
  p_job_name TEXT,
  p_job_type TEXT
) RETURNS JSONB AS $$
DECLARE
  v_start_time TIMESTAMPTZ;
  v_end_time TIMESTAMPTZ;
  v_result JSONB;
BEGIN
  v_start_time := NOW();
  
  CASE p_job_type
    WHEN 'cleanup_expired' THEN
      v_result := cleanup_performance_data();
    WHEN 'vacuum_analyze' THEN
      EXECUTE 'VACUUM ANALYZE performance_metrics';
      EXECUTE 'VACUUM ANALYZE query_performance_log';
      EXECUTE 'VACUUM ANALYZE cache_performance_log';
      v_result := jsonb_build_object('tables_vacuumed', 3);
    ELSE
      RAISE EXCEPTION 'Unknown job type: %', p_job_type;
  END CASE;
  
  v_end_time := NOW();
  
  RETURN jsonb_build_object(
    'job_name', p_job_name,
    'job_type', p_job_type,
    'start_time', v_start_time,
    'end_time', v_end_time,
    'duration_ms', EXTRACT(EPOCH FROM (v_end_time - v_start_time)) * 1000,
    'success', TRUE,
    'details', v_result
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- Enable RLS
BEGIN;

ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_performance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_performance_log ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can view performance metrics"
  ON performance_metrics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND is_admin = TRUE
    )
  );

CREATE POLICY "System can insert performance metrics"
  ON performance_metrics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view query performance"
  ON query_performance_log FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND is_admin = TRUE
    )
  );

CREATE POLICY "System can insert query logs"
  ON query_performance_log FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view cache performance"
  ON cache_performance_log FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND is_admin = TRUE
    )
  );

CREATE POLICY "System can insert cache logs"
  ON cache_performance_log FOR INSERT
  WITH CHECK (true);

COMMIT;

