#!/usr/bin/env node

/**
 * Fix Remaining Import Issues Script
 * 
 * This script fixes the remaining import path issues that the main script missed.
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing remaining import path issues...');

// Specific fixes for common issues
const specificFixes = [
  // Fix UI component paths that got incorrectly mapped
  { pattern: /@\/components\/features\/ui\/([^/]+)/g, replacement: '@/components/ui/$1' },
  { pattern: /@\/lib\/utils\/utils\/([^/]+)/g, replacement: '@/lib/utils/$1' },
  { pattern: /@\/components\/features\/features\/([^/]+)/g, replacement: '@/components/features/$1' },
  { pattern: /@\/components\/ui\/ui\/([^/]+)/g, replacement: '@/components/ui/$1' },
];

// Function to fix imports in a file
function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    specificFixes.forEach(fix => {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed imports in: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Find all TypeScript and TSX files
function findTsFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.next')) {
      files.push(...findTsFiles(fullPath));
    } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Main execution
try {
  const webDir = path.join(__dirname, '..', 'web');
  const tsFiles = findTsFiles(webDir);
  
  let fixedCount = 0;
  tsFiles.forEach(file => {
    if (fixImportsInFile(file)) {
      fixedCount++;
    }
  });
  
  console.log(`🎉 Fixed imports in ${fixedCount} additional files!`);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
