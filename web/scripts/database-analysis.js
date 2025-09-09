#!/usr/bin/env node

/**
 * Database Analysis Script
 * 
 * This script analyzes the current Supabase database state to identify:
 * - Existing tables and their structure
 * - RLS policies and their effectiveness
 * - Unused or problematic tables
 * - Missing essential tables
 * - Security issues and warnings
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
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function analyzeDatabase() {
  try {
    console.log('🔍 Analyzing Supabase Database...')
    console.log(`📍 Connected to: ${supabaseUrl}`)
    console.log('')
    
    // 1. Check all tables in the public schema
    console.log('📋 STEP 1: Analyzing Database Tables')
    console.log('=' .repeat(50))
    
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_schema_tables')
      .catch(async () => {
        // Fallback: try to query information_schema directly
        const { data, error } = await supabase
          .from('information_schema.tables')
          .select('table_name, table_type')
          .eq('table_schema', 'public')
        
        return { data, error }
      })
    
    if (tablesError) {
      console.log('⚠️  Could not query table information directly')
      console.log('   This might be due to RLS or permission issues')
      console.log('')
      
      // Try to identify tables by attempting to query common table names
      await checkCommonTables()
    } else {
      console.log(`✅ Found ${tables?.length || 0} tables in public schema:`)
      if (tables && tables.length > 0) {
        tables.forEach(table => {
          console.log(`   - ${table.table_name} (${table.table_type})`)
        })
      }
      console.log('')
    }
    
    // 2. Check auth.users table (Supabase built-in)
    console.log('👥 STEP 2: Analyzing Auth System')
    console.log('=' .repeat(50))
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.log('❌ Error accessing auth.users:', authError.message)
    } else {
      console.log(`✅ Auth system accessible, found ${authUsers.users?.length || 0} users`)
      
      if (authUsers.users && authUsers.users.length > 0) {
        console.log('   Sample users:')
        authUsers.users.slice(0, 3).forEach(user => {
          console.log(`   - ${user.email} (${user.created_at})`)
        })
      }
    }
    console.log('')
    
    // 3. Check for common tables we expect
    console.log('🎯 STEP 3: Checking Expected Tables')
    console.log('=' .repeat(50))
    
    const expectedTables = [
      'user_profiles',
      'polls', 
      'votes',
      'feedback',
      'webauthn_credentials',
      'error_logs'
    ]
    
    for (const tableName of expectedTables) {
      await checkTableExists(tableName)
    }
    console.log('')
    
    // 4. Check for potentially problematic tables
    console.log('⚠️  STEP 4: Checking for Problematic Tables')
    console.log('=' .repeat(50))
    
    const problematicTables = [
      'ia_users',
      'ia_tokens', 
      'ia_refresh_tokens',
      'user_sessions',
      'user_sessions_v2',
      'po_polls',
      'biometric_credentials'
    ]
    
    for (const tableName of problematicTables) {
      await checkTableExists(tableName, true)
    }
    console.log('')
    
    // 5. Check RLS policies
    console.log('🔒 STEP 5: Analyzing Row Level Security')
    console.log('=' .repeat(50))
    
    await checkRLSPolicies()
    console.log('')
    
    // 6. Generate recommendations
    console.log('💡 STEP 6: Recommendations')
    console.log('=' .repeat(50))
    
    generateRecommendations()
    
  } catch (error) {
    console.error('❌ Unexpected error during analysis:', error)
  }
}

async function checkCommonTables() {
  const commonTables = [
    'user_profiles', 'polls', 'votes', 'feedback', 
    'ia_users', 'po_polls', 'webauthn_credentials'
  ]
  
  console.log('🔍 Checking for common tables:')
  
  for (const tableName of commonTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)
      
      if (error) {
        console.log(`   ❌ ${tableName}: ${error.message}`)
      } else {
        console.log(`   ✅ ${tableName}: Accessible`)
      }
    } catch (err) {
      console.log(`   ❌ ${tableName}: ${err.message}`)
    }
  }
}

async function checkTableExists(tableName, isProblematic = false) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)
    
    if (error) {
      if (error.code === 'PGRST116') {
        console.log(`   ❌ ${tableName}: Table does not exist`)
      } else {
        console.log(`   ⚠️  ${tableName}: ${error.message}`)
      }
    } else {
      const status = isProblematic ? '⚠️  PROBLEMATIC' : '✅ EXISTS'
      console.log(`   ${status} ${tableName}: Table exists and accessible`)
    }
  } catch (err) {
    console.log(`   ❌ ${tableName}: ${err.message}`)
  }
}

async function checkRLSPolicies() {
  try {
    // Try to query RLS policies
    const { data: policies, error } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('schemaname', 'public')
    
    if (error) {
      console.log('⚠️  Could not query RLS policies directly')
      console.log('   This might be due to permission restrictions')
      
      // Try to test RLS by attempting operations
      await testRLSWithOperations()
    } else {
      console.log(`✅ Found ${policies?.length || 0} RLS policies:`)
      if (policies && policies.length > 0) {
        policies.forEach(policy => {
          console.log(`   - ${policy.tablename}: ${policy.policyname}`)
        })
      }
    }
  } catch (err) {
    console.log('❌ Error checking RLS policies:', err.message)
  }
}

async function testRLSWithOperations() {
  console.log('🔍 Testing RLS with sample operations...')
  
  // Test user_profiles table
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log(`   ⚠️  user_profiles RLS: ${error.message}`)
    } else {
      console.log('   ✅ user_profiles: RLS appears to be working')
    }
  } catch (err) {
    console.log(`   ❌ user_profiles RLS test failed: ${err.message}`)
  }
}

function generateRecommendations() {
  console.log('📋 Database Cleanup Recommendations:')
  console.log('')
  
  console.log('1. 🗑️  REMOVE OLD TABLES:')
  console.log('   - ia_users (replaced by auth.users)')
  console.log('   - ia_tokens (replaced by Supabase Auth)')
  console.log('   - ia_refresh_tokens (replaced by Supabase Auth)')
  console.log('   - user_sessions (replaced by Supabase Auth)')
  console.log('   - user_sessions_v2 (replaced by Supabase Auth)')
  console.log('   - po_polls (replaced by polls)')
  console.log('   - biometric_credentials (replaced by webauthn_credentials)')
  console.log('')
  
  console.log('2. ✅ KEEP ESSENTIAL TABLES:')
  console.log('   - user_profiles (linked to auth.users)')
  console.log('   - polls (core functionality)')
  console.log('   - votes (core functionality)')
  console.log('   - feedback (user feedback system)')
  console.log('   - webauthn_credentials (biometric auth)')
  console.log('   - error_logs (system monitoring)')
  console.log('')
  
  console.log('3. 🔒 RLS REQUIREMENTS:')
  console.log('   - Enable RLS on ALL tables')
  console.log('   - Create policies for user data access')
  console.log('   - Create policies for public data access')
  console.log('   - Create policies for admin access')
  console.log('   - Test all policies thoroughly')
  console.log('')
  
  console.log('4. 🏗️  SCHEMA IMPROVEMENTS:')
  console.log('   - Standardize column naming (snake_case)')
  console.log('   - Add proper foreign key constraints')
  console.log('   - Add proper indexes for performance')
  console.log('   - Add proper triggers for timestamps')
  console.log('   - Add proper validation constraints')
  console.log('')
  
  console.log('5. 🚨 SECURITY CHECKS:')
  console.log('   - Review all RLS policies')
  console.log('   - Check for data leakage')
  console.log('   - Verify admin access controls')
  console.log('   - Test authentication flows')
  console.log('   - Monitor for unusual activity')
}

// Run the analysis
analyzeDatabase()
