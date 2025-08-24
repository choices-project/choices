#!/usr/bin/env node

// Test User Synchronization Script
// This script tests the connection between Supabase Auth and ia_users table

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: './web/.env.local' })

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in web/.env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testUserSync() {
  console.log('🔍 Testing User Synchronization...')
  console.log('=====================================')
  
  try {
    // 1. Check if we can connect to Supabase
    console.log('\n1. Testing Supabase connection...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('ia_users')
      .select('count')
      .limit(1)
    
    if (connectionError) {
      console.error('❌ Connection failed:', connectionError.message)
      return
    }
    console.log('✅ Supabase connection successful')

    // 2. Check if user is authenticated
    console.log('\n2. Checking authentication status...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('❌ Auth error:', authError.message)
      console.log('\n💡 To test with authentication:')
      console.log('   1. Go to http://localhost:3000/register')
      console.log('   2. Create an account and verify your email')
      console.log('   3. Run this script again')
      return
    }

    if (!user) {
      console.log('❌ No authenticated user found')
      console.log('\n💡 To test with authentication:')
      console.log('   1. Go to http://localhost:3000/register')
      console.log('   2. Create an account and verify your email')
      console.log('   3. Run this script again')
      return
    }

    console.log('✅ User authenticated:', user.email)
    console.log('   User ID:', user.id)
    console.log('   Email confirmed:', user.email_confirmed_at ? 'Yes' : 'No')

    // 3. Check if user exists in ia_users table
    console.log('\n3. Checking ia_users table...')
    const { data: iaUser, error: iaError } = await supabase
      .from('ia_users')
      .select('*')
      .eq('stable_id', user.id)
      .single()

    if (iaError && iaError.code !== 'PGRST116') {
      console.error('❌ Error checking ia_users:', iaError.message)
      return
    }

    if (!iaUser) {
      console.log('❌ User not found in ia_users table')
      console.log('   This means the user sync is not working properly')
      
      // 4. Try to create user in ia_users table
      console.log('\n4. Attempting to create user in ia_users table...')
      const { data: newUser, error: createError } = await supabase
        .from('ia_users')
        .insert({
          stable_id: user.id,
          email: user.email,
          verification_tier: 'T0',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) {
        console.error('❌ Failed to create user in ia_users:', createError.message)
        console.log('\n🔧 Possible issues:')
        console.log('   - ia_users table might not exist')
        console.log('   - RLS policies might be blocking the insert')
        console.log('   - Database permissions might be insufficient')
        return
      }

      console.log('✅ Successfully created user in ia_users table:')
      console.log('   ID:', newUser.id)
      console.log('   Stable ID:', newUser.stable_id)
      console.log('   Email:', newUser.email)
      console.log('   Verification Tier:', newUser.verification_tier)
    } else {
      console.log('✅ User found in ia_users table:')
      console.log('   ID:', iaUser.id)
      console.log('   Stable ID:', iaUser.stable_id)
      console.log('   Email:', iaUser.email)
      console.log('   Verification Tier:', iaUser.verification_tier)
      console.log('   Active:', iaUser.is_active)
    }

    // 5. Check if user has a profile
    console.log('\n5. Checking user profile...')
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Error checking user profile:', profileError.message)
      return
    }

    if (!profile) {
      console.log('❌ No user profile found')
      console.log('   User needs to complete onboarding')
    } else {
      console.log('✅ User profile exists')
    }

    // 6. Summary
    console.log('\n📊 Summary:')
    console.log('   Supabase Auth: ✅ Connected')
    console.log('   User Authentication: ✅ Authenticated')
    console.log('   IA Users Table: ' + (iaUser || newUser ? '✅ Synced' : '❌ Not synced'))
    console.log('   User Profile: ' + (profile ? '✅ Exists' : '❌ Missing'))

    if (!profile) {
      console.log('\n🎯 Next Steps:')
      console.log('   1. Complete onboarding at http://localhost:3000/onboarding')
      console.log('   2. Create your user profile')
      console.log('   3. You\'ll then be redirected to the dashboard')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
  }
}

// Run the test
testUserSync().catch(console.error)

