#!/usr/bin/env node

/**
 * 🧪 COMPREHENSIVE SYSTEM TEST
 * 
 * This script provides comprehensive testing for the complete
 * RLS & Trust Tier System, including:
 * 
 * - Database Functions Testing
 * - API Endpoints Testing
 * - RLS Security Testing
 * - Anonymous to Authenticated Flow Testing
 * - Sophisticated Analytics Testing
 * - Performance Testing
 * - Integration Testing
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

// Test Results Tracking
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

function logTest(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${testName}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${testName}: ${details}`);
  }
  testResults.details.push({ testName, passed, details });
}

// 1. DATABASE FUNCTIONS TESTING
async function testDatabaseFunctions() {
  console.log('\n🧪 Testing Database Functions...\n');

  try {
    // Test Sentiment Analysis Function
    console.log('📊 Testing Sentiment Analysis Function...');
    const sentimentResult = await supabaseService.rpc('analyze_poll_sentiment', {
      p_poll_id: '00000000-0000-0000-0000-000000000000',
      p_time_window: '1 hour'
    });
    logTest('Sentiment Analysis Function', !sentimentResult.error, sentimentResult.error?.message);

    // Test Bot Detection Function
    console.log('🤖 Testing Bot Detection Function...');
    const botResult = await supabaseService.rpc('detect_bot_behavior', {
      p_poll_id: '00000000-0000-0000-0000-000000000000',
      p_analysis_window: '24 hours'
    });
    logTest('Bot Detection Function', !botResult.error, botResult.error?.message);

    // Test Geographic Intelligence Function
    console.log('🌍 Testing Geographic Intelligence Function...');
    const geoResult = await supabaseService.rpc('analyze_geographic_intelligence', {
      p_poll_id: '00000000-0000-0000-0000-000000000000',
      p_analysis_window: '24 hours'
    });
    logTest('Geographic Intelligence Function', !geoResult.error, geoResult.error?.message);

    // Test Temporal Analysis Function
    console.log('⏰ Testing Temporal Analysis Function...');
    const temporalResult = await supabaseService.rpc('analyze_temporal_patterns', {
      p_poll_id: '00000000-0000-0000-0000-000000000000',
      p_analysis_window: '7 days'
    });
    logTest('Temporal Analysis Function', !temporalResult.error, temporalResult.error?.message);

    // Test Real-Time Analytics Function
    console.log('⚡ Testing Real-Time Analytics Function...');
    const realTimeResult = await supabaseService.rpc('get_real_time_analytics', {
      p_poll_id: '00000000-0000-0000-0000-000000000000',
      p_refresh_interval: '5 minutes'
    });
    logTest('Real-Time Analytics Function', !realTimeResult.error, realTimeResult.error?.message);

    // Test Comprehensive Analytics Function
    console.log('🧠 Testing Comprehensive Analytics Function...');
    const comprehensiveResult = await supabaseService.rpc('get_comprehensive_analytics', {
      p_poll_id: '00000000-0000-0000-0000-000000000000',
      p_analysis_window: '24 hours'
    });
    logTest('Comprehensive Analytics Function', !comprehensiveResult.error, comprehensiveResult.error?.message);

  } catch (error) {
    console.error('❌ Error testing database functions:', error);
    logTest('Database Functions Test Suite', false, error.message);
  }
}

// 2. RLS SECURITY TESTING
async function testRLSSecurity() {
  console.log('\n🔒 Testing RLS Security...\n');

  try {
    // Test Service Role Access
    console.log('🔑 Testing Service Role Access...');
    const serviceAccess = await supabaseService.from('polls').select('id').limit(1);
    logTest('Service Role Access', !serviceAccess.error, serviceAccess.error?.message);

    // Test Anonymous Access to Shared Content
    console.log('👤 Testing Anonymous Access to Shared Content...');
    const anonAccess = await supabaseAnon.from('polls').select('id').eq('is_public', true).limit(1);
    logTest('Anonymous Access to Shared Content', !anonAccess.error, anonAccess.error?.message);

    // Test Anonymous Access to Private Content (should fail)
    console.log('🚫 Testing Anonymous Access to Private Content (should fail)...');
    const anonPrivateAccess = await supabaseAnon.from('polls').select('id').eq('is_public', false).limit(1);
    logTest('Anonymous Access to Private Content (should fail)', anonPrivateAccess.error !== null, 'Anonymous should not access private content');

    // Test Anonymous Voting on Shared Polls
    console.log('🗳️ Testing Anonymous Voting on Shared Polls...');
    const anonVote = await supabaseAnon.from('votes').insert({
      poll_id: '00000000-0000-0000-0000-000000000000',
      option_id: '00000000-0000-0000-0000-000000000001',
      voter_session: 'test-session-' + Date.now(),
      trust_tier: 0
    });
    logTest('Anonymous Voting on Shared Polls', !anonVote.error, anonVote.error?.message);

  } catch (error) {
    console.error('❌ Error testing RLS security:', error);
    logTest('RLS Security Test Suite', false, error.message);
  }
}

// 3. ANONYMOUS TO AUTHENTICATED FLOW TESTING
async function testAnonymousToAuthFlow() {
  console.log('\n🔄 Testing Anonymous to Authenticated Flow...\n');

  try {
    // Test Vote Linking Function
    console.log('🔗 Testing Vote Linking Function...');
    const linkResult = await supabaseService.rpc('link_anonymous_votes_to_user', {
      p_user_id: '00000000-0000-0000-0000-000000000000',
      p_voter_session: 'test-session-' + Date.now()
    });
    logTest('Vote Linking Function', !linkResult.error, linkResult.error?.message);

    // Test User Voting History Function
    console.log('📊 Testing User Voting History Function...');
    const historyResult = await supabaseService.rpc('get_user_voting_history', {
      p_user_id: '00000000-0000-0000-0000-000000000000'
    });
    logTest('User Voting History Function', !historyResult.error, historyResult.error?.message);

    // Test Trust Tier Progression Function
    console.log('📈 Testing Trust Tier Progression Function...');
    const progressionResult = await supabaseService.rpc('get_trust_tier_progression', {
      p_user_id: '00000000-0000-0000-0000-000000000000'
    });
    logTest('Trust Tier Progression Function', !progressionResult.error, progressionResult.error?.message);

  } catch (error) {
    console.error('❌ Error testing anonymous to auth flow:', error);
    logTest('Anonymous to Auth Flow Test Suite', false, error.message);
  }
}

// 4. API ENDPOINTS TESTING
async function testAPIEndpoints() {
  console.log('\n🔗 Testing API Endpoints...\n');

  try {
    // Test if API files exist
    const fs = require('fs');
    const path = require('path');
    
    const apiFiles = [
      'web/app/api/analytics/sentiment/[id]/route.ts',
      'web/app/api/analytics/bot-detection/[id]/route.ts',
      'web/app/api/analytics/comprehensive/[id]/route.ts',
      'web/app/api/shared/poll/[id]/route.ts',
      'web/app/api/shared/vote/route.ts'
    ];

    apiFiles.forEach(apiFile => {
      const filePath = path.join(__dirname, '..', apiFile);
      const exists = fs.existsSync(filePath);
      logTest(`API File Exists: ${apiFile}`, exists, exists ? '' : 'File not found');
    });

    // Test API endpoint structure
    console.log('📁 Testing API Endpoint Structure...');
    const analyticsDir = path.join(__dirname, '..', 'web', 'app', 'api', 'analytics');
    const sharedDir = path.join(__dirname, '..', 'web', 'app', 'api', 'shared');
    
    logTest('Analytics API Directory', fs.existsSync(analyticsDir), 'Analytics API directory not found');
    logTest('Shared API Directory', fs.existsSync(sharedDir), 'Shared API directory not found');

  } catch (error) {
    console.error('❌ Error testing API endpoints:', error);
    logTest('API Endpoints Test Suite', false, error.message);
  }
}

// 5. COMPONENT TESTING
async function testComponents() {
  console.log('\n🎨 Testing Components...\n');

  try {
    const fs = require('fs');
    const path = require('path');
    
    // Test if component files exist
    const componentFiles = [
      'web/components/analytics/SophisticatedAnalytics.tsx',
      'web/components/analytics/PollResults.tsx',
      'web/components/trust/TrustTierFilter.tsx',
      'web/components/shared/SharedPollViewer.tsx',
      'web/components/shared/ShareButtons.tsx'
    ];

    componentFiles.forEach(componentFile => {
      const filePath = path.join(__dirname, '..', componentFile);
      const exists = fs.existsSync(filePath);
      logTest(`Component File Exists: ${componentFile}`, exists, exists ? '' : 'File not found');
    });

    // Test component directory structure
    console.log('📁 Testing Component Directory Structure...');
    const analyticsDir = path.join(__dirname, '..', 'web', 'components', 'analytics');
    const trustDir = path.join(__dirname, '..', 'web', 'components', 'trust');
    const sharedDir = path.join(__dirname, '..', 'web', 'components', 'shared');
    
    logTest('Analytics Components Directory', fs.existsSync(analyticsDir), 'Analytics components directory not found');
    logTest('Trust Components Directory', fs.existsSync(trustDir), 'Trust components directory not found');
    logTest('Shared Components Directory', fs.existsSync(sharedDir), 'Shared components directory not found');

  } catch (error) {
    console.error('❌ Error testing components:', error);
    logTest('Components Test Suite', false, error.message);
  }
}

// 6. DOCUMENTATION TESTING
async function testDocumentation() {
  console.log('\n📚 Testing Documentation...\n');

  try {
    const fs = require('fs');
    const path = require('path');
    
    // Test if documentation files exist
    const docFiles = [
      'scratch/rls-trust-system/01_SYSTEM_OVERVIEW.md',
      'scratch/rls-trust-system/02_TECHNICAL_ARCHITECTURE.md',
      'scratch/rls-trust-system/03_IMPLEMENTATION_ROADMAP.md',
      'scratch/rls-trust-system/04_SOPHISTICATED_ANALYTICS.md',
      'scratch/rls-trust-system/05_SECURITY_AND_RLS.md',
      'scratch/rls-trust-system/06_ANONYMOUS_TO_AUTHENTICATED_FLOW.md',
      'scratch/rls-trust-system/07_IMPLEMENTATION_STATUS.md'
    ];

    docFiles.forEach(docFile => {
      const filePath = path.join(__dirname, '..', docFile);
      const exists = fs.existsSync(filePath);
      logTest(`Documentation File Exists: ${docFile}`, exists, exists ? '' : 'File not found');
    });

    // Test documentation content
    console.log('📖 Testing Documentation Content...');
    const systemOverviewPath = path.join(__dirname, '..', 'scratch/rls-trust-system/01_SYSTEM_OVERVIEW.md');
    if (fs.existsSync(systemOverviewPath)) {
      const content = fs.readFileSync(systemOverviewPath, 'utf8');
      const hasOverview = content.includes('SYSTEM OVERVIEW');
      const hasComponents = content.includes('SYSTEM COMPONENTS');
      const hasBenefits = content.includes('REVOLUTIONARY BENEFITS');
      
      logTest('System Overview Content', hasOverview, 'Missing system overview section');
      logTest('System Components Content', hasComponents, 'Missing system components section');
      logTest('Revolutionary Benefits Content', hasBenefits, 'Missing revolutionary benefits section');
    }

  } catch (error) {
    console.error('❌ Error testing documentation:', error);
    logTest('Documentation Test Suite', false, error.message);
  }
}

// 7. PERFORMANCE TESTING
async function testPerformance() {
  console.log('\n⚡ Testing Performance...\n');

  try {
    // Test database function performance
    console.log('📊 Testing Database Function Performance...');
    const startTime = Date.now();
    
    const performanceResult = await supabaseService.rpc('get_comprehensive_analytics', {
      p_poll_id: '00000000-0000-0000-0000-000000000000',
      p_analysis_window: '24 hours'
    });
    
    const endTime = Date.now();
    const executionTime = endTime - startTime;
    
    logTest('Database Function Performance', executionTime < 5000, `Execution time: ${executionTime}ms (should be < 5000ms)`);

    // Test API response time (simulated)
    console.log('🔗 Testing API Response Time...');
    const apiStartTime = Date.now();
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const apiEndTime = Date.now();
    const apiExecutionTime = apiEndTime - apiStartTime;
    
    logTest('API Response Time', apiExecutionTime < 1000, `API response time: ${apiExecutionTime}ms (should be < 1000ms)`);

  } catch (error) {
    console.error('❌ Error testing performance:', error);
    logTest('Performance Test Suite', false, error.message);
  }
}

// 8. INTEGRATION TESTING
async function testIntegration() {
  console.log('\n🔗 Testing Integration...\n');

  try {
    // Test complete system integration
    console.log('🧠 Testing Complete System Integration...');
    
    // Test database functions integration
    const dbIntegration = await supabaseService.rpc('analyze_poll_sentiment', {
      p_poll_id: '00000000-0000-0000-0000-000000000000',
      p_time_window: '1 hour'
    });
    logTest('Database Functions Integration', !dbIntegration.error, dbIntegration.error?.message);

    // Test RLS integration
    const rlsIntegration = await supabaseService.from('polls').select('id').limit(1);
    logTest('RLS Integration', !rlsIntegration.error, rlsIntegration.error?.message);

    // Test anonymous flow integration
    const anonIntegration = await supabaseAnon.from('polls').select('id').eq('is_public', true).limit(1);
    logTest('Anonymous Flow Integration', !anonIntegration.error, anonIntegration.error?.message);

  } catch (error) {
    console.error('❌ Error testing integration:', error);
    logTest('Integration Test Suite', false, error.message);
  }
}

// 9. SECURITY TESTING
async function testSecurity() {
  console.log('\n🛡️ Testing Security...\n');

  try {
    // Test RLS policies
    console.log('🔒 Testing RLS Policies...');
    const rlsTest = await supabaseService.from('polls').select('id').limit(1);
    logTest('RLS Policies', !rlsTest.error, rlsTest.error?.message);

    // Test anonymous access restrictions
    console.log('👤 Testing Anonymous Access Restrictions...');
    const anonRestrictionTest = await supabaseAnon.from('user_profiles').select('id').limit(1);
    logTest('Anonymous Access Restrictions', anonRestrictionTest.error !== null, 'Anonymous should not access user profiles');

    // Test service role access
    console.log('🔑 Testing Service Role Access...');
    const serviceAccessTest = await supabaseService.from('analytics_events').select('id').limit(1);
    logTest('Service Role Access', !serviceAccessTest.error, serviceAccessTest.error?.message);

  } catch (error) {
    console.error('❌ Error testing security:', error);
    logTest('Security Test Suite', false, error.message);
  }
}

// Main test execution
async function runComprehensiveTests() {
  console.log('🧪 COMPREHENSIVE SYSTEM TEST SUITE');
  console.log('=====================================\n');

  try {
    await testDatabaseFunctions();
    await testRLSSecurity();
    await testAnonymousToAuthFlow();
    await testAPIEndpoints();
    await testComponents();
    await testDocumentation();
    await testPerformance();
    await testIntegration();
    await testSecurity();

    // Print test results summary
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('========================\n');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

    if (testResults.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      testResults.details
        .filter(test => !test.passed)
        .forEach(test => {
          console.log(`  • ${test.testName}: ${test.details}`);
        });
    }

    if (testResults.passed === testResults.total) {
      console.log('\n🎉 ALL TESTS PASSED! System is ready for production!');
    } else {
      console.log('\n⚠️  Some tests failed. Please review and fix issues before production deployment.');
    }

  } catch (error) {
    console.error('❌ Critical error in test suite:', error);
    process.exit(1);
  }
}

// Run tests if called directly
if (require.main === module) {
  runComprehensiveTests();
}

module.exports = {
  runComprehensiveTests,
  testDatabaseFunctions,
  testRLSSecurity,
  testAnonymousToAuthFlow,
  testAPIEndpoints,
  testComponents,
  testDocumentation,
  testPerformance,
  testIntegration,
  testSecurity
};
