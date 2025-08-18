#!/usr/bin/env node

/**
 * Find User by Email Script
 * 
 * This script helps find your user ID by email address when authentication is broken.
 * It uses the service role key to directly query the database.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.log('Please ensure you have:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function findUserByEmail() {
  try {
    console.log('🔍 Find User by Email Script');
    console.log('============================\n');

    // Get email from command line argument
    const email = process.argv[2];
    
    if (!email) {
      console.log('❌ Please provide an email address');
      console.log('Usage: node scripts/find-user-by-email.js your-email@example.com');
      process.exit(1);
    }

    console.log(`🔍 Searching for user with email: ${email}\n`);

    // Search in Supabase Auth users
    console.log('1. Searching in Supabase Auth...');
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('❌ Error accessing Supabase Auth:', authError.message);
    } else {
      const authUser = authUsers.users.find(user => 
        user.email && user.email.toLowerCase() === email.toLowerCase()
      );
      
      if (authUser) {
        console.log('✅ Found user in Supabase Auth:');
        console.log(`   User ID: ${authUser.id}`);
        console.log(`   Email: ${authUser.email}`);
        console.log(`   Created: ${authUser.created_at}`);
        console.log(`   Email confirmed: ${authUser.email_confirmed_at ? 'Yes' : 'No'}`);
        console.log(`   Last sign in: ${authUser.last_sign_in_at || 'Never'}`);
      } else {
        console.log('❌ User not found in Supabase Auth');
      }
    }

    // Search in ia_users table
    console.log('\n2. Searching in ia_users table...');
    const { data: iaUsers, error: iaError } = await supabase
      .from('ia_users')
      .select('*')
      .eq('email', email.toLowerCase());

    if (iaError) {
      console.error('❌ Error accessing ia_users table:', iaError.message);
    } else if (iaUsers && iaUsers.length > 0) {
      const iaUser = iaUsers[0];
      console.log('✅ Found user in ia_users table:');
      console.log(`   ID: ${iaUser.id}`);
      console.log(`   Stable ID: ${iaUser.stable_id}`);
      console.log(`   Email: ${iaUser.email}`);
      console.log(`   Verification Tier: ${iaUser.verification_tier}`);
      console.log(`   Is Active: ${iaUser.is_active}`);
      console.log(`   Created: ${iaUser.created_at}`);
    } else {
      console.log('❌ User not found in ia_users table');
    }

    // Search in user_profiles table
    console.log('\n3. Searching in user_profiles table...');
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email.toLowerCase());

    if (profileError) {
      console.error('❌ Error accessing user_profiles table:', profileError.message);
    } else if (profiles && profiles.length > 0) {
      const profile = profiles[0];
      console.log('✅ Found user profile:');
      console.log(`   User ID: ${profile.user_id}`);
      console.log(`   Email: ${profile.email}`);
      console.log(`   Created: ${profile.created_at}`);
    } else {
      console.log('❌ User profile not found');
    }

    // Summary and next steps
    console.log('\n📋 Summary:');
    console.log('===========');
    
    const authUser = authUsers?.users.find(user => 
      user.email && user.email.toLowerCase() === email.toLowerCase()
    );
    const iaUser = iaUsers?.[0];
    
    if (authUser) {
      console.log(`✅ Supabase Auth User ID: ${authUser.id}`);
      console.log(`✅ ia_users Stable ID: ${iaUser?.stable_id || 'Not found'}`);
      
      console.log('\n🔧 Next Steps:');
      console.log('1. Copy your User ID:', authUser.id);
      console.log('2. Replace "your-user-id-here" in these files:');
      console.log('   - database/security_policies.sql');
      console.log('   - web/app/api/admin/trending-topics/analyze/route.ts');
      console.log('   - web/app/api/admin/trending-topics/route.ts');
      console.log('   - web/app/api/admin/generated-polls/route.ts');
      console.log('   - web/app/api/admin/generated-polls/[id]/approve/route.ts');
      console.log('3. Deploy security policies: node scripts/deploy-security-policies.js');
      console.log('4. Restart your development server');
      console.log('5. Test admin access at /admin/automated-polls');

      console.log('\n💡 Example replacement:');
      console.log(`const OWNER_USER_ID = '${authUser.id}';`);
    } else {
      console.log('❌ No user found with this email address');
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Check if the email address is correct');
      console.log('2. Try a different email address if you have multiple accounts');
      console.log('3. Check if you need to register first');
    }

  } catch (error) {
    console.error('❌ Error finding user:', error.message);
    process.exit(1);
  }
}

// Run the script
findUserByEmail();
