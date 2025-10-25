/**
 * Admin User Setup Utility
 * 
 * Handles admin user creation and management for E2E testing
 * with proper permissions and role assignment.
 * 
 * @fileoverview Admin user setup for E2E testing
 * @author Choices Platform Team
 * @created 2025-10-24
 * @updated 2025-10-24
 * @status ACTIVE
 * @version 1.0.0
 * 
 * @requires @supabase/supabase-js
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Interface for admin user data
 */
export interface AdminUser {
  email: string;
  password: string;
  name: string;
  adminLevel: 'super' | 'moderator' | 'viewer';
  permissions: string[];
  metadata?: Record<string, any>;
}

/**
 * Default admin user configuration
 */
export const DEFAULT_ADMIN_USER: AdminUser = {
  email: 'admin@example.com',
  password: 'adminpassword123',
  name: 'Admin User',
  adminLevel: 'super',
  permissions: ['read', 'write', 'delete', 'manage_users', 'manage_content'],
  metadata: {
    interests: ['administration', 'management'],
    department: 'IT',
    role: 'system_administrator'
  }
};

/**
 * Admin User Setup Class
 * 
 * Manages admin user creation, permissions, and role assignment
 * for E2E testing scenarios.
 */
export class AdminUserSetup {
  private supabase: SupabaseClient | null = null;
  private initialized: boolean = false;

  /**
   * Constructor for AdminUserSetup
   */
  constructor() {
    this.initializeSupabase();
  }

  /**
   * Initialize Supabase client
   * @private
   */
  private initializeSupabase(): void {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.warn('⚠️  Supabase credentials not found, admin user setup limited');
        return;
      }

      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.initialized = true;
      console.log('🔌 Supabase client initialized for admin user setup');
    } catch (error) {
      console.error('❌ Error initializing Supabase client:', error);
    }
  }

  /**
   * Create admin user with proper permissions
   * @param adminUser - Admin user configuration
   * @returns Promise<boolean> - True if user was created successfully
   */
  public async createAdminUser(adminUser: AdminUser = DEFAULT_ADMIN_USER): Promise<boolean> {
    if (!this.supabase) {
      console.warn('⚠️  Supabase not initialized, cannot create admin user');
      return false;
    }

    try {
      console.log(`👑 Creating admin user: ${adminUser.email}`);
      
      // Check if user already exists
      const { data: existingUsers, error: listError } = await this.supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error('❌ Error checking existing users:', listError);
        return false;
      }

      const existingUser = existingUsers.users.find(u => u.email === adminUser.email);
      
      if (existingUser) {
        console.log(`ℹ️  Admin user already exists: ${adminUser.email}`);
        return await this.updateAdminPermissions(existingUser.id, adminUser);
      }

      // Create new admin user
      const { data, error } = await this.supabase.auth.admin.createUser({
        email: adminUser.email,
        password: adminUser.password,
        email_confirm: true,
        user_metadata: {
          name: adminUser.name,
          is_admin: true,
          admin_level: adminUser.adminLevel,
          permissions: adminUser.permissions,
          ...adminUser.metadata
        }
      });

      if (error) {
        console.error(`❌ Error creating admin user:`, error);
        return false;
      }

      console.log(`✅ Admin user created successfully: ${adminUser.email}`);
      
      // Create user profile
      await this.createAdminProfile(data.user.id, adminUser);
      
      return true;
    } catch (error) {
      console.error('❌ Error creating admin user:', error);
      return false;
    }
  }

  /**
   * Create admin user profile
   * @param userId - User ID
   * @param adminUser - Admin user configuration
   * @private
   */
  private async createAdminProfile(userId: string, adminUser: AdminUser): Promise<void> {
    if (!this.supabase) return;

    try {
      const { error } = await this.supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          email: adminUser.email,
          name: adminUser.name,
          interests: adminUser.metadata?.interests || ['administration']
        });

      if (error) {
        console.error('❌ Error creating admin profile:', error);
      } else {
        console.log('✅ Admin profile created');
      }
    } catch (error) {
      console.error('❌ Error creating admin profile:', error);
    }
  }

  /**
   * Update admin permissions
   * @param userId - User ID
   * @param adminUser - Admin user configuration
   * @returns Promise<boolean> - True if permissions were updated
   * @private
   */
  private async updateAdminPermissions(userId: string, adminUser: AdminUser): Promise<boolean> {
    if (!this.supabase) return false;

    try {
      const { error } = await this.supabase.auth.admin.updateUserById(userId, {
        user_metadata: {
          name: adminUser.name,
          is_admin: true,
          admin_level: adminUser.adminLevel,
          permissions: adminUser.permissions,
          ...adminUser.metadata
        }
      });

      if (error) {
        console.error('❌ Error updating admin permissions:', error);
        return false;
      }

      console.log('✅ Admin permissions updated');
      return true;
    } catch (error) {
      console.error('❌ Error updating admin permissions:', error);
      return false;
    }
  }

  /**
   * Verify admin user setup
   * @param adminUser - Admin user to verify
   * @returns Promise<boolean> - True if setup is correct
   */
  public async verifyAdminSetup(adminUser: AdminUser = DEFAULT_ADMIN_USER): Promise<boolean> {
    if (!this.supabase) {
      console.warn('⚠️  Supabase not initialized, cannot verify admin setup');
      return false;
    }

    try {
      console.log(`🔍 Verifying admin user setup: ${adminUser.email}`);
      
      const { data: users, error } = await this.supabase.auth.admin.listUsers();
      
      if (error) {
        console.error('❌ Error verifying admin setup:', error);
        return false;
      }

      const user = users.users.find(u => u.email === adminUser.email);
      
      if (!user) {
        console.log('❌ Admin user not found');
        return false;
      }

      const isAdmin = user.user_metadata?.is_admin === true;
      const adminLevel = user.user_metadata?.admin_level;
      const permissions = user.user_metadata?.permissions;

      console.log(`📊 Admin status: ${isAdmin}`);
      console.log(`📊 Admin level: ${adminLevel}`);
      console.log(`📊 Permissions: ${permissions?.join(', ')}`);

      return isAdmin && adminLevel && permissions;
    } catch (error) {
      console.error('❌ Error verifying admin setup:', error);
      return false;
    }
  }

  /**
   * Delete admin user
   * @param adminUser - Admin user to delete
   * @returns Promise<boolean> - True if user was deleted
   */
  public async deleteAdminUser(adminUser: AdminUser = DEFAULT_ADMIN_USER): Promise<boolean> {
    if (!this.supabase) {
      console.warn('⚠️  Supabase not initialized, cannot delete admin user');
      return false;
    }

    try {
      console.log(`🗑️  Deleting admin user: ${adminUser.email}`);
      
      const { data: users, error: listError } = await this.supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error('❌ Error listing users:', listError);
        return false;
      }

      const user = users.users.find(u => u.email === adminUser.email);
      
      if (!user) {
        console.log('ℹ️  Admin user not found');
        return true;
      }

      const { error } = await this.supabase.auth.admin.deleteUser(user.id);
      
      if (error) {
        console.error('❌ Error deleting admin user:', error);
        return false;
      }

      console.log('✅ Admin user deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Error deleting admin user:', error);
      return false;
    }
  }

  /**
   * Get admin user by email
   * @param email - Admin user email
   * @returns Promise<AdminUser | null> - Admin user data or null
   */
  public async getAdminUser(email: string): Promise<AdminUser | null> {
    if (!this.supabase) {
      console.warn('⚠️  Supabase not initialized, cannot get admin user');
      return null;
    }

    try {
      const { data: users, error } = await this.supabase.auth.admin.listUsers();
      
      if (error) {
        console.error('❌ Error getting admin user:', error);
        return null;
      }

      const user = users.users.find(u => u.email === email);
      
      if (!user || !user.user_metadata?.is_admin) {
        return null;
      }

      return {
        email: user.email || '',
        password: '', // Cannot retrieve password
        name: user.user_metadata.name || '',
        adminLevel: user.user_metadata.admin_level || 'viewer',
        permissions: user.user_metadata.permissions || [],
        metadata: user.user_metadata
      };
    } catch (error) {
      console.error('❌ Error getting admin user:', error);
      return null;
    }
  }
}

/**
 * Default export for convenience
 */
export default AdminUserSetup;