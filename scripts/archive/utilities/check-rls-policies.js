#!/usr/bin/env node

/**
 * Check RLS Policies Script
 * 
 * This script checks the current RLS policies to see what's configured.
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config({ path: './web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSPolicies() {
  console.log('🔍 Checking RLS policies...');
  
  try {
    const { data, error } = await serviceClient
      .rpc('exec_sql', {
        sql: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies 
          WHERE schemaname = 'public' 
          AND tablename IN ('representatives_core', 'polls', 'hashtags')
          ORDER BY tablename, policyname;
        `
      });
    
    if (error) {
      console.log(`❌ RLS policies check failed: ${error.message}`);
    } else {
      console.log(`✅ RLS policies check successful:`);
      console.log(`Found ${data?.length || 0} policies:`);
      
      if (data && data.length > 0) {
        data.forEach(policy => {
          console.log(`\n📋 Table: ${policy.tablename}`);
          console.log(`  Policy: ${policy.policyname}`);
          console.log(`  Command: ${policy.cmd}`);
          console.log(`  Roles: ${policy.roles}`);
          console.log(`  Qual: ${policy.qual}`);
          console.log(`  With Check: ${policy.with_check}`);
        });
      } else {
        console.log('No policies found for the specified tables.');
      }
    }
  } catch (error) {
    console.log(`❌ RLS policies check error: ${error.message}`);
  }
}

async function checkRLSStatus() {
  console.log('\n🔍 Checking RLS status...');
  
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
      if (data && data.length > 0) {
        data.forEach(row => {
          console.log(`  - ${row.tablename}: RLS ${row.rls_enabled ? 'enabled' : 'disabled'}`);
        });
      } else {
        console.log('No tables found.');
      }
    }
  } catch (error) {
    console.log(`❌ RLS status check error: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 Starting RLS policies check...');
  
  await checkRLSPolicies();
  await checkRLSStatus();
  
  console.log('\n🎉 RLS policies check completed!');
}

main().catch(console.error);
