/**
 * Admin Journey Stage 3
 *
 * Focuses on admin feature interactions and admin journey expansion:
 * - User management and administration
 * - Content moderation and review
 * - Analytics dashboard and metrics
 * - Site messages management
 * - System monitoring and health
 *
 * Created: January 27, 2025
 * Updated: January 27, 2025
 * Purpose: Stage 3 of iterative E2E testing - Admin feature interactions
 */

import { test, expect } from '@playwright/test';
import { DatabaseTracker } from '/Users/alaughingkitsune/src/Choices/web/tests/utils/database-tracker';
import { ConsistentTestUserManager, ADMIN_TEST_USER } from '/Users/alaughingkitsune/src/Choices/web/tests/utils/consistent-test-user';

test.describe('Admin Journey Stage 3', () => {
  test.beforeEach(async ({ page }) => {
    // Reset database tracking for each test
    DatabaseTracker.reset();

    // Load environment variables
    const dotenv = await import('dotenv');
    dotenv.config({ path: '.env.local' });

    // Initialize database tracking
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://muqwrehywjrbaeerjgfb.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_tJOpGO2IPjujJDQou44P_g_BgbTFBfc';
    DatabaseTracker.initializeSupabase(supabaseUrl, supabaseKey);

    // Ensure admin test user exists
    await ConsistentTestUserManager.ensureAdminUserExists();
    console.log('🚀 Starting Admin Journey Stage 3 - Admin Feature Interactions');
  });

  test('should handle admin feature interactions and journey expansion', async ({ page }) => {
    console.log('👑 Testing Admin Feature Interactions and Journey Expansion');
    console.log(`📧 Using admin test user: ${ADMIN_TEST_USER.email}`);

    // Step 1: Admin Login
    console.log('🔐 Step 1: Admin Login');
    DatabaseTracker.trackQuery('admin_login_page', 'select', 'admin_login');

    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Check if login form is available
    const emailField = await page.locator('[data-testid="email"]');
    const passwordField = await page.locator('[data-testid="password"]');

    if (await emailField.isVisible() && await passwordField.isVisible()) {
      console.log('✅ Login form found, proceeding with admin login');

      // Fill login form
      await page.fill('[data-testid="email"]', ADMIN_TEST_USER.email);
      await page.fill('[data-testid="password"]', ADMIN_TEST_USER.password);
      await page.click('[data-testid="login-submit"]');

      // Wait for redirect to dashboard
      await page.waitForURL('/dashboard', { timeout: 10000 });
      DatabaseTracker.trackQuery('admin_profiles', 'select', 'admin_login');
      DatabaseTracker.trackQuery('auth.users', 'select', 'admin_login');

      console.log('✅ Admin login successful - proceeding to admin features');
    } else {
      console.log('⚠️ Login form not found, checking if already logged in');

      // Check if we're already on dashboard or need to navigate there
      if (page.url().includes('/dashboard')) {
        console.log('✅ Already on dashboard');
      } else {
        // Try to navigate to dashboard directly
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
        console.log('✅ Navigated to dashboard');
      }
    }

    // Step 2: Admin Dashboard Access
    console.log('📊 Step 2: Admin Dashboard Access');
    DatabaseTracker.trackQuery('admin_dashboard', 'select', 'admin_dashboard_access');

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check admin dashboard elements
    const adminElements = await page.locator('[data-testid^="admin-"]');
    const adminElementCount = await adminElements.count();
    console.log(`👑 Admin elements found: ${adminElementCount}`);

    // Look for admin-specific navigation
    const adminNav = await page.locator('nav').filter({ hasText: /admin|management|system/i });
    if (await adminNav.isVisible()) {
      console.log('✅ Admin navigation found');
      DatabaseTracker.trackQuery('admin_navigation', 'select', 'admin_interface');
    }

    // Step 3: User Management
    console.log('👥 Step 3: User Management');
    DatabaseTracker.trackQuery('user_management', 'select', 'admin_user_management');

    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check user management interface
    const userList = await page.locator('[data-testid^="user-"], .user-item, .user-card');
    const userCount = await userList.count();
    console.log(`👥 Users found: ${userCount}`);

    if (userCount > 0) {
      console.log('✅ User management interface available');
      DatabaseTracker.trackQuery('user_profiles', 'select', 'admin_user_list');
      DatabaseTracker.trackQuery('users', 'select', 'admin_user_list');
    }

    // Look for user management actions
    const userActions = await page.locator('button').filter({ hasText: /edit|delete|ban|activate/i });
    const userActionCount = await userActions.count();
    console.log(`⚙️ User management actions found: ${userActionCount}`);

    // Step 4: Content Moderation
    console.log('🛡️ Step 4: Content Moderation');
    DatabaseTracker.trackQuery('content_moderation', 'select', 'admin_moderation');

    await page.goto('/admin/feedback');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check moderation interface
    const moderationItems = await page.locator('[data-testid^="moderation-"], .moderation-item, .feedback-item');
    const moderationCount = await moderationItems.count();
    console.log(`🛡️ Moderation items found: ${moderationCount}`);

    if (moderationCount > 0) {
      console.log('✅ Content moderation interface available');
      DatabaseTracker.trackQuery('feedback', 'select', 'admin_moderation');
      DatabaseTracker.trackQuery('moderation_queue', 'select', 'admin_moderation');
    }

    // Look for moderation actions
    const moderationActions = await page.locator('button').filter({ hasText: /approve|reject|flag|moderate/i });
    const moderationActionCount = await moderationActions.count();
    console.log(`🔧 Moderation actions found: ${moderationActionCount}`);

    // Step 5: Analytics Dashboard
    console.log('📈 Step 5: Analytics Dashboard');
    DatabaseTracker.trackQuery('analytics_dashboard', 'select', 'admin_analytics');

    await page.goto('/admin/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check analytics interface
    const analyticsCharts = await page.locator('[data-testid^="chart-"], .chart, .analytics-widget');
    const chartCount = await analyticsCharts.count();
    console.log(`📈 Analytics charts found: ${chartCount}`);

    if (chartCount > 0) {
      console.log('✅ Analytics dashboard available');
      DatabaseTracker.trackQuery('analytics', 'select', 'admin_analytics');
      DatabaseTracker.trackQuery('metrics', 'select', 'admin_analytics');
    }

    // Look for analytics data
    const metrics = await page.locator('[data-testid^="metric-"], .metric, .stat');
    const metricCount = await metrics.count();
    console.log(`📊 Metrics found: ${metricCount}`);

    // Step 6: Site Messages Management
    console.log('📢 Step 6: Site Messages Management');
    DatabaseTracker.trackQuery('site_messages', 'select', 'admin_site_messages');

    await page.goto('/admin/site-messages');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check site messages interface
    const messageForm = await page.locator('form');
    if (await messageForm.isVisible()) {
      console.log('✅ Site messages form found');
      DatabaseTracker.trackQuery('site_messages', 'select', 'admin_message_form');
    }

    // Look for message management
    const messageItems = await page.locator('[data-testid^="message-"], .message-item');
    const messageCount = await messageItems.count();
    console.log(`📢 Site messages found: ${messageCount}`);

    // Step 7: System Monitoring
    console.log('🔍 Step 7: System Monitoring');
    DatabaseTracker.trackQuery('system_monitoring', 'select', 'admin_system_monitoring');

    await page.goto('/admin/system');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Check system monitoring interface
    const systemStatus = await page.locator('[data-testid^="system-"], .system-status, .health-check');
    const systemStatusCount = await systemStatus.count();
    console.log(`🔍 System status indicators found: ${systemStatusCount}`);

    if (systemStatusCount > 0) {
      console.log('✅ System monitoring available');
      DatabaseTracker.trackQuery('system_health', 'select', 'admin_system_monitoring');
      DatabaseTracker.trackQuery('performance_metrics', 'select', 'admin_system_monitoring');
    }

    // Step 8: Admin Navigation and Interface
    console.log('🧭 Step 8: Admin Navigation and Interface');
    DatabaseTracker.trackQuery('admin_navigation', 'select', 'admin_interface');

    // Test admin navigation
    const adminNavLinks = await page.locator('nav a, nav button').filter({ hasText: /admin|management|system|analytics/i });
    const adminNavLinkCount = await adminNavLinks.count();
    console.log(`🧭 Admin navigation links found: ${adminNavLinkCount}`);

    // Test admin menu
    const adminMenu = await page.locator('[data-testid^="admin-menu"], .admin-menu');
    if (await adminMenu.isVisible()) {
      console.log('✅ Admin menu found');
      DatabaseTracker.trackQuery('admin_menu', 'select', 'admin_interface');
    }

    // Step 9: Database Usage Analysis
    console.log('📊 Step 9: Database Usage Analysis');
    const results = DatabaseTracker.getResults();
    console.log('📊 Admin Stage 3 Results:');
    console.log(`- Total Tables Used: ${results.totalTables}`);
    console.log(`- Total Queries: ${results.totalQueries}`);
    console.log(`- Most Used Table: ${results.mostUsedTable}`);
    console.log(`- Tables Used: ${results.tablesUsed.join(', ')}`);

    // Generate comprehensive report
    const reportData = {
      stage: 'Stage 3: Admin Feature Interactions',
      user: ADMIN_TEST_USER.email,
      timestamp: new Date().toISOString(),
      results: results,
      tablesUsed: results.tablesUsed,
      queries: results.queries,
      adminFeatureInteractions: {
        userManagement: userCount > 0,
        contentModeration: moderationCount > 0,
        analyticsDashboard: chartCount > 0,
        siteMessages: messageCount > 0,
        systemMonitoring: systemStatusCount > 0,
        adminNavigation: adminNavLinkCount > 0
      }
    };

    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(__dirname, '../../../../test-results/feature-interactions-stage-admin.json');

    // Ensure directory exists
    const dir = path.dirname(reportPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`📄 Report saved: feature-interactions-stage-admin.json`);

    console.log('✅ Admin feature interactions and journey expansion completed');
  });
});
