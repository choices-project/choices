#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: './web/.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🧪 Testing IA Tokens Insert')
console.log('===========================')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testIaTokensInsert() {
  try {
    // Try minimal insert to see what columns exist
    console.log('\n📋 Testing minimal insert...')
    
    const { data, error } = await supabase
      .from('ia_tokens')
      .insert({
        id: '00000000-0000-0000-0000-000000000000',
        user_stable_id: 'test-user',
        poll_id: '00000000-0000-0000-0000-000000000000'
      })
      .select()
    
    if (error) {
      console.log('❌ Minimal insert error:', error.message)
      
      // Try with just id
      console.log('\n�� Testing with just id...')
      
      const { data: idData, error: idError } = await supabase
        .from('ia_tokens')
        .insert({
          id: '00000000-0000-0000-0000-000000000001'
        })
        .select()
      
      if (idError) {
        console.log('❌ ID-only insert error:', idError.message)
      } else {
        console.log('✅ ID-only insert successful:', idData)
      }
    } else {
      console.log('✅ Minimal insert successful:', data)
    }

    // Try to get the table schema using RPC
    console.log('\n📋 Getting table schema via RPC...')
    
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT 
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'ia_tokens'
          ORDER BY ordinal_position;
        `
      })
    
    if (schemaError) {
      console.log('❌ Schema query error:', schemaError.message)
    } else {
      console.log('✅ Schema data:', schemaData)
    }

  } catch (err) {
    console.error('❌ Error:', err.message)
  }
}

testIaTokensInsert()
