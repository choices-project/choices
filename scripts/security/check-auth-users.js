#!/usr/bin/env node

/**
 * Check Auth Users Script
 * Shows what's actually in the auth.users table
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

async function checkAuthUsers() {
  console.log('🔍 Checking auth.users table...\n')
  
  try {
    // Get all users from auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError)
      return
    }

    console.log(`📊 Found ${authUsers.users.length} users in auth.users:\n`)

    authUsers.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`)
      console.log(`   - ID: ${user.id}`)
      console.log(`   - Created: ${user.created_at}`)
      console.log(`   - Last Sign In: ${user.last_sign_in_at || 'Never'}`)
      console.log(`   - Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
      console.log('')
    })

    // Check for duplicates
    const emailCounts = {}
    authUsers.users.forEach(user => {
      const email = user.email?.toLowerCase()
      if (email) {
        emailCounts[email] = (emailCounts[email] || 0) + 1
      }
    })

    const duplicates = Object.entries(emailCounts).filter(([email, count]) => count > 1)
    
    if (duplicates.length > 0) {
      console.log('⚠️  Duplicate emails found:')
      duplicates.forEach(([email, count]) => {
        console.log(`   - ${email}: ${count} accounts`)
      })
    } else {
      console.log('✅ No duplicate emails found')
    }

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

async function main() {
  await checkAuthUsers()
}

main().catch(console.error)
