-- Migration 005: Performance Optimization
-- Week 6 of Phase 1.4: Database Schema Hardening
-- Goal: Optimize database performance with query optimization, caching, and maintenance automation

-- Step 1: Create performance monitoring and analytics tables
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Metric identification
  metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN (
    'query_performance', 'index_usage', 'connection_pool', 'cache_hit_rate',
    'slow_queries', 'lock_wait_time', 'buffer_hit_ratio', 'table_bloat'
  )),
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15,4) NOT NULL,
  metric_unit VARCHAR(20),
  
  -- Context
  table_name VARCHAR(100),
  index_name VARCHAR(100),
  query_hash TEXT,
  query_text TEXT,
  
  -- Performance details
  execution_time_ms INTEGER,
  rows_affected INTEGER,
  rows_scanned INTEGER,
  buffer_reads INTEGER,
  buffer_hits INTEGER,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_execution_time CHECK (execution_time_ms IS NULL OR execution_time_ms >= 0),
  CONSTRAINT valid_rows_affected CHECK (rows_affected IS NULL OR rows_affected >= 0),
  CONSTRAINT valid_rows_scanned CHECK (rows_scanned IS NULL OR rows_scanned >= 0)
);

-- Step 2: Create query performance tracking table
CREATE TABLE IF NOT EXISTS query_performance_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Query identification
  query_hash TEXT NOT NULL,
  query_signature TEXT NOT NULL,
  query_type VARCHAR(50) NOT NULL CHECK (query_type IN (
    'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'ALTER', 'DROP'
  )),
  
  -- Performance metrics
  execution_time_ms INTEGER NOT NULL,
  planning_time_ms INTEGER,
  total_time_ms INTEGER,
  rows_affected INTEGER,
  rows_scanned INTEGER,
  
  -- Resource usage
  buffer_reads INTEGER,
  buffer_hits INTEGER,
  shared_blks_hit INTEGER,
  shared_blks_read INTEGER,
  shared_blks_written INTEGER,
  temp_blks_read INTEGER,
  temp_blks_written INTEGER,
  
  -- Context
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  client_ip INET,
  user_agent TEXT,
  
  -- Timing
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_execution_time CHECK (execution_time_ms >= 0),
  CONSTRAINT valid_planning_time CHECK (planning_time_ms IS NULL OR planning_time_ms >= 0),
  CONSTRAINT valid_total_time CHECK (total_time_ms IS NULL OR total_time_ms >= 0)
);

-- Step 3: Create index usage analytics table
CREATE TABLE IF NOT EXISTS index_usage_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Index identification
  table_name VARCHAR(100) NOT NULL,
  index_name VARCHAR(100) NOT NULL,
  index_type VARCHAR(50) NOT NULL,
  
  -- Usage statistics
  scans_total BIGINT DEFAULT 0,
  scans_user_tuples BIGINT DEFAULT 0,
  scans_system_tuples BIGINT DEFAULT 0,
  tuples_read BIGINT DEFAULT 0,
  tuples_fetched BIGINT DEFAULT 0,
  
  -- Performance metrics
  avg_scan_time_ms DECIMAL(10,4),
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  -- Analysis
  efficiency_score DECIMAL(3,2) CHECK (efficiency_score >= 0 AND efficiency_score <= 1),
  is_recommended BOOLEAN DEFAULT true,
  recommendation_reason TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_efficiency_score CHECK (efficiency_score >= 0 AND efficiency_score <= 1)
);

-- Step 4: Create connection pool monitoring table
CREATE TABLE IF NOT EXISTS connection_pool_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Pool identification
  pool_name VARCHAR(100) NOT NULL,
  pool_type VARCHAR(50) NOT NULL CHECK (pool_type IN ('database', 'redis', 'external')),
  
  -- Pool statistics
  total_connections INTEGER NOT NULL,
  active_connections INTEGER NOT NULL,
  idle_connections INTEGER NOT NULL,
  waiting_connections INTEGER DEFAULT 0,
  
  -- Performance metrics
  connection_wait_time_ms INTEGER,
  avg_connection_time_ms INTEGER,
  connection_errors INTEGER DEFAULT 0,
  
  -- Health indicators
  pool_health_score DECIMAL(3,2) CHECK (pool_health_score >= 0 AND pool_health_score <= 1),
  is_healthy BOOLEAN DEFAULT true,
  health_issues TEXT[],
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_connection_counts CHECK (
    total_connections >= active_connections + idle_connections AND
    active_connections >= 0 AND
    idle_connections >= 0
  ),
  CONSTRAINT valid_health_score CHECK (pool_health_score >= 0 AND pool_health_score <= 1)
);

-- Step 5: Create cache performance tracking table
CREATE TABLE IF NOT EXISTS cache_performance_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Cache identification
  cache_name VARCHAR(100) NOT NULL,
  cache_type VARCHAR(50) NOT NULL CHECK (cache_type IN ('memory', 'redis', 'database', 'cdn')),
  
  -- Performance metrics
  hit_count BIGINT DEFAULT 0,
  miss_count BIGINT DEFAULT 0,
  hit_rate DECIMAL(5,4) GENERATED ALWAYS AS (
    CASE 
      WHEN (hit_count + miss_count) = 0 THEN 0
      ELSE hit_count::DECIMAL / (hit_count + miss_count)
    END
  ) STORED,
  
  -- Response times
  avg_response_time_ms INTEGER,
  max_response_time_ms INTEGER,
  min_response_time_ms INTEGER,
  
  -- Memory usage
  memory_usage_bytes BIGINT,
  memory_limit_bytes BIGINT,
  memory_usage_percent DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN memory_limit_bytes = 0 THEN 0
      ELSE (memory_usage_bytes::DECIMAL / memory_limit_bytes) * 100
    END
  ) STORED,
  
  -- Eviction metrics
  eviction_count BIGINT DEFAULT 0,
  eviction_rate DECIMAL(5,4),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_response_times CHECK (
    (avg_response_time_ms IS NULL OR avg_response_time_ms >= 0) AND
    (max_response_time_ms IS NULL OR max_response_time_ms >= 0) AND
    (min_response_time_ms IS NULL OR min_response_time_ms >= 0)
  ),
  CONSTRAINT valid_memory_usage CHECK (
    memory_usage_bytes IS NULL OR memory_usage_bytes >= 0
  )
);

-- Step 6: Create maintenance job tracking table
CREATE TABLE IF NOT EXISTS maintenance_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Job identification
  job_name VARCHAR(100) NOT NULL,
  job_type VARCHAR(50) NOT NULL CHECK (job_type IN (
    'cleanup', 'vacuum', 'analyze', 'reindex', 'backup', 'optimization'
  )),
  
  -- Job status
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'running', 'completed', 'failed', 'cancelled'
  )),
  
  -- Execution details
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER GENERATED ALWAYS AS (
    CASE 
      WHEN started_at IS NULL OR completed_at IS NULL THEN NULL
      ELSE EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000
    END
  ) STORED,
  
  -- Results
  rows_affected INTEGER,
  tables_processed INTEGER,
  indexes_processed INTEGER,
  errors_encountered INTEGER DEFAULT 0,
  
  -- Performance impact
  performance_improvement_percent DECIMAL(5,2),
  space_saved_bytes BIGINT,
  
  -- Logging
  log_messages TEXT[],
  error_messages TEXT[],
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_duration CHECK (duration_ms IS NULL OR duration_ms >= 0),
  CONSTRAINT valid_performance_improvement CHECK (
    performance_improvement_percent IS NULL OR 
    performance_improvement_percent >= -100 AND performance_improvement_percent <= 1000
  )
);

-- Step 7: Create performance optimization indexes
-- Performance metrics indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type_name ON performance_metrics(metric_type, metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_table ON performance_metrics(table_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_query_hash ON performance_metrics(query_hash);

-- Query performance indexes
CREATE INDEX IF NOT EXISTS idx_query_performance_hash ON query_performance_log(query_hash);
CREATE INDEX IF NOT EXISTS idx_query_performance_type ON query_performance_log(query_type);
CREATE INDEX IF NOT EXISTS idx_query_performance_execution_time ON query_performance_log(execution_time_ms);
CREATE INDEX IF NOT EXISTS idx_query_performance_created_at ON query_performance_log(created_at);
CREATE INDEX IF NOT EXISTS idx_query_performance_user_id ON query_performance_log(user_id);

-- TTL index for query performance cleanup
CREATE INDEX IF NOT EXISTS idx_query_performance_ttl ON query_performance_log(created_at) 
WHERE created_at < NOW() - INTERVAL '30 days';

-- Index usage analytics indexes
CREATE INDEX IF NOT EXISTS idx_index_usage_table_name ON index_usage_analytics(table_name);
CREATE INDEX IF NOT EXISTS idx_index_usage_efficiency ON index_usage_analytics(efficiency_score);
CREATE INDEX IF NOT EXISTS idx_index_usage_recommended ON index_usage_analytics(is_recommended);
CREATE INDEX IF NOT EXISTS idx_index_usage_last_used ON index_usage_analytics(last_used_at);

-- Connection pool indexes
CREATE INDEX IF NOT EXISTS idx_connection_pool_name ON connection_pool_metrics(pool_name);
CREATE INDEX IF NOT EXISTS idx_connection_pool_health ON connection_pool_metrics(pool_health_score);
CREATE INDEX IF NOT EXISTS idx_connection_pool_created_at ON connection_pool_metrics(created_at);

-- Cache performance indexes
CREATE INDEX IF NOT EXISTS idx_cache_performance_name ON cache_performance_log(cache_name);
CREATE INDEX IF NOT EXISTS idx_cache_performance_hit_rate ON cache_performance_log(hit_rate);
CREATE INDEX IF NOT EXISTS idx_cache_performance_created_at ON cache_performance_log(created_at);

-- Maintenance jobs indexes
CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_name ON maintenance_jobs(job_name);
CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_status ON maintenance_jobs(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_type ON maintenance_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_jobs_created_at ON maintenance_jobs(created_at);

-- Step 8: Create performance optimization helper functions
-- Function to analyze query performance
CREATE OR REPLACE FUNCTION analyze_query_performance(
  p_query_hash TEXT,
  p_query_signature TEXT,
  p_query_type VARCHAR(50),
  p_execution_time_ms INTEGER,
  p_planning_time_ms INTEGER DEFAULT NULL,
  p_rows_affected INTEGER DEFAULT NULL,
  p_rows_scanned INTEGER DEFAULT NULL,
  p_buffer_reads INTEGER DEFAULT NULL,
  p_buffer_hits INTEGER DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_session_id VARCHAR(255) DEFAULT NULL,
  p_client_ip INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_total_time_ms INTEGER;
BEGIN
  -- Calculate total time
  v_total_time_ms := p_execution_time_ms + COALESCE(p_planning_time_ms, 0);
  
  -- Insert performance log
  INSERT INTO query_performance_log (
    query_hash, query_signature, query_type,
    execution_time_ms, planning_time_ms, total_time_ms,
    rows_affected, rows_scanned,
    buffer_reads, buffer_hits,
    user_id, session_id, client_ip, user_agent
  ) VALUES (
    p_query_hash, p_query_signature, p_query_type,
    p_execution_time_ms, p_planning_time_ms, v_total_time_ms,
    p_rows_affected, p_rows_scanned,
    p_buffer_reads, p_buffer_hits,
    p_user_id, p_session_id, p_client_ip, p_user_agent
  ) RETURNING id INTO v_log_id;
  
  -- Update performance metrics
  INSERT INTO performance_metrics (
    metric_type, metric_name, metric_value, metric_unit,
    query_hash, execution_time_ms, rows_affected, rows_scanned
  ) VALUES (
    'query_performance', 'execution_time_ms', p_execution_time_ms, 'ms',
    p_query_hash, p_execution_time_ms, p_rows_affected, p_rows_scanned
  );
  
  -- Check for slow queries and log alerts
  IF p_execution_time_ms > 1000 THEN -- 1 second threshold
    INSERT INTO performance_metrics (
      metric_type, metric_name, metric_value, metric_unit,
      query_hash, query_text
    ) VALUES (
      'slow_queries', 'slow_query_detected', p_execution_time_ms, 'ms',
      p_query_hash, p_query_signature
    );
  END IF;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update index usage analytics
CREATE OR REPLACE FUNCTION update_index_usage_analytics(
  p_table_name VARCHAR(100),
  p_index_name VARCHAR(100),
  p_index_type VARCHAR(50),
  p_scans_total BIGINT DEFAULT 0,
  p_scans_user_tuples BIGINT DEFAULT 0,
  p_scans_system_tuples BIGINT DEFAULT 0,
  p_tuples_read BIGINT DEFAULT 0,
  p_tuples_fetched BIGINT DEFAULT 0,
  p_avg_scan_time_ms DECIMAL(10,4) DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_analytics_id UUID;
  v_efficiency_score DECIMAL(3,2);
  v_is_recommended BOOLEAN;
  v_recommendation_reason TEXT;
BEGIN
  -- Calculate efficiency score
  IF p_tuples_read > 0 THEN
    v_efficiency_score := LEAST(p_tuples_fetched::DECIMAL / p_tuples_read, 1.0);
  ELSE
    v_efficiency_score := 1.0;
  END IF;
  
  -- Determine if index is recommended
  v_is_recommended := true;
  v_recommendation_reason := 'Index performing well';
  
  IF p_scans_total = 0 THEN
    v_is_recommended := false;
    v_recommendation_reason := 'Index never used';
  ELSIF v_efficiency_score < 0.5 THEN
    v_is_recommended := false;
    v_recommendation_reason := 'Low efficiency score';
  ELSIF p_avg_scan_time_ms > 100 THEN
    v_is_recommended := false;
    v_recommendation_reason := 'Slow scan time';
  END IF;
  
  -- Insert or update analytics
  INSERT INTO index_usage_analytics (
    table_name, index_name, index_type,
    scans_total, scans_user_tuples, scans_system_tuples,
    tuples_read, tuples_fetched, avg_scan_time_ms,
    efficiency_score, is_recommended, recommendation_reason,
    last_used_at
  ) VALUES (
    p_table_name, p_index_name, p_index_type,
    p_scans_total, p_scans_user_tuples, p_scans_system_tuples,
    p_tuples_read, p_tuples_fetched, p_avg_scan_time_ms,
    v_efficiency_score, v_is_recommended, v_recommendation_reason,
    NOW()
  )
  ON CONFLICT (table_name, index_name) DO UPDATE SET
    scans_total = EXCLUDED.scans_total,
    scans_user_tuples = EXCLUDED.scans_user_tuples,
    scans_system_tuples = EXCLUDED.scans_system_tuples,
    tuples_read = EXCLUDED.tuples_read,
    tuples_fetched = EXCLUDED.tuples_fetched,
    avg_scan_time_ms = EXCLUDED.avg_scan_time_ms,
    efficiency_score = EXCLUDED.efficiency_score,
    is_recommended = EXCLUDED.is_recommended,
    recommendation_reason = EXCLUDED.recommendation_reason,
    last_used_at = EXCLUDED.last_used_at,
    updated_at = NOW()
  RETURNING id INTO v_analytics_id;
  
  -- Update performance metrics
  INSERT INTO performance_metrics (
    metric_type, metric_name, metric_value, metric_unit,
    table_name, index_name
  ) VALUES (
    'index_usage', 'efficiency_score', v_efficiency_score, 'ratio',
    p_table_name, p_index_name
  );
  
  RETURN v_analytics_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update connection pool metrics
CREATE OR REPLACE FUNCTION update_connection_pool_metrics(
  p_pool_name VARCHAR(100),
  p_pool_type VARCHAR(50),
  p_total_connections INTEGER,
  p_active_connections INTEGER,
  p_idle_connections INTEGER,
  p_waiting_connections INTEGER DEFAULT 0,
  p_connection_wait_time_ms INTEGER DEFAULT NULL,
  p_avg_connection_time_ms INTEGER DEFAULT NULL,
  p_connection_errors INTEGER DEFAULT 0
) RETURNS UUID AS $$
DECLARE
  v_metrics_id UUID;
  v_pool_health_score DECIMAL(3,2);
  v_is_healthy BOOLEAN;
  v_health_issues TEXT[];
BEGIN
  -- Calculate health score
  v_pool_health_score := 1.0;
  v_health_issues := ARRAY[]::TEXT[];
  
  -- Check connection utilization
  IF p_total_connections > 0 THEN
    IF (p_active_connections::DECIMAL / p_total_connections) > 0.9 THEN
      v_pool_health_score := v_pool_health_score * 0.8;
      v_health_issues := array_append(v_health_issues, 'High connection utilization');
    END IF;
  END IF;
  
  -- Check waiting connections
  IF p_waiting_connections > 0 THEN
    v_pool_health_score := v_pool_health_score * 0.7;
    v_health_issues := array_append(v_health_issues, 'Connections waiting');
  END IF;
  
  -- Check connection errors
  IF p_connection_errors > 0 THEN
    v_pool_health_score := v_pool_health_score * 0.6;
    v_health_issues := array_append(v_health_issues, 'Connection errors detected');
  END IF;
  
  -- Determine if pool is healthy
  v_is_healthy := v_pool_health_score >= 0.7;
  
  -- Insert metrics
  INSERT INTO connection_pool_metrics (
    pool_name, pool_type,
    total_connections, active_connections, idle_connections, waiting_connections,
    connection_wait_time_ms, avg_connection_time_ms, connection_errors,
    pool_health_score, is_healthy, health_issues
  ) VALUES (
    p_pool_name, p_pool_type,
    p_total_connections, p_active_connections, p_idle_connections, p_waiting_connections,
    p_connection_wait_time_ms, p_avg_connection_time_ms, p_connection_errors,
    v_pool_health_score, v_is_healthy, v_health_issues
  ) RETURNING id INTO v_metrics_id;
  
  -- Update performance metrics
  INSERT INTO performance_metrics (
    metric_type, metric_name, metric_value, metric_unit
  ) VALUES (
    'connection_pool', 'health_score', v_pool_health_score, 'ratio'
  );
  
  RETURN v_metrics_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update cache performance metrics
CREATE OR REPLACE FUNCTION update_cache_performance_metrics(
  p_cache_name VARCHAR(100),
  p_cache_type VARCHAR(50),
  p_hit_count BIGINT DEFAULT 0,
  p_miss_count BIGINT DEFAULT 0,
  p_avg_response_time_ms INTEGER DEFAULT NULL,
  p_max_response_time_ms INTEGER DEFAULT NULL,
  p_min_response_time_ms INTEGER DEFAULT NULL,
  p_memory_usage_bytes BIGINT DEFAULT NULL,
  p_memory_limit_bytes BIGINT DEFAULT NULL,
  p_eviction_count BIGINT DEFAULT 0
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
  v_hit_rate DECIMAL(5,4);
  v_eviction_rate DECIMAL(5,4);
BEGIN
  -- Calculate hit rate
  IF (p_hit_count + p_miss_count) > 0 THEN
    v_hit_rate := p_hit_count::DECIMAL / (p_hit_count + p_miss_count);
  ELSE
    v_hit_rate := 0;
  END IF;
  
  -- Calculate eviction rate (if we have historical data)
  v_eviction_rate := 0; -- This would be calculated from historical data
  
  -- Insert or update cache performance
  INSERT INTO cache_performance_log (
    cache_name, cache_type,
    hit_count, miss_count,
    avg_response_time_ms, max_response_time_ms, min_response_time_ms,
    memory_usage_bytes, memory_limit_bytes,
    eviction_count, eviction_rate
  ) VALUES (
    p_cache_name, p_cache_type,
    p_hit_count, p_miss_count,
    p_avg_response_time_ms, p_max_response_time_ms, p_min_response_time_ms,
    p_memory_usage_bytes, p_memory_limit_bytes,
    p_eviction_count, v_eviction_rate
  )
  ON CONFLICT (cache_name) DO UPDATE SET
    hit_count = EXCLUDED.hit_count,
    miss_count = EXCLUDED.miss_count,
    avg_response_time_ms = EXCLUDED.avg_response_time_ms,
    max_response_time_ms = EXCLUDED.max_response_time_ms,
    min_response_time_ms = EXCLUDED.min_response_time_ms,
    memory_usage_bytes = EXCLUDED.memory_usage_bytes,
    memory_limit_bytes = EXCLUDED.memory_limit_bytes,
    eviction_count = EXCLUDED.eviction_count,
    eviction_rate = EXCLUDED.eviction_rate,
    updated_at = NOW()
  RETURNING id INTO v_log_id;
  
  -- Update performance metrics
  INSERT INTO performance_metrics (
    metric_type, metric_name, metric_value, metric_unit,
    table_name
  ) VALUES (
    'cache_hit_rate', 'hit_rate', v_hit_rate, 'ratio',
    p_cache_name
  );
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to run maintenance jobs
CREATE OR REPLACE FUNCTION run_maintenance_job(
  p_job_name VARCHAR(100),
  p_job_type VARCHAR(50)
) RETURNS UUID AS $$
DECLARE
  v_job_id UUID;
  v_started_at TIMESTAMP WITH TIME ZONE;
  v_completed_at TIMESTAMP WITH TIME ZONE;
  v_rows_affected INTEGER := 0;
  v_tables_processed INTEGER := 0;
  v_indexes_processed INTEGER := 0;
  v_errors_encountered INTEGER := 0;
  v_log_messages TEXT[] := ARRAY[]::TEXT[];
  v_error_messages TEXT[] := ARRAY[]::TEXT[];
BEGIN
  -- Create job record
  INSERT INTO maintenance_jobs (
    job_name, job_type, status, started_at
  ) VALUES (
    p_job_name, p_job_type, 'running', NOW()
  ) RETURNING id, started_at INTO v_job_id, v_started_at;
  
  BEGIN
    -- Execute job based on type
    CASE p_job_type
      WHEN 'cleanup' THEN
        -- Cleanup expired data
        DELETE FROM query_performance_log 
        WHERE created_at < NOW() - INTERVAL '30 days';
        GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
        v_log_messages := array_append(v_log_messages, 'Cleaned up old query performance logs');
        
        DELETE FROM device_flows_v2 
        WHERE expires_at < NOW() - INTERVAL '1 hour';
        GET DIAGNOSTICS v_rows_affected = v_rows_affected + ROW_COUNT;
        v_log_messages := array_append(v_log_messages, 'Cleaned up expired device flows');
        
        DELETE FROM user_sessions_v2 
        WHERE expires_at < NOW() - INTERVAL '1 hour';
        GET DIAGNOSTICS v_rows_affected = v_rows_affected + ROW_COUNT;
        v_log_messages := array_append(v_log_messages, 'Cleaned up expired user sessions');
        
      WHEN 'vacuum' THEN
        -- Run VACUUM on performance tables
        EXECUTE 'VACUUM ANALYZE performance_metrics';
        v_log_messages := array_append(v_log_messages, 'VACUUM ANALYZE on performance_metrics');
        
        EXECUTE 'VACUUM ANALYZE query_performance_log';
        v_log_messages := array_append(v_log_messages, 'VACUUM ANALYZE on query_performance_log');
        
        v_tables_processed := 2;
        
      WHEN 'analyze' THEN
        -- Run ANALYZE on all tables
        EXECUTE 'ANALYZE';
        v_log_messages := array_append(v_log_messages, 'ANALYZE on all tables');
        
      WHEN 'reindex' THEN
        -- Reindex performance-related indexes
        EXECUTE 'REINDEX INDEX CONCURRENTLY idx_performance_metrics_type_name';
        v_log_messages := array_append(v_log_messages, 'Reindexed performance metrics indexes');
        
        EXECUTE 'REINDEX INDEX CONCURRENTLY idx_query_performance_hash';
        v_log_messages := array_append(v_log_messages, 'Reindexed query performance indexes');
        
        v_indexes_processed := 2;
        
      ELSE
        RAISE EXCEPTION 'Unknown job type: %', p_job_type;
    END CASE;
    
    v_completed_at := NOW();
    
  EXCEPTION WHEN OTHERS THEN
    v_errors_encountered := 1;
    v_error_messages := array_append(v_error_messages, SQLERRM);
    v_completed_at := NOW();
  END;
  
  -- Update job record
  UPDATE maintenance_jobs SET
    status = CASE WHEN v_errors_encountered = 0 THEN 'completed' ELSE 'failed' END,
    completed_at = v_completed_at,
    rows_affected = v_rows_affected,
    tables_processed = v_tables_processed,
    indexes_processed = v_indexes_processed,
    errors_encountered = v_errors_encountered,
    log_messages = v_log_messages,
    error_messages = v_error_messages,
    updated_at = NOW()
  WHERE id = v_job_id;
  
  RETURN v_job_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get performance recommendations
CREATE OR REPLACE FUNCTION get_performance_recommendations()
RETURNS TABLE(
  recommendation_type VARCHAR(50),
  recommendation_text TEXT,
  priority VARCHAR(20),
  estimated_impact DECIMAL(5,2),
  implementation_effort VARCHAR(20)
) AS $$
BEGIN
  -- Return recommendations based on current performance data
  RETURN QUERY
  
  -- Slow query recommendations
  SELECT 
    'slow_query'::VARCHAR(50),
    'Consider optimizing query: ' || query_signature,
    CASE 
      WHEN execution_time_ms > 5000 THEN 'high'
      WHEN execution_time_ms > 1000 THEN 'medium'
      ELSE 'low'
    END::VARCHAR(20),
    (100 - (execution_time_ms / 100))::DECIMAL(5,2),
    'medium'::VARCHAR(20)
  FROM query_performance_log
  WHERE execution_time_ms > 1000
  AND created_at > NOW() - INTERVAL '7 days'
  ORDER BY execution_time_ms DESC
  LIMIT 5;
  
  -- Index recommendations
  UNION ALL
  SELECT 
    'index_optimization'::VARCHAR(50),
    'Consider ' || 
    CASE 
      WHEN is_recommended = false THEN 'removing or optimizing'
      ELSE 'adding'
    END || ' index: ' || index_name || ' on ' || table_name,
    CASE 
      WHEN efficiency_score < 0.3 THEN 'high'
      WHEN efficiency_score < 0.7 THEN 'medium'
      ELSE 'low'
    END::VARCHAR(20),
    ((1 - efficiency_score) * 100)::DECIMAL(5,2),
    'low'::VARCHAR(20)
  FROM index_usage_analytics
  WHERE is_recommended = false
  ORDER BY efficiency_score ASC
  LIMIT 5;
  
  -- Cache recommendations
  UNION ALL
  SELECT 
    'cache_optimization'::VARCHAR(50),
    'Cache hit rate for ' || cache_name || ' is ' || (hit_rate * 100)::TEXT || '%',
    CASE 
      WHEN hit_rate < 0.5 THEN 'high'
      WHEN hit_rate < 0.8 THEN 'medium'
      ELSE 'low'
    END::VARCHAR(20),
    ((0.9 - hit_rate) * 100)::DECIMAL(5,2),
    'medium'::VARCHAR(20)
  FROM cache_performance_log
  WHERE hit_rate < 0.9
  ORDER BY hit_rate ASC
  LIMIT 3;
  
  -- Connection pool recommendations
  UNION ALL
  SELECT 
    'connection_pool'::VARCHAR(50),
    'Connection pool ' || pool_name || ' health score: ' || (pool_health_score * 100)::TEXT || '%',
    CASE 
      WHEN pool_health_score < 0.5 THEN 'high'
      WHEN pool_health_score < 0.8 THEN 'medium'
      ELSE 'low'
    END::VARCHAR(20),
    ((1 - pool_health_score) * 100)::DECIMAL(5,2),
    'high'::VARCHAR(20)
  FROM connection_pool_metrics
  WHERE pool_health_score < 0.8
  ORDER BY pool_health_score ASC
  LIMIT 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup old performance data
CREATE OR REPLACE FUNCTION cleanup_performance_data()
RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER := 0;
  v_temp_count INTEGER;
BEGIN
  -- Cleanup old query performance logs (keep 30 days)
  DELETE FROM query_performance_log 
  WHERE created_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS v_temp_count = ROW_COUNT;
  v_deleted_count := v_deleted_count + v_temp_count;
  
  -- Cleanup old performance metrics (keep 90 days)
  DELETE FROM performance_metrics 
  WHERE created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS v_temp_count = ROW_COUNT;
  v_deleted_count := v_deleted_count + v_temp_count;
  
  -- Cleanup old connection pool metrics (keep 7 days)
  DELETE FROM connection_pool_metrics 
  WHERE created_at < NOW() - INTERVAL '7 days';
  GET DIAGNOSTICS v_temp_count = ROW_COUNT;
  v_deleted_count := v_deleted_count + v_temp_count;
  
  -- Cleanup old cache performance logs (keep 30 days)
  DELETE FROM cache_performance_log 
  WHERE created_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS v_temp_count = ROW_COUNT;
  v_deleted_count := v_deleted_count + v_temp_count;
  
  -- Cleanup completed maintenance jobs (keep 90 days)
  DELETE FROM maintenance_jobs 
  WHERE status = 'completed' 
  AND created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS v_temp_count = ROW_COUNT;
  v_deleted_count := v_deleted_count + v_temp_count;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 9: Add triggers for updated_at
CREATE TRIGGER trg_index_usage_analytics_updated
  BEFORE UPDATE ON index_usage_analytics
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_cache_performance_log_updated
  BEFORE UPDATE ON cache_performance_log
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_maintenance_jobs_updated
  BEFORE UPDATE ON maintenance_jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Step 10: Enable RLS on new tables
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE query_performance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE index_usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE connection_pool_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE cache_performance_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_jobs ENABLE ROW LEVEL SECURITY;

-- Step 11: Create RLS policies
-- Performance metrics policies (admin only)
CREATE POLICY "Admins can manage performance metrics" ON performance_metrics
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Query performance policies (admin only)
CREATE POLICY "Admins can manage query performance" ON query_performance_log
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Index usage policies (admin only)
CREATE POLICY "Admins can manage index usage" ON index_usage_analytics
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Connection pool policies (admin only)
CREATE POLICY "Admins can manage connection pools" ON connection_pool_metrics
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Cache performance policies (admin only)
CREATE POLICY "Admins can manage cache performance" ON cache_performance_log
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Maintenance jobs policies (admin only)
CREATE POLICY "Admins can manage maintenance jobs" ON maintenance_jobs
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Step 12: Add comments for documentation
COMMENT ON TABLE performance_metrics IS 'Comprehensive performance metrics tracking for database optimization';
COMMENT ON TABLE query_performance_log IS 'Detailed query performance logging and analysis';
COMMENT ON TABLE index_usage_analytics IS 'Index usage analytics and optimization recommendations';
COMMENT ON TABLE connection_pool_metrics IS 'Connection pool performance monitoring and health tracking';
COMMENT ON TABLE cache_performance_log IS 'Cache performance metrics and hit rate analysis';
COMMENT ON TABLE maintenance_jobs IS 'Maintenance job tracking and execution history';

COMMENT ON FUNCTION analyze_query_performance(TEXT, TEXT, VARCHAR, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, UUID, VARCHAR, INET, TEXT) IS 'Analyze and log query performance metrics';
COMMENT ON FUNCTION update_index_usage_analytics(VARCHAR, VARCHAR, VARCHAR, BIGINT, BIGINT, BIGINT, BIGINT, BIGINT, DECIMAL) IS 'Update index usage analytics and efficiency scoring';
COMMENT ON FUNCTION update_connection_pool_metrics(VARCHAR, VARCHAR, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) IS 'Update connection pool metrics and health scoring';
COMMENT ON FUNCTION update_cache_performance_metrics(VARCHAR, VARCHAR, BIGINT, BIGINT, INTEGER, INTEGER, INTEGER, BIGINT, BIGINT, BIGINT) IS 'Update cache performance metrics and hit rate analysis';
COMMENT ON FUNCTION run_maintenance_job(VARCHAR, VARCHAR) IS 'Execute maintenance jobs with tracking and logging';
COMMENT ON FUNCTION get_performance_recommendations() IS 'Get performance optimization recommendations based on current metrics';
COMMENT ON FUNCTION cleanup_performance_data() IS 'Cleanup old performance data to maintain database efficiency';

-- Migration completed successfully
-- Comprehensive performance optimization with monitoring, analytics, and maintenance automation











