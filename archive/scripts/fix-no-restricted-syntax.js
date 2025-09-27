#!/usr/bin/env node

/**
 * Script to fix no-restricted-syntax warnings by replacing object spreads
 * with withOptional() calls for objects that may contain undefined values
 */

const fs = require('fs');
const { execSync } = require('child_process');

// Get all files with no-restricted-syntax warnings
function getFilesWithWarnings() {
  try {
    const output = execSync('npx eslint -c .eslintrc.cjs . --format=json', { 
      cwd: process.cwd(),
      encoding: 'utf8' 
    });
    const results = JSON.parse(output);
    return results
      .filter(result => result.messages.some(msg => msg.ruleId === 'no-restricted-syntax'))
      .map(result => result.filePath);
  } catch (error) {
    console.log('No ESLint results found, using manual list');
    return [];
  }
}

// Common patterns to fix
const patterns = [
  // Pattern: { ...obj, ...otherObj } where obj or otherObj might be undefined
  {
    regex: /\{\s*\.\.\.(\w+),\s*\.\.\.(\w+)\s*\}/g,
    replacement: 'withOptional({}, { ...$1, ...$2 })'
  },
  // Pattern: { ...obj } where obj might be undefined  
  {
    regex: /\{\s*\.\.\.(\w+)\s*\}/g,
    replacement: 'withOptional({}, { ...$1 })'
  },
  // Pattern: Object.assign({}, obj, otherObj)
  {
    regex: /Object\.assign\(\{\},\s*(\w+),\s*(\w+)\)/g,
    replacement: 'withOptional({}, { ...$1, ...$2 })'
  }
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Check if file already imports withOptional
    const hasWithOptionalImport = content.includes('withOptional') || content.includes('stripUndefinedDeep');
    
    // Apply patterns
    patterns.forEach(pattern => {
      const newContent = content.replace(pattern.regex, pattern.replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });
    
    // Add import if needed and file was modified
    if (modified && !hasWithOptionalImport) {
      // Add import at the top
      const importLine = "import { withOptional } from '@/lib/util/objects';\n";
      content = importLine + content;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`✅ Fixed ${filePath}`);
      return true;
    }
    
    return false;
  } catch {
    console.error(`❌ Error fixing ${filePath}`);
    return false;
  }
}

// Main execution
function main() {
  console.log('🔧 Fixing no-restricted-syntax warnings...');
  
  const files = getFilesWithWarnings();
  let fixedCount = 0;
  
  if (files.length === 0) {
    console.log('No files with warnings found');
    return;
  }
  
  files.forEach(file => {
    if (fixFile(file)) {
      fixedCount++;
    }
  });
  
  console.log(`\n🎉 Fixed ${fixedCount} files`);
  console.log('Run "npm run lint" to check remaining warnings');
}

if (require.main === module) {
  main();
}

module.exports = { fixFile, patterns };
