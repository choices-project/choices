#!/usr/bin/env tsx

/**
 * E2E Test Data Seeding Script
 * 
 * Creates test users and profiles in the database for E2E testing.
 * This script runs during global setup to ensure test data is available.
 * 
 * Created: January 27, 2025
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function seedTestUsers() {
  console.log('🌱 Seeding test users...');
  
  const testUsers = [
    {
      email: 'api-test@example.com',
      password: 'TestPassword123!',
      username: 'apitestuser',
      display_name: 'API Test User'
    },
    {
      email: 'test@example.com',
      password: 'TestPassword123!',
      username: 'testuser',
      display_name: 'Test User'
    },
    {
      email: 'admin@example.com',
      password: 'AdminPassword123!',
      username: 'admin',
      display_name: 'Admin User'
    }
  ];

  for (const userData of testUsers) {
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          console.log(`✅ User ${userData.email} already exists`);
          continue;
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error('No user created');
      }

      // Create user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: authData.user.id,
          username: userData.username,
          email: userData.email,
          bio: `Test user for E2E testing`,
          is_active: true,
          trust_tier: 'T0'
        });

      if (profileError) {
        console.error(`❌ Failed to create profile for ${userData.email}:`, profileError);
        // Continue with other users
        continue;
      }

      console.log(`✅ Created user: ${userData.email} (${authData.user.id})`);
    } catch (error) {
      console.error(`❌ Failed to create user ${userData.email}:`, error);
      // Continue with other users
    }
  }
}

async function seedTestPolls() {
  console.log('🗳️ Seeding test polls...');
  
  // Get a test user to create polls
  const { data: users } = await supabase
    .from('user_profiles')
    .select('user_id')
    .limit(1);

  if (!users || users.length === 0) {
    console.log('⚠️ No users found, skipping poll creation');
    return;
  }

  const userId = users[0].user_id;

  const testPolls = [
    {
      title: 'V2 API Test Poll',
      description: 'Test poll for API endpoints',
      options: ['Option 1', 'Option 2', 'Option 3'],
      category: 'general',
      voting_method: 'single',
      privacy_level: 'public',
      created_by: userId
    },
    {
      title: 'Test Poll for E2E',
      description: 'Another test poll',
      options: ['Yes', 'No', 'Maybe'],
      category: 'politics',
      voting_method: 'single',
      privacy_level: 'public',
      created_by: userId
    }
  ];

  for (const pollData of testPolls) {
    try {
      const { data, error } = await supabase
        .from('polls')
        .insert(pollData)
        .select()
        .single();

      if (error) {
        console.error(`❌ Failed to create poll "${pollData.title}":`, error);
        continue;
      }

      console.log(`✅ Created poll: ${pollData.title} (${data.id})`);
    } catch (error) {
      console.error(`❌ Failed to create poll "${pollData.title}":`, error);
    }
  }
}

async function main() {
  try {
    console.log('🚀 Starting E2E test data seeding...');
    
    await seedTestUsers();
    await seedTestPolls();
    
    console.log('🎉 E2E test data seeding completed!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

main();
