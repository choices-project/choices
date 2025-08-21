#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function findUserIdTables() {
  try {
    console.log('🔍 Finding all tables with user_id columns...')
    
    // Get all tables in the database
    const { data: tables, error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_type = 'BASE TABLE'
        ORDER BY table_name;
      `
    })
    
    if (tableError) {
      console.error('❌ Error getting tables:', tableError)
      return
    }
    
    console.log('📋 All tables in database:')
    if (tables && Array.isArray(tables)) {
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`)
      })
    }
    
    // Check each table for user_id columns
    console.log('\n🔍 Checking each table for user_id columns...')
    
    for (const table of tables || []) {
      const tableName = table.table_name
      
      const { data: columns, error: columnError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = '${tableName}'
          AND table_schema = 'public'
          AND column_name LIKE '%user%'
          ORDER BY column_name;
        `
      })
      
      if (!columnError && columns && Array.isArray(columns) && columns.length > 0) {
        console.log(`\n📋 Table: ${tableName}`)
        columns.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`)
        })
      }
    }
    
    // Check for any triggers that might be causing the issue
    console.log('\n🔍 Checking for triggers that might cause user_id issues...')
    
    const { data: triggers, error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          trigger_name,
          event_object_table,
          action_statement
        FROM information_schema.triggers 
        WHERE event_object_schema = 'public'
        AND action_statement LIKE '%user_id%';
      `
    })
    
    if (!triggerError && triggers && Array.isArray(triggers) && triggers.length > 0) {
      console.log('\n🔧 Problematic triggers found:')
      triggers.forEach(trigger => {
        console.log(`   - ${trigger.trigger_name} on ${trigger.event_object_table}`)
        console.log(`     Action: ${trigger.action_statement}`)
      })
    } else {
      console.log('\n✅ No problematic triggers found')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
findUserIdTables()
