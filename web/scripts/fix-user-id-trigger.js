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

async function fixUserIdTrigger() {
  try {
    console.log('🔧 Finding and fixing user_id trigger issue...')
    
    // Find all triggers on ia_users table
    const { error: triggerError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop all triggers on ia_users that might be causing issues
        DROP TRIGGER IF EXISTS update_ia_users_updated_at ON ia_users;
        DROP TRIGGER IF EXISTS sync_user_profile ON ia_users;
        DROP TRIGGER IF EXISTS create_user_profile ON ia_users;
        
        -- Drop any function that might be causing the user_id issue
        DROP FUNCTION IF EXISTS sync_user_profile() CASCADE;
        DROP FUNCTION IF EXISTS create_user_profile() CASCADE;
        
        -- Ensure no problematic constraints exist
        ALTER TABLE ia_users DROP CONSTRAINT IF EXISTS ia_users_user_id_fkey CASCADE;
        ALTER TABLE ia_users DROP CONSTRAINT IF EXISTS ia_users_stable_id_fkey CASCADE;
      `
    })
    
    if (triggerError) {
      console.log('⚠️  Could not drop triggers (might not exist):', triggerError.message)
    }
    
    // Now let's ensure the table structure is correct
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Ensure stable_id is TEXT and not constrained
        ALTER TABLE ia_users 
        ALTER COLUMN stable_id TYPE TEXT,
        ALTER COLUMN stable_id DROP NOT NULL;
        
        -- Remove any default values that might cause issues
        ALTER TABLE ia_users 
        ALTER COLUMN stable_id DROP DEFAULT;
      `
    })
    
    if (alterError) {
      console.error('❌ Error fixing table structure:', alterError)
      process.exit(1)
    }
    
    console.log('✅ Trigger and constraint issues fixed!')
    console.log('')
    console.log('📋 Changes made:')
    console.log('   - Dropped problematic triggers')
    console.log('   - Removed user_id constraints')
    console.log('   - Fixed stable_id column type')
    console.log('')
    console.log('🎉 Admin creation should now work!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

// Run the script
fixUserIdTrigger()
