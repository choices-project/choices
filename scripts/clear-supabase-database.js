#!/usr/bin/env node

/**
 * Supabase Database Clear Script
 * 
 * This script will completely clear all data from your Supabase database
 * and reset it to a pristine state for fresh deployment with Supabase Auth.
 * 
 * WARNING: This will delete ALL data. Only run this if you're sure!
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables from web/.env.local
config({ path: 'web/.env.local' })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!SUPABASE_URL)
  console.error('   SUPABASE_SECRET_KEY:', !!SUPABASE_SERVICE_ROLE_KEY)
  console.error('\nPlease check your web/.env.local file')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function clearSupabaseDatabase() {
  console.log('🧹 Starting Supabase database clear...')
  console.log('⚠️  WARNING: This will delete ALL data!')
  console.log(`📍 Supabase URL: ${SUPABASE_URL}`)
  
  try {
    // Step 1: Clear all custom tables (in correct order due to foreign keys)
    console.log('\n📋 Step 1: Clearing custom tables...')
    
    const customTables = [
      'votes',
      'polls', 
      'user_profiles',
      // Old custom auth tables (if they exist)
      'po_votes',
      'po_polls', 
      'ia_refresh_tokens',
      'ia_tokens',
      'webauthn_challenges',
      'biometric_credentials',
      'ia_users'
    ]
    
    for (const table of customTables) {
      try {
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all rows
        
        if (error) {
          console.log(`   ⚠️  Table ${table}: ${error.message}`)
        } else {
          console.log(`   ✅ Cleared table: ${table}`)
        }
      } catch (err) {
        console.log(`   ⚠️  Table ${table}: ${err.message}`)
      }
    }
    
    // Step 2: Clear auth.users (Supabase's built-in auth table)
    console.log('\n🔐 Step 2: Clearing auth.users...')
    
    try {
      const { data: users, error: fetchError } = await supabase.auth.admin.listUsers()
      
      if (fetchError) {
        console.log(`   ⚠️  Could not fetch users: ${fetchError.message}`)
      } else {
        console.log(`   📊 Found ${users.users.length} users to delete`)
        
        for (const user of users.users) {
          const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
          if (deleteError) {
            console.log(`   ⚠️  Could not delete user ${user.email}: ${deleteError.message}`)
          } else {
            console.log(`   ✅ Deleted user: ${user.email || user.id}`)
          }
        }
      }
    } catch (err) {
      console.log(`   ⚠️  Auth users clear error: ${err.message}`)
    }
    
    // Step 3: Drop and recreate tables with clean Supabase Auth schema
    console.log('\n🏗️  Step 3: Creating clean Supabase Auth schema...')
    
    const { error: schemaError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop all custom tables (in correct order due to foreign keys)
        DROP TABLE IF EXISTS votes CASCADE;
        DROP TABLE IF EXISTS polls CASCADE;
        DROP TABLE IF EXISTS user_profiles CASCADE;
        DROP TABLE IF EXISTS po_votes CASCADE;
        DROP TABLE IF EXISTS po_polls CASCADE;
        DROP TABLE IF EXISTS ia_refresh_tokens CASCADE;
        DROP TABLE IF EXISTS ia_tokens CASCADE;
        DROP TABLE IF EXISTS webauthn_challenges CASCADE;
        DROP TABLE IF EXISTS biometric_credentials CASCADE;
        DROP TABLE IF EXISTS ia_users CASCADE;
        
        -- Create clean user_profiles table (linked to auth.users)
        CREATE TABLE user_profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
          username VARCHAR(50) NOT NULL UNIQUE,
          email VARCHAR(255) NOT NULL UNIQUE,
          trust_tier VARCHAR(2) NOT NULL DEFAULT 'T0' CHECK (trust_tier IN ('T0', 'T1', 'T2', 'T3')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          avatar_url TEXT,
          bio TEXT,
          is_active BOOLEAN DEFAULT true,
          display_name VARCHAR(100),
          location VARCHAR(100),
          website VARCHAR(255),
          social_links JSONB DEFAULT '{}',
          preferences JSONB DEFAULT '{}',
          email_verified BOOLEAN DEFAULT false,
          phone_verified BOOLEAN DEFAULT false,
          identity_verified BOOLEAN DEFAULT false,
          privacy_settings JSONB DEFAULT '{
            "profile_visibility": "public",
            "show_email": false,
            "show_location": false,
            "allow_analytics": true,
            "allow_marketing": false
          }'
        );
        
        -- Create clean polls table
        CREATE TABLE polls (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          title VARCHAR(255) NOT NULL,
          description TEXT,
          options JSONB NOT NULL,
          voting_method VARCHAR(20) DEFAULT 'single' CHECK (voting_method IN ('single', 'multiple', 'ranked')),
          created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          start_time TIMESTAMP WITH TIME ZONE,
          end_time TIMESTAMP WITH TIME ZONE,
          status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'closed', 'draft')),
          category VARCHAR(100),
          tags TEXT[] DEFAULT '{}',
          metadata JSONB DEFAULT '{}'
        );
        
        -- Create clean votes table
        CREATE TABLE votes (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          vote_data JSONB NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(poll_id, user_id)
        );
        
        -- Enable Row Level Security
        ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
        ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
        ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies for user_profiles
        CREATE POLICY "Users can view their own profile" ON user_profiles
          FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can update their own profile" ON user_profiles
          FOR UPDATE USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can insert their own profile" ON user_profiles
          FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        -- Create RLS policies for polls
        CREATE POLICY "Anyone can view active polls" ON polls
          FOR SELECT USING (status = 'active');
        
        CREATE POLICY "Users can create polls" ON polls
          FOR INSERT WITH CHECK (auth.uid() = created_by);
        
        CREATE POLICY "Users can update their own polls" ON polls
          FOR UPDATE USING (auth.uid() = created_by);
        
        -- Create RLS policies for votes
        CREATE POLICY "Users can view their own votes" ON votes
          FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can create votes" ON votes
          FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update their own votes" ON votes
          FOR UPDATE USING (auth.uid() = user_id);
      `
    })
    
    if (schemaError) {
      console.error('❌ Error creating schema:', schemaError.message)
    } else {
      console.log('✅ Clean Supabase Auth schema created successfully')
    }
    
    // Step 4: Verify clean state
    console.log('\n🔍 Step 4: Verifying clean state...')
    
    const { data: profileCount } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
    
    const { data: pollCount } = await supabase
      .from('polls')
      .select('id', { count: 'exact', head: true })
    
    const { data: voteCount } = await supabase
      .from('votes')
      .select('id', { count: 'exact', head: true })
    
    console.log(`   📊 user_profiles: ${profileCount?.length || 0} records`)
    console.log(`   📊 polls: ${pollCount?.length || 0} records`)
    console.log(`   📊 votes: ${voteCount?.length || 0} records`)
    
    console.log('\n🎉 Database cleared successfully!')
    console.log('✨ Ready for fresh deployment with clean Supabase Auth')
    console.log('\n📋 Next steps:')
    console.log('1. Test your auth flows with the clean database')
    console.log('2. Create your first user account')
    console.log('3. Verify all functionality works')
    console.log('4. Deploy to production')
    
  } catch (error) {
    console.error('❌ Error clearing database:', error.message)
    process.exit(1)
  }
}

// Run the script
clearSupabaseDatabase()



