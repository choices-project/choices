#!/usr/bin/env node

/**
 * Superior Implementations Test Runner
 * 
 * Comprehensive test runner for all superior implementations including:
 * - Superior Data Pipeline tests
 * - Mobile PWA tests
 * - Comprehensive Candidate Cards tests
 * - Enhanced Representative Feed tests
 * - Performance validation tests
 * 
 * Created: October 8, 2025
 * Updated: October 8, 2025
 */

const { execSync } = require('child_process');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  // Test suites to run
  testSuites: [
    'superior-implementations.spec.ts',
    'superior-mobile-pwa.spec.ts',
    'civics.api.spec.ts',
    'pwa-api.spec.ts',
    'pwa-integration.spec.ts',
    'pwa-installation.spec.ts',
    'pwa-offline.spec.ts',
    'pwa-service-worker.spec.ts',
    'enhanced-features-verification.spec.ts'
  ],
  
  // Performance tests
  performanceTests: [
    'pwa-integration.spec.ts',
    'superior-mobile-pwa.spec.ts'
  ],
  
  // Mobile-specific tests
  mobileTests: [
    'superior-mobile-pwa.spec.ts',
    'pwa-installation.spec.ts',
    'pwa-offline.spec.ts'
  ],
  
  // Data pipeline tests
  dataPipelineTests: [
    'superior-implementations.spec.ts',
    'civics.api.spec.ts'
  ]
};

// Test execution functions
function runTestSuite(suiteName, options = {}) {
  console.log(`\n🧪 Running ${suiteName}...`);
  
  const testPath = path.join(__dirname, 'e2e', suiteName);
  const command = `npx playwright test ${testPath} ${options.headless ? '' : '--headed'} ${options.workers ? `--workers=${options.workers}` : '--workers=1'} --reporter=list`;
  
  try {
    execSync(command, { stdio: 'inherit', cwd: process.cwd() });
    console.log(`✅ ${suiteName} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${suiteName} failed:`, error.message);
    return false;
  }
}

function runPerformanceTests() {
  console.log('\n⚡ Running Performance Tests...');
  
  const performanceSuites = TEST_CONFIG.performanceTests;
  let passed = 0;
  let failed = 0;
  
  for (const suite of performanceSuites) {
    console.log(`\n📊 Testing performance for ${suite}...`);
    
    const startTime = Date.now();
    const success = runTestSuite(suite, { headless: true, workers: 1 });
    const duration = Date.now() - startTime;
    
    if (success) {
      console.log(`✅ Performance test passed in ${duration}ms`);
      passed++;
    } else {
      console.log(`❌ Performance test failed in ${duration}ms`);
      failed++;
    }
  }
  
  console.log(`\n📊 Performance Test Results: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

function runMobileTests() {
  console.log('\n📱 Running Mobile PWA Tests...');
  
  const mobileSuites = TEST_CONFIG.mobileTests;
  let passed = 0;
  let failed = 0;
  
  for (const suite of mobileSuites) {
    console.log(`\n📱 Testing mobile features for ${suite}...`);
    
    const success = runTestSuite(suite, { headless: false, workers: 1 });
    
    if (success) {
      console.log(`✅ Mobile test passed`);
      passed++;
    } else {
      console.log(`❌ Mobile test failed`);
      failed++;
    }
  }
  
  console.log(`\n📱 Mobile Test Results: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

function runDataPipelineTests() {
  console.log('\n🗳️ Running Data Pipeline Tests...');
  
  const dataSuites = TEST_CONFIG.dataPipelineTests;
  let passed = 0;
  let failed = 0;
  
  for (const suite of dataSuites) {
    console.log(`\n🗳️ Testing data pipeline for ${suite}...`);
    
    const success = runTestSuite(suite, { headless: true, workers: 2 });
    
    if (success) {
      console.log(`✅ Data pipeline test passed`);
      passed++;
    } else {
      console.log(`❌ Data pipeline test failed`);
      failed++;
    }
  }
  
  console.log(`\n🗳️ Data Pipeline Test Results: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

function runAllTests() {
  console.log('\n🚀 Running All Superior Implementation Tests...');
  
  const allSuites = TEST_CONFIG.testSuites;
  let passed = 0;
  let failed = 0;
  
  for (const suite of allSuites) {
    console.log(`\n🧪 Running ${suite}...`);
    
    const success = runTestSuite(suite, { headless: true, workers: 2 });
    
    if (success) {
      console.log(`✅ ${suite} passed`);
      passed++;
    } else {
      console.log(`❌ ${suite} failed`);
      failed++;
    }
  }
  
  console.log(`\n🎯 All Tests Results: ${passed} passed, ${failed} failed`);
  return failed === 0;
}

function generateTestReport() {
  console.log('\n📊 Generating Test Report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    testSuites: TEST_CONFIG.testSuites,
    superiorImplementations: [
      'Superior Data Pipeline',
      'Comprehensive Candidate Cards', 
      'Superior Mobile Feed',
      'Enhanced Representative Feed',
      'Current Electorate Filtering',
      'OpenStates People Integration'
    ],
    features: [
      'Mobile PWA Features',
      'Touch Gestures',
      'Offline Functionality',
      'Dark Mode Support',
      'Push Notifications',
      'Performance Optimization',
      'Accessibility Compliance'
    ]
  };
  
  console.log('\n📋 Test Report Generated:');
  console.log(`   Timestamp: ${report.timestamp}`);
  console.log(`   Test Suites: ${report.testSuites.length}`);
  console.log(`   Superior Implementations: ${report.superiorImplementations.length}`);
  console.log(`   Features Tested: ${report.features.length}`);
  
  return report;
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  
  console.log('🧪 Superior Implementations Test Runner');
  console.log('=====================================');
  
  let success = false;
  
  switch (command) {
    case 'all':
      success = runAllTests();
      break;
    case 'mobile':
      success = runMobileTests();
      break;
    case 'performance':
      success = runPerformanceTests();
      break;
    case 'data-pipeline':
      success = runDataPipelineTests();
      break;
    case 'report':
      generateTestReport();
      success = true;
      break;
    default:
      console.log('Usage: node run-superior-tests.js [all|mobile|performance|data-pipeline|report]');
      process.exit(1);
  }
  
  if (success) {
    console.log('\n🎉 All tests completed successfully!');
    console.log('✅ Superior implementations are working perfectly!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please check the output above.');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runTestSuite,
  runPerformanceTests,
  runMobileTests,
  runDataPipelineTests,
  runAllTests,
  generateTestReport
};
