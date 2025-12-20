import { expect, test } from '@playwright/test';
import { ensureLoggedOut, loginTestUser, waitForPageReady, SHOULD_USE_MOCKS } from '../../helpers/e2e-setup';

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://www.choices-app.com';
const BASE_URL = process.env.BASE_URL || PRODUCTION_URL;

const regularEmail = process.env.E2E_USER_EMAIL;
const regularPassword = process.env.E2E_USER_PASSWORD;

test.describe('Production Polls Page Tests', () => {
  test.skip(SHOULD_USE_MOCKS, 'Production tests require real backend (set PLAYWRIGHT_USE_MOCKS=0)');

  test('polls page loads without infinite spinner', async ({ page }) => {
    test.setTimeout(120_000);

    if (!regularEmail || !regularPassword) {
      test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
      return;
    }

    // Collect console errors and CSP violations
    const consoleErrors: string[] = [];
    const cspViolations: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        consoleErrors.push(text);
        if (text.includes('Content Security Policy') || text.includes('CSP') || text.includes('vercel.live')) {
          cspViolations.push(text);
        }
      }
    });

    // Listen for CSP violations
    page.on('response', (response) => {
      const status = response.status();
      if (status === 0 || status >= 400) {
        const url = response.url();
        if (url.includes('vercel.live') || url.includes('feedback.js')) {
          cspViolations.push(`Blocked: ${url} (status: ${status})`);
        }
      }
    });

    await ensureLoggedOut(page);
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await loginTestUser(page, {
      email: regularEmail,
      password: regularPassword,
      username: regularEmail.split('@')[0] ?? 'e2e-user',
    });
    await waitForPageReady(page);

    // Navigate to polls page
    await page.goto(`${BASE_URL}/polls`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    
    // Wait for page to stabilize - check if loading spinner disappears
    const loadingSpinner = page.locator('.animate-spin, [class*="spinner"], [data-testid*="loading"]');
    
    // Wait up to 10 seconds for spinner to disappear
    let spinnerVisible = true;
    for (let i = 0; i < 20; i++) {
      spinnerVisible = await loadingSpinner.first().isVisible({ timeout: 500 }).catch(() => false);
      if (!spinnerVisible) {
        break;
      }
      await page.waitForTimeout(500);
    }

    // Check for React errors
    const reactErrors = consoleErrors.filter(err => 
      err.includes('Minified React error') || 
      err.includes('React error #185') ||
      err.includes('Maximum update depth exceeded') ||
      err.includes('hydration')
    );

    // Wait a bit more for any final errors
    await page.waitForTimeout(2_000);

    // Check if page has loaded content
    const hasContent = await page.locator('body').textContent().then(text => {
      return text && text.length > 100 && !text.includes('Loading') && !text.includes('Something went wrong');
    }).catch(() => false);

    // Check for error boundaries
    const errorBoundary = page.locator('[data-testid="error-boundary"], [role="alert"]:has-text("Something went wrong"), [role="alert"]:has-text("Error")');
    const hasErrorBoundary = await errorBoundary.isVisible({ timeout: 2_000 }).catch(() => false);

    // Log findings
    console.log('Console Errors:', consoleErrors);
    console.log('CSP Violations:', cspViolations);
    console.log('React Errors:', reactErrors);
    console.log('Spinner Visible:', spinnerVisible);
    console.log('Has Content:', hasContent);
    console.log('Has Error Boundary:', hasErrorBoundary);

    // Fail if spinner is still visible after 10 seconds
    if (spinnerVisible) {
      throw new Error(
        `Polls page stuck in loading state. ` +
        `Spinner still visible after 10 seconds. ` +
        `Console errors: ${consoleErrors.length}, ` +
        `CSP violations: ${cspViolations.length}, ` +
        `React errors: ${reactErrors.length}`
      );
    }

    // Fail if React error #185 is present
    if (reactErrors.length > 0) {
      throw new Error(
        `React error #185 detected on polls page: ${reactErrors.join(', ')}. ` +
        `This indicates an infinite re-render loop.`
      );
    }

    // Fail if error boundary is shown
    if (hasErrorBoundary) {
      const errorText = await errorBoundary.textContent().catch(() => 'Unknown error');
      throw new Error(`Error boundary triggered on polls page: ${errorText}`);
    }

    // Warn about CSP violations but don't fail (they're logged)
    if (cspViolations.length > 0) {
      console.warn('CSP violations detected:', cspViolations);
    }

    // Page should have loaded content
    expect(hasContent).toBe(true);
  });

  test('polls page has no CSP violations for vercel.live', async ({ page }) => {
    test.setTimeout(60_000);

    const cspViolations: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('Content Security Policy') && text.includes('vercel.live')) {
          cspViolations.push(text);
        }
      }
    });

    if (!regularEmail || !regularPassword) {
      test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
      return;
    }

    await ensureLoggedOut(page);
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await loginTestUser(page, {
      email: regularEmail,
      password: regularPassword,
      username: regularEmail.split('@')[0] ?? 'e2e-user',
    });
    await waitForPageReady(page);

    await page.goto(`${BASE_URL}/polls`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    
    // Wait for page to load and any scripts to execute
    await page.waitForTimeout(5_000);

    // Check for CSP violations
    if (cspViolations.length > 0) {
      throw new Error(
        `CSP violations detected for vercel.live: ${cspViolations.join('; ')}. ` +
        `The script-src-elem directive should include https://vercel.live in preview/development environments.`
      );
    }

    // Should not have CSP violations
    expect(cspViolations.length).toBe(0);
  });
});

