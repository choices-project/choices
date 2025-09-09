#!/usr/bin/env node

/**
 * Execute Clean Migration Script
 * 
 * This script executes the clean migration using direct SQL execution.
 * Since we're getting "Legacy API keys are disabled" errors, we'll try
 * a different approach using the Supabase client.
 */

// Load environment variables
require('dotenv').config({ path: 'web/.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');

// Configuration - Using new Supabase API key format
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SECRET_KEY');
  console.error('');
  console.error('💡 Make sure you have the new Supabase API keys:');
  console.error('   - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (for client)');
  console.error('   - SUPABASE_SECRET_KEY (for server/admin operations)');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY);

async function executeSQL(sql) {
  try {
    // Try using the REST API directly
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SECRET_KEY}`,
        'apikey': SUPABASE_SECRET_KEY
      },
      body: JSON.stringify({ sql })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

async function runMigration() {
  try {
    console.log('🚀 Starting clean Supabase Auth migration...\n');
    
    // Read the migration file
    const migrationFile = path.join(__dirname, 'migrations', '000-clean-supabase-auth-schema.sql');
    const migrationSQL = await fs.readFile(migrationFile, 'utf8');
    
    console.log('📄 Migration file loaded successfully');
    console.log(`📏 Migration size: ${migrationSQL.length} characters\n`);
    
    // For now, let's just test the connection
    console.log('🔍 Testing Supabase connection...');
    
    try {
      const { data, error } = await supabase.from('auth.users').select('count').limit(1);
      if (error) {
        console.log('⚠️  Connection test failed:', error.message);
        console.log('   This is expected if auth.users table is not accessible via client');
      } else {
        console.log('✅ Connection test successful');
      }
    } catch (err) {
      console.log('⚠️  Connection test error:', err.message);
    }
    
    console.log('\n📋 Migration SQL Preview (first 500 characters):');
    console.log('─'.repeat(50));
    console.log(migrationSQL.substring(0, 500) + '...');
    console.log('─'.repeat(50));
    
    console.log('\n⚠️  MANUAL MIGRATION REQUIRED');
    console.log('Due to API key restrictions, this migration needs to be run manually.');
    console.log('');
    console.log('Options:');
    console.log('1. Run the SQL directly in Supabase Dashboard SQL Editor');
    console.log('2. Use Supabase CLI with proper authentication');
    console.log('3. Contact Supabase support to enable API key access');
    console.log('');
    console.log('📁 Migration file location:', migrationFile);
    
  } catch (err) {
    console.error('❌ Error preparing migration:', err);
    process.exit(1);
  }
}

// Check if we should run the migration
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node scripts/execute-clean-migration.js');
  console.log('');
  console.log('This script prepares the clean migration for manual execution.');
  console.log('');
  console.log('⚠️  WARNING: This migration will DROP all custom authentication tables!');
  console.log('   Make sure you have backed up any important data.');
  process.exit(0);
}

runMigration();
