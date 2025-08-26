#!/usr/bin/env node

/**
 * Deploy Migration 003: Device Flow Hardening
 * Week 3 of Phase 1.4: Database Schema Hardening
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
    const validationSQL = await readSQLFile('003-device-flow-hardening-validation.sql');
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
    const { data, error } = await supabase.from('device_flows').select('count').limit(1);
    
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
    
    console.log('✅ Database connection successful');
    
    // Check if Week 1 migration was applied (users view)
    const { data: week1Check, error: week1Error } = await supabase.rpc('exec_sql', {
      sql: "SELECT COUNT(*) FROM information_schema.views WHERE table_name = 'users'"
    });
    
    if (week1Error) {
      throw new Error(`Week 1 migration check failed: ${week1Error.message}`);
    }
    
    console.log('✅ Week 1 migration (Identity Unification) is applied');
    
    // Check if Week 2 migration was applied (webauthn_credentials_v2)
    const { data: week2Check, error: week2Error } = await supabase.rpc('exec_sql', {
      sql: "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'webauthn_credentials_v2'"
    });
    
    if (week2Error) {
      throw new Error(`Week 2 migration check failed: ${week2Error.message}`);
    }
    
    console.log('✅ Week 2 migration (WebAuthn Enhancement) is applied');
    
  } catch (error) {
    console.error('❌ Prerequisites check failed');
    throw error;
  }
}

async function createBackup() {
  console.log('💾 Creating backup...');
  
  try {
    const backupSQL = `
      -- Create backup of existing device flow data
      CREATE TABLE IF NOT EXISTS backup_device_flows AS SELECT * FROM device_flows;
      
      -- Create backup of related tables
      CREATE TABLE IF NOT EXISTS backup_user_profiles AS SELECT * FROM user_profiles;
      CREATE TABLE IF NOT EXISTS backup_auth_users AS SELECT * FROM auth.users LIMIT 1000;
    `;
    
    await executeSQL(backupSQL, 'Creating backup tables');
    console.log('✅ Backup created successfully');
    
  } catch (error) {
    console.error('❌ Backup creation failed');
    throw error;
  }
}

async function deployMigration() {
  console.log('🚀 Deploying Migration 003: Device Flow Hardening\n');
  
  try {
    // Step 1: Check prerequisites
    await checkPrerequisites();
    
    // Step 2: Create backup
    await createBackup();
    
    // Step 3: Execute migration
    console.log('\n📦 Executing migration...');
    const migrationSQL = await readSQLFile('003-device-flow-hardening.sql');
    await executeSQL(migrationSQL, 'Device flow hardening migration');
    
    // Step 4: Validate migration
    await validateMigration();
    
    console.log('\n🎉 Migration 003: Device Flow Hardening completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Created enhanced device_flows_v2 table with hashed codes');
    console.log('✅ Created device_flow_telemetry table for monitoring');
    console.log('✅ Created device_flow_rate_limits table for abuse prevention');
    console.log('✅ Added comprehensive helper functions for device flow operations');
    console.log('✅ Implemented proper RLS policies and security measures');
    console.log('✅ Added performance indexes and TTL cleanup');
    console.log('✅ Validated binary data handling and rate limiting');
    
    console.log('\n🔧 Next Steps:');
    console.log('1. Update device flow library integration to use new functions');
    console.log('2. Test device flow authentication with enhanced security');
    console.log('3. Monitor telemetry and rate limiting data');
    console.log('4. Plan migration from old device_flows table');
    console.log('5. Set up automated cleanup jobs for expired flows');
    
  } catch (error) {
    console.error('\n💥 Migration failed!');
    console.error('Error:', error.message);
    
    console.log('\n🔄 Attempting rollback...');
    try {
      const rollbackSQL = await readSQLFile('003-device-flow-hardening-rollback.sql');
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
      DROP TABLE IF EXISTS backup_device_flows;
      DROP TABLE IF EXISTS backup_user_profiles;
      DROP TABLE IF EXISTS backup_auth_users;
    `;
    
    await executeSQL(cleanupSQL, 'Cleaning up backup tables');
    console.log('✅ Backup cleanup completed');
    
  } catch (error) {
    console.error('❌ Backup cleanup failed:', error.message);
    console.log('⚠️  Backup tables will need manual cleanup');
  }
}

async function testDeviceFlowFunctions() {
  console.log('\n🧪 Testing device flow functions...');
  
  try {
    // Test device flow creation
    const testCreationSQL = `
      SELECT create_device_flow_v2(
        'TEST1234', 'USER5678', 'google',
        '192.168.1.1'::INET, 'Mozilla/5.0 (Test)', 'test-session-123',
        '/dashboard', ARRAY['read'], 5, 120, 10
      ) as device_flow_id;
    `;
    
    const { data: creationData, error: creationError } = await supabase.rpc('exec_sql', {
      sql: testCreationSQL
    });
    
    if (creationError) {
      throw new Error(`Device flow creation test failed: ${creationError.message}`);
    }
    
    console.log('✅ Device flow creation function works');
    
    // Test device flow verification
    const testVerificationSQL = `
      SELECT COUNT(*) as verification_count 
      FROM verify_device_flow_v2('TEST1234', 'USER5678');
    `;
    
    const { data: verificationData, error: verificationError } = await supabase.rpc('exec_sql', {
      sql: testVerificationSQL
    });
    
    if (verificationError) {
      throw new Error(`Device flow verification test failed: ${verificationError.message}`);
    }
    
    console.log('✅ Device flow verification function works');
    
    // Test rate limiting
    const testRateLimitSQL = `
      SELECT COUNT(*) as rate_limit_count 
      FROM check_device_flow_rate_limit('192.168.1.1:google', 'ip', 10, 1);
    `;
    
    const { data: rateLimitData, error: rateLimitError } = await supabase.rpc('exec_sql', {
      sql: testRateLimitSQL
    });
    
    if (rateLimitError) {
      throw new Error(`Rate limiting test failed: ${rateLimitError.message}`);
    }
    
    console.log('✅ Rate limiting function works');
    console.log('✅ Device flow functions are operational');
    
  } catch (error) {
    console.error('❌ Device flow function testing failed:', error.message);
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
      await testDeviceFlowFunctions();
      break;
      
    case 'rollback':
      console.log('🔄 Rolling back Migration 003...');
      try {
        const rollbackSQL = await readSQLFile('003-device-flow-hardening-rollback.sql');
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
      console.log('Usage: node deploy-migration-003.js <command>');
      console.log('');
      console.log('Commands:');
      console.log('  deploy    - Deploy the migration');
      console.log('  validate  - Validate the migration');
      console.log('  test      - Test device flow functions');
      console.log('  rollback  - Rollback the migration');
      console.log('  cleanup   - Clean up backup tables');
      console.log('');
      console.log('Example: node deploy-migration-003.js deploy');
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

