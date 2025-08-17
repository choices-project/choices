#!/usr/bin/env node

// Complete Email Flow Test
// Tests the entire email authentication system with updated templates

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

async function testCompleteEmailFlow() {
  console.log('🧪 Complete Email Authentication Flow Test...')
  console.log('=============================================')
  
  try {
    // 1. Check current system status
    console.log('\n1. System Status Check...')
    console.log('=========================')
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) {
      console.log('ℹ️  No authenticated user (ready for testing)')
    } else if (user) {
      console.log(`✅ User already authenticated: ${user.email}`)
      console.log('   Consider signing out first for complete testing')
    } else {
      console.log('ℹ️  No authenticated user (ready for testing)')
    }

    // 2. Test registration with a valid email
    console.log('\n2. Email Registration Test...')
    console.log('=============================')
    
    // Use a timestamp to ensure unique email
    const timestamp = Date.now()
    const testEmail = `test-${timestamp}@gmail.com`
    const testPassword = 'TestPassword123!'
    
    console.log(`📧 Testing with email: ${testEmail}`)
    console.log('   (This is a test email - you can use your real Gmail for actual testing)')
    
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: { name: 'Test User' },
        emailRedirectTo: 'http://localhost:3000/auth/callback?redirectTo=/dashboard',
      },
    })

    if (signUpError) {
      console.log(`❌ Registration failed: ${signUpError.message}`)
      
      if (signUpError.message.includes('already registered')) {
        console.log('💡 This suggests the email already exists in Supabase Auth')
        console.log('   This is normal if you\'ve tested with this email before')
      }
    } else if (signUpData.user) {
      console.log('✅ Registration successful!')
      console.log(`   User ID: ${signUpData.user.id}`)
      console.log(`   Email confirmed: ${signUpData.user.email_confirmed_at ? 'Yes' : 'No'}`)
      console.log(`   Session: ${signUpData.session ? 'Present' : 'None'}`)
      
      if (!signUpData.user.email_confirmed_at) {
        console.log('📧 Email confirmation required - check your email!')
        console.log('   Look for the new email template design')
      }
    }

    // 3. Test password reset flow
    console.log('\n3. Password Reset Test...')
    console.log('=========================')
    
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(testEmail, {
      redirectTo: 'http://localhost:3000/reset-password',
    })

    if (resetError) {
      console.log(`❌ Password reset failed: ${resetError.message}`)
    } else {
      console.log('✅ Password reset email sent!')
      console.log('   Check your email for the new reset password template')
    }

    // 4. Test magic link (passwordless sign-in)
    console.log('\n4. Magic Link Test...')
    console.log('=====================')
    
    const { error: magicLinkError } = await supabase.auth.signInWithOtp({
      email: testEmail,
      options: {
        emailRedirectTo: 'http://localhost:3000/auth/callback?redirectTo=/dashboard',
      },
    })

    if (magicLinkError) {
      console.log(`❌ Magic link failed: ${magicLinkError.message}`)
    } else {
      console.log('✅ Magic link email sent!')
      console.log('   Check your email for the new magic link template')
    }

    // 5. Manual testing instructions
    console.log('\n🎯 Manual Testing Instructions:')
    console.log('===============================')
    console.log('')
    console.log('📧 Email Template Testing:')
    console.log('==========================')
    console.log('')
    console.log('1. Check your email for the new templates:')
    console.log('   - Look for improved design and colors')
    console.log('   - Verify buttons are high contrast and readable')
    console.log('   - Check security warnings are prominent')
    console.log('   - Test on mobile device for responsiveness')
    console.log('')
    console.log('2. Test each email type:')
    console.log('   - Registration confirmation (purple gradient)')
    console.log('   - Password reset (orange gradient)')
    console.log('   - Magic link (green gradient)')
    console.log('')
    console.log('3. Verify link functionality:')
    console.log('   - Click confirmation links')
    console.log('   - Test expiration (should be 1 hour)')
    console.log('   - Check redirect to dashboard')
    console.log('')

    console.log('🔧 Configuration Verification:')
    console.log('==============================')
    console.log('')
    console.log('1. OTP Expiry Setting:')
    console.log('   - Should be set to 3600 seconds (1 hour)')
    console.log('   - Check Supabase Dashboard > Authentication > Settings')
    console.log('')
    console.log('2. Email Templates:')
    console.log('   - All templates should have new design')
    console.log('   - Check Authentication > Email Templates')
    console.log('')
    console.log('3. URL Configuration:')
    console.log('   - Site URL: https://choices-platform.vercel.app')
    console.log('   - Redirect URLs configured for both environments')
    console.log('')

    console.log('🧪 Real Email Testing:')
    console.log('======================')
    console.log('')
    console.log('For the best test experience:')
    console.log('')
    console.log('1. Use your real Gmail address:')
    console.log('   - Go to http://localhost:3000/register')
    console.log('   - Sign up with your actual Gmail')
    console.log('   - Check your email for the new template')
    console.log('')
    console.log('2. Test the complete flow:')
    console.log('   - Click the confirmation link')
    console.log('   - Verify you\'re redirected to dashboard')
    console.log('   - Test account settings and password change')
    console.log('')
    console.log('3. Test OAuth as backup:')
    console.log('   - Try Google/GitHub sign-in')
    console.log('   - Verify user synchronization works')
    console.log('')

    console.log('📊 Expected Results:')
    console.log('====================')
    console.log('')
    console.log('✅ Professional email templates with gradients')
    console.log('✅ High contrast buttons that are easy to read')
    console.log('✅ Security warnings prominently displayed')
    console.log('✅ Mobile responsive design')
    console.log('✅ Proper expiration times (1 hour)')
    console.log('✅ Clear call-to-action buttons')
    console.log('✅ Professional branding throughout')
    console.log('')

    console.log('🚨 Troubleshooting:')
    console.log('==================')
    console.log('')
    console.log('If emails aren\'t working:')
    console.log('1. Check spam/junk folder')
    console.log('2. Verify OTP expiry is set to 1 hour')
    console.log('3. Check Supabase logs for errors')
    console.log('4. Try with Gmail instead of other providers')
    console.log('5. Use OAuth as alternative authentication')
    console.log('')

  } catch (error) {
    console.error('❌ Error in email flow test:', error.message)
  }
}

// Run the test
testCompleteEmailFlow().catch(console.error)
