#!/usr/bin/env node

// Check production URL configuration for Supabase
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

console.log('🔍 Checking Supabase Production URL Configuration...')
console.log('')

// Check current configuration
console.log('📋 Current Environment:')
console.log(`   Supabase URL: ${supabaseUrl}`)
console.log(`   Production URL: https://choices-platform.vercel.app`)
console.log('')

// Test magic link generation with production URL
async function testMagicLink() {
  try {
    console.log('🧪 Testing Magic Link Generation...')
    
    // This would normally send a magic link, but we'll just test the configuration
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: 'test@example.com',
      options: {
        redirectTo: 'https://choices-platform.vercel.app/auth/callback'
      }
    })
    
    if (error) {
      console.log('❌ Error testing magic link generation:')
      console.log(`   ${error.message}`)
      console.log('')
      console.log('💡 This might indicate a configuration issue.')
    } else {
      console.log('✅ Magic link generation test successful')
    }
  } catch (err) {
    console.log('❌ Error testing magic link:')
    console.log(`   ${err.message}`)
  }
}

// Check if we can access the auth settings
async function checkAuthSettings() {
  try {
    console.log('🔧 Checking Auth Settings...')
    
    // Try to get auth settings (this might not work with service role key)
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1
    })
    
    if (error) {
      console.log('⚠️  Cannot access auth settings with service role key')
      console.log(`   ${error.message}`)
    } else {
      console.log('✅ Can access auth settings')
    }
  } catch (err) {
    console.log('⚠️  Error checking auth settings:')
    console.log(`   ${err.message}`)
  }
}

async function main() {
  await checkAuthSettings()
  console.log('')
  await testMagicLink()
  console.log('')
  
  console.log('📋 Manual Configuration Check Required:')
  console.log('')
  console.log('🔗 Go to Supabase Dashboard > Authentication > URL Configuration')
  console.log('')
  console.log('✅ Required Settings:')
  console.log('   Site URL: https://choices-platform.vercel.app')
  console.log('   Redirect URLs:')
  console.log('     - https://choices-platform.vercel.app/auth/callback')
  console.log('     - https://choices-platform.vercel.app/auth/verify')
  console.log('     - http://localhost:3000/auth/callback (for development)')
  console.log('     - http://localhost:3000/auth/verify (for development)')
  console.log('')
  console.log('💡 The magic link issue occurs because:')
  console.log('   1. Magic link was generated on localhost')
  console.log('   2. Contains localhost URL in the link')
  console.log('   3. When clicked from production, tries to redirect to localhost')
  console.log('')
  console.log('🔧 Solution:')
  console.log('   1. Ensure production URLs are configured in Supabase')
  console.log('   2. Generate magic links from production environment')
  console.log('   3. Test with fresh magic link from production')
}

main().catch(console.error)
