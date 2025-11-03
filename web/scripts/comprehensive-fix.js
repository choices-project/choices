#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Get all current errors
const getAllErrors = () => {
  try {
    const output = execSync('npm run lint:test 2>&1 | grep -E "error"', { encoding: 'utf8' });
    return output.trim().split('\n');
  } catch (error) {
    console.error('Error getting all errors:', error.message);
    return [];
  }
};

// Group errors by file and type
const groupErrorsByFile = (errors) => {
  const fileErrors = {};
  let currentFile = '';
  
  errors.forEach(error => {
    if (error.includes('.tsx') || error.includes('.ts')) {
      // This line contains a file path
      currentFile = error.trim();
      if (!fileErrors[currentFile]) {
        fileErrors[currentFile] = {
          unusedVars: [],
          nullishCoalescing: [],
          importOrder: [],
          reactImports: [],
          other: []
        };
      }
    } else if (currentFile && error.trim()) {
      // This is an error line for the current file
      if (error.includes('unused-vars')) {
        fileErrors[currentFile].unusedVars.push(error);
      } else if (error.includes('prefer-nullish-coalescing')) {
        fileErrors[currentFile].nullishCoalescing.push(error);
      } else if (error.includes('import/order')) {
        fileErrors[currentFile].importOrder.push(error);
      } else if (error.includes('React.*not defined')) {
        fileErrors[currentFile].reactImports.push(error);
      } else {
        fileErrors[currentFile].other.push(error);
      }
    }
  });
  
  return fileErrors;
};

// Fix unused variables by prefixing with _
const fixUnusedVariables = (filePath, errors) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let changes = 0;
    
    errors.forEach(error => {
      const match = error.match(/(\d+):(\d+)\s+error\s+['"`]([^'"`]+)['"`]\s+is\s+(assigned a value but never used|defined but never used)/);
      if (match) {
        const [, lineNum, , varName] = match;
        const lineIndex = parseInt(lineNum) - 1;
        const lines = newContent.split('\n');
        const line = lines[lineIndex];
        
        // Skip if already prefixed with _
        if (varName.startsWith('_')) return;
        
        // Replace variable name with prefixed version
        const newLine = line.replace(new RegExp(`\\b${varName}\\b`, 'g'), `_${varName}`);
        if (newLine !== line) {
          lines[lineIndex] = newLine;
          newContent = lines.join('\n');
          changes++;
        }
      }
    });
    
    if (changes > 0) {
      fs.writeFileSync(filePath, newContent);
      console.log(`✓ Fixed ${changes} unused variables in ${filePath}`);
    }
    
    return changes;
  } catch (error) {
    console.error(`✗ Error fixing unused variables in ${filePath}:`, error.message);
    return 0;
  }
};

// Fix nullish coalescing
const fixNullishCoalescing = (filePath, errors) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    let changes = 0;
    
    errors.forEach(error => {
      const match = error.match(/(\d+):(\d+)\s+error\s+Prefer using nullish coalescing operator/);
      if (match) {
        const [, lineNum] = match;
        const lineIndex = parseInt(lineNum) - 1;
        const lines = newContent.split('\n');
        const line = lines[lineIndex];
        
        // Replace || with ?? where appropriate
        const newLine = line.replace(/(\w+(?:\.\w+)*)\s*\|\|\s*(\w+(?:\.\w+)*)/g, '$1 ?? $2');
        if (newLine !== line) {
          lines[lineIndex] = newLine;
          newContent = lines.join('\n');
          changes++;
        }
      }
    });
    
    if (changes > 0) {
      fs.writeFileSync(filePath, newContent);
      console.log(`✓ Fixed ${changes} nullish coalescing issues in ${filePath}`);
    }
    
    return changes;
  } catch (error) {
    console.error(`✗ Error fixing nullish coalescing in ${filePath}:`, error.message);
    return 0;
  }
};

// Fix React imports
const fixReactImports = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if React is already imported
    if (content.includes("import React")) {
      return 0;
    }
    
    // Find the first import statement
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Find where to insert React import
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith("import ") || lines[i].startsWith("'use client'") || lines[i].startsWith('"use client"')) {
        insertIndex = i;
        break;
      }
    }
    
    // Insert React import
    const reactImport = "import React from 'react';";
    lines.splice(insertIndex, 0, reactImport);
    
    // Write back to file
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log(`✓ Added React import to ${filePath}`);
    return 1;
    
  } catch (error) {
    console.error(`✗ Error fixing React import in ${filePath}:`, error.message);
    return 0;
  }
};

// Main execution
const main = () => {
  console.log('🔍 Running comprehensive fix...\n');
  
  const errors = getAllErrors();
  const fileErrors = groupErrorsByFile(errors);
  const files = Object.keys(fileErrors);
  
  console.log(`Found errors in ${files.length} files:\n`);
  
  let totalFixes = 0;
  
  files.forEach(filePath => {
    console.log(`📁 Fixing ${filePath}:`);
    
    const errors = fileErrors[filePath];
    let fileFixes = 0;
    
    // Fix unused variables
    if (errors.unusedVars.length > 0) {
      const fixes = fixUnusedVariables(filePath, errors.unusedVars);
      fileFixes += fixes;
    }
    
    // Fix nullish coalescing
    if (errors.nullishCoalescing.length > 0) {
      const fixes = fixNullishCoalescing(filePath, errors.nullishCoalescing);
      fileFixes += fixes;
    }
    
    // Fix React imports
    if (errors.reactImports.length > 0) {
      const fixes = fixReactImports(filePath);
      fileFixes += fixes;
    }
    
    if (fileFixes === 0) {
      console.log(`  - No fixes needed`);
    }
    
    totalFixes += fileFixes;
    console.log('');
  });
  
  console.log(`📊 Summary:`);
  console.log(`  - Files processed: ${files.length}`);
  console.log(`  - Total fixes applied: ${totalFixes}`);
  
  console.log('\n✅ Comprehensive fix complete!');
  console.log('\n📋 Next steps:');
  console.log('  1. Run lint again to check progress');
  console.log('  2. Address remaining import order issues manually');
  console.log('  3. Fix any remaining type safety issues');
};

main();

