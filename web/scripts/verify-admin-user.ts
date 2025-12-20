/**
 * Verify and Fix Admin User Profile
 *
 * This script checks if the admin user has
 * is_admin=true in their user_profiles table, and updates it if needed.
 */

import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local and .env
config({ path: resolve(__dirname, '../.env.local') });
config({ path: resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;

async function verifyAdminUser() {
  // eslint-disable-next-line no-console
  console.log('🔍 Verifying admin user profile...\n');

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('✗ Service role key is NOT set in environment');
    console.error('Please ensure SUPABASE_SERVICE_ROLE_KEY is set in your .env.local or .env file.');
    return;
  }

  if (!SUPABASE_URL) {
    console.error('✗ Supabase URL is NOT set in environment');
    return;
  }

  if (!ADMIN_EMAIL) {
    console.error('✗ Admin email is NOT set in environment');
    console.error('Please ensure E2E_ADMIN_EMAIL is set in your .env.local or .env file.');
    return;
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // eslint-disable-next-line no-console
  console.log(`📧 Checking user: ${ADMIN_EMAIL}\n`);

  // First, get the user from auth.users
  const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

  if (authError) {
    console.error('❌ Error fetching auth users:', authError);
    return;
  }

  const authUser = authUsers?.users?.find((u) => u.email === ADMIN_EMAIL);

  if (!authUser) {
    console.error(`❌ User ${ADMIN_EMAIL} not found in auth.users`);
    console.error('Please ensure the user exists in Supabase Auth.');
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`✅ Found user in auth.users: ${authUser.id}\n`);

  // Now check the user_profiles table
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .eq('user_id', authUser.id)
    .single();

  if (profileError) {
    if (profileError.code === 'PGRST116') {
      // Profile doesn't exist - create it
      // eslint-disable-next-line no-console
      console.log('⚠️  Profile does not exist. Creating profile with is_admin=true...\n');

      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('user_profiles')
        .insert([
          {
            user_id: authUser.id,
            email: ADMIN_EMAIL,
            display_name: authUser.user_metadata?.display_name || authUser.email?.split('@')[0] || 'Admin User',
            is_admin: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating profile:', createError);
        return;
      }

      // eslint-disable-next-line no-console
      console.log('✅ Profile created with is_admin=true');
      // eslint-disable-next-line no-console
      console.log(`   Profile ID: ${newProfile.id}`);
      // eslint-disable-next-line no-console
      console.log(`   Display Name: ${newProfile.display_name}`);
      // eslint-disable-next-line no-console
      console.log(`   Is Admin: ${newProfile.is_admin}\n`);
      return;
    }

    console.error('❌ Error fetching profile:', profileError);
    return;
  }

  if (!profile) {
    console.error('❌ Profile not found');
    return;
  }

  // eslint-disable-next-line no-console
  console.log('📋 Current profile:');
  // eslint-disable-next-line no-console
  console.log(`   Profile ID: ${profile.id}`);
  // eslint-disable-next-line no-console
  console.log(`   Display Name: ${profile.display_name || 'N/A'}`);
  // eslint-disable-next-line no-console
  console.log(`   Is Admin: ${profile.is_admin ?? false}\n`);

  if (profile.is_admin === true) {
    // eslint-disable-next-line no-console
    console.log('✅ User already has is_admin=true. No changes needed.\n');
    return;
  }

  // Update profile to set is_admin=true
  // eslint-disable-next-line no-console
  console.log('⚠️  User does not have is_admin=true. Updating...\n');

  const { data: updatedProfile, error: updateError } = await supabaseAdmin
    .from('user_profiles')
    .update({
      is_admin: true,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', authUser.id)
    .select()
    .single();

  if (updateError) {
    console.error('❌ Error updating profile:', updateError);
    return;
  }

  // eslint-disable-next-line no-console
  console.log('✅ Profile updated successfully!');
  // eslint-disable-next-line no-console
  console.log(`   Profile ID: ${updatedProfile.id}`);
  // eslint-disable-next-line no-console
  console.log(`   Display Name: ${updatedProfile.display_name || 'N/A'}`);
  // eslint-disable-next-line no-console
  console.log(`   Is Admin: ${updatedProfile.is_admin}\n`);
  // eslint-disable-next-line no-console
  console.log('🎉 Admin user profile is now correctly configured!\n');
}

verifyAdminUser().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

