#!/usr/bin/env node

/**
 * Fix iausers Duplicate Emails Script
 * Identifies and resolves duplicate email addresses in the iausers table
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

async function findDuplicateEmails() {
  console.log('🔍 Checking for duplicate emails in iausers table...\n')
  
  try {
    // Get all users from iausers table
    const { data: iausers, error: iausersError } = await supabase
      .from('iausers')
      .select('*')
    
    if (iausersError) {
      console.error('❌ Error fetching iausers:', iausersError)
      return
    }

    console.log(`📊 Found ${iausers.length} users in iausers table:\n`)

    // Display all users
    iausers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email}`)
      console.log(`   - ID: ${user.id}`)
      console.log(`   - Trust Tier: ${user.trust_tier}`)
      console.log(`   - Created: ${user.created_at}`)
      console.log('')
    })

    // Check for duplicate emails
    const emailCounts = {}
    const duplicateEmails = []
    
    iausers.forEach(user => {
      const email = user.email?.toLowerCase()
      if (email) {
        emailCounts[email] = (emailCounts[email] || 0) + 1
        if (emailCounts[email] === 2) {
          duplicateEmails.push(email)
        }
      }
    })

    if (duplicateEmails.length === 0) {
      console.log('✅ No duplicate emails found in iausers table')
    } else {
      console.log('⚠️  Duplicate emails found in iausers table:')
      duplicateEmails.forEach(email => {
        const users = iausers.filter(u => u.email?.toLowerCase() === email)
        console.log(`\n📧 ${email}:`)
        users.forEach(user => {
          console.log(`   - ID: ${user.id}`)
          console.log(`   - Trust Tier: ${user.trust_tier}`)
          console.log(`   - Created: ${user.created_at}`)
        })
      })
    }

    return { duplicateEmails, iausers }

  } catch (error) {
    console.error('❌ Error analyzing iausers:', error)
  }
}

async function fixDuplicateEmails(duplicateData) {
  if (!duplicateData || duplicateData.duplicateEmails.length === 0) {
    console.log('\n✅ No duplicates to fix')
    return
  }

  console.log('\n🔧 Fixing duplicate emails...\n')

  for (const email of duplicateData.duplicateEmails) {
    const users = duplicateData.iausers.filter(u => u.email?.toLowerCase() === email)
    
    console.log(`📧 Processing duplicates for: ${email}`)
    
    // Sort users by creation date (keep the oldest)
    users.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    
    const keepUser = users[0] // Oldest user
    const removeUsers = users.slice(1) // Newer duplicates
    
    console.log(`   Keeping: ${keepUser.id} (created: ${keepUser.created_at})`)
    
    for (const removeUser of removeUsers) {
      console.log(`   Removing: ${removeUser.id} (created: ${removeUser.created_at})`)
      
      try {
        // Delete the duplicate user from iausers
        const { error: deleteError } = await supabase
          .from('iausers')
          .delete()
          .eq('id', removeUser.id)
        
        if (deleteError) {
          console.error(`   ❌ Error deleting user ${removeUser.id}:`, deleteError)
        } else {
          console.log(`   ✅ Deleted user ${removeUser.id}`)
        }
      } catch (error) {
        console.error(`   ❌ Error deleting user ${removeUser.id}:`, error)
      }
    }
  }
}

async function main() {
  console.log('🚀 Starting iausers duplicate email cleanup...\n')
  
  const duplicateData = await findDuplicateEmails()
  
  if (duplicateData) {
    await fixDuplicateEmails(duplicateData)
  }
  
  console.log('\n✅ iausers duplicate email cleanup completed!')
  
  // Final verification
  console.log('\n🔍 Final verification...')
  const finalCheck = await findDuplicateEmails()
  
  if (finalCheck && finalCheck.duplicateEmails.length === 0) {
    console.log('\n🎉 All duplicate emails have been resolved!')
  } else {
    console.log('\n⚠️  Some duplicates may still exist')
  }
}

main().catch(console.error)
