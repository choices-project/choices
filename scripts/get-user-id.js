#!/usr/bin/env node

/**
 * Get User ID Script
 * 
 * This script helps you find your user ID to set up owner-only admin access.
 * Run this script while logged into the application to get your user ID.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.log('Please ensure you have:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getUserInfo() {
  try {
    console.log('🔍 Getting current user information...\n');

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('❌ No authenticated user found');
      console.log('Please log in to the application first, then run this script.');
      process.exit(1);
    }

    console.log('✅ Authenticated user found:');
    console.log(`   User ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Created: ${user.created_at}`);

    // Get user profile from ia_users table
    const { data: userProfile, error: profileError } = await supabase
      .from('ia_users')
      .select('*')
      .eq('stable_id', user.id)
      .single();

    if (profileError) {
      console.log('\n⚠️  User profile not found in ia_users table');
      console.log('This is normal for new users.');
    } else {
      console.log('\n📋 User Profile:');
      console.log(`   Stable ID: ${userProfile.stable_id}`);
      console.log(`   Verification Tier: ${userProfile.verification_tier}`);
      console.log(`   Is Active: ${userProfile.is_active}`);
      console.log(`   Created: ${userProfile.created_at}`);
    }

    console.log('\n🔧 Next Steps:');
    console.log('1. Copy your User ID:', user.id);
    console.log('2. Replace "your-user-id-here" in these files:');
    console.log('   - web/app/api/admin/trending-topics/analyze/route.ts');
    console.log('   - web/app/api/admin/trending-topics/route.ts');
    console.log('   - web/app/api/admin/generated-polls/route.ts');
    console.log('   - web/app/api/admin/generated-polls/[id]/approve/route.ts');
    console.log('3. Restart your development server');
    console.log('4. Test admin access at /admin/automated-polls');

    console.log('\n💡 Example replacement:');
    console.log(`const OWNER_USER_ID = '${user.id}';`);

  } catch (error) {
    console.error('❌ Error getting user info:', error.message);
    process.exit(1);
  }
}

// Run the script
getUserInfo();
