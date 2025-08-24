#!/usr/bin/env node

/**
 * Fix Duplicate Emails Script
 * Identifies and resolves duplicate email addresses in the database
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
  console.log('🔍 Checking for duplicate emails...\n')
  
  try {
    // Get all users from auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError)
      return
    }

    // Get all users from user_profiles
    const { data: profileUsers, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
    
    if (profileError) {
      console.error('❌ Error fetching profile users:', profileError)
      return
    }

    console.log('📊 User Analysis:')
    console.log('==================')
    console.log(`Auth Users: ${authUsers.users.length}`)
    console.log(`Profile Users: ${profileUsers.length}\n`)

    // Check for duplicate emails in auth.users
    const emailCounts = {}
    const duplicateEmails = []
    
    authUsers.users.forEach(user => {
      const email = user.email?.toLowerCase()
      if (email) {
        emailCounts[email] = (emailCounts[email] || 0) + 1
        if (emailCounts[email] === 2) {
          duplicateEmails.push(email)
        }
      }
    })

    if (duplicateEmails.length === 0) {
      console.log('✅ No duplicate emails found in auth.users')
    } else {
      console.log('⚠️  Duplicate emails found in auth.users:')
      duplicateEmails.forEach(email => {
        const users = authUsers.users.filter(u => u.email?.toLowerCase() === email)
        console.log(`\n📧 ${email}:`)
        users.forEach(user => {
          console.log(`   - ID: ${user.id}`)
          console.log(`   - Created: ${user.created_at}`)
          console.log(`   - Last Sign In: ${user.last_sign_in_at || 'Never'}`)
          console.log(`   - Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
        })
      })
    }

    // Check for orphaned profiles
    const orphanedProfiles = profileUsers.filter(profile => 
      !authUsers.users.find(authUser => authUser.id === profile.user_id)
    )

    if (orphanedProfiles.length > 0) {
      console.log(`\n⚠️  Found ${orphanedProfiles.length} orphaned profiles:`)
      orphanedProfiles.forEach(profile => {
        console.log(`   - User ID: ${profile.user_id}`)
        console.log(`   - Display Name: ${profile.displayname}`)
      })
    }

    return { duplicateEmails, orphanedProfiles, authUsers, profileUsers }

  } catch (error) {
    console.error('❌ Error analyzing users:', error)
  }
}

async function fixDuplicateEmails(duplicateData) {
  if (!duplicateData || duplicateData.duplicateEmails.length === 0) {
    console.log('\n✅ No duplicates to fix')
    return
  }

  console.log('\n🔧 Fixing duplicate emails...\n')

  for (const email of duplicateData.duplicateEmails) {
    const users = duplicateData.authUsers.users.filter(u => u.email?.toLowerCase() === email)
    
    console.log(`📧 Processing duplicates for: ${email}`)
    
    // Sort users by creation date (keep the oldest)
    users.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    
    const keepUser = users[0] // Oldest user
    const removeUsers = users.slice(1) // Newer duplicates
    
    console.log(`   Keeping: ${keepUser.id} (created: ${keepUser.created_at})`)
    
    for (const removeUser of removeUsers) {
      console.log(`   Removing: ${removeUser.id} (created: ${removeUser.created_at})`)
      
      try {
        // Delete the duplicate user from auth
        const { error: deleteError } = await supabase.auth.admin.deleteUser(removeUser.id)
        
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

async function cleanupOrphanedProfiles(duplicateData) {
  if (!duplicateData || duplicateData.orphanedProfiles.length === 0) {
    console.log('\n✅ No orphaned profiles to clean up')
    return
  }

  console.log('\n🧹 Cleaning up orphaned profiles...\n')

  for (const profile of duplicateData.orphanedProfiles) {
    console.log(`Removing orphaned profile: ${profile.user_id}`)
    
    try {
      const { error } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', profile.user_id)
      
      if (error) {
        console.error(`   ❌ Error deleting profile ${profile.user_id}:`, error)
      } else {
        console.log(`   ✅ Deleted orphaned profile ${profile.user_id}`)
      }
    } catch (error) {
      console.error(`   ❌ Error deleting profile ${profile.user_id}:`, error)
    }
  }
}

async function main() {
  console.log('🚀 Starting duplicate email cleanup...\n')
  
  const duplicateData = await findDuplicateEmails()
  
  if (duplicateData) {
    await fixDuplicateEmails(duplicateData)
    await cleanupOrphanedProfiles(duplicateData)
  }
  
  console.log('\n✅ Duplicate email cleanup completed!')
  
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
