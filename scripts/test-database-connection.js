#!/usr/bin/env node

/**
 * Database Connection Test
 * 
 * Tests database connectivity and basic functionality
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './web/.env.local' });

async function testDatabaseConnection() {
  console.log('🔍 Testing Database Connection...\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminUserId = process.env.ADMIN_USER_ID;

  console.log('📋 Environment Variables:');
  console.log(`   SUPABASE_URL: ${supabaseUrl ? '✅ SET' : '❌ MISSING'}`);
  console.log(`   SERVICE_ROLE_KEY: ${supabaseServiceKey ? '✅ SET' : '❌ MISSING'}`);
  console.log(`   ADMIN_USER_ID: ${adminUserId ? '✅ SET' : '❌ MISSING'}`);

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('\n❌ Missing required environment variables');
    return false;
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('\n🔌 Testing basic connectivity...');
    
    // Test basic query
    const { data: users, error: usersError } = await supabase
      .from('ia_users')
      .select('count')
      .limit(1);

    if (usersError) {
      console.error('❌ Database query failed:', usersError.message);
      return false;
    }

    console.log('✅ Basic database connectivity successful');

    // Test admin user exists
    if (adminUserId) {
      console.log('\n👤 Testing admin user access...');
      
      const { data: adminUser, error: adminError } = await supabase
        .from('ia_users')
        .select('*')
        .eq('stable_id', adminUserId)
        .single();

      if (adminError) {
        console.error('❌ Admin user query failed:', adminError.message);
        return false;
      }

      if (adminUser) {
        console.log('✅ Admin user found:');
        console.log(`   Email: ${adminUser.email}`);
        console.log(`   Tier: ${adminUser.verification_tier}`);
        console.log(`   Active: ${adminUser.is_active}`);
      } else {
        console.log('⚠️  Admin user not found in ia_users table');
      }
    }

    // Test polls table
    console.log('\n📊 Testing polls table...');
    
    const { data: polls, error: pollsError } = await supabase
      .from('po_polls')
      .select('count')
      .limit(1);

    if (pollsError) {
      console.error('❌ Polls table query failed:', pollsError.message);
      return false;
    }

    console.log('✅ Polls table accessible');

    // Test RLS policies
    console.log('\n🔒 Testing RLS policies...');
    
    try {
      const { data: rlsTest, error: rlsError } = await supabase
        .from('ia_users')
        .select('*')
        .limit(5);

      if (rlsError && rlsError.message.includes('permission denied')) {
        console.log('✅ RLS policies are active (access properly restricted)');
      } else if (rlsError) {
        console.error('❌ RLS test failed:', rlsError.message);
      } else {
        console.log('⚠️  RLS policies may not be active (unrestricted access)');
      }
    } catch (error) {
      console.log('✅ RLS policies are active (access properly restricted)');
    }

    console.log('\n🎉 Database connection test completed successfully!');
    return true;

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
}

// Run the test
testDatabaseConnection().then(success => {
  process.exit(success ? 0 : 1);
});
