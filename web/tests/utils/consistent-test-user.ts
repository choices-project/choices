/**
 * Consistent Test User Manager
 * 
 * Manages consistent test users across E2E tests to ensure
 * reliable and reproducible test results.
 * 
 * @fileoverview Test user management for E2E testing
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
 * Interface for test user data
 */
export interface TestUser {
  email: string;
  password: string;
  name: string;
  isAdmin: boolean;
  metadata?: Record<string, any>;
}

/**
 * Consistent test user for regular user testing
 */
export const CONSISTENT_TEST_USER: TestUser = {
  email: 'consistent-test-user@example.com',
  password: 'testpassword123',
  name: 'Consistent Test User',
  isAdmin: false,
  metadata: {
    interests: ['politics', 'environment', 'technology']
  }
};

/**
 * Admin test user for admin testing
 */
export const ADMIN_TEST_USER: TestUser = {
  email: 'admin-test-user@example.com',
  password: 'adminpassword123',
  name: 'Admin Test User',
  isAdmin: true,
  metadata: {
    interests: ['administration', 'management'],
    adminLevel: 'super'
  }
};

/**
 * Consistent Test User Manager Class
 * 
 * Manages test user lifecycle and ensures consistent state
 * across E2E test runs.
 */
export class ConsistentTestUserManager {
  private static instance: ConsistentTestUserManager;
  private supabase: SupabaseClient | null = null;
  private initialized: boolean = false;

  /**
   * Constructor for ConsistentTestUserManager
   */
  constructor() {
    this.initializeSupabase();
  }

  /**
   * Get singleton instance
   * @returns ConsistentTestUserManager instance
   */
  public static getInstance(): ConsistentTestUserManager {
    if (!ConsistentTestUserManager.instance) {
      ConsistentTestUserManager.instance = new ConsistentTestUserManager();
    }
    return ConsistentTestUserManager.instance;
  }

  /**
   * Ensure consistent test user exists (static method)
   * @returns Promise<boolean> - True if user exists or was created
   */
  public static async ensureUserExists(): Promise<boolean> {
    const manager = ConsistentTestUserManager.getInstance();
    return await manager.ensureUserExists(CONSISTENT_TEST_USER);
  }

  /**
   * Ensure admin test user exists (static method)
   * @returns Promise<boolean> - True if user exists or was created
   */
  public static async ensureAdminUserExists(): Promise<boolean> {
    const manager = ConsistentTestUserManager.getInstance();
    return await manager.ensureUserExists(ADMIN_TEST_USER);
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
        console.warn('⚠️  Supabase credentials not found, test user management limited');
        return;
      }

      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.initialized = true;
      console.log('🔌 Supabase client initialized for test user management');
    } catch (error) {
      console.error('❌ Error initializing Supabase client:', error);
    }
  }

  /**
   * Check if test user exists
   * @param user - Test user to check
   * @returns Promise<boolean> - True if user exists
   */
  public async userExists(user: TestUser): Promise<boolean> {
    if (!this.supabase) {
      console.warn('⚠️  Supabase not initialized, cannot check user existence');
      return false;
    }

    try {
      const { data, error } = await this.supabase.auth.admin.listUsers();
      
      if (error) {
        console.error('❌ Error checking user existence:', error);
        return false;
      }

      return data.users.some(u => u.email === user.email);
    } catch (error) {
      console.error('❌ Error checking user existence:', error);
      return false;
    }
  }

  /**
   * Create test user if it doesn't exist
   * @param user - Test user to create
   * @returns Promise<boolean> - True if user was created or already exists
   */
  public async ensureUserExists(user: TestUser): Promise<boolean> {
    if (!this.supabase) {
      console.warn('⚠️  Supabase not initialized, cannot create user');
      return false;
    }

    try {
      const exists = await this.userExists(user);
      
      if (exists) {
        console.log(`✅ Test user already exists: ${user.email}`);
        return true;
      }

      console.log(`📝 Creating test user: ${user.email}`);
      
      const { data, error } = await this.supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          name: user.name,
          is_admin: user.isAdmin,
          ...user.metadata
        }
      });

      if (error) {
        console.error(`❌ Error creating test user ${user.email}:`, error);
        return false;
      }

      console.log(`✅ Test user created successfully: ${user.email}`);
      return true;
    } catch (error) {
      console.error(`❌ Error creating test user ${user.email}:`, error);
      return false;
    }
  }

  /**
   * Delete test user
   * @param user - Test user to delete
   * @returns Promise<boolean> - True if user was deleted
   */
  public async deleteUser(user: TestUser): Promise<boolean> {
    if (!this.supabase) {
      console.warn('⚠️  Supabase not initialized, cannot delete user');
      return false;
    }

    try {
      const { data: users, error: listError } = await this.supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error('❌ Error listing users:', listError);
        return false;
      }

      const targetUser = users.users.find(u => u.email === user.email);
      
      if (!targetUser) {
        console.log(`ℹ️  User not found: ${user.email}`);
        return true;
      }

      const { error } = await this.supabase.auth.admin.deleteUser(targetUser.id);
      
      if (error) {
        console.error(`❌ Error deleting user ${user.email}:`, error);
        return false;
      }

      console.log(`✅ Test user deleted: ${user.email}`);
      return true;
    } catch (error) {
      console.error(`❌ Error deleting user ${user.email}:`, error);
      return false;
    }
  }

  /**
   * Clean up all test users
   * @returns Promise<boolean> - True if cleanup was successful
   */
  public async cleanupTestUsers(): Promise<boolean> {
    if (!this.supabase) {
      console.warn('⚠️  Supabase not initialized, cannot cleanup users');
      return false;
    }

    try {
      console.log('🧹 Cleaning up test users...');
      
      const { data: users, error } = await this.supabase.auth.admin.listUsers();
      
      if (error) {
        console.error('❌ Error listing users for cleanup:', error);
        return false;
      }

      const testUsers = users.users.filter(u => 
        u.email?.includes('test') || 
        u.email?.includes('example.com')
      );

      let success = true;
      for (const user of testUsers) {
        const { error: deleteError } = await this.supabase.auth.admin.deleteUser(user.id);
        if (deleteError) {
          console.error(`❌ Error deleting user ${user.email}:`, deleteError);
          success = false;
        } else {
          console.log(`✅ Cleaned up user: ${user.email}`);
        }
      }

      return success;
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      return false;
    }
  }

  /**
   * Get user by email
   * @param email - User email
   * @returns Promise<TestUser | null> - User data or null
   */
  public async getUserByEmail(email: string): Promise<TestUser | null> {
    if (!this.supabase) {
      console.warn('⚠️  Supabase not initialized, cannot get user');
      return null;
    }

    try {
      const { data: users, error } = await this.supabase.auth.admin.listUsers();
      
      if (error) {
        console.error('❌ Error getting user:', error);
        return null;
      }

      const user = users.users.find(u => u.email === email);
      
      if (!user) {
        return null;
      }

      return {
        email: user.email || '',
        password: '', // Cannot retrieve password
        name: user.user_metadata?.name || '',
        isAdmin: user.user_metadata?.is_admin || false,
        metadata: user.user_metadata
      };
    } catch (error) {
      console.error('❌ Error getting user:', error);
      return null;
    }
  }

  /**
   * Verify test user setup
   * @returns Promise<boolean> - True if setup is correct
   */
  public async verifySetup(): Promise<boolean> {
    if (!this.supabase) {
      console.warn('⚠️  Supabase not initialized, cannot verify setup');
      return false;
    }

    try {
      console.log('🔍 Verifying test user setup...');
      
      const consistentExists = await this.userExists(CONSISTENT_TEST_USER);
      const adminExists = await this.userExists(ADMIN_TEST_USER);
      
      console.log(`📊 Consistent user exists: ${consistentExists}`);
      console.log(`📊 Admin user exists: ${adminExists}`);
      
      return consistentExists && adminExists;
    } catch (error) {
      console.error('❌ Error verifying setup:', error);
      return false;
    }
  }
}

/**
 * Default export for convenience
 */
export default ConsistentTestUserManager;