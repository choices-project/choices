import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function checkDatabaseStructure() {
  try {
    console.log('🔍 Checking database structure...')
    
    // Try to select from user_profiles to see if it exists and what columns it has
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)
    
    if (profilesError) {
      console.error('❌ Error accessing user_profiles table:', profilesError.message)
      
      // Try to check if the table exists by attempting to insert a test record
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: 'test_check',
          display_name: 'Test User'
        })
      
      if (insertError) {
        console.error('❌ user_profiles table structure error:', insertError.message)
      } else {
        console.log('✅ user_profiles table exists but has different structure')
        // Clean up the test record
        await supabase.from('user_profiles').delete().eq('user_id', 'test_check')
      }
      return
    }
    
    console.log('✅ user_profiles table exists')
    console.log('Sample record structure:', profiles[0])
    
    // Check if ia_users table exists
    const { data: iaUsers, error: iaUsersError } = await supabase
      .from('ia_users')
      .select('*')
      .limit(1)
    
    if (iaUsersError) {
      console.error('❌ Error accessing ia_users table:', iaUsersError.message)
    } else {
      console.log('✅ ia_users table exists')
      console.log('Sample ia_users record structure:', iaUsers[0])
    }
    
    // Try to update onboarding_completed to see if the column exists
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ 
        onboarding_completed: true,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', 'testuser456')
    
    if (updateError) {
      console.error('❌ Error updating onboarding_completed:', updateError.message)
    } else {
      console.log('✅ onboarding_completed column exists and is updatable')
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

checkDatabaseStructure()
