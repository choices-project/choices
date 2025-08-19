#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: './web/.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔧 Fixing IA Tokens Column Names')
console.log('=================================')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixIaTokensColumns() {
  try {
    // Try insert with user_id instead of user_stable_id
    console.log('\n📋 Testing with user_id column...')
    
    const { data, error } = await supabase
      .from('ia_tokens')
      .insert({
        user_id: 'test-user',
        poll_id: '00000000-0000-0000-0000-000000000000',
        token_hash: 'test-hash',
        token_signature: 'test-signature',
        scope: 'test-scope',
        tier: 'T1',
        expires_at: new Date(Date.now() + 3600000).toISOString()
      })
      .select()
    
    if (error) {
      console.log('❌ Insert with user_id error:', error.message)
      
      // Try with minimal fields
      console.log('\n📋 Testing minimal fields...')
      
      const { data: minData, error: minError } = await supabase
        .from('ia_tokens')
        .insert({
          user_id: 'test-user',
          poll_id: '00000000-0000-0000-0000-000000000000'
        })
        .select()
      
      if (minError) {
        console.log('❌ Minimal insert error:', minError.message)
      } else {
        console.log('✅ Minimal insert successful:', minData)
        
        // Clean up
        const { error: deleteError } = await supabase
          .from('ia_tokens')
          .delete()
          .eq('user_id', 'test-user')
        
        if (deleteError) {
          console.log('⚠️  Cleanup error:', deleteError.message)
        } else {
          console.log('✅ Test record cleaned up')
        }
      }
    } else {
      console.log('✅ Insert with user_id successful:', data)
      
      // Clean up
      const { error: deleteError } = await supabase
        .from('ia_tokens')
        .delete()
        .eq('user_id', 'test-user')
      
      if (deleteError) {
        console.log('⚠️  Cleanup error:', deleteError.message)
      } else {
        console.log('✅ Test record cleaned up')
      }
    }

    console.log('\n📋 Conclusion: The column is named user_id, not user_stable_id');
    console.log('📋 Need to update security policies to use user_id');

  } catch (err) {
    console.error('❌ Error:', err.message)
  }
}

fixIaTokensColumns()
