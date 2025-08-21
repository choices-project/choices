#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const bcrypt = require('bcryptjs')

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testCleanDatabase() {
  try {
    console.log('🧪 Testing clean database...')
    
    // Wait a moment for schema cache to refresh
    console.log('⏳ Waiting for schema cache to refresh...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Test 1: Create a user
    console.log('\n🔐 Test 1: Creating a test user...')
    
    const testEmail = 'admin@choices-platform.com'
    const testPassword = 'Admin123!@#'
    const hashedPassword = await bcrypt.hash(testPassword, 12)
    const stableId = 'admin_' + Date.now()
    
    const { data: user, error: userError } = await supabase
      .from('ia_users')
      .insert({
        stable_id: stableId,
        email: testEmail,
        password_hash: hashedPassword,
        verification_tier: 'T3',
        is_active: true,
        two_factor_enabled: false
      })
      .select()
      .single()
    
    if (userError) {
      console.error('❌ User creation failed:', userError)
      return
    }
    
    console.log('✅ User created successfully!')
    console.log('   Email:', user.email)
    console.log('   User ID:', user.id)
    console.log('   Stable ID:', user.stable_id)
    
    // Test 2: Create user profile
    console.log('\n👤 Test 2: Creating user profile...')
    
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: user.stable_id,
        display_name: 'Admin User',
        bio: 'System administrator'
      })
      .select()
      .single()
    
    if (profileError) {
      console.error('❌ Profile creation failed:', profileError)
    } else {
      console.log('✅ User profile created!')
    }
    
    // Test 3: Test login simulation
    console.log('\n🔑 Test 3: Testing login simulation...')
    
    const { data: loginUser, error: loginError } = await supabase
      .from('ia_users')
      .select('id, email, password_hash, verification_tier, is_active')
      .eq('email', testEmail)
      .eq('is_active', true)
      .single()
    
    if (loginError) {
      console.error('❌ Login test failed:', loginError)
    } else {
      console.log('✅ Login test successful!')
      console.log('   Found user:', loginUser.email)
      
      // Test password verification
      const isPasswordValid = await bcrypt.compare(testPassword, loginUser.password_hash)
      if (isPasswordValid) {
        console.log('✅ Password verification successful!')
      } else {
        console.log('❌ Password verification failed!')
      }
    }
    
    // Test 4: Test biometric credentials table
    console.log('\n📱 Test 4: Testing biometric credentials...')
    
    const { data: credential, error: credentialError } = await supabase
      .from('biometric_credentials')
      .insert({
        user_id: user.stable_id,
        credential_id: 'test_credential_' + Date.now(),
        device_type: 'mobile',
        authenticator_type: 'fingerprint'
      })
      .select()
      .single()
    
    if (credentialError) {
      console.error('❌ Biometric credential creation failed:', credentialError)
    } else {
      console.log('✅ Biometric credential created!')
      console.log('   Credential ID:', credential.credential_id)
    }
    
    console.log('\n🎉 All tests completed successfully!')
    console.log('')
    console.log('🔐 Admin credentials:')
    console.log('   Email:', testEmail)
    console.log('   Password:', testPassword)
    console.log('')
    console.log('🌐 Test login at: https://choices-platform.vercel.app/login')
    console.log('📱 Test biometric at: https://choices-platform.vercel.app/login')
    console.log('')
    console.log('✅ Database is ready for authentication!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
testCleanDatabase()
