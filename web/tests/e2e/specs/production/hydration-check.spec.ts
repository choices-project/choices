import { test, expect } from '@playwright/test';

/**
 * Production Hydration Check Test
 *
 * Verifies that pages render without React hydration mismatch errors (error #185).
 * This test checks the console for hydration errors and ensures pages load correctly.
 */

test.describe('Production Hydration Check', () => {
  test.beforeEach(async ({ context, page }) => {
    // Set up E2E bypass for testing
    await context.addCookies([
      {
        name: 'e2e-dashboard-bypass',
        value: '1',
        domain: '.choices-app.com',
        path: '/',
        httpOnly: false,
        secure: true,
        sameSite: 'None',
      },
    ]);

    // Set up localStorage bypass
    await page.addInitScript(() => {
      window.localStorage.setItem('e2e-dashboard-bypass', '1');
    });
  });

  test('dashboard page renders without hydration errors', async ({ page }) => {
    const consoleMessages: Array<{ type: string; text: string }> = [];
    const consoleErrors: string[] = [];
    const reactErrors: string[] = [];
    const allConsoleLogs: string[] = [];

    // Capture ALL console messages for diagnostics
    page.on('console', (msg) => {
      const text = msg.text();
      const type = msg.type();
      consoleMessages.push({ type, text });
      allConsoleLogs.push(`[${type}] ${text}`);

      if (type === 'error') {
        consoleErrors.push(text);
        if (text.includes('185') || text.includes('hydration') || text.includes('Hydration') || text.includes('React')) {
          reactErrors.push(text);
        }
      }
    });

    page.on('pageerror', (error) => {
      const errorMsg = error.message;
      consoleErrors.push(errorMsg);
      allConsoleLogs.push(`[pageerror] ${errorMsg}`);
      if (errorMsg.includes('185') || errorMsg.includes('hydration')) {
        reactErrors.push(errorMsg);
      }
    });

    // Log page navigation events
    page.on('request', (request) => {
      if (request.url().includes('/dashboard')) {
        allConsoleLogs.push(`[request] ${request.method()} ${request.url()}`);
      }
    });

    await page.goto('https://www.choices-app.com/dashboard', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    // Wait for dashboard to fully render
    await page.waitForSelector('[data-testid="personal-dashboard"]', { timeout: 30000 });
    await page.waitForTimeout(3000); // Allow any async rendering to complete

    // Check for React error #185 specifically
    const hydrationErrors = reactErrors.filter((err) =>
      err.toLowerCase().includes('185') || 
      err.toLowerCase().includes('hydration mismatch') ||
      err.toLowerCase().includes('hydration failed')
    );

    // Enhanced diagnostics: Log all hydration-related errors
    console.log('\n=== HYDRATION DIAGNOSTICS ===');
    console.log(`Total console errors: ${consoleErrors.length}`);
    console.log(`React/hydration errors: ${reactErrors.length}`);
    console.log(`Hydration-specific errors (#185): ${hydrationErrors.length}`);
    
    if (hydrationErrors.length > 0) {
      console.log('\n--- Hydration Errors (#185) ---');
      hydrationErrors.forEach((err, idx) => {
        console.log(`${idx + 1}. ${err.substring(0, 500)}`); // Limit length
      });
    }

    if (reactErrors.length > 0) {
      console.log('\n--- All React/Hydration Related Errors ---');
      reactErrors.forEach((err, idx) => {
        console.log(`${idx + 1}. ${err.substring(0, 300)}`);
      });
    }

    // Check for error messages in the DOM
    const errorText = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const errorMatches = bodyText.match(/React error #185[^\n]*/g);
      return errorMatches || [];
    });
    if (errorText.length > 0) {
      console.log('\n--- Error Text in DOM ---');
      errorText.forEach((text, idx) => {
        console.log(`${idx + 1}. ${text}`);
      });
    }

    // Log first 20 console messages for context
    console.log('\n--- First 20 Console Messages ---');
    allConsoleLogs.slice(0, 20).forEach((msg, idx) => {
      console.log(`${idx + 1}. ${msg}`);
    });

    // Check React error messages in the DOM
    const reactErrorInDOM = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      return bodyText.includes('React error #185') || bodyText.includes('hydration');
    });
    console.log(`\nReact error visible in DOM: ${reactErrorInDOM}`);

    // Check for error boundaries
    const errorBoundaryElements = await page.locator('[data-testid*="error"]').count();
    console.log(`Error boundary elements found: ${errorBoundaryElements}`);

    // Only check for hydration errors - other console errors (network, etc.) are acceptable
    expect(hydrationErrors.length).toBe(0);

    // Verify dashboard content is visible
    await expect(page.locator('[data-testid="personal-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="dashboard-title"]')).toBeVisible();
  });

  test('profile page renders without hydration errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const reactErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        consoleErrors.push(text);
        if (text.includes('185') || text.includes('hydration') || text.includes('Hydration')) {
          reactErrors.push(text);
        }
      }
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
      if (error.message.includes('185') || error.message.includes('hydration')) {
        reactErrors.push(error.message);
      }
    });

    await page.goto('https://www.choices-app.com/profile', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    // Wait for profile page to load (either content or loading state)
    await page.waitForSelector('[data-testid="profile-loading"]', {
      timeout: 30000,
    });
    await page.waitForTimeout(2000); // Allow any async rendering to complete

    // Check for React error #185 specifically
    const hydrationErrors = reactErrors.filter((err) =>
      err.toLowerCase().includes('185') || err.toLowerCase().includes('hydration mismatch')
    );

    // Only check for hydration errors - other console errors (network, etc.) are acceptable
    expect(hydrationErrors.length).toBe(0);
  });

  test('preferences page renders without hydration errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const reactErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        consoleErrors.push(text);
        if (text.includes('185') || text.includes('hydration') || text.includes('Hydration')) {
          reactErrors.push(text);
        }
      }
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
      if (error.message.includes('185') || error.message.includes('hydration')) {
        reactErrors.push(error.message);
      }
    });

    await page.goto('https://www.choices-app.com/profile/preferences', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    // Wait for preferences page to load
    await page.waitForSelector('[data-testid="preferences-loading-auth"]', {
      timeout: 30000,
    });
    await page.waitForTimeout(2000); // Allow any async rendering to complete

    // Check for React error #185 specifically
    const hydrationErrors = reactErrors.filter((err) =>
      err.toLowerCase().includes('185') || err.toLowerCase().includes('hydration mismatch')
    );

    // Only check for hydration errors - other console errors (network, etc.) are acceptable
    expect(hydrationErrors.length).toBe(0);
  });

  test('admin dashboard renders without hydration errors', async ({ page }) => {
    // Set up admin user in localStorage
    await page.addInitScript(() => {
      window.localStorage.setItem('user-store', JSON.stringify({
        state: {
          user: { id: 'test-admin', email: 'admin@test.com' },
          isAuthenticated: true,
        },
      }));
      window.localStorage.setItem('e2e-dashboard-bypass', '1');
    });

    const consoleErrors: string[] = [];
    const reactErrors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        consoleErrors.push(text);
        if (text.includes('185') || text.includes('hydration') || text.includes('Hydration')) {
          reactErrors.push(text);
        }
      }
    });

    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
      if (error.message.includes('185') || error.message.includes('hydration')) {
        reactErrors.push(error.message);
      }
    });

    await page.goto('https://www.choices-app.com/admin/dashboard', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await page.waitForTimeout(2000); // Allow any async rendering to complete

    // Check for React error #185 specifically
    const hydrationErrors = reactErrors.filter((err) =>
      err.toLowerCase().includes('185') || err.toLowerCase().includes('hydration mismatch')
    );

    // Only check for hydration errors - other console errors (network, etc.) are acceptable
    expect(hydrationErrors.length).toBe(0);
  });
});

