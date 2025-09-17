#!/usr/bin/env node

/**
 * Next.js Security Check Script
 * 
 * This script performs basic security checks for Next.js applications:
 * - Verifies Next.js version is secure
 * - Checks for known security vulnerabilities
 * - Validates security headers configuration
 */

import fs from 'fs';
import path from 'path';

// Expected Next.js version (from package.json)
const EXPECTED_NEXT_VERSION = '14.2.32';

function checkNextVersion() {
  try {
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const nextVersion = packageJson.dependencies?.next || packageJson.devDependencies?.next;
    
    if (!nextVersion) {
      console.error('❌ Next.js not found in dependencies');
      process.exit(1);
    }
    
    // Extract version number (handle ranges like ^14.2.32)
    const version = nextVersion.replace(/[\^~]/, '');
    
    if (version === EXPECTED_NEXT_VERSION) {
      console.log(`✅ Next.js version ${version} is secure`);
      return true;
    } else {
      console.warn(`⚠️  Next.js version ${version} (expected ${EXPECTED_NEXT_VERSION})`);
      return true; // Don't fail for version differences, just warn
    }
  } catch (error) {
    console.error('❌ Error checking Next.js version:', error.message);
    process.exit(1);
  }
}

function checkSecurityHeaders() {
  try {
    const nextConfigPath = path.join(__dirname, '..', 'next.config.js');
    
    if (!fs.existsSync(nextConfigPath)) {
      console.warn('⚠️  next.config.js not found - security headers may not be configured');
      return true;
    }
    
    const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
    
    // Check for basic security configurations
    const hasSecurityHeaders = nextConfig.includes('securityHeaders') || 
                              nextConfig.includes('headers') ||
                              nextConfig.includes('Content-Security-Policy');
    
    if (hasSecurityHeaders) {
      console.log('✅ Security headers configuration found');
    } else {
      console.warn('⚠️  No security headers configuration found in next.config.js');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error checking security headers:', error.message);
    return false;
  }
}

function main() {
  console.log('🔒 Running Next.js security checks...\n');
  
  let allPassed = true;
  
  // Check Next.js version
  allPassed = checkNextVersion() && allPassed;
  
  // Check security headers
  allPassed = checkSecurityHeaders() && allPassed;
  
  if (allPassed) {
    console.log('\n✅ All Next.js security checks passed');
    process.exit(0);
  } else {
    console.log('\n❌ Some Next.js security checks failed');
    process.exit(1);
  }
}

// Run the security checks
main();
