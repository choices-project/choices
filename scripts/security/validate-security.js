#!/usr/bin/env node

/**
 * Security Validation Script
 * 
 * This script checks for exposed sensitive information and validates
 * security compliance before commits.
 */

const fs = require('fs');
const path = require('path');

// Patterns that indicate sensitive information
const sensitivePatterns = [
  // UUID patterns (potential admin IDs) - only if they look like real UUIDs
  /['"][0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}['"]/gi,
  
  // API key patterns
  /['"]sk-[a-zA-Z0-9]{20,}['"]/gi,
  /['"]pk-[a-zA-Z0-9]{20,}['"]/gi,
  /['"]eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]{10,}['"]/gi,
  
  // Database connection strings with credentials
  /['"]postgresql:\/\/[^@]+@[^\/]+['"]/gi,
  /['"]mysql:\/\/[^@]+@[^\/]+['"]/gi,
  /['"]mongodb:\/\/[^@]+@[^\/]+['"]/gi,
  
  // Common credential patterns
  /password\s*[:=]\s*['"][^'"]{5,}['"]/gi,
  /secret\s*[:=]\s*['"][^'"]{5,}['"]/gi,
  /key\s*[:=]\s*['"][^'"]{10,}['"]/gi,
  /token\s*[:=]\s*['"][^'"]{10,}['"]/gi,
  
  // Email patterns (potential admin emails) - only if they look real
  /['"][a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}['"]/gi,
  
  // Hardcoded admin references with actual values
  /admin.*id.*['"][0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}['"]/gi,
  /owner.*id.*['"][0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}['"]/gi,
  /user.*id.*['"][0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}['"]/gi
];

// Files to exclude from scanning
const excludePatterns = [
  /node_modules/,
  /\.git/,
  /\.env/,
  /package-lock\.json/,
  /yarn\.lock/,
  /\.DS_Store/,
  /\.log$/,
  /\.tmp$/,
  /\.cache/,
  /dist/,
  /build/,
  /\.next/,
  /scripts\/fix-admin-security\.js/, // The security fix script itself
  /scripts\/validate-security\.js/   // This script
];

// Files to include in scanning
const includeExtensions = [
  '.js', '.ts', '.jsx', '.tsx', '.md', '.txt', '.json', '.yaml', '.yml', '.sql'
];

console.log('🔒 Security Validation');
console.log('======================\n');

let issuesFound = 0;
let filesScanned = 0;

function shouldScanFile(filePath) {
  // Check exclude patterns
  for (const pattern of excludePatterns) {
    if (pattern.test(filePath)) {
      return false;
    }
  }
  
  // Check include extensions
  const ext = path.extname(filePath);
  return includeExtensions.includes(ext);
}

function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let fileIssues = 0;
    
    lines.forEach((line, index) => {
      sensitivePatterns.forEach(pattern => {
        const matches = line.match(pattern);
        if (matches) {
          // Check if this is a legitimate use (environment variable, placeholder, etc.)
          const isLegitimate = 
            line.includes('process.env') ||
            line.includes('your_') ||
            line.includes('placeholder') ||
            line.includes('example') ||
            line.includes('TODO') ||
            line.includes('FIXME') ||
            line.includes('test-') ||
            line.includes('mock-') ||
            line.includes('demo-') ||
            line.includes('sample-') ||
            line.includes('TestPassword') ||
            line.includes('00000000-0000-0000-0000-000000000000') ||
            line.includes('admin@choices.com') ||
            line.includes('noreply@choices.com') ||
            line.includes('choices_') ||
            line.includes('automated_poll_system') ||
            line.includes('refresh-token-') ||
            line.includes('//') && line.includes('example') ||
            line.includes('/*') && line.includes('example') ||
            line.includes('*/') && line.includes('example') ||
            line.includes('htmlFor=') ||
            line.includes('className=') ||
            line.includes('id=') ||
            line.includes('name=') ||
            line.includes('type=') ||
            line.includes('value=') ||
            line.includes('defaultValue=') ||
            line.includes('placeholder=') ||
            line.includes('key=') ||
            line.includes('Key:') ||
            line.includes('console.log') ||
            line.includes('your-secure-random-string-here') ||
            line.includes('your-supabase-anon-key-here') ||
            line.includes('your-vapid-public-key-here') ||
            line.includes('your-api-key-here') ||
            line.includes('NewPassword') ||
            line.includes('00000000-0000-0000-0000-000000000001') ||
            line.includes('********') ||
            line.includes('fix-readme-security.js') ||
            line.includes('GENERATE-A-SECURE-RANDOM-STRING') ||
            line.includes('your-vapid-key') ||
            line.includes('your-supabase-anon-key');
          
          if (!isLegitimate) {
            console.log(`🚨 SECURITY ISSUE: ${filePath}:${index + 1}`);
            console.log(`   Pattern: ${pattern.source}`);
            console.log(`   Line: ${line.trim()}`);
            console.log(`   Matches: ${matches.join(', ')}`);
            console.log('');
            fileIssues++;
            issuesFound++;
          }
        }
      });
    });
    
    if (fileIssues > 0) {
      console.log(`   ⚠️  ${fileIssues} potential security issues found in ${filePath}\n`);
    }
    
    filesScanned++;
    
  } catch (error) {
    console.log(`❌ Error scanning ${filePath}: ${error.message}`);
  }
}

function scanDirectory(dirPath) {
  try {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scanDirectory(fullPath);
      } else if (stat.isFile() && shouldScanFile(fullPath)) {
        scanFile(fullPath);
      }
    });
    
  } catch (error) {
    console.log(`❌ Error scanning directory ${dirPath}: ${error.message}`);
  }
}

// Start scanning from current directory
console.log('🔍 Scanning for sensitive information...\n');
scanDirectory('.');

console.log('📊 Security Validation Results');
console.log('==============================');
console.log(`📁 Files scanned: ${filesScanned}`);
console.log(`🚨 Issues found: ${issuesFound}`);

if (issuesFound === 0) {
  console.log('\n✅ No security issues found!');
  console.log('🔒 Code is ready for commit.');
  process.exit(0);
} else {
  console.log('\n❌ SECURITY ISSUES DETECTED!');
  console.log('🚨 DO NOT COMMIT until these issues are resolved.');
  console.log('\n🔧 To fix these issues:');
  console.log('1. Replace hardcoded values with environment variables');
  console.log('2. Use placeholder values in documentation');
  console.log('3. Remove any exposed credentials');
  console.log('4. Run this validation script again');
  console.log('\n📚 See docs/consolidated/security/SECURITY_POLICY.md for guidelines');
  process.exit(1);
}
