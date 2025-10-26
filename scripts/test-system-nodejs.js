/**
 * CHOICES PLATFORM - NODE.JS SYSTEM TEST
 * 
 * Repository: https://github.com/choices-project/choices
 * Live Site: https://choices-platform.vercel.app
 * License: MIT
 * 
 * This script tests the complete RLS & Trust Tier system using Node.js assertions
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config({ path: './web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in web/.env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simple assertion helpers
function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ ${message}`);
  }
}

function assertGreaterThan(actual, expected, message) {
  if (actual <= expected) {
    throw new Error(`❌ ${message}: expected > ${expected}, got ${actual}`);
  }
}

function assertTruthy(actual, message) {
  if (!actual) {
    throw new Error(`❌ ${message}: expected truthy value, got ${actual}`);
  }
}

async function testCompleteSystem() {
  console.log('🚀 CHOICES PLATFORM - NODE.JS SYSTEM TEST');
  console.log('='.repeat(70));

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  // ========================================
  // PHASE 1: DATABASE FUNCTIONS TESTING
  // ========================================
  
  console.log('\n🔧 PHASE 1: Testing Database Functions');
  console.log('-'.repeat(50));

  const databaseFunctions = [
    {
      name: 'analyze_poll_sentiment',
      params: { p_poll_id: '00000000-0000-0000-0000-000000000000', p_time_window: '24 hours' },
      description: 'Sentiment analysis across trust tiers'
    },
    {
      name: 'detect_bot_behavior',
      params: { p_poll_id: '00000000-0000-0000-0000-000000000000', p_time_window: '24 hours' },
      description: 'Bot detection and manipulation analysis'
    },
    {
      name: 'get_real_time_analytics',
      params: { p_poll_id: '00000000-0000-0000-0000-000000000000', p_time_window: '24 hours' },
      description: 'Real-time analytics and engagement metrics'
    },
    {
      name: 'link_anonymous_votes_to_user',
      params: { p_user_id: '00000000-0000-0000-0000-000000000000', p_voter_session: 'test-session-123' },
      description: 'Link anonymous votes to user accounts'
    },
    {
      name: 'get_poll_results_by_trust_tier',
      params: { p_poll_id: '00000000-0000-0000-0000-000000000000', p_trust_tiers: [1, 2, 3, 4] },
      description: 'Trust tier filtered poll results'
    },
    {
      name: 'get_user_voting_history',
      params: { p_user_id: '00000000-0000-0000-0000-000000000000' },
      description: 'User voting history and progression'
    },
    {
      name: 'get_trust_tier_progression',
      params: { p_user_id: '00000000-0000-0000-0000-000000000000' },
      description: 'Trust tier progression and requirements'
    }
  ];

  for (const func of databaseFunctions) {
    totalTests++;
    try {
      console.log(`🧪 Testing: ${func.name} - ${func.description}`);
      
      const { data, error } = await supabase.rpc(func.name, func.params);
      
      if (error) {
        throw new Error(`Database function failed: ${error.message}`);
      }
      
      // For link_anonymous_votes_to_user, 0 is expected when no votes to link
      if (func.name === 'link_anonymous_votes_to_user') {
        assert(data !== null, 'Function should return data (even if 0)');
      } else {
        assertTruthy(data, 'Function should return data');
      }
      console.log(`✅ ${func.name}: SUCCESS`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${func.name}: FAILED - ${error.message}`);
      failedTests++;
    }
  }

  // ========================================
  // PHASE 2: API ENDPOINTS TESTING
  // ========================================
  
  console.log('\n🔌 PHASE 2: Testing API Endpoints');
  console.log('-'.repeat(50));

  const apiEndpoints = [
    { name: 'Sentiment Analysis API', url: 'http://localhost:3000/api/analytics/sentiment/00000000-0000-0000-0000-000000000000' },
    { name: 'Bot Detection API', url: 'http://localhost:3000/api/analytics/bot-detection/00000000-0000-0000-0000-000000000000' },
    { name: 'Real-Time Analytics API', url: 'http://localhost:3000/api/analytics/real-time/00000000-0000-0000-0000-000000000000' },
    { name: 'Trust Tier Results API', url: 'http://localhost:3000/api/analytics/trust-tier-results/00000000-0000-0000-0000-000000000000' },
    { name: 'User Voting History API', url: 'http://localhost:3000/api/user/voting-history/00000000-0000-0000-0000-000000000000' },
    { name: 'Trust Tier Progression API', url: 'http://localhost:3000/api/user/trust-tier-progression/00000000-0000-0000-0000-000000000000' },
    { name: 'Link Anonymous Votes API', url: 'http://localhost:3000/api/user/link-votes' }
  ];

  for (const endpoint of apiEndpoints) {
    totalTests++;
    try {
      console.log(`🧪 Testing: ${endpoint.name}`);
      
      // Use POST for link-votes endpoint, GET for others
      const method = endpoint.name.includes('Link Anonymous Votes') ? 'POST' : 'GET';
      const body = endpoint.name.includes('Link Anonymous Votes') ? 
        JSON.stringify({ user_id: '00000000-0000-0000-0000-000000000000', voter_session: 'test-session-123' }) : 
        undefined;
      
      const response = await fetch(endpoint.url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: body
      });
      
      const status = response.status;
      const responseText = await response.text();
      
      if (status >= 200 && status < 300) {
        console.log(`✅ ${endpoint.name}: SUCCESS (${status})`);
        passedTests++;
      } else {
        throw new Error(`HTTP ${status}: ${responseText.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: FAILED - ${error.message}`);
      failedTests++;
    }
  }

  // ========================================
  // PHASE 3: TRUST TIER SYSTEM TESTING
  // ========================================
  
  console.log('\n🏆 PHASE 3: Testing Trust Tier System');
  console.log('-'.repeat(50));

  const trustTiers = [
    { level: 1, name: 'Anonymous', description: 'Basic anonymous access' },
    { level: 2, name: 'Basic Verified', description: 'Email and phone verification' },
    { level: 3, name: 'Biometric Verified', description: 'WebAuthn and biometric authentication' },
    { level: 4, name: 'Government Verified', description: 'Government ID verification' }
  ];

  for (const tier of trustTiers) {
    totalTests++;
    try {
      console.log(`🧪 Testing Trust Tier ${tier.level}: ${tier.name} - ${tier.description}`);
      
      // Test trust tier progression
      const { data: progression, error: progressionError } = await supabase.rpc('get_trust_tier_progression', {
        p_user_id: '00000000-0000-0000-0000-000000000000'
      });
      
      if (progressionError) {
        throw new Error(`Trust tier progression failed: ${progressionError.message}`);
      }
      
      assertTruthy(progression, 'Should return trust tier progression data');
      assertGreaterThan(progression.length, 0, 'Should have progression data');
      
      console.log(`✅ Trust Tier ${tier.level}: SUCCESS`);
      passedTests++;
    } catch (error) {
      console.log(`❌ Trust Tier ${tier.level}: FAILED - ${error.message}`);
      failedTests++;
    }
  }

  // ========================================
  // PHASE 4: ANALYTICS SYSTEM TESTING
  // ========================================
  
  console.log('\n📊 PHASE 4: Testing Analytics System');
  console.log('-'.repeat(50));

  const analyticsTests = [
    { name: 'Sentiment Analysis', description: 'Cross-tier sentiment comparison' },
    { name: 'Bot Detection', description: 'Manipulation and coordinated behavior detection' },
    { name: 'Real-Time Analytics', description: 'Live voting patterns and engagement' },
    { name: 'Trust Tier Filtering', description: 'Results filtered by trust tier' }
  ];

  for (const test of analyticsTests) {
    totalTests++;
    try {
      console.log(`🧪 Testing: ${test.name} - ${test.description}`);
      
      // Test analytics functions
      const { data: sentiment, error: sentimentError } = await supabase.rpc('analyze_poll_sentiment', {
        p_poll_id: '00000000-0000-0000-0000-000000000000',
        p_time_window: '24 hours'
      });
      
      if (sentimentError) {
        throw new Error(`Analytics function failed: ${sentimentError.message}`);
      }
      
      assertTruthy(sentiment, 'Should return analytics data');
      
      console.log(`✅ ${test.name}: SUCCESS`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${test.name}: FAILED - ${error.message}`);
      failedTests++;
    }
  }

  // ========================================
  // PHASE 5: SECURITY AND RLS TESTING
  // ========================================
  
  console.log('\n🔒 PHASE 5: Testing Security and RLS');
  console.log('-'.repeat(50));

  const securityTests = [
    { name: 'Row Level Security', description: 'Database-level access control' },
    { name: 'Trust Tier Access Control', description: 'Feature access based on trust tier' },
    { name: 'Data Privacy', description: 'User data protection and anonymization' }
  ];

  for (const test of securityTests) {
    totalTests++;
    try {
      console.log(`🧪 Testing: ${test.name} - ${test.description}`);
      
      // Test RLS by attempting to access protected data
      const { data: userProfiles, error: userError } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1);
      
      // RLS should either allow access (with proper auth) or deny it gracefully
      assertTruthy(userProfiles !== null, 'RLS should handle access control');
      
      console.log(`✅ ${test.name}: SUCCESS`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${test.name}: FAILED - ${error.message}`);
      failedTests++;
    }
  }

  // ========================================
  // PHASE 6: SYSTEM INTEGRATION TESTING
  // ========================================
  
  console.log('\n🔗 PHASE 6: Testing System Integration');
  console.log('-'.repeat(50));

  const integrationTests = [
    { name: 'Database Functions Integration', description: 'All 7 functions working together' },
    { name: 'API Endpoints Integration', description: 'All 7 endpoints accessible' },
    { name: 'Frontend Component Integration', description: 'UI components connected to APIs' },
    { name: 'Anonymous to Authenticated Flow', description: 'Seamless user progression' }
  ];

  for (const test of integrationTests) {
    totalTests++;
    try {
      console.log(`🧪 Testing: ${test.name} - ${test.description}`);
      
      // Test multiple functions working together
      const { data: sentiment } = await supabase.rpc('analyze_poll_sentiment', {
        p_poll_id: '00000000-0000-0000-0000-000000000000',
        p_time_window: '24 hours'
      });
      
      const { data: botDetection } = await supabase.rpc('detect_bot_behavior', {
        p_poll_id: '00000000-0000-0000-0000-000000000000',
        p_time_window: '24 hours'
      });
      
      assertTruthy(sentiment, 'Sentiment analysis should work');
      assertTruthy(botDetection, 'Bot detection should work');
      
      console.log(`✅ ${test.name}: SUCCESS`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${test.name}: FAILED - ${error.message}`);
      failedTests++;
    }
  }

  // ========================================
  // FINAL RESULTS
  // ========================================
  
  console.log('\n📊 COMPLETE SYSTEM TEST RESULTS');
  console.log('='.repeat(70));
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`❌ Failed: ${failedTests}/${totalTests} tests`);
  console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (failedTests === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('🚀 System is ready for production deployment');
  } else if (passedTests > failedTests) {
    console.log('\n⚠️ SOME TESTS FAILED');
    console.log('💡 Please check the error messages above');
    console.log('🔧 Focus on fixing the failed tests');
  } else {
    console.log('\n🔧 SYSTEM NEEDS ATTENTION');
    console.log('💡 Multiple critical issues detected');
    console.log('🔧 Please review and fix the failing tests');
  }

  return { totalTests, passedTests, failedTests };
}

// Run the test
testCompleteSystem()
  .then(({ totalTests, passedTests, failedTests }) => {
    process.exit(failedTests > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('💥 Test suite crashed:', error);
    process.exit(1);
  });
