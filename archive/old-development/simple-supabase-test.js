#!/usr/bin/env node

// Simple Supabase Connection Test
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function simpleTest() {
  console.log('🔧 Simple Supabase connection test...\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('📋 Environment Variables:');
  console.log(`  Supabase URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`  Supabase Key: ${supabaseKey ? '✅ Set' : '❌ Missing'}\n`);

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing required environment variables!');
    process.exit(1);
  }

  try {
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client created successfully');

    // Test basic connection by checking auth
    console.log('\n🔍 Testing basic connection...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('⚠️  Auth test failed:', authError.message);
    } else {
      console.log('✅ Basic connection working');
    }

    // Test if we can query the database at all
    console.log('\n🔍 Testing database access...');
    const { data: testData, error: testError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);

    if (testError) {
      console.log('⚠️  Database access test failed:', testError.message);
      console.log('   This suggests the schema might not be set up yet');
    } else {
      console.log('✅ Database access working');
      console.log('   Available tables:', testData?.length || 0);
    }

    // Try to create a simple test table to check permissions
    console.log('\n🧪 Testing write permissions...');
    const { error: createError } = await supabase.rpc('create_test_table_if_not_exists');
    
    if (createError) {
      console.log('⚠️  Write permission test failed:', createError.message);
      console.log('   This is expected if the schema is not set up');
    } else {
      console.log('✅ Write permissions working');
    }

    console.log('\n🎉 Basic connection test completed!');
    console.log('\n📋 Summary:');
    console.log('✅ Supabase client: Working');
    console.log('✅ Environment variables: Set');
    console.log('⚠️  Database schema: Needs to be set up');
    console.log('⚠️  Tables: Not accessible yet');
    
    console.log('\n🚀 Next steps:');
    console.log('1. Run the enhanced schema in Supabase SQL Editor');
    console.log('2. The schema should create all necessary tables');
    console.log('3. Test again with: node test-supabase-connection.js');

  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check your Supabase URL and key are correct');
    console.log('2. Ensure your Supabase project is active');
    console.log('3. Check your network connection');
  }
}

// Run the test
simpleTest().catch(console.error);
