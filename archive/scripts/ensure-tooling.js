#!/usr/bin/env node

/**
 * Ensure Tooling Script
 * 
 * This script ensures required tooling is available before installation.
 * It's run as a preinstall hook to verify the environment.
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Ensuring required tooling...');

// Check Node.js version
const nodeVersion = process.version;
const requiredVersion = '22.19.0';
if (nodeVersion !== `v${requiredVersion}`) {
  console.warn(`⚠️  Node.js version mismatch. Expected v${requiredVersion}, got ${nodeVersion}`);
  console.warn('   This may cause issues. Consider using the correct version.');
}

// Check npm version
const npmVersion = process.env.npm_version || 'unknown';
console.log(`📦 npm version: ${npmVersion}`);

// Ensure required directories exist
const requiredDirs = [
  'node_modules',
  '.next',
  'public'
];

for (const dir of requiredDirs) {
  const dirPath = path.join(__dirname, '..', dir);
  if (!fs.existsSync(dirPath)) {
    console.log(`📁 Creating directory: ${dir}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

console.log('✅ Tooling check complete');
