import { expect, test } from '@playwright/test';

import {
  setupExternalAPIMocks,
  waitForPageReady,
} from '../../helpers/e2e-setup';

test.describe('Dashboard Redirect Monitor', () => {
  test('monitor dashboard for delayed onboarding redirect', async ({ page }) => {
    test.setTimeout(180_000); // 3 minutes
    await page.setDefaultNavigationTimeout(60_000);
    await page.setDefaultTimeout(40_000);

    // Set up E2E bypass
    await page.addInitScript(() => {
      try {
        localStorage.setItem('e2e-dashboard-bypass', '1');
      } catch (e) {
        console.warn('Could not set localStorage:', e);
      }
    });

    const baseUrl = process.env.BASE_URL || 'https://www.choices-app.com';
    const url = new URL(baseUrl);
    const domain = url.hostname.startsWith('www.') ? url.hostname.substring(4) : url.hostname;

    try {
      await page.context().addCookies([{
        name: 'e2e-dashboard-bypass',
        value: '1',
        path: '/',
        domain: `.${domain}`,
        sameSite: 'None' as const,
        secure: true,
        httpOnly: false,
      }]);
    } catch (error) {
      // Expected in some environments
    }

    // Capture all console messages, especially our instrumentation
    const consoleMessages: string[] = [];
    const redirectLogs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      consoleMessages.push(`${msg.type()}: ${text}`);
      
      // Capture our instrumentation logs
      if (text.includes('redirect-logic-entry') || 
          text.includes('checkAdminAndRedirect') || 
          text.includes('profile-state-change') ||
          text.includes('redirecting to onboarding')) {
        redirectLogs.push(text);
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

      // Verify dashboard loaded
      await expect(page.getByTestId('personal-dashboard')).toBeVisible({ timeout: 30_000 });
      console.log('[redirect-monitor] Dashboard loaded successfully');

      // Monitor for 15 seconds, checking URL every 2 seconds
      const startTime = Date.now();
      const monitorDuration = 15_000; // 15 seconds
      const checkInterval = 2_000; // Check every 2 seconds
      let lastUrl = page.url();

      while (Date.now() - startTime < monitorDuration) {
        await page.waitForTimeout(checkInterval);
        const currentUrl = page.url();
        
        if (currentUrl !== lastUrl) {
          console.log(`[redirect-monitor] URL changed from ${lastUrl} to ${currentUrl}`);
          lastUrl = currentUrl;
          
          if (currentUrl.includes('/onboarding')) {
            console.error('[redirect-monitor] ❌ REDIRECT DETECTED to onboarding!');
            console.log('[redirect-monitor] Redirect logs:', redirectLogs);
            throw new Error(`Dashboard redirected to onboarding after ${Date.now() - startTime}ms. Current URL: ${currentUrl}`);
          }
        }
        
        // Log current state every 4 seconds
        if ((Date.now() - startTime) % 4_000 < checkInterval) {
          const profileState = await page.evaluate(() => {
            try {
              const profileStore = localStorage.getItem('profile-store');
              const userStore = localStorage.getItem('user-store');
              return {
                currentUrl: window.location.href,
                bypassFlag: localStorage.getItem('e2e-dashboard-bypass'),
                profileStoreExists: !!profileStore,
                userStoreExists: !!userStore,
              };
            } catch (e) {
              return { error: String(e) };
            }
          });
          console.log(`[redirect-monitor] State at ${Date.now() - startTime}ms:`, profileState);
        }
      }

      console.log('[redirect-monitor] ✅ No redirect detected during 15-second monitoring period');
      console.log('[redirect-monitor] All redirect-related console logs:', redirectLogs);
      
      // Final check
      const finalUrl = page.url();
      if (finalUrl.includes('/onboarding')) {
        throw new Error(`Dashboard redirected to onboarding after monitoring period. Final URL: ${finalUrl}`);
      }

    } finally {
      console.log('[redirect-monitor] All console messages:', consoleMessages.slice(-50)); // Last 50 messages
      await cleanupMocks();
    }
  });
});

