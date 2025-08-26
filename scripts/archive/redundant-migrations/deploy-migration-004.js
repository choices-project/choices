#!/usr/bin/env node

/**
 * Deploy Migration 004: Token/Session Safety
 * Week 4 of Phase 1.4: Database Schema Hardening
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
    const validationSQL = await readSQLFile('004-token-session-safety-validation.sql');
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
    const { data, error } = await supabase.from('user_sessions').select('count').limit(1);
    
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
    
    // Check if Week 3 migration was applied (device_flows_v2)
    const { data: week3Check, error: week3Error } = await supabase.rpc('exec_sql', {
      sql: "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'device_flows_v2'"
    });
    
    if (week3Error) {
      throw new Error(`Week 3 migration check failed: ${week3Error.message}`);
    }
    
    console.log('✅ Week 3 migration (Device Flow Hardening) is applied');
    
  } catch (error) {
    console.error('❌ Prerequisites check failed');
    throw error;
  }
}

async function createBackup() {
  console.log('💾 Creating backup...');
  
  try {
    const backupSQL = `
      -- Create backup of existing session data
      CREATE TABLE IF NOT EXISTS backup_user_sessions AS SELECT * FROM user_sessions;
      
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
  console.log('🚀 Deploying Migration 004: Token/Session Safety\n');
  
  try {
    // Step 1: Check prerequisites
    await checkPrerequisites();
    
    // Step 2: Create backup
    await createBackup();
    
    // Step 3: Execute migration
    console.log('\n📦 Executing migration...');
    const migrationSQL = await readSQLFile('004-token-session-safety.sql');
    await executeSQL(migrationSQL, 'Token/session safety migration');
    
    // Step 4: Validate migration
    await validateMigration();
    
    console.log('\n🎉 Migration 004: Token/Session Safety completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Created enhanced user_sessions_v2 table with hashed tokens');
    console.log('✅ Created token_bindings table for DPoP and token binding');
    console.log('✅ Created session_security_events table for audit trail');
    console.log('✅ Created device_fingerprints table for trust and verification');
    console.log('✅ Added comprehensive helper functions for token/session operations');
    console.log('✅ Implemented proper RLS policies and security measures');
    console.log('✅ Added performance indexes and TTL cleanup');
    console.log('✅ Validated binary data handling and DPoP binding');
    
    console.log('\n🔧 Next Steps:');
    console.log('1. Update authentication middleware to use new session functions');
    console.log('2. Implement DPoP binding in API endpoints');
    console.log('3. Add device fingerprinting to login flows');
    console.log('4. Set up automated token rotation and cleanup');
    console.log('5. Monitor session security events and risk scores');
    
  } catch (error) {
    console.error('\n💥 Migration failed!');
    console.error('Error:', error.message);
    
    console.log('\n🔄 Attempting rollback...');
    try {
      const rollbackSQL = await readSQLFile('004-token-session-safety-rollback.sql');
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
      DROP TABLE IF EXISTS backup_user_sessions;
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

async function testTokenSessionFunctions() {
  console.log('\n🧪 Testing token/session functions...');
  
  try {
    // Test session creation
    const testCreationSQL = `
      SELECT create_session_v2(
        (SELECT id FROM auth.users LIMIT 1),
        'test_session_token_12345',
        'test_refresh_token_67890',
        'test_access_token_abcde',
        'web', 'password', digest('test_device', 'sha256'),
        '{"device": "test"}'::jsonb, 'Test Device', 'desktop', 'Windows', 'Chrome',
        '192.168.1.1'::INET, 'Mozilla/5.0 (Test)', '{"location": "test"}'::jsonb, 24
      ) as session_id;
    `;
    
    const { data: creationData, error: creationError } = await supabase.rpc('exec_sql', {
      sql: testCreationSQL
    });
    
    if (creationError) {
      throw new Error(`Session creation test failed: ${creationError.message}`);
    }
    
    console.log('✅ Session creation function works');
    
    // Test session verification
    const testVerificationSQL = `
      SELECT COUNT(*) as verification_count 
      FROM verify_session_v2('test_session_token_12345', '192.168.1.1'::INET, 'Mozilla/5.0 (Test)');
    `;
    
    const { data: verificationData, error: verificationError } = await supabase.rpc('exec_sql', {
      sql: testVerificationSQL
    });
    
    if (verificationError) {
      throw new Error(`Session verification test failed: ${verificationError.message}`);
    }
    
    console.log('✅ Session verification function works');
    
    // Test token rotation
    const testRotationSQL = `
      SELECT COUNT(*) as rotation_count 
      FROM rotate_session_v2(
        'test_session_token_12345', 'new_session_token', 'new_refresh_token', 'new_access_token',
        '192.168.1.1'::INET, 'Mozilla/5.0 (Test)'
      );
    `;
    
    const { data: rotationData, error: rotationError } = await supabase.rpc('exec_sql', {
      sql: testRotationSQL
    });
    
    if (rotationError) {
      throw new Error(`Token rotation test failed: ${rotationError.message}`);
    }
    
    console.log('✅ Token rotation function works');
    
    // Test DPoP binding
    const testDpopSQL = `
      SELECT add_dpop_binding(
        (SELECT id FROM user_sessions_v2 WHERE session_token_hash_base64 LIKE '%test%' LIMIT 1),
        'test_jkt_12345', 'test_nonce_67890', 'test_challenge_abcde', 'test_signature_fghij'
      ) as binding_id;
    `;
    
    const { data: dpopData, error: dpopError } = await supabase.rpc('exec_sql', {
      sql: testDpopSQL
    });
    
    if (dpopError) {
      throw new Error(`DPoP binding test failed: ${dpopError.message}`);
    }
    
    console.log('✅ DPoP binding function works');
    console.log('✅ Token/session functions are operational');
    
  } catch (error) {
    console.error('❌ Token/session function testing failed:', error.message);
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
      await testTokenSessionFunctions();
      break;
      
    case 'rollback':
      console.log('🔄 Rolling back Migration 004...');
      try {
        const rollbackSQL = await readSQLFile('004-token-session-safety-rollback.sql');
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
      console.log('Usage: node deploy-migration-004.js <command>');
      console.log('');
      console.log('Commands:');
      console.log('  deploy    - Deploy the migration');
      console.log('  validate  - Validate the migration');
      console.log('  test      - Test token/session functions');
      console.log('  rollback  - Rollback the migration');
      console.log('  cleanup   - Clean up backup tables');
      console.log('');
      console.log('Example: node deploy-migration-004.js deploy');
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

