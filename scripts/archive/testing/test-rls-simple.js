#!/usr/bin/env node

/**
 * Simple RLS Test Script
 * 
 * This script performs basic tests to verify RLS is working correctly.
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: './web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Create clients
const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

async function testBasicAccess() {
  console.log('🧪 Testing basic RLS access...');
  
  // Test 1: Service role can read representatives
  console.log('\n1. Testing service role can read representatives...');
  try {
    const { data, error } = await serviceClient
      .from('representatives_core')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ Service role read failed: ${error.message}`);
    } else {
      console.log(`✅ Service role read successful (${data?.length || 0} records)`);
    }
  } catch (error) {
    console.log(`❌ Service role read error: ${error.message}`);
  }

  // Test 2: Anonymous user can read representatives
  console.log('\n2. Testing anonymous user can read representatives...');
  try {
    const { data, error } = await anonClient
      .from('representatives_core')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`❌ Anonymous read failed: ${error.message}`);
    } else {
      console.log(`✅ Anonymous read successful (${data?.length || 0} records)`);
    }
  } catch (error) {
    console.log(`❌ Anonymous read error: ${error.message}`);
  }

  // Test 3: Service role can insert data
  console.log('\n3. Testing service role can insert data...');
  try {
    const { data, error } = await serviceClient
      .from('representatives_core')
      .insert({
        name: 'Test RLS Representative',
        office: 'Representative',
        level: 'federal',
        state: 'CA',
        party: 'Test Party',
        district: '1',
        is_active: true
      })
      .select();
    
    if (error) {
      console.log(`❌ Service role insert failed: ${error.message}`);
    } else {
      console.log(`✅ Service role insert successful`);
      
      // Clean up
      if (data && data.length > 0) {
        await serviceClient
          .from('representatives_core')
          .delete()
          .eq('id', data[0].id);
        console.log(`🧹 Cleaned up test data`);
      }
    }
  } catch (error) {
    console.log(`❌ Service role insert error: ${error.message}`);
  }

  // Test 4: Anonymous user cannot insert data
  console.log('\n4. Testing anonymous user cannot insert data...');
  try {
    const { data, error } = await anonClient
      .from('representatives_core')
      .insert({
        name: 'Test Anonymous Insert',
        office: 'Representative',
        level: 'federal',
        state: 'CA',
        party: 'Test Party',
        district: '1',
        is_active: true
      });
    
    if (error) {
      console.log(`✅ Anonymous insert blocked: ${error.message}`);
    } else {
      console.log(`❌ Anonymous insert allowed (should be blocked)`);
    }
  } catch (error) {
    console.log(`✅ Anonymous insert blocked: ${error.message}`);
  }

  // Test 5: Check RLS status
  console.log('\n5. Checking RLS status...');
  try {
    const { data, error } = await serviceClient
      .rpc('exec_sql', {
        sql: `
          SELECT 
            schemaname,
            tablename,
            rowsecurity as rls_enabled
          FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename IN ('representatives_core', 'polls', 'hashtags')
          ORDER BY tablename;
        `
      });
    
    if (error) {
      console.log(`❌ RLS status check failed: ${error.message}`);
    } else {
      console.log(`✅ RLS status check successful:`);
      data?.forEach(row => {
        console.log(`  - ${row.tablename}: RLS ${row.rls_enabled ? 'enabled' : 'disabled'}`);
      });
    }
  } catch (error) {
    console.log(`❌ RLS status check error: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Starting simple RLS test...');
  
  await testBasicAccess();
  
  console.log('\n🎉 Simple RLS test completed!');
}

main().catch(console.error);
