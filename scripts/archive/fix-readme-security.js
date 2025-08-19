#!/usr/bin/env node

/**
 * Fix README Security Issues
 * 
 * This script replaces hardcoded values in README.md with proper placeholders
 */

const fs = require('fs');

console.log('🔒 Fixing README Security Issues');
console.log('================================\n');

try {
  let content = fs.readFileSync('README.md', 'utf8');
  let originalContent = content;

  // Replace hardcoded values with placeholders
  content = content.replace(
    /NEXTAUTH_SECRET="\[GENERATE-A-SECURE-RANDOM-STRING\]"/g,
    'NEXTAUTH_SECRET="your-secure-random-string-here"'
  );
  
  content = content.replace(
    /SUPABASE_ANON_KEY="your-supabase-anon-key"/g,
    'SUPABASE_ANON_KEY="your-supabase-anon-key-here"'
  );
  
  content = content.replace(
    /NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-vapid-key"/g,
    'NEXT_PUBLIC_VAPID_PUBLIC_KEY="your-vapid-public-key-here"'
  );

  if (content !== originalContent) {
    fs.writeFileSync('README.md', content, 'utf8');
    console.log('✅ Fixed README.md security issues');
  } else {
    console.log('ℹ️  No changes needed in README.md');
  }

} catch (error) {
  console.log(`❌ Error fixing README.md: ${error.message}`);
}

console.log('\n🎉 README security fix completed!');
