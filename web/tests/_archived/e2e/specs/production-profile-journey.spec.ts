import { expect, test } from '@playwright/test';
import { ensureLoggedOut, loginTestUser, waitForPageReady, SHOULD_USE_MOCKS } from '../../helpers/e2e-setup';

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://www.choices-app.com';
const BASE_URL = process.env.BASE_URL || PRODUCTION_URL;

const regularEmail = process.env.E2E_USER_EMAIL;
const regularPassword = process.env.E2E_USER_PASSWORD;

test.describe('Production Profile Journey Tests', () => {
  test.skip(SHOULD_USE_MOCKS, 'Production tests require real backend (set PLAYWRIGHT_USE_MOCKS=0)');

  test('complete profile navigation journey', async ({ page }) => {
    test.setTimeout(180_000);

    if (!regularEmail || !regularPassword) {
      test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
      return;
    }

    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
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

    // Step 1: Navigate to profile from dashboard
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await waitForPageReady(page);

    // Click profile link in navigation
    const profileNavLink = page.locator('nav a[href="/profile"], nav a:has-text("Profile")').first();
    await expect(profileNavLink).toBeVisible({ timeout: 10_000 });
    await profileNavLink.click();
    
    // Wait for profile page
    await page.waitForURL(/\/profile/, { timeout: 10_000 });
    await page.waitForTimeout(2_000);

    // Verify profile page loaded
    const hasProfileContent = await page.locator('body').textContent().then(text => {
      return text && (text.includes('Profile') || text.includes('Edit Profile') || text.includes('Display Name'));
    }).catch(() => false);
    expect(hasProfileContent).toBe(true);
    expect(page.url()).toContain('/profile');

    // Step 2: Navigate to edit profile
    const editButton = page.locator('button:has-text("Edit Profile"), a[href="/profile/edit"]').first();
    const editButtonVisible = await editButton.isVisible({ timeout: 5_000 }).catch(() => false);
    
    if (editButtonVisible) {
      await editButton.click();
      await page.waitForURL(/\/profile\/edit/, { timeout: 10_000 });
      await page.waitForTimeout(2_000);

      // Verify edit page loaded
      const hasEditContent = await page.locator('body').textContent().then(text => {
        return text && (text.includes('Edit Profile') || text.includes('Display Name') || text.includes('Save'));
      }).catch(() => false);
      expect(hasEditContent).toBe(true);

      // Step 3: Go back to profile
      const backButton = page.locator('button:has-text("Back"), a[href="/profile"]').first();
      const backButtonVisible = await backButton.isVisible({ timeout: 5_000 }).catch(() => false);
      
      if (backButtonVisible) {
        await backButton.click();
        await page.waitForURL(/\/profile(?!\/edit)/, { timeout: 10_000 });
        await page.waitForTimeout(2_000);
        expect(page.url()).toContain('/profile');
        expect(page.url()).not.toContain('/edit');
      }
    }

    // Step 4: Navigate to preferences
    const preferencesLink = page.locator('a[href="/profile/preferences"], button:has-text("Settings")').first();
    const preferencesVisible = await preferencesLink.isVisible({ timeout: 5_000 }).catch(() => false);
    
    if (preferencesVisible) {
      await preferencesLink.click();
      await page.waitForURL(/\/profile\/preferences/, { timeout: 10_000 }).catch(() => {
        // Navigation may not happen if preferences link is not available
      });
      await page.waitForTimeout(2_000);

      // Verify preferences page loaded (if navigation worked)
      if (page.url().includes('/preferences')) {
        const hasPreferencesContent = await page.locator('body').textContent().then(text => {
          return text && (text.includes('Preferences') || text.includes('Interests'));
        }).catch(() => false);
        expect(hasPreferencesContent).toBe(true);
      }
    }

    // Final check: no React errors
    const reactErrors = consoleErrors.filter(err => 
      err.includes('React error #185') ||
      err.includes('Maximum update depth exceeded') ||
      err.includes('hydration')
    );

    if (reactErrors.length > 0) {
      console.log('React errors during journey:', reactErrors);
      await page.screenshot({ path: 'test-results/profile-journey-errors.png', fullPage: true });
    }

    expect(reactErrors.length).toBe(0);
  });

  test('profile page interactions work correctly', async ({ page }) => {
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

    // Navigate to profile
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForTimeout(3_000);

    // Test export data button (should open dialog, not crash)
    const exportButton = page.locator('button:has-text("Export Data")').first();
    const exportButtonVisible = await exportButton.isVisible({ timeout: 5_000 }).catch(() => false);
    
    if (exportButtonVisible) {
      await exportButton.click();
      await page.waitForTimeout(1_000);

      // Check if dialog appeared (or button just worked without error)
      const dialog = page.locator('[role="dialog"], [data-testid*="export"]').first();
      const dialogVisible = await dialog.isVisible({ timeout: 2_000 }).catch(() => false);
      
      // If dialog appeared, close it
      if (dialogVisible) {
        const closeButton = page.locator('button:has-text("Cancel"), button[aria-label*="Close"]').first();
        await closeButton.click().catch(() => {
          // Close button may not be available
        });
        await page.waitForTimeout(500);
      }
    }

    // Verify page is still functional
    const spinnerVisible = await page.locator('.animate-spin').first().isVisible({ timeout: 2_000 }).catch(() => false);
    const hasContent = await page.locator('body').textContent().then(text => {
      return text && text.length > 100 && !text.includes('Something went wrong');
    }).catch(() => false);

    expect(spinnerVisible).toBe(false);
    expect(hasContent).toBe(true);
  });
});

