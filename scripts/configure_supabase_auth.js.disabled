const { createClient } = require('@supabase/supabase-js')

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function configureAuthSettings() {
  console.log('🔧 Configuring Supabase Auth Settings...')
  
  try {
    // Get current auth settings
    const { data: currentSettings, error: getError } = await supabase.auth.admin.listUsers()
    
    if (getError) {
      console.error('❌ Error getting current settings:', getError)
      return
    }
    
    console.log('✅ Current auth configuration:')
    console.log(`📊 Total users: ${currentSettings.users?.length || 0}`)
    
    // Configure redirect URLs
    const redirectUrls = [
      'http://localhost:3000/auth/callback',
      'http://localhost:3000/auth/callback?*',
      'https://choices-platform.vercel.app/auth/callback',
      'https://choices-platform.vercel.app/auth/callback?*',
      'https://*.vercel.app/auth/callback',
      'https://*.vercel.app/auth/callback?*'
    ]
    
    console.log('\n📋 Required redirect URLs:')
    redirectUrls.forEach(url => console.log(`  - ${url}`))
    
    console.log('\n⚠️  IMPORTANT: You need to manually configure these in Supabase Dashboard:')
    console.log('1. Go to Supabase Dashboard > Authentication > URL Configuration')
    console.log('2. Add these Site URLs:')
    console.log('   - http://localhost:3000')
    console.log('   - https://choices-platform.vercel.app')
    console.log('3. Add these Redirect URLs:')
    redirectUrls.forEach(url => console.log(`   - ${url}`))
    
    // Test email verification flow
    console.log('\n🧪 Testing email verification...')
    const testEmail = `test-${Date.now()}@example.com`
    
    const { data: testUser, error: createError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: false // Don't auto-confirm for testing
    })
    
    if (createError) {
      console.error('❌ Error creating test user:', createError)
      return
    }
    
    console.log('✅ Test user created (unconfirmed)')
    console.log(`📧 Email: ${testEmail}`)
    console.log(`🆔 User ID: ${testUser.user.id}`)
    
    // Send confirmation email
    const { error: emailError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: testEmail,
      options: {
        redirectTo: 'http://localhost:3000/auth/callback?redirectTo=/dashboard'
      }
    })
    
    if (emailError) {
      console.error('❌ Error sending confirmation email:', emailError)
    } else {
      console.log('✅ Confirmation email sent successfully')
    }
    
    // Clean up test user
    await supabase.auth.admin.deleteUser(testUser.user.id)
    console.log('🧹 Test user cleaned up')
    
    console.log('\n✅ Configuration check complete!')
    console.log('\n📝 Next steps:')
    console.log('1. Configure redirect URLs in Supabase Dashboard')
    console.log('2. Test the registration flow again')
    console.log('3. Check email templates in Supabase Dashboard')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

configureAuthSettings().catch(console.error)
