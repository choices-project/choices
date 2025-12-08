import { test, expect } from '@playwright/test';

/**
 * Health Check Tests for choices-app.com
 * 
 * These tests verify that React is properly initializing and components are rendering
 * correctly in production. They help identify issues with hydration, client-side rendering,
 * and component loading.
 */

test.describe('Production Health Checks', () => {
  test.beforeEach(async ({ page }) => {
    // Set a longer timeout for production tests
    test.setTimeout(60_000);
  });

  test('Auth page should have React initialized', async ({ page }) => {
    await page.goto('https://choices-app.com/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    
    // Wait for React to potentially hydrate
    await page.waitForTimeout(3000);
    
    // Check if React root exists
    const hasReactRoot = await page.evaluate(() => {
      // Check for React root element
      const root = document.getElementById('__next') || document.querySelector('[data-reactroot]');
      if (!root) return false;
      
      // Check if React has initialized by looking for React internals
      // @ts-ignore
      const reactRoot = root._reactRootContainer || root._reactInternalInstance;
      return !!reactRoot || !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    });
    
    expect(hasReactRoot, 'React root should exist').toBeTruthy();
  });

  test('Auth page should have email input field', async ({ page }) => {
    await page.goto('https://choices-app.com/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    
    // Wait for potential client-side rendering
    await page.waitForTimeout(5000);
    
    // Try multiple selector strategies
    const emailSelectors = [
      '#email',
      'input[name="email"]',
      'input[type="email"]',
      '[data-testid="login-email"]',
    ];
    
    let found = false;
    for (const selector of emailSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 5000 })) {
          found = true;
          break;
        }
      } catch {
        // Continue to next selector
      }
    }
    
    if (!found) {
      // Take screenshot for debugging
      await page.screenshot({ path: 'test-results/auth-page-no-email.png', fullPage: true });
      const pageContent = await page.textContent('body');
      throw new Error(`Email input not found. Page content: ${pageContent?.substring(0, 500)}`);
    }
    
    expect(found, 'Email input field should be present').toBeTruthy();
  });

  test('Auth page should have password input field', async ({ page }) => {
    await page.goto('https://choices-app.com/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    
    // Wait for potential client-side rendering
    await page.waitForTimeout(5000);
    
    // Try multiple selector strategies
    const passwordSelectors = [
      '#password',
      'input[name="password"]',
      'input[type="password"]',
      '[data-testid="login-password"]',
    ];
    
    let found = false;
    for (const selector of passwordSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 5000 })) {
          found = true;
          break;
        }
      } catch {
        // Continue to next selector
      }
    }
    
    expect(found, 'Password input field should be present').toBeTruthy();
  });

  test('Auth page should not show old static fallback', async ({ page }) => {
    await page.goto('https://choices-app.com/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    
    // Wait for potential client-side rendering
    await page.waitForTimeout(5000);
    
    const pageText = await page.textContent('body');
    
    // The old static fallback had these specific texts
    const oldFallbackIndicators = [
      'Please log in to continue',
      'Go to Dashboard', // Old component had this
    ];
    
    // Check if we see the old component's text without the new form
    const hasOldText = oldFallbackIndicators.some(text => pageText?.includes(text));
    const hasEmailInput = await page.locator('#email, input[name="email"]').count() > 0;
    
    if (hasOldText && !hasEmailInput) {
      await page.screenshot({ path: 'test-results/auth-page-old-fallback.png', fullPage: true });
      throw new Error('Old static fallback component is being rendered instead of the new form');
    }
    
    expect(hasEmailInput, 'New auth form should be present, not old fallback').toBeTruthy();
  });

  test('API site-messages should not return 401', async ({ request }) => {
    const response = await request.get('https://choices-app.com/api/site-messages');
    
    // Should not be 401 (unauthorized)
    expect(response.status(), 'Site messages API should not return 401').not.toBe(401);
    
    // Should be either 200 (success) or 500 (server error, but not auth error)
    expect([200, 500]).toContain(response.status());
    
    if (response.ok()) {
      const data = await response.json();
      expect(data).toHaveProperty('success');
    }
  });

  test('Dashboard API should require authentication', async ({ request }) => {
    // Make request without authentication
    const response = await request.get('https://choices-app.com/api/dashboard/data');
    
    // Should return 401 when not authenticated (this is expected behavior)
    expect(response.status(), 'Dashboard API should return 401 when not authenticated').toBe(401);
  });
});

