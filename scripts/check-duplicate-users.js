#!/usr/bin/env node

// Check for Duplicate Users
// This script checks if there are multiple users with the same email

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

async function checkDuplicateUsers() {
  console.log('🔍 Checking for Duplicate Users...')
  console.log('==================================')
  
  const testEmail = 'michaeltempesta@gmail.com'
  
  try {
    console.log(`\n📧 Checking for users with email: ${testEmail}`)
    
    // Check ia_users table
    console.log('\n1. Checking ia_users table...')
    const { data: iaUsers, error: iaError } = await supabase
      .from('ia_users')
      .select('*')
      .eq('email', testEmail)
    
    if (iaError) {
      console.error('❌ Error checking ia_users:', iaError.message)
    } else {
      console.log(`   Found ${iaUsers.length} users in ia_users table`)
      iaUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user.id}, Stable ID: ${user.stable_id}, Created: ${user.created_at}`)
      })
    }

    // Check user_profiles table
    console.log('\n2. Checking user_profiles table...')
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', testEmail)
    
    if (profileError) {
      console.error('❌ Error checking user_profiles:', profileError.message)
    } else {
      console.log(`   Found ${profiles.length} profiles in user_profiles table`)
      profiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. User ID: ${profile.user_id}, Display Name: ${profile.display_name}`)
      })
    }

    // Try to get current authenticated user
    console.log('\n3. Checking current authenticated user...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.log('   No authenticated user found')
    } else if (user) {
      console.log(`   Authenticated user: ${user.email}`)
      console.log(`   User ID: ${user.id}`)
      console.log(`   Email confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
      console.log(`   Created: ${user.created_at}`)
    }

    // Summary
    console.log('\n📊 Summary:')
    console.log('============')
    console.log(`   ia_users entries: ${iaUsers?.length || 0}`)
    console.log(`   user_profiles entries: ${profiles?.length || 0}`)
    console.log(`   Currently authenticated: ${user ? 'Yes' : 'No'}`)
    
    if (iaUsers && iaUsers.length > 1) {
      console.log('\n⚠️  WARNING: Multiple users found in ia_users table!')
      console.log('   This could cause authentication issues.')
    }
    
    if (profiles && profiles.length > 1) {
      console.log('\n⚠️  WARNING: Multiple profiles found in user_profiles table!')
      console.log('   This could cause profile loading issues.')
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
  }
}

// Run the check
checkDuplicateUsers().catch(console.error)
