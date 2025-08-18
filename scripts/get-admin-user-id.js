#!/usr/bin/env node

/**
 * Get Admin User ID Script
 * 
 * This script helps you get your current user ID and set up admin configuration.
 */

require('dotenv').config({ path: './web/.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials in web/.env.local');
  console.log('Please set:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getAdminUserInfo() {
  console.log('🔍 Getting Admin User Information');
  console.log('================================\n');

  try {
    // Get all users (service role key bypasses RLS)
    const { data: users, error } = await supabase
      .from('ia_users')
      .select('stable_id, email, verification_tier, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.log('❌ Error fetching users:', error.message);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ No users found in database');
      console.log('You may need to create a user first or check the table name');
      return;
    }

    console.log('📋 Found Users:');
    console.log('===============');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. Email: ${user.email}`);
      console.log(`   User ID: ${user.stable_id}`);
      console.log(`   Tier: ${user.verification_tier}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log('');
    });

    console.log('🎯 To set up admin access:');
    console.log('=========================');
    console.log('1. Choose your admin user ID from the list above');
    console.log('2. Update web/.env.local with:');
    console.log(`   ADMIN_USER_ID=your_chosen_user_id`);
    console.log(`   ADMIN_USER_EMAIL=your_chosen_email`);
    console.log('');
    console.log('3. For testing, create a different user with a different email');
    console.log('4. Test user will see admin dashboard but get 403 on API calls');

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

getAdminUserInfo();
