import { test, expect } from '@playwright/test';

/**
 * Development Mode Hydration Error Capture
 *
 * This test runs against the local dev server to capture React 18.3.1's
 * improved hydration error messages. These messages are only visible in
 * development mode (not in production minified builds).
 */

test.describe('Development Mode Hydration Error Capture', () => {
  test.beforeEach(async ({ context, page }) => {
    // Set up E2E bypass for testing
    await context.addCookies([
      {
        name: 'e2e-dashboard-bypass',
        value: '1',
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
        sameSite: 'Lax',
      },
    ]);

    // Set up localStorage bypass
    await page.addInitScript(() => {
      window.localStorage.setItem('e2e-dashboard-bypass', '1');
    });
  });

  test('capture React 18.3.1 improved hydration error messages', async ({ page }) => {
    const consoleMessages: Array<{ type: string; text: string; timestamp: number }> = [];
    const consoleErrors: string[] = [];
    const hydrationErrors: Array<{ message: string; stack?: string; details?: any }> = [];

    // Capture ALL console messages
    page.on('console', (msg) => {
      const text = msg.text();
      const type = msg.type();
      const timestamp = Date.now();
      consoleMessages.push({ type, text, timestamp });

      if (type === 'error') {
        consoleErrors.push(text);

        // Capture hydration-related errors with full details
        if (text.includes('185') ||
            text.includes('hydration') ||
            text.includes('Hydration') ||
            text.includes('React') ||
            text.includes('mismatch')) {
          const location = msg.location();
          const stack = location ? `${location.url}:${location.lineNumber}:${location.columnNumber}` : undefined;
          const details = {
            type,
            timestamp,
            location,
          };
          hydrationErrors.push(stack ? { message: text, stack, details } : { message: text, details });
        }
      }
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      consoleErrors.push(error.message);
      if (error.message.includes('185') ||
          error.message.includes('hydration') ||
          error.message.includes('Hydration')) {
        const stack = error.stack;
        hydrationErrors.push(stack ? { message: error.message, stack } : { message: error.message });
      }
    });

    console.log('=== NAVIGATING TO DASHBOARD ===');
    await page.goto('http://localhost:3000/dashboard', { waitUntil: 'networkidle' });

    // Wait a bit for any async errors
    await page.waitForTimeout(2000);

    console.log('\n=== CONSOLE MESSAGES CAPTURED ===');
    console.log(`Total console messages: ${consoleMessages.length}`);
    console.log(`Total console errors: ${consoleErrors.length}`);
    console.log(`Hydration-related errors: ${hydrationErrors.length}`);

    if (hydrationErrors.length > 0) {
      console.log('\n=== HYDRATION ERRORS (React 18.3.1 Improved Messages) ===');
      hydrationErrors.forEach((error, index) => {
        console.log(`\n--- Error ${index + 1} ---`);
        console.log(`Message: ${error.message}`);
        if (error.stack) {
          console.log(`Stack/Location: ${error.stack}`);
        }
        if (error.details) {
          console.log(`Details:`, JSON.stringify(error.details, null, 2));
        }
      });
    }

    // Also log all error messages for context
    if (consoleErrors.length > 0) {
      console.log('\n=== ALL CONSOLE ERRORS ===');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    // Check page state
    const bodyText = await page.textContent('body') || '';
    const hasError = bodyText.includes('Application error') || bodyText.includes('Error');

    console.log('\n=== PAGE STATE ===');
    console.log(`Body text includes error: ${hasError}`);
    console.log(`Body text length: ${bodyText.length}`);
    console.log(`Body text preview: ${bodyText.substring(0, 200)}`);

    // Don't fail the test - we're just capturing information
    // The test passes if we captured the errors (even if they exist)
    expect(hydrationErrors.length).toBeGreaterThanOrEqual(0);
  });
});

