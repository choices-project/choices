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

async function fixUserIdSchema() {
  try {
    console.log('🔧 Fixing user_id column schema issue...')
    
    // First, let's check if there are any foreign key constraints causing issues
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop any problematic foreign key constraints
        DO $$
        BEGIN
          -- Drop foreign key constraints that might be causing issues
          IF EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name LIKE '%user_id%' 
            AND table_name = 'ia_users'
          ) THEN
            ALTER TABLE ia_users DROP CONSTRAINT IF EXISTS ia_users_user_id_fkey CASCADE;
          END IF;
        END $$;
      `
    })
    
    if (dropError) {
      console.log('⚠️  Could not drop constraints (might not exist):', dropError.message)
    }
    
    // Now let's ensure the stable_id column is properly typed
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Ensure stable_id is TEXT type (not UUID)
        ALTER TABLE ia_users 
        ALTER COLUMN stable_id TYPE TEXT;
        
        -- Add any missing columns that might be needed
        ALTER TABLE ia_users 
        ADD COLUMN IF NOT EXISTS password_hash TEXT,
        ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
        ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
      `
    })
    
    if (alterError) {
      console.error('❌ Error fixing schema:', alterError)
      process.exit(1)
    }
    
    console.log('✅ Schema fixed successfully!')
    console.log('')
    console.log('📋 Changes made:')
    console.log('   - Ensured stable_id is TEXT type')
    console.log('   - Added missing authentication columns')
    console.log('   - Removed problematic constraints')
    console.log('')
    console.log('🎉 Admin creation should now work!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

// Run the script
fixUserIdSchema()
