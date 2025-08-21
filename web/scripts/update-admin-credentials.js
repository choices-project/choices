#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const bcrypt = require('bcryptjs')

// Load environment variables
dotenv.config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function updateAdminCredentials() {
  try {
    console.log('🔐 Updating admin credentials from .env.local...')
    
    // Get admin credentials from environment variables
    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD
    
    if (!adminEmail || !adminPassword) {
      console.error('❌ Missing admin credentials in .env.local')
      console.log('Please ensure ADMIN_EMAIL and ADMIN_PASSWORD are set in .env.local')
      process.exit(1)
    }
    
    console.log('📧 Admin Email:', adminEmail)
    console.log('🔑 Admin Password: [HIDDEN]')
    
    const hashedPassword = await bcrypt.hash(adminPassword, 12)
    
    // Check if admin user exists
    const { data: existingUser, error: checkError } = await supabase
      .from('ia_users')
      .select('id, email, stable_id')
      .eq('email', adminEmail)
      .single()
    
    if (existingUser) {
      console.log('✅ Found existing admin user:', existingUser.email)
      console.log('   User ID:', existingUser.id)
      
      // Update existing user with new credentials
      const { error: updateError } = await supabase
        .from('ia_users')
        .update({
          password_hash: hashedPassword,
          verification_tier: 'T3',
          is_active: true,
          two_factor_enabled: false
        })
        .eq('id', existingUser.id)
      
      if (updateError) {
        console.error('❌ Error updating admin credentials:', updateError)
        return
      }
      
      console.log('✅ Admin credentials updated successfully!')
      
    } else {
      console.log('⚠️  Admin user not found, creating new admin account...')
      
      const stableId = 'admin_' + Date.now()
      
      // Create new admin user
      const { data: newUser, error: createError } = await supabase
        .from('ia_users')
        .insert({
          stable_id: stableId,
          email: adminEmail,
          password_hash: hashedPassword,
          verification_tier: 'T3',
          is_active: true,
          two_factor_enabled: false
        })
        .select()
        .single()
      
      if (createError) {
        console.error('❌ Error creating admin user:', createError)
        return
      }
      
      console.log('✅ New admin user created!')
      console.log('   User ID:', newUser.id)
      console.log('   Stable ID:', newUser.stable_id)
      
      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: stableId,
          display_name: 'Platform Administrator',
          bio: 'System Administrator'
        })
      
      if (profileError) {
        console.error('❌ Error creating profile:', profileError)
      } else {
        console.log('✅ Admin profile created!')
      }
    }
    
    // Test the login
    console.log('\n🧪 Testing admin login...')
    
    const { data: loginTest, error: loginError } = await supabase
      .from('ia_users')
      .select('id, email, verification_tier, is_active')
      .eq('email', adminEmail)
      .eq('is_active', true)
      .single()
    
    if (loginError || !loginTest) {
      console.error('❌ Login test failed:', loginError)
    } else {
      console.log('✅ Login test successful!')
      console.log('   Email:', loginTest.email)
      console.log('   Verification Tier:', loginTest.verification_tier)
      console.log('   Status: Active')
    }
    
    console.log('\n🎉 Admin credentials updated successfully!')
    console.log('')
    console.log('🔐 Updated Admin Credentials:')
    console.log('   Email:', adminEmail)
    console.log('   Password: [From .env.local]')
    console.log('')
    console.log('🌐 Login at: https://choices-platform.vercel.app/login')
    console.log('📱 Test biometric at: https://choices-platform.vercel.app/auth/biometric-setup')
    console.log('')
    console.log('✅ You can now login with your updated admin credentials!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
updateAdminCredentials()
