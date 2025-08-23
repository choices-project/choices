#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkDatabaseTables() {
  try {
    console.log('🔍 Checking database tables...')
    
    // Try to access ia_users table directly
    console.log('\n📋 Testing ia_users table access...')
    const { data: users, error: usersError } = await supabase
      .from('ia_users')
      .select('id, email, verification_tier')
      .limit(5)
    
    if (usersError) {
      console.error('❌ Error accessing ia_users:', usersError)
    } else {
      console.log(`✅ ia_users table accessible, found ${users?.length || 0} users`)
      if (users && users.length > 0) {
        console.log('   Sample users:')
        users.forEach(user => {
          console.log(`   - ${user.email} (${user.verification_tier})`)
        })
      }
    }
    
    // Try to access po_polls table
    console.log('\n📋 Testing po_polls table access...')
    const { data: polls, error: pollsError } = await supabase
      .from('po_polls')
      .select('id, title, status')
      .limit(5)
    
    if (pollsError) {
      console.error('❌ Error accessing po_polls:', pollsError)
    } else {
      console.log(`✅ po_polls table accessible, found ${polls?.length || 0} polls`)
    }
    
    // Try to access user_profiles table
    console.log('\n📋 Testing user_profiles table access...')
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, user_id, display_name')
      .limit(5)
    
    if (profilesError) {
      console.error('❌ Error accessing user_profiles:', profilesError)
    } else {
      console.log(`✅ user_profiles table accessible, found ${profiles?.length || 0} profiles`)
    }
    
    // Try to access biometric_credentials table
    console.log('\n📋 Testing biometric_credentials table access...')
    const { data: credentials, error: credentialsError } = await supabase
      .from('biometric_credentials')
      .select('id, user_id, credential_id')
      .limit(5)
    
    if (credentialsError) {
      console.error('❌ Error accessing biometric_credentials:', credentialsError)
    } else {
      console.log(`✅ biometric_credentials table accessible, found ${credentials?.length || 0} credentials`)
    }
    
    console.log('\n✅ Database table check completed!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the check
checkDatabaseTables()
