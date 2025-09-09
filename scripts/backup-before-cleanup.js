#!/usr/bin/env node

/**
 * Backup Script - Before Authentication Cleanup
 * 
 * This script backs up existing data before running the clean migration.
 * Run this before executing the 000-clean-supabase-auth-schema.sql migration.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backupTable(tableName, backupFile) {
  try {
    console.log(`📦 Backing up ${tableName}...`);
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*');
    
    if (error) {
      console.warn(`⚠️  Warning: Could not backup ${tableName}: ${error.message}`);
      return;
    }
    
    if (data && data.length > 0) {
      const backupData = {
        table: tableName,
        timestamp: new Date().toISOString(),
        count: data.length,
        data: data
      };
      
      fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
      console.log(`✅ Backed up ${data.length} records from ${tableName}`);
    } else {
      console.log(`ℹ️  No data found in ${tableName}`);
    }
  } catch (err) {
    console.warn(`⚠️  Warning: Error backing up ${tableName}: ${err.message}`);
  }
}

async function main() {
  console.log('🚀 Starting data backup before authentication cleanup...\n');
  
  const backupDir = path.join(__dirname, 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPrefix = `backup-${timestamp}`;
  
  // Tables to backup (if they exist)
  const tablesToBackup = [
    'user_profiles',
    'polls', 
    'votes',
    'ia_users',
    'user_sessions',
    'biometric_credentials',
    'webauthn_credentials',
    'trust_tier_analytics',
    'error_logs'
  ];
  
  for (const table of tablesToBackup) {
    const backupFile = path.join(backupDir, `${backupPrefix}-${table}.json`);
    await backupTable(table, backupFile);
  }
  
  console.log('\n✅ Backup completed!');
  console.log(`📁 Backup files saved to: ${backupDir}`);
  console.log(`🏷️  Backup prefix: ${backupPrefix}`);
  console.log('\n⚠️  IMPORTANT: Review backup files before proceeding with migration!');
}

main().catch(console.error);
