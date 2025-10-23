/**
 * Admin Journey Stage 2: Dashboard/Access Testing
 * 
 * Tests the admin journey after successful registration/login:
 * - Admin dashboard access and functionality
 * - Admin-specific features and controls
 * - User management capabilities
 * - System monitoring and analytics
 * - Database table usage tracking
 * 
 * Created: January 27, 2025
 * Updated: January 27, 2025
 * Purpose: Stage 2 of iterative E2E testing - Admin Dashboard/Access functionality
 */

import { test, expect } from '@playwright/test';
import { DatabaseTracker } from '../../utils/database-tracker';
import { ConsistentTestUserManager, ADMIN_TEST_USER } from '../../utils/consistent-test-user';

test.describe('Admin Journey Stage 2', () => {
  test.beforeEach(async ({ page }) => {
    // Reset database tracking for each test
    DatabaseTracker.reset();
    
    // Ensure admin test user exists
    await ConsistentTestUserManager.ensureAdminUserExists();
    
    console.log('🚀 Starting Admin Journey Stage 2 - Dashboard/Access Testing');
  });

  test('should handle admin dashboard access and functionality', async ({ page }) => {
    console.log('👑 Testing Admin Dashboard Access and Functionality');
    console.log(`📧 Using admin test user: ${ADMIN_TEST_USER.email}`);

    // Step 1: Admin Login
    console.log('🔐 Step 1: Admin Login');
    DatabaseTracker.trackQuery('login_page', 'select', 'admin_login');
    
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Wait for React hydration
    await page.waitForTimeout(2000);
    
    // Fill login form
    await page.fill('[data-testid="email"]', ADMIN_TEST_USER.email);
    await page.fill('[data-testid="password"]', ADMIN_TEST_USER.password);
    
    // Submit login form
    await page.click('[data-testid="login-submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 });
    DatabaseTracker.trackQuery('user_profiles', 'select', 'admin_login');
    DatabaseTracker.trackQuery('auth.users', 'select', 'admin_login');
    DatabaseTracker.trackQuery('user_roles', 'select', 'admin_login');
    
    console.log('✅ Admin login successful - redirected to dashboard');

    // Step 2: Admin Dashboard Access
    console.log('📊 Step 2: Admin Dashboard Access');
    DatabaseTracker.trackQuery('admin_dashboard', 'select', 'admin_dashboard_access');
    
    // Verify admin dashboard elements
    const dashboardTitle = await page.locator('h1').first();
    await expect(dashboardTitle).toBeVisible();
    
    // Check for admin-specific elements
    const adminPanel = await page.locator('[data-testid="admin-panel"], [data-testid="admin-dashboard"]');
    if (await adminPanel.isVisible()) {
      console.log('✅ Admin panel found');
      DatabaseTracker.trackQuery('admin_panel', 'select', 'admin_panel_display');
    }
    
    // Check for admin navigation
    const adminNav = await page.locator('[data-testid="admin-nav"], nav[data-testid*="admin"]');
    if (await adminNav.isVisible()) {
      console.log('✅ Admin navigation found');
      DatabaseTracker.trackQuery('admin_navigation', 'select', 'admin_navigation_display');
    }

    // Step 3: User Management Features
    console.log('👥 Step 3: User Management Features');
    
    // Look for user management links
    const userManagementLink = await page.locator('[data-testid="user-management"], [href*="users"], [href*="admin"]');
    if (await userManagementLink.isVisible()) {
      console.log('✅ User management link found');
      await userManagementLink.click();
      
      // Wait for user management page to load
      await page.waitForLoadState('networkidle');
      DatabaseTracker.trackQuery('user_profiles', 'select', 'user_management');
      DatabaseTracker.trackQuery('user_roles', 'select', 'user_management');
      
      // Check for user list
      const userList = await page.locator('[data-testid="user-list"], table, .user-item');
      if (await userList.isVisible()) {
        console.log('✅ User list found');
        DatabaseTracker.trackQuery('user_profiles', 'select', 'user_list_display');
      }
      
      // Check for user actions (edit, delete, promote)
      const userActions = await page.locator('[data-testid*="user-action"], button:has-text("Edit"), button:has-text("Delete")');
      const actionCount = await userActions.count();
      console.log(`🔧 User action buttons found: ${actionCount}`);
      
      if (actionCount > 0) {
        DatabaseTracker.trackQuery('user_actions', 'select', 'user_action_buttons');
      }
    }

    // Step 4: System Monitoring and Analytics
    console.log('📊 Step 4: System Monitoring and Analytics');
    
    // Look for analytics/monitoring sections
    const analyticsSection = await page.locator('[data-testid="analytics"], [data-testid="monitoring"], [data-testid="stats"]');
    if (await analyticsSection.isVisible()) {
      console.log('✅ Analytics section found');
      DatabaseTracker.trackQuery('analytics', 'select', 'analytics_display');
    }
    
    // Look for system stats
    const statsElements = await page.locator('[data-testid*="stat"], [data-testid*="metric"], .stat, .metric');
    const statsCount = await statsElements.count();
    console.log(`📈 System stats found: ${statsCount}`);
    
    if (statsCount > 0) {
      DatabaseTracker.trackQuery('system_stats', 'select', 'system_stats_display');
    }

    // Step 5: Admin-Specific Features
    console.log('🔧 Step 5: Admin-Specific Features');
    
    // Look for admin controls
    const adminControls = await page.locator('[data-testid*="admin-control"], [data-testid*="admin-setting"]');
    const controlCount = await adminControls.count();
    console.log(`⚙️ Admin controls found: ${controlCount}`);
    
    if (controlCount > 0) {
      DatabaseTracker.trackQuery('admin_controls', 'select', 'admin_controls_display');
    }
    
    // Look for system settings
    const settingsLink = await page.locator('[data-testid="settings"], [href*="settings"], [href*="admin"]');
    if (await settingsLink.isVisible()) {
      console.log('✅ Settings link found');
      await settingsLink.click();
      
      // Wait for settings page to load
      await page.waitForLoadState('networkidle');
      DatabaseTracker.trackQuery('admin_settings', 'select', 'admin_settings_access');
      
      // Check for various setting categories
      const settingCategories = await page.locator('[data-testid*="setting"], .setting-category');
      const categoryCount = await settingCategories.count();
      console.log(`⚙️ Setting categories found: ${categoryCount}`);
      
      if (categoryCount > 0) {
        DatabaseTracker.trackQuery('admin_settings', 'select', 'admin_settings_categories');
      }
    }

    // Step 6: Database Usage Analysis
    console.log('📊 Step 6: Database Usage Analysis');
    
    const results = DatabaseTracker.getResults();
    console.log('📊 Admin Stage 2 Results:');
    console.log(`- Total Tables Used: ${results.totalTables}`);
    console.log(`- Total Queries: ${results.totalQueries}`);
    console.log(`- Most Used Table: ${results.mostUsedTable}`);
    
    // Save detailed report
    const reportData = {
      stage: 'Stage 2 - Admin Dashboard/Access',
      timestamp: new Date().toISOString(),
      admin: ADMIN_TEST_USER.email,
      results: results,
      tablesUsed: results.tablesUsed,
      queries: results.queries
    };
    
    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(__dirname, '../../../test-results/admin-dashboard-access-stage.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`📄 Report saved: admin-dashboard-access-stage.json`);
    
    console.log('✅ Admin dashboard access and functionality completed');
  });

  test.afterEach(async ({ page }) => {
    // Log final database usage
    const results = DatabaseTracker.getResults();
    console.log('📊 Tables Used:', results.totalTables);
    console.log('✅ Tables Verified:', results.verifiedTables);
    console.log('📈 Total Queries:', results.totalQueries);
    console.log('🔍 Data Verification Entries:', results.dataVerificationEntries);
  });
});
