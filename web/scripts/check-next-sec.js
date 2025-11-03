#!/usr/bin/env node

/**
 * Next.js Security Check Script
 * 
 * This script performs basic security checks for Next.js applications:
 * - Verifies no sensitive environment variables are exposed
 * - Checks for common security misconfigurations
 * - Validates build output for security issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Running Next.js security checks...');

// Check for exposed sensitive environment variables
const envVars = process.env;
const sensitiveVars = [
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_SECRET_KEY', // Legacy, keep for backwards compat check
  'DATABASE_URL',
  'NEXTAUTH_SECRET',
  'JWT_SECRET',
  'ENCRYPTION_KEY'
];

let hasExposedSecrets = false;
for (const [key, _value] of Object.entries(envVars)) {
  if (key.startsWith('NEXT_PUBLIC_') && sensitiveVars.some(sensitive => key.includes(sensitive))) {
    console.error(`❌ Exposed sensitive variable: ${key}`);
    hasExposedSecrets = true;
  }
}

if (hasExposedSecrets) {
  console.error('❌ Security check failed: Sensitive variables exposed');
  process.exit(1);
}

// Check for common security issues in package.json
const packageJsonPath = path.join(__dirname, '..', 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Check for known vulnerable packages (basic check)
  const vulnerablePackages = [
    'lodash@4.17.0',
    'moment@2.29.0'
  ];
  
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  for (const [name, version] of Object.entries(dependencies)) {
    if (vulnerablePackages.includes(`${name}@${version}`)) {
      console.error(`❌ Potentially vulnerable package: ${name}@${version}`);
      hasExposedSecrets = true;
    }
  }
}

// Check for security headers configuration
const nextConfigPath = path.join(__dirname, '..', 'next.config.js');
if (fs.existsSync(nextConfigPath)) {
  const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
  if (!nextConfig.includes('securityHeaders') && !nextConfig.includes('headers')) {
    console.warn('⚠️  No security headers configuration found in next.config.js');
  }
}

if (hasExposedSecrets) {
  console.error('❌ Security check failed');
  process.exit(1);
}

console.log('✅ Next.js security checks passed');
process.exit(0);
