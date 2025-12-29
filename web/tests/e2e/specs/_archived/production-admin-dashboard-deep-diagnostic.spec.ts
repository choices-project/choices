import { expect, test } from '@playwright/test';
import { ensureLoggedOut, loginTestUser, waitForPageReady } from '../../helpers/e2e-setup';

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://www.choices-app.com';
const BASE_URL = process.env.BASE_URL || PRODUCTION_URL;

const adminEmail = process.env.E2E_ADMIN_EMAIL || process.env.E2E_USER_EMAIL;
const adminPassword = process.env.E2E_ADMIN_PASSWORD || process.env.E2E_USER_PASSWORD;

test.describe('Production Admin Dashboard Deep Diagnostic', () => {
  test('deep diagnostic - check all state and warnings', async ({ page }) => {
    test.setTimeout(180_000);

    if (!adminEmail || !adminPassword) {
      test.skip(true, 'E2E_ADMIN_EMAIL/E2E_USER_EMAIL and E2E_ADMIN_PASSWORD/E2E_USER_PASSWORD are required');
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
      email: adminEmail,
      password: adminPassword,
      username: adminEmail.split('@')[0] ?? 'e2e-admin',
    });
    await waitForPageReady(page);

    // Navigate to admin dashboard page
    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    
    // Wait and check state multiple times
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(1_000);
      
      const spinnerVisible = await page.locator('.animate-spin, [class*="spinner"]').first().isVisible({ timeout: 500 }).catch(() => false);
      const hasAdminContent = await page.locator('text=Comprehensive Admin Dashboard, text=Total Users, text=Admin Dashboard').first().isVisible({ timeout: 500 }).catch(() => false);
      const hasContent = await page.locator('body').textContent().then(text => {
        return text && text.length > 200 && !text.includes('Loading') && !text.includes('Something went wrong') && !text.includes('Access denied');
      }).catch(() => false);
      
      console.log(`Check ${i + 1}: spinner=${spinnerVisible}, hasAdminContent=${hasAdminContent}, hasContent=${hasContent}`);
      
      if (!spinnerVisible && hasAdminContent && hasContent) {
        console.log('Admin dashboard loaded successfully!');
        break;
      }
    }
    
    // Final state check
    const spinnerVisible = await page.locator('.animate-spin, [class*="spinner"]').first().isVisible({ timeout: 2_000 }).catch(() => false);
    const hasAdminTitle = await page.locator('text=Comprehensive Admin Dashboard').isVisible({ timeout: 2_000 }).catch(() => false);
    const hasTotalUsers = await page.locator('text=Total Users').isVisible({ timeout: 2_000 }).catch(() => false);
    const hasTabs = await page.locator('button:has-text("Overview"), button:has-text("Site Messages")').first().isVisible({ timeout: 2_000 }).catch(() => false);
    const bodyText = await page.locator('body').textContent().catch(() => '') ?? '';
    const hasContent = bodyText && bodyText.length > 200 && !bodyText.includes('Something went wrong') && !bodyText.includes('Access denied');
    const hasAccessDenied = bodyText.includes('Access denied') || bodyText.includes('Authentication Required');
    
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
    
    // Log all findings
    console.log('\n=== ADMIN DASHBOARD DEEP DIAGNOSTIC RESULTS ===');
    console.log('Current URL:', page.url());
    console.log('Spinner Visible:', spinnerVisible);
    console.log('Has Admin Title:', hasAdminTitle);
    console.log('Has Total Users:', hasTotalUsers);
    console.log('Has Tabs:', hasTabs);
    console.log('Has Content:', hasContent);
    console.log('Has Access Denied:', hasAccessDenied);
    console.log('Body Text Length:', bodyText?.length || 0);
    console.log('React State:', reactState);
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
    await page.screenshot({ path: 'test-results/admin-dashboard-deep-diagnostic.png', fullPage: true });
    console.log('\nScreenshot saved to test-results/admin-dashboard-deep-diagnostic.png');
    
    // Check if page has any error boundaries or error messages
    const errorElements = await page.locator('[role="alert"], [data-testid*="error"], .error, [class*="error"]').all();
    if (errorElements.length > 0) {
      console.log('\n=== ERROR ELEMENTS FOUND ===');
      for (const elem of errorElements.slice(0, 5)) {
        const text = await elem.textContent().catch(() => '');
        if (text) console.log(`  - ${text.substring(0, 100)}`);
      }
    }
    
    // Verify admin dashboard loaded successfully (or access denied if not admin)
    if (hasAccessDenied) {
      console.log('\n⚠️  User does not have admin access - this is expected for non-admin users');
    } else {
      expect(hasAdminTitle || hasContent).toBeTruthy();
      expect(spinnerVisible).toBeFalsy();
    }
  });
  
  test('admin dashboard navigation from personal dashboard', async ({ page }) => {
    test.setTimeout(120_000);

    if (!adminEmail || !adminPassword) {
      test.skip(true, 'E2E_ADMIN_EMAIL/E2E_USER_EMAIL and E2E_ADMIN_PASSWORD/E2E_USER_PASSWORD are required');
      return;
    }

    await ensureLoggedOut(page);
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await loginTestUser(page, {
      email: adminEmail,
      password: adminPassword,
      username: adminEmail.split('@')[0] ?? 'e2e-admin',
    });
    await waitForPageReady(page);

    // Navigate to personal dashboard first
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForPageReady(page);
    
    // Wait for admin banner to appear (if user is admin)
    const adminButton = page.locator('button:has-text("Go to Admin Dashboard")');
    const hasAdminButton = await adminButton.isVisible({ timeout: 10_000 }).catch(() => false);
    
    if (hasAdminButton) {
      console.log('Admin banner found - clicking admin dashboard button');
      await adminButton.click();
      
      // Wait for navigation to admin dashboard
      await page.waitForURL('**/admin/dashboard', { timeout: 30_000 });
      await waitForPageReady(page);
      
      // Verify admin dashboard loaded
      const hasAdminTitle = await page.locator('text=Comprehensive Admin Dashboard').isVisible({ timeout: 10_000 }).catch(() => false);
      expect(hasAdminTitle).toBeTruthy();
      
      // Verify no infinite loading spinner
      const spinnerVisible = await page.locator('.animate-spin').first().isVisible({ timeout: 2_000 }).catch(() => false);
      expect(spinnerVisible).toBeFalsy();
    } else {
      console.log('Admin banner not found - user may not be admin, skipping admin dashboard navigation test');
      test.skip(true, 'User does not have admin access');
    }
  });
  
  test('admin dashboard direct navigation', async ({ page }) => {
    test.setTimeout(120_000);

    if (!adminEmail || !adminPassword) {
      test.skip(true, 'E2E_ADMIN_EMAIL/E2E_USER_EMAIL and E2E_ADMIN_PASSWORD/E2E_USER_PASSWORD are required');
      return;
    }

    await ensureLoggedOut(page);
    await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await loginTestUser(page, {
      email: adminEmail,
      password: adminPassword,
      username: adminEmail.split('@')[0] ?? 'e2e-admin',
    });
    await waitForPageReady(page);

    // Navigate directly to admin dashboard
    await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForPageReady(page);
    
    // Wait a bit for content to load
    await page.waitForTimeout(2_000);
    
    // Verify admin dashboard loaded or access denied
    const hasAdminTitle = await page.locator('text=Comprehensive Admin Dashboard').isVisible({ timeout: 10_000 }).catch(() => false);
    const hasAccessDenied = await page.locator('text=Access denied, text=Authentication Required').first().isVisible({ timeout: 2_000 }).catch(() => false);
    
    // Verify no infinite loading spinner
    const spinnerVisible = await page.locator('.animate-spin').first().isVisible({ timeout: 2_000 }).catch(() => false);
    expect(spinnerVisible).toBeFalsy();
    
    // Either admin dashboard or access denied should be visible
    expect(hasAdminTitle || hasAccessDenied).toBeTruthy();
  });
});

