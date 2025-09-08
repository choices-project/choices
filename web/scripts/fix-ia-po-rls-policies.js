/**
 * Fix IA/PO RLS Policies
 * Updates RLS policies to work with the IA/PO system using stable_id
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixRLSPolicies() {
  console.log('🔧 Fixing IA/PO RLS Policies...')
  
  try {
    // Step 1: Drop existing policies
    console.log('\n🗑️  Step 1: Dropping existing policies...')
    
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing ia_users policies
        DROP POLICY IF EXISTS "Users can view own data" ON ia_users;
        DROP POLICY IF EXISTS "Users can update own data" ON ia_users;
        DROP POLICY IF EXISTS "Users can insert own data" ON ia_users;
        DROP POLICY IF EXISTS "Service role full access" ON ia_users;
        
        -- Drop existing user_profiles policies
        DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
        DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
        DROP POLICY IF EXISTS "Service role full access" ON user_profiles;
      `
    })
    
    if (dropError) {
      console.error('❌ Error dropping policies:', dropError)
    } else {
      console.log('✅ Existing policies dropped')
    }
    
    // Step 2: Create correct ia_users policies
    console.log('\n👤 Step 2: Creating correct ia_users policies...')
    
    const { error: usersPolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Enable RLS on ia_users
        ALTER TABLE ia_users ENABLE ROW LEVEL SECURITY;
        
        -- Allow service role full access (for API registration)
        CREATE POLICY "Service role full access" ON ia_users
          FOR ALL USING (auth.role() = 'service_role');
        
        -- Allow users to view their own data by stable_id
        CREATE POLICY "Users can view own data" ON ia_users
          FOR SELECT USING (stable_id = auth.jwt() ->> 'stable_id');
        
        -- Allow users to update their own data by stable_id
        CREATE POLICY "Users can update own data" ON ia_users
          FOR UPDATE USING (stable_id = auth.jwt() ->> 'stable_id');
        
        -- Allow public registration (no auth required for INSERT)
        CREATE POLICY "Allow public registration" ON ia_users
          FOR INSERT WITH CHECK (true);
      `
    })
    
    if (usersPolicyError) {
      console.error('❌ Error creating ia_users policies:', usersPolicyError)
    } else {
      console.log('✅ ia_users RLS policies created')
    }
    
    // Step 3: Create correct user_profiles policies
    console.log('\n👤 Step 3: Creating correct user_profiles policies...')
    
    const { error: profilesPolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Enable RLS on user_profiles
        ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
        
        -- Allow service role full access
        CREATE POLICY "Service role full access" ON user_profiles
          FOR ALL USING (auth.role() = 'service_role');
        
        -- Allow users to view their own profile by user_id (stable_id)
        CREATE POLICY "Users can view own profile" ON user_profiles
          FOR SELECT USING (user_id = auth.jwt() ->> 'stable_id');
        
        -- Allow users to update their own profile
        CREATE POLICY "Users can update own profile" ON user_profiles
          FOR UPDATE USING (user_id = auth.jwt() ->> 'stable_id');
        
        -- Allow public profile creation (no auth required for INSERT)
        CREATE POLICY "Allow public profile creation" ON user_profiles
          FOR INSERT WITH CHECK (true);
      `
    })
    
    if (profilesPolicyError) {
      console.error('❌ Error creating user_profiles policies:', profilesPolicyError)
    } else {
      console.log('✅ user_profiles RLS policies created')
    }
    
    console.log('\n✅ IA/PO RLS policies fixed successfully!')
    
  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error)
    process.exit(1)
  }
}

fixRLSPolicies()










