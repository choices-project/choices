#!/usr/bin/env node

/**
 * 🔍 INVESTIGATE POSTGREST PERMISSIONS
 * 
 * The issue is likely PostgREST API permissions, not database permissions.
 * Direct SQL works but Supabase client (which uses PostgREST) fails.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function investigatePostgREST() {
  console.log('🔍 Investigating PostgREST Permissions...\n');

  try {
    // 1. TEST POSTGREST API DIRECTLY
    console.log('🔧 Testing PostgREST API Directly...');
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/polls?select=id&limit=1`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('PostgREST Response Status:', response.status);
      console.log('PostgREST Response Headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const data = await response.json();
        console.log('PostgREST Data:', data);
      } else {
        const errorText = await response.text();
        console.log('PostgREST Error:', errorText);
      }
    } catch (error) {
      console.log('PostgREST Error:', error.message);
    }

    // 2. CHECK POSTGREST SCHEMA CACHE
    console.log('\n🔧 Checking PostgREST Schema Cache...');
    try {
      const schemaResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Schema Response Status:', schemaResponse.status);
      if (schemaResponse.ok) {
        const schemaData = await schemaResponse.text();
        console.log('Schema Data (first 500 chars):', schemaData.substring(0, 500));
      }
    } catch (error) {
      console.log('Schema Check Error:', error.message);
    }

    // 3. TEST WITH DIFFERENT ENDPOINTS
    console.log('\n🔧 Testing Different PostgREST Endpoints...');
    
    const endpoints = [
      '/rest/v1/polls',
      '/rest/v1/votes', 
      '/rest/v1/poll_options',
      '/rest/v1/user_profiles'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${supabaseUrl}${endpoint}?select=id&limit=1`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey,
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`${endpoint}:`, response.status, response.statusText);
        if (!response.ok) {
          const errorText = await response.text();
          console.log(`  Error: ${errorText.substring(0, 100)}...`);
        }
      } catch (error) {
        console.log(`${endpoint}: Error - ${error.message}`);
      }
    }

    // 4. CHECK POSTGREST CONFIGURATION
    console.log('\n🔧 Checking PostgREST Configuration...');
    try {
      const configResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'OPTIONS',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        }
      });
      
      console.log('Config Response Status:', configResponse.status);
      console.log('Config Headers:', Object.fromEntries(configResponse.headers.entries()));
    } catch (error) {
      console.log('Config Check Error:', error.message);
    }

    // 5. TEST WITH RPC FUNCTIONS (These work!)
    console.log('\n🔧 Testing RPC Functions (These should work)...');
    try {
      const rpcTest = await supabase.rpc('exec_sql', {
        sql: 'SELECT current_user, current_database();'
      });
      console.log('RPC Test:', rpcTest.error ? `❌ ${rpcTest.error.message}` : '✅ Working');
      if (rpcTest.data) {
        console.log('RPC Result:', rpcTest.data);
      }
    } catch (error) {
      console.log('RPC Test Error:', error.message);
    }

    // 6. CHECK IF TABLES ARE EXPOSED TO POSTGREST
    console.log('\n🔧 Checking if Tables are Exposed to PostgREST...');
    try {
      const tableExposure = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            schemaname,
            tablename,
            tableowner
          FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename IN ('polls', 'votes', 'poll_options', 'user_profiles')
          ORDER BY tablename;
        `
      });
      console.log('Table Exposure:', tableExposure.data || 'No data');
    } catch (error) {
      console.log('Table Exposure Check Error:', error.message);
    }

    // 7. CHECK POSTGREST SCHEMA PERMISSIONS
    console.log('\n🔧 Checking PostgREST Schema Permissions...');
    try {
      const schemaPerms = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            n.nspname as schema_name,
            p.proname as function_name,
            p.proacl as permissions
          FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = 'public'
          AND p.proname LIKE '%postgrest%'
          LIMIT 5;
        `
      });
      console.log('Schema Permissions:', schemaPerms.data || 'No data');
    } catch (error) {
      console.log('Schema Permissions Check Error:', error.message);
    }

    // 8. TEST CREATING A SIMPLE TABLE
    console.log('\n🔧 Testing Creating a Simple Table...');
    try {
      // Create a simple test table
      await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS test_table (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      console.log('Test table created');
      
      // Insert test data
      await supabase.rpc('exec_sql', {
        sql: `INSERT INTO test_table (name) VALUES ('Test Entry');`
      });
      console.log('Test data inserted');
      
      // Try to read with Supabase client
      const clientRead = await supabase.from('test_table').select('*');
      console.log('Client Read Test Table:', clientRead.error ? `❌ ${clientRead.error.message}` : '✅ Working');
      
      // Try to read with direct SQL
      const sqlRead = await supabase.rpc('exec_sql', {
        sql: 'SELECT * FROM test_table;'
      });
      console.log('SQL Read Test Table:', sqlRead.error ? `❌ ${sqlRead.error.message}` : '✅ Working');
      
      // Clean up
      await supabase.rpc('exec_sql', {
        sql: 'DROP TABLE test_table;'
      });
      console.log('Test table cleaned up');
      
    } catch (error) {
      console.log('Test Table Error:', error.message);
    }

    // 9. CHECK SUPABASE PROJECT STATUS
    console.log('\n🔧 Checking Supabase Project Status...');
    try {
      const statusResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        }
      });
      
      console.log('Project Status:', statusResponse.status);
      console.log('Project Headers:', Object.fromEntries(statusResponse.headers.entries()));
    } catch (error) {
      console.log('Project Status Check Error:', error.message);
    }

    console.log('\n🎉 POSTGREST INVESTIGATION COMPLETE!');

  } catch (error) {
    console.error('❌ Error in PostgREST investigation:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await investigatePostgREST();
    
    console.log('\n🚀 POSTGREST INVESTIGATION COMPLETE!');
    console.log('🎯 This should reveal the PostgREST API permission issues!');
    
  } catch (error) {
    console.error('❌ PostgREST investigation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  investigatePostgREST
};
