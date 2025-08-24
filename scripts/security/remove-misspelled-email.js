#!/usr/bin/env node

/**
 * Remove Misspelled Email Script
 * Removes the misspelled email: michaeltempesta@mgail.com
 */

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config({ path: 'web/.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function removeMisspelledEmail() {
  console.log('🔍 Looking for misspelled email: michaeltempesta@mgail.com\n')
  
  try {
    // Get all users from auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError)
      return
    }

    // Find the misspelled email
    const misspelledUser = authUsers.users.find(user => 
      user.email?.toLowerCase() === 'michaeltempesta@mgail.com'
    )

    if (!misspelledUser) {
      console.log('✅ No misspelled email found')
      return
    }

    console.log('📧 Found misspelled email:')
    console.log(`   - ID: ${misspelledUser.id}`)
    console.log(`   - Email: ${misspelledUser.email}`)
    console.log(`   - Created: ${misspelledUser.created_at}`)
    console.log(`   - Last Sign In: ${misspelledUser.last_sign_in_at || 'Never'}`)

    // Check if there's a correct email
    const correctUser = authUsers.users.find(user => 
      user.email?.toLowerCase() === 'michaeltempesta@gmail.com'
    )

    if (correctUser) {
      console.log('\n✅ Found correct email: michaeltempesta@gmail.com')
      console.log(`   - ID: ${correctUser.id}`)
      console.log(`   - Created: ${correctUser.created_at}`)
    }

    console.log('\n🗑️  Removing misspelled email...')
    
    // Delete the misspelled user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(misspelledUser.id)
    
    if (deleteError) {
      console.error('❌ Error deleting user:', deleteError)
    } else {
      console.log('✅ Successfully deleted misspelled email')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

async function main() {
  console.log('🚀 Removing misspelled email...\n')
  await removeMisspelledEmail()
  console.log('\n✅ Done!')
}

main().catch(console.error)
