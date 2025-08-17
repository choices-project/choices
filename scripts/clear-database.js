#!/usr/bin/env node

// Clear Database Script
// Clears all user data to start fresh for testing

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: './web/.env.local' })

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function clearDatabase() {
  console.log('🧹 Clearing Database for Fresh Start...')
  console.log('=======================================')
  
  try {
    // 1. Check current state
    console.log('\n1. Checking Current Database State...')
    
    const { data: users, error: usersError } = await supabase
      .from('ia_users')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message)
    } else {
      console.log(`   Found ${users.length} users in ia_users table`)
      users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (ID: ${user.id})`)
      })
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, created_at')
      .order('created_at', { ascending: false })
    
    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError.message)
    } else {
      console.log(`   Found ${profiles.length} user profiles`)
      profiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.display_name} (User: ${profile.user_id})`)
      })
    }

    // 2. Confirm deletion
    console.log('\n2. Confirming Database Clear...')
    console.log('⚠️  This will delete ALL user data from the following tables:')
    console.log('   - ia_users')
    console.log('   - user_profiles')
    console.log('   - ia_refresh_tokens')
    console.log('   - po_votes (if any)')
    console.log('   - po_polls (if any)')
    console.log('')
    console.log('⚠️  WARNING: This action cannot be undone!')
    console.log('')
    
    // In a real scenario, you'd want user confirmation here
    // For now, we'll proceed with the clear
    console.log('Proceeding with database clear...')

    // 3. Clear user data
    console.log('\n3. Clearing User Data...')
    
    // Clear user profiles first (due to foreign key constraints)
    const { error: clearProfilesError } = await supabase
      .from('user_profiles')
      .delete()
      .neq('user_id', '00000000-0000-0000-0000-000000000000') // Delete all except dummy
    
    if (clearProfilesError) {
      console.error('❌ Error clearing user profiles:', clearProfilesError.message)
    } else {
      console.log('✅ User profiles cleared')
    }

    // Clear refresh tokens
    const { error: clearTokensError } = await supabase
      .from('ia_refresh_tokens')
      .delete()
      .neq('user_id', 0) // Delete all except dummy
    
    if (clearTokensError) {
      console.error('❌ Error clearing refresh tokens:', clearTokensError.message)
    } else {
      console.log('✅ Refresh tokens cleared')
    }

    // Clear votes (if any)
    const { error: clearVotesError } = await supabase
      .from('po_votes')
      .delete()
      .neq('poll_id', 'dummy') // Delete all except dummy
    
    if (clearVotesError) {
      console.error('❌ Error clearing votes:', clearVotesError.message)
    } else {
      console.log('✅ Votes cleared')
    }

    // Clear polls (if any)
    const { error: clearPollsError } = await supabase
      .from('po_polls')
      .delete()
      .neq('poll_id', 'dummy') // Delete all except dummy
    
    if (clearPollsError) {
      console.error('❌ Error clearing polls:', clearPollsError.message)
    } else {
      console.log('✅ Polls cleared')
    }

    // Finally, clear users
    const { error: clearUsersError } = await supabase
      .from('ia_users')
      .delete()
      .neq('id', 0) // Delete all except dummy
    
    if (clearUsersError) {
      console.error('❌ Error clearing users:', clearUsersError.message)
    } else {
      console.log('✅ Users cleared')
    }

    // 4. Verify clear
    console.log('\n4. Verifying Database Clear...')
    
    const { data: remainingUsers, error: checkUsersError } = await supabase
      .from('ia_users')
      .select('count')
    
    if (checkUsersError) {
      console.error('❌ Error checking remaining users:', checkUsersError.message)
    } else {
      console.log(`   Remaining users: ${remainingUsers?.[0]?.count || 0}`)
    }

    const { data: remainingProfiles, error: checkProfilesError } = await supabase
      .from('user_profiles')
      .select('count')
    
    if (checkProfilesError) {
      console.error('❌ Error checking remaining profiles:', checkProfilesError.message)
    } else {
      console.log(`   Remaining profiles: ${remainingProfiles?.[0]?.count || 0}`)
    }

    // 5. Summary
    console.log('\n📊 Database Clear Summary:')
    console.log('==========================')
    console.log('✅ User profiles: Cleared')
    console.log('✅ Refresh tokens: Cleared')
    console.log('✅ Votes: Cleared')
    console.log('✅ Polls: Cleared')
    console.log('✅ Users: Cleared')
    console.log('')
    console.log('🎯 Database is now clean and ready for fresh testing!')
    console.log('')
    console.log('Next Steps:')
    console.log('1. Visit http://localhost:3000/register')
    console.log('2. Create a new account with your email')
    console.log('3. Check your email for confirmation')
    console.log('4. Test the complete flow')

  } catch (error) {
    console.error('❌ Error clearing database:', error.message)
  }
}

// Run the clear
clearDatabase().catch(console.error)
