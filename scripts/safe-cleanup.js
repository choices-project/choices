#!/usr/bin/env node

/**
 * Safe Cleanup Script - Limited Scope Testing
 * 
 * This script runs the cleanup on a small subset of files to test safely
 */

const fs = require('fs');
const path = require('path');

// Import the analysis and fix functions from the main script
const { analyzeUnusedImports, analyzeUnusedVariables, analyzeConsoleStatements } = require('./cleanup-code.js');

// Only process these specific files for safety
const SAFE_FILES = [
  'lib/mock-data.ts',
  'lib/utils.ts',
  'src/app/page.tsx'
];

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

function safeCleanup() {
  console.log('🛡️ Running safe cleanup on limited files...\n');
  
  let totalFixed = 0;
  let totalIssues = 0;
  
  for (const relativePath of SAFE_FILES) {
    const filePath = path.join(process.cwd(), 'web', relativePath);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ File not found: ${relativePath}`);
      continue;
    }
    
    console.log(`📁 Processing: ${relativePath}`);
    
    // Create backup
    const backupPath = filePath + '.backup';
    fs.copyFileSync(filePath, backupPath);
    
    // Analyze the file
    const issues = [
      ...analyzeUnusedImports(filePath),
      ...analyzeUnusedVariables(filePath),
      ...analyzeConsoleStatements(filePath)
    ];
    
    totalIssues += issues.length;
    
    if (issues.length === 0) {
      console.log(`   ℹ️ No issues found\n`);
      continue;
    }
    
    console.log(`   🔍 Found ${issues.length} issues`);
    
    // Apply fixes
    const modified = fixUnusedImports(filePath, issues);
    
    if (modified) {
      totalFixed++;
      console.log(`   ✅ Fixed issues\n`);
    } else {
      console.log(`   ℹ️ No fixes applied\n`);
    }
  }
  
  console.log('📊 Safe Cleanup Summary:');
  console.log(`   Files processed: ${SAFE_FILES.length}`);
  console.log(`   Total issues found: ${totalIssues}`);
  console.log(`   Files modified: ${totalFixed}`);
  
  console.log('\n✅ Safe cleanup completed');
  console.log('💡 Run "npm run lint" to verify the fixes');
}

safeCleanup();
