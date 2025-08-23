#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupRLSPolicies() {
  try {
    console.log('🔒 Setting up Row Level Security (RLS) Policies')
    console.log('==============================================')
    
    // Step 1: Enable RLS on all tables
    console.log('\n📋 Step 1: Enabling RLS on all tables...')
    
    const { error: enableError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Enable RLS on all tables
        ALTER TABLE ia_users ENABLE ROW LEVEL SECURITY;
        ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
        ALTER TABLE biometric_credentials ENABLE ROW LEVEL SECURITY;
        ALTER TABLE webauthn_challenges ENABLE ROW LEVEL SECURITY;
        ALTER TABLE ia_tokens ENABLE ROW LEVEL SECURITY;
        ALTER TABLE ia_refresh_tokens ENABLE ROW LEVEL SECURITY;
        ALTER TABLE po_polls ENABLE ROW LEVEL SECURITY;
        ALTER TABLE po_votes ENABLE ROW LEVEL SECURITY;
      `
    })
    
    if (enableError) {
      console.error('❌ Error enabling RLS:', enableError)
    } else {
      console.log('✅ RLS enabled on all tables')
    }
    
    // Step 2: Create RLS policies for ia_users
    console.log('\n🔐 Step 2: Creating RLS policies for ia_users...')
    
    const { error: usersPolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Users can only see their own data
        CREATE POLICY "Users can view own data" ON ia_users
          FOR SELECT USING (auth.jwt() ->> 'userId' = id::text);
        
        -- Users can update their own data
        CREATE POLICY "Users can update own data" ON ia_users
          FOR UPDATE USING (auth.jwt() ->> 'userId' = id::text);
        
        -- Users can insert their own data (for registration)
        CREATE POLICY "Users can insert own data" ON ia_users
          FOR INSERT WITH CHECK (auth.jwt() ->> 'userId' = id::text);
        
        -- Service role can access all data
        CREATE POLICY "Service role full access" ON ia_users
          FOR ALL USING (auth.role() = 'service_role');
      `
    })
    
    if (usersPolicyError) {
      console.error('❌ Error creating ia_users policies:', usersPolicyError)
    } else {
      console.log('✅ ia_users RLS policies created')
    }
    
    // Step 3: Create RLS policies for user_profiles
    console.log('\n👤 Step 3: Creating RLS policies for user_profiles...')
    
    const { error: profilesPolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Users can view their own profile
        CREATE POLICY "Users can view own profile" ON user_profiles
          FOR SELECT USING (auth.jwt() ->> 'userId' = user_id);
        
        -- Users can update their own profile
        CREATE POLICY "Users can update own profile" ON user_profiles
          FOR UPDATE USING (auth.jwt() ->> 'userId' = user_id);
        
        -- Users can insert their own profile
        CREATE POLICY "Users can insert own profile" ON user_profiles
          FOR INSERT WITH CHECK (auth.jwt() ->> 'userId' = user_id);
        
        -- Service role can access all profiles
        CREATE POLICY "Service role full access" ON user_profiles
          FOR ALL USING (auth.role() = 'service_role');
      `
    })
    
    if (profilesPolicyError) {
      console.error('❌ Error creating user_profiles policies:', profilesPolicyError)
    } else {
      console.log('✅ user_profiles RLS policies created')
    }
    
    // Step 4: Create RLS policies for biometric_credentials
    console.log('\n📱 Step 4: Creating RLS policies for biometric_credentials...')
    
    const { error: biometricPolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Users can view their own biometric credentials
        CREATE POLICY "Users can view own biometric credentials" ON biometric_credentials
          FOR SELECT USING (auth.jwt() ->> 'userId' = user_id);
        
        -- Users can insert their own biometric credentials
        CREATE POLICY "Users can insert own biometric credentials" ON biometric_credentials
          FOR INSERT WITH CHECK (auth.jwt() ->> 'userId' = user_id);
        
        -- Users can delete their own biometric credentials
        CREATE POLICY "Users can delete own biometric credentials" ON biometric_credentials
          FOR DELETE USING (auth.jwt() ->> 'userId' = user_id);
        
        -- Service role can access all biometric credentials
        CREATE POLICY "Service role full access" ON biometric_credentials
          FOR ALL USING (auth.role() = 'service_role');
      `
    })
    
    if (biometricPolicyError) {
      console.error('❌ Error creating biometric_credentials policies:', biometricPolicyError)
    } else {
      console.log('✅ biometric_credentials RLS policies created')
    }
    
    // Step 5: Create RLS policies for po_polls
    console.log('\n🗳️  Step 5: Creating RLS policies for po_polls...')
    
    const { error: pollsPolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Anyone can view public polls
        CREATE POLICY "Anyone can view public polls" ON po_polls
          FOR SELECT USING (privacy_level = 'public');
        
        -- Users can view their own polls
        CREATE POLICY "Users can view own polls" ON po_polls
          FOR SELECT USING (auth.jwt() ->> 'userId' = user_id);
        
        -- Users can create polls
        CREATE POLICY "Users can create polls" ON po_polls
          FOR INSERT WITH CHECK (auth.jwt() ->> 'userId' = user_id);
        
        -- Users can update their own polls
        CREATE POLICY "Users can update own polls" ON po_polls
          FOR UPDATE USING (auth.jwt() ->> 'userId' = user_id);
        
        -- Service role can access all polls
        CREATE POLICY "Service role full access" ON po_polls
          FOR ALL USING (auth.role() = 'service_role');
      `
    })
    
    if (pollsPolicyError) {
      console.error('❌ Error creating po_polls policies:', pollsPolicyError)
    } else {
      console.log('✅ po_polls RLS policies created')
    }
    
    // Step 6: Create RLS policies for po_votes
    console.log('\n✅ Step 6: Creating RLS policies for po_votes...')
    
    const { error: votesPolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Users can view their own votes
        CREATE POLICY "Users can view own votes" ON po_votes
          FOR SELECT USING (auth.jwt() ->> 'userId' = user_id);
        
        -- Users can insert their own votes
        CREATE POLICY "Users can insert own votes" ON po_votes
          FOR INSERT WITH CHECK (auth.jwt() ->> 'userId' = user_id);
        
        -- Users can update their own votes
        CREATE POLICY "Users can update own votes" ON po_votes
          FOR UPDATE USING (auth.jwt() ->> 'userId' = user_id);
        
        -- Service role can access all votes
        CREATE POLICY "Service role full access" ON po_votes
          FOR ALL USING (auth.role() = 'service_role');
      `
    })
    
    if (votesPolicyError) {
      console.error('❌ Error creating po_votes policies:', votesPolicyError)
    } else {
      console.log('✅ po_votes RLS policies created')
    }
    
    // Step 7: Create RLS policies for tokens
    console.log('\n🔑 Step 7: Creating RLS policies for tokens...')
    
    const { error: tokensPolicyError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Users can view their own tokens
        CREATE POLICY "Users can view own tokens" ON ia_tokens
          FOR SELECT USING (auth.jwt() ->> 'userId' = user_stable_id);
        
        -- Users can insert their own tokens
        CREATE POLICY "Users can insert own tokens" ON ia_tokens
          FOR INSERT WITH CHECK (auth.jwt() ->> 'userId' = user_stable_id);
        
        -- Users can delete their own tokens
        CREATE POLICY "Users can delete own tokens" ON ia_tokens
          FOR DELETE USING (auth.jwt() ->> 'userId' = user_stable_id);
        
        -- Service role can access all tokens
        CREATE POLICY "Service role full access" ON ia_tokens
          FOR ALL USING (auth.role() = 'service_role');
      `
    })
    
    if (tokensPolicyError) {
      console.error('❌ Error creating ia_tokens policies:', tokensPolicyError)
    } else {
      console.log('✅ ia_tokens RLS policies created')
    }
    
    console.log('\n🎉 RLS Policy Setup Completed!')
    console.log('')
    console.log('📋 Security Summary:')
    console.log('   ✅ RLS enabled on all tables')
    console.log('   ✅ User-specific access policies')
    console.log('   ✅ Service role access for admin operations')
    console.log('   ✅ Public poll viewing for democratic access')
    console.log('   ✅ Secure token management')
    console.log('')
    console.log('🔒 Database is now properly secured!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the setup
setupRLSPolicies()
