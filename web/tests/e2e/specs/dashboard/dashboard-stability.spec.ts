import { expect, test } from '@playwright/test';

import {
  setupExternalAPIMocks,
  waitForPageReady,
} from '../../helpers/e2e-setup';

test.describe('Dashboard Stability Tests', () => {
  test('dashboard renders without infinite loops', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setDefaultNavigationTimeout(60_000);
    await page.setDefaultTimeout(40_000);
    
    // Set up E2E bypass cookie for middleware auth bypass (same as admin dashboard tests)
    await page.addInitScript(() => {
      try {
        localStorage.setItem('e2e-dashboard-bypass', '1');
      } catch (e) {
        console.warn('Could not set localStorage:', e);
      }
    });
    await page.context().addCookies([{
      name: 'e2e-dashboard-bypass',
      value: '1',
      path: '/',
      domain: '127.0.0.1',
    }]);
    
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
    });

    try {
      // Navigate to dashboard
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await waitForPageReady(page);
      
      // Diagnostic: Check cookie availability
      const cookies = await page.context().cookies();
      const authCookies = cookies.filter(c => c.name.includes('sb-') && (c.name.includes('auth') || c.name.includes('access')));
      console.log('[dashboard-stability] Auth cookies found:', authCookies.map(c => c.name));
      
      // Diagnostic: Check localStorage for store hydration
      const storeHydrated = await page.evaluate(() => {
        try {
          const userStore = localStorage.getItem('user-store');
          const profileStore = localStorage.getItem('profile-store');
          return {
            userStoreExists: !!userStore,
            profileStoreExists: !!profileStore,
            userStoreParsed: userStore ? JSON.parse(userStore) : null,
          };
        } catch (e) {
          return { error: String(e) };
        }
      });
      console.log('[dashboard-stability] Store hydration status:', storeHydrated);
      
      // Diagnostic: Check AuthContext loading state
      const authContextState = await page.evaluate(() => {
        return {
          hasAuthContext: typeof window !== 'undefined' && 'AuthContext' in window,
          cookiesAvailable: document.cookie.length > 0,
        };
      });
      console.log('[dashboard-stability] AuthContext state:', authContextState);
      
      // Wait for dashboard to render
      const dashboardStartTime = Date.now();
      await expect(page.getByTestId('personal-dashboard')).toBeVisible({ timeout: 30_000 });
      const dashboardRenderTime = Date.now() - dashboardStartTime;
      console.log('[dashboard-stability] Dashboard render time:', dashboardRenderTime, 'ms');
      
      // Wait a bit to check for infinite re-renders
      await page.waitForTimeout(3_000);
      
      // Check for React error #185 (Maximum update depth exceeded)
      const hasReactError185 = consoleErrors.some(err => 
        err.includes('Maximum update depth exceeded') || 
        err.includes('Error #185')
      );
      
      if (hasReactError185) {
        console.error('[dashboard-stability] React Error #185 detected!');
        console.error('[dashboard-stability] Console errors:', consoleErrors);
      }
      expect(hasReactError185).toBeFalsy();
      
      // Verify dashboard is still visible (not stuck in loading)
      await expect(page.getByTestId('personal-dashboard')).toBeVisible();
      
      // Verify no infinite spinner
      const spinnerVisible = await page.locator('.animate-spin').first().isVisible({ timeout: 1_000 }).catch(() => false);
      expect(spinnerVisible).toBeFalsy();
      
      // Diagnostic: Verify key dashboard elements are present
      const dashboardElements = await page.evaluate(() => {
        return {
          hasHeader: !!document.querySelector('[data-testid="dashboard-header"]'),
          hasTitle: !!document.querySelector('[data-testid="dashboard-title"]'),
          hasAnalytics: !!document.querySelector('[data-testid="personal-analytics"]'),
          hasNav: !!document.querySelector('[data-testid="dashboard-nav"]'),
        };
      });
      console.log('[dashboard-stability] Dashboard elements present:', dashboardElements);
      
    } finally {
      if (consoleMessages.length) {
        console.log('[dashboard-stability console]', consoleMessages.join('\n'));
      }
      await cleanupMocks();
    }
  });
  
  test('dashboard navigation from global nav works', async ({ page }) => {
    test.setTimeout(120_000);
    
    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      // Navigate to feed first
      await page.goto('/feed', { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await waitForPageReady(page);
      
      // Click dashboard link in global navigation
      const dashboardNav = page.locator('[data-testid="dashboard-nav"]');
      await expect(dashboardNav).toBeVisible({ timeout: 10_000 });
      await dashboardNav.click();
      
      // Wait for navigation
      await page.waitForURL('**/dashboard', { timeout: 30_000 });
      await waitForPageReady(page);
      
      // Verify dashboard loaded
      await expect(page.getByTestId('personal-dashboard')).toBeVisible({ timeout: 30_000 });
      
      // Verify no infinite loading spinner
      const spinnerVisible = await page.locator('.animate-spin').first().isVisible({ timeout: 2_000 }).catch(() => false);
      expect(spinnerVisible).toBeFalsy();
      
    } finally {
      await cleanupMocks();
    }
  });
  
  test('dashboard preferences persist and toggle correctly', async ({ page }) => {
    test.setTimeout(120_000);
    
    const cleanupMocks = await setupExternalAPIMocks(page, {
      feeds: true,
      notifications: true,
      analytics: true,
      auth: true,
      civics: true,
    });

    try {
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await waitForPageReady(page);
      await expect(page.getByTestId('personal-dashboard')).toBeVisible({ timeout: 30_000 });
      
      // Toggle elected officials
      const electedToggle = page.getByTestId('show-elected-officials-toggle');
      await expect(electedToggle).toBeVisible({ timeout: 10_000 });
      
      const initialChecked = await electedToggle.isChecked();
      await electedToggle.click();
      await expect(electedToggle).not.toBeChecked();
      
      // Reload to verify persistence
      await page.reload();
      await waitForPageReady(page);
      await expect(page.getByTestId('personal-dashboard')).toBeVisible({ timeout: 30_000 });
      
      // Verify toggle state persisted
      const afterReloadChecked = await page.getByTestId('show-elected-officials-toggle').isChecked();
      expect(afterReloadChecked).toBe(initialChecked);
      
    } finally {
      await cleanupMocks();
    }
  });
});

