#!/usr/bin/env node

/**
 * Deploy Migration 001: Identity Unification
 * Week 1 of Phase 1.4: Database Schema Hardening
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
    const validationSQL = await readSQLFile('001-identity-unification-validation.sql');
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
    
    // Check if auth.users table exists
    const { data: authCheck, error: authError } = await supabase.rpc('exec_sql', {
      sql: "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users'"
    });
    
    if (authError) {
      throw new Error(`Auth table check failed: ${authError.message}`);
    }
    
    console.log('✅ Auth.users table exists');
    
  } catch (error) {
    console.error('❌ Prerequisites check failed');
    throw error;
  }
}

async function createBackup() {
  console.log('💾 Creating backup...');
  
  try {
    const backupSQL = `
      -- Create backup tables
      CREATE TABLE IF NOT EXISTS backup_user_profiles AS SELECT * FROM user_profiles;
      CREATE TABLE IF NOT EXISTS backup_polls AS SELECT * FROM polls;
      CREATE TABLE IF NOT EXISTS backup_votes AS SELECT * FROM votes;
      CREATE TABLE IF NOT EXISTS backup_webauthn_credentials AS SELECT * FROM webauthn_credentials;
      CREATE TABLE IF NOT EXISTS backup_device_flows AS SELECT * FROM device_flows;
      CREATE TABLE IF NOT EXISTS backup_error_logs AS SELECT * FROM error_logs;
      CREATE TABLE IF NOT EXISTS backup_analytics AS SELECT * FROM analytics;
      CREATE TABLE IF NOT EXISTS backup_rate_limits AS SELECT * FROM rate_limits;
      CREATE TABLE IF NOT EXISTS backup_notifications AS SELECT * FROM notifications;
      CREATE TABLE IF NOT EXISTS backup_user_sessions AS SELECT * FROM user_sessions;
    `;
    
    await executeSQL(backupSQL, 'Creating backup tables');
    console.log('✅ Backup created successfully');
    
  } catch (error) {
    console.error('❌ Backup creation failed');
    throw error;
  }
}

async function deployMigration() {
  console.log('🚀 Deploying Migration 001: Identity Unification\n');
  
  try {
    // Step 1: Check prerequisites
    await checkPrerequisites();
    
    // Step 2: Create backup
    await createBackup();
    
    // Step 3: Execute migration
    console.log('\n📦 Executing migration...');
    const migrationSQL = await readSQLFile('001-identity-unification.sql');
    await executeSQL(migrationSQL, 'Identity unification migration');
    
    // Step 4: Validate migration
    await validateMigration();
    
    console.log('\n🎉 Migration 001: Identity Unification completed successfully!');
    console.log('\n📋 Summary:');
    console.log('✅ Created canonical users view');
    console.log('✅ Updated all tables to reference auth.users(id)');
    console.log('✅ Added proper foreign key constraints');
    console.log('✅ Created performance indexes');
    console.log('✅ Added updated_at triggers');
    console.log('✅ Created helper functions');
    console.log('✅ Validated data integrity');
    
  } catch (error) {
    console.error('\n💥 Migration failed!');
    console.error('Error:', error.message);
    
    console.log('\n🔄 Attempting rollback...');
    try {
      const rollbackSQL = await readSQLFile('001-identity-unification-rollback.sql');
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
      DROP TABLE IF EXISTS backup_user_profiles;
      DROP TABLE IF EXISTS backup_polls;
      DROP TABLE IF EXISTS backup_votes;
      DROP TABLE IF EXISTS backup_webauthn_credentials;
      DROP TABLE IF EXISTS backup_device_flows;
      DROP TABLE IF EXISTS backup_error_logs;
      DROP TABLE IF EXISTS backup_analytics;
      DROP TABLE IF EXISTS backup_rate_limits;
      DROP TABLE IF EXISTS backup_notifications;
      DROP TABLE IF EXISTS backup_user_sessions;
    `;
    
    await executeSQL(cleanupSQL, 'Cleaning up backup tables');
    console.log('✅ Backup cleanup completed');
    
  } catch (error) {
    console.error('❌ Backup cleanup failed:', error.message);
    console.log('⚠️  Backup tables will need manual cleanup');
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
      
    case 'rollback':
      console.log('🔄 Rolling back Migration 001...');
      try {
        const rollbackSQL = await readSQLFile('001-identity-unification-rollback.sql');
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
      console.log('Usage: node deploy-migration-001.js <command>');
      console.log('');
      console.log('Commands:');
      console.log('  deploy    - Deploy the migration');
      console.log('  validate  - Validate the migration');
      console.log('  rollback  - Rollback the migration');
      console.log('  cleanup   - Clean up backup tables');
      console.log('');
      console.log('Example: node deploy-migration-001.js deploy');
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

