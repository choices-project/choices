#!/usr/bin/env node

/**
 * Install Test Dependencies Script
 * 
 * Installs the necessary testing dependencies for our privacy-first architecture
 * 
 * @created September 9, 2025
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Installing Test Dependencies...');

const testDependencies = [
  '@jest/globals',
  '@testing-library/jest-dom',
  '@testing-library/react',
  '@testing-library/user-event',
  'jest',
  'jest-environment-jsdom',
  'ts-jest',
  '@types/jest'
];

try {
  // Install dependencies
  console.log('📦 Installing Jest and testing libraries...');
  execSync(`npm install --save-dev ${testDependencies.join(' ')}`, {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  console.log('✅ Test dependencies installed successfully!');
  
  console.log('\n🎯 Available Test Commands:');
  console.log('  npm run test              - Run all tests');
  console.log('  npm run test:watch        - Run tests in watch mode');
  console.log('  npm run test:coverage     - Run tests with coverage');
  console.log('  npm run test:privacy      - Run privacy tests only');
  console.log('  npm run test:security     - Run security tests only');
  console.log('  npm run test:integration  - Run integration tests only');
  
  console.log('\n📋 Test Structure:');
  console.log('  tests/privacy/           - Privacy feature tests');
  console.log('  tests/security/          - Security and RLS tests');
  console.log('  tests/integration/       - End-to-end workflow tests');
  
  console.log('\n🔐 Privacy Tests Include:');
  console.log('  • Client-side encryption');
  console.log('  • Consent management');
  console.log('  • Data anonymization');
  console.log('  • User data export');
  console.log('  • Privacy-preserving analytics');
  
  console.log('\n🛡️ Security Tests Include:');
  console.log('  • Row-level security policies');
  console.log('  • Admin function security');
  console.log('  • Data access controls');
  console.log('  • Function authorization');
  
  console.log('\n🔄 Integration Tests Include:');
  console.log('  • Complete user workflows');
  console.log('  • Privacy dashboard functionality');
  console.log('  • Consent management flows');
  console.log('  • Data encryption/decryption cycles');

} catch (error) {
  console.error('❌ Error installing test dependencies:', error.message);
  process.exit(1);
}
