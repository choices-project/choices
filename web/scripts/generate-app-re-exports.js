#!/usr/bin/env node

/**
 * Generate app/ re-exports for feature-based organization
 * This script creates re-export files in app/ that point to features/
 */

const fs = require('fs');
const path = require('path');

const featuresDir = path.join(__dirname, '../features');
const appDir = path.join(__dirname, '../app');

// Function to create re-export file
function createReExport(appPath, featurePath) {
  const dir = path.dirname(appPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const relativePath = path.relative(dir, featurePath).replace(/\\/g, '/');
  const content = `// Re-export from features
export { default } from '@/${relativePath}'
`;
  
  fs.writeFileSync(appPath, content);
  console.log(`Created re-export: ${appPath} -> ${featurePath}`);
}

// Function to recursively find pages in features
function findPages(dir, basePath = '') {
  const pages = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      pages.push(...findPages(fullPath, path.join(basePath, item)));
    } else if (item === 'page.tsx' || item === 'page.ts') {
      pages.push({
        featurePath: path.join(basePath, item),
        appPath: path.join(appDir, basePath, item)
      });
    }
  }
  
  return pages;
}

// Main execution
console.log('Generating app/ re-exports for feature-based organization...');

// Find all pages in features
const pages = findPages(featuresDir);

// Create re-exports
for (const page of pages) {
  createReExport(page.appPath, path.join(featuresDir, page.featurePath));
}

console.log(`Generated ${pages.length} re-export files`);
