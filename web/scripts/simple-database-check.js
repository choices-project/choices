#!/usr/bin/env node

/**
 * Simple Database Check Script
 * 
 * This script directly checks what tables exist and their current state
 * to help us understand what needs to be cleaned up.
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

async function checkDatabase() {
  console.log('🔍 Checking Supabase Database...')
  console.log(`📍 Connected to: ${supabaseUrl}`)
  console.log('')
  
  // Check auth users
  console.log('👥 AUTH USERS:')
  try {
    const { data: authUsers, error } = await supabase.auth.admin.listUsers()
    if (error) {
      console.log(`   ❌ Error: ${error.message}`)
    } else {
      console.log(`   ✅ Found ${authUsers.users?.length || 0} users in auth.users`)
      if (authUsers.users && authUsers.users.length > 0) {
        console.log('   Sample users:')
        authUsers.users.slice(0, 3).forEach(user => {
          console.log(`     - ${user.email} (${user.created_at?.split('T')[0]})`)
        })
      }
    }
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`)
  }
  console.log('')
  
  // Check expected tables
  const tablesToCheck = [
    { name: 'user_profiles', expected: true, description: 'User profile data' },
    { name: 'polls', expected: true, description: 'Poll data' },
    { name: 'votes', expected: true, description: 'Vote data' },
    { name: 'feedback', expected: true, description: 'User feedback' },
    { name: 'error_logs', expected: true, description: 'Error logging' },
    { name: 'webauthn_credentials', expected: false, description: 'REMOVED: Not ready for production' },
    { name: 'ia_users', expected: false, description: 'OLD: Custom user system' },
    { name: 'ia_tokens', expected: false, description: 'OLD: Custom JWT tokens' },
    { name: 'ia_refresh_tokens', expected: false, description: 'OLD: Custom refresh tokens' },
    { name: 'user_sessions', expected: false, description: 'OLD: Custom sessions' },
    { name: 'user_sessions_v2', expected: false, description: 'OLD: Custom sessions v2' },
    { name: 'po_polls', expected: false, description: 'OLD: Poll system' },
    { name: 'biometric_credentials', expected: false, description: 'OLD: Biometric system' }
  ]
  
  console.log('📋 TABLE STATUS:')
  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .limit(1)
      
      if (error) {
        if (error.code === 'PGRST116') {
          const status = table.expected ? '❌ MISSING' : '✅ CLEAN'
          console.log(`   ${status} ${table.name}: ${table.description}`)
        } else {
          console.log(`   ⚠️  ${table.name}: ${error.message}`)
        }
      } else {
        const status = table.expected ? '✅ EXISTS' : '⚠️  OLD TABLE'
        console.log(`   ${status} ${table.name}: ${table.description}`)
        
        // Get row count
        const { count } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true })
        
        console.log(`     └─ ${count || 0} rows`)
      }
    } catch (err) {
      console.log(`   ❌ ${table.name}: ${err.message}`)
    }
  }
  console.log('')
  
  // Check RLS status
  console.log('🔒 ROW LEVEL SECURITY:')
  const rlsTables = ['user_profiles', 'polls', 'votes', 'feedback', 'error_logs']
  
  for (const tableName of rlsTables) {
    try {
      // Try to query the table - if RLS is enabled and no policies exist, this should fail
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (error) {
        if (error.message.includes('RLS') || error.message.includes('policy')) {
          console.log(`   ⚠️  ${tableName}: RLS enabled but may need policies`)
        } else {
          console.log(`   ❌ ${tableName}: ${error.message}`)
        }
      } else {
        console.log(`   ✅ ${table.name}: Accessible (RLS may be disabled or policies exist)`)
      }
    } catch (err) {
      console.log(`   ❌ ${tableName}: ${err.message}`)
    }
  }
  console.log('')
  
  // Generate summary
  console.log('📊 SUMMARY:')
  console.log('=' .repeat(50))
  console.log('✅ Expected: Tables that should exist and are working')
  console.log('❌ Missing: Tables that should exist but are missing')
  console.log('⚠️  Old Table: Tables that exist but should be removed')
  console.log('✅ Clean: Tables that should not exist and are properly removed')
  console.log('')
  console.log('🔒 RLS: Row Level Security status for each table')
  console.log('')
  console.log('💡 NEXT STEPS:')
  console.log('1. Remove old tables (ia_users, ia_tokens, etc.)')
  console.log('2. Create missing tables (user_profiles, polls, etc.)')
  console.log('3. Set up proper RLS policies (no admin privileges)')
  console.log('4. Test all policies thoroughly')
  console.log('5. WebAuthn credentials removed - not ready for production')
}

// Run the check
checkDatabase()
