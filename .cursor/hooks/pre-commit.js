#!/usr/bin/env node

/**
 * Cursor AI Pre-Commit Hook
 * Validates agent behavior compliance before commits
 * 
 * Created: January 19, 2025
 * Status: 🚀 ACTIVE
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  // Date validation - always check system date
  timezone: 'UTC',
  dateFormat: 'YYYY-MM-DD',
  
  // Error handling validation
  requiredErrorClasses: ['ApplicationError'],
  forbiddenErrorPatterns: [
    /console\.log\(/g,
    /throw new Error\(/g,
    /catch\s*\(\s*error\s*\)\s*{\s*}/g
  ],
  
  // Unused variable validation
  forbiddenUnderscorePatterns: [
    /const _\w+/g,
    /let _\w+/g,
    /var _\w+/g
  ],
  
  // Implementation validation
  forbiddenPatterns: [
    /\/\/ TODO:/g,
    /\/\/ FIXME:/g,
    /\/\/ HACK:/g,
    /console\.log\(/g,
    /console\.error\(/g
  ],
  
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
function validateAgentBehavior() {
  console.log('🔍 Validating Cursor AI agent behavior compliance...');
  
  let hasErrors = false;
  
  // Check date accuracy
  if (!validateDateAccuracy()) {
    hasErrors = true;
  }
  
  // Check error handling
  if (!validateErrorHandling()) {
    hasErrors = true;
  }
  
  // Check unused variable handling
  if (!validateUnusedVariableHandling()) {
    hasErrors = true;
  }
  
  // Check implementation standards
  if (!validateImplementationStandards()) {
    hasErrors = true;
  }
  
  if (hasErrors) {
    console.error('❌ Agent behavior validation failed!');
    console.error('Please fix the issues above before committing.');
    process.exit(1);
  }
  
  console.log('✅ Agent behavior validation passed!');
}

/**
 * Validate date accuracy
 */
function validateDateAccuracy() {
  console.log('📅 Checking date accuracy...');
  
  const files = getFilesToCheck();
  let hasErrors = false;
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check for hardcoded dates (should use dynamic system date)
    const hardcodedDates = [
      '2024-',
      '2025-01-19',
      '2025-01-20',
      'today',
      'current date'
    ];
    
    for (const hardcodedDate of hardcodedDates) {
      if (content.includes(hardcodedDate)) {
        console.error(`❌ Found hardcoded date "${hardcodedDate}" in ${file}`);
        hasErrors = true;
      }
    }
    
    // Check for dynamic date usage
    if (content.includes('new Date()') || content.includes('Date.now()')) {
      console.log(`✅ Found dynamic date usage in ${file}`);
    }
  }
  
  return !hasErrors;
}

/**
 * Validate error handling
 */
function validateErrorHandling() {
  console.log('🚨 Checking error handling...');
  
  const files = getFilesToCheck();
  let hasErrors = false;
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check for forbidden error patterns
    for (const pattern of CONFIG.forbiddenErrorPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        console.error(`❌ Found forbidden error pattern in ${file}: ${matches[0]}`);
        hasErrors = true;
      }
    }
    
    // Check for required error classes
    if (content.includes('throw new Error(') && !content.includes('ApplicationError')) {
      console.error(`❌ Found generic error in ${file} without ApplicationError`);
      hasErrors = true;
    }
  }
  
  return !hasErrors;
}

/**
 * Validate unused variable handling
 */
function validateUnusedVariableHandling() {
  console.log('🔍 Checking unused variable handling...');
  
  const files = getFilesToCheck();
  let hasErrors = false;
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check for forbidden underscore patterns
    for (const pattern of CONFIG.forbiddenUnderscorePatterns) {
      const matches = content.match(pattern);
      if (matches) {
        console.error(`❌ Found underscored variable in ${file}: ${matches[0]}`);
        console.error('   Research first before underscoring variables!');
        hasErrors = true;
      }
    }
  }
  
  return !hasErrors;
}

/**
 * Validate implementation standards
 */
function validateImplementationStandards() {
  console.log('🏗️ Checking implementation standards...');
  
  const files = getFilesToCheck();
  let hasErrors = false;
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check for forbidden patterns
    for (const pattern of CONFIG.forbiddenPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        console.error(`❌ Found forbidden pattern in ${file}: ${matches[0]}`);
        hasErrors = true;
      }
    }
  }
  
  return !hasErrors;
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

// Run validation
validateAgentBehavior();
