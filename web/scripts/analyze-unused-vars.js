#!/usr/bin/env node

/**
 * Script to analyze unused variables and understand their purpose
 * This helps us make informed decisions about whether to remove, use, or document them
 */

const fs = require('fs');
const path = require('path');

// Get all unused variable warnings
function getUnusedVarWarnings() {
  const { execSync } = require('child_process');
  try {
    const output = execSync('npm run lint 2>&1', { encoding: 'utf8' });
    const lines = output.split('\n');
    const warnings = lines.filter(line => line.includes('no-unused-vars'));
    return warnings;
  } catch (error) {
    return error.stdout.split('\n').filter(line => line.includes('no-unused-vars'));
  }
}

// Analyze a specific variable in a file
function analyzeVariable(filePath, lineNum, varName) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const line = lines[lineNum - 1];
    
    // Get context (5 lines before and after)
    const start = Math.max(0, lineNum - 6);
    const end = Math.min(lines.length, lineNum + 5);
    const context = lines.slice(start, end);
    
    // Check if variable is actually used elsewhere in the file
    const usagePattern = new RegExp(`\\b${varName}\\b`, 'g');
    const allMatches = content.match(usagePattern) || [];
    const usageCount = allMatches.length;
    
    // Determine variable type and purpose
    let purpose = 'unknown';
    let recommendation = 'investigate';
    
    if (varName.includes('Error')) {
      purpose = 'error handling';
      recommendation = 'should be used for error display or logging';
    } else if (varName.includes('Data') || varName.includes('Result')) {
      purpose = 'data storage';
      recommendation = 'should be used for display or processing';
    } else if (varName.includes('Id') || varName.includes('ID')) {
      purpose = 'identifier';
      recommendation = 'should be used for API calls or routing';
    } else if (varName.includes('Type')) {
      purpose = 'type classification';
      recommendation = 'should be used for conditional logic';
    } else if (varName.includes('User')) {
      purpose = 'user data';
      recommendation = 'should be used for user-related functionality';
    }
    
    return {
      file: filePath,
      line: lineNum,
      variable: varName,
      context: context.join('\n'),
      usageCount,
      purpose,
      recommendation,
      isActuallyUnused: usageCount <= 1
    };
  } catch (error) {
    return {
      file: filePath,
      line: lineNum,
      variable: varName,
      error: error.message
    };
  }
}

function main() {
  console.log('🔍 Analyzing unused variables...\n');
  
  const warnings = getUnusedVarWarnings();
  const analysis = [];
  
  for (const warning of warnings) {
    // Parse warning line: "line:col Warning: 'varName' is assigned a value but never used"
    const match = warning.match(/(\d+):\d+\s+Warning:\s+'([^']+)'/);
    if (match) {
      const [, filePath, lineNum, varName] = match;
      const result = analyzeVariable(filePath, parseInt(lineNum), varName);
      analysis.push(result);
    }
  }
  
  // Group by variable name to see patterns
  const grouped = {};
  for (const item of analysis) {
    if (!grouped[item.variable]) {
      grouped[item.variable] = [];
    }
    grouped[item.variable].push(item);
  }
  
  console.log('📊 Analysis Results:\n');
  
  for (const [varName, instances] of Object.entries(grouped)) {
    console.log(`🔸 ${varName} (${instances.length} instances):`);
    
    const firstInstance = instances[0];
    console.log(`   Purpose: ${firstInstance.purpose}`);
    console.log(`   Recommendation: ${firstInstance.recommendation}`);
    
    if (instances.length > 1) {
      console.log(`   Files: ${instances.map(i => i.file).join(', ')}`);
    } else {
      console.log(`   File: ${firstInstance.file}:${firstInstance.line}`);
    }
    
    // Check if any instances are actually used
    const actuallyUnused = instances.filter(i => i.isActuallyUnused);
    const actuallyUsed = instances.filter(i => !i.isActuallyUnused);
    
    if (actuallyUsed.length > 0) {
      console.log(`   ⚠️  ${actuallyUsed.length} instances are actually used (false positive)`);
    }
    
    if (actuallyUnused.length > 0) {
      console.log(`   ❌ ${actuallyUnused.length} instances are truly unused`);
    }
    
    console.log('');
  }
  
  // Summary
  const totalWarnings = warnings.length;
  const falsePositives = analysis.filter(a => !a.isActuallyUnused).length;
  const trulyUnused = analysis.filter(a => a.isActuallyUnused).length;
  
  console.log('📈 Summary:');
  console.log(`   Total warnings: ${totalWarnings}`);
  console.log(`   False positives: ${falsePositives}`);
  console.log(`   Truly unused: ${trulyUnused}`);
  console.log(`   Accuracy: ${((falsePositives / totalWarnings) * 100).toFixed(1)}% false positive rate`);
  
  // Recommendations
  console.log('\n💡 Recommendations:');
  console.log('   1. Variables with "Error" in name should be used for error handling');
  console.log('   2. Variables with "Data" or "Result" should be used for display');
  console.log('   3. Variables with "Id" should be used for API calls');
  console.log('   4. Variables with "Type" should be used for conditional logic');
  console.log('   5. Consider implementing proper error handling for unused error variables');
}

if (require.main === module) {
  main();
}

module.exports = { analyzeVariable, getUnusedVarWarnings };
