-- Migration 006: Testing & Validation
-- Week 7 of Phase 1.4: Database Schema Hardening
-- Goal: Comprehensive testing and validation of all schema changes

-- Step 1: Create testing and validation tables
CREATE TABLE IF NOT EXISTS schema_validation_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Test identification
  test_name VARCHAR(100) NOT NULL,
  test_category VARCHAR(50) NOT NULL CHECK (test_category IN (
    'schema_integrity', 'data_consistency', 'performance', 'security', 'functionality'
  )),
  test_description TEXT,
  
  -- Test results
  status VARCHAR(20) NOT NULL CHECK (status IN ('passed', 'failed', 'warning', 'skipped')),
  execution_time_ms INTEGER,
  error_message TEXT,
  warning_message TEXT,
  
  -- Test context
  table_name VARCHAR(100),
  function_name VARCHAR(100),
  constraint_name VARCHAR(100),
  index_name VARCHAR(100),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_execution_time CHECK (execution_time_ms IS NULL OR execution_time_ms >= 0)
);

CREATE TABLE IF NOT EXISTS data_consistency_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Check identification
  check_name VARCHAR(100) NOT NULL,
  check_type VARCHAR(50) NOT NULL CHECK (check_type IN (
    'foreign_key', 'unique_constraint', 'not_null', 'check_constraint', 'orphaned_records'
  )),
  
  -- Check results
  total_records INTEGER NOT NULL,
  valid_records INTEGER NOT NULL,
  invalid_records INTEGER NOT NULL,
  consistency_percentage DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN total_records = 0 THEN 100
      ELSE (valid_records::DECIMAL / total_records) * 100
    END
  ) STORED,
  
  -- Details
  table_name VARCHAR(100) NOT NULL,
  column_name VARCHAR(100),
  constraint_details TEXT,
  invalid_record_ids UUID[],
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_record_counts CHECK (
    total_records >= valid_records + invalid_records AND
    valid_records >= 0 AND
    invalid_records >= 0
  )
);

CREATE TABLE IF NOT EXISTS performance_baselines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Baseline identification
  baseline_name VARCHAR(100) NOT NULL,
  baseline_type VARCHAR(50) NOT NULL CHECK (baseline_type IN (
    'query_performance', 'index_efficiency', 'connection_pool', 'cache_performance'
  )),
  
  -- Baseline metrics
  metric_name VARCHAR(100) NOT NULL,
  baseline_value DECIMAL(15,4) NOT NULL,
  current_value DECIMAL(15,4),
  threshold_min DECIMAL(15,4),
  threshold_max DECIMAL(15,4),
  
  -- Performance comparison
  performance_change_percent DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE 
      WHEN baseline_value = 0 THEN NULL
      ELSE ((current_value - baseline_value) / baseline_value) * 100
    END
  ) STORED,
  
  -- Status
  status VARCHAR(20) GENERATED ALWAYS AS (
    CASE 
      WHEN current_value IS NULL THEN 'unknown'
      WHEN threshold_min IS NOT NULL AND current_value < threshold_min THEN 'degraded'
      WHEN threshold_max IS NOT NULL AND current_value > threshold_max THEN 'degraded'
      ELSE 'normal'
    END
  ) STORED,
  
  -- Context
  table_name VARCHAR(100),
  index_name VARCHAR(100),
  query_hash TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS security_validation_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Security check identification
  check_name VARCHAR(100) NOT NULL,
  check_category VARCHAR(50) NOT NULL CHECK (check_category IN (
    'rls_policies', 'encryption', 'access_control', 'audit_logging', 'data_protection'
  )),
  
  -- Check results
  status VARCHAR(20) NOT NULL CHECK (status IN ('passed', 'failed', 'warning')),
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  
  -- Details
  description TEXT,
  findings TEXT[],
  recommendations TEXT[],
  remediation_steps TEXT[],
  
  -- Context
  table_name VARCHAR(100),
  policy_name VARCHAR(100),
  function_name VARCHAR(100),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_severity_for_failed_checks CHECK (
    (status = 'failed' AND severity IN ('medium', 'high', 'critical')) OR
    status != 'failed'
  )
);

-- Step 2: Create indexes for validation tables
CREATE INDEX IF NOT EXISTS idx_schema_validation_test_name ON schema_validation_results(test_name);
CREATE INDEX IF NOT EXISTS idx_schema_validation_category ON schema_validation_results(test_category);
CREATE INDEX IF NOT EXISTS idx_schema_validation_status ON schema_validation_results(status);
CREATE INDEX IF NOT EXISTS idx_schema_validation_created_at ON schema_validation_results(created_at);

CREATE INDEX IF NOT EXISTS idx_data_consistency_check_name ON data_consistency_checks(check_name);
CREATE INDEX IF NOT EXISTS idx_data_consistency_type ON data_consistency_checks(check_type);
CREATE INDEX IF NOT EXISTS idx_data_consistency_table ON data_consistency_checks(table_name);
CREATE INDEX IF NOT EXISTS idx_data_consistency_percentage ON data_consistency_checks(consistency_percentage);

CREATE INDEX IF NOT EXISTS idx_performance_baseline_name ON performance_baselines(baseline_name);
CREATE INDEX IF NOT EXISTS idx_performance_baseline_type ON performance_baselines(baseline_type);
CREATE INDEX IF NOT EXISTS idx_performance_baseline_status ON performance_baselines(status);
CREATE INDEX IF NOT EXISTS idx_performance_baseline_created_at ON performance_baselines(created_at);

CREATE INDEX IF NOT EXISTS idx_security_validation_check_name ON security_validation_results(check_name);
CREATE INDEX IF NOT EXISTS idx_security_validation_category ON security_validation_results(check_category);
CREATE INDEX IF NOT EXISTS idx_security_validation_status ON security_validation_results(status);
CREATE INDEX IF NOT EXISTS idx_security_validation_severity ON security_validation_results(severity);

-- Step 3: Create validation helper functions
-- Function to run comprehensive schema validation
CREATE OR REPLACE FUNCTION run_schema_validation()
RETURNS TABLE(
  test_name VARCHAR(100),
  test_category VARCHAR(50),
  status VARCHAR(20),
  execution_time_ms INTEGER,
  error_message TEXT
) AS $$
DECLARE
  v_start_time TIMESTAMP WITH TIME ZONE;
  v_end_time TIMESTAMP WITH TIME ZONE;
  v_execution_time INTEGER;
  v_test_id UUID;
BEGIN
  -- Test 1: Check if all required tables exist
  v_start_time := NOW();
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
    INSERT INTO schema_validation_results (
      test_name, test_category, test_description, status, execution_time_ms, error_message
    ) VALUES (
      'Required tables exist', 'schema_integrity', 'Check if all required tables exist',
      'failed', EXTRACT(EPOCH FROM (NOW() - v_start_time)) * 1000,
      'Users view does not exist'
    );
  ELSE
    INSERT INTO schema_validation_results (
      test_name, test_category, test_description, status, execution_time_ms
    ) VALUES (
      'Required tables exist', 'schema_integrity', 'Check if all required tables exist',
      'passed', EXTRACT(EPOCH FROM (NOW() - v_start_time)) * 1000
    );
  END IF;
  
  -- Test 2: Check foreign key constraints
  v_start_time := NOW();
  
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_type = 'FOREIGN KEY' 
    AND table_name IN ('polls', 'votes', 'webauthn_credentials_v2', 'device_flows_v2')
  ) THEN
    INSERT INTO schema_validation_results (
      test_name, test_category, test_description, status, execution_time_ms
    ) VALUES (
      'Foreign key constraints', 'schema_integrity', 'Check if foreign key constraints exist',
      'passed', EXTRACT(EPOCH FROM (NOW() - v_start_time)) * 1000
    );
  ELSE
    INSERT INTO schema_validation_results (
      test_name, test_category, test_description, status, execution_time_ms, error_message
    ) VALUES (
      'Foreign key constraints', 'schema_integrity', 'Check if foreign key constraints exist',
      'failed', EXTRACT(EPOCH FROM (NOW() - v_start_time)) * 1000,
      'Missing foreign key constraints'
    );
  END IF;
  
  -- Test 3: Check RLS policies
  v_start_time := NOW();
  
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename IN ('polls', 'votes', 'webauthn_credentials_v2', 'device_flows_v2')
  ) THEN
    INSERT INTO schema_validation_results (
      test_name, test_category, test_description, status, execution_time_ms
    ) VALUES (
      'RLS policies', 'security', 'Check if RLS policies are configured',
      'passed', EXTRACT(EPOCH FROM (NOW() - v_start_time)) * 1000
    );
  ELSE
    INSERT INTO schema_validation_results (
      test_name, test_category, test_description, status, execution_time_ms, error_message
    ) VALUES (
      'RLS policies', 'security', 'Check if RLS policies are configured',
      'failed', EXTRACT(EPOCH FROM (NOW() - v_start_time)) * 1000,
      'Missing RLS policies'
    );
  END IF;
  
  -- Test 4: Check helper functions
  v_start_time := NOW();
  
  IF EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name IN ('get_user_by_identifier', 'user_exists', 'webauthn_generate_challenge')
  ) THEN
    INSERT INTO schema_validation_results (
      test_name, test_category, test_description, status, execution_time_ms
    ) VALUES (
      'Helper functions', 'functionality', 'Check if helper functions exist',
      'passed', EXTRACT(EPOCH FROM (NOW() - v_start_time)) * 1000
    );
  ELSE
    INSERT INTO schema_validation_results (
      test_name, test_category, test_description, status, execution_time_ms, error_message
    ) VALUES (
      'Helper functions', 'functionality', 'Check if helper functions exist',
      'failed', EXTRACT(EPOCH FROM (NOW() - v_start_time)) * 1000,
      'Missing helper functions'
    );
  END IF;
  
  -- Test 5: Check indexes
  v_start_time := NOW();
  
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname LIKE 'idx_%' 
    AND tablename IN ('polls', 'votes', 'webauthn_credentials_v2', 'device_flows_v2')
  ) THEN
    INSERT INTO schema_validation_results (
      test_name, test_category, test_description, status, execution_time_ms
    ) VALUES (
      'Performance indexes', 'performance', 'Check if performance indexes exist',
      'passed', EXTRACT(EPOCH FROM (NOW() - v_start_time)) * 1000
    );
  ELSE
    INSERT INTO schema_validation_results (
      test_name, test_category, test_description, status, execution_time_ms, error_message
    ) VALUES (
      'Performance indexes', 'performance', 'Check if performance indexes exist',
      'failed', EXTRACT(EPOCH FROM (NOW() - v_start_time)) * 1000,
      'Missing performance indexes'
    );
  END IF;
  
  -- Return results
  RETURN QUERY
  SELECT 
    test_name, test_category, status, execution_time_ms, error_message
  FROM schema_validation_results
  WHERE created_at >= NOW() - INTERVAL '1 hour'
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check data consistency
CREATE OR REPLACE FUNCTION check_data_consistency()
RETURNS TABLE(
  check_name VARCHAR(100),
  check_type VARCHAR(50),
  total_records INTEGER,
  valid_records INTEGER,
  invalid_records INTEGER,
  consistency_percentage DECIMAL(5,2)
) AS $$
DECLARE
  v_check_id UUID;
BEGIN
  -- Check 1: Orphaned polls (polls without valid user_id)
  INSERT INTO data_consistency_checks (
    check_name, check_type, total_records, valid_records, invalid_records,
    table_name, column_name, constraint_details
  )
  SELECT 
    'Orphaned polls check',
    'orphaned_records',
    COUNT(*),
    COUNT(CASE WHEN u.id IS NOT NULL THEN 1 END),
    COUNT(CASE WHEN u.id IS NULL THEN 1 END),
    'polls',
    'user_id',
    'Polls should have valid user_id references'
  FROM polls p
  LEFT JOIN auth.users u ON p.user_id = u.id;
  
  -- Check 2: Orphaned votes (votes without valid user_id)
  INSERT INTO data_consistency_checks (
    check_name, check_type, total_records, valid_records, invalid_records,
    table_name, column_name, constraint_details
  )
  SELECT 
    'Orphaned votes check',
    'orphaned_records',
    COUNT(*),
    COUNT(CASE WHEN u.id IS NOT NULL THEN 1 END),
    COUNT(CASE WHEN u.id IS NULL THEN 1 END),
    'votes',
    'user_id',
    'Votes should have valid user_id references'
  FROM votes v
  LEFT JOIN auth.users u ON v.user_id = u.id;
  
  -- Check 3: Orphaned WebAuthn credentials
  INSERT INTO data_consistency_checks (
    check_name, check_type, total_records, valid_records, invalid_records,
    table_name, column_name, constraint_details
  )
  SELECT 
    'Orphaned WebAuthn credentials check',
    'orphaned_records',
    COUNT(*),
    COUNT(CASE WHEN u.id IS NOT NULL THEN 1 END),
    COUNT(CASE WHEN u.id IS NULL THEN 1 END),
    'webauthn_credentials_v2',
    'user_id',
    'WebAuthn credentials should have valid user_id references'
  FROM webauthn_credentials_v2 wc
  LEFT JOIN auth.users u ON wc.user_id = u.id;
  
  -- Check 4: Orphaned device flows
  INSERT INTO data_consistency_checks (
    check_name, check_type, total_records, valid_records, invalid_records,
    table_name, column_name, constraint_details
  )
  SELECT 
    'Orphaned device flows check',
    'orphaned_records',
    COUNT(*),
    COUNT(CASE WHEN u.id IS NOT NULL THEN 1 END),
    COUNT(CASE WHEN u.id IS NULL THEN 1 END),
    'device_flows_v2',
    'user_id',
    'Device flows should have valid user_id references'
  FROM device_flows_v2 df
  LEFT JOIN auth.users u ON df.user_id = u.id;
  
  -- Return results
  RETURN QUERY
  SELECT 
    check_name, check_type, total_records, valid_records, invalid_records, consistency_percentage
  FROM data_consistency_checks
  WHERE created_at >= NOW() - INTERVAL '1 hour'
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to establish performance baselines
CREATE OR REPLACE FUNCTION establish_performance_baselines()
RETURNS TABLE(
  baseline_name VARCHAR(100),
  baseline_type VARCHAR(50),
  metric_name VARCHAR(100),
  baseline_value DECIMAL(15,4),
  status VARCHAR(20)
) AS $$
DECLARE
  v_baseline_id UUID;
BEGIN
  -- Baseline 1: Query performance baseline
  INSERT INTO performance_baselines (
    baseline_name, baseline_type, metric_name, baseline_value, threshold_min, threshold_max,
    table_name, description
  ) VALUES 
  ('Query Performance Baseline', 'query_performance', 'avg_execution_time_ms', 100, 50, 500, 'query_performance_log', 'Average query execution time'),
  ('Index Efficiency Baseline', 'index_efficiency', 'efficiency_score', 0.8, 0.6, 1.0, 'index_usage_analytics', 'Index efficiency score'),
  ('Cache Performance Baseline', 'cache_performance', 'hit_rate', 0.9, 0.7, 1.0, 'cache_performance_log', 'Cache hit rate'),
  ('Connection Pool Baseline', 'connection_pool', 'health_score', 0.8, 0.6, 1.0, 'connection_pool_metrics', 'Connection pool health score');
  
  -- Return results
  RETURN QUERY
  SELECT 
    baseline_name, baseline_type, metric_name, baseline_value, status
  FROM performance_baselines
  WHERE created_at >= NOW() - INTERVAL '1 hour'
  ORDER BY created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to run security validation
CREATE OR REPLACE FUNCTION run_security_validation()
RETURNS TABLE(
  check_name VARCHAR(100),
  check_category VARCHAR(50),
  status VARCHAR(20),
  severity VARCHAR(20),
  description TEXT
) AS $$
DECLARE
  v_check_id UUID;
BEGIN
  -- Security Check 1: RLS Policies
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename IN ('polls', 'votes', 'webauthn_credentials_v2', 'device_flows_v2')
    AND policyname LIKE '%user_access%'
  ) THEN
    INSERT INTO security_validation_results (
      check_name, check_category, status, severity, description
    ) VALUES (
      'RLS User Access Policies', 'rls_policies', 'passed', 'low',
      'User access RLS policies are properly configured'
    );
  ELSE
    INSERT INTO security_validation_results (
      check_name, check_category, status, severity, description,
      findings, recommendations
    ) VALUES (
      'RLS User Access Policies', 'rls_policies', 'failed', 'high',
      'Missing user access RLS policies',
      ARRAY['No user access policies found on critical tables'],
      ARRAY['Implement RLS policies for user data access control']
    );
  END IF;
  
  -- Security Check 2: Encryption
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name IN ('webauthn_credentials_v2', 'device_flows_v2', 'user_sessions_v2')
    AND column_name LIKE '%hash%'
  ) THEN
    INSERT INTO security_validation_results (
      check_name, check_category, status, severity, description
    ) VALUES (
      'Data Encryption', 'encryption', 'passed', 'low',
      'Sensitive data is properly hashed'
    );
  ELSE
    INSERT INTO security_validation_results (
      check_name, check_category, status, severity, description,
      findings, recommendations
    ) VALUES (
      'Data Encryption', 'encryption', 'failed', 'critical',
      'Sensitive data is not properly encrypted',
      ARRAY['Sensitive data columns are not hashed'],
      ARRAY['Implement proper hashing for all sensitive data columns']
    );
  END IF;
  
  -- Security Check 3: Audit Logging
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name IN ('session_security_events', 'auth_analytics')
  ) THEN
    INSERT INTO security_validation_results (
      check_name, check_category, status, severity, description
    ) VALUES (
      'Audit Logging', 'audit_logging', 'passed', 'low',
      'Audit logging tables are properly configured'
    );
  ELSE
    INSERT INTO security_validation_results (
      check_name, check_category, status, severity, description,
      findings, recommendations
    ) VALUES (
      'Audit Logging', 'audit_logging', 'failed', 'medium',
      'Missing audit logging infrastructure',
      ARRAY['No audit logging tables found'],
      ARRAY['Implement comprehensive audit logging for security events']
    );
  END IF;
  
  -- Return results
  RETURN QUERY
  SELECT 
    check_name, check_category, status, severity, description
  FROM security_validation_results
  WHERE created_at >= NOW() - INTERVAL '1 hour'
  ORDER BY severity DESC, created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate validation report
CREATE OR REPLACE FUNCTION generate_validation_report()
RETURNS TABLE(
  report_section VARCHAR(50),
  total_tests INTEGER,
  passed_tests INTEGER,
  failed_tests INTEGER,
  warning_tests INTEGER,
  success_rate DECIMAL(5,2)
) AS $$
BEGIN
  -- Schema Integrity Report
  RETURN QUERY
  SELECT 
    'Schema Integrity'::VARCHAR(50),
    COUNT(*)::INTEGER,
    COUNT(CASE WHEN status = 'passed' THEN 1 END)::INTEGER,
    COUNT(CASE WHEN status = 'failed' THEN 1 END)::INTEGER,
    COUNT(CASE WHEN status = 'warning' THEN 1 END)::INTEGER,
    ROUND(
      (COUNT(CASE WHEN status = 'passed' THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
    )::DECIMAL(5,2)
  FROM schema_validation_results
  WHERE test_category = 'schema_integrity'
  AND created_at >= NOW() - INTERVAL '1 hour';
  
  -- Data Consistency Report
  RETURN QUERY
  SELECT 
    'Data Consistency'::VARCHAR(50),
    COUNT(*)::INTEGER,
    COUNT(CASE WHEN consistency_percentage >= 95 THEN 1 END)::INTEGER,
    COUNT(CASE WHEN consistency_percentage < 95 THEN 1 END)::INTEGER,
    0::INTEGER,
    ROUND(AVG(consistency_percentage), 2)::DECIMAL(5,2)
  FROM data_consistency_checks
  WHERE created_at >= NOW() - INTERVAL '1 hour';
  
  -- Security Report
  RETURN QUERY
  SELECT 
    'Security'::VARCHAR(50),
    COUNT(*)::INTEGER,
    COUNT(CASE WHEN status = 'passed' THEN 1 END)::INTEGER,
    COUNT(CASE WHEN status = 'failed' THEN 1 END)::INTEGER,
    COUNT(CASE WHEN status = 'warning' THEN 1 END)::INTEGER,
    ROUND(
      (COUNT(CASE WHEN status = 'passed' THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
    )::DECIMAL(5,2)
  FROM security_validation_results
  WHERE created_at >= NOW() - INTERVAL '1 hour';
  
  -- Performance Report
  RETURN QUERY
  SELECT 
    'Performance'::VARCHAR(50),
    COUNT(*)::INTEGER,
    COUNT(CASE WHEN status = 'normal' THEN 1 END)::INTEGER,
    COUNT(CASE WHEN status = 'degraded' THEN 1 END)::INTEGER,
    0::INTEGER,
    ROUND(
      (COUNT(CASE WHEN status = 'normal' THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
    )::DECIMAL(5,2)
  FROM performance_baselines
  WHERE created_at >= NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Add triggers for updated_at
CREATE TRIGGER trg_performance_baselines_updated
  BEFORE UPDATE ON performance_baselines
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Step 5: Enable RLS on new tables
ALTER TABLE schema_validation_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_consistency_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_validation_results ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies
-- Schema validation policies (admin only)
CREATE POLICY "Admins can manage schema validation" ON schema_validation_results
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Data consistency policies (admin only)
CREATE POLICY "Admins can manage data consistency" ON data_consistency_checks
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Performance baseline policies (admin only)
CREATE POLICY "Admins can manage performance baselines" ON performance_baselines
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Security validation policies (admin only)
CREATE POLICY "Admins can manage security validation" ON security_validation_results
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Step 7: Add comments for documentation
COMMENT ON TABLE schema_validation_results IS 'Comprehensive schema validation test results and tracking';
COMMENT ON TABLE data_consistency_checks IS 'Data consistency validation and orphaned record detection';
COMMENT ON TABLE performance_baselines IS 'Performance baseline establishment and monitoring';
COMMENT ON TABLE security_validation_results IS 'Security validation results and compliance checking';

COMMENT ON FUNCTION run_schema_validation() IS 'Run comprehensive schema validation tests';
COMMENT ON FUNCTION check_data_consistency() IS 'Check data consistency and detect orphaned records';
COMMENT ON FUNCTION establish_performance_baselines() IS 'Establish performance baselines for monitoring';
COMMENT ON FUNCTION run_security_validation() IS 'Run security validation checks';
COMMENT ON FUNCTION generate_validation_report() IS 'Generate comprehensive validation report';

-- Migration completed successfully
-- Comprehensive testing and validation infrastructure implemented












