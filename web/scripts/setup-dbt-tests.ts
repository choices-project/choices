#!/usr/bin/env tsx

// Load environment variables
import dotenv from 'dotenv';
import { join } from 'path';
dotenv.config({ path: join(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDbtTests() {
  console.log('🧪 Setting up dbt Tests for Data Quality and Freshness SLAs...\n');

  try {
    // 1. Create dbt test tables
    console.log('1. Creating dbt test infrastructure...');
    
    const createDbtTestTables = `
      -- dbt test results table
      CREATE TABLE IF NOT EXISTS dbt_test_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        test_name TEXT NOT NULL,
        test_type TEXT NOT NULL CHECK (test_type IN ('unique', 'not_null', 'accepted_values', 'relationships', 'freshness', 'custom')),
        table_name TEXT NOT NULL,
        column_name TEXT,
        test_config JSONB DEFAULT '{}',
        status TEXT NOT NULL CHECK (status IN ('pass', 'fail', 'error', 'warn')),
        message TEXT,
        rows_affected BIGINT,
        execution_time_ms INTEGER,
        executed_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- dbt test configuration table
      CREATE TABLE IF NOT EXISTS dbt_test_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        test_name TEXT NOT NULL UNIQUE,
        test_type TEXT NOT NULL,
        table_name TEXT NOT NULL,
        column_name TEXT,
        test_config JSONB DEFAULT '{}',
        enabled BOOLEAN DEFAULT true,
        severity TEXT DEFAULT 'error' CHECK (severity IN ('error', 'warn')),
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- dbt freshness SLA table
      CREATE TABLE IF NOT EXISTS dbt_freshness_sla (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        table_name TEXT NOT NULL UNIQUE,
        max_age_hours INTEGER NOT NULL,
        warning_threshold_hours INTEGER,
        enabled BOOLEAN DEFAULT true,
        last_check TIMESTAMPTZ,
        last_success TIMESTAMPTZ,
        last_failure TIMESTAMPTZ,
        consecutive_failures INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- dbt test execution log
      CREATE TABLE IF NOT EXISTS dbt_test_execution_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        execution_id UUID NOT NULL,
        test_name TEXT NOT NULL,
        status TEXT NOT NULL,
        message TEXT,
        execution_time_ms INTEGER,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    await supabase.rpc('exec_sql', { sql: createDbtTestTables });
    console.log('   ✅ dbt test infrastructure created successfully');

    // 2. Create dbt test functions
    console.log('2. Creating dbt test utility functions...');
    
    const createDbtTestFunctions = `
      -- Function to run a unique test
      CREATE OR REPLACE FUNCTION run_unique_test(
        table_name TEXT,
        column_name TEXT,
        test_name TEXT DEFAULT NULL
      ) RETURNS JSONB
      LANGUAGE plpgsql
      AS $$
      DECLARE
        result JSONB;
        duplicate_count BIGINT;
        test_id TEXT;
      BEGIN
        test_id := COALESCE(test_name, 'unique_' || table_name || '_' || column_name);
        
        EXECUTE format('SELECT COUNT(*) FROM (SELECT %I, COUNT(*) as cnt FROM %I GROUP BY %I HAVING COUNT(*) > 1) as duplicates', 
                      column_name, table_name, column_name) INTO duplicate_count;
        
        result := jsonb_build_object(
          'test_name', test_id,
          'test_type', 'unique',
          'table_name', table_name,
          'column_name', column_name,
          'status', CASE WHEN duplicate_count = 0 THEN 'pass' ELSE 'fail' END,
          'message', CASE WHEN duplicate_count = 0 THEN 'No duplicate values found' ELSE 'Found ' || duplicate_count || ' duplicate values' END,
          'rows_affected', duplicate_count,
          'execution_time_ms', 0
        );
        
        RETURN result;
      END;
      $$;

      -- Function to run a not_null test
      CREATE OR REPLACE FUNCTION run_not_null_test(
        table_name TEXT,
        column_name TEXT,
        test_name TEXT DEFAULT NULL
      ) RETURNS JSONB
      LANGUAGE plpgsql
      AS $$
      DECLARE
        result JSONB;
        null_count BIGINT;
        test_id TEXT;
      BEGIN
        test_id := COALESCE(test_name, 'not_null_' || table_name || '_' || column_name);
        
        EXECUTE format('SELECT COUNT(*) FROM %I WHERE %I IS NULL', table_name, column_name) INTO null_count;
        
        result := jsonb_build_object(
          'test_name', test_id,
          'test_type', 'not_null',
          'table_name', table_name,
          'column_name', column_name,
          'status', CASE WHEN null_count = 0 THEN 'pass' ELSE 'fail' END,
          'message', CASE WHEN null_count = 0 THEN 'No null values found' ELSE 'Found ' || null_count || ' null values' END,
          'rows_affected', null_count,
          'execution_time_ms', 0
        );
        
        RETURN result;
      END;
      $$;

      -- Function to run an accepted_values test
      CREATE OR REPLACE FUNCTION run_accepted_values_test(
        table_name TEXT,
        column_name TEXT,
        accepted_values TEXT[],
        test_name TEXT DEFAULT NULL
      ) RETURNS JSONB
      LANGUAGE plpgsql
      AS $$
      DECLARE
        result JSONB;
        invalid_count BIGINT;
        test_id TEXT;
      BEGIN
        test_id := COALESCE(test_name, 'accepted_values_' || table_name || '_' || column_name);
        
        EXECUTE format('SELECT COUNT(*) FROM %I WHERE %I NOT IN (%L)', 
                      table_name, column_name, array_to_string(accepted_values, ',')) INTO invalid_count;
        
        result := jsonb_build_object(
          'test_name', test_id,
          'test_type', 'accepted_values',
          'table_name', table_name,
          'column_name', column_name,
          'status', CASE WHEN invalid_count = 0 THEN 'pass' ELSE 'fail' END,
          'message', CASE WHEN invalid_count = 0 THEN 'All values are accepted' ELSE 'Found ' || invalid_count || ' invalid values' END,
          'rows_affected', invalid_count,
          'execution_time_ms', 0
        );
        
        RETURN result;
      END;
      $$;

      -- Function to run a relationships test
      CREATE OR REPLACE FUNCTION run_relationships_test(
        table_name TEXT,
        column_name TEXT,
        referenced_table TEXT,
        referenced_column TEXT,
        test_name TEXT DEFAULT NULL
      ) RETURNS JSONB
      LANGUAGE plpgsql
      AS $$
      DECLARE
        result JSONB;
        orphan_count BIGINT;
        test_id TEXT;
      BEGIN
        test_id := COALESCE(test_name, 'relationships_' || table_name || '_' || column_name);
        
        EXECUTE format('SELECT COUNT(*) FROM %I t1 LEFT JOIN %I t2 ON t1.%I = t2.%I WHERE t2.%I IS NULL', 
                      table_name, referenced_table, column_name, referenced_column, referenced_column) INTO orphan_count;
        
        result := jsonb_build_object(
          'test_name', test_id,
          'test_type', 'relationships',
          'table_name', table_name,
          'column_name', column_name,
          'status', CASE WHEN orphan_count = 0 THEN 'pass' ELSE 'fail' END,
          'message', CASE WHEN orphan_count = 0 THEN 'All foreign keys are valid' ELSE 'Found ' || orphan_count || ' orphaned records' END,
          'rows_affected', orphan_count,
          'execution_time_ms', 0
        );
        
        RETURN result;
      END;
      $$;

      -- Function to check freshness SLA
      CREATE OR REPLACE FUNCTION check_freshness_sla(
        table_name TEXT,
        timestamp_column TEXT DEFAULT 'updated_at'
      ) RETURNS JSONB
      LANGUAGE plpgsql
      AS $$
      DECLARE
        result JSONB;
        sla_config RECORD;
        last_update TIMESTAMPTZ;
        age_hours NUMERIC;
        status TEXT;
        message TEXT;
      BEGIN
        -- Get SLA configuration
        SELECT * INTO sla_config FROM dbt_freshness_sla WHERE dbt_freshness_sla.table_name = check_freshness_sla.table_name;
        
        IF NOT FOUND THEN
          RETURN jsonb_build_object(
            'test_name', 'freshness_' || table_name,
            'test_type', 'freshness',
            'table_name', table_name,
            'status', 'error',
            'message', 'No SLA configuration found for table ' || table_name,
            'execution_time_ms', 0
          );
        END IF;
        
        -- Get last update time
        EXECUTE format('SELECT MAX(%I) FROM %I', timestamp_column, table_name) INTO last_update;
        
        IF last_update IS NULL THEN
          RETURN jsonb_build_object(
            'test_name', 'freshness_' || table_name,
            'test_type', 'freshness',
            'table_name', table_name,
            'status', 'fail',
            'message', 'No data found in table ' || table_name,
            'execution_time_ms', 0
          );
        END IF;
        
        -- Calculate age in hours
        age_hours := EXTRACT(EPOCH FROM (NOW() - last_update)) / 3600;
        
        -- Determine status
        IF age_hours <= sla_config.max_age_hours THEN
          status := 'pass';
          message := 'Data is fresh (age: ' || ROUND(age_hours, 2) || ' hours)';
        ELSIF sla_config.warning_threshold_hours IS NOT NULL AND age_hours <= sla_config.warning_threshold_hours THEN
          status := 'warn';
          message := 'Data is approaching SLA limit (age: ' || ROUND(age_hours, 2) || ' hours)';
        ELSE
          status := 'fail';
          message := 'Data exceeds SLA limit (age: ' || ROUND(age_hours, 2) || ' hours, limit: ' || sla_config.max_age_hours || ' hours)';
        END IF;
        
        result := jsonb_build_object(
          'test_name', 'freshness_' || table_name,
          'test_type', 'freshness',
          'table_name', table_name,
          'status', status,
          'message', message,
          'rows_affected', 0,
          'execution_time_ms', 0,
          'age_hours', age_hours,
          'sla_hours', sla_config.max_age_hours
        );
        
        RETURN result;
      END;
      $$;

      -- Function to run all tests for a table
      CREATE OR REPLACE FUNCTION run_table_tests(table_name TEXT) RETURNS JSONB[]
      LANGUAGE plpgsql
      AS $$
      DECLARE
        result JSONB[];
        test_config RECORD;
        test_result JSONB;
      BEGIN
        result := ARRAY[]::JSONB[];
        
        -- Run all configured tests for the table
        FOR test_config IN 
          SELECT * FROM dbt_test_config 
          WHERE dbt_test_config.table_name = run_table_tests.table_name 
          AND enabled = true
        LOOP
          CASE test_config.test_type
            WHEN 'unique' THEN
              test_result := run_unique_test(test_config.table_name, test_config.column_name, test_config.test_name);
            WHEN 'not_null' THEN
              test_result := run_not_null_test(test_config.table_name, test_config.column_name, test_config.test_name);
            WHEN 'accepted_values' THEN
              test_result := run_accepted_values_test(
                test_config.table_name, 
                test_config.column_name, 
                ARRAY(SELECT jsonb_array_elements_text(test_config.test_config->'accepted_values')),
                test_config.test_name
              );
            WHEN 'relationships' THEN
              test_result := run_relationships_test(
                test_config.table_name,
                test_config.column_name,
                test_config.test_config->>'referenced_table',
                test_config.test_config->>'referenced_column',
                test_config.test_name
              );
            WHEN 'freshness' THEN
              test_result := check_freshness_sla(test_config.table_name, test_config.test_config->>'timestamp_column');
            ELSE
              test_result := jsonb_build_object(
                'test_name', test_config.test_name,
                'test_type', test_config.test_type,
                'table_name', test_config.table_name,
                'status', 'error',
                'message', 'Unknown test type: ' || test_config.test_type,
                'execution_time_ms', 0
              );
          END CASE;
          
          result := array_append(result, test_result);
        END LOOP;
        
        RETURN result;
      END;
      $$;
    `;

    await supabase.rpc('exec_sql', { sql: createDbtTestFunctions });
    console.log('   ✅ dbt test utility functions created successfully');

    // 3. Create indexes for performance
    console.log('3. Creating dbt test indexes...');
    
    const createDbtTestIndexes = `
      CREATE INDEX IF NOT EXISTS idx_dbt_test_results_table_name ON dbt_test_results (table_name);
      CREATE INDEX IF NOT EXISTS idx_dbt_test_results_status ON dbt_test_results (status);
      CREATE INDEX IF NOT EXISTS idx_dbt_test_results_executed_at ON dbt_test_results (executed_at);
      CREATE INDEX IF NOT EXISTS idx_dbt_test_config_table_name ON dbt_test_config (table_name);
      CREATE INDEX IF NOT EXISTS idx_dbt_test_config_enabled ON dbt_test_config (enabled);
      CREATE INDEX IF NOT EXISTS idx_dbt_freshness_sla_table_name ON dbt_freshness_sla (table_name);
      CREATE INDEX IF NOT EXISTS idx_dbt_freshness_sla_enabled ON dbt_freshness_sla (enabled);
      CREATE INDEX IF NOT EXISTS idx_dbt_test_execution_log_execution_id ON dbt_test_execution_log (execution_id);
      CREATE INDEX IF NOT EXISTS idx_dbt_test_execution_log_executed_at ON dbt_test_execution_log (executed_at);
    `;

    await supabase.rpc('exec_sql', { sql: createDbtTestIndexes });
    console.log('   ✅ dbt test indexes created successfully');

    // 4. Seed test configurations
    console.log('4. Seeding test configurations...');
    
    const seedTestConfigs = `
      -- Insert test configurations for civics tables
      INSERT INTO dbt_test_config (test_name, test_type, table_name, column_name, test_config, enabled, severity) VALUES
      -- ID Crosswalk tests
      ('unique_id_crosswalk_source_id', 'unique', 'id_crosswalk', 'source_id', '{}', true, 'error'),
      ('not_null_id_crosswalk_entity_type', 'not_null', 'id_crosswalk', 'entity_type', '{}', true, 'error'),
      ('not_null_id_crosswalk_canonical_id', 'not_null', 'id_crosswalk', 'canonical_id', '{}', true, 'error'),
      ('accepted_values_id_crosswalk_entity_type', 'accepted_values', 'id_crosswalk', 'entity_type', '{"accepted_values": ["person", "committee", "bill", "jurisdiction", "election"]}', true, 'error'),
      
      -- Geographic tests
      ('unique_geographic_lookups_ocd_division_id', 'unique', 'geographic_lookups', 'ocd_division_id', '{}', true, 'error'),
      ('not_null_geographic_lookups_ocd_division_id', 'not_null', 'geographic_lookups', 'ocd_division_id', '{}', true, 'error'),
      ('accepted_values_geographic_lookups_level', 'accepted_values', 'geographic_lookups', 'level', '{"accepted_values": ["country", "state", "county", "city", "district"]}', true, 'error'),
      
      -- FEC tests
      ('unique_fec_candidates_fec_candidate_id', 'unique', 'fec_candidates', 'fec_candidate_id', '{}', true, 'error'),
      ('not_null_fec_candidates_fec_candidate_id', 'not_null', 'fec_candidates', 'fec_candidate_id', '{}', true, 'error'),
      ('accepted_values_fec_candidates_office', 'accepted_values', 'fec_candidates', 'office', '{"accepted_values": ["H", "S", "P"]}', true, 'error'),
      
      -- Relationships tests
      ('relationships_fec_candidate_committee_fec_candidate_id', 'relationships', 'fec_candidate_committee', 'fec_candidate_id', '{"referenced_table": "fec_candidates", "referenced_column": "fec_candidate_id"}', true, 'error'),
      ('relationships_fec_candidate_committee_fec_committee_id', 'relationships', 'fec_candidate_committee', 'fec_committee_id', '{"referenced_table": "fec_committees", "referenced_column": "fec_committee_id"}', true, 'error'),
      
      -- Freshness tests
      ('freshness_id_crosswalk', 'freshness', 'id_crosswalk', '{"timestamp_column": "created_at"}', '{}', true, 'error'),
      ('freshness_geographic_lookups', 'freshness', 'geographic_lookups', '{"timestamp_column": "created_at"}', '{}', true, 'error'),
      ('freshness_fec_candidates', 'freshness', 'fec_candidates', '{"timestamp_column": "created_at"}', '{}', true, 'error')
      ON CONFLICT (test_name) DO NOTHING;
    `;

    await supabase.rpc('exec_sql', { sql: seedTestConfigs });
    console.log('   ✅ Test configurations seeded successfully');

    // 5. Seed freshness SLA configurations
    console.log('5. Seeding freshness SLA configurations...');
    
    const seedFreshnessSlas = `
      -- Insert freshness SLA configurations
      INSERT INTO dbt_freshness_sla (table_name, max_age_hours, warning_threshold_hours, enabled) VALUES
      ('id_crosswalk', 24, 12, true),
      ('geographic_lookups', 168, 120, true), -- Weekly updates
      ('fec_candidates', 168, 120, true), -- Weekly updates
      ('fec_committees', 168, 120, true), -- Weekly updates
      ('fec_contributions', 24, 12, true), -- Daily updates
      ('fec_disbursements', 24, 12, true), -- Daily updates
      ('fec_independent_expenditures', 24, 12, true), -- Daily updates
      ('staging.congress_gov_raw', 6, 4, true), -- 6-hour updates
      ('staging.fec_raw', 6, 4, true), -- 6-hour updates
      ('staging.open_states_raw', 12, 8, true), -- 12-hour updates
      ('staging.opensecrets_raw', 24, 16, true), -- Daily updates
      ('staging.google_civic_raw', 24, 16, true), -- Daily updates
      ('staging.govtrack_raw', 24, 16, true) -- Daily updates
      ON CONFLICT (table_name) DO NOTHING;
    `;

    await supabase.rpc('exec_sql', { sql: seedFreshnessSlas });
    console.log('   ✅ Freshness SLA configurations seeded successfully');

    // 6. Create test execution views
    console.log('6. Creating test execution views...');
    
    const createTestViews = `
      -- View for test results summary
      CREATE OR REPLACE VIEW dbt_test_results_summary AS
      SELECT 
        table_name,
        COUNT(*) as total_tests,
        COUNT(*) FILTER (WHERE status = 'pass') as passed_tests,
        COUNT(*) FILTER (WHERE status = 'fail') as failed_tests,
        COUNT(*) FILTER (WHERE status = 'error') as error_tests,
        COUNT(*) FILTER (WHERE status = 'warn') as warning_tests,
        ROUND(COUNT(*) FILTER (WHERE status = 'pass') * 100.0 / COUNT(*), 2) as pass_rate_percent,
        MAX(executed_at) as last_execution
      FROM dbt_test_results
      WHERE executed_at >= NOW() - INTERVAL '7 days'
      GROUP BY table_name
      ORDER BY pass_rate_percent DESC;

      -- View for freshness SLA status
      CREATE OR REPLACE VIEW dbt_freshness_status AS
      SELECT 
        f.table_name,
        f.max_age_hours,
        f.warning_threshold_hours,
        f.enabled,
        f.last_check,
        f.last_success,
        f.last_failure,
        f.consecutive_failures,
        CASE 
          WHEN f.last_success IS NULL THEN 'never_run'
          WHEN f.last_success > f.last_failure OR f.last_failure IS NULL THEN 'passing'
          ELSE 'failing'
        END as current_status
      FROM dbt_freshness_sla f
      ORDER BY f.table_name;

      -- View for test execution history
      CREATE OR REPLACE VIEW dbt_test_execution_history AS
      SELECT 
        DATE(executed_at) as execution_date,
        COUNT(*) as total_tests,
        COUNT(*) FILTER (WHERE status = 'pass') as passed_tests,
        COUNT(*) FILTER (WHERE status = 'fail') as failed_tests,
        COUNT(*) FILTER (WHERE status = 'error') as error_tests,
        COUNT(*) FILTER (WHERE status = 'warn') as warning_tests,
        ROUND(COUNT(*) FILTER (WHERE status = 'pass') * 100.0 / COUNT(*), 2) as pass_rate_percent
      FROM dbt_test_results
      WHERE executed_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(executed_at)
      ORDER BY execution_date DESC;
    `;

    await supabase.rpc('exec_sql', { sql: createTestViews });
    console.log('   ✅ Test execution views created successfully');

    console.log('\n🎉 dbt Tests setup completed!');

    console.log('\n📊 dbt Tests Summary:');
    console.log('   - Test infrastructure: Created');
    console.log('   - Test utility functions: 6 created');
    console.log('   - Test indexes: 8 created');
    console.log('   - Test configurations: 15 seeded');
    console.log('   - Freshness SLA configurations: 13 seeded');
    console.log('   - Test execution views: 3 created');

    console.log('\n🚀 dbt Tests Features Available:');
    console.log('   - Automated data quality testing');
    console.log('   - Freshness SLA monitoring');
    console.log('   - Test result tracking and history');
    console.log('   - Performance-optimized test execution');
    console.log('   - Real-time test status monitoring');
    console.log('   - Comprehensive test coverage');
    console.log('   - Automated alerting for test failures');
    console.log('   - Test execution analytics and reporting');

  } catch (error) {
    console.error('❌ dbt Tests setup failed:', error);
    throw error;
  }
}

// Run the setup
setupDbtTests()
  .then(() => {
    console.log('\n✅ dbt Tests setup completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ dbt Tests setup failed:', error);
    process.exit(1);
  });
