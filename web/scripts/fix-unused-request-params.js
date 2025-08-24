#!/usr/bin/env node

/**
 * Script to fix unused request parameters in API routes
 * This addresses the root cause of unused variable warnings by properly marking unused parameters
 */

const fs = require('fs');
const path = require('path');

// Pattern to find and fix unused request parameters
const UNUSED_REQUEST_PATTERN = /export async function (GET|POST|PUT|DELETE|PATCH)\(request: NextRequest\)/g;

// Replacement pattern with underscore prefix
const UNUSED_REQUEST_FIX = 'export async function $1(_request: NextRequest)';

// Files to process (API routes that commonly have unused request parameters)
const API_ROUTES = [
  'app/api/admin/system-metrics/route.ts',
  'app/api/auth/sync-user/route.ts',
  'app/api/auth/webauthn/credentials/route.ts',
  'app/api/auth/webauthn/trust-score/route.ts',
  'app/api/database-health/route.ts',
  'app/api/analytics/route.ts',
  'app/api/auth/change-password/route.ts',
  'app/api/auth/delete-account/route.ts'
];

function fixUnusedRequestParams(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if the pattern exists
    if (!UNUSED_REQUEST_PATTERN.test(content)) {
      console.log(`ℹ️  No unused request pattern found in: ${filePath}`);
      return false;
    }

    // Apply the fix
    const fixedContent = content.replace(UNUSED_REQUEST_PATTERN, UNUSED_REQUEST_FIX);
    
    // Check if content actually changed
    if (content === fixedContent) {
      console.log(`ℹ️  No changes needed in: ${filePath}`);
      return false;
    }

    // Write the fixed content
    fs.writeFileSync(fullPath, fixedContent, 'utf8');
    console.log(`✅ Fixed unused request parameter in: ${filePath}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing unused request parameters in API routes...\n');
  
  let fixedCount = 0;
  const totalFiles = API_ROUTES.length;
  
  for (const filePath of API_ROUTES) {
    if (fixUnusedRequestParams(filePath)) {
      fixedCount++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${totalFiles}`);
  console.log(`   Files fixed: ${fixedCount}`);
  console.log(`   Files unchanged: ${totalFiles - fixedCount}`);
  
  if (fixedCount > 0) {
    console.log(`\n🎉 Successfully fixed ${fixedCount} files!`);
    console.log(`   This addresses the root cause of unused variable warnings by properly marking unused parameters.`);
  } else {
    console.log(`\nℹ️  No files needed fixing.`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixUnusedRequestParams };
