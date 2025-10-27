#!/usr/bin/env node

/**
 * Assign Admin Roles Script
 * 
 * @created: October 24, 2025
 * @updated: October 24, 2025
 * @purpose: Assign initial admin roles to existing users in the RBAC system
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './web/.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function assignAdminRoles() {
  console.log('🔐 Starting RBAC admin role assignment...\n');

  try {
    // Get all existing users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message);
      return;
    }

    console.log(`📊 Found ${users.users.length} users in the system`);

    // Get admin role ID
    const { data: adminRole, error: roleError } = await supabase
      .from('roles')
      .select('id, name, level')
      .eq('name', 'admin')
      .single();

    if (roleError || !adminRole) {
      console.error('❌ Error fetching admin role:', roleError?.message);
      return;
    }

    console.log(`🎯 Admin role found: ${adminRole.name} (Level ${adminRole.level})`);

    // Get super admin role ID
    const { data: superAdminRole, error: superRoleError } = await supabase
      .from('roles')
      .select('id, name, level')
      .eq('name', 'super_admin')
      .single();

    if (superRoleError || !superAdminRole) {
      console.error('❌ Error fetching super admin role:', superRoleError?.message);
      return;
    }

    console.log(`👑 Super admin role found: ${superAdminRole.name} (Level ${superAdminRole.level})`);

    let assignedCount = 0;
    let skippedCount = 0;

    for (const user of users.users) {
      console.log(`\n👤 Processing user: ${user.email} (${user.id})`);

      // Check if user already has admin role
      const { data: existingRoles, error: existingError } = await supabase
        .from('user_roles')
        .select('role_id, roles(name)')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (existingError) {
        console.error(`❌ Error checking existing roles for ${user.email}:`, existingError.message);
        continue;
      }

      const hasAdminRole = existingRoles?.some(ur => 
        ur.roles?.name === 'admin' || ur.roles?.name === 'super_admin'
      );

      if (hasAdminRole) {
        console.log(`⏭️  User ${user.email} already has admin role, skipping`);
        skippedCount++;
        continue;
      }

      // Determine role based on user metadata or email
      let roleToAssign = adminRole.id;
      let roleName = 'admin';

      // Check if user has super admin metadata
      if (user.user_metadata?.is_super_admin === true || 
          user.email?.includes('admin') || 
          user.email?.includes('super')) {
        roleToAssign = superAdminRole.id;
        roleName = 'super_admin';
        console.log(`👑 Assigning SUPER ADMIN role to ${user.email}`);
      } else {
        console.log(`🔧 Assigning ADMIN role to ${user.email}`);
      }

      // Assign role
      const { error: assignError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role_id: roleToAssign,
          assigned_by: user.id, // Self-assigned for initial setup
          is_active: true
        });

      if (assignError) {
        console.error(`❌ Error assigning role to ${user.email}:`, assignError.message);
        continue;
      }

      console.log(`✅ Successfully assigned ${roleName} role to ${user.email}`);
      assignedCount++;
    }

    console.log(`\n🎉 Role assignment complete!`);
    console.log(`✅ Assigned roles: ${assignedCount}`);
    console.log(`⏭️  Skipped (already had roles): ${skippedCount}`);
    console.log(`📊 Total users processed: ${users.users.length}`);

    // Verify assignments
    console.log(`\n🔍 Verifying role assignments...`);
    const { data: allUserRoles, error: verifyError } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        is_active,
        roles(name, level),
        auth.users(email)
      `)
      .eq('is_active', true)
      .in('role_id', [adminRole.id, superAdminRole.id]);

    if (verifyError) {
      console.error('❌ Error verifying assignments:', verifyError.message);
      return;
    }

    console.log(`\n📋 Current admin users:`);
    allUserRoles?.forEach(ur => {
      console.log(`  👤 ${ur.auth?.users?.email} - ${ur.roles?.name} (Level ${ur.roles?.level})`);
    });

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Run the script
assignAdminRoles()
  .then(() => {
    console.log('\n🏁 Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
  });

