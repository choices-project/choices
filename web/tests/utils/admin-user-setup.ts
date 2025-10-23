/**
 * Admin User Setup
 * 
 * Creates an admin user using the Supabase service key for testing purposes.
 * This must be run before testing the admin journey.
 * 
 * Created: October 23, 2025
 * Status: ✅ ACTIVE
 */

import { createClient } from '@supabase/supabase-js';

export const ADMIN_TEST_USER = {
  email: 'admin-test@example.com',
  password: 'AdminTest123!',
  username: 'admintest',
  displayName: 'Admin Test User',
  role: 'admin'
};

export class AdminUserSetup {
  private static supabase: any = null;
  private static adminCreated = false;

  /**
   * Initialize Supabase client with service key
   */
  static async initialize() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://muqwrehywjrbaeerjgfb.supabase.co';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    }

    this.supabase = createClient(supabaseUrl, serviceKey);
    console.log('🔑 Supabase service client initialized');
  }

  /**
   * Create admin user if it doesn't exist
   */
  static async ensureAdminUserExists(): Promise<boolean> {
    if (this.adminCreated) {
      return true;
    }

    try {
      await this.initialize();
      
      // Check if admin user already exists
      const { data: existingUser, error: checkError } = await this.supabase
        .from('user_profiles')
        .select('id, email, role')
        .eq('email', ADMIN_TEST_USER.email)
        .single();
      
      if (existingUser && !checkError) {
        console.log('✅ Admin test user already exists');
        this.adminCreated = true;
        return true;
      }
      
      // Create admin user
      console.log('👨‍💼 Creating admin test user...');
      
      // First, create the auth user
      const { data: authUser, error: authError } = await this.supabase.auth.admin.createUser({
        email: ADMIN_TEST_USER.email,
        password: ADMIN_TEST_USER.password,
        email_confirm: true
      });
      
      if (authError) {
        console.error('❌ Error creating auth user:', authError);
        return false;
      }
      
      console.log('✅ Auth user created:', authUser.user?.id);
      
      // Create user profile
      const { data: profile, error: profileError } = await this.supabase
        .from('user_profiles')
        .insert({
          id: authUser.user?.id,
          email: ADMIN_TEST_USER.email,
          username: ADMIN_TEST_USER.username,
          display_name: ADMIN_TEST_USER.displayName,
          role: 'admin',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (profileError) {
        console.error('❌ Error creating user profile:', profileError);
        return false;
      }
      
      console.log('✅ User profile created:', profile.id);
      
      // Create admin role
      const { data: role, error: roleError } = await this.supabase
        .from('user_roles')
        .insert({
          user_id: authUser.user?.id,
          role: 'admin',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (roleError) {
        console.error('❌ Error creating user role:', roleError);
        return false;
      }
      
      console.log('✅ Admin role created:', role.id);
      
      this.adminCreated = true;
      console.log('🎉 Admin test user created successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Error in admin user setup:', error);
      return false;
    }
  }

  /**
   * Get admin user credentials
   */
  static getAdminCredentials() {
    return {
      email: ADMIN_TEST_USER.email,
      password: ADMIN_TEST_USER.password
    };
  }

  /**
   * Clean up admin user (for testing cleanup)
   */
  static async cleanupAdminUser(): Promise<boolean> {
    try {
      await this.initialize();
      
      // Get user ID
      const { data: user, error: userError } = await this.supabase
        .from('user_profiles')
        .select('id')
        .eq('email', ADMIN_TEST_USER.email)
        .single();
      
      if (userError || !user) {
        console.log('⚠️ Admin user not found for cleanup');
        return true;
      }
      
      // Delete from auth
      const { error: authError } = await this.supabase.auth.admin.deleteUser(user.id);
      if (authError) {
        console.error('❌ Error deleting auth user:', authError);
        return false;
      }
      
      // Delete user profile
      const { error: profileError } = await this.supabase
        .from('user_profiles')
        .delete()
        .eq('id', user.id);
      
      if (profileError) {
        console.error('❌ Error deleting user profile:', profileError);
        return false;
      }
      
      // Delete user role
      const { error: roleError } = await this.supabase
        .from('user_roles')
        .delete()
        .eq('user_id', user.id);
      
      if (roleError) {
        console.error('❌ Error deleting user role:', roleError);
        return false;
      }
      
      console.log('✅ Admin test user cleaned up');
      this.adminCreated = false;
      return true;
      
    } catch (error) {
      console.error('❌ Error cleaning up admin user:', error);
      return false;
    }
  }
}

export default AdminUserSetup;
