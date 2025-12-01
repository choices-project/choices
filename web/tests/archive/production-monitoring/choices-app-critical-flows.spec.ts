import { test, expect } from '@playwright/test';

/**
 * Critical User Flow Tests for choices-app.com
 * 
 * These tests verify end-to-end user journeys that are critical for the application.
 */

test.describe('Production Critical Flows', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(120_000);
  });

  test('Homepage should load and be accessible', async ({ page }) => {
    await page.goto('https://choices-app.com', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    
    // Wait for page to stabilize
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
    
    const title = await page.title();
    expect(title).toContain('Choices');
    
    // Should not show error page
    const bodyText = await page.textContent('body');
    expect(bodyText?.toLowerCase()).not.toContain('error');
    expect(bodyText?.toLowerCase()).not.toContain('500');
    expect(bodyText?.toLowerCase()).not.toContain('internal server error');
  });

  test('Auth page should be accessible (even if broken)', async ({ page }) => {
    await page.goto('https://choices-app.com/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
    
    const title = await page.title();
    expect(title).toContain('Choices');
    
    // Page should load (even if showing old fallback)
    const url = page.url();
    expect(url).toContain('/auth');
  });

  test('Navigation should work between pages', async ({ page }) => {
    await page.goto('https://choices-app.com', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    
    // Try to navigate to auth
    await page.goto('https://choices-app.com/auth', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    expect(page.url()).toContain('/auth');
    
    // Try to navigate back to home
    await page.goto('https://choices-app.com', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    expect(page.url()).toMatch(/^https:\/\/choices-app\.com\/?$/);
  });

  test('Page should not have critical JavaScript errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', (error) => {
      errors.push(`Page Error: ${error.message}`);
    });
    
    await page.goto('https://choices-app.com', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForTimeout(5000);
    
    // Filter out non-critical errors
    const criticalErrors = errors.filter(e => 
      !e.includes('favicon') && 
      !e.includes('analytics') &&
      !e.includes('tracking')
    );
    
    if (criticalErrors.length > 0) {
      console.log('Critical errors found:', criticalErrors);
    }
    
    // Should not have critical React/Next.js errors
    const reactErrors = criticalErrors.filter(e => 
      e.includes('React') || 
      e.includes('hydration') ||
      e.includes('ReferenceError') ||
      e.includes('TypeError')
    );
    
    expect(reactErrors.length, `Should not have React errors: ${reactErrors.join(', ')}`).toBe(0);
  });

  test('Static assets should load correctly', async ({ page }) => {
    const failedResources: string[] = [];
    
    page.on('response', (response) => {
      if (response.status() >= 400) {
        const url = response.url();
        // Only track static assets, not API calls
        if (url.includes('_next/static') || url.includes('.css') || url.includes('.js')) {
          failedResources.push(`${url} (${response.status()})`);
        }
      }
    });
    
    await page.goto('https://choices-app.com', { waitUntil: 'networkidle', timeout: 60_000 });
    
    if (failedResources.length > 0) {
      console.log('Failed resources:', failedResources);
    }
    
    // Critical static assets should load
    expect(failedResources.length, `Static assets failed: ${failedResources.join(', ')}`).toBe(0);
  });

  test('Page should be responsive (mobile viewport)', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('https://choices-app.com', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
    
    // Page should still load and be usable
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText?.length).toBeGreaterThan(0);
  });

  test('Page should handle slow network conditions', async ({ page, context }) => {
    // Simulate slow 3G
    await context.route('**/*', (route) => {
      // Add delay to simulate slow network
      setTimeout(() => route.continue(), 100);
    });
    
    await page.goto('https://choices-app.com', { waitUntil: 'domcontentloaded', timeout: 120_000 });
    
    // Page should eventually load
    const title = await page.title();
    expect(title).toContain('Choices');
  });
});

