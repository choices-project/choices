#!/usr/bin/env node

/**
 * Test User Setup Script
 * 
 * Creates test users for E2E testing after database reset.
 * This script is essential for setting up the testing environment
 * after database schema changes.
 * 
 * @fileoverview Test user creation for E2E testing
 * @author Choices Platform Team
 * @created 2025-10-24
 * @status ACTIVE
 * @version 1.0.0
 * 
 * @requires @supabase/supabase-js
 * @requires dotenv
 * 
 * @example
 * // Run from project root
 * node scripts/setup-test-users.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'web/.env.local' });

// Environment variables for Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate required environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Creates test users for E2E testing
 * 
 * Creates both a regular test user and an admin test user with
 * appropriate user profiles in the database.
 * 
 * @async
 * @function createTestUsers
 * @returns {Promise<void>} Resolves when users are created
 * @throws {Error} If user creation fails
 * 
 * @example
 * await createTestUsers();
 */
async function createTestUsers() {
  console.log('👤 Creating test users...');
  
  try {
    // Create regular test user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'test@example.com',
      password: 'testpassword123',
      email_confirm: true,
      user_metadata: {
        name: 'Test User',
        is_admin: false
      }
    });

    if (userError) {
      console.error('❌ Error creating test user:', userError);
      return;
    }

    console.log('✅ Test user created:', userData.user.email);

    // Create admin test user
    const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
      email: 'admin@example.com',
      password: 'adminpassword123',
      email_confirm: true,
      user_metadata: {
        name: 'Admin User',
        is_admin: true
      }
    });

    if (adminError) {
      console.error('❌ Error creating admin user:', adminError);
      return;
    }

    console.log('✅ Admin user created:', adminData.user.email);

    // Create user profiles
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert([
        {
          id: userData.user.id,
          email: 'test@example.com',
          name: 'Test User',
          interests: ['politics', 'environment'],
          created_at: new Date().toISOString()
        },
        {
          id: adminData.user.id,
          email: 'admin@example.com',
          name: 'Admin User',
          interests: ['administration'],
          created_at: new Date().toISOString()
        }
      ]);

    if (profileError) {
      console.error('❌ Error creating user profiles:', profileError);
      return;
    }

    console.log('✅ User profiles created');

    console.log('\n🎯 Test Users Ready:');
    console.log('Regular User: test@example.com / testpassword123');
    console.log('Admin User: admin@example.com / adminpassword123');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

createTestUsers();
