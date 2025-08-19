#!/usr/bin/env node

// Test script for smart redirect logic
const { createClient } = require('@supabase/supabase-js')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Mock the getRedirectDestination function logic
async function getRedirectDestination(userId, requestedRedirect) {
  // If user explicitly requested a specific redirect, respect it
  if (requestedRedirect && requestedRedirect !== '/dashboard') {
    return requestedRedirect
  }

  // Check if user has completed onboarding (has a profile)
  try {
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking user profile:', error)
      // If there's an error checking profile, default to dashboard
      return '/dashboard'
    }

    // If no profile exists, user needs to complete onboarding
    if (!profile) {
      console.log('User has no profile, redirecting to onboarding')
      return '/onboarding'
    }

    // User has completed onboarding, go to dashboard or requested destination
    console.log('User has completed onboarding, redirecting to dashboard')
    return '/dashboard'
  } catch (error) {
    console.error('Error in getRedirectDestination:', error)
    // Fallback to dashboard on any error
    return '/dashboard'
  }
}

async function testSmartRedirect() {
  console.log('🧪 Testing Smart Redirect Logic\n')

  // Test 1: User with no profile (new user) - using real user ID
  console.log('Test 1: New user (no profile)')
  const existingUserId = process.env.ADMIN_USER_ID || ''
  const newUserRedirect = await getRedirectDestination(existingUserId, '/dashboard')
  console.log(`Result: ${newUserRedirect}`)
  console.log(`Expected: /onboarding`)
  console.log(`✅ ${newUserRedirect === '/onboarding' ? 'PASS' : 'FAIL'}\n`)

  // Test 2: User with explicit redirect request
  console.log('Test 2: User with explicit redirect request')
  const explicitRedirect = await getRedirectDestination(existingUserId, '/polls')
  console.log(`Result: ${explicitRedirect}`)
  console.log(`Expected: /polls`)
  console.log(`✅ ${explicitRedirect === '/polls' ? 'PASS' : 'FAIL'}\n`)

  // Test 3: User with profile (returning user)
  console.log('Test 3: Returning user (with profile)')
  
  // First, create a test profile for the existing user
  const { error: insertError } = await supabase
    .from('user_profiles')
    .insert({
      user_id: existingUserId,
      display_name: 'Test User',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })

  if (insertError) {
    console.error('Failed to create test profile:', insertError)
    return
  }

  const returningUserRedirect = await getRedirectDestination(existingUserId, '/dashboard')
  console.log(`Result: ${returningUserRedirect}`)
  console.log(`Expected: /dashboard`)
  console.log(`✅ ${returningUserRedirect === '/dashboard' ? 'PASS' : 'FAIL'}\n`)

  // Clean up test data
  await supabase
    .from('user_profiles')
    .delete()
    .eq('user_id', existingUserId)

  console.log('🎉 Smart redirect tests completed!')
}

testSmartRedirect().catch(console.error)
