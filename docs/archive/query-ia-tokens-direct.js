#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: './web/.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Querying IA Tokens Table Directly')
console.log('====================================')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function queryIaTokensDirect() {
  try {
    // Try to query ia_tokens directly
    console.log('\n📋 Step 1: Trying to query ia_tokens table...')
    
    const { data, error } = await supabase
      .from('ia_tokens')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('❌ Error querying ia_tokens:', error.message)
      
      // Try to get table info using RPC
      console.log('\n📋 Step 2: Getting table info via RPC...')
      
      const { data: tableInfo, error: tableError } = await supabase
        .rpc('exec_sql', {
          sql: `
            SELECT 
              column_name,
              data_type
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'ia_tokens'
            ORDER BY ordinal_position;
          `
        })
      
      if (tableError) {
        console.log('❌ Error getting table info:', tableError.message)
      } else {
        console.log('✅ Table info:', tableInfo)
      }
    } else {
      console.log('✅ ia_tokens table accessible')
      console.log('📋 Sample data:', data)
    }

    // Try to get all tables
    console.log('\n�� Step 3: Getting all tables...')
    
    const { data: tables, error: tablesError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public'
          ORDER BY table_name;
        `
      })
    
    if (tablesError) {
      console.log('❌ Error getting tables:', tablesError.message)
    } else {
      console.log('✅ All tables:', tables)
    }

  } catch (err) {
    console.error('❌ Error:', err.message)
  }
}

queryIaTokensDirect()
