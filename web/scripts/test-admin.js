#!/usr/bin/env node

/**
 * Admin System Test Runner
 * 
 * This script runs comprehensive tests for the admin system:
 * 1. Unit tests for admin authentication and APIs
 * 2. End-to-end tests for admin functionality
 * 3. Security tests to ensure proper access control
 */

import { execSync } from 'child_process';

console.log('🧪 Admin System Test Runner');
console.log('============================\n');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n${colors.cyan}Running: ${description}${colors.reset}`);
  log(`${colors.yellow}Command: ${command}${colors.reset}\n`);
  
  try {
    execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    log(`✅ ${description} completed successfully`, 'green');
    return true;
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    log(`Error: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const testType = args[0] || 'all';
  
  log(`Starting admin system tests (${testType})...`, 'bright');
  
  let allPassed = true;
  
  switch (testType) {
    case 'unit':
      log('\n📋 Running Admin Unit Tests', 'blue');
      allPassed = runCommand(
        'npm test -- tests/admin',
        'Admin Unit Tests'
      );
      break;
      
    case 'e2e':
      log('\n🌐 Running Admin E2E Tests', 'blue');
      allPassed = runCommand(
        'npm run test:e2e -- tests/e2e/admin-system.spec.ts',
        'Admin E2E Tests'
      );
      break;
      
    case 'auth':
      log('\n🔐 Running Admin Authentication Tests', 'blue');
      allPassed = runCommand(
        'npm test -- tests/admin/admin-auth.test.ts',
        'Admin Authentication Tests'
      );
      break;
      
    case 'apis':
      log('\n🔌 Running Admin API Tests', 'blue');
      allPassed = runCommand(
        'npm test -- tests/admin/admin-apis.test.ts',
        'Admin API Tests'
      );
      break;
      
    case 'security':
      log('\n🛡️ Running Admin Security Tests', 'blue');
      allPassed = runCommand(
        'npm run test:e2e -- tests/e2e/admin-system.spec.ts --grep "Admin Security"',
        'Admin Security Tests'
      );
      break;
      
    case 'all':
    default:
      log('\n🚀 Running All Admin Tests', 'blue');
      
      // Run unit tests
      log('\n📋 Step 1: Admin Unit Tests', 'magenta');
      const unitPassed = runCommand(
        'npm test -- tests/admin',
        'Admin Unit Tests'
      );
      
      // Run E2E tests
      log('\n🌐 Step 2: Admin E2E Tests', 'magenta');
      const e2ePassed = runCommand(
        'npm run test:e2e -- tests/e2e/admin-system.spec.ts',
        'Admin E2E Tests'
      );
      
      allPassed = unitPassed && e2ePassed;
      break;
  }
  
  // Summary
  log('\n' + '='.repeat(50), 'bright');
  if (allPassed) {
    log('🎉 All admin tests passed!', 'green');
    log('✅ Admin system is ready for production', 'green');
  } else {
    log('❌ Some admin tests failed', 'red');
    log('🔧 Please fix the failing tests before deploying', 'red');
    process.exit(1);
  }
  log('='.repeat(50), 'bright');
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  log('\nAdmin System Test Runner', 'bright');
  log('Usage: node scripts/test-admin.js [test-type]', 'cyan');
  log('\nTest Types:', 'yellow');
  log('  all      - Run all admin tests (default)', 'reset');
  log('  unit     - Run only unit tests', 'reset');
  log('  e2e      - Run only end-to-end tests', 'reset');
  log('  auth     - Run only authentication tests', 'reset');
  log('  apis     - Run only API tests', 'reset');
  log('  security - Run only security tests', 'reset');
  log('\nExamples:', 'yellow');
  log('  node scripts/test-admin.js', 'reset');
  log('  node scripts/test-admin.js unit', 'reset');
  log('  node scripts/test-admin.js e2e', 'reset');
  log('  node scripts/test-admin.js security', 'reset');
  process.exit(0);
}

main().catch(error => {
  log(`\n💥 Test runner failed: ${error.message}`, 'red');
  process.exit(1);
});
