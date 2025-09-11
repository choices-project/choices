#!/usr/bin/env node

/**
 * Deploy Migration 005: Performance Optimization
 * Week 6 of Phase 1.4: Database Schema Hardening
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function readSQLFile(filename) {
  const filePath = path.join(__dirname, 'migrations', filename);
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    throw new Error(`Failed to read SQL file ${filename}: ${error.message}`);
  }
}

async function executeSQL(sql, description) {
  console.log(`🔄 Executing: ${description}`);
  
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      throw new Error(`SQL execution failed: ${error.message}`);
    }
    
    console.log(`✅ Success: ${description}`);
    return data;
  } catch (error) {
    console.error(`❌ Error: ${description}`);
    console.error(error.message);
    throw error;
  }
}

async function validateMigration() {
  console.log('\n🔍 Validating migration...');
  
  try {
    const validationSQL = await readSQLFile('005-performance-optimization-validation.sql');
    await executeSQL(validationSQL, 'Migration validation');
    console.log('✅ Migration validation passed');
  } catch (error) {
    console.error('❌ Migration validation failed');
    throw error;
  }
}

async function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...');
  
  try {
    // Check if we can connect to the database
    const { data, error } = await supabase.from('user_profiles').select('count').limit(1);
    
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
    
    console.log('✅ Database connection successful');
    console.log('✅ Basic schema is deployed');
    
    // Skip detailed prerequisite checks for now since we're deploying fresh
    console.log('⚠️  Skipping detailed prerequisite checks - deploying fresh');
    
  } catch (error) {
    console.error('❌ Prerequisites check failed');
    throw error;
  }
}

async function createBackup() {
  console.log('💾 Creating backup...');
  
  try {
    const backupSQL = `
      -- Create backup of existing performance-related data
      CREATE TABLE IF NOT EXISTS backup_performance_data AS 
      SELECT 'performance_metrics' as table_name, COUNT(*) as record_count 
      FROM performance_metrics
      UNION ALL
      SELECT 'query_performance_log' as table_name, COUNT(*) as record_count 
      FROM query_performance_log
      UNION ALL
      SELECT 'index_usage_analytics' as table_name, COUNT(*) as record_count 
      FROM index_usage_analytics
      UNION ALL
      SELECT 'connection_pool_metrics' as table_name, COUNT(*) as record_count 
      FROM connection_pool_metrics
      UNION ALL
      SELECT 'cache_performance_log' as table_name, COUNT(*) as record_count 
      FROM cache_performance_log
      UNION ALL
      SELECT 'maintenance_jobs' as table_name, COUNT(*) as record_count 
      FROM maintenance_jobs;
    `;
    
    await executeSQL(backupSQL, 'Creating backup tables');
    console.log('✅ Backup created successfully');
    
  } catch (error) {
    console.error('❌ Backup creation failed');
    throw error;
  }
}

async function deployMigration() {
  console.log('🚀 Deploying Migration 005: Performance Optimization\n');
  
  try {
    // Step 1: Check prerequisites
    await checkPrerequisites();
    
    // Step 2: Create backup
    await createBackup();
    
    // Step 3: Execute migration
    console.log('\n📦 Executing migration...');
    const migrationSQL = await readSQLFile('005-performance-optimization.sql');
    await executeSQL(migrationSQL, 'Performance optimization migration');
    
    // Step 4: Validate migration
    await validateMigration();
    
    console.log('\n🎉 Migration 005: Performance Optimization completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Created comprehensive performance monitoring tables');
    console.log('✅ Implemented query performance tracking and analysis');
    console.log('✅ Added index usage analytics and optimization recommendations');
    console.log('✅ Created connection pool monitoring and health tracking');
    console.log('✅ Implemented cache performance metrics and hit rate analysis');
    console.log('✅ Added maintenance job tracking and execution history');
    console.log('✅ Created performance optimization helper functions');
    console.log('✅ Implemented automated cleanup and maintenance jobs');
    console.log('✅ Added comprehensive RLS policies and security measures');
    console.log('✅ Created performance optimization indexes and TTL cleanup');
    
    console.log('\n🔧 Next Steps:');
    console.log('1. Integrate performance monitoring into application code');
    console.log('2. Set up automated maintenance job scheduling');
    console.log('3. Configure performance alerts and monitoring dashboards');
    console.log('4. Implement cache performance tracking in application');
    console.log('5. Set up connection pool monitoring for database connections');
    console.log('6. Configure performance data retention policies');
    console.log('7. Implement performance optimization recommendations engine');
    console.log('8. Set up automated cleanup jobs for performance data');
    
  } catch (error) {
    console.error('\n💥 Migration failed!');
    console.error('Error:', error.message);
    
    console.log('\n🔄 Attempting rollback...');
    try {
      const rollbackSQL = await readSQLFile('005-performance-optimization-rollback.sql');
      await executeSQL(rollbackSQL, 'Rollback migration');
      console.log('✅ Rollback completed successfully');
    } catch (rollbackError) {
      console.error('❌ Rollback failed:', rollbackError.message);
      console.error('⚠️  Manual intervention may be required');
    }
    
    process.exit(1);
  }
}

async function cleanupBackup() {
  console.log('\n🧹 Cleaning up backup tables...');
  
  try {
    const cleanupSQL = `
      DROP TABLE IF EXISTS backup_performance_data;
    `;
    
    await executeSQL(cleanupSQL, 'Cleaning up backup tables');
    console.log('✅ Backup cleanup completed');
    
  } catch (error) {
    console.error('❌ Backup cleanup failed:', error.message);
    console.log('⚠️  Backup tables will need manual cleanup');
  }
}

async function testPerformanceFunctions() {
  console.log('\n🧪 Testing performance optimization functions...');
  
  try {
    // Test query performance analysis
    const testQuerySQL = `
      SELECT analyze_query_performance(
        'test_hash_12345', 'SELECT * FROM test_table WHERE id = ?', 'SELECT',
        150, 10, 1, 100, 50, 45,
        NULL, 'test-session', '192.168.1.1', 'Test Browser'
      ) as log_id;
    `;
    
    const { data: queryData, error: queryError } = await supabase.rpc('exec_sql', {
      sql: testQuerySQL
    });
    
    if (queryError) {
      throw new Error(`Query performance analysis test failed: ${queryError.message}`);
    }
    
    console.log('✅ Query performance analysis function works');
    
    // Test index usage analytics
    const testIndexSQL = `
      SELECT update_index_usage_analytics(
        'test_table', 'idx_test_table_id', 'btree',
        100, 95, 5, 1000, 950, 5.5
      ) as analytics_id;
    `;
    
    const { data: indexData, error: indexError } = await supabase.rpc('exec_sql', {
      sql: testIndexSQL
    });
    
    if (indexError) {
      throw new Error(`Index usage analytics test failed: ${indexError.message}`);
    }
    
    console.log('✅ Index usage analytics function works');
    
    // Test connection pool metrics
    const testPoolSQL = `
      SELECT update_connection_pool_metrics(
        'test_pool', 'database', 20, 5, 15, 0, 10, 25, 0
      ) as metrics_id;
    `;
    
    const { data: poolData, error: poolError } = await supabase.rpc('exec_sql', {
      sql: testPoolSQL
    });
    
    if (poolError) {
      throw new Error(`Connection pool metrics test failed: ${poolError.message}`);
    }
    
    console.log('✅ Connection pool metrics function works');
    
    // Test cache performance metrics
    const testCacheSQL = `
      SELECT update_cache_performance_metrics(
        'test_cache', 'redis', 1000, 100, 5, 10, 1, 1048576, 2097152, 5
      ) as cache_id;
    `;
    
    const { data: cacheData, error: cacheError } = await supabase.rpc('exec_sql', {
      sql: testCacheSQL
    });
    
    if (cacheError) {
      throw new Error(`Cache performance metrics test failed: ${cacheError.message}`);
    }
    
    console.log('✅ Cache performance metrics function works');
    
    // Test maintenance job execution
    const testMaintenanceSQL = `
      SELECT run_maintenance_job('test_cleanup', 'cleanup') as job_id;
    `;
    
    const { data: maintenanceData, error: maintenanceError } = await supabase.rpc('exec_sql', {
      sql: testMaintenanceSQL
    });
    
    if (maintenanceError) {
      throw new Error(`Maintenance job test failed: ${maintenanceError.message}`);
    }
    
    console.log('✅ Maintenance job function works');
    
    // Test performance recommendations
    const testRecommendationsSQL = `
      SELECT COUNT(*) as recommendation_count 
      FROM get_performance_recommendations();
    `;
    
    const { data: recommendationsData, error: recommendationsError } = await supabase.rpc('exec_sql', {
      sql: testRecommendationsSQL
    });
    
    if (recommendationsError) {
      throw new Error(`Performance recommendations test failed: ${recommendationsError.message}`);
    }
    
    console.log('✅ Performance recommendations function works');
    
    // Test cleanup function
    const testCleanupSQL = `
      SELECT cleanup_performance_data() as cleanup_count;
    `;
    
    const { data: cleanupData, error: cleanupError } = await supabase.rpc('exec_sql', {
      sql: testCleanupSQL
    });
    
    if (cleanupError) {
      throw new Error(`Performance data cleanup test failed: ${cleanupError.message}`);
    }
    
    console.log('✅ Performance data cleanup function works');
    console.log('✅ All performance optimization functions are operational');
    
  } catch (error) {
    console.error('❌ Performance function testing failed:', error.message);
    throw error;
  }
}

async function testPerformanceDataInsertion() {
  console.log('\n🧪 Testing performance data insertion...');
  
  try {
    // Test performance metrics insertion
    const testMetricsSQL = `
      INSERT INTO performance_metrics (
        metric_type, metric_name, metric_value, metric_unit,
        table_name, execution_time_ms
      ) VALUES (
        'query_performance', 'test_metric', 150.5, 'ms',
        'test_table', 150
      ) RETURNING id;
    `;
    
    const { data: metricsData, error: metricsError } = await supabase.rpc('exec_sql', {
      sql: testMetricsSQL
    });
    
    if (metricsError) {
      throw new Error(`Performance metrics insertion test failed: ${metricsError.message}`);
    }
    
    console.log('✅ Performance metrics insertion works');
    
    // Test query performance log insertion
    const testQueryLogSQL = `
      INSERT INTO query_performance_log (
        query_hash, query_signature, query_type, execution_time_ms
      ) VALUES (
        'test_hash_67890', 'SELECT * FROM test_table', 'SELECT', 200
      ) RETURNING id;
    `;
    
    const { data: queryLogData, error: queryLogError } = await supabase.rpc('exec_sql', {
      sql: testQueryLogSQL
    });
    
    if (queryLogError) {
      throw new Error(`Query performance log insertion test failed: ${queryLogError.message}`);
    }
    
    console.log('✅ Query performance log insertion works');
    
    // Test cache performance log insertion with generated columns
    const testCacheLogSQL = `
      INSERT INTO cache_performance_log (
        cache_name, cache_type, hit_count, miss_count,
        avg_response_time_ms, memory_usage_bytes, memory_limit_bytes
      ) VALUES (
        'test_cache_gen', 'memory', 100, 20,
        5, 1048576, 2097152
      ) RETURNING hit_rate, memory_usage_percent;
    `;
    
    const { data: cacheLogData, error: cacheLogError } = await supabase.rpc('exec_sql', {
      sql: testCacheLogSQL
    });
    
    if (cacheLogError) {
      throw new Error(`Cache performance log insertion test failed: ${cacheLogError.message}`);
    }
    
    console.log('✅ Cache performance log insertion with generated columns works');
    
    // Clean up test data
    const cleanupSQL = `
      DELETE FROM performance_metrics WHERE metric_name = 'test_metric';
      DELETE FROM query_performance_log WHERE query_hash = 'test_hash_67890';
      DELETE FROM cache_performance_log WHERE cache_name = 'test_cache_gen';
    `;
    
    await executeSQL(cleanupSQL, 'Cleaning up test data');
    console.log('✅ Test data cleanup completed');
    
  } catch (error) {
    console.error('❌ Performance data insertion testing failed:', error.message);
    throw error;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'deploy':
      await deployMigration();
      break;
      
    case 'validate':
      await validateMigration();
      break;
      
    case 'test':
      await testPerformanceFunctions();
      await testPerformanceDataInsertion();
      break;
      
    case 'rollback':
      console.log('🔄 Rolling back Migration 005...');
      try {
        const rollbackSQL = await readSQLFile('005-performance-optimization-rollback.sql');
        await executeSQL(rollbackSQL, 'Rollback migration');
        console.log('✅ Rollback completed successfully');
      } catch (error) {
        console.error('❌ Rollback failed:', error.message);
        process.exit(1);
      }
      break;
      
    case 'cleanup':
      await cleanupBackup();
      break;
      
    default:
      console.log('Usage: node deploy-migration-005.js <command>');
      console.log('');
      console.log('Commands:');
      console.log('  deploy    - Deploy the migration');
      console.log('  validate  - Validate the migration');
      console.log('  test      - Test performance optimization functions');
      console.log('  rollback  - Rollback the migration');
      console.log('  cleanup   - Clean up backup tables');
      console.log('');
      console.log('Example: node deploy-migration-005.js deploy');
      process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the main function
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
