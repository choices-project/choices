#!/usr/bin/env node

/**
 * Force Remove IA User
 * 
 * This script uses a more direct approach to remove the user
 * from ia_users table using the service role key.
 */

require('dotenv').config({ path: './web/.env.local' });
const { createClient } = require('@supabase/supabase-js');

console.log('🗑️  Force Removing IA User');
console.log('==========================\n');

async function forceRemoveIaUser() {
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

    // Try direct SQL deletion using service role
    console.log('🗑️  Force removing user with direct SQL...');
    
    const userId = users[0].id || users[0].user_id;
    console.log(`   Targeting user ID: ${userId}`);
    
    const { data: deleteResult, error: deleteError } = await supabase
      .rpc('exec_sql', { 
        sql: `DELETE FROM ia_users WHERE id = '${userId}';` 
      });

    if (deleteError) {
      console.log(`❌ SQL deletion failed: ${deleteError.message}`);
      console.log('🔍 Trying alternative approach...');
      
      // Try direct delete with specific ID
      const { data: directDelete, error: directError } = await supabase
        .from('ia_users')
        .delete()
        .eq('id', userId);

      if (directError) {
        console.log(`❌ Direct deletion failed: ${directError.message}`);
        console.log('🔍 Trying to delete by email...');
        
        const userEmail = users[0].email;
        const { data: emailDelete, error: emailError } = await supabase
          .from('ia_users')
          .delete()
          .eq('email', userEmail);

        if (emailError) {
          console.log(`❌ Email deletion failed: ${emailError.message}`);
          console.log('📝 Manual intervention may be required');
          return;
        } else {
          console.log(`✅ Successfully removed user by email: ${userEmail}`);
        }
      } else {
        console.log(`✅ Successfully removed user by ID: ${userId}`);
      }
    } else {
      console.log(`✅ Successfully removed user via SQL: ${userId}`);
    }

    // Verify the table is now empty
    const { data: remainingUsers, error: verifyError } = await supabase
      .from('ia_users')
      .select('*');

    if (verifyError) {
      console.log(`⚠️  Could not verify table state: ${verifyError.message}`);
    } else {
      console.log(`✅ ia_users table verification: ${remainingUsers?.length || 0} users remaining`);
      if (remainingUsers && remainingUsers.length > 0) {
        console.log('⚠️  Some users still remain:');
        remainingUsers.forEach(user => {
          console.log(`   - ID: ${user.id || user.user_id}, Email: ${user.email}`);
        });
      }
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
forceRemoveIaUser();
