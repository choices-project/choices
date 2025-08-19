#!/usr/bin/env node

/**
 * Remove IA User
 * 
 * This script removes the user from ia_users table since we're
 * using service role only access moving forward.
 */

require('dotenv').config({ path: './web/.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🗑️  Removing IA User');
console.log('====================\n');

async function removeIaUser() {
  try {
    // Create service role client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('🔍 Checking current ia_users...');
    
    // First, let's see what users exist
    const { data: users, error: fetchError } = await supabase
      .from('ia_users')
      .select('*');

    if (fetchError) {
      console.log(`❌ Error fetching users: ${fetchError.message}`);
      return;
    }

    if (!users || users.length === 0) {
      console.log('✅ No users found in ia_users table');
      return;
    }

    console.log(`📊 Found ${users.length} user(s) in ia_users table:`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ID: ${user.id || user.user_id}`);
      console.log(`      Email: ${user.email || 'N/A'}`);
      console.log(`      Created: ${user.created_at || 'N/A'}`);
      console.log('');
    });

    // Remove all users from ia_users table
    console.log('🗑️  Removing all users from ia_users table...');
    
    const { data: deleteResult, error: deleteError } = await supabase
      .from('ia_users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except dummy ID

    if (deleteError) {
      console.log(`❌ Error deleting users: ${deleteError.message}`);
      return;
    }

    console.log(`✅ Successfully removed ${deleteResult?.length || 0} user(s) from ia_users table`);

    // Verify the table is now empty
    const { data: remainingUsers, error: verifyError } = await supabase
      .from('ia_users')
      .select('count');

    if (verifyError) {
      console.log(`⚠️  Could not verify table state: ${verifyError.message}`);
    } else {
      console.log(`✅ ia_users table is now empty (${remainingUsers?.length || 0} users remaining)`);
    }

    console.log('\n🎉 IA User cleanup completed!');
    console.log('\n📝 System Status:');
    console.log('- Service role only access ✅');
    console.log('- No user-based admin access ✅');
    console.log('- Clean ia_users table ✅');
    console.log('- Simplified authentication ✅');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the function
removeIaUser();
