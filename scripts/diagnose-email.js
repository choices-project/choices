#!/usr/bin/env node

// Email Configuration Diagnostic
// Checks email settings and provides solutions

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

async function diagnoseEmail() {
  console.log('📧 Email Configuration Diagnostic...')
  console.log('====================================')
  
  try {
    // 1. Check Supabase URL
    console.log('\n1. Supabase Configuration...')
    console.log(`   URL: ${supabaseUrl ? '✅ Configured' : '❌ Missing'}`)
    console.log(`   Key: ${supabaseKey ? '✅ Configured' : '❌ Missing'}`)
    
    if (supabaseUrl) {
      const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
      console.log(`   Project ID: ${projectId || 'Unknown'}`)
    }

    // 2. Test registration with a test email
    console.log('\n2. Testing Registration Flow...')
    const testEmail = 'test-diagnostic@example.com'
    const testPassword = 'TestPassword123!'
    
    console.log(`   Testing with email: ${testEmail}`)
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: { name: 'Test Diagnostic' },
        emailRedirectTo: 'http://localhost:3000/auth/callback',
      },
    })

    if (signUpError) {
      console.log(`   ❌ Registration failed: ${signUpError.message}`)
      
      if (signUpError.message.includes('email')) {
        console.log('   💡 This suggests email validation issues')
      }
    } else if (signUpData.user) {
      console.log('   ✅ Registration successful')
      console.log(`   User ID: ${signUpData.user.id}`)
      console.log(`   Email confirmed: ${signUpData.user.email_confirmed_at ? 'Yes' : 'No'}`)
      console.log(`   Session: ${signUpData.session ? 'Present' : 'None'}`)
      
      if (!signUpData.user.email_confirmed_at) {
        console.log('   ⚠️  Email confirmation required - check if email was sent')
      }
    }

    // 3. Check for existing users with your email
    console.log('\n3. Checking for Existing Users...')
    const yourEmail = 'michaeltempesta@gmail.com'
    
    // Check ia_users table
    const { data: iaUsers, error: iaError } = await supabase
      .from('ia_users')
      .select('*')
      .eq('email', yourEmail)
    
    if (iaError) {
      console.error('   ❌ Error checking ia_users:', iaError.message)
    } else {
      console.log(`   Found ${iaUsers.length} users in ia_users table with your email`)
    }

    // 4. Email Configuration Issues
    console.log('\n4. Common Email Issues & Solutions...')
    console.log('')
    console.log('🔍 POSSIBLE ISSUES:')
    console.log('==================')
    console.log('')
    console.log('1. 📧 Supabase Email Not Configured:')
    console.log('   - Go to Supabase Dashboard > Authentication > Email Templates')
    console.log('   - Check if email templates are configured')
    console.log('   - Verify SMTP settings in Supabase')
    console.log('')
    console.log('2. 🚫 Email Domain Restrictions:')
    console.log('   - Supabase might block certain email domains')
    console.log('   - Try with a different email (Gmail, Outlook, etc.)')
    console.log('')
    console.log('3. 📬 Email in Spam/Junk:')
    console.log('   - Check spam/junk folder')
    console.log('   - Add Supabase to your email whitelist')
    console.log('')
    console.log('4. ⚙️  Supabase Project Settings:')
    console.log('   - Check Authentication > Settings > Email Auth')
    console.log('   - Ensure "Enable email confirmations" is ON')
    console.log('   - Check redirect URLs are configured')
    console.log('')
    console.log('5. 🔧 Local Development Issues:')
    console.log('   - Supabase might not send emails in development')
    console.log('   - Check Supabase logs for email errors')
    console.log('')

    // 5. Solutions
    console.log('💡 RECOMMENDED SOLUTIONS:')
    console.log('========================')
    console.log('')
    console.log('1. 🧹 Clear Database and Start Fresh:')
    console.log('   node scripts/clear-database.js')
    console.log('')
    console.log('2. 📧 Test with Different Email:')
    console.log('   - Try Gmail, Outlook, or other major providers')
    console.log('   - Avoid disposable email services')
    console.log('')
    console.log('3. 🔍 Check Supabase Dashboard:')
    console.log('   - Go to Authentication > Users')
    console.log('   - See if users are being created')
    console.log('   - Check Authentication > Logs for errors')
    console.log('')
    console.log('4. 🚀 Alternative Testing:')
    console.log('   - Use OAuth (Google/GitHub) instead of email')
    console.log('   - Test with a different email address')
    console.log('   - Check if the issue is specific to your email')
    console.log('')

    // 6. Quick Test
    console.log('🧪 QUICK TEST:')
    console.log('==============')
    console.log('1. Try registering with a Gmail address')
    console.log('2. Check if you receive the confirmation email')
    console.log('3. If Gmail works, the issue is with your email domain')
    console.log('4. If no email works, it\'s a Supabase configuration issue')
    console.log('')

  } catch (error) {
    console.error('❌ Diagnostic failed:', error.message)
  }
}

// Run the diagnostic
diagnoseEmail().catch(console.error)
