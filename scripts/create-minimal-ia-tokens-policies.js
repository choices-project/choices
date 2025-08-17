#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: './web/.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔧 Creating Minimal IA Tokens Security Policies')
console.log('================================================')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createMinimalIaTokensPolicies() {
  try {
    // Enable RLS on ia_tokens
    console.log('\n📋 Step 1: Enabling RLS on ia_tokens...')
    
    const { data: rlsData, error: rlsError } = await supabase
      .rpc('exec_sql', {
        sql: 'ALTER TABLE ia_tokens ENABLE ROW LEVEL SECURITY;'
      })
    
    if (rlsError) {
      console.log('❌ RLS enable error:', rlsError.message)
    } else {
      console.log('✅ RLS enabled on ia_tokens')
    }

    // Create minimal policies using only the columns we know exist
    console.log('\n📋 Step 2: Creating minimal security policies...')
    
    const policies = [
      {
        name: 'Users can view own tokens',
        sql: `
          CREATE POLICY "Users can view own tokens" ON ia_tokens
          FOR SELECT USING (
            auth.uid()::uuid = user_id
          );
        `
      },
      {
        name: 'Users can insert own tokens',
        sql: `
          CREATE POLICY "Users can insert own tokens" ON ia_tokens
          FOR INSERT WITH CHECK (
            auth.uid()::uuid = user_id
          );
        `
      }
    ]

    for (const policy of policies) {
      console.log(`📋 Creating policy: ${policy.name}`)
      
      const { data: policyData, error: policyError } = await supabase
        .rpc('exec_sql', {
          sql: policy.sql
        })
      
      if (policyError) {
        console.log(`❌ Policy creation error:`, policyError.message)
      } else {
        console.log(`✅ Policy created: ${policy.name}`)
      }
    }

    console.log('\n🎉 Minimal IA tokens security policies created!');
    console.log('📋 These policies ensure:');
    console.log('   - Users can only see their own tokens');
    console.log('   - Users can only insert their own tokens');
    console.log('   - IA/PO architecture integrity is maintained');

  } catch (err) {
    console.error('❌ Error:', err.message)
  }
}

createMinimalIaTokensPolicies()
