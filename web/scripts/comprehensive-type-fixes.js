#!/usr/bin/env node

/**
 * Comprehensive script to systematically fix all type cast errors
 * This will find all 'as any' casts and fix them using proper Database types
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Track what we find and fix
const results = {
  filesProcessed: 0,
  anyCastsFound: 0,
  anyCastsFixed: 0,
  errors: [],
  tableUsage: new Set(),
  filesWithIssues: []
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

function fixCommonPatterns(content, filePath) {
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
    },
    {
      regex: /\((\w+)\s+as\s+any\)\.(\w+)/g,
      replacement: '$1.$2',
      description: 'Remove any cast from property access'
    },
    {
      regex: /\((\w+)\s+as\s+any\)\[/g,
      replacement: '$1[',
      description: 'Remove any cast from array access'
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

function addDatabaseImport(content, filePath) {
  // Check if Database import already exists
  if (content.includes("import type { Database }")) {
    return content;
  }
  
  // Find the first import statement
  const importMatch = content.match(/^import\s+.*$/m);
  if (importMatch) {
    const importLine = "import type { Database } from '@/types/database';";
    return content.replace(importMatch[0], `${importMatch[0]}\n${importLine}`);
  }
  
  return content;
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
      
      // Add Database import if needed
      let fixedContent = addDatabaseImport(content, filePath);
      
      // Apply fixes
      const { content: finalContent, fixesApplied } = fixCommonPatterns(fixedContent, filePath);
      results.anyCastsFixed += fixesApplied;
      
      if (fixesApplied > 0) {
        // Write back the fixed content
        fs.writeFileSync(fullPath, finalContent, 'utf8');
        console.log(`  ✅ Applied ${fixesApplied} fixes`);
      } else {
        console.log(`  ⚠️  No automatic fixes could be applied`);
        results.filesWithIssues.push(filePath);
      }
    } else {
      console.log(`  ✅ No 'as any' casts found`);
    }
    
  } catch (error) {
    results.errors.push(`Error processing ${filePath}: ${error.message}`);
    console.log(`  ❌ Error: ${error.message}`);
  }
}

function findFilesWithAnyCasts() {
  try {
    // Use grep to find files with 'as any' casts
    const grepResult = execSync('grep -r "as any" --include="*.ts" --include="*.tsx" . | grep -v node_modules | grep -v ".git" | cut -d: -f1 | sort -u', { 
      encoding: 'utf8',
      cwd: process.cwd()
    });
    
    return grepResult.trim().split('\n').filter(file => file.length > 0);
  } catch (error) {
    console.log('No files with "as any" casts found or grep failed');
    return [];
  }
}

function main() {
  console.log('🔧 Comprehensive type fixes - finding and fixing all "as any" casts...\n');
  
  // Find all files with 'as any' casts
  const filesWithAnyCasts = findFilesWithAnyCasts();
  
  if (filesWithAnyCasts.length === 0) {
    console.log('✅ No files with "as any" casts found!');
    return;
  }
  
  console.log(`Found ${filesWithAnyCasts.length} files with "as any" casts:`);
  filesWithAnyCasts.forEach(file => console.log(`  - ${file}`));
  
  // Process each file
  filesWithAnyCasts.forEach(processFile);
  
  console.log('\n📊 Results Summary:');
  console.log(`  Files processed: ${results.filesProcessed}`);
  console.log(`  'as any' casts found: ${results.anyCastsFound}`);
  console.log(`  Fixes applied: ${results.anyCastsFixed}`);
  console.log(`  Tables used: ${Array.from(results.tableUsage).join(', ')}`);
  
  if (results.filesWithIssues.length > 0) {
    console.log('\n⚠️  Files that need manual attention:');
    results.filesWithIssues.forEach(file => console.log(`  - ${file}`));
  }
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  console.log('\n✅ Comprehensive fix completed.');
  console.log('Next steps:');
  console.log('1. Review the files that need manual attention');
  console.log('2. Run TypeScript compiler to check for remaining errors');
  console.log('3. Test the application to ensure everything works');
}

if (require.main === module) {
  main();
}

module.exports = { processFile, findAnyCasts, fixCommonPatterns };
