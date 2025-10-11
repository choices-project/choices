#!/usr/bin/env node

/**
 * Cursor AI Post-Commit Hook
 * Validates agent behavior after commits
 * 
 * Created: January 19, 2025
 * Status: 🚀 ACTIVE
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  // Validation thresholds
  errorHandlingThreshold: 0.8,
  dateAccuracyThreshold: 0.9,
  implementationThreshold: 0.8,
  
  // File paths to check
  includePaths: [
    'web/lib',
    'web/app',
    'web/components',
    'web/features'
  ],
  
  // File extensions to check
  includeExtensions: ['.ts', '.tsx', '.js', '.jsx']
};

/**
 * Main validation function
 */
function validatePostCommit() {
  console.log('🔍 Validating post-commit agent behavior...');
  
  // Get commit information
  const commitHash = getCommitHash();
  const commitMessage = getCommitMessage();
  
  console.log(`📝 Commit: ${commitHash}`);
  console.log(`💬 Message: ${commitMessage}`);
  
  // Validate agent behavior
  const results = {
    errorHandling: validateErrorHandling(),
    dateAccuracy: validateDateAccuracy(),
    implementation: validateImplementationStandards(),
    overall: 0
  };
  
  // Calculate overall score
  results.overall = (
    results.errorHandling.score +
    results.dateAccuracy.score +
    results.implementation.score
  ) / 3;
  
  // Display results
  displayResults(results);
  
  // Check if validation passed
  if (results.overall < 0.8) {
    console.error('❌ Post-commit validation failed!');
    console.error('Please review and improve agent behavior.');
    process.exit(1);
  }
  
  console.log('✅ Post-commit validation passed!');
}

/**
 * Validate error handling
 */
function validateErrorHandling() {
  console.log('🚨 Validating error handling...');
  
  const files = getFilesToCheck();
  let totalErrors = 0;
  let handledErrors = 0;
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Count error patterns
    const errorPatterns = [
      /throw new Error\(/g,
      /catch\s*\(\s*error\s*\)/g,
      /try\s*{/g
    ];
    
    for (const pattern of errorPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        totalErrors += matches.length;
      }
    }
    
    // Count handled errors
    const handledPatterns = [
      /ApplicationError/g,
      /logger\.error/g,
      /error\.message/g
    ];
    
    for (const pattern of handledPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        handledErrors += matches.length;
      }
    }
  }
  
  const score = totalErrors > 0 ? handledErrors / totalErrors : 1;
  
  return {
    score,
    totalErrors,
    handledErrors,
    passed: score >= CONFIG.errorHandlingThreshold
  };
}

/**
 * Validate date accuracy
 */
function validateDateAccuracy() {
  console.log('📅 Validating date accuracy...');
  
  const files = getFilesToCheck();
  let totalDates = 0;
  let correctDates = 0;
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Count date patterns
    const datePatterns = [
      /2025-01-19/g,
      /new Date\(\)/g,
      /Date\.now\(\)/g
    ];
    
    for (const pattern of datePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        totalDates += matches.length;
        
        // Check if dates are correct
        for (const match of matches) {
          if (match.includes('2025-01-19')) {
            correctDates++;
          }
        }
      }
    }
  }
  
  const score = totalDates > 0 ? correctDates / totalDates : 1;
  
  return {
    score,
    totalDates,
    correctDates,
    passed: score >= CONFIG.dateAccuracyThreshold
  };
}

/**
 * Validate implementation standards
 */
function validateImplementationStandards() {
  console.log('🏗️ Validating implementation standards...');
  
  const files = getFilesToCheck();
  let totalImplementations = 0;
  let qualityImplementations = 0;
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Count implementation patterns
    const implementationPatterns = [
      /export\s+(function|const|class)/g,
      /async\s+function/g,
      /try\s*{/g
    ];
    
    for (const pattern of implementationPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        totalImplementations += matches.length;
      }
    }
    
    // Count quality patterns
    const qualityPatterns = [
      /ApplicationError/g,
      /logger\./g,
      /error\.message/g,
      /try\s*{[\s\S]*?catch/g
    ];
    
    for (const pattern of qualityPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        qualityImplementations += matches.length;
      }
    }
  }
  
  const score = totalImplementations > 0 ? qualityImplementations / totalImplementations : 1;
  
  return {
    score,
    totalImplementations,
    qualityImplementations,
    passed: score >= CONFIG.implementationThreshold
  };
}

/**
 * Get commit hash
 */
function getCommitHash() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Get commit message
 */
function getCommitMessage() {
  try {
    return execSync('git log -1 --pretty=%B', { encoding: 'utf8' }).trim();
  } catch (error) {
    return 'unknown';
  }
}

/**
 * Get files to check
 */
function getFilesToCheck() {
  const files = [];
  
  for (const includePath of CONFIG.includePaths) {
    if (fs.existsSync(includePath)) {
      const dirFiles = getFilesRecursively(includePath);
      files.push(...dirFiles);
    }
  }
  
  return files.filter(file => 
    CONFIG.includeExtensions.some(ext => file.endsWith(ext))
  );
}

/**
 * Get files recursively
 */
function getFilesRecursively(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getFilesRecursively(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Display validation results
 */
function displayResults(results) {
  console.log('\n📊 Agent Behavior Validation Results:');
  console.log('=====================================');
  
  console.log(`🚨 Error Handling: ${results.errorHandling.score.toFixed(2)} (${results.errorHandling.passed ? '✅' : '❌'})`);
  console.log(`📅 Date Accuracy: ${results.dateAccuracy.score.toFixed(2)} (${results.dateAccuracy.passed ? '✅' : '❌'})`);
  console.log(`🏗️ Implementation: ${results.implementation.score.toFixed(2)} (${results.implementation.passed ? '✅' : '❌'})`);
  console.log(`📊 Overall Score: ${results.overall.toFixed(2)} (${results.overall >= 0.8 ? '✅' : '❌'})`);
  
  if (results.overall >= 0.8) {
    console.log('\n🎉 Excellent agent behavior! Keep up the great work!');
  } else {
    console.log('\n⚠️  Agent behavior needs improvement. Review the guidelines.');
  }
}

// Run validation
validatePostCommit();
