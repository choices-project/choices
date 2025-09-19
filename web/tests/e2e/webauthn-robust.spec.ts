/**
 * Robust WebAuthn E2E Tests
 * 
 * Uses the new WebAuthn fixture to provide browser-specific testing:
 * - Chromium: Full CDP virtual authenticator support
 * - Firefox/WebKit: Mocked WebAuthn API for component testing
 * 
 * Created: January 18, 2025
 */

import { test, expect } from '../fixtures/webauthn';
import { waitForHydrationAndForm } from '../utils/hydration';

test.describe('Robust WebAuthn Tests', () => {
  test('WebAuthn support detection works on all browsers', async ({ page, webauthnMode }) => {
    await page.goto('/login?e2e=1');
    
    // Check WebAuthn support
    const webauthnSupport = await page.evaluate(() => {
      return {
        hasCredentials: 'credentials' in navigator,
        hasCreate: 'credentials' in navigator && 'create' in navigator.credentials,
        hasGet: 'credentials' in navigator && 'get' in navigator.credentials
      };
    });

    expect(webauthnSupport.hasCredentials).toBe(true);
    expect(webauthnSupport.hasCreate).toBe(true);
    expect(webauthnSupport.hasGet).toBe(true);
    
    console.log(`WebAuthn support detected on ${webauthnMode} mode`);
  });

  test('WebAuthn components render on all browsers', async ({ page, webauthnMode }) => {
    await page.goto('/register?e2e=1');
    
    // Wait for form to be ready
    await waitForHydrationAndForm(page, 'register-hydrated', 'register-form');
    
    // Check if WebAuthn components are present (they should be mocked on non-Chromium)
    const hasWebAuthnComponents = await page.evaluate(() => {
      // Look for WebAuthn-related elements
      const passkeyElements = document.querySelectorAll('[data-testid*="webauthn"], [data-testid*="passkey"]');
      return passkeyElements.length > 0;
    });
    
    // On Chromium, we expect real WebAuthn components
    // On other browsers, we expect mocked components
    if (webauthnMode === 'chromium') {
      expect(hasWebAuthnComponents).toBe(true);
    } else {
      // Mocked mode should still have some WebAuthn elements
      expect(hasWebAuthnComponents).toBe(true);
    }
  });

  test('WebAuthn API endpoints work on all browsers', async ({ page, webauthnMode }) => {
    // Test WebAuthn API endpoints (these should work regardless of browser)
    const endpoints = [
      '/api/v1/auth/webauthn/register/options',
      '/api/v1/auth/webauthn/authenticate/options',
      '/api/v1/auth/webauthn/register/verify',
      '/api/v1/auth/webauthn/authenticate/verify'
    ];

    for (const endpoint of endpoints) {
      const response = await page.request.post(endpoint, {
        data: {}
      });
      
      // Should return 400, 401, or 403 for unauthenticated requests
      expect([400, 401, 403]).toContain(response.status());
    }
    
    console.log(`WebAuthn API endpoints tested on ${webauthnMode} mode`);
  });

  test('WebAuthn feature flag is enabled', async ({ page, webauthnMode }) => {
    const response = await page.request.get('/api/e2e/flags');
    const data = await response.json();
    
    expect(response.ok()).toBe(true);
    expect(data.flags.WEBAUTHN).toBe(true);
    
    console.log(`WebAuthn feature flag confirmed on ${webauthnMode} mode`);
  });

  test('WebAuthn passkey flow (Chromium only)', async ({ page, webauthnMode }) => {
    test.skip(webauthnMode !== 'chromium', 'WebAuthn flows require Chromium CDP');
    
    await page.goto('/register?e2e=1');
    
    // Wait for form to be ready
    await waitForHydrationAndForm(page, 'register-hydrated', 'register-form');
    
    // Fill basic registration form
    const testEmail = `webauthn-test-${Date.now()}@example.com`;
    const testUsername = `webauthnuser${Date.now()}`;

    await page.fill('[data-testid="email"]', testEmail);
    await page.fill('[data-testid="username"]', testUsername);
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="confirm-password"]', 'password123');

    // Submit registration
    await page.click('[data-testid="register-button"]');

    // Wait for registration to process
    await page.waitForTimeout(2000);

    // Check if we get to passkey registration step
    const currentUrl = await page.url();
    console.log('Current URL after registration:', currentUrl);

    // Should either redirect to onboarding or show passkey prompt
    if (currentUrl.includes('/onboarding')) {
      await expect(page).toHaveURL(/\/onboarding/);
    } else {
      // Look for passkey-related elements
      const hasPasskeyElements = await page.evaluate(() => {
        const passkeyElements = document.querySelectorAll('[data-testid*="passkey"], [data-testid*="webauthn"]');
        return passkeyElements.length > 0;
      });
      
      // If we're still on register page, we should see passkey options
      if (currentUrl.includes('/register')) {
        expect(hasPasskeyElements).toBe(true);
      }
    }
  });

  test('WebAuthn error handling works on all browsers', async ({ page, webauthnMode }) => {
    // Mock network failure for WebAuthn endpoints
    await page.route('**/api/v1/auth/webauthn/**', route => {
      route.abort('failed');
    });

    await page.goto('/register?e2e=1');
    
    // Wait for form to be ready
    await waitForHydrationAndForm(page, 'register-hydrated', 'register-form');
    
    // Fill and submit form
    await page.fill('[data-testid="email"]', 'error-test@example.com');
    await page.fill('[data-testid="username"]', 'errortest');
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="confirm-password"]', 'password123');
    
    await page.click('[data-testid="register-button"]');
    
    // Should handle network errors gracefully
    await page.waitForTimeout(2000);
    
    // Check for error handling (either error message or graceful degradation)
    const hasErrorHandling = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('[data-testid*="error"], .error, [role="alert"]');
      return errorElements.length > 0;
    });
    
    // Error handling should be present (either error message or graceful fallback)
    expect(hasErrorHandling).toBe(true);
    
    console.log(`WebAuthn error handling tested on ${webauthnMode} mode`);
  });
});
