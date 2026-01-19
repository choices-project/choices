import { expect, test } from '@playwright/test';
import { ensureLoggedOut, loginTestUser, waitForPageReady, SHOULD_USE_MOCKS } from '../../helpers/e2e-setup';

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://www.choices-app.com';
const BASE_URL = process.env.BASE_URL || PRODUCTION_URL;

const regularEmail = process.env.E2E_USER_EMAIL;
const regularPassword = process.env.E2E_USER_PASSWORD;

test.describe('Production Profile Stability Tests', () => {
  test.skip(SHOULD_USE_MOCKS, 'Production tests require real backend (set PLAYWRIGHT_USE_MOCKS=0)');

  test('profile page does not trigger infinite re-renders', async ({ page }) => {
    test.setTimeout(180_000);

    if (!regularEmail || !regularPassword) {
      test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
      return;
    }

    // Track console errors and warnings
    const consoleErrors: string[] = [];
    const consoleWarnings: string[] = [];
    const reactErrorCounts = {
      infiniteLoop: 0,
      hydration: 0,
      maximumUpdate: 0,
    };

    page.on('console', (msg) => {
      const text = msg.text();
      const type = msg.type();
      
      if (type === 'error') {
        consoleErrors.push(text);
        if (text.includes('Maximum update depth exceeded') || text.includes('React error #185')) {
          reactErrorCounts.infiniteLoop++;
        }
        if (text.includes('hydration')) {
          reactErrorCounts.hydration++;
        }
        if (text.includes('Maximum update depth')) {
          reactErrorCounts.maximumUpdate++;
        }
      } else if (type === 'warning') {
        consoleWarnings.push(text);
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

    // CRITICAL: Wait for authentication cookies to be set in browser context before navigating to profile
    // SameSite=Lax cookies may not be sent on programmatic navigations (page.goto),
    // so we need to ensure cookies are available in the browser context first
    const cookies = await page.context().cookies();
    const hasAuthCookie = cookies.some(cookie => 
      cookie.name.startsWith('sb-') && 
      (cookie.name.includes('auth') || cookie.name.includes('session') || cookie.value.length > 100)
    );
    
    if (!hasAuthCookie) {
      // Wait a bit more and check again - cookies might be set asynchronously
      await page.waitForTimeout(2_000);
      const cookiesRetry = await page.context().cookies();
      const hasAuthCookieRetry = cookiesRetry.some(cookie => 
        cookie.name.startsWith('sb-') && 
        (cookie.name.includes('auth') || cookie.name.includes('session') || cookie.value.length > 100)
      );
      
      if (!hasAuthCookieRetry) {
        console.warn('[test] Auth cookies not found in browser context after login. Cookies:', 
          cookiesRetry.map(c => c.name).join(', '));
      }
    }
    
    // Additional wait to ensure cookies are fully set in browser context
    await page.waitForTimeout(1_000);

    // First navigate to an authenticated page (feed or dashboard) to establish session
    // This ensures cookies are sent on subsequent navigations
    const currentUrl = page.url();
    if (!currentUrl.includes('/feed') && !currentUrl.includes('/dashboard')) {
      // Navigate to feed first to establish authenticated session
      try {
        const feedLink = page.locator('a[href="/feed"], nav a[href*="feed"]').first();
        const feedLinkCount = await feedLink.count();
        if (feedLinkCount > 0) {
          await feedLink.click({ timeout: 5_000 });
        } else {
          await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        }
        await waitForPageReady(page);
        await page.waitForTimeout(1_000);
      } catch {
        await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await waitForPageReady(page);
      }
    }

    // Now navigate to profile page - try to use a link click if possible (sends SameSite=Lax cookies),
    // otherwise fall back to page.goto()
    try {
      // Look for a link to profile in the navigation
      const profileLink = page.locator('a[href="/profile"], nav a[href*="profile"], [data-testid*="profile"], [data-testid="nav-profile"]').first();
      const linkCount = await profileLink.count();
      if (linkCount > 0) {
        // Click the link to trigger a user-initiated navigation (sends SameSite=Lax cookies)
        await profileLink.click({ timeout: 5_000 });
        await page.waitForURL(
          new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/(profile|auth)`),
          { timeout: 30_000 }
        );
      } else {
        // No link found, use page.goto() as fallback
        await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      }
    } catch {
      // If link click fails, fall back to page.goto()
      await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    }
    
    // CRITICAL: Verify we're actually on the profile page and not redirected to auth
    // Wait for URL to stabilize and check we're not on auth page
    await page.waitForTimeout(2_000);
    const profileUrl = page.url();
    if (profileUrl.includes('/auth')) {
      // If redirected to auth, authentication didn't work - skip this test
      console.warn('[test] Redirected to /auth - authentication not properly established, skipping test');
      test.skip(true, 'Authentication not properly established in test environment');
      return;
    }
    
    // Wait for page to be ready and verify we're on profile page
    await waitForPageReady(page, 30_000);
    await expect(page).toHaveURL(new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/profile`), { timeout: 10_000 });
    
    // Wait for initial load and ensure content is present
    await page.waitForTimeout(2_000);

    // Monitor page for 30 seconds to detect infinite loops
    const initialState = {
      bodyTextLength: (await page.locator('body').textContent() ?? '').length,
      spinnerVisible: await page.locator('.animate-spin').first().isVisible({ timeout: 500 }).catch(() => false),
    };

    // Check every 2 seconds for 30 seconds
    for (let i = 0; i < 15; i++) {
      await page.waitForTimeout(2_000);
      
      const currentState = {
        bodyTextLength: (await page.locator('body').textContent() ?? '').length,
        spinnerVisible: await page.locator('.animate-spin').first().isVisible({ timeout: 500 }).catch(() => false),
        url: page.url(),
      };

      // Log state changes
      if (i % 3 === 0) {
        console.log(`Stability check ${i + 1}/15:`, {
          bodyTextLength: currentState.bodyTextLength,
          spinnerVisible: currentState.spinnerVisible,
          url: currentState.url,
          errors: consoleErrors.length,
          warnings: consoleWarnings.length,
        });
      }

      // Check if spinner is stuck
      if (currentState.spinnerVisible && i > 5) {
        console.log('Spinner still visible after 10 seconds - possible infinite loop');
        break;
      }
    }

    // Final state check
    const finalSpinnerVisible = await page.locator('.animate-spin').first().isVisible({ timeout: 2_000 }).catch(() => false);
    const finalBodyText = await page.locator('body').textContent();
    const hasContent = finalBodyText && finalBodyText.length > 200 && !finalBodyText.includes('Something went wrong');

    // Log results
    console.log('\n=== PROFILE STABILITY TEST RESULTS ===');
    console.log('React Error Counts:', reactErrorCounts);
    console.log('Total Console Errors:', consoleErrors.length);
    console.log('Total Console Warnings:', consoleWarnings.length);
    console.log('Final Spinner Visible:', finalSpinnerVisible);
    console.log('Has Content:', hasContent);
    console.log('Initial Body Text Length:', initialState.bodyTextLength);
    console.log('Final Body Text Length:', finalBodyText?.length || 0);

    if (consoleErrors.length > 0) {
      console.log('\n=== CONSOLE ERRORS ===');
      consoleErrors.slice(0, 10).forEach((err, i) => {
        console.log(`${i + 1}. ${err}`);
      });
    }

    // Take screenshot
    await page.screenshot({ path: 'test-results/profile-stability.png', fullPage: true });

    // Assertions
    expect(reactErrorCounts.infiniteLoop).toBe(0);
    expect(reactErrorCounts.maximumUpdate).toBe(0);
    expect(finalSpinnerVisible).toBe(false);
    expect(hasContent).toBe(true);
  });

  test('profile edit page does not trigger infinite re-renders', async ({ page }) => {
    test.setTimeout(120_000);

    if (!regularEmail || !regularPassword) {
      test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
      return;
    }

    const consoleErrors: string[] = [];
    const reactErrorCounts = {
      infiniteLoop: 0,
      maximumUpdate: 0,
    };

    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
        if (text.includes('Maximum update depth exceeded') || text.includes('React error #185')) {
          reactErrorCounts.infiniteLoop++;
        }
        if (text.includes('Maximum update depth')) {
          reactErrorCounts.maximumUpdate++;
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

    // CRITICAL: Wait for authentication cookies to be set in browser context before navigating to profile
    // SameSite=Lax cookies may not be sent on programmatic navigations (page.goto),
    // so we need to ensure cookies are available in the browser context first
    const cookies = await page.context().cookies();
    const hasAuthCookie = cookies.some(cookie => 
      cookie.name.startsWith('sb-') && 
      (cookie.name.includes('auth') || cookie.name.includes('session') || cookie.value.length > 100)
    );
    
    if (!hasAuthCookie) {
      // Wait a bit more and check again - cookies might be set asynchronously
      await page.waitForTimeout(2_000);
      const cookiesRetry = await page.context().cookies();
      const hasAuthCookieRetry = cookiesRetry.some(cookie => 
        cookie.name.startsWith('sb-') && 
        (cookie.name.includes('auth') || cookie.name.includes('session') || cookie.value.length > 100)
      );
      
      if (!hasAuthCookieRetry) {
        console.warn('[test] Auth cookies not found in browser context after login. Cookies:', 
          cookiesRetry.map(c => c.name).join(', '));
      }
    }
    
    // Additional wait to ensure cookies are fully set in browser context
    await page.waitForTimeout(1_000);

    // First navigate to an authenticated page (feed or dashboard) to establish session
    // This ensures cookies are sent on subsequent navigations
    const currentUrl = page.url();
    if (!currentUrl.includes('/feed') && !currentUrl.includes('/dashboard')) {
      // Navigate to feed first to establish authenticated session
      try {
        const feedLink = page.locator('a[href="/feed"], nav a[href*="feed"]').first();
        const feedLinkCount = await feedLink.count();
        if (feedLinkCount > 0) {
          await feedLink.click({ timeout: 5_000 });
        } else {
          await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        }
        await waitForPageReady(page);
        await page.waitForTimeout(1_000);
      } catch {
        await page.goto(`${BASE_URL}/feed`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        await waitForPageReady(page);
      }
    }

    // Navigate to profile edit page - try to use a link click if possible (sends SameSite=Lax cookies),
    // otherwise fall back to page.goto()
    try {
      // First navigate to profile page, then look for edit link
      const profileLink = page.locator('a[href="/profile"], nav a[href*="profile"], [data-testid*="profile"], [data-testid="nav-profile"]').first();
      const linkCount = await profileLink.count();
      if (linkCount > 0) {
        // Click the link to trigger a user-initiated navigation (sends SameSite=Lax cookies)
        await profileLink.click({ timeout: 5_000 });
        await page.waitForURL(
          new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/(profile|auth)`),
          { timeout: 30_000 }
        );
        await waitForPageReady(page);
        await page.waitForTimeout(1_000);
        
        // CRITICAL: Verify we're on profile page and not redirected to auth
        const profileUrl = page.url();
        if (profileUrl.includes('/auth')) {
          console.warn('[test] Redirected to /auth when accessing profile - authentication not properly established, skipping test');
          test.skip(true, 'Authentication not properly established in test environment');
          return;
        }
        
        // Then look for edit link on profile page
        const editLink = page.locator('a[href*="edit"], button:has-text("Edit"), [data-testid*="edit"]').first();
        const editLinkCount = await editLink.count();
        if (editLinkCount > 0) {
          await editLink.click({ timeout: 5_000 });
          await page.waitForURL(
            new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/profile/edit`),
            { timeout: 30_000 }
          );
        } else {
          // Fall back to direct navigation to edit page
          await page.goto(`${BASE_URL}/profile/edit`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
        }
      } else {
        // No profile link found, use page.goto() as fallback
        await page.goto(`${BASE_URL}/profile/edit`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      }
    } catch {
      // If link click fails, fall back to page.goto()
      await page.goto(`${BASE_URL}/profile/edit`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    }
    
    // CRITICAL: Verify we're actually on the profile edit page and not redirected to auth
    await page.waitForTimeout(2_000);
    const editPageUrl = page.url();
    if (editPageUrl.includes('/auth')) {
      console.warn('[test] Redirected to /auth when accessing profile/edit - authentication not properly established, skipping test');
      test.skip(true, 'Authentication not properly established in test environment');
      return;
    }
    
    // Wait for page to be ready and verify we're on profile edit page
    await waitForPageReady(page, 30_000);
    await expect(page).toHaveURL(new RegExp(`${BASE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/profile/edit`), { timeout: 10_000 });
    
    // Wait for page to stabilize
    await page.waitForTimeout(2_000);

    // Monitor for infinite loops
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(2_000);
    }

    const finalSpinnerVisible = await page.locator('.animate-spin').first().isVisible({ timeout: 2_000 }).catch(() => false);
    const hasContent = await page.locator('body').textContent().then(text => {
      return text && text.length > 100 && !text.includes('Something went wrong');
    }).catch(() => false);

    console.log('Profile Edit Stability - React Errors:', reactErrorCounts);
    console.log('Profile Edit Stability - Spinner Visible:', finalSpinnerVisible);
    console.log('Profile Edit Stability - Has Content:', hasContent);

    expect(reactErrorCounts.infiniteLoop).toBe(0);
    expect(reactErrorCounts.maximumUpdate).toBe(0);
    expect(finalSpinnerVisible).toBe(false);
    expect(hasContent).toBe(true);
  });
});

