#!/usr/bin/env node

/**
 * Safe Admin Configuration Setup
 * 
 * This script helps configure admin access with strict safety checks
 * to prevent accidental overwriting of sensitive files.
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Safe Admin Configuration Setup');
console.log('=================================\n');

// Safety check function
function checkEnvFile() {
  const envPath = path.join(__dirname, '../web/.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ web/.env.local not found');
    console.log('📝 Creating web/.env.local with template...\n');
    return { exists: false, hasRealValues: false };
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const hasRealValues = !content.includes('your_') && !content.includes('here');
  
  if (hasRealValues) {
    console.log('🚨 CRITICAL: web/.env.local contains real values!');
    console.log('🚨 DO NOT OVERWRITE THIS FILE!');
    console.log('🚨 This file contains sensitive information.');
    console.log('');
    console.log('📝 To update values, manually edit the file.');
    console.log('📝 Never use scripts to overwrite existing .env.local files.');
    return { exists: true, hasRealValues: true };
  } else {
    console.log('✅ web/.env.local exists with placeholder values');
    console.log('📝 Safe to update with real values');
    return { exists: true, hasRealValues: false };
  }
}

// Check current state
const envStatus = checkEnvFile();

if (envStatus.hasRealValues) {
  console.log('\n🔒 SAFETY PROTOCOL ENFORCED');
  console.log('===========================');
  console.log('The .env.local file contains real sensitive values.');
  console.log('For security reasons, this script cannot modify it.');
  console.log('');
  console.log('📝 Manual steps required:');
  console.log('1. Open web/.env.local in your editor');
  console.log('2. Update the placeholder values with your real values');
  console.log('3. Save the file');
  console.log('');
  console.log('🔍 Current file location: web/.env.local');
  process.exit(0);
}

// Only proceed if file doesn't exist or has placeholders
if (!envStatus.exists) {
  const envTemplate = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Admin Configuration (KEEP PRIVATE - NEVER COMMIT)
ADMIN_USER_ID=your_admin_user_id_here
ADMIN_USER_EMAIL=your_admin_email_here

# Optional: Database Configuration
LOCAL_DATABASE=false
LOCAL_DATABASE_URL=

# Security Note: 
# - ADMIN_USER_ID is only used for API route access control
# - Service Role Key bypasses all database restrictions
# - Consider removing ADMIN_USER_ID entirely and using service role only
`;

  const envPath = path.join(__dirname, '../web/.env.local');
  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ Created web/.env.local template');
  console.log('📝 Now manually update it with your real values');
}

console.log('\n📋 Next Steps:');
console.log('==============');
console.log('1. Open web/.env.local in your editor');
console.log('2. Replace placeholder values with your real values:');
console.log('   - NEXT_PUBLIC_SUPABASE_URL');
console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
console.log('   - SUPABASE_SERVICE_ROLE_KEY');
console.log('   - ADMIN_USER_ID (run get-admin-user-id.js to find this)');
console.log('   - ADMIN_USER_EMAIL');
console.log('');
console.log('3. Test configuration:');
console.log('   node scripts/get-admin-user-id.js');

console.log('\n🔒 Safety Protocol Established');
console.log('=============================');
console.log('✅ Scripts will never overwrite .env.local with real values');
console.log('✅ Manual confirmation required for sensitive file changes');
console.log('✅ Safety checks prevent accidental data loss');
