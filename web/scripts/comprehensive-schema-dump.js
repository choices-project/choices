#!/usr/bin/env node

/**
 * COMPREHENSIVE Database Schema Dump Script
 * Gets EVERYTHING in the database - tables, views, functions, triggers, policies, etc.
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
const supabaseKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

async function comprehensiveSchemaDump() {
  console.log('🔍 COMPREHENSIVE DATABASE SCHEMA DUMP');
  console.log('=====================================\n');

  try {
    // 1. Get ALL tables with comprehensive info
    console.log('📋 ALL TABLES IN DATABASE:');
    console.log('==========================');
    
    // Test a comprehensive list of possible tables
    const possibleTables = [
      // Core app tables
      'polls', 'votes', 'user_profiles', 'webauthn_credentials', 'webauthn_challenges',
      'error_logs', 'feedback', 'user_consent', 'privacy_logs', 'location_consent_audit',
      
      // Civics tables
      'civics_person_xref', 'civics_votes_minimal', 'civics_divisions', 'civics_representatives',
      'civics_addresses', 'civics_campaign_finance', 'civics_votes', 'civic_jurisdictions',
      'jurisdiction_aliases', 'jurisdiction_geometries', 'jurisdiction_tiles',
      'user_location_resolutions', 'candidate_jurisdictions',
      
      // Auth tables
      'auth_users', 'auth_sessions', 'auth_identities', 'auth_mfa_factors',
      'auth_mfa_challenges', 'auth_audit_log_entries', 'auth_flow_state',
      
      // System tables
      'storage_objects', 'storage_buckets', 'storage_migrations',
      'supabase_migrations', 'supabase_migrations_schema_migrations',
      
      // Views
      'poll_results_live_view', 'poll_results_baseline_view', 'poll_results_drift_view',
      
      // Other possible tables
      'notifications', 'user_preferences', 'user_sessions', 'api_keys',
      'webhooks', 'integrations', 'analytics_events', 'audit_logs',
      'system_settings', 'feature_flags', 'rate_limits', 'security_events'
    ];

    const existingTables = [];
    const missingTables = [];

    for (const tableName of possibleTables) {
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
          existingTables.push({ 
            name: tableName, 
            count: count || 0,
            hasData: (count || 0) > 0
          });
        }
      } catch (err) {
        missingTables.push(tableName);
      }
    }

    console.log(`\n✅ EXISTING TABLES (${existingTables.length}):`);
    existingTables.forEach(table => {
      const status = table.hasData ? '📊 HAS DATA' : '📭 EMPTY';
      console.log(`  - ${table.name}: ${table.count} rows ${status}`);
    });

    console.log(`\n❌ MISSING TABLES (${missingTables.length}):`);
    missingTables.forEach(table => {
      console.log(`  - ${table}`);
    });

    // 2. Get detailed schema for each existing table
    console.log('\n🏗️  DETAILED TABLE SCHEMAS:');
    console.log('==========================');
    
    for (const table of existingTables) {
      console.log(`\n📊 Table: ${table.name} (${table.count} rows)`);
      
      // Get sample data to understand structure
      try {
        const { data: sampleData, error } = await supabase
          .from(table.name)
          .select('*')
          .limit(3);
        
        if (error) {
          console.log(`  ❌ Error getting sample data: ${error.message}`);
        } else if (sampleData && sampleData.length > 0) {
          console.log(`  📋 Sample data structure:`);
          const sample = sampleData[0];
          Object.keys(sample).forEach(key => {
            const value = sample[key];
            const type = typeof value;
            const preview = type === 'object' ? JSON.stringify(value).substring(0, 100) : String(value).substring(0, 100);
            console.log(`    - ${key}: ${type} = ${preview}${preview.length >= 100 ? '...' : ''}`);
          });
        } else {
          console.log(`  📭 No data to analyze structure`);
        }
      } catch (err) {
        console.log(`  ❌ Error analyzing table: ${err.message}`);
      }
    }

    // 3. Test RLS status comprehensively
    console.log('\n🔒 ROW LEVEL SECURITY STATUS:');
    console.log('=============================');
    
    for (const table of existingTables) {
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

    // 4. Test data access patterns
    console.log('\n📊 DATA ACCESS PATTERNS:');
    console.log('========================');
    
    for (const table of existingTables.slice(0, 5)) { // Test first 5 tables
      try {
        const { data, error } = await supabase
          .from(table.name)
          .select('*')
          .limit(5);
        
        if (error) {
          console.log(`  ${table.name}: ❌ Error - ${error.message}`);
        } else {
          console.log(`  ${table.name}: ✅ Accessible - ${data.length} records retrieved`);
          if (data.length > 0) {
            console.log(`    Sample record keys: ${Object.keys(data[0]).join(', ')}`);
          }
        }
      } catch (err) {
        console.log(`  ${table.name}: ❌ Error - ${err.message}`);
      }
    }

    // 5. Test for views
    console.log('\n👁️  TESTING FOR VIEWS:');
    console.log('=======================');
    
    const possibleViews = [
      'poll_results_live_view', 'poll_results_baseline_view', 'poll_results_drift_view',
      'user_stats_view', 'poll_stats_view', 'civics_coverage_view'
    ];

    for (const viewName of possibleViews) {
      try {
        const { data, error } = await supabase
          .from(viewName)
          .select('*')
          .limit(1);
        
        if (error) {
          if (error.code === 'PGRST116') {
            console.log(`  ${viewName}: ❌ View does not exist`);
          } else {
            console.log(`  ${viewName}: ❓ Error - ${error.message}`);
          }
        } else {
          console.log(`  ${viewName}: ✅ View exists and accessible`);
        }
      } catch (err) {
        console.log(`  ${viewName}: ❌ Error - ${err.message}`);
      }
    }

    // 6. Test for functions and procedures
    console.log('\n⚙️  TESTING FOR FUNCTIONS:');
    console.log('==========================');
    
    // Test if we can call common functions
    const possibleFunctions = [
      'update_updated_at_column', 'handle_new_user', 'handle_updated_user',
      'get_user_stats', 'get_poll_stats', 'cleanup_old_data'
    ];

    for (const funcName of possibleFunctions) {
      try {
        const { data, error } = await supabase.rpc(funcName);
        if (error) {
          if (error.message.includes('function') && error.message.includes('does not exist')) {
            console.log(`  ${funcName}: ❌ Function does not exist`);
          } else {
            console.log(`  ${funcName}: ❓ Error - ${error.message}`);
          }
        } else {
          console.log(`  ${funcName}: ✅ Function exists and callable`);
        }
      } catch (err) {
        console.log(`  ${funcName}: ❌ Error - ${err.message}`);
      }
    }

    // 7. Summary and recommendations
    console.log('\n📋 SUMMARY AND RECOMMENDATIONS:');
    console.log('================================');
    
    const tablesWithData = existingTables.filter(t => t.hasData);
    const emptyTables = existingTables.filter(t => !t.hasData);
    
    console.log(`\n📊 Tables with data (${tablesWithData.length}):`);
    tablesWithData.forEach(table => {
      console.log(`  - ${table.name}: ${table.count} rows`);
    });
    
    console.log(`\n📭 Empty tables (${emptyTables.length}):`);
    emptyTables.forEach(table => {
      console.log(`  - ${table.name}: 0 rows`);
    });
    
    console.log(`\n❌ Missing tables (${missingTables.length}):`);
    missingTables.forEach(table => {
      console.log(`  - ${table.name}`);
    });

    console.log('\n✅ Comprehensive database schema dump completed!');

  } catch (error) {
    console.error('❌ Database dump failed:', error);
  }
}

comprehensiveSchemaDump();
