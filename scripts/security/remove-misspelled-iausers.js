#!/usr/bin/env node

/**
 * Remove Misspelled Email from ia_users Script
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
  console.log('🔍 Looking for misspelled email in ia_users: michaeltempesta@mgail.com\n')
  
  try {
    // Find the misspelled email in ia_users
    const { data: misspelledUser, error: findError } = await supabase
      .from('ia_users')
      .select('*')
      .eq('email', 'michaeltempesta@mgail.com')
      .single()

    if (findError) {
      if (findError.code === 'PGRST116') {
        console.log('✅ No misspelled email found in ia_users table')
        return
      } else {
        console.error('❌ Error finding misspelled email:', findError)
        return
      }
    }

    console.log('📧 Found misspelled email in ia_users:')
    console.log(`   - ID: ${misspelledUser.id}`)
    console.log(`   - Email: ${misspelledUser.email}`)
    console.log(`   - Trust Tier: ${misspelledUser.trust_tier}`)
    console.log(`   - Created: ${misspelledUser.created_at}`)

    // Check if there's a correct email
    const { data: correctUser, error: correctError } = await supabase
      .from('ia_users')
      .select('*')
      .eq('email', 'michaeltempesta@gmail.com')
      .single()

    if (!correctError && correctUser) {
      console.log('\n✅ Found correct email: michaeltempesta@gmail.com')
      console.log(`   - ID: ${correctUser.id}`)
      console.log(`   - Trust Tier: ${correctUser.trust_tier}`)
      console.log(`   - Created: ${correctUser.created_at}`)
    }

    console.log('\n🗑️  Removing misspelled email from ia_users...')
    
    // Delete the misspelled user from ia_users
    const { error: deleteError } = await supabase
      .from('ia_users')
      .delete()
      .eq('id', misspelledUser.id)
    
    if (deleteError) {
      console.error('❌ Error deleting user:', deleteError)
    } else {
      console.log('✅ Successfully deleted misspelled email from ia_users')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

async function main() {
  console.log('🚀 Removing misspelled email from ia_users...\n')
  await removeMisspelledEmail()
  console.log('\n✅ Done!')
}

main().catch(console.error)
