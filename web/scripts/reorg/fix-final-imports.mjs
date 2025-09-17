#!/usr/bin/env node

/**
 * Fix Final Import Issues
 * 
 * Fixes the last few remaining import path issues.
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..', '..');

// Final import fixes
const importFixes = [
  {
    pattern: /from ['"]@\/lib\/device-flow['"]/g,
    replacement: "from '@/lib/core/auth/device-flow'"
  },
  {
    pattern: /from ['"]@\/lib\/auth-utils['"]/g,
    replacement: "from '@/lib/core/auth/utils'"
  }
];

console.log('🔧 Fixing final import issues...\n');

let totalFixes = 0;
let filesFixed = 0;

// Recursively find all TypeScript/JavaScript files
function findTsFiles(dir) {
  const files = [];
  
  try {
    const entries = readdirSync(dir);
    
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules, .next, and other build directories
        if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(entry)) {
          files.push(...findTsFiles(fullPath));
        }
      } else if (stat.isFile()) {
        const ext = entry.split('.').pop();
        if (['ts', 'tsx', 'js', 'jsx'].includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error reading directory ${dir}:`, error.message);
  }
  
  return files;
}

// Fix imports in a file
function fixFileImports(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    let updatedContent = content;
    let fileFixes = 0;
    
    importFixes.forEach(fix => {
      const matches = updatedContent.match(fix.pattern);
      if (matches) {
        updatedContent = updatedContent.replace(fix.pattern, fix.replacement);
        fileFixes += matches.length;
      }
    });
    
    if (fileFixes > 0) {
      writeFileSync(filePath, updatedContent);
      totalFixes += fileFixes;
      filesFixed++;
      console.log(`  ✅ Fixed ${fileFixes} imports in: ${filePath.replace(projectRoot, '.')}`);
    }
  } catch (error) {
    console.error(`  ❌ Failed to fix ${filePath}:`, error.message);
  }
}

// Find and fix all files
const files = findTsFiles(projectRoot);
console.log(`Found ${files.length} TypeScript/JavaScript files\n`);

files.forEach(fixFileImports);

console.log(`\n✅ Final import fixes complete!`);
console.log(`  - ${filesFixed} files fixed`);
console.log(`  - ${totalFixes} import statements fixed`);






