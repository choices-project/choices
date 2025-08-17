#!/usr/bin/env node

// Test Registration with Existing Email
// This script tests what happens when you try to register with an existing email

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

async function testRegistration() {
  console.log('🧪 Testing Registration with Existing Email...')
  console.log('==============================================')
  
  const testEmail = 'michaeltempesta@gmail.com' // Your email from the image
  const testPassword = 'TestPassword123!'
  
  try {
    console.log(`\n📧 Testing registration with email: ${testEmail}`)
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Test User',
        },
        emailRedirectTo: 'http://localhost:3000/auth/callback',
      },
    })

    console.log('\n📊 Results:')
    console.log('============')
    
    if (error) {
      console.log('❌ Error returned:')
      console.log(`   Message: ${error.message}`)
      console.log(`   Status: ${error.status}`)
      console.log(`   Name: ${error.name}`)
    } else {
      console.log('✅ No error returned')
      console.log('\n📋 Data returned:')
      console.log(`   User: ${data.user ? 'Present' : 'None'}`)
      console.log(`   Session: ${data.session ? 'Present' : 'None'}`)
      
      if (data.user) {
        console.log(`   User ID: ${data.user.id}`)
        console.log(`   Email: ${data.user.email}`)
        console.log(`   Email Confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`)
        console.log(`   Created: ${data.user.created_at}`)
      }
      
      if (data.session) {
        console.log(`   Session User ID: ${data.session.user.id}`)
        console.log(`   Session Expires: ${data.session.expires_at}`)
      }
    }

    console.log('\n🔍 Analysis:')
    console.log('============')
    
    if (error) {
      if (error.message.includes('already') || error.message.includes('exists')) {
        console.log('✅ Supabase correctly detected existing user')
      } else {
        console.log('❓ Unexpected error - may need investigation')
      }
    } else {
      if (data.user && !data.session) {
        console.log('⚠️  User created but no session - email confirmation required')
        console.log('   This is normal for new registrations')
      } else if (data.user && data.session) {
        console.log('⚠️  User created with session - may be existing user')
        console.log('   This could indicate the user already existed')
      } else {
        console.log('❓ No user data returned - unexpected')
      }
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
  }
}

// Run the test
testRegistration().catch(console.error)
