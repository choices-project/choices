#!/usr/bin/env node

/**
 * Schema Migration Deployment Script
 * Deploys Phase 1.4 database schema improvements in order
 * 
 * Usage: node scripts/deploy-schema-migrations.js [--dry-run] [--migration=001]
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Migration order
const MIGRATIONS = [
  {
    id: '001',
    name: 'identity-unification',
    description: 'Identity Unification - Create canonical users view and add user_id to child tables',
    file: 'scripts/migrations/001-identity-unification.sql'
  },
  {
    id: '002',
    name: 'webauthn-enhancement',
    description: 'WebAuthn Enhancement - Binary storage and metadata',
    file: 'scripts/migrations/002-webauthn-enhancement.sql'
  },
  {
    id: '003',
    name: 'dpop-token-binding',
    description: 'DPoP Token Binding - Secure token storage with DPoP binding',
    file: 'scripts/migrations/003-dpop-token-binding.sql'
  },
  {
    id: '004',
    name: 'device-flow-hardening',
    description: 'Device Flow Hardening - Hashed codes and telemetry',
    file: 'scripts/migrations/004-device-flow-hardening.sql'
  },
  {
    id: '005',
    name: 'dpop-functions',
    description: 'DPoP Database Functions - Secure token binding and WebAuthn functions',
    file: 'scripts/migrations/005-dpop-functions.sql'
  }
];

// Parse command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const specificMigration = args.find(arg => arg.startsWith('--migration='))?.split('=')[1];

console.log('🚀 Schema Migration Deployment');
console.log('==============================');
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`Dry Run: ${isDryRun ? 'Yes' : 'No'}`);
console.log(`Specific Migration: ${specificMigration || 'All'}`);
console.log('');

async function checkMigrationTable() {
  try {
    const { data, error } = await supabase
      .from('migration_log')
      .select('migration_name, applied_at, status')
      .order('applied_at', { ascending: false })
      .limit(10);

    if (error) {
      console.log('ℹ️  Migration log table not found, will be created during migration');
      return [];
    }

    return data || [];
  } catch (error) {
    console.log('ℹ️  Migration log table not found, will be created during migration');
    return [];
  }
}

async function createMigrationLogTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS migration_log (
      id SERIAL PRIMARY KEY,
      migration_name TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status TEXT NOT NULL,
      details TEXT,
      execution_time_ms INTEGER,
      error_message TEXT
    );
    
    CREATE INDEX IF NOT EXISTS idx_migration_log_name ON migration_log (migration_name);
    CREATE INDEX IF NOT EXISTS idx_migration_log_applied_at ON migration_log (applied_at);
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    if (error) {
      console.error('❌ Failed to create migration log table:', error.message);
      return false;
    }
    console.log('✅ Migration log table created');
    return true;
  } catch (error) {
    console.error('❌ Failed to create migration log table:', error.message);
    return false;
  }
}

async function readMigrationFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    const content = await fs.readFile(fullPath, 'utf8');
    return content;
  } catch (error) {
    console.error(`❌ Failed to read migration file ${filePath}:`, error.message);
    return null;
  }
}

async function executeMigration(migration) {
  console.log(`📋 Executing Migration ${migration.id}: ${migration.name}`);
  console.log(`   ${migration.description}`);
  
  const startTime = Date.now();
  
  try {
    // Read migration SQL
    const sql = await readMigrationFile(migration.file);
    if (!sql) {
      throw new Error('Failed to read migration file');
    }

    if (isDryRun) {
      console.log('   🔍 DRY RUN - Would execute:');
      console.log('   ' + sql.split('\n').slice(0, 5).join('\n   ') + '...');
      console.log('   ✅ DRY RUN completed');
      return { success: true, executionTime: Date.now() - startTime };
    }

    // Execute migration
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      throw new Error(error.message);
    }

    const executionTime = Date.now() - startTime;
    console.log(`   ✅ Migration completed in ${executionTime}ms`);
    
    return { success: true, executionTime };
    
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`   ❌ Migration failed after ${executionTime}ms:`, error.message);
    
    return { 
      success: false, 
      executionTime, 
      error: error.message 
    };
  }
}

async function logMigrationResult(migration, result) {
  if (isDryRun) return;

  try {
    const { error } = await supabase
      .from('migration_log')
      .insert({
        migration_name: migration.name,
        status: result.success ? 'completed' : 'failed',
        details: result.success 
          ? `Migration executed successfully in ${result.executionTime}ms`
          : `Migration failed: ${result.error}`,
        execution_time_ms: result.executionTime,
        error_message: result.error || null
      });

    if (error) {
      console.error('⚠️  Failed to log migration result:', error.message);
    }
  } catch (error) {
    console.error('⚠️  Failed to log migration result:', error.message);
  }
}

async function validateMigration(migration) {
  console.log(`🔍 Validating Migration ${migration.id}: ${migration.name}`);
  
  try {
    // Check if migration was applied successfully
    const { data, error } = await supabase
      .from('migration_log')
      .select('status, error_message')
      .eq('migration_name', migration.name)
      .order('applied_at', { ascending: false })
      .limit(1);

    if (error) {
      console.log(`   ⚠️  Could not validate migration: ${error.message}`);
      return false;
    }

    if (!data || data.length === 0) {
      console.log(`   ❌ Migration not found in log`);
      return false;
    }

    const latest = data[0];
    if (latest.status === 'completed') {
      console.log(`   ✅ Migration validated successfully`);
      return true;
    } else {
      console.log(`   ❌ Migration failed: ${latest.error_message}`);
      return false;
    }
    
  } catch (error) {
    console.log(`   ⚠️  Validation error: ${error.message}`);
    return false;
  }
}

async function main() {
  try {
    // Check existing migrations
    const existingMigrations = await checkMigrationTable();
    console.log(`📊 Found ${existingMigrations.length} existing migrations`);
    
    // Create migration log table if needed
    if (existingMigrations.length === 0) {
      await createMigrationLogTable();
    }

    // Determine which migrations to run
    let migrationsToRun = MIGRATIONS;
    
    if (specificMigration) {
      migrationsToRun = MIGRATIONS.filter(m => m.id === specificMigration);
      if (migrationsToRun.length === 0) {
        console.error(`❌ Migration ${specificMigration} not found`);
        process.exit(1);
      }
    } else {
      // Filter out already applied migrations
      const appliedMigrations = existingMigrations
        .filter(m => m.status === 'completed')
        .map(m => m.migration_name);
      
      migrationsToRun = MIGRATIONS.filter(m => !appliedMigrations.includes(m.name));
    }

    if (migrationsToRun.length === 0) {
      console.log('✅ All migrations are up to date');
      return;
    }

    console.log(`📋 Will execute ${migrationsToRun.length} migration(s):`);
    migrationsToRun.forEach(m => {
      console.log(`   ${m.id}: ${m.name}`);
    });
    console.log('');

    // Execute migrations
    let successCount = 0;
    let failureCount = 0;

    for (const migration of migrationsToRun) {
      const result = await executeMigration(migration);
      await logMigrationResult(migration, result);
      
      if (result.success) {
        successCount++;
        
        // Validate migration if not dry run
        if (!isDryRun) {
          await validateMigration(migration);
        }
      } else {
        failureCount++;
      }
      
      console.log('');
    }

    // Summary
    console.log('📊 Migration Summary');
    console.log('===================');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failureCount}`);
    console.log(`📋 Total: ${migrationsToRun.length}`);
    
    if (failureCount > 0) {
      console.log('\n⚠️  Some migrations failed. Please review the errors above.');
      process.exit(1);
    } else {
      console.log('\n🎉 All migrations completed successfully!');
    }

  } catch (error) {
    console.error('❌ Migration deployment failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  MIGRATIONS,
  executeMigration,
  validateMigration
};
