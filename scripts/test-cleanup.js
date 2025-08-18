#!/usr/bin/env node

/**
 * Test Cleanup Script - Safe Testing
 * 
 * This script tests the cleanup functionality on a single file
 */

const fs = require('fs');
const path = require('path');

// Import the analysis functions from the main script
const { analyzeUnusedImports, analyzeUnusedVariables, analyzeConsoleStatements } = require('./cleanup-code.js');

// Test file - let's pick one with multiple issues
const testFile = 'lib/mock-data.ts';

function testCleanup() {
  console.log('🧪 Testing cleanup on single file...\n');
  
  const filePath = path.join(process.cwd(), 'web', testFile);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Test file not found: ${testFile}`);
    return;
  }
  
  console.log(`📁 Testing file: ${testFile}\n`);
  
  // Analyze the file
  const issues = [
    ...analyzeUnusedImports(filePath),
    ...analyzeUnusedVariables(filePath),
    ...analyzeConsoleStatements(filePath)
  ];
  
  console.log(`🔍 Found ${issues.length} issues:\n`);
  
  for (const issue of issues) {
    console.log(`   Line ${issue.line}: ${issue.type}`);
    if (issue.import) console.log(`      Unused import: ${issue.import}`);
    if (issue.variable) console.log(`      Unused variable: ${issue.variable}`);
    console.log(`      ${issue.fullLine.trim()}\n`);
  }
  
  // Show what would be fixed
  console.log('🔧 What would be fixed:');
  
  const unusedImports = issues.filter(i => i.type === 'unused_import').map(i => i.import);
  const unusedVariables = issues.filter(i => i.type === 'unused_variable').map(i => i.variable);
  const consoleStatements = issues.filter(i => i.type === 'console_statement').length;
  
  if (unusedImports.length > 0) {
    console.log(`   - Remove unused imports: ${unusedImports.join(', ')}`);
  }
  
  if (unusedVariables.length > 0) {
    console.log(`   - Remove unused variables: ${unusedVariables.join(', ')}`);
  }
  
  if (consoleStatements > 0) {
    console.log(`   - Replace ${consoleStatements} console statements with devLog`);
  }
  
  console.log('\n✅ Test completed - no changes made');
}

testCleanup();
