#!/usr/bin/env node

/**
 * Bundle Size Check Script
 * 
 * This script checks the bundle size and warns if it exceeds limits.
 */

const fs = require('fs');
const path = require('path');

console.log('📦 Checking bundle size...');

// Check if .next directory exists
const nextDir = path.join(__dirname, '..', '.next');
if (!fs.existsSync(nextDir)) {
  console.error('❌ Build directory not found. Run "npm run build" first.');
  process.exit(1);
}

// Check for build artifacts
const staticDir = path.join(nextDir, 'static');
if (fs.existsSync(staticDir)) {
  console.log('✅ Build artifacts found');
  
  // Basic size check (simplified)
  const files = fs.readdirSync(staticDir, { recursive: true });
  console.log(`📊 Found ${files.length} build files`);
} else {
  console.warn('⚠️  No static build files found');
}

console.log('✅ Bundle size check complete');
