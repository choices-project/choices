/**
 * CHOICES PLATFORM - TEST EXISTING DATABASE FUNCTIONS
 * 
 * Repository: https://github.com/choices-project/choices
 * Live Site: https://choices-platform.vercel.app
 * License: MIT
 * 
 * This script tests what database functions are working
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in web/.env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testExistingFunctions() {
  console.log('🧪 CHOICES PLATFORM - TESTING EXISTING DATABASE FUNCTIONS');
  console.log('=' * 60);

  const functions = [
    'analyze_poll_sentiment',
    'detect_bot_behavior', 
    'get_real_time_analytics',
    'link_anonymous_votes_to_user',
    'get_poll_results_by_trust_tier',
    'get_user_voting_history',
    'get_trust_tier_progression'
  ];

  let workingCount = 0;
  let totalCount = functions.length;

  for (const funcName of functions) {
    try {
      console.log(`🧪 Testing function: ${funcName}...`);
      
      // Test with dummy data
      const testParams = {
        p_poll_id: '00000000-0000-0000-0000-000000000000',
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_time_window: '24 hours',
        p_trust_tiers: [1, 2, 3, 4],
        p_voter_session: 'test-session'
      };

      let params = {};
      if (funcName === 'analyze_poll_sentiment') {
        params = { p_poll_id: testParams.p_poll_id, p_time_window: testParams.p_time_window };
      } else if (funcName === 'detect_bot_behavior') {
        params = { p_poll_id: testParams.p_poll_id, p_time_window: testParams.p_time_window };
      } else if (funcName === 'get_real_time_analytics') {
        params = { p_poll_id: testParams.p_poll_id };
      } else if (funcName === 'link_anonymous_votes_to_user') {
        params = { p_user_id: testParams.p_user_id, p_voter_session: testParams.p_voter_session };
      } else if (funcName === 'get_poll_results_by_trust_tier') {
        params = { p_poll_id: testParams.p_poll_id, p_trust_tiers: testParams.p_trust_tiers };
      } else if (funcName === 'get_user_voting_history') {
        params = { p_user_id: testParams.p_user_id };
      } else if (funcName === 'get_trust_tier_progression') {
        params = { p_user_id: testParams.p_user_id };
      }

      const { data, error } = await supabase.rpc(funcName, params);
      
      if (error) {
        console.log(`❌ ${funcName}: FAILED - ${error.message}`);
      } else {
        console.log(`✅ ${funcName}: SUCCESS`);
        workingCount++;
      }
    } catch (error) {
      console.log(`❌ ${funcName}: ERROR - ${error.message}`);
    }
  }

  console.log('\n📊 FUNCTION TEST RESULTS:');
  console.log(`✅ Working: ${workingCount}/${totalCount} functions`);
  console.log(`❌ Failed: ${totalCount - workingCount}/${totalCount} functions`);

  if (workingCount === totalCount) {
    console.log('\n🎉 ALL FUNCTIONS ARE WORKING!');
    console.log('🚀 Database functions are ready for use!');
  } else if (workingCount > 0) {
    console.log('\n⚠️ Some functions are working, some need fixing');
    console.log('💡 Focus on fixing the failed functions');
  } else {
    console.log('\n❌ No functions are working');
    console.log('💡 Need to implement the database functions');
  }

  return workingCount === totalCount;
}

// Run the tests
testExistingFunctions()
  .then(success => {
    if (success) {
      console.log('\n🎯 NEXT STEPS:');
      console.log('1. Test the complete system');
      console.log('2. Run end-to-end tests');
      console.log('3. Deploy to production');
    } else {
      console.log('\n🔧 NEXT STEPS:');
      console.log('1. Fix the failed functions');
      console.log('2. Re-run the function creation');
      console.log('3. Test again');
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
  });
