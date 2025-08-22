#!/usr/bin/env node

/**
 * Script to fix unused imports and parameters
 * This addresses the root cause of unused variable warnings by removing unnecessary imports
 */

const fs = require('fs');
const path = require('path');

// Patterns to find and fix
const PATTERNS = [
  // Remove unused NextRequest imports
  {
    pattern: /import \{ NextRequest, NextResponse \} from 'next\/server';/g,
    replacement: "import { NextResponse } from 'next/server';",
    description: 'unused NextRequest import'
  },
  {
    pattern: /import \{ NextRequest \} from 'next\/server';/g,
    replacement: '',
    description: 'unused NextRequest import'
  },
  // Fix unused request parameters
  {
    pattern: /export async function (GET|POST|PUT|DELETE|PATCH)\(request: NextRequest\)/g,
    replacement: 'export async function $1(_request: NextRequest)',
    description: 'unused request parameter'
  },
  // Fix unused filters parameters
  {
    pattern: /\(filters\) =>/g,
    replacement: '(_filters) =>',
    description: 'unused filters parameter'
  },
  // Fix unused dateRange parameters
  {
    pattern: /\(dateRange\) =>/g,
    replacement: '(_dateRange) =>',
    description: 'unused dateRange parameter'
  }
];

// Files to process
const FILES_TO_PROCESS = [
  'app/api/database-status/route.ts',
  'app/auth/callback/route.ts',
  'app/auth/verify/route.ts',
  'app/api/demographics/route.ts',
  'app/api/trending-polls/route.ts',
  'app/api/user/get-id/route.ts',
  'app/api/user/get-id-public/route.ts'
];

function fixUnusedImports(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let originalContent = content;
    let changesMade = 0;
    
    // Apply each pattern
    for (const { pattern, replacement, description } of PATTERNS) {
      if (pattern.test(content)) {
        content = content.replace(pattern, replacement);
        changesMade++;
        console.log(`   - Fixed ${description}`);
      }
    }
    
    // Clean up empty import lines
    content = content.replace(/import \{ \} from 'next\/server';\n/g, '');
    content = content.replace(/import \{ \} from 'next\/server';\s*\n/g, '');
    
    // Check if content actually changed
    if (content === originalContent) {
      console.log(`ℹ️  No changes needed in: ${filePath}`);
      return false;
    }

    // Write the fixed content
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Fixed ${changesMade} issues in: ${filePath}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing unused imports and parameters...\n');
  
  let fixedCount = 0;
  let totalFiles = FILES_TO_PROCESS.length;
  
  for (const filePath of FILES_TO_PROCESS) {
    console.log(`Processing: ${filePath}`);
    if (fixUnusedImports(filePath)) {
      fixedCount++;
    }
    console.log(''); // Empty line for readability
  }
  
  console.log(`📊 Summary:`);
  console.log(`   Files processed: ${totalFiles}`);
  console.log(`   Files fixed: ${fixedCount}`);
  console.log(`   Files unchanged: ${totalFiles - fixedCount}`);
  
  if (fixedCount > 0) {
    console.log(`\n🎉 Successfully fixed ${fixedCount} files!`);
    console.log(`   This addresses the root cause of unused variable warnings by removing unnecessary imports.`);
  } else {
    console.log(`\nℹ️  No files needed fixing.`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixUnusedImports };
