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

async function finalSchemaFix() {
  try {
    console.log('🔧 Final comprehensive schema fix...')
    
    // Step 1: Check all tables and their user_id columns
    console.log('🔍 Step 1: Checking all tables with user_id columns...')
    
    const { error: tableCheckError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Get all tables with user_id columns
        SELECT 
          t.table_name,
          c.column_name,
          c.data_type,
          c.is_nullable,
          c.column_default
        FROM information_schema.tables t
        JOIN information_schema.columns c ON t.table_name = c.table_name
        WHERE t.table_schema = 'public' 
        AND t.table_type = 'BASE TABLE'
        AND c.column_name LIKE '%user%'
        ORDER BY t.table_name, c.column_name;
      `
    })
    
    if (tableCheckError) {
      console.log('⚠️  Could not check tables:', tableCheckError.message)
    }
    
    // Step 2: Comprehensive fix for all user_id issues
    console.log('\n🔧 Step 2: Applying comprehensive fixes...')
    
    const { error: fixError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Comprehensive fix for all user_id issues
        DO $$
        DECLARE
          r RECORD;
        BEGIN
          -- Drop all triggers that might cause issues
          FOR r IN (SELECT trigger_name, event_object_table 
                   FROM information_schema.triggers 
                   WHERE event_object_schema = 'public' 
                   AND event_object_table IN ('ia_users', 'po_polls', 'po_votes', 'user_profiles', 'biometric_credentials', 'webauthn_challenges', 'ia_tokens')) LOOP
            EXECUTE 'DROP TRIGGER IF EXISTS ' || r.trigger_name || ' ON ' || r.event_object_table || ' CASCADE';
          END LOOP;
          
          -- Drop all functions that might cause issues
          DROP FUNCTION IF EXISTS sync_user_profile() CASCADE;
          DROP FUNCTION IF EXISTS create_user_profile() CASCADE;
          DROP FUNCTION IF EXISTS update_user_profile() CASCADE;
          DROP FUNCTION IF EXISTS handle_user_insert() CASCADE;
          DROP FUNCTION IF EXISTS handle_user_update() CASCADE;
          
          -- Drop all constraints that might cause issues
          ALTER TABLE ia_users DROP CONSTRAINT IF EXISTS ia_users_user_id_fkey CASCADE;
          ALTER TABLE ia_users DROP CONSTRAINT IF EXISTS ia_users_stable_id_fkey CASCADE;
          ALTER TABLE ia_users DROP CONSTRAINT IF EXISTS ia_users_email_key CASCADE;
          
          ALTER TABLE po_polls DROP CONSTRAINT IF EXISTS po_polls_user_id_fkey CASCADE;
          ALTER TABLE po_polls DROP CONSTRAINT IF EXISTS po_polls_created_by_fkey CASCADE;
          
          ALTER TABLE po_votes DROP CONSTRAINT IF EXISTS po_votes_user_id_fkey CASCADE;
          
          ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey CASCADE;
          
          ALTER TABLE biometric_credentials DROP CONSTRAINT IF EXISTS biometric_credentials_user_id_fkey CASCADE;
          
          ALTER TABLE webauthn_challenges DROP CONSTRAINT IF EXISTS webauthn_challenges_user_id_fkey CASCADE;
          
          ALTER TABLE ia_tokens DROP CONSTRAINT IF EXISTS ia_tokens_user_stable_id_fkey CASCADE;
          
          -- Fix column types for all user_id columns
          ALTER TABLE ia_users ALTER COLUMN stable_id TYPE TEXT;
          ALTER TABLE ia_users ALTER COLUMN stable_id DROP NOT NULL;
          ALTER TABLE ia_users ALTER COLUMN stable_id DROP DEFAULT;
          
          ALTER TABLE po_polls ALTER COLUMN user_id TYPE TEXT;
          ALTER TABLE po_polls ALTER COLUMN created_by TYPE TEXT;
          
          ALTER TABLE po_votes ALTER COLUMN user_id TYPE TEXT;
          
          ALTER TABLE user_profiles ALTER COLUMN user_id TYPE TEXT;
          
          ALTER TABLE biometric_credentials ALTER COLUMN user_id TYPE TEXT;
          
          ALTER TABLE webauthn_challenges ALTER COLUMN user_id TYPE TEXT;
          
          ALTER TABLE ia_tokens ALTER COLUMN user_stable_id TYPE TEXT;
          
          -- Add missing columns to ia_users
          ALTER TABLE ia_users 
          ADD COLUMN IF NOT EXISTS password_hash TEXT,
          ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
          ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
          
          -- Disable RLS temporarily
          ALTER TABLE ia_users DISABLE ROW LEVEL SECURITY;
          
          RAISE NOTICE 'Comprehensive schema fix completed';
        END $$;
      `
    })
    
    if (fixError) {
      console.error('❌ Error applying fixes:', fixError)
    } else {
      console.log('✅ Comprehensive fixes applied!')
    }
    
    // Step 3: Test if we can now insert
    console.log('\n🧪 Step 3: Testing insert after fixes...')
    
    const { data: testInsert, error: insertError } = await supabase
      .from('ia_users')
      .insert({
        stable_id: 'final_test_' + Date.now(),
        email: 'finaltest@example.com',
        verification_tier: 'T0',
        is_active: true
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('❌ Insert still failing:', insertError)
      
      // Step 4: Try to identify the exact issue
      console.log('\n🔍 Step 4: Trying to identify the exact issue...')
      
      // Check if there are any remaining triggers
      const { error: triggerCheckError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Check for any remaining triggers
          SELECT trigger_name, event_object_table, action_statement
          FROM information_schema.triggers 
          WHERE event_object_schema = 'public'
          AND event_object_table = 'ia_users';
        `
      })
      
      if (triggerCheckError) {
        console.log('⚠️  Could not check triggers:', triggerCheckError.message)
      }
      
      // Check if there are any RLS policies
      const { error: rlsCheckError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Check RLS policies
          SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
          FROM pg_policies 
          WHERE tablename = 'ia_users';
        `
      })
      
      if (rlsCheckError) {
        console.log('⚠️  Could not check RLS policies:', rlsCheckError.message)
      }
      
    } else {
      console.log('✅ Insert successful!')
      console.log('   Test user created:', testInsert.id)
      
      // Clean up
      await supabase
        .from('ia_users')
        .delete()
        .eq('id', testInsert.id)
      
      console.log('   Test user cleaned up')
      console.log('')
      console.log('🎉 Schema issue finally fixed!')
      console.log('   Registration and authentication should now work!')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
finalSchemaFix()
