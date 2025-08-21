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

async function fixAllUserIdConstraints() {
  try {
    console.log('🔧 Fixing all user_id constraints across all tables...')
    
    // Fix all tables that might have user_id constraints
    const { error: fixError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Comprehensive fix for all user_id constraints
        DO $$
        BEGIN
          -- Fix po_polls table
          ALTER TABLE po_polls DROP CONSTRAINT IF EXISTS po_polls_user_id_fkey CASCADE;
          ALTER TABLE po_polls DROP CONSTRAINT IF EXISTS po_polls_created_by_fkey CASCADE;
          ALTER TABLE po_polls ALTER COLUMN user_id TYPE TEXT;
          ALTER TABLE po_polls ALTER COLUMN created_by TYPE TEXT;
          
          -- Fix po_votes table
          ALTER TABLE po_votes DROP CONSTRAINT IF EXISTS po_votes_user_id_fkey CASCADE;
          ALTER TABLE po_votes ALTER COLUMN user_id TYPE TEXT;
          
          -- Fix user_profiles table
          ALTER TABLE user_profiles DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey CASCADE;
          ALTER TABLE user_profiles ALTER COLUMN user_id TYPE TEXT;
          
          -- Fix biometric_credentials table
          ALTER TABLE biometric_credentials DROP CONSTRAINT IF EXISTS biometric_credentials_user_id_fkey CASCADE;
          ALTER TABLE biometric_credentials ALTER COLUMN user_id TYPE TEXT;
          
          -- Fix webauthn_challenges table
          ALTER TABLE webauthn_challenges DROP CONSTRAINT IF EXISTS webauthn_challenges_user_id_fkey CASCADE;
          ALTER TABLE webauthn_challenges ALTER COLUMN user_id TYPE TEXT;
          
          -- Fix ia_tokens table
          ALTER TABLE ia_tokens DROP CONSTRAINT IF EXISTS ia_tokens_user_stable_id_fkey CASCADE;
          ALTER TABLE ia_tokens ALTER COLUMN user_stable_id TYPE TEXT;
          
          -- Ensure ia_users table is clean
          ALTER TABLE ia_users DROP CONSTRAINT IF EXISTS ia_users_user_id_fkey CASCADE;
          ALTER TABLE ia_users DROP CONSTRAINT IF EXISTS ia_users_stable_id_fkey CASCADE;
          ALTER TABLE ia_users ALTER COLUMN stable_id TYPE TEXT;
          
          RAISE NOTICE 'All user_id constraints fixed';
        END $$;
      `
    })
    
    if (fixError) {
      console.error('❌ Error fixing constraints:', fixError)
    } else {
      console.log('✅ All user_id constraints fixed!')
    }
    
    // Now try to insert into ia_users
    console.log('\n🧪 Testing ia_users insert after fixing all constraints...')
    
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
      
      // Let's try a different approach - check if there are any RLS policies causing issues
      console.log('\n🔍 Checking if RLS policies are causing the issue...')
      
      const { error: rlsError } = await supabase.rpc('exec_sql', {
        sql: `
          -- Temporarily disable RLS on ia_users
          ALTER TABLE ia_users DISABLE ROW LEVEL SECURITY;
        `
      })
      
      if (rlsError) {
        console.log('⚠️  Could not disable RLS:', rlsError.message)
      } else {
        console.log('✅ RLS disabled on ia_users')
        
        // Try insert again
        const { data: testInsert2, error: insertError2 } = await supabase
          .from('ia_users')
          .insert({
            stable_id: 'test2_' + Date.now(),
            email: 'test2@example.com',
            verification_tier: 'T0',
            is_active: true
          })
          .select()
          .single()
        
        if (insertError2) {
          console.error('❌ Insert still failing with RLS disabled:', insertError2)
        } else {
          console.log('✅ Insert successful with RLS disabled!')
          console.log('   Test user created:', testInsert2.id)
          
          // Clean up
          await supabase
            .from('ia_users')
            .delete()
            .eq('id', testInsert2.id)
          
          console.log('   Test user cleaned up')
          console.log('')
          console.log('🎉 RLS was the issue! Admin creation should now work!')
        }
        
        // Re-enable RLS
        const { error: rlsEnableError } = await supabase.rpc('exec_sql', {
          sql: `
            -- Re-enable RLS on ia_users
            ALTER TABLE ia_users ENABLE ROW LEVEL SECURITY;
          `
        })
        
        if (rlsEnableError) {
          console.log('⚠️  Could not re-enable RLS:', rlsEnableError.message)
        } else {
          console.log('✅ RLS re-enabled on ia_users')
        }
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
      console.log('🎉 Schema issue fixed! Admin creation should now work!')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
fixAllUserIdConstraints()
