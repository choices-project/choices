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

async function cleanupTestUsers() {
  console.log('🧹 Cleaning up test users to prevent email bounce issues...')
  console.log('==========================================================')
  
  try {
    // Get all users
    const { data: users, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('❌ Error fetching users:', error)
      return
    }
    
    console.log(`📊 Total users found: ${users.users?.length || 0}`)
    
    // Find test users (those with test emails or unconfirmed status)
    const testUsers = users.users?.filter(user => {
      const email = user.email?.toLowerCase() || ''
      return email.includes('test') || 
             email.includes('example.com') || 
             !user.email_confirmed_at ||
             email.includes('gmail.com') && email.includes('test-')
    }) || []
    
    console.log(`🧪 Test users to clean up: ${testUsers.length}`)
    
    if (testUsers.length === 0) {
      console.log('✅ No test users found to clean up')
      return
    }
    
    // Delete test users
    let deletedCount = 0
    for (const user of testUsers) {
      try {
        console.log(`🗑️  Deleting: ${user.email}`)
        await supabase.auth.admin.deleteUser(user.id)
        deletedCount++
        console.log(`✅ Deleted: ${user.email}`)
      } catch (deleteError) {
        console.error(`❌ Failed to delete ${user.email}:`, deleteError.message)
      }
    }
    
    console.log(`\n✅ Cleanup complete! Deleted ${deletedCount} test users`)
    console.log('\n📝 Recommendations:')
    console.log('1. Use real email addresses for testing')
    console.log('2. Avoid sending test emails to invalid addresses')
    console.log('3. Use OAuth (Google/GitHub) for development testing')
    console.log('4. Configure custom SMTP if needed for production')
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error)
  }
}

cleanupTestUsers().catch(console.error)
