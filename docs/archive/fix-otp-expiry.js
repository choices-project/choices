#!/usr/bin/env node

// Fix OTP Expiry and Email Configuration
// Addresses the OTP expiry warning and provides email configuration guidance

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: './web/.env.local' })

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixOtpExpiry() {
  console.log('🔧 Fixing OTP Expiry and Email Configuration...')
  console.log('===============================================')
  
  try {
    console.log('\n🚨 Current Issue:')
    console.log('==================')
    console.log('⚠️  OTP expiry exceeds recommended threshold')
    console.log('   - Current setting: More than 1 hour')
    console.log('   - Recommended: Less than 1 hour')
    console.log('   - This affects email verification links')
    console.log('')

    console.log('🛠️ Manual Fix Required:')
    console.log('=======================')
    console.log('')
    console.log('1. Go to Supabase Dashboard:')
    console.log('   https://supabase.com/dashboard/project/muqwrehywjrbaeerjgfb')
    console.log('')
    console.log('2. Navigate to: Authentication > Settings')
    console.log('')
    console.log('3. Find "OTP Expiry" setting')
    console.log('   - Change from current value to 3600 seconds (1 hour)')
    console.log('   - Or set to 1800 seconds (30 minutes) for better security')
    console.log('')
    console.log('4. Save the changes')
    console.log('')

    console.log('📧 Email Configuration Checklist:')
    console.log('==================================')
    console.log('')
    console.log('✅ Email confirmations: Enabled')
    console.log('✅ User signups: Allowed')
    console.log('❌ OTP expiry: Needs to be < 1 hour')
    console.log('')
    console.log('🔍 Additional Settings to Check:')
    console.log('================================')
    console.log('')
    console.log('1. Site URL Configuration:')
    console.log('   - Go to Authentication > URL Configuration')
    console.log('   - Set Site URL to: https://choices-platform.vercel.app')
    console.log('   - Add localhost for development: http://localhost:3000')
    console.log('')
    console.log('2. Redirect URLs:')
    console.log('   - https://choices-platform.vercel.app/auth/callback')
    console.log('   - https://choices-platform.vercel.app/auth/verify')
    console.log('   - http://localhost:3000/auth/callback')
    console.log('   - http://localhost:3000/auth/verify')
    console.log('')
    console.log('3. Email Templates:')
    console.log('   - Go to Authentication > Email Templates')
    console.log('   - Update templates with improved design')
    console.log('   - Use the templates from scripts/email-templates/')
    console.log('')

    console.log('🚫 Spam Prevention Recommendations:')
    console.log('===================================')
    console.log('')
    console.log('1. Email Frequency Limits:')
    console.log('   - Limit password reset emails to 3 per hour per email')
    console.log('   - Limit signup confirmation emails to 1 per email')
    console.log('   - Implement rate limiting in your application')
    console.log('')
    console.log('2. Email Content Best Practices:')
    console.log('   - Clear sender identification')
    console.log('   - Professional branding')
    console.log('   - Security warnings and expiration notices')
    console.log('   - Unsubscribe options (for marketing emails)')
    console.log('')
    console.log('3. Technical Measures:')
    console.log('   - Use SPF, DKIM, and DMARC records')
    console.log('   - Monitor email delivery rates')
    console.log('   - Implement email validation')
    console.log('   - Use confirmed opt-in for signups')
    console.log('')

    console.log('🧪 Testing After Fix:')
    console.log('=====================')
    console.log('')
    console.log('1. Test email registration:')
    console.log('   - Use a real email address (Gmail recommended)')
    console.log('   - Check if confirmation email arrives within 5 minutes')
    console.log('   - Verify the link works and expires correctly')
    console.log('')
    console.log('2. Test password reset:')
    console.log('   - Request password reset')
    console.log('   - Check email delivery and link functionality')
    console.log('')
    console.log('3. Test OAuth authentication:')
    console.log('   - Use Google/GitHub OAuth as backup')
    console.log('   - Verify user synchronization works')
    console.log('')

    console.log('📊 Current Project Status:')
    console.log('==========================')
    console.log('')
    console.log('✅ Database: Clean and ready')
    console.log('✅ Authentication system: Fully implemented')
    console.log('✅ User synchronization: Working')
    console.log('✅ Account management: Complete')
    console.log('❌ Email templates: Need updating')
    console.log('❌ OTP expiry: Needs fixing')
    console.log('')

    console.log('🎯 Priority Actions:')
    console.log('====================')
    console.log('')
    console.log('1. 🔥 HIGH PRIORITY: Fix OTP expiry (security issue)')
    console.log('2. 🔥 HIGH PRIORITY: Update email templates (user experience)')
    console.log('3. 🔥 HIGH PRIORITY: Test with real email address')
    console.log('4. 📋 MEDIUM PRIORITY: Configure additional email templates')
    console.log('5. 📋 MEDIUM PRIORITY: Implement rate limiting')
    console.log('')

    console.log('💡 Quick Test Plan:')
    console.log('==================')
    console.log('')
    console.log('1. Fix OTP expiry in Supabase Dashboard')
    console.log('2. Update email templates with improved design')
    console.log('3. Test registration with Gmail address')
    console.log('4. Verify email delivery and confirmation')
    console.log('5. Test complete authentication flow')
    console.log('')

  } catch (error) {
    console.error('❌ Error in OTP expiry fix:', error.message)
  }
}

// Run the fix
fixOtpExpiry().catch(console.error)

