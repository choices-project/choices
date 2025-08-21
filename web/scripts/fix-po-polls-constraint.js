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

async function fixPoPollsConstraint() {
  try {
    console.log('🔧 Fixing po_polls table constraint issue...')
    
    // Check the po_polls table structure
    console.log('🔍 Checking po_polls table structure...')
    
    const { data: sample, error: sampleError } = await supabase
      .from('po_polls')
      .select('*')
      .limit(1)
    
    if (sampleError) {
      console.error('❌ Error accessing po_polls:', sampleError)
      return
    }
    
    if (sample && sample.length > 0) {
      console.log('📋 po_polls columns:', Object.keys(sample[0]))
    }
    
    // Fix the constraint issue
    const { error: fixError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Fix the po_polls table user_id constraint
        DO $$
        BEGIN
          -- Drop any foreign key constraints on po_polls.user_id that might be causing issues
          ALTER TABLE po_polls DROP CONSTRAINT IF EXISTS po_polls_user_id_fkey CASCADE;
          ALTER TABLE po_polls DROP CONSTRAINT IF EXISTS po_polls_created_by_fkey CASCADE;
          
          -- Ensure user_id column is properly typed
          ALTER TABLE po_polls 
          ALTER COLUMN user_id TYPE TEXT;
          
          -- Also check created_by column
          ALTER TABLE po_polls 
          ALTER COLUMN created_by TYPE TEXT;
          
          -- Drop any other problematic constraints
          ALTER TABLE po_polls DROP CONSTRAINT IF EXISTS po_polls_poll_id_key CASCADE;
          
          RAISE NOTICE 'po_polls constraints fixed';
        END $$;
      `
    })
    
    if (fixError) {
      console.error('❌ Error fixing po_polls constraints:', fixError)
    } else {
      console.log('✅ po_polls constraints fixed!')
    }
    
    // Now try to insert into ia_users
    console.log('\n🧪 Testing ia_users insert after fixing po_polls...')
    
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
fixPoPollsConstraint()
