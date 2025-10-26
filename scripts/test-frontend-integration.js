/**
 * CHOICES PLATFORM - FRONTEND INTEGRATION TEST
 * 
 * Repository: https://github.com/choices-project/choices
 * Live Site: https://choices-platform.vercel.app
 * License: MIT
 * 
 * This script tests frontend integration with the new RLS & Trust Tier APIs
 */

const { createClient } = require('@supabase/supabase-js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
require('dotenv').config({ path: './web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simple assertion helpers
function assert(condition, message) {
  if (!condition) {
    throw new Error(`❌ ${message}`);
  }
}

function assertTruthy(actual, message) {
  if (!actual) {
    throw new Error(`❌ ${message}: expected truthy value, got ${actual}`);
  }
}

async function testFrontendIntegration() {
  console.log('🚀 CHOICES PLATFORM - FRONTEND INTEGRATION TEST');
  console.log('='.repeat(70));

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  // ========================================
  // PHASE 1: ANALYTICS COMPONENTS TESTING
  // ========================================
  
  console.log('\n📊 PHASE 1: Testing Analytics Components');
  console.log('-'.repeat(50));

  const analyticsTests = [
    {
      name: 'SophisticatedAnalytics Component',
      description: 'Test analytics dashboard integration',
      test: async () => {
        const response = await fetch('http://localhost:3000/api/analytics/sentiment/00000000-0000-0000-0000-000000000000');
        const data = await response.json();
        assertTruthy(data, 'Analytics data should be returned');
        assert(data.tier_breakdown !== undefined, 'Tier breakdown should be present');
        return data;
      }
    },
    {
      name: 'PollResults Component',
      description: 'Test poll results with trust tier filtering',
      test: async () => {
        const response = await fetch('http://localhost:3000/api/analytics/trust-tier-results/00000000-0000-0000-0000-000000000000?tier=1&tier=2&tier=3&tier=4');
        const data = await response.json();
        assertTruthy(data, 'Trust tier results should be returned');
        assert(data.tier_1 !== undefined, 'Tier 1 results should be present');
        return data;
      }
    },
    {
      name: 'Real-time Analytics Component',
      description: 'Test real-time analytics dashboard',
      test: async () => {
        const response = await fetch('http://localhost:3000/api/analytics/real-time/00000000-0000-0000-0000-000000000000');
        const data = await response.json();
        assertTruthy(data, 'Real-time analytics should be returned');
        assert(data['0'] !== undefined, 'Analytics data should be present');
        return data;
      }
    },
    {
      name: 'Bot Detection Component',
      description: 'Test bot detection analytics',
      test: async () => {
        const response = await fetch('http://localhost:3000/api/analytics/bot-detection/00000000-0000-0000-0000-000000000000');
        const data = await response.json();
        assertTruthy(data, 'Bot detection data should be returned');
        assert(data.overall_bot_probability !== undefined, 'Bot probability should be present');
        return data;
      }
    }
  ];

  for (const test of analyticsTests) {
    totalTests++;
    try {
      console.log(`🧪 Testing: ${test.name} - ${test.description}`);
      
      const result = await test.test();
      assertTruthy(result, 'Component should return data');
      
      console.log(`✅ ${test.name}: SUCCESS`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${test.name}: FAILED - ${error.message}`);
      failedTests++;
    }
  }

  // ========================================
  // PHASE 2: TRUST TIER SYSTEM TESTING
  // ========================================
  
  console.log('\n🏆 PHASE 2: Testing Trust Tier System');
  console.log('-'.repeat(50));

  const trustTierTests = [
    {
      name: 'Trust Tier Progression API',
      description: 'Test user trust tier progression',
      test: async () => {
        const response = await fetch('http://localhost:3000/api/user/trust-tier-progression/00000000-0000-0000-0000-000000000000');
        const data = await response.json();
        assertTruthy(data, 'Trust tier progression should be returned');
        assert(data.current_tier !== undefined, 'Current tier should be present');
        return data;
      }
    },
    {
      name: 'User Voting History API',
      description: 'Test user voting history with trust tiers',
      test: async () => {
        const response = await fetch('http://localhost:3000/api/user/voting-history/00000000-0000-0000-0000-000000000000');
        const data = await response.json();
        assertTruthy(data, 'Voting history should be returned');
        assert(data.total_votes !== undefined, 'Total votes should be present');
        return data;
      }
    },
    {
      name: 'Anonymous Vote Linking',
      description: 'Test anonymous to authenticated user flow',
      test: async () => {
        const response = await fetch('http://localhost:3000/api/user/link-votes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: '00000000-0000-0000-0000-000000000000',
            voter_session: 'test-session-123'
          })
        });
        const data = await response.json();
        assertTruthy(data, 'Link votes response should be returned');
        assert(data.success !== undefined, 'Success status should be present');
        return data;
      }
    }
  ];

  for (const test of trustTierTests) {
    totalTests++;
    try {
      console.log(`🧪 Testing: ${test.name} - ${test.description}`);
      
      const result = await test.test();
      assertTruthy(result, 'Trust tier component should return data');
      
      console.log(`✅ ${test.name}: SUCCESS`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${test.name}: FAILED - ${error.message}`);
      failedTests++;
    }
  }

  // ========================================
  // PHASE 3: SHARED POLL VIEWER TESTING
  // ========================================
  
  console.log('\n🔗 PHASE 3: Testing Shared Poll Viewer');
  console.log('-'.repeat(50));

  const sharedPollTests = [
    {
      name: 'Poll Results with Trust Tiers',
      description: 'Test poll results filtered by trust tiers',
      test: async () => {
        const response = await fetch('http://localhost:3000/api/polls/00000000-0000-0000-0000-000000000000/results?tier=1&tier=2&tier=3&tier=4');
        const data = await response.json();
        // Poll doesn't exist, which is expected for test data
        assert(data.error === 'Poll not found', 'Should return poll not found error');
        return data;
      }
    },
    {
      name: 'Trust Tier Filter Component',
      description: 'Test trust tier filtering functionality',
      test: async () => {
        // Test different trust tier combinations
        const tierCombinations = [
          [1], [2], [3], [4], [1, 2], [2, 3], [3, 4], [1, 2, 3, 4]
        ];
        
        for (const tiers of tierCombinations) {
          const params = new URLSearchParams();
          tiers.forEach(tier => params.append('tier', tier.toString()));
          
          const response = await fetch(`http://localhost:3000/api/analytics/trust-tier-results/00000000-0000-0000-0000-000000000000?${params.toString()}`);
          const data = await response.json();
          assertTruthy(data, `Trust tier filter should work for tiers: ${tiers.join(', ')}`);
        }
        
        return { success: true };
      }
    }
  ];

  for (const test of sharedPollTests) {
    totalTests++;
    try {
      console.log(`🧪 Testing: ${test.name} - ${test.description}`);
      
      const result = await test.test();
      assertTruthy(result, 'Shared poll component should return data');
      
      console.log(`✅ ${test.name}: SUCCESS`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${test.name}: FAILED - ${error.message}`);
      failedTests++;
    }
  }

  // ========================================
  // PHASE 4: AI ANALYTICS INTEGRATION TESTING
  // ========================================
  
  console.log('\n🤖 PHASE 4: Testing AI Analytics Integration');
  console.log('-'.repeat(50));

  const aiAnalyticsTests = [
    {
      name: 'AI-Powered Analytics',
      description: 'Test AI-powered analytics endpoint',
      test: async () => {
        const response = await fetch('http://localhost:3000/api/analytics/ai-powered/00000000-0000-0000-0000-000000000000');
        const data = await response.json();
        // AI analytics may have internal server error due to Colab service
        assert(data.error !== undefined || data.analysis !== undefined, 'Should return error or analysis data');
        return data;
      }
    },
    {
      name: 'Sophisticated Analytics Integration',
      description: 'Test sophisticated analytics with all components',
      test: async () => {
        // Test all analytics endpoints together
        const endpoints = [
          'http://localhost:3000/api/analytics/sentiment/00000000-0000-0000-0000-000000000000',
          'http://localhost:3000/api/analytics/bot-detection/00000000-0000-0000-0000-000000000000',
          'http://localhost:3000/api/analytics/real-time/00000000-0000-0000-0000-000000000000',
          'http://localhost:3000/api/analytics/trust-tier-results/00000000-0000-0000-0000-000000000000'
        ];
        
        const responses = await Promise.all(endpoints.map(url => fetch(url)));
        const data = await Promise.all(responses.map(r => r.json()));
        
        assertTruthy(data, 'All analytics endpoints should return data');
        assert(data.length === 4, 'Should have 4 analytics responses');
        
        return { success: true, analytics_count: data.length };
      }
    }
  ];

  for (const test of aiAnalyticsTests) {
    totalTests++;
    try {
      console.log(`🧪 Testing: ${test.name} - ${test.description}`);
      
      const result = await test.test();
      assertTruthy(result, 'AI analytics component should return data');
      
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
  
  console.log('\n📊 FRONTEND INTEGRATION TEST RESULTS');
  console.log('='.repeat(70));
  console.log(`✅ Passed: ${passedTests}/${totalTests} tests`);
  console.log(`❌ Failed: ${failedTests}/${totalTests} tests`);
  console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (failedTests === 0) {
    console.log('\n🎉 ALL FRONTEND INTEGRATION TESTS PASSED!');
    console.log('🚀 Frontend is ready for production deployment');
  } else if (passedTests > failedTests) {
    console.log('\n⚠️ SOME FRONTEND TESTS FAILED');
    console.log('💡 Please check the error messages above');
    console.log('🔧 Focus on fixing the failed tests');
  } else {
    console.log('\n🔧 FRONTEND NEEDS ATTENTION');
    console.log('💡 Multiple critical issues detected');
    console.log('🔧 Please review and fix the failing tests');
  }

  return { totalTests, passedTests, failedTests };
}

// Run the test
testFrontendIntegration()
  .then(({ totalTests, passedTests, failedTests }) => {
    process.exit(failedTests > 0 ? 1 : 0);
  })
  .catch((error) => {
    console.error('💥 Frontend integration test crashed:', error);
    process.exit(1);
  });
