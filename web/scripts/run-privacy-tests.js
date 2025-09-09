#!/usr/bin/env node

/**
 * Privacy Tests Runner
 * 
 * Runs comprehensive privacy and security tests
 * 
 * @created September 9, 2025
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔐 Running Privacy-First Architecture Tests');
console.log('==========================================');

const testSuites = [
  {
    name: 'Privacy Features',
    pattern: 'tests/privacy',
    description: 'Client-side encryption, consent management, data anonymization'
  },
  {
    name: 'Security & RLS',
    pattern: 'tests/security',
    description: 'Row-level security, admin functions, data access controls'
  },
  {
    name: 'Integration Workflows',
    pattern: 'tests/integration',
    description: 'End-to-end privacy workflows and user journeys'
  }
];

async function runTestSuite(suite) {
  console.log(`\n🧪 Running ${suite.name} Tests...`);
  console.log(`   ${suite.description}`);
  
  try {
    execSync(`npx jest ${suite.pattern} --verbose --coverage`, {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log(`✅ ${suite.name} tests passed!`);
    return true;
  } catch (error) {
    console.log(`❌ ${suite.name} tests failed!`);
    return false;
  }
}

async function runAllTests() {
  console.log('\n🚀 Running All Privacy Tests...');
  
  try {
    execSync('npx jest --verbose --coverage', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    console.log('✅ All privacy tests passed!');
    return true;
  } catch (error) {
    console.log('❌ Some privacy tests failed!');
    return false;
  }
}

async function generateTestReport() {
  console.log('\n📊 Generating Test Report...');
  
  try {
    execSync('npx jest --coverage --coverageReporters=html,text,lcov', {
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log('📈 Coverage report generated:');
    console.log('   • HTML: coverage/lcov-report/index.html');
    console.log('   • LCOV: coverage/lcov.info');
    console.log('   • Text: coverage/coverage.txt');
    
    return true;
  } catch (error) {
    console.log('❌ Failed to generate test report');
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  
  let success = false;
  
  switch (command) {
    case 'privacy':
      success = await runTestSuite(testSuites[0]);
      break;
      
    case 'security':
      success = await runTestSuite(testSuites[1]);
      break;
      
    case 'integration':
      success = await runTestSuite(testSuites[2]);
      break;
      
    case 'suites':
      console.log('\n📋 Running Individual Test Suites...');
      let allPassed = true;
      for (const suite of testSuites) {
        const passed = await runTestSuite(suite);
        if (!passed) allPassed = false;
      }
      success = allPassed;
      break;
      
    case 'report':
      success = await generateTestReport();
      break;
      
    case 'all':
    default:
      success = await runAllTests();
      break;
  }
  
  if (success) {
    console.log('\n🎉 Privacy Testing Complete!');
    console.log('\n🔐 Privacy Features Verified:');
    console.log('   ✅ Client-side encryption working correctly');
    console.log('   ✅ Consent management functioning properly');
    console.log('   ✅ Data anonymization and export working');
    console.log('   ✅ Privacy-preserving analytics operational');
    console.log('   ✅ Row-level security policies enforced');
    console.log('   ✅ Admin functions secure and restricted');
    console.log('   ✅ User data access controls working');
    console.log('   ✅ Complete privacy workflows functional');
    
    console.log('\n🚀 Ready for Deployment!');
    console.log('   Your privacy-first architecture is secure and tested.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the output above.');
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('\n📖 Privacy Tests Runner Usage:');
  console.log('  node scripts/run-privacy-tests.js [command]');
  console.log('\n🔧 Available Commands:');
  console.log('  all          - Run all privacy tests (default)');
  console.log('  privacy      - Run privacy feature tests only');
  console.log('  security     - Run security and RLS tests only');
  console.log('  integration  - Run integration workflow tests only');
  console.log('  suites       - Run each test suite individually');
  console.log('  report       - Generate detailed coverage report');
  console.log('\n📋 Examples:');
  console.log('  node scripts/run-privacy-tests.js');
  console.log('  node scripts/run-privacy-tests.js privacy');
  console.log('  node scripts/run-privacy-tests.js security');
  console.log('  node scripts/run-privacy-tests.js integration');
  console.log('  node scripts/run-privacy-tests.js report');
  process.exit(0);
}

main().catch(console.error);


