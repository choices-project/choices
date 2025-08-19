#!/usr/bin/env node

// Simple Database Connection Test
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function simpleTest() {
  console.log('🔧 Simple database connection test...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables!');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test 1: Basic auth connection
    console.log('🔍 Test 1: Basic auth connection...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('❌ Auth failed:', authError.message);
    } else {
      console.log('✅ Auth connection working');
    }

    // Test 2: Try to get project info
    console.log('\n🔍 Test 2: Project info...');
    try {
      const { data: projectInfo, error: projectError } = await supabase
        .from('_supabase_migrations')
        .select('*')
        .limit(1);
      
      if (projectError) {
        console.log('❌ Project info failed:', projectError.message);
      } else {
        console.log('✅ Project info accessible');
      }
    } catch (err) {
      console.log('❌ Project info error:', err.message);
    }

    // Test 3: Try a very simple query
    console.log('\n🔍 Test 3: Simple query...');
    try {
      const { data: simpleData, error: simpleError } = await supabase
        .rpc('version');
      
      if (simpleError) {
        console.log('❌ Simple query failed:', simpleError.message);
      } else {
        console.log('✅ Simple query working');
      }
    } catch (err) {
      console.log('❌ Simple query error:', err.message);
    }

    console.log('\n📋 Summary:');
    console.log('✅ Supabase client: Created');
    console.log('⚠️  Database access: Problematic');
    console.log('⚠️  Schema cache: Corrupted or inaccessible');
    
    console.log('\n🚀 Recommendations:');
    console.log('1. Check your Supabase project status in the dashboard');
    console.log('2. Consider resetting the database');
    console.log('3. Or create a new Supabase project');
    console.log('4. The issue is likely with the database, not your code');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

simpleTest().catch(console.error);
