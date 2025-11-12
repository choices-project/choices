/**
 * Verify and Set Admin Flag for Test Users
 * 
 * Uses service role key to ensure test admin user has is_admin = true
 */

import * as path from 'path';

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load .env.local first, then .env.test.local (if it exists)
dotenv.config({ path: path.join(process.cwd(), '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env.test.local') });

async function verifyAndSetAdmin() {
  console.log('\n🔍 Verifying admin flag for test users...\n');

  // Get credentials from .env.test.local
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmail = process.env.E2E_ADMIN_EMAIL;

  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.test.local');
  }

  if (!adminEmail) {
    throw new Error('Missing E2E_ADMIN_EMAIL in .env.test.local');
  }

  // Create admin client
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  try {
    // Get user by email from auth
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Failed to list users: ${authError.message}`);
    }

    const authUser = users?.find((u) => u.email === adminEmail);
    
    if (!authUser) {
      throw new Error(`User ${adminEmail} not found in auth.users. Please create this user first.`);
    }

    console.log(`✅ Found user in auth: ${adminEmail} (${authUser.id})`);

    // Check user_profiles table
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, username, email, is_admin, display_name')
      .eq('user_id', authUser.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      // PGRST116 = not found, which is fine
      throw new Error(`Error checking profile: ${profileError.message}`);
    }

    if (!profile) {
      console.log('⚠️  User profile not found, creating...');
      
      // Create profile with admin flag
      // Generate unique username from email
      const emailUsername = adminEmail.split('@')[0].replace(/[^a-zA-Z0-9_-]/g, '_');
      
      const { error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: authUser.id, // Use same UUID as auth user
          user_id: authUser.id,
          username: authUser.user_metadata?.username || emailUsername,
          email: adminEmail,
          display_name: authUser.user_metadata?.display_name || 'Admin Test User',
          is_admin: true,
        });

      if (insertError) {
        throw new Error(`Failed to create profile: ${insertError.message}`);
      }

      console.log('✅ Created user profile with is_admin = true');
    } else {
      console.log(`📊 Current profile:
   - user_id: ${profile.user_id}
   - username: ${profile.username}
   - email: ${profile.email}
   - display_name: ${profile.display_name}
   - is_admin: ${profile.is_admin}`);

      if (!profile.is_admin) {
        console.log('\n⚠️  is_admin is false, setting to true...');
        
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ is_admin: true })
          .eq('user_id', authUser.id);

        if (updateError) {
          throw new Error(`Failed to update is_admin: ${updateError.message}`);
        }

        console.log('✅ Updated is_admin = true');
      } else {
        console.log('\n✅ is_admin is already true - all good!');
      }
    }

    // Verify the update
    const { data: verifyProfile } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('user_id', authUser.id)
      .single();

    if (verifyProfile?.is_admin) {
      console.log('\n✅ ✅ ✅ VERIFIED: Admin flag is set correctly!\n');
      console.log(`User ${adminEmail} is ready for E2E testing.\n`);
      return true;
    } else {
      throw new Error('Verification failed: is_admin is still not true');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    throw error;
  }
}

// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;

if (isMainModule) {
  verifyAndSetAdmin()
    .then(() => {
      console.log('✨ Admin verification complete! You can now run: npm run test:e2e\n');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Admin verification failed:', error.message);
      console.error('\nPlease check your .env.test.local configuration.\n');
      process.exit(1);
    });
}

export { verifyAndSetAdmin };

