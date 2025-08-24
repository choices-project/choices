#!/usr/bin/env node

/**
 * Test Row Level Security (RLS) Policies
 * This script tests the RLS policies to ensure they're working correctly
 */

const { createClient } = require('@supabase/supabase-js')

// Configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testRLSPolicies() {
  console.log('🔒 Testing Row Level Security Policies...\n')

  const tests = [
    {
      name: 'Check RLS is enabled on tables',
      test: async () => {
        const { data, error } = await supabase
          .from('information_schema.tables')
          .select('table_name, row_security')
          .eq('table_schema', 'public')
          .in('table_name', ['user_profiles', 'polls', 'votes', 'webauthn_credentials', 'error_logs'])

        if (error) throw error

        const tablesWithRLS = data.filter(table => table.row_security === 'YES')
        const expectedTables = ['user_profiles', 'polls', 'votes', 'webauthn_credentials', 'error_logs']

        const missingRLS = expectedTables.filter(table => 
          !tablesWithRLS.find(t => t.table_name === table)
        )

        if (missingRLS.length > 0) {
          throw new Error(`RLS not enabled on: ${missingRLS.join(', ')}`)
        }

        return `✅ RLS enabled on all ${tablesWithRLS.length} tables`
      }
    },
    {
      name: 'Check RLS policies exist',
      test: async () => {
        const { data, error } = await supabase
          .from('pg_policies')
          .select('tablename, policyname')
          .eq('schemaname', 'public')
          .in('tablename', ['user_profiles', 'polls', 'votes', 'webauthn_credentials', 'error_logs'])

        if (error) throw error

        const expectedPolicies = [
          'Users can view own profile',
          'Users can update own profile',
          'Users can insert own profile',
          'Admins can view all profiles',
          'Admins can update all profiles',
          'Public polls are viewable',
          'Users can view own polls',
          'Users can create polls',
          'Users can update own polls',
          'Users can delete own polls',
          'Admins can manage all polls',
          'Users can view votes on public polls',
          'Users can view own votes',
          'Users can create votes',
          'Users can update own votes',
          'Users can delete own votes',
          'Admins can view all votes',
          'Users can manage own credentials',
          'Admins can view all credentials',
          'Admins can view error logs',
          'System can insert error logs'
        ]

        const existingPolicies = data.map(p => p.policyname)
        const missingPolicies = expectedPolicies.filter(policy => 
          !existingPolicies.includes(policy)
        )

        if (missingPolicies.length > 0) {
          throw new Error(`Missing policies: ${missingPolicies.join(', ')}`)
        }

        return `✅ All ${existingPolicies.length} expected policies exist`
      }
    },
    {
      name: 'Check indexes exist for RLS performance',
      test: async () => {
        const { data, error } = await supabase
          .from('pg_indexes')
          .select('indexname')
          .eq('schemaname', 'public')
          .like('indexname', 'idx_%')

        if (error) throw error

        const expectedIndexes = [
          'idx_user_profiles_user_id',
          'idx_user_profiles_trust_tier',
          'idx_polls_user_id',
          'idx_polls_privacy_level',
          'idx_polls_created_at',
          'idx_votes_user_id',
          'idx_votes_poll_id',
          'idx_votes_created_at',
          'idx_webauthn_credentials_user_id',
          'idx_error_logs_created_at'
        ]

        const existingIndexes = data.map(i => i.indexname)
        const missingIndexes = expectedIndexes.filter(index => 
          !existingIndexes.includes(index)
        )

        if (missingIndexes.length > 0) {
          throw new Error(`Missing indexes: ${missingIndexes.join(', ')}`)
        }

        return `✅ All ${existingIndexes.length} expected indexes exist`
      }
    },
    {
      name: 'Check helper functions exist',
      test: async () => {
        const { data, error } = await supabase
          .from('information_schema.routines')
          .select('routine_name')
          .eq('routine_schema', 'public')
          .in('routine_name', ['is_admin', 'has_trust_tier'])

        if (error) throw error

        const expectedFunctions = ['is_admin', 'has_trust_tier']
        const existingFunctions = data.map(f => f.routine_name)
        const missingFunctions = expectedFunctions.filter(func => 
          !existingFunctions.includes(func)
        )

        if (missingFunctions.length > 0) {
          throw new Error(`Missing functions: ${missingFunctions.join(', ')}`)
        }

        return `✅ All ${existingFunctions.length} expected functions exist`
      }
    },
    {
      name: 'Test is_admin function',
      test: async () => {
        // Create a test user
        const testEmail = `test-admin-${Date.now()}@example.com`
        const { data: user, error: userError } = await supabase.auth.admin.createUser({
          email: testEmail,
          password: 'testpassword123',
          email_confirm: true
        })

        if (userError) throw userError

        // Create admin profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.user.id,
            username: 'testadmin',
            email: testEmail,
            trust_tier: 'T3'
          })

        if (profileError) throw profileError

        // Test is_admin function
        const { data: isAdminResult, error: funcError } = await supabase
          .rpc('is_admin', { user_uuid: user.user.id })

        if (funcError) throw funcError

        if (!isAdminResult) {
          throw new Error('is_admin function returned false for admin user')
        }

        // Clean up
        await supabase.auth.admin.deleteUser(user.user.id)

        return '✅ is_admin function works correctly'
      }
    },
    {
      name: 'Test has_trust_tier function',
      test: async () => {
        // Create a test user
        const testEmail = `test-tier-${Date.now()}@example.com`
        const { data: user, error: userError } = await supabase.auth.admin.createUser({
          email: testEmail,
          password: 'testpassword123',
          email_confirm: true
        })

        if (userError) throw userError

        // Create T2 profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.user.id,
            username: 'testtier',
            email: testEmail,
            trust_tier: 'T2'
          })

        if (profileError) throw profileError

        // Test has_trust_tier function
        const { data: hasT2Result, error: t2Error } = await supabase
          .rpc('has_trust_tier', { user_uuid: user.user.id, required_tier: 'T2' })

        if (t2Error) throw t2Error

        if (!hasT2Result) {
          throw new Error('has_trust_tier function returned false for T2 user')
        }

        // Test T3 requirement (should fail)
        const { data: hasT3Result, error: t3Error } = await supabase
          .rpc('has_trust_tier', { user_uuid: user.user.id, required_tier: 'T3' })

        if (t3Error) throw t3Error

        if (hasT3Result) {
          throw new Error('has_trust_tier function returned true for T2 user requiring T3')
        }

        // Clean up
        await supabase.auth.admin.deleteUser(user.user.id)

        return '✅ has_trust_tier function works correctly'
      }
    }
  ]

  let passed = 0
  let failed = 0

  for (const testCase of tests) {
    try {
      console.log(`🧪 ${testCase.name}...`)
      const result = await testCase.test()
      console.log(`   ${result}\n`)
      passed++
    } catch (error) {
      console.log(`   ❌ Failed: ${error.message}\n`)
      failed++
    }
  }

  console.log('📊 Test Results:')
  console.log(`   ✅ Passed: ${passed}`)
  console.log(`   ❌ Failed: ${failed}`)
  console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`)

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Please check the RLS implementation.')
    process.exit(1)
  } else {
    console.log('\n🎉 All RLS tests passed!')
  }
}

// Run the tests
testRLSPolicies().catch(error => {
  console.error('❌ Test suite failed:', error)
  process.exit(1)
})
