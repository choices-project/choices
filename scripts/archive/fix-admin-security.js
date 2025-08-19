#!/usr/bin/env node

/**
 * Fix Admin Security Script
 * 
 * This script replaces all hardcoded admin user IDs with environment variables
 * to prevent exposure of sensitive information in documentation and code.
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'web/app/api/admin/generated-polls/route.ts',
  'web/app/api/admin/trending-topics/route.ts',
  'web/app/api/admin/trending-topics/analyze/route.ts',
  'web/app/api/admin/generated-polls/[id]/approve/route.ts',
  'scripts/test_smart_redirect.js',
  'database/security_policies_fixed.sql'
];

console.log('🔒 Fixing Admin Security Issues');
console.log('================================\n');

let fixedCount = 0;
let errorCount = 0;

filesToFix.forEach(filePath => {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let fileFixed = false;

    // Replace hardcoded admin ID with environment variable
    if (content.includes('2d698450-a16a-4e27-9595-b9d02b9468cd')) {
      content = content.replace(
        /const OWNER_USER_ID = '2d698450-a16a-4e27-9595-b9d02b9468cd'; \/\/ TODO: Replace with your actual user ID/g,
        "const OWNER_USER_ID = process.env.ADMIN_USER_ID;"
      );
      
      content = content.replace(
        /\/\/ HARDCODED OWNER CHECK - Replace '2d698450-a16a-4e27-9595-b9d02b9468cd' with your actual user ID/g,
        "// Owner check using environment variable"
      );
      
      content = content.replace(
        /'2d698450-a16a-4e27-9595-b9d02b9468cd'/g,
        "process.env.ADMIN_USER_ID || ''"
      );
      
      fileFixed = true;
    }

    // Fix specific cases
    if (filePath.includes('test_smart_redirect.js')) {
      content = content.replace(
        /const existingUserId = '2d698450-a16a-4e27-9595-b9d02b9468cd'/g,
        "const existingUserId = process.env.ADMIN_USER_ID || 'test-user-id'"
      );
      fileFixed = true;
    }

    if (filePath.includes('security_policies_fixed.sql')) {
      content = content.replace(
        /'2d698450-a16a-4e27-9595-b9d02b9468cd' -- Fallback, will be replaced by setup script/g,
        "'' -- Will be set by environment variable"
      );
      fileFixed = true;
    }

    if (fileFixed && content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      fixedCount++;
    } else if (fileFixed) {
      console.log(`✅ Already fixed: ${filePath}`);
    } else {
      console.log(`ℹ️  No changes needed: ${filePath}`);
    }

  } catch (error) {
    console.log(`❌ Error fixing ${filePath}: ${error.message}`);
    errorCount++;
  }
});

console.log(`\n🎉 Security fix completed:`);
console.log(`  ✅ Files fixed: ${fixedCount}`);
console.log(`  ❌ Errors: ${errorCount}`);

if (errorCount === 0) {
  console.log('\n🔒 All hardcoded admin IDs have been replaced with environment variables!');
  console.log('📝 Make sure to set ADMIN_USER_ID in your .env.local file');
  console.log('🚨 This was a critical security fix - admin IDs should never be hardcoded');
} else {
  console.log('\n⚠️  Some files could not be fixed. Please review manually.');
}
