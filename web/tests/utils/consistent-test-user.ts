/**
 * Consistent Test User Management
 * 
 * Manages a dedicated test user for consistent tracking across all E2E tests.
 * Provides user creation, authentication, and cleanup functionality.
 * 
 * Created: October 23, 2025
 * Status: ✅ ACTIVE
 */

export const CONSISTENT_TEST_USER = {
  email: 'consistent-test-user@example.com',
  password: 'ConsistentUser123!',
  username: 'consistentuser',
  displayName: 'Consistent Test User',
  location: 'San Francisco, CA',
  preferences: {
    notifications: true,
    dataSharing: true,
    civics: true,
    hashtags: ['politics', 'civics', 'democracy']
  }
};

export const ADMIN_TEST_USER = {
  email: 'admin-test-user@example.com',
  password: 'AdminPassword123!',
  username: 'admintestuser',
  displayName: 'Admin Test User',
  location: 'San Francisco, CA',
  preferences: {
    notifications: true,
    dataSharing: true,
    civics: true,
    hashtags: ['admin', 'management', 'system']
  }
};

export class ConsistentTestUserManager {
  private static userCreated = false;
  private static userAuthenticated = false;
  private static adminUserCreated = false;
  private static adminUserAuthenticated = false;

  /**
   * Ensure the consistent test user exists
   * 
   * CORRECT APPROACH: Test users should use normal auth flow, not admin APIs
   */
  static async ensureUserExists(): Promise<boolean> {
    if (this.userCreated) {
      return true;
    }

    try {
      // Use regular Supabase client (not admin) for test users
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://muqwrehywjrbaeerjgfb.supabase.co';
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_tJOpGO2IPjujJDQou44P_g_BgbTFBfc';
      
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(supabaseUrl, supabaseKey);
      
      // CORRECT: Test users should use normal auth flow
      console.log('🔐 Attempting to sign in with consistent test user...');
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: CONSISTENT_TEST_USER.email,
        password: CONSISTENT_TEST_USER.password
      });
      
      if (signInData.user && !signInError) {
        console.log('✅ Consistent test user exists and can sign in');
        this.userCreated = true;
        return true;
      }
      
      // If sign in fails, try to register the user
      console.log('📝 Consistent test user does not exist, attempting registration...');
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: CONSISTENT_TEST_USER.email,
        password: CONSISTENT_TEST_USER.password,
        options: {
          data: {
            username: CONSISTENT_TEST_USER.username,
            display_name: CONSISTENT_TEST_USER.displayName
          }
        }
      });
      
      if (signUpError || !signUpData.user) {
        console.log(`⚠️ Error registering test user: ${signUpError?.message}`);
        return false;
      }
      
      console.log('✅ Consistent test user registered successfully');
      this.userCreated = true;
      return true;

    } catch (error) {
      console.log(`⚠️ Error ensuring user exists: ${error}`);
      return false;
    }
  }

  /**
   * Authenticate the consistent test user
   */
  static async authenticateUser(page: any): Promise<boolean> {
    if (this.userAuthenticated) {
      return true;
    }

    try {
      console.log('🔐 Authenticating consistent test user...');
      
      // Navigate to login page
      await page.goto('/auth');
      await page.waitForLoadState('networkidle');
      
      // Check if login form exists
      const emailField = await page.locator('[data-testid="login-email"]').isVisible();
      const passwordField = await page.locator('[data-testid="login-password"]').isVisible();
      const submitButton = await page.locator('[data-testid="login-submit"]').isVisible();
      
      if (emailField && passwordField && submitButton) {
        await page.fill('[data-testid="login-email"]', CONSISTENT_TEST_USER.email);
        await page.fill('[data-testid="login-password"]', CONSISTENT_TEST_USER.password);
        await page.click('[data-testid="login-submit"]');
        
        // Wait for redirect
        await page.waitForTimeout(3000);
        
        this.userAuthenticated = true;
        console.log('✅ Consistent test user authenticated');
        return true;
      } else {
        console.log('❌ Login form not found');
        return false;
      }
      
    } catch (error) {
      console.log(`⚠️ Error authenticating user: ${error}`);
      return false;
    }
  }

  /**
   * Get user preferences for testing
   */
  static getUserPreferences() {
    return CONSISTENT_TEST_USER.preferences;
  }

  /**
   * Reset user state for fresh testing
   */
  static resetUserState() {
    this.userCreated = false;
    this.userAuthenticated = false;
    this.adminUserCreated = false;
    this.adminUserAuthenticated = false;
    console.log('🔄 Consistent test user state reset');
  }

  /**
   * Track user activity in database
   */
  static trackUserActivity(activity: string, context: string) {
    console.log(`📊 User Activity: ${activity} (${context})`);
    // This would integrate with DatabaseTracker
  }

  /**
   * Ensure the admin test user exists
   * 
   * Creates admin user directly in database with service role key
   */
  static async ensureAdminUserExists(): Promise<boolean> {
    if (this.adminUserCreated) {
      return true;
    }

    try {
      // Use SERVICE ROLE client for direct database access
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://muqwrehywjrbaeerjgfb.supabase.co';
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!serviceRoleKey) {
        console.log('⚠️ SUPABASE_SERVICE_ROLE_KEY not found in environment');
        return false;
      }

      const { createClient } = await import('@supabase/supabase-js');
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // Check if admin user already exists
      const { data: existingProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('user_id')
        .eq('email', ADMIN_TEST_USER.email)
        .single();

      if (existingProfile) {
        console.log('✅ Admin test user already exists in database');
        this.adminUserCreated = true;
        return true;
      }

      // Create admin user directly in auth.users table
      console.log('📝 Creating admin test user directly in database...');

      const { data: createUserData, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
        email: ADMIN_TEST_USER.email,
        password: ADMIN_TEST_USER.password,
        email_confirm: true, // Skip email confirmation
        user_metadata: {
          username: ADMIN_TEST_USER.username,
          display_name: ADMIN_TEST_USER.displayName
        }
      });

      if (createUserError || !createUserData.user) {
        console.log(`⚠️ Error creating admin test user: ${createUserError?.message}`);
        return false;
      }

      console.log('✅ Admin test user created in auth.users');

      // Create admin profile with T3 trust tier
      const { error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          user_id: createUserData.user.id,
          username: ADMIN_TEST_USER.username,
          email: ADMIN_TEST_USER.email,
          bio: 'Admin Test User',
          is_active: true,
          trust_tier: 'T3' // Admin tier
        });

      if (profileError) {
        console.log(`⚠️ Error creating admin profile: ${profileError.message}`);
        return false;
      }

      console.log('✅ Admin profile created with T3 trust tier');

      // Create admin role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .insert({
          user_id: createUserData.user.id,
          role: 'admin',
          is_active: true
        });

      if (roleError) {
        console.log(`⚠️ Error creating admin role: ${roleError.message}`);
        return false;
      }

      console.log('✅ Admin role created');
      this.adminUserCreated = true;
      return true;

    } catch (error) {
      console.log(`⚠️ Error ensuring admin user exists: ${error}`);
      return false;
    }
  }

  /**
   * Get admin test user credentials
   */
  static getAdminUser() {
    return ADMIN_TEST_USER;
  }

  /**
   * Get admin user preferences
   */
  static getAdminUserPreferences() {
    return ADMIN_TEST_USER.preferences;
  }
}

export default ConsistentTestUserManager;
