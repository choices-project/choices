/**
 * Debug Login Test
 * 
 * Simple test to debug login page issues
 */

import { test, expect } from '@playwright/test';
import { waitForPageReady } from './helpers/e2e-setup';

test.describe('Debug Login', () => {
  test('should be able to access login page', async ({ page }) => {
    console.log('🧪 Testing login page access...');
    
    // Try to access login page with e2e parameter
    console.log('🧪 Trying to access login page with e2e=1...');
    await page.goto('/login?e2e=1');
    console.log('🧪 Navigated to /login?e2e=1, current URL:', page.url());
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    console.log('🧪 Page loaded, current URL:', page.url());
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-login.png' });
    console.log('🧪 Screenshot saved as debug-login.png');
    
    // Check if we can see the page title
    const title = await page.title();
    console.log('🧪 Page title:', title);
    
    // Check if login form exists
    const loginForm = page.locator('[data-testid="login-form"]');
    const formExists = await loginForm.count() > 0;
    console.log('🧪 Login form exists:', formExists);
    
    // Check if email input exists
    const emailInput = page.locator('[data-testid="login-email"]');
    const emailExists = await emailInput.count() > 0;
    console.log('🧪 Email input exists:', emailExists);
    
    // Check page content
    const bodyText = await page.textContent('body');
    console.log('🧪 Body text (first 200 chars):', bodyText?.substring(0, 200));
    
    // Basic assertions
    expect(page.url()).toContain('/login');
    expect(formExists).toBe(true);
    expect(emailExists).toBe(true);
  });
});
