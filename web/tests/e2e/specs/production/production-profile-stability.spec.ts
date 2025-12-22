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

    // Navigate to profile page
    await page.goto(`${BASE_URL}/profile`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    
    // Wait for initial load
    await page.waitForTimeout(3_000);

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

    // Navigate to profile edit page
    await page.goto(`${BASE_URL}/profile/edit`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    
    // Wait for page to stabilize
    await page.waitForTimeout(5_000);

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

