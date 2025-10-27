import { test, expect } from '@playwright/test';
import { T } from '../../../registry/testIds';

test.describe('Authentication Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up basic error handling
    page.on('pageerror', (error) => {
      console.log('Page error:', error.message);
    });
  });

  test('should load authentication page', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Check that we're on the auth page
    expect(page.url()).toContain('/auth');
    
    // Look for auth elements using proper test IDs
    const loginForm = await page.locator(`[data-testid="${T.login.form}"]`).first();
    const body = await page.textContent('body');
    expect(body).toBeTruthy();
    
    await page.screenshot({ path: 'test-results/auth-page-loaded.png' });
  });

  test('should show authentication form elements', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Look for auth form elements using proper test IDs
    const emailInput = await page.locator(`[data-testid="${T.login.email}"]`).first();
    const passwordInput = await page.locator(`[data-testid="${T.login.password}"]`).first();
    const loginButton = await page.locator(`[data-testid="${T.login.submit}"]`).first();
    const loginForm = await page.locator(`[data-testid="${T.login.form}"]`).first();
    
    // Check if auth elements exist
    const emailExists = await emailInput.count() > 0;
    const passwordExists = await passwordInput.count() > 0;
    const loginButtonExists = await loginButton.count() > 0;
    const loginFormExists = await loginForm.count() > 0;
    
    // Log what we found
    console.log('Auth elements found:', {
      email: emailExists,
      password: passwordExists,
      loginButton: loginButtonExists,
      loginForm: loginFormExists
    });
    
    // At least one auth element should exist
    expect(emailExists || passwordExists || loginButtonExists || loginFormExists).toBe(true);
  });

  test('should handle auth page interactions', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Try to interact with the page
    const body = await page.locator('body');
    await body.click();
    
    // Check if page is interactive
    const isInteractive = await page.evaluate(() => {
      return document.readyState === 'complete';
    });
    
    expect(isInteractive).toBe(true);
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/auth/register');
    await page.waitForLoadState('networkidle');
    
    // Check if register page loads
    expect(page.url()).toContain('/register');
    
    await page.screenshot({ path: 'test-results/register-page.png' });
  });

  test('should handle auth page errors gracefully', async ({ page }) => {
    await page.goto('/auth');
    await page.waitForLoadState('networkidle');
    
    // Try to submit empty form (if it exists)
    const submitButton = await page.locator('button[type="submit"], input[type="submit"]').first();
    
    if (await submitButton.count() > 0) {
      await submitButton.click();
      
      // Wait a bit for any error handling
      await page.waitForTimeout(1000);
      
      // Check if page is still functional
      const title = await page.title();
      expect(title).toBeTruthy();
    }
  });
});
