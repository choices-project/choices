#!/usr/bin/env node

/**
 * Get User ID Script
 * 
 * This script helps you get your Supabase user ID to hardcode into security functions
 * 
 * Created: September 9, 2025
 */

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function getUserID() {
  console.log('🔍 Getting your Supabase user ID...')
  console.log(`📍 Connected to: ${supabaseUrl}`)
  console.log('')
  
  try {
    // Get all users from auth
    const { data: authUsers, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('❌ Error getting users:', error.message)
      return
    }
    
    if (!authUsers.users || authUsers.users.length === 0) {
      console.log('❌ No users found in auth.users')
      return
    }
    
    console.log('👥 Found users:')
    console.log('')
    
    authUsers.users.forEach((user, index) => {
      console.log(`${index + 1}. User ID: ${user.id}`)
      console.log(`   Email: ${user.email || 'No email'}`)
      console.log(`   Created: ${user.created_at}`)
      console.log(`   Last Sign In: ${user.last_sign_in_at || 'Never'}`)
      console.log('')
    })
    
    // Find the most likely admin user (you)
    const mostRecentUser = authUsers.users
      .filter(user => user.email)
      .sort((a, b) => new Date(b.last_sign_in_at || b.created_at) - new Date(a.last_sign_in_at || a.created_at))[0]
    
    if (mostRecentUser) {
      console.log('🎯 Most likely admin user (you):')
      console.log(`   User ID: ${mostRecentUser.id}`)
      console.log(`   Email: ${mostRecentUser.email}`)
      console.log('')
      console.log('📋 Copy this User ID and replace "your-user-id-here" in the security functions:')
      console.log(`   ${mostRecentUser.id}`)
      console.log('')
      console.log('🔧 Update these files:')
      console.log('   - web/database/fix-function-security.sql')
      console.log('   - Replace "your-user-id-here" with the ID above')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
getUserID()
