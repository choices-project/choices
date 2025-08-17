#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: './web/.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 Investigating IA Tokens Table Structure')
console.log('==========================================')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseKey ? 'Present' : 'Missing')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function investigateIaTokens() {
  try {
    // 1. Check if ia_tokens table exists
    console.log('\n📋 Step 1: Checking if ia_tokens table exists...')
    
    const { data: tableCheck, error: tableError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'ia_tokens'
          ) as table_exists;
        `
      })

    if (tableError) {
      console.log('❌ Error checking table existence:', tableError.message)
      return
    }

    if (tableCheck && tableCheck[0]?.table_exists) {
      console.log('✅ ia_tokens table exists')
    } else {
      console.log('❌ ia_tokens table does not exist')
      console.log('This is a CRITICAL issue - the IA/PO architecture requires this table!')
      return
    }

    // 2. Get table structure
    console.log('\n📋 Step 2: Getting ia_tokens table structure...')
    
    const { data: structure, error: structureError } = await supabase
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

    if (structureError) {
      console.log('❌ Error getting table structure:', structureError.message)
      return
    }

    console.log('✅ ia_tokens table structure:')
    console.log(JSON.stringify(structure, null, 2))

    // 3. Look for user-related columns
    console.log('\n📋 Step 3: Checking for user-related columns...')
    
    const { data: userColumns, error: userError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'ia_tokens'
          AND (column_name LIKE '%user%' OR column_name LIKE '%stable%' OR column_name LIKE '%id%')
          ORDER BY column_name;
        `
      })

    if (userError) {
      console.log('❌ Error getting user columns:', userError.message)
      return
    }

    console.log('✅ User-related columns found:')
    console.log(JSON.stringify(userColumns, null, 2))

    console.log('\n📋 Step 4: Understanding IA/PO Architecture...')
    console.log('Based on the documentation:')
    console.log('- IA (Identity Authority): Issues blinded tokens for voting')
    console.log('- PO (Poll Orchestrator): Verifies tokens and manages voting')
    console.log('- ia_tokens table: Stores blinded tokens and verification data')
    console.log('- This is CRITICAL for the security model!')

  } catch (error) {
    console.error('❌ Investigation failed:', error.message)
  }
}

investigateIaTokens()
