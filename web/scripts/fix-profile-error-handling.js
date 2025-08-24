#!/usr/bin/env node

/**
 * Script to fix profileError handling in admin API routes
 * This addresses the root cause of unused variable warnings by properly handling database errors
 */

const fs = require('fs');
const path = require('path');

// Pattern to find and fix
const PROFILE_ERROR_PATTERN = /const \{ data: userProfile, error: profileError \} = await supabase\s*\.from\('ia_users'\)\s*\.select\('verification_tier'\)\s*\.eq\('stable_id', user\.id\)\s*\.single\(\);\s*\n\s*if \(!userProfile \|\| !\['T2', 'T3'\]\.includes\(userProfile\.verification_tier\)\)/g;

// Replacement pattern with proper error handling
const PROFILE_ERROR_FIX = `const { data: userProfile, error: profileError } = await supabase
      .from('ia_users')
      .select('verification_tier')
      .eq('stable_id', user.id)
      .single();

    if (profileError) {
      devLog('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to verify user permissions' },
        { status: 500 }
      );
    }

    if (!userProfile || !['T2', 'T3'].includes(userProfile.verification_tier))`;

// Files to process
const API_ROUTES = [
  'app/api/admin/breaking-news/[id]/poll-context/route.ts',
  'app/api/admin/feedback/[id]/generate-issue/route.ts',
  'app/api/admin/feedback/[id]/status/route.ts',
  'app/api/admin/feedback/bulk-generate-issues/route.ts',
  'app/api/admin/feedback/export/route.ts',
  'app/api/admin/feedback/route.ts',
  'app/api/admin/generated-polls/[id]/approve/route.ts',
  'app/api/admin/system-metrics/route.ts',
  'app/api/admin/trending-topics/analyze/route.ts',
  'app/api/admin/trending-topics/route.ts'
];

function fixProfileErrorHandling(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Check if the pattern exists
    if (!PROFILE_ERROR_PATTERN.test(content)) {
      console.log(`ℹ️  No profileError pattern found in: ${filePath}`);
      return false;
    }

    // Apply the fix
    const fixedContent = content.replace(PROFILE_ERROR_PATTERN, PROFILE_ERROR_FIX);
    
    // Check if content actually changed
    if (content === fixedContent) {
      console.log(`ℹ️  No changes needed in: ${filePath}`);
      return false;
    }

    // Write the fixed content
    fs.writeFileSync(fullPath, fixedContent, 'utf8');
    console.log(`✅ Fixed profileError handling in: ${filePath}`);
    return true;
    
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('🔧 Fixing profileError handling in admin API routes...\n');
  
  let fixedCount = 0;
  const totalFiles = API_ROUTES.length;
  
  for (const filePath of API_ROUTES) {
    if (fixProfileErrorHandling(filePath)) {
      fixedCount++;
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${totalFiles}`);
  console.log(`   Files fixed: ${fixedCount}`);
  console.log(`   Files unchanged: ${totalFiles - fixedCount}`);
  
  if (fixedCount > 0) {
    console.log(`\n🎉 Successfully fixed ${fixedCount} files!`);
    console.log(`   This addresses the root cause of unused variable warnings by properly handling database errors.`);
  } else {
    console.log(`\nℹ️  No files needed fixing.`);
  }
}

if (require.main === module) {
  main();
}

module.exports = { fixProfileErrorHandling };
