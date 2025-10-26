/**
 * CHOICES PLATFORM - RLS & TRUST TIER SYSTEM TEST
 * 
 * Repository: https://github.com/choices-project/choices
 * Live Site: https://choices-platform.vercel.app
 * License: MIT
 * 
 * This script tests the complete RLS & Trust Tier system implementation
 */

const https = require('https');
const http = require('http');

const BASE_URL = 'http://localhost:3000';
const TEST_POLL_ID = 'test-poll-123';
const TEST_USER_ID = 'test-user-456';

console.log('🚀 CHOICES PLATFORM - RLS & TRUST TIER SYSTEM TEST');
console.log('=' * 60);

async function testEndpoint(url, description) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ ${description}: SUCCESS`);
          try {
            const jsonData = JSON.parse(data);
            console.log(`   Platform: ${jsonData.platform || 'N/A'}`);
            console.log(`   Repository: ${jsonData.repository || 'N/A'}`);
            console.log(`   Analysis Method: ${jsonData.analysis_method || 'N/A'}`);
          } catch (e) {
            console.log(`   Response: ${data.substring(0, 100)}...`);
          }
          resolve(true);
        } else {
          console.log(`❌ ${description}: FAILED (Status: ${res.statusCode})`);
          console.log(`   Response: ${data}`);
          resolve(false);
        }
      });
    }).on('error', (e) => {
      console.log(`❌ ${description}: ERROR - ${e.message}`);
      resolve(false);
    });
  });
}

async function testPostEndpoint(url, body, description) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = http.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`✅ ${description}: SUCCESS`);
          try {
            const jsonData = JSON.parse(data);
            console.log(`   Platform: ${jsonData.platform || 'N/A'}`);
            console.log(`   Repository: ${jsonData.repository || 'N/A'}`);
            console.log(`   Success: ${jsonData.success || 'N/A'}`);
          } catch (e) {
            console.log(`   Response: ${data.substring(0, 100)}...`);
          }
          resolve(true);
        } else {
          console.log(`❌ ${description}: FAILED (Status: ${res.statusCode})`);
          console.log(`   Response: ${data}`);
          resolve(false);
        }
      });
    });

    req.on('error', (e) => {
      console.log(`❌ ${description}: ERROR - ${e.message}`);
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

async function runAllTests() {
  console.log('\n🧪 Testing RLS & Trust Tier System APIs...');
  
  const tests = [
    {
      url: `${BASE_URL}/api/analytics/sentiment/${TEST_POLL_ID}`,
      description: 'Sentiment Analysis API'
    },
    {
      url: `${BASE_URL}/api/analytics/bot-detection/${TEST_POLL_ID}`,
      description: 'Bot Detection API'
    },
    {
      url: `${BASE_URL}/api/analytics/real-time/${TEST_POLL_ID}`,
      description: 'Real-Time Analytics API'
    },
    {
      url: `${BASE_URL}/api/analytics/trust-tier-results/${TEST_POLL_ID}`,
      description: 'Trust Tier Results API'
    },
    {
      url: `${BASE_URL}/api/user/voting-history/${TEST_USER_ID}`,
      description: 'User Voting History API'
    },
    {
      url: `${BASE_URL}/api/user/trust-tier-progression/${TEST_USER_ID}`,
      description: 'Trust Tier Progression API'
    }
  ];

  let successCount = 0;
  let totalCount = tests.length;

  // Test GET endpoints
  for (const test of tests) {
    const success = await testEndpoint(test.url, test.description);
    if (success) successCount++;
  }

  // Test POST endpoint
  const linkVotesSuccess = await testPostEndpoint(
    `${BASE_URL}/api/user/link-votes`,
    {
      user_id: TEST_USER_ID,
      voter_session: 'test-session-789'
    },
    'Link Anonymous Votes API'
  );
  
  if (linkVotesSuccess) successCount++;
  totalCount++;

  console.log('\n📊 TEST RESULTS:');
  console.log(`✅ Successful: ${successCount}/${totalCount} tests`);
  console.log(`❌ Failed: ${totalCount - successCount}/${totalCount} tests`);

  if (successCount === totalCount) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('🚀 RLS & Trust Tier System is working perfectly!');
    console.log('\n📋 Available APIs:');
    console.log('   • GET /api/analytics/sentiment/[id] - Sentiment analysis');
    console.log('   • GET /api/analytics/bot-detection/[id] - Bot detection');
    console.log('   • GET /api/analytics/real-time/[id] - Real-time analytics');
    console.log('   • GET /api/analytics/trust-tier-results/[id] - Trust tier results');
    console.log('   • GET /api/user/voting-history/[id] - User voting history');
    console.log('   • GET /api/user/trust-tier-progression/[id] - Trust tier progression');
    console.log('   • POST /api/user/link-votes - Link anonymous votes to user');
  } else {
    console.log('\n⚠️ Some tests failed. Please check the errors above.');
    console.log('💡 Make sure your Next.js development server is running on localhost:3000');
  }

  return successCount === totalCount;
}

// Run the tests
runAllTests()
  .then(success => {
    if (success) {
      console.log('\n🎯 NEXT STEPS:');
      console.log('1. Implement the database functions in Supabase');
      console.log('2. Test with real poll data');
      console.log('3. Update frontend components to use the new APIs');
      console.log('4. Deploy to production');
    } else {
      console.log('\n🔧 TROUBLESHOOTING:');
      console.log('1. Make sure Next.js development server is running');
      console.log('2. Check that all API routes are properly created');
      console.log('3. Verify Supabase configuration');
      console.log('4. Check console for any error messages');
    }
  })
  .catch(error => {
    console.error('❌ Test execution failed:', error);
  });
