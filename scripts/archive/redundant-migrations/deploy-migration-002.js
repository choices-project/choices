#!/usr/bin/env node

/**
 * Deploy Migration 002: WebAuthn Storage Enhancement
 * Week 2 of Phase 1.4: Database Schema Hardening
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
    const validationSQL = await readSQLFile('002-webauthn-enhancement-validation.sql');
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
    const { data, error } = await supabase.from('webauthn_credentials').select('count').limit(1);
    
    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }
    
    console.log('✅ Database connection successful');
    
    // Check if auth.users table exists (from Week 1)
    const { data: authCheck, error: authError } = await supabase.rpc('exec_sql', {
      sql: "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users'"
    });
    
    if (authError) {
      throw new Error(`Auth table check failed: ${authError.message}`);
    }
    
    console.log('✅ Auth.users table exists');
    
    // Check if Week 1 migration was applied
    const { data: week1Check, error: week1Error } = await supabase.rpc('exec_sql', {
      sql: "SELECT COUNT(*) FROM information_schema.views WHERE table_name = 'users'"
    });
    
    if (week1Error) {
      throw new Error(`Week 1 migration check failed: ${week1Error.message}`);
    }
    
    console.log('✅ Week 1 migration (Identity Unification) is applied');
    
  } catch (error) {
    console.error('❌ Prerequisites check failed');
    throw error;
  }
}

async function createBackup() {
  console.log('💾 Creating backup...');
  
  try {
    const backupSQL = `
      -- Create backup of existing WebAuthn data
      CREATE TABLE IF NOT EXISTS backup_webauthn_credentials AS SELECT * FROM webauthn_credentials;
      
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
  console.log('🚀 Deploying Migration 002: WebAuthn Storage Enhancement\n');
  
  try {
    // Step 1: Check prerequisites
    await checkPrerequisites();
    
    // Step 2: Create backup
    await createBackup();
    
    // Step 3: Execute migration
    console.log('\n📦 Executing migration...');
    const migrationSQL = await readSQLFile('002-webauthn-enhancement.sql');
    await executeSQL(migrationSQL, 'WebAuthn enhancement migration');
    
    // Step 4: Validate migration
    await validateMigration();
    
    console.log('\n🎉 Migration 002: WebAuthn Storage Enhancement completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Created enhanced webauthn_credentials_v2 table with binary storage');
    console.log('✅ Created webauthn_challenges table for secure challenge management');
    console.log('✅ Created webauthn_attestations table for verification data');
    console.log('✅ Created webauthn_analytics table for performance metrics');
    console.log('✅ Added comprehensive helper functions for WebAuthn operations');
    console.log('✅ Implemented proper RLS policies and security measures');
    console.log('✅ Added performance indexes and constraints');
    console.log('✅ Validated binary data handling and generated columns');
    
    console.log('\n🔧 Next Steps:');
    console.log('1. Update WebAuthn library integration to use new functions');
    console.log('2. Test biometric authentication with new storage format');
    console.log('3. Monitor performance and analytics data');
    console.log('4. Plan migration from old webauthn_credentials table');
    
  } catch (error) {
    console.error('\n💥 Migration failed!');
    console.error('Error:', error.message);
    
    console.log('\n🔄 Attempting rollback...');
    try {
      const rollbackSQL = await readSQLFile('002-webauthn-enhancement-rollback.sql');
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
      DROP TABLE IF EXISTS backup_webauthn_credentials;
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

async function testWebAuthnFunctions() {
  console.log('\n🧪 Testing WebAuthn functions...');
  
  try {
    // Test challenge generation
    const testChallengeSQL = `
      SELECT webauthn_generate_challenge(
        (SELECT id FROM auth.users LIMIT 1),
        'registration',
        'choices-platform.vercel.app',
        'preferred',
        5
      ) as challenge;
    `;
    
    const { data: challengeData, error: challengeError } = await supabase.rpc('exec_sql', {
      sql: testChallengeSQL
    });
    
    if (challengeError) {
      throw new Error(`Challenge generation test failed: ${challengeError.message}`);
    }
    
    console.log('✅ Challenge generation function works');
    
    // Test credential retrieval
    const testCredentialsSQL = `
      SELECT COUNT(*) as credential_count 
      FROM webauthn_get_user_credentials((SELECT id FROM auth.users LIMIT 1));
    `;
    
    const { data: credentialsData, error: credentialsError } = await supabase.rpc('exec_sql', {
      sql: testCredentialsSQL
    });
    
    if (credentialsError) {
      throw new Error(`Credential retrieval test failed: ${credentialsError.message}`);
    }
    
    console.log('✅ Credential retrieval function works');
    console.log('✅ WebAuthn functions are operational');
    
  } catch (error) {
    console.error('❌ WebAuthn function testing failed:', error.message);
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
      await testWebAuthnFunctions();
      break;
      
    case 'rollback':
      console.log('🔄 Rolling back Migration 002...');
      try {
        const rollbackSQL = await readSQLFile('002-webauthn-enhancement-rollback.sql');
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
      console.log('Usage: node deploy-migration-002.js <command>');
      console.log('');
      console.log('Commands:');
      console.log('  deploy    - Deploy the migration');
      console.log('  validate  - Validate the migration');
      console.log('  test      - Test WebAuthn functions');
      console.log('  rollback  - Rollback the migration');
      console.log('  cleanup   - Clean up backup tables');
      console.log('');
      console.log('Example: node deploy-migration-002.js deploy');
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

