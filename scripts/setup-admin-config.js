#!/usr/bin/env node

/**
 * Setup Admin Configuration Script
 * 
 * This script helps configure admin access properly using environment variables.
 * It addresses the question: "Do I need to be in the database if using service role key?"
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Admin Configuration Setup');
console.log('============================\n');

// Check if .env.local exists
const envPath = path.join(__dirname, '../web/.env.local');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('❌ web/.env.local not found');
  console.log('📝 Creating web/.env.local with template...\n');
  
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

  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ Created web/.env.local template');
} else {
  console.log('✅ web/.env.local exists');
}

console.log('\n🔍 How ADMIN_USER_ID Affects Admin Dashboard Access');
console.log('==================================================');

console.log('\n📋 Current Admin Access Flow:');
console.log('1. User visits /admin/* routes');
console.log('2. Middleware checks authentication (user must be logged in)');
console.log('3. Admin layout renders (no additional checks)');
console.log('4. API calls check ADMIN_USER_ID for data access');

console.log('\n🔒 ADMIN_USER_ID Impact:');
console.log('=======================');

console.log('\n✅ WITH ADMIN_USER_ID:');
console.log('- Admin dashboard pages load (layout renders)');
console.log('- API calls are protected (check user.id === ADMIN_USER_ID)');
console.log('- Only you can access admin data');
console.log('- Other users see dashboard but get 403 errors on API calls');

console.log('\n❌ WITHOUT ADMIN_USER_ID:');
console.log('- Admin dashboard pages still load (layout renders)');
console.log('- API calls fail (ADMIN_USER_ID is undefined)');
console.log('- No one can access admin data');
console.log('- Dashboard shows but is non-functional');

console.log('\n�� Service Role Key Impact:');
console.log('=========================');

console.log('\n✅ WITH Service Role Key:');
console.log('- Full database access (bypasses all RLS)');
console.log('- Can perform any database operation');
console.log('- No user authentication needed for database access');

console.log('\n❌ WITHOUT Service Role Key:');
console.log('- Database operations fail');
console.log('- RLS policies block access');
console.log('- Admin functions non-functional');

console.log('\n🎯 RECOMMENDED SETUP:');
console.log('====================');
console.log('1. Set ADMIN_USER_ID for API route protection');
console.log('2. Set Service Role Key for database access');
console.log('3. Use different email for testing (not admin email)');

console.log('\n📝 Next Steps:');
console.log('==============');
console.log('1. Update web/.env.local with your actual values:');
console.log('   - NEXT_PUBLIC_SUPABASE_URL');
console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY');
console.log('   - SUPABASE_SERVICE_ROLE_KEY');
console.log('   - ADMIN_USER_ID (your actual user ID)');
console.log('   - ADMIN_USER_EMAIL (your actual email)');

console.log('\n2. Create test user with different email:');
console.log('   - Use different email for testing');
console.log('   - Test user will see dashboard but get 403 on API calls');

console.log('\n3. Test admin access:');
console.log('   - Visit /admin/automated-polls');
console.log('   - Should work with proper ADMIN_USER_ID');

console.log('\n🔒 Security Reminder:');
console.log('====================');
console.log('- NEVER commit .env.local to git');
console.log('- Service Role Key gives FULL database access');
console.log('- Keep admin credentials secure');
console.log('- Consider rotating keys regularly');
