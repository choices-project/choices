import { expect, test } from '@playwright/test';
import { ensureLoggedOut, loginTestUser, waitForPageReady } from '../../helpers/e2e-setup';

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://www.choices-app.com';
const BASE_URL = process.env.BASE_URL || PRODUCTION_URL;

const regularEmail = process.env.E2E_USER_EMAIL;
const regularPassword = process.env.E2E_USER_PASSWORD;

test.describe('Production Dashboard Deep Diagnostic', () => {
  test('deep diagnostic - check all state and warnings', async ({ page }) => {
    test.setTimeout(180_000);

    if (!regularEmail || !regularPassword) {
      test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
      return;
    }

    // Collect all console messages
    const consoleMessages: Array<{ type: string; text: string }> = [];
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    const consoleInfo: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      const type = msg.type();
      consoleMessages.push({ type, text });

      if (type === 'error') {
        consoleErrors.push(text);
      } else if (type === 'warning') {
        consoleWarnings.push(text);
      } else if (type === 'info' || type === 'log') {
        consoleInfo.push(text);
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

    // Navigate to dashboard page
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    // Wait and check state multiple times
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(1_000);

      const spinnerVisible = await page.locator('.animate-spin, [class*="spinner"]').first().isVisible({ timeout: 500 }).catch(() => false);
      const hasPersonalDashboard = await page.locator('[data-testid="personal-dashboard"]').isVisible({ timeout: 500 }).catch(() => false);
      const hasDashboardTitle = await page.locator('[data-testid="dashboard-title"]').isVisible({ timeout: 500 }).catch(() => false);
      const hasContent = await page.locator('body').textContent().then(text => {
        return text && text.length > 200 && !text.includes('Loading') && !text.includes('Something went wrong');
      }).catch(() => false);

      console.log(`Check ${i + 1}: spinner=${spinnerVisible}, hasPersonalDashboard=${hasPersonalDashboard}, hasDashboardTitle=${hasDashboardTitle}, hasContent=${hasContent}`);

      if (!spinnerVisible && hasPersonalDashboard && hasContent) {
        console.log('Dashboard loaded successfully!');
        break;
      }
    }

    // Final state check
    const spinnerVisible = await page.locator('.animate-spin, [class*="spinner"]').first().isVisible({ timeout: 2_000 }).catch(() => false);
    const hasPersonalDashboard = await page.locator('[data-testid="personal-dashboard"]').isVisible({ timeout: 2_000 }).catch(() => false);
    const hasDashboardTitle = await page.locator('[data-testid="dashboard-title"]').isVisible({ timeout: 2_000 }).catch(() => false);
    const hasDashboardHeader = await page.locator('[data-testid="dashboard-header"]').isVisible({ timeout: 2_000 }).catch(() => false);
    const hasPersonalAnalytics = await page.locator('[data-testid="personal-analytics"]').isVisible({ timeout: 2_000 }).catch(() => false);
    const bodyText = await page.locator('body').textContent().catch(() => '');
    const hasContent = bodyText && bodyText.length > 200 && !bodyText.includes('Something went wrong');

    // Check React state
    const reactState = await page.evaluate(() => {
      return {
        readyState: document.readyState,
        hasReactRoot: !!document.querySelector('#__next'),
        bodyChildren: document.body.children.length,
        hasSpinner: !!document.querySelector('.animate-spin'),
        hasErrorBoundary: !!document.querySelector('[data-testid="error-boundary"]'),
      };
    }).catch(() => null);

    // Check for admin banner (if user is admin)
    const hasAdminBanner = await page.locator('text=Admin Access Available').isVisible({ timeout: 1_000 }).catch(() => false);
    const hasAdminButton = await page.locator('button:has-text("Go to Admin Dashboard")').isVisible({ timeout: 1_000 }).catch(() => false);

    // Log all findings
    console.log('\n=== DASHBOARD DEEP DIAGNOSTIC RESULTS ===');
    console.log('Current URL:', page.url());
    console.log('Spinner Visible:', spinnerVisible);
    console.log('Has Personal Dashboard:', hasPersonalDashboard);
    console.log('Has Dashboard Title:', hasDashboardTitle);
    console.log('Has Dashboard Header:', hasDashboardHeader);
    console.log('Has Personal Analytics:', hasPersonalAnalytics);
    console.log('Has Content:', hasContent);
    console.log('Body Text Length:', bodyText?.length || 0);
    console.log('React State:', reactState);
    console.log('Has Admin Banner:', hasAdminBanner);
    console.log('Has Admin Button:', hasAdminButton);
    console.log('\nConsole Messages Count:', consoleMessages.length);
    console.log('  Errors:', consoleErrors.length);
    console.log('  Warnings:', consoleWarnings.length);
    console.log('  Info:', consoleInfo.length);

    if (consoleWarnings.length > 0) {
      console.log('\n=== CONSOLE WARNINGS ===');
      consoleWarnings.forEach((warn, i) => {
        console.log(`${i + 1}. ${warn}`);
      });
    }

    if (consoleInfo.length > 0) {
      console.log('\n=== CONSOLE INFO MESSAGES ===');
      consoleInfo.forEach((info, i) => {
        console.log(`${i + 1}. ${info}`);
      });
    }

    // Also show all console messages for debugging
    const allLogMessages = consoleMessages.filter(m => m.type === 'log' || m.type === 'info');
    if (allLogMessages.length > 0) {
      console.log('\n=== ALL CONSOLE LOG/INFO MESSAGES ===');
      allLogMessages.forEach((msg, i) => {
        console.log(`${i + 1}. [${msg.type}] ${msg.text}`);
      });
    }

    if (consoleErrors.length > 0) {
      console.log('\n=== CONSOLE ERRORS ===');
      consoleErrors.forEach((err, i) => {
        console.log(`${i + 1}. ${err}`);
      });
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/dashboard-deep-diagnostic.png', fullPage: true });
    console.log('\nScreenshot saved to test-results/dashboard-deep-diagnostic.png');

    // Check if page has any error boundaries or error messages
    const errorElements = await page.locator('[role="alert"], [data-testid*="error"], .error, [class*="error"]').all();
    if (errorElements.length > 0) {
      console.log('\n=== ERROR ELEMENTS FOUND ===');
      for (const elem of errorElements.slice(0, 5)) {
        const text = await elem.textContent().catch(() => '');
        if (text) console.log(`  - ${text.substring(0, 100)}`);
      }
    }

    // Verify dashboard loaded successfully
    expect(hasPersonalDashboard || hasContent).toBeTruthy();
    expect(spinnerVisible).toBeFalsy();
  });

  test('dashboard navigation from global nav', async ({ page }) => {
    test.setTimeout(120_000);

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

    // Navigate to feed first
    await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForPageReady(page);

    // Click dashboard link in global navigation
    const dashboardNav = page.locator('[data-testid="dashboard-nav"]');
    await expect(dashboardNav).toBeVisible({ timeout: 10_000 });
    await dashboardNav.click();

    // Wait for navigation
    await page.waitForURL('**/dashboard', { timeout: 30_000 });
    await waitForPageReady(page);

    // Verify dashboard loaded
    const hasPersonalDashboard = await page.locator('[data-testid="personal-dashboard"]').isVisible({ timeout: 10_000 }).catch(() => false);
    expect(hasPersonalDashboard).toBeTruthy();

    // Verify no infinite loading spinner
    const spinnerVisible = await page.locator('.animate-spin').first().isVisible({ timeout: 2_000 }).catch(() => false);
    expect(spinnerVisible).toBeFalsy();
  });
});

