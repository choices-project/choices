#!/usr/bin/env node

/**
 * Complete Database Schema Inspection
 * Gets the full schema including all tables, columns, constraints, indexes, and RLS status
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function getCompleteSchema() {
  console.log('🔍 Complete Database Schema Inspection...\n');

  try {
    // 1. Get all tables in public schema
    console.log('📋 ALL TABLES IN PUBLIC SCHEMA:');
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_all_tables');

    if (tablesError) {
      console.log('⚠️  get_all_tables function not available, trying alternative approach...');
      
      // Alternative: Try to get tables by querying information_schema directly
      const { data: altTables, error: altError } = await supabase
        .from('information_schema.tables')
        .select('table_name, table_type')
        .eq('table_schema', 'public')
        .order('table_name');

      if (altError) {
        console.log('❌ Cannot access information_schema via PostgREST');
        console.log('💡 You can run this SQL directly in Supabase SQL Editor:');
        console.log(`
-- Get all tables
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Get all columns
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;

-- Get RLS status
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Get all indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Get all constraints
SELECT 
  tc.table_name,
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;
        `);
        return;
      }

      console.log(`Found ${altTables.length} tables:`);
      altTables.forEach(table => {
        console.log(`  - ${table.table_name} (${table.table_type})`);
      });
    } else {
      console.log(`Found ${tables.length} tables:`);
      tables.forEach(table => {
        console.log(`  - ${table.table_name}`);
      });
    }

    // 2. Test RLS on all tables we can access
    console.log('\n🔒 RLS STATUS CHECK:');
    const testTables = [
      'polls', 'votes', 'user_profiles', 'webauthn_credentials', 'error_logs', 'feedback',
      'civics_divisions', 'civics_representatives', 'civics_addresses', 'civics_campaign_finance', 'civics_votes',
      'civic_jurisdictions', 'jurisdiction_aliases', 'jurisdiction_geometries', 'jurisdiction_tiles',
      'user_location_resolutions', 'location_consent_audit', 'candidate_jurisdictions'
    ];

    for (const tableName of testTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          if (error.code === 'PGRST301') {
            console.log(`  ${tableName}: ✅ RLS ENABLED (access denied)`);
          } else {
            console.log(`  ${tableName}: ❓ Unknown - ${error.message}`);
          }
        } else {
          console.log(`  ${tableName}: ❌ RLS DISABLED (data accessible)`);
        }
      } catch (err) {
        console.log(`  ${tableName}: ❓ Error - ${err.message}`);
      }
    }

    // 3. Check for additional tables by trying common patterns
    console.log('\n🔍 CHECKING FOR ADDITIONAL TABLES:');
    const additionalTables = [
      'auth.users', 'auth.sessions', 'auth.identities',
      'storage.objects', 'storage.buckets',
      'realtime.subscription', 'realtime.schema_migrations'
    ];

    for (const tableName of additionalTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          if (error.code === 'PGRST116') {
            // Table doesn't exist
          } else {
            console.log(`  ${tableName}: ${error.message}`);
          }
        } else {
          console.log(`  ${tableName}: ✅ EXISTS`);
        }
      } catch (err) {
        // Table doesn't exist or not accessible
      }
    }

  } catch (error) {
    console.error('❌ Schema inspection failed:', error);
  }
}

// Run the inspection
getCompleteSchema().catch(console.error);
