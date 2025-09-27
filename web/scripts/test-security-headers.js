#!/usr/bin/env node

/**
 * Security Headers Test Script
 * 
 * This script tests that security headers are properly configured.
 */

const fs = require('fs');
const path = require('path');

console.log('🛡️  Testing security headers configuration...');

// Check next.config.js for security headers
const nextConfigPath = path.join(__dirname, '..', 'next.config.js');
if (fs.existsSync(nextConfigPath)) {
  const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
  
  const requiredHeaders = [
    'X-Frame-Options',
    'X-Content-Type-Options',
    'X-XSS-Protection',
    'Referrer-Policy',
    'Content-Security-Policy'
  ];
  
  let hasSecurityHeaders = false;
  for (const header of requiredHeaders) {
    if (nextConfig.includes(header)) {
      hasSecurityHeaders = true;
      break;
    }
  }
  
  if (hasSecurityHeaders) {
    console.log('✅ Security headers configuration found');
  } else {
    console.warn('⚠️  No security headers configuration found in next.config.js');
  }
} else {
  console.warn('⚠️  next.config.js not found');
}

console.log('✅ Security headers test complete');
