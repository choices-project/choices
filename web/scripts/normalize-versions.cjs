#!/usr/bin/env node
/**
 * Normalize package.json versions to use tilde (~) prefix
 * This allows automatic patch updates (security fixes) while preventing breaking changes
 */

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

function normalizeVersions(deps) {
  if (!deps) return deps;
  
  const normalized = {};
  for (const [name, version] of Object.entries(deps)) {
    // Remove any existing prefix (^, ~, >=, etc)
    const cleanVersion = version.replace(/^[\^~>=<]+/, '');
    
    // Add tilde prefix for production stability
    // Tilde allows PATCH updates only (1.2.3 -> 1.2.x)
    normalized[name] = `~${cleanVersion}`;
  }
  return normalized;
}

// Normalize dependencies
if (packageJson.dependencies) {
  packageJson.dependencies = normalizeVersions(packageJson.dependencies);
}

// Normalize devDependencies  
if (packageJson.devDependencies) {
  packageJson.devDependencies = normalizeVersions(packageJson.devDependencies);
}

// Write back with proper formatting
fs.writeFileSync(
  packageJsonPath,
  JSON.stringify(packageJson, null, 2) + '\n',
  'utf8'
);

console.log('✅ Normalized all package versions to use tilde (~) prefix');
console.log('✅ Production stability: Automatic security patches, no breaking changes');

