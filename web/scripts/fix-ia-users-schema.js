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

async function fixIaUsersSchema() {
  try {
    console.log('🔧 Fixing ia_users table schema...')
    
    // Add missing columns to ia_users table
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Add missing columns to ia_users table
        ALTER TABLE ia_users 
        ADD COLUMN IF NOT EXISTS password_hash TEXT,
        ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
        ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
        
        -- Create index on password_hash for performance
        CREATE INDEX IF NOT EXISTS idx_ia_users_password_hash ON ia_users(password_hash);
        
        -- Create index on email for performance
        CREATE INDEX IF NOT EXISTS idx_ia_users_email ON ia_users(email);
        
        -- Create index on stable_id for performance
        CREATE INDEX IF NOT EXISTS idx_ia_users_stable_id ON ia_users(stable_id);
      `
    })
    
    if (alterError) {
      console.error('❌ Error fixing schema:', alterError)
      process.exit(1)
    }
    
    console.log('✅ ia_users table schema fixed successfully!')
    console.log('')
    console.log('📋 Added columns:')
    console.log('   - password_hash (TEXT)')
    console.log('   - two_factor_enabled (BOOLEAN)')
    console.log('   - two_factor_secret (TEXT)')
    console.log('   - last_login_at (TIMESTAMP)')
    console.log('')
    console.log('📋 Added indexes:')
    console.log('   - idx_ia_users_password_hash')
    console.log('   - idx_ia_users_email')
    console.log('   - idx_ia_users_stable_id')
    console.log('')
    console.log('🎉 Authentication system should now work properly!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
    process.exit(1)
  }
}

// Run the script
fixIaUsersSchema()
