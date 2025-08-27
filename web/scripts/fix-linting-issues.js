#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Linting Issue Analysis & Fix Helper\n');

// Get current linting status
try {
  const lintOutput = execSync('npm run lint 2>&1', { encoding: 'utf8' });
  
  // Count different types of issues
  const warnings = (lintOutput.match(/Warning:/g) || []).length;
  const errors = (lintOutput.match(/Error:/g) || []).length;
  
  console.log(`📊 Current Status:`);
  console.log(`   Warnings: ${warnings}`);
  console.log(`   Errors: ${errors}`);
  console.log(`   Total: ${warnings + errors}\n`);
  
  // Analyze most common issues
  const unusedVars = (lintOutput.match(/is defined but never used/g) || []).length;
  const unusedArgs = (lintOutput.match(/unused args must match/g) || []).length;
  const consoleStatements = (lintOutput.match(/Unexpected console statement/g) || []).length;
  const reactHooks = (lintOutput.match(/React Hook.*missing dependency/g) || []).length;
  const imgElements = (lintOutput.match(/no-img-element/g) || []).length;
  
  console.log(`🔍 Issue Breakdown:`);
  console.log(`   Unused variables: ${unusedVars}`);
  console.log(`   Unused arguments: ${unusedArgs}`);
  console.log(`   Console statements: ${consoleStatements}`);
  console.log(`   React hooks issues: ${reactHooks}`);
  console.log(`   Image optimization: ${imgElements}\n`);
  
  // Priority recommendations
  console.log(`🎯 Priority Fixes:`);
  if (errors > 0) {
    console.log(`   1. Fix ${errors} critical errors first`);
  }
  if (consoleStatements > 0) {
    console.log(`   2. Remove ${consoleStatements} console statements from production code`);
  }
  if (unusedVars > 0) {
    console.log(`   3. Clean up ${unusedVars} unused variables`);
  }
  if (unusedArgs > 0) {
    console.log(`   4. Fix ${unusedArgs} unused function arguments`);
  }
  if (reactHooks > 0) {
    console.log(`   5. Address ${reactHooks} React hooks dependency issues`);
  }
  
  console.log(`\n💡 Quick Fix Commands:`);
  console.log(`   # Remove console statements:`);
  console.log(`   find . -name "*.tsx" -o -name "*.ts" | xargs sed -i '' 's/console\.log(.*);/\/\/ console.log(\\1);/g'`);
  console.log(`   `);
  console.log(`   # Find files with most issues:`);
  console.log(`   npm run lint 2>&1 | grep -E "Warning:|Error:" | cut -d' ' -f1 | sort | uniq -c | sort -nr | head -10`);
  
} catch (error) {
  console.error('❌ Error running lint analysis:', error.message);
  process.exit(1);
}
