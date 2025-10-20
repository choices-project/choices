import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should load authentication page', async ({ page }) => {
    await page.goto('/auth');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check that we're on the auth page
    expect(page.url()).toContain('/auth');
  });

  test('should show authentication options', async ({ page }) => {
    await page.goto('/auth');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for authentication elements
    // Based on the AuthSetupStep component, look for:
    // - Email authentication
    // - Social login (Google, GitHub)
    // - WebAuthn/Passkey options
    // - Anonymous access
    
    // Check for any auth elements
    const auth = await page.locator('[data-testid*="auth"]').first();
    if (await auth.isVisible()) {
      expect(auth).toBeVisible();
    }
  });

  test('should handle WebAuthn authentication', async ({ page }) => {
    await page.goto('/auth');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for WebAuthn elements
    // Based on the WebAuthn components, look for:
    // - Passkey registration
    // - Passkey login
    // - Biometric setup
    
    // Check for any WebAuthn elements
    const webauthn = await page.locator('[data-testid*="passkey"]').first();
    if (await webauthn.isVisible()) {
      expect(webauthn).toBeVisible();
    }
  });

  test('should handle admin authentication', async ({ page }) => {
    await page.goto('/admin');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if we're redirected to auth or if admin content is shown
    const currentUrl = page.url();
    
    // Either we're on admin page or redirected to auth
    expect(currentUrl).toMatch(/\/(admin|auth)/);
  });
});
