#!/usr/bin/env node

/**
 * Safe Environment Variable Update Helper
 * 
 * This script helps you update your .env.local file with real values
 * without overwriting existing real values.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const envPath = path.join(__dirname, '../web/.env.local');

console.log('🔧 Environment Variable Update Helper');
console.log('====================================\n');

// Check current state
function checkCurrentEnv() {
  if (!fs.existsSync(envPath)) {
    console.log('❌ web/.env.local not found');
    console.log('📝 Creating new file...');
    return { exists: false, hasRealValues: false };
  }

  const content = fs.readFileSync(envPath, 'utf8');
  const hasRealValues = !content.includes('your_') && !content.includes('here');
  
  if (hasRealValues) {
    console.log('✅ web/.env.local exists with real values');
    console.log('🚨 SAFETY: This file contains sensitive information');
    console.log('🚨 This script will NOT overwrite existing real values');
    return { exists: true, hasRealValues: true };
  } else {
    console.log('⚠️  web/.env.local exists with placeholder values');
    console.log('📝 Safe to update with real values');
    return { exists: true, hasRealValues: false };
  }
}

// Create or update .env.local
function updateEnvFile() {
  const envStatus = checkCurrentEnv();
  
  if (envStatus.hasRealValues) {
    console.log('\n🔒 SAFETY PROTOCOL ENFORCED');
    console.log('===========================');
    console.log('The .env.local file contains real sensitive values.');
    console.log('For security reasons, this script cannot modify it.');
    console.log('');
    console.log('📝 Manual steps required:');
    console.log('1. Open web/.env.local in your editor');
    console.log('2. Update any remaining placeholder values');
    console.log('3. Save the file');
    console.log('');
    console.log('🔍 Current file location: web/.env.local');
    return;
  }

  const template = `# Supabase Configuration
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

  if (!envStatus.exists) {
    fs.writeFileSync(envPath, template);
    console.log('✅ Created web/.env.local template');
  }

  console.log('\n📋 Next Steps:');
  console.log('==============');
  console.log('1. Open web/.env.local in your editor:');
  console.log('   nano web/.env.local');
  console.log('   or');
  console.log('   code web/.env.local');
  console.log('');
  console.log('2. Replace placeholder values with your real values:');
  console.log('   - NEXT_PUBLIC_SUPABASE_URL (from Supabase dashboard)');
  console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY (from Supabase dashboard)');
  console.log('   - SUPABASE_SERVICE_ROLE_KEY (from Supabase dashboard)');
  console.log('   - ADMIN_USER_ID (run get-admin-user-id.js after updating)');
  console.log('   - ADMIN_USER_EMAIL (your admin email)');
  console.log('');
  console.log('3. Test configuration:');
  console.log('   node scripts/test-environment-and-database.js');
  console.log('');
  console.log('🔒 Safety Protocol:');
  console.log('===================');
  console.log('✅ Scripts will never overwrite .env.local with real values');
  console.log('✅ Manual confirmation required for sensitive file changes');
  console.log('✅ Safety checks prevent accidental data loss');
}

// Run the update
updateEnvFile();
