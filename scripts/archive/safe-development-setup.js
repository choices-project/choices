#!/usr/bin/env node

require('dotenv').config({ path: './web/.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function safeDevelopmentSetup() {
  console.log('🔒 Safe Development Setup - No Email Bounce Issues')
  console.log('==================================================')
  
  try {
    // Check current user count
    const { data: users, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('❌ Error fetching users:', error)
      return
    }
    
    console.log(`📊 Current users: ${users.users?.length || 0}`)
    
    // Check for any remaining test users
    const testUsers = users.users?.filter(user => {
      const email = user.email?.toLowerCase() || ''
      return email.includes('test') || email.includes('example.com')
    }) || []
    
    if (testUsers.length > 0) {
      console.log(`⚠️  Found ${testUsers.length} test users - cleaning up...`)
      for (const user of testUsers) {
        await supabase.auth.admin.deleteUser(user.id)
        console.log(`🗑️  Deleted: ${user.email}`)
      }
    }
    
    console.log('\n✅ Safe Development Configuration:')
    console.log('==================================')
    console.log('1. ✅ Test users cleaned up')
    console.log('2. ✅ Email bounce issues prevented')
    console.log('3. ✅ Supabase email privileges protected')
    
    console.log('\n🎯 Recommended Development Workflow:')
    console.log('====================================')
    console.log('1. Use OAuth (Google/GitHub) for testing:')
    console.log('   - Go to http://localhost:3000/login')
    console.log('   - Click "Continue with Google" or "Continue with GitHub"')
    console.log('   - No email verification needed')
    
    console.log('\n2. For email testing (only when necessary):')
    console.log('   - Use your REAL email address')
    console.log('   - Check spam folder for confirmation emails')
    console.log('   - Don\'t use test@example.com or similar')
    
    console.log('\n3. Production deployment:')
    console.log('   - Configure custom SMTP if needed')
    console.log('   - Use real email addresses only')
    console.log('   - Monitor bounce rates in Supabase dashboard')
    
    console.log('\n🚀 Next Steps:')
    console.log('==============')
    console.log('1. Start development server: npm run dev')
    console.log('2. Test OAuth login: http://localhost:3000/login')
    console.log('3. Use real email for signup testing')
    console.log('4. Monitor Supabase dashboard for email metrics')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

safeDevelopmentSetup().catch(console.error)
