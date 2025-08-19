#!/usr/bin/env node

/**
 * Documentation Update Reminder
 * 
 * This script reminds developers to update documentation after changes.
 * Can be used as a git hook or manual reminder.
 */

const fs = require('fs');
const path = require('path');

const DOCUMENTATION_FILES = [
  'docs/CURRENT_STATE_AND_FUTURE_DIRECTIONS.md',
  'docs/DEVELOPMENT_LESSONS_LEARNED.md',
  'docs/QUICK_START_CHECKLIST.md',
  'docs/consolidated/README.md',
  'docs/SUPABASE_BEST_PRACTICES.md',
  'docs/DATABASE_OPTIMIZATION_SUMMARY.md',
  'docs/AGENT_ONBOARDING_GUIDE.md'
];

function showReminder() {
  console.log('📚 DOCUMENTATION UPDATE REMINDER');
  console.log('================================\n');
  
  console.log('🎯 Remember: "Every successful change requires a documentation update."\n');
  
  console.log('📋 Documentation Update Checklist:');
  console.log('  ✅ Update relevant documentation files');
  console.log('  ✅ Update timestamps (Last Updated field)');
  console.log('  ✅ Add change notes if significant');
  console.log('  ✅ Update any affected guides or examples');
  console.log('  ✅ Verify documentation accuracy');
  console.log('  ✅ Commit documentation changes with code changes\n');
  
  console.log('📁 Key Documentation Files:');
  DOCUMENTATION_FILES.forEach(file => {
    const exists = fs.existsSync(file) ? '✅' : '❌';
    console.log(`  ${exists} ${file}`);
  });
  
  console.log('\n📝 Update Timestamp Format:');
  console.log('```markdown');
  console.log('**Last Updated**: YYYY-MM-DD (Updated with [change description])');
  console.log('```\n');
  
  console.log('📚 For detailed workflow, see: docs/DOCUMENTATION_UPDATE_WORKFLOW.md\n');
  
  console.log('🚀 Happy documenting! 📖');
}

function checkDocumentationHealth() {
  console.log('🔍 Checking Documentation Health...\n');
  
  let healthy = true;
  
  DOCUMENTATION_FILES.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const hasTimestamp = content.includes('**Last Updated**:');
      const hasCreated = content.includes('**Created**:');
      
      if (!hasTimestamp || !hasCreated) {
        console.log(`⚠️  ${file} - Missing timestamp information`);
        healthy = false;
      } else {
        console.log(`✅ ${file} - Timestamps present`);
      }
    } else {
      console.log(`❌ ${file} - File not found`);
      healthy = false;
    }
  });
  
  console.log('\n📊 Documentation Health Summary:');
  if (healthy) {
    console.log('✅ All documentation files are properly formatted');
  } else {
    console.log('⚠️  Some documentation files need attention');
  }
  
  return healthy;
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--check') || args.includes('-c')) {
    checkDocumentationHealth();
  } else {
    showReminder();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { showReminder, checkDocumentationHealth };
