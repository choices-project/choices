#!/usr/bin/env node

// OAuth Flow Test
// Tests OAuth authentication as an alternative to email registration

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

async function testOAuthFlow() {
  console.log('🔐 OAuth Authentication Test...')
  console.log('================================')
  
  try {
    // 1. Check current authentication status
    console.log('\n1. Checking Current Authentication Status...')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.log('ℹ️  No authenticated user (ready for testing)')
    } else if (user) {
      console.log(`✅ User already authenticated: ${user.email}`)
      console.log(`   User ID: ${user.id}`)
      console.log(`   Provider: ${user.app_metadata?.provider || 'email'}`)
      return
    } else {
      console.log('ℹ️  No authenticated user (ready for testing)')
    }

    // 2. Check OAuth configuration
    console.log('\n2. OAuth Configuration Check...')
    console.log('   OAuth providers should be configured in Supabase Dashboard')
    console.log('   - Go to Authentication > Providers')
    console.log('   - Enable Google and/or GitHub')
    console.log('   - Configure redirect URLs')

    // 3. Test OAuth sign-in (this will redirect to OAuth provider)
    console.log('\n3. OAuth Sign-In Test...')
    console.log('   This will redirect you to the OAuth provider')
    console.log('   You can test this manually in the browser')
    
    // Note: We can't actually trigger OAuth from Node.js without a browser
    // This is just for informational purposes

    // 4. Manual testing instructions
    console.log('\n🎯 Manual OAuth Testing Instructions:')
    console.log('=====================================')
    console.log('')
    console.log('1. Visit: http://localhost:3000/register')
    console.log('2. Click the Google or GitHub button')
    console.log('3. Complete OAuth authentication')
    console.log('4. You should be redirected back to the app')
    console.log('5. Check if user is created in both auth.users and ia_users')
    console.log('')
    console.log('💡 Benefits of OAuth:')
    console.log('- No email confirmation required')
    console.log('- Instant authentication')
    console.log('- More secure (no password management)')
    console.log('- Works around email configuration issues')
    console.log('')

    // 5. Alternative testing with email
    console.log('📧 Alternative Email Testing:')
    console.log('=============================')
    console.log('')
    console.log('If you want to test email registration:')
    console.log('1. Try with a Gmail address')
    console.log('2. Check spam/junk folder')
    console.log('3. Verify Supabase email configuration')
    console.log('4. Check Supabase logs for errors')
    console.log('')

  } catch (error) {
    console.error('❌ OAuth test failed:', error.message)
  }
}

// Run the test
testOAuthFlow().catch(console.error)

