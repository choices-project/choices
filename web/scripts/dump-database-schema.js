#!/usr/bin/env node

/**
 * Database Schema Dump Script
 * Dumps the current production database schema using Supabase connection
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load .env.local manually
try {
  const envPath = join(process.cwd(), '.env.local');
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (err) {
  console.log('No .env.local file found, using environment variables');
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY; // Use service role key for full access

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function dumpDatabaseSchema() {
  console.log('🔍 Dumping Database Schema...\n');

  try {
    // 1. Test known tables from our schema
    console.log('📋 TESTING KNOWN TABLES:');
    
    const knownTables = [
      'polls', 'votes', 'user_profiles', 'webauthn_credentials', 'webauthn_challenges',
      'error_logs', 'feedback', 'civics_person_xref', 'civics_votes_minimal',
      'location_consent_audit', 'user_consent', 'privacy_logs'
    ];

    const existingTables = [];
    const missingTables = [];

    for (const tableName of knownTables) {
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          if (error.code === 'PGRST116') {
            missingTables.push(tableName);
          } else {
            console.log(`  ${tableName}: ❌ Error - ${error.message}`);
          }
        } else {
          existingTables.push({ name: tableName, count: count || 0 });
        }
      } catch (err) {
        missingTables.push(tableName);
      }
    }

    console.log(`\n✅ EXISTING TABLES (${existingTables.length}):`);
    existingTables.forEach(table => {
      console.log(`  - ${table.name}: ${table.count} rows`);
    });

    console.log(`\n❌ MISSING TABLES (${missingTables.length}):`);
    missingTables.forEach(table => {
      console.log(`  - ${table}`);
    });

    // 2. Test RLS by trying to access tables without auth
    console.log('\n🔒 TESTING RLS (Row Level Security):');
    console.log('Testing if tables are accessible without authentication...');
    
    for (const table of existingTables.slice(0, 5)) { // Test first 5 tables
      try {
        const { data, error } = await supabase
          .from(table.name)
          .select('*')
          .limit(1);
        
        if (error) {
          if (error.code === 'PGRST301') {
            console.log(`  ${table.name}: ✅ RLS ENABLED (access denied)`);
          } else {
            console.log(`  ${table.name}: ❓ RLS Status Unknown - ${error.message}`);
          }
        } else {
          console.log(`  ${table.name}: ❌ RLS DISABLED (data accessible)`);
        }
      } catch (err) {
        console.log(`  ${table.name}: ❓ RLS Status Unknown - ${err.message}`);
      }
    }

    // 3. Test sample data from existing tables
    console.log('\n📊 SAMPLE DATA FROM EXISTING TABLES:');
    for (const table of existingTables.slice(0, 3)) { // Sample first 3 tables
      try {
        const { data, error } = await supabase
          .from(table.name)
          .select('*')
          .limit(2);
        
        if (error) {
          console.log(`  ${table.name}: ❌ Error - ${error.message}`);
        } else {
          console.log(`  ${table.name}: ${data.length} sample records`);
          if (data.length > 0) {
            console.log(`    Sample: ${JSON.stringify(data[0], null, 2).substring(0, 200)}...`);
          }
        }
      } catch (err) {
        console.log(`  ${table.name}: ❌ Error - ${err.message}`);
      }
    }

    console.log('\n✅ Database schema dump completed!');

  } catch (error) {
    console.error('❌ Database dump failed:', error);
  }
}

dumpDatabaseSchema();
