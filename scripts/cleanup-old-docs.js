#!/usr/bin/env node

/**
 * Cleanup Old Documentation Script
 * 
 * This script safely removes old documentation files that have been consolidated
 * into the new docs/consolidated/ structure.
 */

const fs = require('fs');
const path = require('path');

// Files to be removed (consolidated into new structure)
const filesToRemove = [
  // Core documentation (consolidated into docs/consolidated/)
  'DOCUMENTATION_SYSTEM.md',
  'AGENT_QUICK_REFERENCE.md',
  'AGENT_ONBOARDING.md',
  'DEVELOPMENT_BEST_PRACTICES.md',
  'PROJECT_STATUS_ASSESSMENT.md',
  'CHANGE_LOG.md',
  'NEXT_TASK_READINESS.md',
  
  // Architecture and security (consolidated)
  'PROJECT_SUMMARY.md',
  'SECURITY_STANDARDS.md',
  'IA_TOKENS_ARCHITECTURE_RESTORED.md',
  
  // Deployment (consolidated)
  'DEPLOYMENT_SUCCESS_SUMMARY.md',
  'FINAL_DEPLOYMENT_INSTRUCTIONS.md',
  'DATABASE_SETUP_GUIDE.md',
  'DEPLOYMENT_GUIDE.md',
  'DEPLOYMENT_GUIDE_FIXED.md',
  'QUICK_RLS_DEPLOYMENT.md',
  
  // Features (consolidated)
  'AUTOMATED_POLLS_IMPLEMENTATION_SUMMARY.md',
  'COMPLETE_AUTHENTICATION_SYSTEM.md',
  
  // Historical and cleanup (consolidated)
  'CURRENT_IMPLEMENTATION_ANALYSIS.md',
  'CLEANUP_SUMMARY.md',
  'PROJECT_CLEANUP_STRATEGY.md',
  'CLEANUP_PLAN.md',
  
  // Other (consolidated or no longer needed)
  'EMAIL_TEMPLATE_IMPROVEMENTS.md',
  'SMART_REDIRECT_SYSTEM.md',
  'AUTHENTICATION_FIX_SUMMARY.md'
];

// Files to keep (still needed)
const filesToKeep = [
  'README.md',
  'LICENSE',
  'CODE_OF_CONDUCT.md',
  'CONTRIBUTING.md',
  'GOVERNANCE.md',
  'SECURITY.md',
  'TRANSPARENCY.md',
  'NEUTRALITY_POLICY.md',
  'vercel.json',
  'package.json',
  'package-lock.json',
  '.gitignore',
  'go.work',
  'go.work.sum',
  'nginx.conf',
  'Dockerfile.web',
  'Dockerfile.ia',
  'Dockerfile.po'
];

console.log('🧹 Documentation Cleanup Script');
console.log('================================\n');

console.log('📋 Files to be removed (consolidated):');
filesToRemove.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ❌ ${file}`);
  } else {
    console.log(`  ⚠️  ${file} (not found)`);
  }
});

console.log('\n📋 Files to keep:');
filesToKeep.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ⚠️  ${file} (not found)`);
  }
});

console.log('\n🔍 Checking for other .md files...');
const allMdFiles = fs.readdirSync('.')
  .filter(file => file.endsWith('.md'))
  .filter(file => !filesToRemove.includes(file) && !filesToKeep.includes(file));

if (allMdFiles.length > 0) {
  console.log('\n⚠️  Other .md files found (manual review needed):');
  allMdFiles.forEach(file => {
    console.log(`  🔍 ${file}`);
  });
}

console.log('\n📊 Summary:');
console.log(`  Files to remove: ${filesToRemove.filter(f => fs.existsSync(f)).length}`);
console.log(`  Files to keep: ${filesToKeep.filter(f => fs.existsSync(f)).length}`);
console.log(`  Other .md files: ${allMdFiles.length}`);

console.log('\n🎯 Next steps:');
console.log('1. Review the files listed above');
console.log('2. Run this script with --execute flag to actually remove files');
console.log('3. Update any remaining references to old files');
console.log('4. Test that the new consolidated documentation works correctly');

// Check if --execute flag is provided
if (process.argv.includes('--execute')) {
  console.log('\n🚀 Executing cleanup...');
  
  let removedCount = 0;
  let errorCount = 0;
  
  filesToRemove.forEach(file => {
    if (fs.existsSync(file)) {
      try {
        fs.unlinkSync(file);
        console.log(`  ✅ Removed: ${file}`);
        removedCount++;
      } catch (error) {
        console.log(`  ❌ Error removing ${file}: ${error.message}`);
        errorCount++;
      }
    }
  });
  
  console.log(`\n🎉 Cleanup completed:`);
  console.log(`  ✅ Files removed: ${removedCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  
  if (errorCount === 0) {
    console.log('\n📚 Documentation has been successfully consolidated!');
    console.log('📖 New documentation is available at: docs/consolidated/README.md');
  }
} else {
  console.log('\n💡 To execute the cleanup, run:');
  console.log('   node scripts/cleanup-old-docs.js --execute');
}
