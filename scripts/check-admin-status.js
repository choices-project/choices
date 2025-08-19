#!/usr/bin/env node

require('dotenv').config({ path: './web/.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function checkAdminStatus() {
  console.log('🔍 Checking admin status...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Get all users with their verification tiers
    const { data: users, error } = await supabase
      .from('ia_users')
      .select('stable_id, email, verification_tier, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.log('❌ Error fetching users:', error.message);
      return;
    }

    console.log('📊 Current Users and Their Admin Status:');
    console.log('==========================================');
    
    users.forEach((user, index) => {
      const isAdmin = ['T2', 'T3'].includes(user.verification_tier);
      const status = isAdmin ? '✅ ADMIN' : '❌ USER';
      console.log(`${index + 1}. ${user.email || user.stable_id}`);
      console.log(`   Tier: ${user.verification_tier} ${status}`);
      console.log(`   ID: ${user.stable_id}`);
      console.log('');
    });

    // Show admin users
    const adminUsers = users.filter(user => ['T2', 'T3'].includes(user.verification_tier));
    
    if (adminUsers.length === 0) {
      console.log('⚠️  No admin users found!');
      console.log('To create an admin user, run: node scripts/set-admin-user.js');
    } else {
      console.log(`✅ Found ${adminUsers.length} admin user(s):`);
      adminUsers.forEach(user => {
        console.log(`   - ${user.email || user.stable_id} (${user.verification_tier})`);
      });
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

checkAdminStatus().catch(console.error);
