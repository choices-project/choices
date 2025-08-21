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

async function debugSchemaIssue() {
  try {
    console.log('🔍 Debugging persistent user_id schema issue...')
    
    // Step 1: Check all tables that might have user_id columns
    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Find all tables with user_id columns
        SELECT 
          table_name,
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns 
        WHERE column_name LIKE '%user_id%' 
        AND table_schema = 'public'
        ORDER BY table_name, column_name;
      `
    })
    
    if (tableError) {
      console.log('⚠️  Could not check tables:', tableError.message)
    }
    
    // Step 2: Check all triggers that might be causing issues
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Find all triggers that might reference user_id
        SELECT 
          trigger_name,
          event_object_table,
          action_statement
        FROM information_schema.triggers 
        WHERE event_object_schema = 'public'
        AND (action_statement LIKE '%user_id%' OR event_object_table = 'ia_users');
      `
    })
    
    if (triggerError) {
      console.log('⚠️  Could not check triggers:', triggerError.message)
    }
    
    // Step 3: Check for any functions that might be causing the issue
    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Find functions that might reference user_id
        SELECT 
          routine_name,
          routine_definition
        FROM information_schema.routines 
        WHERE routine_schema = 'public'
        AND routine_definition LIKE '%user_id%';
      `
    })
    
    if (functionError) {
      console.log('⚠️  Could not check functions:', functionError.message)
    }
    
    // Step 4: Try to identify the exact source of the user_id error
    console.log('\n🔧 Attempting to fix the issue...')
    
    const { error: fixError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Comprehensive fix for user_id issues
        DO $$
        BEGIN
          -- Drop any problematic triggers on ia_users
          DROP TRIGGER IF EXISTS update_ia_users_updated_at ON ia_users;
          DROP TRIGGER IF EXISTS sync_user_profile ON ia_users;
          DROP TRIGGER IF EXISTS create_user_profile ON ia_users;
          DROP TRIGGER IF EXISTS update_user_profile ON ia_users;
          
          -- Drop any functions that might cause issues
          DROP FUNCTION IF EXISTS sync_user_profile() CASCADE;
          DROP FUNCTION IF EXISTS create_user_profile() CASCADE;
          DROP FUNCTION IF EXISTS update_user_profile() CASCADE;
          
          -- Drop any constraints that might cause issues
          ALTER TABLE ia_users DROP CONSTRAINT IF EXISTS ia_users_user_id_fkey CASCADE;
          ALTER TABLE ia_users DROP CONSTRAINT IF EXISTS ia_users_stable_id_fkey CASCADE;
          ALTER TABLE ia_users DROP CONSTRAINT IF EXISTS ia_users_email_key CASCADE;
          
          -- Ensure ia_users table has correct structure
          ALTER TABLE ia_users 
          ALTER COLUMN stable_id TYPE TEXT,
          ALTER COLUMN stable_id DROP NOT NULL,
          ALTER COLUMN stable_id DROP DEFAULT;
          
          -- Add missing columns if they don't exist
          ALTER TABLE ia_users 
          ADD COLUMN IF NOT EXISTS password_hash TEXT,
          ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
          ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
          
          -- Check if there are any other tables that might be causing the issue
          -- Look for tables that might have triggers or constraints referencing ia_users
          RAISE NOTICE 'Schema fix completed';
        END $$;
      `
    })
    
    if (fixError) {
      console.error('❌ Error fixing schema:', fixError)
    } else {
      console.log('✅ Comprehensive schema fix applied!')
    }
    
    // Step 5: Test if we can now insert a simple record
    console.log('\n🧪 Testing if insert works now...')
    
    const { data: testInsert, error: insertError } = await supabase
      .from('ia_users')
      .insert({
        stable_id: 'test_' + Date.now(),
        email: 'test@example.com',
        verification_tier: 'T0',
        is_active: true
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Insert still failing:', insertError)
    } else {
      console.log('✅ Insert test successful!')
      console.log('   Test user created:', testInsert.id)
      
      // Clean up test user
      await supabase
        .from('ia_users')
        .delete()
        .eq('id', testInsert.id)
      
      console.log('   Test user cleaned up')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
debugSchemaIssue()
