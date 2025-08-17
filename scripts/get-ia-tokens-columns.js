#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: './web/.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Getting IA Tokens Column Names')
console.log('==================================')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function getIaTokensColumns() {
  try {
    // Get column information using direct query
    console.log('\n📋 Getting column information...')
    
    const { data, error } = await supabase
      .from('ia_tokens')
      .select('*')
      .limit(0) // This will return column info without data
    
    if (error) {
      console.log('❌ Error getting column info:', error.message)
      
      // Try alternative approach
      console.log('\n📋 Trying alternative approach...')
      
      const { data: altData, error: altError } = await supabase
        .rpc('exec_sql', {
          sql: `
            SELECT 
              column_name,
              data_type,
              is_nullable
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'ia_tokens'
            ORDER BY ordinal_position;
          `
        })
      
      if (altError) {
        console.log('❌ Alternative approach failed:', altError.message)
      } else {
        console.log('✅ Column information (RPC):', altData)
      }
    } else {
      console.log('✅ Column information (direct):', data)
    }

    // Try to insert a test record to see what happens
    console.log('\n📋 Testing insert...')
    
    const { data: insertData, error: insertError } = await supabase
      .from('ia_tokens')
      .insert({
        user_stable_id: 'test-user',
        poll_id: '00000000-0000-0000-0000-000000000000',
        token_hash: 'test-hash',
        token_signature: 'test-signature',
        scope: 'test-scope',
        tier: 'T1',
        expires_at: new Date(Date.now() + 3600000).toISOString()
      })
      .select()
    
    if (insertError) {
      console.log('❌ Insert error:', insertError.message)
    } else {
      console.log('✅ Insert successful:', insertData)
      
      // Clean up test record
      const { error: deleteError } = await supabase
        .from('ia_tokens')
        .delete()
        .eq('user_stable_id', 'test-user')
      
      if (deleteError) {
        console.log('⚠️  Cleanup error:', deleteError.message)
      } else {
        console.log('✅ Test record cleaned up')
      }
    }

  } catch (err) {
    console.error('❌ Error:', err.message)
  }
}

getIaTokensColumns()
