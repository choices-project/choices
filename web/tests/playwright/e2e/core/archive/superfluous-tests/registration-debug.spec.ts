/**
 * Registration Debug Test
 * 
 * Simple test to debug registration flow and identify redirect issues.
 * 
 * Created: October 23, 2025
 * Status: ✅ ACTIVE
 */

import { test, expect } from '@playwright/test';
import { DatabaseTracker } from '../../../utils/database-tracker';
import { CONSISTENT_TEST_USER } from '../../../utils/consistent-test-user';

test.describe('Registration Debug', () => {
  test.beforeEach(async ({ page }) => {
    // Initialize database tracking
    DatabaseTracker.reset();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://muqwrehywjrbaeerjgfb.supabase.co';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_tJOpGO2IPjujJDQou44P_g_BgbTFBfc';
    DatabaseTracker.initializeSupabase(supabaseUrl, supabaseKey);
    console.log('🚀 Starting Registration Debug');
  });

  test('should debug registration flow and redirect', async ({ page }) => {
    console.log('🔍 Debugging Registration Flow');

    // Step 1: Navigate to registration page
    console.log('📝 Step 1: Navigate to registration page');
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    console.log('✅ Registration page loaded');

    // Step 2: Select password registration method
    console.log('🔍 Step 2: Select password registration method');
    try {
      const passwordOption = page.locator('button').filter({ hasText: 'Password Account' }).first();
      if (await passwordOption.isVisible()) {
        await passwordOption.click();
        console.log('✅ Password button clicked');
        
        // Wait for the form to appear
        console.log('⏳ Waiting for registration form to appear...');
        await page.waitForSelector('[data-testid="register-form"]', { timeout: 10000 });
        console.log('✅ Registration form appeared');
      }
    } catch (error) {
      console.log(`⚠️ Error selecting password registration: ${error}`);
    }

    // Step 3: Check form elements
    console.log('🔍 Step 3: Check form elements');
    const emailField = await page.locator('[data-testid="email"]').isVisible();
    const passwordField = await page.locator('[data-testid="password"]').isVisible();
    const confirmPasswordField = await page.locator('[data-testid="confirmPassword"]').isVisible();
    const submitButton = await page.locator('[data-testid="register-submit"]').isVisible();
    
    console.log(`📊 Form elements found:`);
    console.log(`  - Email field: ${emailField ? '✅' : '❌'}`);
    console.log(`  - Password field: ${passwordField ? '✅' : '❌'}`);
    console.log(`  - Confirm password field: ${confirmPasswordField ? '✅' : '❌'}`);
    console.log(`  - Submit button: ${submitButton ? '✅' : '❌'}`);

    if (emailField && passwordField && confirmPasswordField && submitButton) {
      console.log('📝 Step 4: Fill and submit registration form');
      
      // Fill form
      await page.fill('[data-testid="email"]', CONSISTENT_TEST_USER.email);
      await page.fill('[data-testid="password"]', CONSISTENT_TEST_USER.password);
      await page.fill('[data-testid="confirmPassword"]', CONSISTENT_TEST_USER.password);
      
      // Check for additional fields
      const usernameField = await page.locator('[data-testid="username"]').isVisible();
      const displayNameField = await page.locator('[data-testid="displayName"]').isVisible();
      
      if (usernameField) {
        await page.fill('[data-testid="username"]', CONSISTENT_TEST_USER.username);
        console.log('✅ Username field filled');
      }
      if (displayNameField) {
        await page.fill('[data-testid="displayName"]', CONSISTENT_TEST_USER.displayName);
        console.log('✅ Display name field filled');
      }
      
      // Submit form
      console.log('🚀 Submitting registration form...');
      await page.click('[data-testid="register-submit"]');
      
      // Wait for response
      await page.waitForTimeout(5000);
      
      // Check current URL
      const currentUrl = page.url();
      console.log(`📊 Current URL after registration: ${currentUrl}`);
      
      // Check for error messages
      const errorMessage = await page.locator('[data-testid="register-error"]').isVisible();
      const successMessage = await page.locator('[data-testid="success-message"]').isVisible();
      
      console.log(`📊 Registration result:`);
      console.log(`  - Error message visible: ${errorMessage ? '❌' : '✅'}`);
      console.log(`  - Success message visible: ${successMessage ? '✅' : '❌'}`);
      
      if (errorMessage) {
        const errorText = await page.locator('[data-testid="register-error"]').textContent();
        console.log(`📊 Error message: ${errorText}`);
      }
      
      if (successMessage) {
        const successText = await page.locator('[data-testid="success-message"]').textContent();
        console.log(`📊 Success message: ${successText}`);
      }
      
      // Check if we're still on register page
      if (currentUrl.includes('/register')) {
        console.log('❌ Still on registration page - redirect failed');
      } else {
        console.log('✅ Redirected away from registration page');
      }
      
    } else {
      console.log('❌ Registration form not found or incomplete');
    }

    // Generate report
    const report = DatabaseTracker.generateReport();
    console.log('📊 Database Usage Report:');
    console.log(`- Total Tables Used: ${report.summary.totalTables}`);
    console.log(`- Total Queries: ${report.summary.totalQueries}`);
    console.log(`- Most Used Table: ${report.summary.mostUsedTable}`);
    
    await DatabaseTracker.saveReport('registration-debug.json');
    
    expect(report.summary.totalTables).toBeGreaterThan(0);
    console.log('✅ Registration debug completed');
  });
});
