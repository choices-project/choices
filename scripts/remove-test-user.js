#!/usr/bin/env node

/**
 * Remove Test User Script
 * 
 * This script removes the test user (michaeltempesta@gmail.com) and all associated data
 * from the Supabase database.
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

async function removeTestUser() {
  const testEmail = 'michaeltempesta@gmail.com';
  
  console.log('🔍 Looking for test user:', testEmail);
  
  try {
    // First, get the user using the auth API
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      throw userError;
    }
    
    const user = users.find(u => u.email === testEmail);
    
    if (!user) {
      console.log('✅ Test user not found - already removed or never existed');
      return;
    }
    
    console.log('👤 Found user:', { id: user.id, email: user.email, created_at: user.created_at });
    const userId = user.id;
    
    // Remove user's data from all tables
    console.log('🗑️  Removing user data...');
    
    // Remove votes
    const { error: votesError } = await supabase
      .from('votes')
      .delete()
      .eq('user_id', userId);
    
    if (votesError) {
      console.log('⚠️  Error removing votes:', votesError.message);
    } else {
      console.log('✅ Removed user votes');
    }
    
    // Remove polls created by user
    const { error: pollsError } = await supabase
      .from('polls')
      .delete()
      .eq('created_by', userId);
    
    if (pollsError) {
      console.log('⚠️  Error removing polls:', pollsError.message);
    } else {
      console.log('✅ Removed user polls');
    }
    
    // Remove feedback
    const { error: feedbackError } = await supabase
      .from('feedback')
      .delete()
      .eq('user_id', userId);
    
    if (feedbackError) {
      console.log('⚠️  Error removing feedback:', feedbackError.message);
    } else {
      console.log('✅ Removed user feedback');
    }
    
    // Remove analytics data
    const { error: analyticsError } = await supabase
      .from('user_analytics')
      .delete()
      .eq('user_id', userId);
    
    if (analyticsError) {
      console.log('⚠️  Error removing analytics:', analyticsError.message);
    } else {
      console.log('✅ Removed user analytics');
    }
    
    // Remove demographics
    const { error: demographicsError } = await supabase
      .from('user_demographics')
      .delete()
      .eq('user_id', userId);
    
    if (demographicsError) {
      console.log('⚠️  Error removing demographics:', demographicsError.message);
    } else {
      console.log('✅ Removed user demographics');
    }
    
    // Remove privacy settings
    const { error: privacyError } = await supabase
      .from('user_privacy_settings')
      .delete()
      .eq('user_id', userId);
    
    if (privacyError) {
      console.log('⚠️  Error removing privacy settings:', privacyError.message);
    } else {
      console.log('✅ Removed user privacy settings');
    }
    
    // Remove biometric credentials
    const { error: biometricError } = await supabase
      .from('biometric_credentials')
      .delete()
      .eq('user_id', userId);
    
    if (biometricError) {
      console.log('⚠️  Error removing biometric credentials:', biometricError.message);
    } else {
      console.log('✅ Removed user biometric credentials');
    }
    
    // Remove webauthn credentials
    const { error: webauthnError } = await supabase
      .from('webauthn_credentials')
      .delete()
      .eq('user_id', userId);
    
    if (webauthnError) {
      console.log('⚠️  Error removing webauthn credentials:', webauthnError.message);
    } else {
      console.log('✅ Removed user webauthn credentials');
    }
    
    // Finally, remove the user from auth
    console.log('👤 Removing user from auth...');
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);
    
    if (deleteUserError) {
      console.error('❌ Error removing user:', deleteUserError.message);
      throw deleteUserError;
    }
    
    console.log('✅ Successfully removed test user and all associated data');
    
    // Verify user is gone
    const { data: { users: remainingUsers }, error: verifyError } = await supabase.auth.admin.listUsers();
    
    if (verifyError) {
      console.log('⚠️  Could not verify user removal:', verifyError.message);
    } else {
      const userStillExists = remainingUsers.find(u => u.email === testEmail);
      if (!userStillExists) {
        console.log('✅ Verification: User successfully removed');
      } else {
        console.log('⚠️  Warning: User still exists after deletion attempt');
      }
    }
    
  } catch (error) {
    console.error('❌ Error removing test user:', error.message);
    process.exit(1);
  }
}

// Run the script
removeTestUser()
  .then(() => {
    console.log('🎉 Test user removal completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
