-- Rollback Migration 006: Testing & Validation
-- Week 7 of Phase 1.4: Database Schema Hardening

-- Drop RLS policies
DROP POLICY IF EXISTS "Admins can manage schema validation" ON schema_validation_results;
DROP POLICY IF EXISTS "Admins can manage data consistency" ON data_consistency_checks;
DROP POLICY IF EXISTS "Admins can manage performance baselines" ON performance_baselines;
DROP POLICY IF EXISTS "Admins can manage security validation" ON security_validation_results;

-- Drop triggers
DROP TRIGGER IF EXISTS trg_performance_baselines_updated ON performance_baselines;

-- Drop functions
DROP FUNCTION IF EXISTS run_schema_validation();
DROP FUNCTION IF EXISTS check_data_consistency();
DROP FUNCTION IF EXISTS establish_performance_baselines();
DROP FUNCTION IF EXISTS run_security_validation();
DROP FUNCTION IF EXISTS generate_validation_report();

-- Drop indexes
DROP INDEX IF EXISTS idx_schema_validation_test_name;
DROP INDEX IF EXISTS idx_schema_validation_category;
DROP INDEX IF EXISTS idx_schema_validation_status;
DROP INDEX IF EXISTS idx_schema_validation_created_at;

DROP INDEX IF EXISTS idx_data_consistency_check_name;
DROP INDEX IF EXISTS idx_data_consistency_type;
DROP INDEX IF EXISTS idx_data_consistency_table;
DROP INDEX IF EXISTS idx_data_consistency_percentage;

DROP INDEX IF EXISTS idx_performance_baseline_name;
DROP INDEX IF EXISTS idx_performance_baseline_type;
DROP INDEX IF EXISTS idx_performance_baseline_status;
DROP INDEX IF EXISTS idx_performance_baseline_created_at;

DROP INDEX IF EXISTS idx_security_validation_check_name;
DROP INDEX IF EXISTS idx_security_validation_category;
DROP INDEX IF EXISTS idx_security_validation_status;
DROP INDEX IF EXISTS idx_security_validation_severity;

-- Drop tables
DROP TABLE IF EXISTS security_validation_results;
DROP TABLE IF EXISTS performance_baselines;
DROP TABLE IF EXISTS data_consistency_checks;
DROP TABLE IF EXISTS schema_validation_results;

-- Rollback completed successfully

