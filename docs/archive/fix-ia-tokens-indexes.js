#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: './web/.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔧 Fixing IA Tokens Indexes')
console.log('===========================')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixIaTokensIndexes() {
  try {
    // First, let's try to create the indexes with the correct column names
    console.log('\n📋 Step 1: Creating indexes with correct column names...')
    
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql: `
          -- Try to create indexes with the actual column names
          CREATE INDEX IF NOT EXISTS idx_ia_tokens_id ON ia_tokens(id);
          CREATE INDEX IF NOT EXISTS idx_ia_tokens_poll_id ON ia_tokens(poll_id);
          CREATE INDEX IF NOT EXISTS idx_ia_tokens_token_hash ON ia_tokens(token_hash);
          CREATE INDEX IF NOT EXISTS idx_ia_tokens_scope ON ia_tokens(scope);
          CREATE INDEX IF NOT EXISTS idx_ia_tokens_expires_at ON ia_tokens(expires_at);
          CREATE INDEX IF NOT EXISTS idx_ia_tokens_is_used ON ia_tokens(is_used);
        `
      })
    
    if (error) {
      console.log('❌ Error creating indexes:', error.message)
      
      // Try to create indexes one by one to identify the problematic column
      console.log('\n📋 Step 2: Creating indexes one by one...')
      
      const columns = ['id', 'poll_id', 'token_hash', 'scope', 'expires_at', 'is_used']
      
      for (const column of columns) {
        try {
          const { data: indexData, error: indexError } = await supabase
            .rpc('exec_sql', {
              sql: `CREATE INDEX IF NOT EXISTS idx_ia_tokens_${column} ON ia_tokens(${column});`
            })
          
          if (indexError) {
            console.log(`❌ Failed to create index on ${column}:`, indexError.message)
          } else {
            console.log(`✅ Created index on ${column}`)
          }
        } catch (err) {
          console.log(`❌ Error creating index on ${column}:`, err.message)
        }
      }
    } else {
      console.log('✅ All indexes created successfully')
    }

    // Now let's try to create the user_stable_id index specifically
    console.log('\n📋 Step 3: Trying to create user_stable_id index...')
    
    const { data: userIndexData, error: userIndexError } = await supabase
      .rpc('exec_sql', {
        sql: `CREATE INDEX IF NOT EXISTS idx_ia_tokens_user_stable_id ON ia_tokens(user_stable_id);`
      })
    
    if (userIndexError) {
      console.log('❌ Error creating user_stable_id index:', userIndexError.message)
      
      // Let's check what columns actually exist
      console.log('\n📋 Step 4: Checking actual column names...')
      
      const { data: columnsData, error: columnsError } = await supabase
        .rpc('exec_sql', {
          sql: `
            SELECT column_name, data_type
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'ia_tokens'
            ORDER BY ordinal_position;
          `
        })
      
      if (columnsError) {
        console.log('❌ Error getting column names:', columnsError.message)
      } else {
        console.log('✅ Actual columns in ia_tokens table:')
        console.log(columnsData)
      }
    } else {
      console.log('✅ user_stable_id index created successfully')
    }

  } catch (err) {
    console.error('❌ Error:', err.message)
  }
}

fixIaTokensIndexes()
