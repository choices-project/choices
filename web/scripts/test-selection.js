#!/usr/bin/env node

/**
 * Test Selection Script
 * 
 * This script provides different test execution strategies based on
 * the testing roadmap to perfection.
 * 
 * Created: January 27, 2025
 * Updated: January 27, 2025
 */

const { execSync } = require('child_process');
const path = require('path');

class TestSelector {
  constructor() {
    this.testCategories = {
      fast: [
        'basic-navigation.spec.ts',
        'authentication.spec.ts',
        'admin-dashboard.spec.ts'
      ],
      medium: [
        'poll-creation.spec.ts',
        'voting-system.spec.ts',
        'onboarding-flow.spec.ts'
      ],
      comprehensive: [
        'performance-challenges.spec.ts',
        'security-challenges.spec.ts',
        'accessibility-challenges.spec.ts',
        'edge-case-challenges.spec.ts',
        'data-integrity-challenges.spec.ts',
        'performance-optimization.spec.ts',
        'security-optimization.spec.ts'
      ]
    };
  }

  async runFastTests() {
    console.log('🚀 Running Fast Tests (< 30 seconds)');
    console.log('=====================================');
    
    const fastTests = this.testCategories.fast;
    const testFiles = fastTests.map(test => `tests/playwright/e2e/${test}`).join(' ');
    
    try {
      execSync(`npx playwright test ${testFiles}  --reporter=line`, {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Fast tests completed successfully!');
    } catch (error) {
      console.error('❌ Fast tests failed:', error.message);
      process.exit(1);
    }
  }

  async runMediumTests() {
    console.log('⚡ Running Medium Tests (< 1 minute)');
    console.log('===================================');
    
    const mediumTests = this.testCategories.medium;
    const testFiles = mediumTests.map(test => `tests/playwright/e2e/${test}`).join(' ');
    
    try {
      execSync(`npx playwright test ${testFiles}  --reporter=line`, {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Medium tests completed successfully!');
    } catch (error) {
      console.error('❌ Medium tests failed:', error.message);
      process.exit(1);
    }
  }

  async runComprehensiveTests() {
    console.log('🎯 Running Comprehensive Tests (< 3 minutes)');
    console.log('============================================');
    
    const comprehensiveTests = this.testCategories.comprehensive;
    const testFiles = comprehensiveTests.map(test => `tests/playwright/e2e/${test}`).join(' ');
    
    try {
      execSync(`npx playwright test ${testFiles}  --reporter=line`, {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Comprehensive tests completed successfully!');
    } catch (error) {
      console.error('❌ Comprehensive tests failed:', error.message);
      process.exit(1);
    }
  }

  async runAllTests() {
    console.log('🚀 Running All Tests (< 5 minutes)');
    console.log('===================================');
    
    try {
      execSync(`npx playwright test  --reporter=line`, {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ All tests completed successfully!');
    } catch (error) {
      console.error('❌ All tests failed:', error.message);
      process.exit(1);
    }
  }

  async runPerformanceTests() {
    console.log('⚡ Running Performance Tests');
    console.log('============================');
    
    try {
      execSync(`npx playwright test tests/playwright/e2e/performance-challenges.spec.ts tests/playwright/e2e/performance-optimization.spec.ts tests/playwright/e2e/performance-public-pages.spec.ts  --reporter=line`, {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Performance tests completed successfully!');
    } catch (error) {
      console.error('❌ Performance tests failed:', error.message);
      process.exit(1);
    }
  }

  async runSecurityTests() {
    console.log('🔒 Running Security Tests');
    console.log('==========================');
    
    try {
      execSync(`npx playwright test tests/playwright/e2e/security-challenges.spec.ts tests/playwright/e2e/security-optimization.spec.ts  --reporter=line`, {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Security tests completed successfully!');
    } catch (error) {
      console.error('❌ Security tests failed:', error.message);
      process.exit(1);
    }
  }

  async runAccessibilityTests() {
    console.log('♿ Running Accessibility Tests');
    console.log('==============================');

    try {
      execSync(`npx playwright test tests/playwright/e2e/accessibility-public-pages.spec.ts  --reporter=line`, {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      console.log('✅ Accessibility tests completed successfully!');
    } catch (error) {
      console.error('❌ Accessibility tests failed:', error.message);
      process.exit(1);
    }
  }

  async showHelp() {
    console.log('🎯 Test Selection Script');
    console.log('========================');
    console.log('');
    console.log('Usage: node scripts/test-selection.js [command]');
    console.log('');
    console.log('Commands:');
    console.log('  fast           Run fast tests (< 30 seconds)');
    console.log('  medium         Run medium tests (< 1 minute)');
    console.log('  comprehensive  Run comprehensive tests (< 3 minutes)');
    console.log('  all            Run all tests (< 5 minutes)');
    console.log('  performance    Run performance tests only');
    console.log('  security       Run security tests only');
    console.log('  accessibility  Run accessibility tests only');
    console.log('  help           Show this help message');
    console.log('');
    console.log('Examples:');
    console.log('  node scripts/test-selection.js fast');
    console.log('  node scripts/test-selection.js comprehensive');
    console.log('  node scripts/test-selection.js all');
  }
}

// Main execution
async function main() {
  const selector = new TestSelector();
  const command = process.argv[2];

  switch (command) {
    case 'fast':
      await selector.runFastTests();
      break;
    case 'medium':
      await selector.runMediumTests();
      break;
    case 'comprehensive':
      await selector.runComprehensiveTests();
      break;
    case 'all':
      await selector.runAllTests();
      break;
    case 'performance':
      await selector.runPerformanceTests();
      break;
    case 'security':
      await selector.runSecurityTests();
      break;
    case 'accessibility':
      await selector.runAccessibilityTests();
      break;
    case 'help':
    case '--help':
    case '-h':
      await selector.showHelp();
      break;
    default:
      console.error('❌ Unknown command:', command);
      await selector.showHelp();
      process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { TestSelector };
