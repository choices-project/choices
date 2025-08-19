#!/usr/bin/env node

require('dotenv').config({ path: './web/.env.local' });

const { createClient } = require('@supabase/supabase-js');

async function setAdminUser() {
  console.log('🔧 Setting up admin user...\n');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Get all users
    const { data: users, error } = await supabase
      .from('ia_users')
      .select('stable_id, email, verification_tier')
      .order('created_at', { ascending: false });

    if (error) {
      console.log('❌ Error fetching users:', error.message);
      return;
    }

    if (users.length === 0) {
      console.log('❌ No users found in the database');
      console.log('Please create a user account first by registering on the website');
      return;
    }

    console.log('📋 Available Users:');
    console.log('===================');
    
    users.forEach((user, index) => {
      const isAdmin = ['T2', 'T3'].includes(user.verification_tier);
      const status = isAdmin ? '✅ ADMIN' : '❌ USER';
      console.log(`${index + 1}. ${user.email || user.stable_id} (${user.verification_tier}) ${status}`);
    });

    console.log('\n🎯 To set a user as admin, run:');
    console.log('node scripts/set-admin-user.js <user_email_or_id>');
    
    if (process.argv[2]) {
      const targetUser = process.argv[2];
      const user = users.find(u => 
        u.email === targetUser || u.stable_id === targetUser
      );

      if (!user) {
        console.log(`❌ User not found: ${targetUser}`);
        return;
      }

      console.log(`\n🔧 Setting ${user.email || user.stable_id} as admin...`);
      
      const { error: updateError } = await supabase
        .from('ia_users')
        .update({ verification_tier: 'T2' })
        .eq('stable_id', user.stable_id);

      if (updateError) {
        console.log('❌ Error updating user:', updateError.message);
        return;
      }

      console.log('✅ User successfully set as admin!');
      console.log(`   User: ${user.email || user.stable_id}`);
      console.log(`   New Tier: T2`);
      console.log('\n🎉 You can now access the admin dashboard at: http://localhost:3002/admin');
    } else {
      console.log('\n💡 Example:');
      console.log('   node scripts/set-admin-user.js your-email@example.com');
      console.log('   node scripts/set-admin-user.js user-stable-id');
    }

  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

setAdminUser().catch(console.error);
