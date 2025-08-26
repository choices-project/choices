#!/usr/bin/env node

/**
 * Complete User Cleanup Script
 * 
 * This script removes the test user from ALL tables and systems in the database.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './web/.env.local' });

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function completeUserCleanup() {
  const testEmail = 'michaeltempesta@gmail.com';
  
  console.log('🔍 Starting complete user cleanup for:', testEmail);
  
  try {
    // First, get the user using the auth API
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      throw userError;
    }
    
    const user = users.find(u => u.email === testEmail);
    
    if (!user) {
      console.log('✅ User not found in auth system - checking other tables...');
    } else {
      console.log('👤 Found user in auth system:', { id: user.id, email: user.email });
    }
    
    // List of all possible tables to check and clean
    const tablesToClean = [
      'ia_users',
      'user_profiles',
      'votes',
      'polls',
      'feedback',
      'user_analytics',
      'user_demographics',
      'user_privacy_settings',
      'biometric_credentials',
      'webauthn_credentials',
      'admin_audit_log',
      'feature_flags',
      'system_metrics',
      'user_sessions',
      'user_preferences',
      'user_notifications',
      'user_activity_log',
      'poll_analytics',
      'vote_verifications',
      'user_trust_scores'
    ];
    
    console.log('🗑️  Cleaning up user data from all tables...');
    
    for (const table of tablesToClean) {
      try {
        // Try to find the user in this table
        const { data: existingData, error: selectError } = await supabase
          .from(table)
          .select('*')
          .or(`email.eq.${testEmail},user_id.eq.${user?.id || 'null'}`);
        
        if (selectError) {
          console.log(`⚠️  Table ${table}: ${selectError.message}`);
          continue;
        }
        
        if (existingData && existingData.length > 0) {
          console.log(`📋 Found ${existingData.length} records in ${table}`);
          
          // Try different deletion strategies
          let deleteError = null;
          
          // Strategy 1: Delete by email
          if (!deleteError) {
            const { error } = await supabase
              .from(table)
              .delete()
              .eq('email', testEmail);
            deleteError = error;
          }
          
          // Strategy 2: Delete by user_id
          if (!deleteError && user?.id) {
            const { error } = await supabase
              .from(table)
              .delete()
              .eq('user_id', user.id);
            deleteError = error;
          }
          
          // Strategy 3: Delete by user_id with different column name
          if (!deleteError && user?.id) {
            const { error } = await supabase
              .from(table)
              .delete()
              .eq('user', user.id);
            deleteError = error;
          }
          
          if (deleteError) {
            console.log(`❌ Error cleaning ${table}: ${deleteError.message}`);
          } else {
            console.log(`✅ Cleaned ${table}`);
          }
        } else {
          console.log(`✅ Table ${table}: no user data found`);
        }
        
      } catch (err) {
        console.log(`⚠️  Table ${table}: ${err.message}`);
      }
    }
    
    // Remove from auth system if user exists
    if (user) {
      console.log('👤 Removing user from auth system...');
      const { error: deleteUserError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (deleteUserError) {
        console.error('❌ Error removing user from auth:', deleteUserError.message);
      } else {
        console.log('✅ User removed from auth system');
      }
    }
    
    // Final verification
    console.log('🔍 Final verification...');
    
    // Check auth system
    const { data: { users: remainingUsers }, error: verifyError } = await supabase.auth.admin.listUsers();
    if (!verifyError) {
      const userStillExists = remainingUsers.find(u => u.email === testEmail);
      if (!userStillExists) {
        console.log('✅ User not found in auth system');
      } else {
        console.log('⚠️  User still exists in auth system');
      }
    }
    
    // Check ia_users table specifically
    try {
      const { data: iaUsers, error: iaError } = await supabase
        .from('ia_users')
        .select('*')
        .eq('email', testEmail);
      
      if (iaError) {
        console.log(`⚠️  Could not check ia_users: ${iaError.message}`);
      } else if (iaUsers && iaUsers.length > 0) {
        console.log(`❌ User still found in ia_users table: ${iaUsers.length} records`);
        
        // Try to delete from ia_users
        const { error: deleteIaError } = await supabase
          .from('ia_users')
          .delete()
          .eq('email', testEmail);
        
        if (deleteIaError) {
          console.log(`❌ Could not delete from ia_users: ${deleteIaError.message}`);
        } else {
          console.log('✅ User removed from ia_users table');
        }
      } else {
        console.log('✅ User not found in ia_users table');
      }
    } catch (err) {
      console.log(`⚠️  Error checking ia_users: ${err.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
}

// Run the script
completeUserCleanup()
  .then(() => {
    console.log('🎉 Complete user cleanup finished!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Cleanup failed:', error);
    process.exit(1);
  });

