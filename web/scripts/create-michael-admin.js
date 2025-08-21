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

async function createMichaelAdmin() {
  try {
    console.log('👤 Creating admin account for Michael...')
    
    const email = 'michaeltempesta@gmail.com'
    const password = 'MichaelAdmin123!@#'
    const hashedPassword = await bcrypt.hash(password, 12)
    const stableId = 'michael_admin_' + Date.now()
    
    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('ia_users')
      .select('id, email')
      .eq('email', email)
      .single()
    
    if (existingUser) {
      console.log('⚠️  User already exists:', existingUser.email)
      console.log('   User ID:', existingUser.id)
      
      // Update existing user to admin
      const { error: updateError } = await supabase
        .from('ia_users')
        .update({
          verification_tier: 'T3',
          is_active: true,
          password_hash: hashedPassword
        })
        .eq('id', existingUser.id)
      
      if (updateError) {
        console.error('❌ Error updating user:', updateError)
        return
      }
      
      console.log('✅ Existing user updated to admin!')
    } else {
      // Create new admin user
      const { data: newUser, error: createError } = await supabase
        .from('ia_users')
        .insert({
          stable_id: stableId,
          email: email,
          password_hash: hashedPassword,
          verification_tier: 'T3',
          is_active: true,
          two_factor_enabled: false
        })
        .select()
        .single()
      
      if (createError) {
        console.error('❌ Error creating user:', createError)
        return
      }
      
      console.log('✅ New admin user created!')
      console.log('   User ID:', newUser.id)
      console.log('   Stable ID:', newUser.stable_id)
    }
    
    // Create user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: stableId,
        display_name: 'Michael Tempesta',
        bio: 'Platform Administrator'
      })
      .select()
      .single()
    
    if (profileError) {
      console.error('❌ Error creating profile:', profileError)
    } else {
      console.log('✅ User profile created!')
    }
    
    console.log('\n🎉 Admin account setup completed!')
    console.log('')
    console.log('🔐 Admin credentials:')
    console.log('   Email:', email)
    console.log('   Password:', password)
    console.log('')
    console.log('🌐 Login at: https://choices-platform.vercel.app/login')
    console.log('📱 Test biometric at: https://choices-platform.vercel.app/auth/biometric-setup')
    console.log('')
    console.log('✅ You can now login as an admin!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
createMichaelAdmin()
