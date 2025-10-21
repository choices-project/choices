#!/usr/bin/env node

/**
 * Test script to systematically fix type cast errors on a small subset of files
 * This will help us validate the approach before applying it broadly
 */

const fs = require('fs');
const path = require('path');

// Small subset of files to test with
const TEST_FILES = [
  'app/api/feedback/route.ts',
  'app/api/hashtags/route.ts',
  'app/api/auth/login/route.ts'
];

// Track what we find and fix
const results = {
  filesProcessed: 0,
  anyCastsFound: 0,
  anyCastsFixed: 0,
  errors: [],
  tableUsage: new Set()
};

function findAnyCasts(content, filePath) {
  const anyCastRegex = /as\s+any/gi;
  const matches = [];
  let match;
  
  while ((match = anyCastRegex.exec(content)) !== null) {
    matches.push({
      index: match.index,
      text: match[0],
      line: content.substring(0, match.index).split('\n').length
    });
  }
  
  return matches;
}

function analyzeSupabaseUsage(content, filePath) {
  // Find table references
  const tableRegex = /\.from\(['"`]([^'"`]+)['"`]\)/g;
  const tables = new Set();
  let match;
  
  while ((match = tableRegex.exec(content)) !== null) {
    tables.add(match[1]);
  }
  
  return Array.from(tables);
}

function fixTypeCasts(content, filePath) {
  let fixedContent = content;
  let fixesApplied = 0;
  
  // Common patterns to fix
  const patterns = [
    // Remove unnecessary any casts in Supabase queries
    {
      regex: /\.eq\(['"`](\w+)['"`],\s*(\w+)\.(\w+)\s+as\s+any\)/g,
      replacement: '.eq(\'$1\', $2.$3)',
      description: 'Remove any cast from .eq() calls'
    },
    {
      regex: /\.insert\(([^)]+)\s+as\s+any\)/g,
      replacement: '.insert($1)',
      description: 'Remove any cast from .insert() calls'
    },
    {
      regex: /\.update\(([^)]+)\s+as\s+any\)/g,
      replacement: '.update($1)',
      description: 'Remove any cast from .update() calls'
    }
  ];
  
  patterns.forEach(pattern => {
    const matches = fixedContent.match(pattern.regex);
    if (matches) {
      fixedContent = fixedContent.replace(pattern.regex, pattern.replacement);
      fixesApplied += matches.length;
      console.log(`  ✓ ${pattern.description}: ${matches.length} fixes`);
    }
  });
  
  return { content: fixedContent, fixesApplied };
}

function processFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (!fs.existsSync(fullPath)) {
    results.errors.push(`File not found: ${filePath}`);
    return;
  }
  
  console.log(`\n📁 Processing: ${filePath}`);
  
  try {
    const content = fs.readFileSync(fullPath, 'utf8');
    results.filesProcessed++;
    
    // Find any casts
    const anyCasts = findAnyCasts(content, filePath);
    results.anyCastsFound += anyCasts.length;
    
    if (anyCasts.length > 0) {
      console.log(`  Found ${anyCasts.length} 'as any' casts:`);
      anyCasts.forEach((cast, index) => {
        console.log(`    ${index + 1}. Line ${cast.line}: ${cast.text}`);
      });
      
      // Analyze table usage
      const tables = analyzeSupabaseUsage(content, filePath);
      tables.forEach(table => results.tableUsage.add(table));
      console.log(`  Tables used: ${tables.join(', ')}`);
      
      // Apply fixes
      const { content: fixedContent, fixesApplied } = fixTypeCasts(content, filePath);
      results.anyCastsFixed += fixesApplied;
      
      if (fixesApplied > 0) {
        // Write back the fixed content
        fs.writeFileSync(fullPath, fixedContent, 'utf8');
        console.log(`  ✅ Applied ${fixesApplied} fixes`);
      } else {
        console.log(`  ⚠️  No automatic fixes could be applied`);
      }
    } else {
      console.log(`  ✅ No 'as any' casts found`);
    }
    
  } catch (error) {
    results.errors.push(`Error processing ${filePath}: ${error.message}`);
    console.log(`  ❌ Error: ${error.message}`);
  }
}

function main() {
  console.log('🔧 Testing systematic type fixes on small subset of files...\n');
  
  TEST_FILES.forEach(processFile);
  
  console.log('\n📊 Results Summary:');
  console.log(`  Files processed: ${results.filesProcessed}`);
  console.log(`  'as any' casts found: ${results.anyCastsFound}`);
  console.log(`  Fixes applied: ${results.anyCastsFixed}`);
  console.log(`  Tables used: ${Array.from(results.tableUsage).join(', ')}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  console.log('\n✅ Test completed. Check the files to see if fixes look correct.');
}

if (require.main === module) {
  main();
}

module.exports = { processFile, findAnyCasts, fixTypeCasts };
