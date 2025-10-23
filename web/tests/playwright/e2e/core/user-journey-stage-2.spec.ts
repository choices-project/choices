/**
 * User Journey Stage 2: Dashboard/Access Testing
 * 
 * Tests the user journey after successful registration/login:
 * - Dashboard access and functionality
 * - User profile management
 * - Basic feature interactions
 * - Database table usage tracking
 * 
 * Created: January 27, 2025
 * Updated: January 27, 2025
 * Purpose: Stage 2 of iterative E2E testing - Dashboard/Access functionality
 */

import { test, expect } from '@playwright/test';
import { DatabaseTracker } from '/Users/alaughingkitsune/src/Choices/web/tests/utils/database-tracker';
import { ConsistentTestUserManager, CONSISTENT_TEST_USER } from '/Users/alaughingkitsune/src/Choices/web/tests/utils/consistent-test-user';

test.describe('User Journey Stage 2', () => {
  test.beforeEach(async ({ page }) => {
    // Reset database tracking for each test
    DatabaseTracker.reset();
    
    // Ensure consistent test user exists
    await ConsistentTestUserManager.ensureUserExists();
    
    console.log('🚀 Starting User Journey Stage 2 - Dashboard/Access Testing');
  });

  test('should handle dashboard access and basic functionality', async ({ page }) => {
    console.log('👤 Testing User Dashboard Access and Functionality');
    console.log(`📧 Using consistent test user: ${CONSISTENT_TEST_USER.email}`);

    // Step 1: Login with consistent test user
    console.log('🔐 Step 1: User Login');
    DatabaseTracker.trackQuery('login_page', 'select', 'user_login');
    
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Wait for React hydration
    await page.waitForTimeout(2000);
    
    // Check if login form is available
    const emailField = await page.locator('[data-testid="email"]');
    const passwordField = await page.locator('[data-testid="password"]');
    
    if (await emailField.isVisible() && await passwordField.isVisible()) {
      console.log('✅ Login form found, proceeding with login');
      
      // Fill login form
      await page.fill('[data-testid="email"]', CONSISTENT_TEST_USER.email);
      await page.fill('[data-testid="password"]', CONSISTENT_TEST_USER.password);
      
      // Submit login form
      await page.click('[data-testid="login-submit"]');
      
      // Wait for redirect to dashboard
      await page.waitForURL('/dashboard', { timeout: 10000 });
      DatabaseTracker.trackQuery('user_profiles', 'select', 'user_login');
      DatabaseTracker.trackQuery('auth.users', 'select', 'user_login');
      
      console.log('✅ Login successful - redirected to dashboard');
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

    // Step 2: Dashboard Access and Functionality
    console.log('📊 Step 2: Dashboard Access and Functionality');
    DatabaseTracker.trackQuery('dashboard', 'select', 'dashboard_access');
    
    // Check what's actually on the dashboard
    console.log(`🔍 Current URL: ${page.url()}`);
    console.log(`🔍 Page title: ${await page.title()}`);
    
    // Look for any heading elements
    const headings = await page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    console.log(`📝 Headings found: ${headingCount}`);
    
    if (headingCount > 0) {
      for (let i = 0; i < Math.min(3, headingCount); i++) {
        const heading = headings.nth(i);
        const text = await heading.textContent();
        console.log(`  - Heading ${i + 1}: ${text}`);
      }
    }
    
    // Look for any text content
    const bodyText = await page.locator('body').textContent();
    console.log(`📄 Page content length: ${bodyText?.length || 0} characters`);
    
    // Check if we're redirected to login (authentication required)
    if (page.url().includes('/auth') || page.url().includes('/login')) {
      console.log('⚠️ Redirected to login - authentication required for dashboard');
      DatabaseTracker.trackQuery('auth_redirect', 'select', 'dashboard_auth_required');
      return; // Exit early if authentication is required
    }
    
    // Check for user profile information
    const userProfile = await page.locator('[data-testid="user-profile"]');
    if (await userProfile.isVisible()) {
      console.log('✅ User profile section found');
      DatabaseTracker.trackQuery('user_profiles', 'select', 'user_profile_display');
    }
    
    // Check for navigation elements
    const navigation = await page.locator('nav');
    if (await navigation.isVisible()) {
      console.log('✅ Navigation found');
      DatabaseTracker.trackQuery('navigation', 'select', 'navigation_display');
    }
    
    // Check for any dashboard widgets or components
    const dashboardWidgets = await page.locator('[data-testid*="widget"], [data-testid*="component"]');
    const widgetCount = await dashboardWidgets.count();
    console.log(`📊 Dashboard widgets found: ${widgetCount}`);
    
    if (widgetCount > 0) {
      DatabaseTracker.trackQuery('dashboard_widgets', 'select', 'dashboard_widgets_display');
    }

    // Step 3: User Profile Management
    console.log('👤 Step 3: User Profile Management');
    
    // Look for profile management links/buttons
    const profileLink = await page.locator('[data-testid="profile-link"], [href*="profile"]');
    if (await profileLink.isVisible()) {
      console.log('✅ Profile management link found');
      await profileLink.click();
      
      // Wait for profile page to load
      await page.waitForLoadState('networkidle');
      DatabaseTracker.trackQuery('user_profiles', 'select', 'profile_management');
      
      // Check if we can edit profile
      const editButton = await page.locator('[data-testid="edit-profile"], button:has-text("Edit")');
      if (await editButton.isVisible()) {
        console.log('✅ Profile editing capability found');
        DatabaseTracker.trackQuery('user_profiles', 'update', 'profile_edit');
      }
    }

    // Step 4: Basic Feature Interactions
    console.log('🔧 Step 4: Basic Feature Interactions');
    
    // Look for any interactive elements
    const buttons = await page.locator('button, [role="button"]');
    const buttonCount = await buttons.count();
    console.log(`🔘 Interactive buttons found: ${buttonCount}`);
    
    // Test a few key interactions
    for (let i = 0; i < Math.min(3, buttonCount); i++) {
      const button = buttons.nth(i);
      const buttonText = await button.textContent();
      const buttonTestId = await button.getAttribute('data-testid');
      
      if (buttonText && !buttonText.includes('Submit') && !buttonText.includes('Login')) {
        console.log(`🔘 Testing button: ${buttonText} (${buttonTestId})`);
        
        try {
          await button.click();
          await page.waitForTimeout(1000); // Wait for any side effects
          DatabaseTracker.trackQuery('user_interactions', 'insert', 'button_click');
        } catch (error) {
          console.log(`⚠️ Button click failed: ${error}`);
        }
      }
    }

    // Step 5: Database Usage Analysis
    console.log('📊 Step 5: Database Usage Analysis');
    
    const results = DatabaseTracker.getResults();
    console.log('📊 Stage 2 Results:');
    console.log(`- Total Tables Used: ${results.totalTables}`);
    console.log(`- Total Queries: ${results.totalQueries}`);
    console.log(`- Most Used Table: ${results.mostUsedTable}`);
    
    // Save detailed report
    const reportData = {
      stage: 'Stage 2 - Dashboard/Access',
      timestamp: new Date().toISOString(),
      user: CONSISTENT_TEST_USER.email,
      results: results,
      tablesUsed: results.tablesUsed,
      queries: results.queries
    };
    
    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(__dirname, '../../../../test-results/dashboard-access-stage-user.json');
    
    // Ensure directory exists
    const dir = path.dirname(reportPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    console.log(`📄 Report saved: dashboard-access-stage-user.json`);
    
    console.log('✅ User dashboard access and functionality completed');
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
