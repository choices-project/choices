#!/usr/bin/env node

/**
 * Database Inspector Script
 * Queries Supabase directly to get current schema state
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('SUPABASE_SECRET_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function inspectDatabase() {
  console.log('🔍 Inspecting Supabase Database...\n');

  try {
    // 1. Test known tables
    console.log('📋 TESTING KNOWN TABLES:');
    
    const knownTables = [
      'polls', 'votes', 'user_profiles', 'webauthn_credentials', 'error_logs', 'feedback',
      'civics_divisions', 'civics_representatives', 'civics_addresses', 'civics_campaign_finance', 'civics_votes',
      'civic_jurisdictions', 'jurisdiction_aliases', 'jurisdiction_geometries', 'jurisdiction_tiles',
      'user_location_resolutions', 'location_consent_audit', 'candidate_jurisdictions'
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

    // 2. Check for civics tables specifically
    console.log('\n🏛️  CIVICS TABLES:');
    const civicsTables = existingTables.filter(t => t.name.startsWith('civics_'));
    if (civicsTables.length === 0) {
      console.log('  ❌ No civics tables found');
    } else {
      civicsTables.forEach(table => {
        console.log(`  - ${table.name}: ${table.count} rows`);
      });
    }

    // 3. Check for browser location tables
    console.log('\n📍 BROWSER LOCATION TABLES:');
    const locationTables = existingTables.filter(t => 
      t.name.includes('jurisdiction') || 
      t.name.includes('location') ||
      t.name.includes('civic_')
    );
    if (locationTables.length === 0) {
      console.log('  ❌ No browser location tables found');
    } else {
      locationTables.forEach(table => {
        console.log(`  - ${table.name}: ${table.count} rows`);
      });
    }

    // 4. Test RLS by trying to access tables without auth
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

  } catch (error) {
    console.error('❌ Database inspection failed:', error);
  }
}

// Run the inspection
inspectDatabase().catch(console.error);
