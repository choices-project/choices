const { createClient } = require('@supabase/supabase-js')

// Check environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.log('Please ensure these are set:')
  console.log('- NEXT_PUBLIC_SUPABASE_URL')
  console.log('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkAuthSettings() {
  console.log('🔍 Checking Supabase Auth Configuration...')
  
  try {
    // Check auth settings
    const { data: settings, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('❌ Error checking auth settings:', error)
      return
    }
    
    console.log('✅ Auth service is accessible')
    console.log(`📊 Total users: ${settings.users?.length || 0}`)
    
    // Check for unconfirmed users
    const unconfirmedUsers = settings.users?.filter(user => !user.email_confirmed_at) || []
    console.log(`📧 Unconfirmed users: ${unconfirmedUsers.length}`)
    
    if (unconfirmedUsers.length > 0) {
      console.log('\n📋 Unconfirmed users:')
      unconfirmedUsers.forEach(user => {
        console.log(`  - ${user.email} (created: ${user.created_at})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

async function testEmailVerification() {
  console.log('\n🧪 Testing email verification flow...')
  
  try {
    // Test creating a user
    const testEmail = `test-${Date.now()}@example.com`
    const { data, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: true // Auto-confirm for testing
    })
    
    if (error) {
      console.error('❌ Error creating test user:', error)
      return
    }
    
    console.log('✅ Test user created successfully')
    console.log(`📧 Email: ${testEmail}`)
    console.log(`🆔 User ID: ${data.user.id}`)
    
    // Clean up test user
    await supabase.auth.admin.deleteUser(data.user.id)
    console.log('🧹 Test user cleaned up')
    
  } catch (error) {
    console.error('❌ Error in test:', error)
  }
}

async function main() {
  await checkAuthSettings()
  await testEmailVerification()
  
  console.log('\n📝 Recommendations:')
  console.log('1. Check Supabase Dashboard > Authentication > Settings')
  console.log('2. Ensure "Enable email confirmations" is ON')
  console.log('3. Set "Secure email change" to ON')
  console.log('4. Configure "Site URL" to match your domain')
  console.log('5. Add redirect URLs in "URL Configuration"')
  console.log('6. Check "Email Templates" for proper formatting')
}

main().catch(console.error)
