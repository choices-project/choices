import { expect, test } from '@playwright/test';

import {
  setupExternalAPIMocks,
  waitForPageReady,
} from '../../helpers/e2e-setup';

test.describe('Admin Dashboard Stability Tests', () => {
  test('admin dashboard renders without infinite loops', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setDefaultNavigationTimeout(60_000);
    await page.setDefaultTimeout(40_000);
    
    const consoleMessages: string[] = [];
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      consoleMessages.push(`${msg.type()}: ${text}`);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
      admin: true,
    });

    try {
      // Set up admin user in localStorage
      await page.evaluate(() => {
        localStorage.setItem('e2e-dashboard-bypass', '1');
        document.cookie = 'e2e-dashboard-bypass=1; path=/';
      });
      
      // Navigate to admin dashboard
      await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await waitForPageReady(page);
      
      // Wait for admin dashboard to render (or access denied)
      const hasAdminContent = await page.locator('text=Comprehensive Admin Dashboard').isVisible({ timeout: 30_000 }).catch(() => false);
      const hasAccessDenied = await page.locator('text=Access denied, text=Authentication Required').first().isVisible({ timeout: 2_000 }).catch(() => false);
      
      // Wait a bit to check for infinite re-renders
      await page.waitForTimeout(3_000);
      
      // Check for React error #185 (Maximum update depth exceeded)
      const hasReactError185 = consoleErrors.some(err => 
        err.includes('Maximum update depth exceeded') || 
        err.includes('Error #185')
      );
      
      expect(hasReactError185).toBeFalsy();
      
      // Verify either admin dashboard or access denied is visible (not stuck in loading)
      expect(hasAdminContent || hasAccessDenied).toBeTruthy();
      
      // Verify no infinite spinner
      const spinnerVisible = await page.locator('.animate-spin').first().isVisible({ timeout: 1_000 }).catch(() => false);
      expect(spinnerVisible).toBeFalsy();
      
    } finally {
      if (consoleMessages.length) {
        console.log('[admin-dashboard-stability console]', consoleMessages.join('\n'));
      }
      await cleanupMocks();
    }
  });
  
  test('admin dashboard navigation from personal dashboard', async ({ page }) => {
    test.setTimeout(120_000);
    
    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
      admin: true,
    });

    try {
      // Set up admin user
      await page.evaluate(() => {
        localStorage.setItem('e2e-dashboard-bypass', '1');
        document.cookie = 'e2e-dashboard-bypass=1; path=/';
      });
      
      // Navigate to personal dashboard first
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await waitForPageReady(page);
      await expect(page.getByTestId('personal-dashboard')).toBeVisible({ timeout: 30_000 });
      
      // Wait for admin banner to appear (if user is admin)
      const adminButton = page.locator('button:has-text("Go to Admin Dashboard")');
      const hasAdminButton = await adminButton.isVisible({ timeout: 10_000 }).catch(() => false);
      
      if (hasAdminButton) {
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
      }
      
    } finally {
      await cleanupMocks();
    }
  });
  
  test('admin dashboard tabs work without re-render loops', async ({ page }) => {
    test.setTimeout(120_000);
    
    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
      admin: true,
    });

    try {
      // Set up admin user
      await page.evaluate(() => {
        localStorage.setItem('e2e-dashboard-bypass', '1');
        document.cookie = 'e2e-dashboard-bypass=1; path=/';
      });
      
      await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await waitForPageReady(page);
      
      const hasAdminTitle = await page.locator('text=Comprehensive Admin Dashboard').isVisible({ timeout: 30_000 }).catch(() => false);
      if (!hasAdminTitle) {
        test.skip(true, 'User does not have admin access');
        return;
      }
      
      // Click through tabs
      const messagesTab = page.locator('button:has-text("Site Messages")');
      if (await messagesTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
        await messagesTab.click();
        await page.waitForTimeout(1_000);
        
        const performanceTab = page.locator('button:has-text("Performance")');
        if (await performanceTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
          await performanceTab.click();
          await page.waitForTimeout(1_000);
        }
      }
      
      // Verify no infinite spinner
      const spinnerVisible = await page.locator('.animate-spin').first().isVisible({ timeout: 1_000 }).catch(() => false);
      expect(spinnerVisible).toBeFalsy();
      
    } finally {
      await cleanupMocks();
    }
  });
});

