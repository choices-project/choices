/**
 * Real Test User Manager
 * 
 * Creates test users that bypass email verification and create real database activity.
 * Uses Supabase Admin API to create users directly with email_confirm: true
 * 
 * Created: January 27, 2025
 * Status: ✅ BYPASSING EMAIL VERIFICATION BLOCK
 */

import { createClient } from '@supabase/supabase-js';

export const REAL_TEST_USER = {
  email: 'real-test-user@example.com',
  password: 'RealTestUser123!',
  username: 'realtestuser',
  displayName: 'Real Test User',
  location: 'San Francisco, CA'
};

export const REAL_ADMIN_USER = {
  email: 'real-admin-user@example.com',
  password: 'RealAdminUser123!',
  username: 'realadminuser',
  displayName: 'Real Admin User',
  location: 'San Francisco, CA'
};

export class RealTestUserManager {
  private static supabase: any = null;
  private static userCreated = false;
  private static adminCreated = false;

  static async initialize() {
    if (this.supabase) return;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://muqwrehywjrbaeerjgfb.supabase.co';
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseServiceKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for creating test users');
    }

    this.supabase = createClient(supabaseUrl, supabaseServiceKey);
    console.log('🔑 Supabase service client initialized for real test users');
  }

  /**
   * Create real test user with bypassed email verification
   */
  static async ensureRealUserExists(): Promise<boolean> {
    if (this.userCreated) {
      return true;
    }

    try {
      await this.initialize();
      
      // Check if user already exists
      const { data: existingUser, error: checkError } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('email', REAL_TEST_USER.email)
        .single();
      
      if (existingUser && !checkError) {
        console.log('✅ Real test user already exists');
        this.userCreated = true;
        return true;
      }
      
      console.log('👤 Creating real test user with bypassed email verification...');
      
      // Create auth user with email_confirm: true (bypasses email verification)
      const { data: authUser, error: authError } = await this.supabase.auth.admin.createUser({
        email: REAL_TEST_USER.email,
        password: REAL_TEST_USER.password,
        email_confirm: true, // This bypasses email verification!
        user_metadata: {
          username: REAL_TEST_USER.username,
          display_name: REAL_TEST_USER.displayName
        }
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
          user_id: authUser.user?.id,
          email: REAL_TEST_USER.email,
          username: REAL_TEST_USER.username,
          display_name: REAL_TEST_USER.displayName,
          trust_tier: 'T0',
          is_admin: false,
          is_active: true,
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
      
      // Create user role
      const { data: role, error: roleError } = await this.supabase
        .from('user_roles')
        .insert({
          user_id: authUser.user?.id,
          role: 'user',
          is_active: true
        })
        .select()
        .single();
      
      if (roleError) {
        console.error('❌ Error creating user role:', roleError);
        return false;
      }
      
      console.log('✅ User role created:', role.id);
      
      this.userCreated = true;
      console.log('✅ Real test user created successfully with real database activity');
      return true;
      
    } catch (error) {
      console.error('❌ Error ensuring real user exists:', error);
      return false;
    }
  }

  /**
   * Create real admin user with bypassed email verification
   */
  static async ensureRealAdminExists(): Promise<boolean> {
    if (this.adminCreated) {
      return true;
    }

    try {
      await this.initialize();
      
      // Check if admin already exists
      const { data: existingAdmin, error: checkError } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('email', REAL_ADMIN_USER.email)
        .single();
      
      if (existingAdmin && !checkError) {
        console.log('✅ Real admin user already exists');
        this.adminCreated = true;
        return true;
      }
      
      console.log('👑 Creating real admin user with bypassed email verification...');
      
      // Create auth user with email_confirm: true
      const { data: authUser, error: authError } = await this.supabase.auth.admin.createUser({
        email: REAL_ADMIN_USER.email,
        password: REAL_ADMIN_USER.password,
        email_confirm: true, // This bypasses email verification!
        user_metadata: {
          username: REAL_ADMIN_USER.username,
          display_name: REAL_ADMIN_USER.displayName
        }
      });
      
      if (authError) {
        console.error('❌ Error creating auth user:', authError);
        return false;
      }
      
      console.log('✅ Auth user created:', authUser.user?.id);
      
      // Create admin profile
      const { data: profile, error: profileError } = await this.supabase
        .from('user_profiles')
        .insert({
          user_id: authUser.user?.id,
          email: REAL_ADMIN_USER.email,
          username: REAL_ADMIN_USER.username,
          display_name: REAL_ADMIN_USER.displayName,
          trust_tier: 'T3',
          is_admin: true,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (profileError) {
        console.error('❌ Error creating admin profile:', profileError);
        return false;
      }
      
      console.log('✅ Admin profile created:', profile.id);
      
      // Create admin role
      const { data: role, error: roleError } = await this.supabase
        .from('user_roles')
        .insert({
          user_id: authUser.user?.id,
          role: 'admin',
          is_active: true
        })
        .select()
        .single();
      
      if (roleError) {
        console.error('❌ Error creating admin role:', roleError);
        return false;
      }
      
      console.log('✅ Admin role created:', role.id);
      
      this.adminCreated = true;
      console.log('✅ Real admin user created successfully with real database activity');
      return true;
      
    } catch (error) {
      console.error('❌ Error ensuring real admin exists:', error);
      return false;
    }
  }

  /**
   * Create real content for testing
   */
  static async createRealContent(): Promise<boolean> {
    try {
      await this.initialize();
      
      console.log('📝 Creating real content for testing...');
      
      // Get the real test user
      const { data: user, error: userError } = await this.supabase
        .from('user_profiles')
        .select('user_id')
        .eq('email', REAL_TEST_USER.email)
        .single();
      
      if (userError || !user) {
        console.error('❌ Real test user not found');
        return false;
      }
      
      // Create a real poll
      const { data: poll, error: pollError } = await this.supabase
        .from('polls')
        .insert({
          title: 'Real Test Poll',
          description: 'This is a real poll created by E2E testing',
          created_by: user.user_id,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (pollError) {
        console.error('❌ Error creating poll:', pollError);
        return false;
      }
      
      console.log('✅ Real poll created:', poll.id);
      
      // Create poll options
      const { error: optionsError } = await this.supabase
        .from('poll_options')
        .insert([
          {
            poll_id: poll.id,
            option_text: 'Option A',
            created_at: new Date().toISOString()
          },
          {
            poll_id: poll.id,
            option_text: 'Option B',
            created_at: new Date().toISOString()
          }
        ]);
      
      if (optionsError) {
        console.error('❌ Error creating poll options:', optionsError);
        return false;
      }
      
      console.log('✅ Real poll options created');
      
      return true;
      
    } catch (error) {
      console.error('❌ Error creating real content:', error);
      return false;
    }
  }
}
