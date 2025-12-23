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
    // Note: Cookie domain handling for E2E tests
    // Middleware checks for e2e-dashboard-bypass cookie to bypass auth (see middleware.ts)
    // Dashboard page checks localStorage for e2e-dashboard-bypass (more reliable for cross-domain)
    // Try to set cookie, but don't fail if domain mismatch (localStorage is primary method)
    const baseUrl = process.env.BASE_URL || 'https://www.choices-app.com';
    const url = new URL(baseUrl);
    const domain = url.hostname.startsWith('www.') ? url.hostname.substring(4) : url.hostname;

    try {
      await page.context().addCookies([{
        name: 'e2e-dashboard-bypass',
        value: '1',
        path: '/',
        domain: `.${domain}`, // Use .domain for cross-subdomain support
      }]);
      console.log('[dashboard-stability] E2E bypass cookie set for domain:', `.${domain}`);
    } catch (error) {
      // Cookie domain mismatch is acceptable - localStorage is the primary method
      // Dashboard page checks localStorage (more reliable than cookie in cross-domain scenarios)
      console.log('[dashboard-stability] Cookie setting failed (expected in some envs), using localStorage only');
    }

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
      const bypassCookies = cookies.filter(c => c.name.includes('e2e') || c.name === 'E2E');
      console.log('[dashboard-stability] Auth cookies found:', authCookies.map(c => c.name));
      console.log('[dashboard-stability] E2E bypass cookies found:', bypassCookies.map(c => `${c.name}=${c.value.substring(0, 20)}... (domain: ${c.domain})`));

      // Diagnostic: Check localStorage for store hydration
      const storeHydrated = await page.evaluate(() => {
        try {
          const userStore = localStorage.getItem('user-store');
          const profileStore = localStorage.getItem('profile-store');
          const bypassFlag = localStorage.getItem('e2e-dashboard-bypass');
          return {
            userStoreExists: !!userStore,
            profileStoreExists: !!profileStore,
            bypassFlagSet: bypassFlag === '1',
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
          cookieString: document.cookie.substring(0, 200), // First 200 chars for debugging
        };
      });
      console.log('[dashboard-stability] AuthContext state:', authContextState);

      // Diagnostic: Check if dashboard page recognized bypass flag
      const bypassCheck = await page.evaluate(() => {
        try {
          // Check if page is on /auth (redirected) or /dashboard (not redirected)
          const currentPath = window.location.pathname;
          const bypassFlag = localStorage.getItem('e2e-dashboard-bypass');
          return {
            currentPath,
            bypassFlagSet: bypassFlag === '1',
            wasRedirected: currentPath === '/auth' || currentPath.includes('/auth'),
          };
        } catch (e) {
          return { error: String(e) };
        }
      });
      console.log('[dashboard-stability] Bypass check:', bypassCheck);

      // Diagnostic: Check current URL to see if redirect happened
      const currentUrl = page.url();
      console.log('[dashboard-stability] Current URL after navigation:', currentUrl);

      // Wait for dashboard to render
      const dashboardStartTime = Date.now();

      // Check if we were redirected to /auth
      if (currentUrl.includes('/auth')) {
        console.warn('[dashboard-stability] ⚠️ Redirected to /auth - dashboard not accessible');
        // Try to get redirect reason from URL params
        const redirectParams = new URL(currentUrl).searchParams;
        console.log('[dashboard-stability] Redirect params:', Object.fromEntries(redirectParams));
      }

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

    // Set up E2E bypass for this test too
    await page.addInitScript(() => {
      try {
        localStorage.setItem('e2e-dashboard-bypass', '1');
      } catch (e) {
        console.warn('Could not set localStorage:', e);
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
      // Navigate to feed first
      await page.goto('/feed', { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await waitForPageReady(page);

      // Diagnostic: Check if dashboard nav exists before clicking
      const dashboardNav = page.locator('[data-testid="dashboard-nav"]');
      const navExists = await dashboardNav.count();
      console.log('[dashboard-stability] Dashboard nav element count:', navExists);

      // Comprehensive diagnostics for GlobalNavigation
      const navDiagnostics = await page.evaluate(() => {
        const nav = document.querySelector('nav') || document.querySelector('[role="navigation"]');
        const allLinks = Array.from(document.querySelectorAll('a[href]'));
        const dashboardLinks = allLinks.filter(link => 
          link.getAttribute('href')?.includes('dashboard') || 
          link.textContent?.toLowerCase().includes('dashboard')
        );
        const navLinks = allLinks.filter(link => 
          link.closest('nav') || link.closest('[role="navigation"]')
        );
        
        // Check for loading skeleton
        const loadingSkeleton = document.querySelector('.animate-pulse');
        const hasLoadingSkeleton = !!loadingSkeleton;
        
        // Check for GlobalNavigation component structure
        const globalNav = document.querySelector('[class*="GlobalNavigation"]') || 
                         document.querySelector('nav[aria-label*="navigation"]') ||
                         nav;
        
        return {
          hasNav: !!nav,
          navHTML: nav ? nav.innerHTML.substring(0, 1000) : null,
          allLinksCount: allLinks.length,
          dashboardLinksCount: dashboardLinks.length,
          dashboardLinks: dashboardLinks.map(link => ({
            href: link.getAttribute('href'),
            text: link.textContent?.trim(),
            testId: link.getAttribute('data-testid'),
            visible: link.offsetParent !== null,
          })),
          navLinksCount: navLinks.length,
          navLinks: navLinks.slice(0, 10).map(link => ({
            href: link.getAttribute('href'),
            text: link.textContent?.trim(),
            testId: link.getAttribute('data-testid'),
          })),
          hasLoadingSkeleton,
          loadingSkeletonHTML: loadingSkeleton ? loadingSkeleton.outerHTML.substring(0, 200) : null,
          globalNavExists: !!globalNav,
        };
      });
      console.log('[dashboard-stability] Navigation diagnostics:', JSON.stringify(navDiagnostics, null, 2));

      // Check AuthContext state
      const authContextDiagnostics = await page.evaluate(() => {
        // Try to access React DevTools or component state
        const reactFiber = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
        return {
          reactDevToolsAvailable: !!reactFiber,
          localStorage: {
            bypassFlag: localStorage.getItem('e2e-dashboard-bypass'),
            userStore: localStorage.getItem('user-store') ? 'exists' : 'missing',
          },
          cookies: document.cookie,
        };
      });
      console.log('[dashboard-stability] AuthContext diagnostics:', JSON.stringify(authContextDiagnostics, null, 2));

      if (navExists === 0) {
        // Try alternative selectors
        const altNav = page.locator('text=Dashboard').or(page.locator('a[href*="dashboard"]'));
        const altNavCount = await altNav.count();
        console.log('[dashboard-stability] Alternative dashboard nav elements found:', altNavCount);
      }

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

    // Set up E2E bypass for this test
    await page.addInitScript(() => {
      try {
        localStorage.setItem('e2e-dashboard-bypass', '1');
      } catch (e) {
        console.warn('Could not set localStorage:', e);
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
      await page.goto('/dashboard', { waitUntil: 'domcontentloaded', timeout: 60_000 });
      await waitForPageReady(page);

      // Comprehensive diagnostics for PersonalDashboard
      const dashboardDiagnostics = await page.evaluate(() => {
        const personalDashboard = document.querySelector('[data-testid="personal-dashboard"]');
        const dashboardHeader = document.querySelector('[data-testid="dashboard-header"]');
        const dashboardTitle = document.querySelector('[data-testid="dashboard-title"]');
        const personalAnalytics = document.querySelector('[data-testid="personal-analytics"]');
        const dashboardNav = document.querySelector('[data-testid="dashboard-nav"]');
        const settingsContent = document.querySelector('[data-testid="settings-content"]');
        
        // Check for loading states
        const loadingSkeletons = document.querySelectorAll('.animate-pulse, [class*="Skeleton"]');
        const spinners = document.querySelectorAll('.animate-spin');
        
        // Check for error states
        const errorMessages = document.querySelectorAll('[class*="error"], [class*="Error"]');
        
        // Check page structure
        const mainContent = document.querySelector('main') || document.querySelector('[role="main"]');
        const dashboardPage = document.querySelector('[class*="dashboard"]');
        
        return {
          personalDashboard: {
            exists: !!personalDashboard,
            visible: personalDashboard ? (personalDashboard as HTMLElement).offsetParent !== null : false,
            innerHTML: personalDashboard ? (personalDashboard as HTMLElement).innerHTML.substring(0, 500) : null,
          },
          dashboardHeader: {
            exists: !!dashboardHeader,
            visible: dashboardHeader ? (dashboardHeader as HTMLElement).offsetParent !== null : false,
          },
          dashboardTitle: {
            exists: !!dashboardTitle,
            visible: dashboardTitle ? (dashboardTitle as HTMLElement).offsetParent !== null : false,
            text: dashboardTitle?.textContent?.trim(),
          },
          personalAnalytics: {
            exists: !!personalAnalytics,
            visible: personalAnalytics ? (personalAnalytics as HTMLElement).offsetParent !== null : false,
          },
          dashboardNav: {
            exists: !!dashboardNav,
            visible: dashboardNav ? (dashboardNav as HTMLElement).offsetParent !== null : false,
          },
          settingsContent: {
            exists: !!settingsContent,
            visible: settingsContent ? (settingsContent as HTMLElement).offsetParent !== null : false,
          },
          loadingStates: {
            skeletonsCount: loadingSkeletons.length,
            spinnersCount: spinners.length,
            hasLoading: loadingSkeletons.length > 0 || spinners.length > 0,
          },
          errorStates: {
            errorsCount: errorMessages.length,
            errorTexts: Array.from(errorMessages).slice(0, 3).map(el => el.textContent?.trim()),
          },
          pageStructure: {
            hasMain: !!mainContent,
            hasDashboardPage: !!dashboardPage,
            url: window.location.href,
            pathname: window.location.pathname,
          },
          localStorage: {
            bypassFlag: localStorage.getItem('e2e-dashboard-bypass'),
            userStore: localStorage.getItem('user-store') ? 'exists' : 'missing',
            profileStore: localStorage.getItem('profile-store') ? 'exists' : 'missing',
          },
        };
      });
      console.log('[dashboard-stability] PersonalDashboard diagnostics:', JSON.stringify(dashboardDiagnostics, null, 2));

      // Check component rendering state
      const componentState = await page.evaluate(() => {
        // Try to find React component state via DOM attributes or data attributes
        const allTestIds = Array.from(document.querySelectorAll('[data-testid]')).map(el => ({
          testId: el.getAttribute('data-testid'),
          tag: el.tagName,
          visible: (el as HTMLElement).offsetParent !== null,
          className: el.className,
        }));
        
        return {
          allTestIds: allTestIds.slice(0, 20),
          totalTestIds: allTestIds.length,
        };
      });
      console.log('[dashboard-stability] Component state:', JSON.stringify(componentState, null, 2));

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

