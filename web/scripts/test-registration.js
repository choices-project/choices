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

async function testRegistration() {
  try {
    console.log('🧪 Testing registration system...')
    
    const testEmail = 'test@example.com'
    const testPassword = 'TestPassword123!'
    
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('ia_users')
      .select('id, email')
      .eq('email', testEmail)
      .single()
    
    if (existingUser) {
      console.log('✅ User already exists:', existingUser.email)
      console.log('   User ID:', existingUser.id)
      return existingUser
    }
    
    // Create new user
    const hashedPassword = await bcrypt.hash(testPassword, 12)
    const stableId = 'test_' + Date.now()
    
    const { data: newUser, error: createError } = await supabase
      .from('ia_users')
      .insert({
        stable_id: stableId,
        email: testEmail,
        password_hash: hashedPassword,
        verification_tier: 'T0',
        is_active: true,
        two_factor_enabled: false
      })
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Error creating user:', createError)
      return null
    }
    
    console.log('✅ User created successfully!')
    console.log('   Email:', newUser.email)
    console.log('   User ID:', newUser.id)
    console.log('   Stable ID:', newUser.stable_id)
    console.log('')
    console.log('🔐 Test credentials:')
    console.log('   Email:', testEmail)
    console.log('   Password:', testPassword)
    console.log('')
    console.log('🌐 Test login at: https://choices-platform.vercel.app/login')
    
    return newUser
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return null
  }
}

// Run the script
testRegistration()
