#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdminAccount() {
  try {
    console.log('🔧 Creating admin account...')
    
    // Admin account details
    const adminEmail = 'admin@choices-platform.com'
    const adminPassword = 'Admin123!@#'
    const adminName = 'Platform Admin'
    
    console.log(`📧 Email: ${adminEmail}`)
    console.log(`🔑 Password: ${adminPassword}`)
    console.log(`👤 Name: ${adminName}`)
    
    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds)
    
    // Generate stable ID
    const stableId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from('ia_users')
      .select('id, email')
      .eq('email', adminEmail)
      .single()
    
    if (existingAdmin) {
      console.log('⚠️  Admin account already exists')
      console.log(`📧 Email: ${adminEmail}`)
      console.log(`🔑 Password: ${adminPassword}`)
      return
    }
    
    // Create admin user
    const { data: admin, error: createError } = await supabase
      .from('ia_users')
      .insert({
        stable_id: stableId,
        email: adminEmail,
        password_hash: hashedPassword,
        verification_tier: 'T3', // Admin tier
        is_active: true,
        two_factor_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (createError) {
      console.error('❌ Error creating admin account:', createError)
      process.exit(1)
    }
    
    // Create admin profile
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: admin.id,
        display_name: adminName,
        bio: 'Platform Administrator',
        primary_concerns: ['platform_management', 'user_support'],
        community_focus: ['all'],
        participation_style: 'administrator',
        demographics: {
          role: 'admin',
          access_level: 'full'
        },
        privacy_settings: {
          shareProfile: false,
          shareDemographics: false,
          shareParticipation: false,
          allowAnalytics: true
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    
    if (profileError) {
      console.error('❌ Error creating admin profile:', profileError)
      // Don't exit, admin user was created successfully
    }
    
    console.log('✅ Admin account created successfully!')
    console.log('')
    console.log('📋 Admin Account Details:')
    console.log(`📧 Email: ${adminEmail}`)
    console.log(`🔑 Password: ${adminPassword}`)
    console.log(`👤 Name: ${adminName}`)
    console.log(`🆔 User ID: ${admin.id}`)
    console.log(`🔐 Stable ID: ${stableId}`)
    console.log('')
    console.log('🌐 Login at: https://choices-platform.vercel.app/login')
    console.log('')
    console.log('⚠️  IMPORTANT: Change this password after first login!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

// Run the script
createAdminAccount()
