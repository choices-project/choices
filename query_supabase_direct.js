#!/usr/bin/env node

/**
 * Script to query Supabase database directly using SQL
 * This ensures our schema redesign is based on actual database structure
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function queryDatabaseSchema() {
  try {
    console.log('🔍 Querying Supabase database schema directly...\n');
    
    // Test connection by querying a known table
    console.log('📊 Testing connection with user_profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (profilesError) {
      console.error('Error querying user_profiles:', profilesError);
      return;
    }

    console.log('✅ Connection successful!');
    console.log('📋 user_profiles sample:', profiles[0] || 'No data');

    // Query polls table
    console.log('\n📊 Testing polls table...');
    const { data: polls, error: pollsError } = await supabase
      .from('polls')
      .select('*')
      .limit(1);

    if (!pollsError) {
      console.log('✅ polls table accessible');
      console.log('📋 polls sample:', polls[0] || 'No data');
    } else {
      console.log('❌ polls table error:', pollsError.message);
    }

    // Query votes table
    console.log('\n📊 Testing votes table...');
    const { data: votes, error: votesError } = await supabase
      .from('votes')
      .select('*')
      .limit(1);

    if (!votesError) {
      console.log('✅ votes table accessible');
      console.log('📋 votes sample:', votes[0] || 'No data');
    } else {
      console.log('❌ votes table error:', votesError.message);
    }

    // Query user_consent table
    console.log('\n📊 Testing user_consent table...');
    const { data: consent, error: consentError } = await supabase
      .from('user_consent')
      .select('*')
      .limit(1);

    if (!consentError) {
      console.log('✅ user_consent table accessible');
      console.log('📋 user_consent sample:', consent[0] || 'No data');
    } else {
      console.log('❌ user_consent table error:', consentError.message);
    }

    // Query privacy_logs table
    console.log('\n📊 Testing privacy_logs table...');
    const { data: privacy, error: privacyError } = await supabase
      .from('privacy_logs')
      .select('*')
      .limit(1);

    if (!privacyError) {
      console.log('✅ privacy_logs table accessible');
      console.log('📋 privacy_logs sample:', privacy[0] || 'No data');
    } else {
      console.log('❌ privacy_logs table error:', privacyError.message);
    }

    // Query user_profiles_encrypted table
    console.log('\n📊 Testing user_profiles_encrypted table...');
    const { data: encrypted, error: encryptedError } = await supabase
      .from('user_profiles_encrypted')
      .select('*')
      .limit(1);

    if (!encryptedError) {
      console.log('✅ user_profiles_encrypted table accessible');
      console.log('📋 user_profiles_encrypted sample:', encrypted[0] || 'No data');
    } else {
      console.log('❌ user_profiles_encrypted table error:', encryptedError.message);
    }

    // Query private_user_data table
    console.log('\n📊 Testing private_user_data table...');
    const { data: privateData, error: privateError } = await supabase
      .from('private_user_data')
      .select('*')
      .limit(1);

    if (!privateError) {
      console.log('✅ private_user_data table accessible');
      console.log('📋 private_user_data sample:', privateData[0] || 'No data');
    } else {
      console.log('❌ private_user_data table error:', privateError.message);
    }

    // Query analytics_contributions table
    console.log('\n📊 Testing analytics_contributions table...');
    const { data: analytics, error: analyticsError } = await supabase
      .from('analytics_contributions')
      .select('*')
      .limit(1);

    if (!analyticsError) {
      console.log('✅ analytics_contributions table accessible');
      console.log('📋 analytics_contributions sample:', analytics[0] || 'No data');
    } else {
      console.log('❌ analytics_contributions table error:', analyticsError.message);
    }

    // Query error_logs table
    console.log('\n📊 Testing error_logs table...');
    const { data: errors, error: errorsError } = await supabase
      .from('error_logs')
      .select('*')
      .limit(1);

    if (!errorsError) {
      console.log('✅ error_logs table accessible');
      console.log('📋 error_logs sample:', errors[0] || 'No data');
    } else {
      console.log('❌ error_logs table error:', errorsError.message);
    }

    // Test demographic_analytics view
    console.log('\n📊 Testing demographic_analytics view...');
    const { data: demographics, error: demographicsError } = await supabase
      .from('demographic_analytics')
      .select('*')
      .limit(1);

    if (!demographicsError) {
      console.log('✅ demographic_analytics view accessible');
      console.log('📋 demographic_analytics sample:', demographics[0] || 'No data');
    } else {
      console.log('❌ demographic_analytics view error:', demographicsError.message);
    }

    console.log('\n✅ Database schema verification complete!');
    
  } catch (error) {
    console.error('❌ Error querying database:', error);
  }
}

// Run the query
queryDatabaseSchema();
