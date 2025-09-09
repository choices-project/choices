#!/usr/bin/env node

/**
 * Cleanup Orphaned Auth Users
 * 
 * This script identifies and cleans up orphaned auth users who have
 * no corresponding user profile in the database.
 * 
 * IMPORTANT: This script requires service role privileges and should
 * only be run by administrators in a secure environment.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   SUPABASE_SECRET_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function findOrphanedAuthUsers() {
  console.log('🔍 Searching for orphaned auth users...');
  
  try {
    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw new Error(`Failed to list auth users: ${authError.message}`);
    }
    
    console.log(`📊 Found ${authUsers.users.length} total auth users`);
    
    // Get all user profiles
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id');
    
    if (profileError) {
      throw new Error(`Failed to list user profiles: ${profileError.message}`);
    }
    
    const profileUserIds = new Set(profiles.map(p => p.user_id));
    
    // Find orphaned users (auth users without profiles)
    const orphanedUsers = authUsers.users.filter(user => 
      !profileUserIds.has(user.id) && 
      user.email_confirmed_at // Only consider confirmed users
    );
    
    console.log(`🚨 Found ${orphanedUsers.length} orphaned auth users`);
    
    if (orphanedUsers.length > 0) {
      console.log('\n📋 Orphaned users:');
      orphanedUsers.forEach(user => {
        console.log(`   - ${user.email} (${user.id}) - Created: ${user.created_at}`);
      });
    }
    
    return orphanedUsers;
    
  } catch (error) {
    console.error('❌ Error finding orphaned users:', error.message);
    throw error;
  }
}

async function cleanupOrphanedUsers(orphanedUsers, dryRun = true) {
  if (orphanedUsers.length === 0) {
    console.log('✅ No orphaned users to clean up');
    return;
  }
  
  console.log(`\n${dryRun ? '🧪 DRY RUN' : '🗑️  CLEANUP'} - ${orphanedUsers.length} orphaned users`);
  
  for (const user of orphanedUsers) {
    try {
      if (dryRun) {
        console.log(`   Would delete: ${user.email} (${user.id})`);
      } else {
        console.log(`   Deleting: ${user.email} (${user.id})`);
        
        const { error } = await supabase.auth.admin.deleteUser(user.id);
        
        if (error) {
          console.error(`   ❌ Failed to delete ${user.email}: ${error.message}`);
        } else {
          console.log(`   ✅ Deleted ${user.email}`);
        }
      }
    } catch (error) {
      console.error(`   ❌ Error processing ${user.email}:`, error.message);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes('--execute');
  
  console.log('🧹 Orphaned Auth Users Cleanup Script');
  console.log('=====================================');
  
  if (dryRun) {
    console.log('🧪 Running in DRY RUN mode (use --execute to actually delete)');
  } else {
    console.log('⚠️  EXECUTE mode - will actually delete orphaned users!');
  }
  
  try {
    const orphanedUsers = await findOrphanedAuthUsers();
    await cleanupOrphanedUsers(orphanedUsers, dryRun);
    
    if (dryRun && orphanedUsers.length > 0) {
      console.log('\n💡 To execute the cleanup, run:');
      console.log('   node scripts/cleanup-orphaned-auth-users.js --execute');
    }
    
    console.log('\n✅ Cleanup process completed');
    
  } catch (error) {
    console.error('\n❌ Cleanup failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();


