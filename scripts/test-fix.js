#!/usr/bin/env node

/**
 * Test Fix Script - Safe Testing
 * 
 * This script tests the auto-fix functionality on a single file
 */

const fs = require('fs');
const path = require('path');

// Import the analysis and fix functions from the main script
const { analyzeUnusedImports, analyzeUnusedVariables, analyzeConsoleStatements } = require('./cleanup-code.js');

// Test file
const testFile = 'lib/mock-data.ts';

/**
 * Fix unused imports by removing them from import statements
 */
function fixUnusedImports(filePath, issues) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  let modified = false;
  
  // Group issues by line number
  const issuesByLine = {};
  issues.filter(issue => issue.type === 'unused_import').forEach(issue => {
    if (!issuesByLine[issue.line]) {
      issuesByLine[issue.line] = [];
    }
    issuesByLine[issue.line].push(issue);
  });
  
  // Process each line with unused imports
  for (const [lineNum, lineIssues] of Object.entries(issuesByLine)) {
    const lineIndex = parseInt(lineNum) - 1;
    const line = lines[lineIndex];
    
    if (line.includes('import {') && line.includes('} from')) {
      const match = line.match(/import\s*{([^}]+)}\s*from/);
      if (match) {
        const imports = match[1]
          .split(',')
          .map(item => item.trim())
          .filter(item => item && !item.startsWith('//'));
        
        // Remove unused imports
        const unusedImports = lineIssues.map(issue => issue.import);
        const usedImports = imports.filter(importItem => {
          const cleanImport = importItem.replace(/\s+as\s+\w+/, '');
          return !unusedImports.includes(cleanImport);
        });
        
        if (usedImports.length !== imports.length) {
          // Reconstruct the import line
          const newImportLine = `import { ${usedImports.join(', ')} } from '${line.match(/from\s+['"]([^'"]+)['"]/)[1]}'`;
          lines[lineIndex] = newImportLine;
          modified = true;
          console.log(`   ✅ Removed unused imports: ${unusedImports.join(', ')}`);
        }
      }
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, lines.join('\n'));
  }
  
  return modified;
}

function testFix() {
  console.log('🧪 Testing auto-fix on single file...\n');
  
  const filePath = path.join(process.cwd(), 'web', testFile);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Test file not found: ${testFile}`);
    return;
  }
  
  console.log(`📁 Fixing file: ${testFile}\n`);
  
  // Analyze the file
  const issues = [
    ...analyzeUnusedImports(filePath),
    ...analyzeUnusedVariables(filePath),
    ...analyzeConsoleStatements(filePath)
  ];
  
  console.log(`🔍 Found ${issues.length} issues to fix:\n`);
  
  for (const issue of issues) {
    console.log(`   Line ${issue.line}: ${issue.type}`);
    if (issue.import) console.log(`      Unused import: ${issue.import}`);
    if (issue.variable) console.log(`      Unused variable: ${issue.variable}`);
    console.log(`      ${issue.fullLine.trim()}\n`);
  }
  
  // Apply fixes
  console.log('🔧 Applying fixes...\n');
  
  const modified = fixUnusedImports(filePath, issues);
  
  if (modified) {
    console.log('✅ File modified successfully!');
    
    // Show the diff
    console.log('\n📋 Changes made:');
    const originalContent = fs.readFileSync(filePath + '.backup', 'utf8');
    const newContent = fs.readFileSync(filePath, 'utf8');
    
    const originalLines = originalContent.split('\n');
    const newLines = newContent.split('\n');
    
    for (let i = 0; i < Math.max(originalLines.length, newLines.length); i++) {
      if (originalLines[i] !== newLines[i]) {
        console.log(`   Line ${i + 1}:`);
        if (originalLines[i]) console.log(`   - ${originalLines[i]}`);
        if (newLines[i]) console.log(`   + ${newLines[i]}`);
        console.log('');
      }
    }
  } else {
    console.log('ℹ️ No changes needed');
  }
  
  console.log('\n✅ Test completed');
}

testFix();
