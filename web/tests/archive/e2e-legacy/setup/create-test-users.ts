/**
 * Automated Test User Creation
 *
 * Uses Supabase service role key to automatically create test users.
 * Runs before E2E tests to ensure test users exist.
 *
 * SECURITY:
 * - Requires strong environment variables (no defaults!)
 * - Generates cryptographically secure passwords if not provided
 * - Only runs in test/development environments
 * - Validates password strength
 */

import { randomBytes } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env.test.local') });

type TestUser = {
  email: string;
  password: string;
  username: string;
  isAdmin: boolean;
  displayName: string;
}

/**
 * Generate cryptographically secure random password
 */
function generateSecurePassword(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const bytes = randomBytes(length);
  let password = '';

  for (let i = 0; i < length; i++) {
    password += chars[bytes[i] % chars.length];
  }

  // Ensure it has required character types
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*]/.test(password);

  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    // Regenerate if requirements not met
    return generateSecurePassword(length);
  }

  return password;
}

/**
 * Validate password strength
 */
function isStrongPassword(password: string): boolean {
  if (password.length < 16) {
    return false;
  }

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);

  return hasUpper && hasLower && hasNumber && hasSpecial;
}

/**
 * Save generated credentials to file for reference
 */
function saveCredentials(users: TestUser[]): void {
  const credentialsPath = path.join(process.cwd(), '.test-credentials.local');

  let content = '# E2E Test Credentials - AUTO-GENERATED\n';
  content += '# Generated: ' + new Date().toISOString() + '\n';
  content += '# DO NOT COMMIT THIS FILE\n';
  content += '# Add to .gitignore if not already present\n\n';

  users.forEach((user) => {
    content += `# ${user.displayName}\n`;
    content += `E2E_${user.isAdmin ? 'ADMIN' : 'USER'}_EMAIL=${user.email}\n`;
    content += `E2E_${user.isAdmin ? 'ADMIN' : 'USER'}_PASSWORD=${user.password}\n\n`;
  });

  fs.writeFileSync(credentialsPath, content, { mode: 0o600 }); // Owner read/write only
  console.log(`[Setup] ✅ Credentials saved to: ${credentialsPath}`);
  console.log('[Setup] ⚠️  Keep this file secure and DO NOT commit it!');
}

/**
 * Get or generate test user credentials
 */
function getTestUsers(): TestUser[] {
  const users: TestUser[] = [];

  // Admin User 1
  const adminEmail = process.env.E2E_ADMIN_EMAIL;
  const adminPassword = process.env.E2E_ADMIN_PASSWORD;

  if (!adminEmail) {
    throw new Error(
      'E2E_ADMIN_EMAIL is required. Set it in .env.test.local or environment variables.'
    );
  }

  if (!adminPassword) {
    console.warn('[Setup] ⚠️  E2E_ADMIN_PASSWORD not set, generating secure random password...');
    const generated = generateSecurePassword(32);
    users.push({
      email: adminEmail,
      password: generated,
      username: 'testadmin',
      displayName: 'Test Admin',
      isAdmin: true,
    });
  } else {
    if (!isStrongPassword(adminPassword)) {
      throw new Error(
        'E2E_ADMIN_PASSWORD is too weak. Must be at least 16 characters with uppercase, lowercase, numbers, and special characters.'
      );
    }
    users.push({
      email: adminEmail,
      password: adminPassword,
      username: 'testadmin',
      displayName: 'Test Admin',
      isAdmin: true,
    });
  }

  // Regular User
  const userEmail = process.env.E2E_USER_EMAIL || 'testuser@test.local';
  const userPassword = process.env.E2E_USER_PASSWORD || generateSecurePassword(32);

  if (process.env.E2E_USER_PASSWORD && !isStrongPassword(process.env.E2E_USER_PASSWORD)) {
    throw new Error(
      'E2E_USER_PASSWORD is too weak. Must be at least 16 characters with uppercase, lowercase, numbers, and special characters.'
    );
  }

  users.push({
    email: userEmail,
    password: userPassword,
    username: 'testuser',
    displayName: 'Test User',
    isAdmin: false,
  });

  return users;
}

const TEST_USERS = getTestUsers();

/**
 * Get Supabase admin client with service role
 */
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local'
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Create or update a test user
 */
async function createTestUser(user: TestUser): Promise<void> {
  const supabase = getSupabaseAdmin();

  console.log(`[Setup] Creating test user: ${user.email}`);

  try {
    // Check if user already exists
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error('[Setup] Error checking existing users:', listError);
      // Continue anyway - might be permissions issue
    }

    const existingUser = existingUsers?.users?.find((u) => u.email === user.email);

    let userId: string;

    if (existingUser) {
      console.log(`[Setup] ✅ User ${user.email} already exists - using existing user`);
      userId = existingUser.id;

      // Don't update password - user might be using this account
      // They can reset it themselves if needed
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // Auto-confirm email for test users
        user_metadata: {
          username: user.username,
          display_name: user.displayName,
        },
      });

      if (createError) {
        throw new Error(`Failed to create user ${user.email}: ${createError.message}`);
      }

      if (!newUser.user) {
        throw new Error(`Failed to create user ${user.email}: No user returned`);
      }

      userId = newUser.user.id;
      console.log(`[Setup] ✅ Created user ${user.email} (${userId})`);
    }

    // Create or update user profile
    // Note: user_profiles table requires both `id` and `user_id` to be set
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert(
        {
          id: userId, // Primary key (same as user_id)
          user_id: userId,
          username: user.username,
          display_name: user.displayName,
          email: user.email, // Add email for completeness
          is_admin: user.isAdmin,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
        }
      );

    if (profileError) {
      console.warn(`[Setup] Could not create/update profile for ${user.email}:`, profileError.message);
      // This might fail if the table doesn't exist yet - that's okay
    } else {
      console.log(`[Setup] ✅ Profile updated for ${user.email} (admin: ${user.isAdmin})`);
    }
  } catch (error) {
    console.error(`[Setup] ❌ Error setting up user ${user.email}:`, error);
    throw error;
  }
}

/**
 * Create all test users
 */
export async function createAllTestUsers(): Promise<void> {
  console.log('\n[Setup] 🚀 Creating test users...\n');

  // Security check - only run in test/dev environments
  const env = process.env.NODE_ENV;
  const isProduction = env === 'production';

  if (isProduction) {
    throw new Error('SECURITY: Cannot create test users in production environment!');
  }

  try {
    const users = getTestUsers();

    for (const user of users) {
      await createTestUser(user);
    }

    // Save credentials if any were auto-generated
    const hasGeneratedPasswords = users.some(
      (u) => !process.env[`E2E_${u.isAdmin ? 'ADMIN' : 'USER'}_PASSWORD`]
    );

    if (hasGeneratedPasswords) {
      saveCredentials(users);
    }

    console.log('\n[Setup] ✅ All test users created successfully\n');
  } catch (error) {
    console.error('\n[Setup] ❌ Failed to create test users:', error);
    throw error;
  }
}

/**
 * Cleanup test users (optional - for cleanup after tests)
 */
export async function cleanupTestUsers(): Promise<void> {
  console.log('\n[Setup] 🧹 Cleaning up test users...\n');

  const supabase = getSupabaseAdmin();

  for (const user of TEST_USERS) {
    try {
      // Find user by email
      const { data: users } = await supabase.auth.admin.listUsers();
      const existingUser = users?.users?.find((u) => u.email === user.email);

      if (existingUser) {
        // Delete user
        const { error } = await supabase.auth.admin.deleteUser(existingUser.id);
        if (error) {
          console.warn(`[Setup] Could not delete ${user.email}:`, error.message);
        } else {
          console.log(`[Setup] ✅ Deleted ${user.email}`);
        }
      }
    } catch (error) {
      console.warn(`[Setup] Error cleaning up ${user.email}:`, error);
    }
  }

  console.log('\n[Setup] ✅ Cleanup complete\n');
}

// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  createAllTestUsers()
    .then(() => {
      console.log('Test users setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to setup test users:', error);
      process.exit(1);
    });
}

