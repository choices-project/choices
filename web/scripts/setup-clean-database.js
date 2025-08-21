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

async function setupCleanDatabase() {
  try {
    console.log('🗄️  Setting up clean database schema...')
    
    // Step 1: Drop all existing tables to start fresh
    console.log('🧹 Step 1: Dropping existing tables...')
    
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop all tables in correct order (respecting foreign keys)
        DROP TABLE IF EXISTS webauthn_challenges CASCADE;
        DROP TABLE IF EXISTS biometric_credentials CASCADE;
        DROP TABLE IF EXISTS ia_refresh_tokens CASCADE;
        DROP TABLE IF EXISTS ia_tokens CASCADE;
        DROP TABLE IF EXISTS user_profiles CASCADE;
        DROP TABLE IF EXISTS po_votes CASCADE;
        DROP TABLE IF EXISTS po_polls CASCADE;
        DROP TABLE IF EXISTS ia_users CASCADE;
        
        -- Drop any remaining functions
        DROP FUNCTION IF EXISTS sync_user_profile() CASCADE;
        DROP FUNCTION IF EXISTS create_user_profile() CASCADE;
        DROP FUNCTION IF EXISTS update_user_profile() CASCADE;
        DROP FUNCTION IF EXISTS handle_user_insert() CASCADE;
        DROP FUNCTION IF EXISTS handle_user_update() CASCADE;
        DROP FUNCTION IF EXISTS log_biometric_auth() CASCADE;
      `
    })
    
    if (dropError) {
      console.error('❌ Error dropping tables:', dropError)
      return
    }
    
    console.log('✅ All existing tables dropped')
    
    // Step 2: Create tables with correct schema
    console.log('\n🏗️  Step 2: Creating tables with correct schema...')
    
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create ia_users table (main user table)
        CREATE TABLE ia_users (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          stable_id TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password_hash TEXT,
          verification_tier TEXT DEFAULT 'T0' CHECK (verification_tier IN ('T0', 'T1', 'T2', 'T3')),
          is_active BOOLEAN DEFAULT TRUE,
          two_factor_enabled BOOLEAN DEFAULT FALSE,
          two_factor_secret TEXT,
          last_login_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create user_profiles table
        CREATE TABLE user_profiles (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES ia_users(stable_id) ON DELETE CASCADE,
          display_name TEXT,
          avatar_url TEXT,
          bio TEXT,
          preferences JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create biometric_credentials table
        CREATE TABLE biometric_credentials (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES ia_users(stable_id) ON DELETE CASCADE,
          credential_id TEXT UNIQUE NOT NULL,
          device_type TEXT,
          authenticator_type TEXT,
          sign_count INTEGER DEFAULT 0,
          last_used_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create webauthn_challenges table
        CREATE TABLE webauthn_challenges (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES ia_users(stable_id) ON DELETE CASCADE,
          challenge TEXT NOT NULL,
          challenge_type TEXT NOT NULL CHECK (challenge_type IN ('registration', 'authentication')),
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create ia_tokens table
        CREATE TABLE ia_tokens (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_stable_id TEXT NOT NULL REFERENCES ia_users(stable_id) ON DELETE CASCADE,
          token_type TEXT NOT NULL CHECK (token_type IN ('access', 'refresh', 'reset')),
          token_hash TEXT NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create ia_refresh_tokens table
        CREATE TABLE ia_refresh_tokens (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES ia_users(stable_id) ON DELETE CASCADE,
          token_hash TEXT NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Create po_polls table
        CREATE TABLE po_polls (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          poll_id TEXT UNIQUE NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          options JSONB NOT NULL,
          created_by TEXT NOT NULL REFERENCES ia_users(stable_id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          start_time TIMESTAMP WITH TIME ZONE,
          end_time TIMESTAMP WITH TIME ZONE,
          status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
          sponsors JSONB DEFAULT '[]',
          ia_public_key TEXT,
          total_votes INTEGER DEFAULT 0,
          participation_rate DECIMAL(5,2) DEFAULT 0,
          metadata JSONB DEFAULT '{}',
          tags TEXT[] DEFAULT '{}',
          privacy_level TEXT DEFAULT 'public' CHECK (privacy_level IN ('public', 'private', 'restricted')),
          privacy_metadata JSONB DEFAULT '{}',
          user_id TEXT NOT NULL REFERENCES ia_users(stable_id) ON DELETE CASCADE,
          voting_method TEXT DEFAULT 'single' CHECK (voting_method IN ('single', 'multiple', 'ranked')),
          category TEXT
        );
        
        -- Create po_votes table
        CREATE TABLE po_votes (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          poll_id TEXT NOT NULL REFERENCES po_polls(poll_id) ON DELETE CASCADE,
          user_id TEXT NOT NULL REFERENCES ia_users(stable_id) ON DELETE CASCADE,
          vote_data JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(poll_id, user_id)
        );
      `
    })
    
    if (createError) {
      console.error('❌ Error creating tables:', createError)
      return
    }
    
    console.log('✅ All tables created with correct schema')
    
    // Step 3: Create indexes for performance
    console.log('\n📊 Step 3: Creating indexes...')
    
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Indexes for ia_users
        CREATE INDEX idx_ia_users_email ON ia_users(email);
        CREATE INDEX idx_ia_users_stable_id ON ia_users(stable_id);
        CREATE INDEX idx_ia_users_verification_tier ON ia_users(verification_tier);
        CREATE INDEX idx_ia_users_is_active ON ia_users(is_active);
        
        -- Indexes for biometric_credentials
        CREATE INDEX idx_biometric_credentials_user_id ON biometric_credentials(user_id);
        CREATE INDEX idx_biometric_credentials_credential_id ON biometric_credentials(credential_id);
        
        -- Indexes for webauthn_challenges
        CREATE INDEX idx_webauthn_challenges_user_id ON webauthn_challenges(user_id);
        CREATE INDEX idx_webauthn_challenges_expires_at ON webauthn_challenges(expires_at);
        
        -- Indexes for ia_tokens
        CREATE INDEX idx_ia_tokens_user_stable_id ON ia_tokens(user_stable_id);
        CREATE INDEX idx_ia_tokens_expires_at ON ia_tokens(expires_at);
        
        -- Indexes for ia_refresh_tokens
        CREATE INDEX idx_ia_refresh_tokens_user_id ON ia_refresh_tokens(user_id);
        CREATE INDEX idx_ia_refresh_tokens_expires_at ON ia_refresh_tokens(expires_at);
        
        -- Indexes for po_polls
        CREATE INDEX idx_po_polls_created_by ON po_polls(created_by);
        CREATE INDEX idx_po_polls_status ON po_polls(status);
        CREATE INDEX idx_po_polls_category ON po_polls(category);
        
        -- Indexes for po_votes
        CREATE INDEX idx_po_votes_poll_id ON po_votes(poll_id);
        CREATE INDEX idx_po_votes_user_id ON po_votes(user_id);
      `
    })
    
    if (indexError) {
      console.error('❌ Error creating indexes:', indexError)
    } else {
      console.log('✅ All indexes created')
    }
    
    // Step 4: Test the schema
    console.log('\n🧪 Step 4: Testing schema...')
    
    const { data: testUser, error: testError } = await supabase
      .from('ia_users')
      .insert({
        stable_id: 'test_' + Date.now(),
        email: 'test@example.com',
        verification_tier: 'T0',
        is_active: true
      })
      .select()
      .single()
    
    if (testError) {
      console.error('❌ Schema test failed:', testError)
    } else {
      console.log('✅ Schema test successful!')
      console.log('   Test user created:', testUser.id)
      
      // Clean up test user
      await supabase
        .from('ia_users')
        .delete()
        .eq('id', testUser.id)
      
      console.log('   Test user cleaned up')
    }
    
    console.log('\n🎉 Database setup completed successfully!')
    console.log('')
    console.log('📋 What was created:')
    console.log('   ✅ ia_users - Main user table')
    console.log('   ✅ user_profiles - User profile data')
    console.log('   ✅ biometric_credentials - WebAuthn credentials')
    console.log('   ✅ webauthn_challenges - Authentication challenges')
    console.log('   ✅ ia_tokens - JWT tokens')
    console.log('   ✅ ia_refresh_tokens - Refresh tokens')
    console.log('   ✅ po_polls - Polling system')
    console.log('   ✅ po_votes - Voting system')
    console.log('')
    console.log('🔐 Authentication system is now ready!')
    console.log('🌐 Test at: https://choices-platform.vercel.app/register')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the script
setupCleanDatabase()
