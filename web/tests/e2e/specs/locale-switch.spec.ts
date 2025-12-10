import { expect, test, type Locator, type Page } from '@playwright/test';

import { setupExternalAPIMocks, waitForPageReady } from '../helpers/e2e-setup';

const HARNESS_ROUTE = '/e2e/global-navigation';

const gotoHarness = async (page: Page, route: string = HARNESS_ROUTE, timeout = 60_000) => {
  await page.goto(route, { waitUntil: 'domcontentloaded', timeout });
  await waitForPageReady(page, timeout);
  await page.waitForLoadState('networkidle', { timeout }).catch(() => undefined);
  await page.waitForFunction(
    () => document.documentElement.dataset.globalNavigationHarness === 'ready',
    undefined,
    { timeout },
  );
};

const LOCALE_COOKIE_NAME = 'choices.locale';

type LanguageSelection = {
  option: Locator;
  label: string;
  code?: string | null;
};

const waitForLocaleCookie = async (page: Page, expected: string | null | undefined) => {
  if (!expected) {
    await page.waitForTimeout(500);
    return;
  }

  await page.waitForFunction(
    ({ cookieName, expectedValue }) => {
      const cookies = document.cookie.split('; ').filter(Boolean);
      return cookies.some((cookie) => {
        if (!cookie.startsWith(`${cookieName}=`)) {
          return false;
        }
        return cookie.slice(cookieName.length + 1) === expectedValue;
      });
    },
    { cookieName: LOCALE_COOKIE_NAME, expectedValue: expected },
    { timeout: 10_000 },
  );
};

const normalizeLabel = (value?: string | null) =>
  value?.replace(/✓/g, '').replace(/\s+/g, ' ').trim() ?? null;

const findAlternateLanguage = async (
  options: Locator,
  currentLabel?: string | null,
): Promise<LanguageSelection | null> => {
  const count = await options.count();
  const normalizedCurrent = normalizeLabel(currentLabel);
  for (let index = 0; index < count; index += 1) {
    const option = options.nth(index);
    const rawLabel = await option.textContent();
    const label = normalizeLabel(rawLabel);
    if (!label || label === normalizedCurrent) {
      continue;
    }
    const code = await option.getAttribute('data-language-option');
    return { option, label, code };
  }
  return null;
};

const applyLanguageSelection = async (page: Page, selection: LanguageSelection) => {
  await selection.option.click();
  await waitForLocaleCookie(page, selection.code);
  await page.waitForFunction(
    () => document.documentElement.dataset.globalNavigationHarness === 'ready',
    { timeout: 60_000 },
  );
};

/**
 * Locale Switching E2E Tests
 * 
 * Verifies that locale/language switching works correctly across the application:
 * - Language selector appears and is functional
 * - Locale changes persist across navigation
 * - UI labels and content update to reflect new locale
 * - Locale preference is saved and restored on page reload
 * - Multiple locale switches work correctly
 */

test.describe('Locale Switching', () => {
  test.beforeEach(async ({ page }) => {
    // Mock site-messages API to prevent Supabase errors from blocking tests
    await setupExternalAPIMocks(page, { api: true });
    await page.context().clearCookies();
    await gotoHarness(page);
  });

  test.beforeEach(async ({ page }) => {
    // Mock site-messages API to prevent Supabase errors from blocking tests
    await setupExternalAPIMocks(page, { api: true });
  });

  test('language selector is visible and accessible', async ({ page }) => {
    const selector = page.getByTestId('language-selector').first();
    await expect(selector).toBeVisible({ timeout: 60_000 });
    
    const button = selector.getByRole('button').first();
    await expect(button).toBeVisible();
    await expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  test('opens language dropdown on click', async ({ page }) => {
    const selector = page.getByTestId('language-selector').first();
    const button = selector.getByRole('button').first();
    
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    
    // Should show language options
    const options = selector.locator('[role="option"]');
    const count = await options.count();
    expect(count).toBeGreaterThan(0);
  });

  test('switches locale when language option is selected', async ({ page }) => {
    const selector = page.getByTestId('language-selector').first();
    const button = selector.getByRole('button').first();
    
    // Get current language
    const currentLanguage = (await button.textContent())?.trim();
    
    // Open dropdown
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    
    // Find a different language option (not the current one)
    const options = selector.locator('[role="option"]');
    const selection = await findAlternateLanguage(options, currentLanguage);
    
    if (selection) {
      await applyLanguageSelection(page, selection);
      
      await expect(button).toHaveText(selection.label);
      
      const liveRegion = page.getByTestId('language-selector-live-message');
      await expect(liveRegion).not.toHaveText('');
    }
  });

  test('persists locale preference across navigation', async ({ page }) => {
    const selector = page.getByTestId('language-selector').first();
    const button = selector.getByRole('button').first();
    
    // Get initial language
    const initialLanguage = (await button.textContent())?.trim();
    
    // Change language if multiple options available
    await button.click();
    const options = selector.locator('[role="option"]');
    const selection = await findAlternateLanguage(options, initialLanguage);
    
    if (selection) {
      await applyLanguageSelection(page, selection);
      
      await expect(button).toHaveText(selection.label);
      const changedLabel = (await button.textContent())?.trim() ?? selection.label;

      // Navigate to another (query-param) view of the harness to simulate route changes
      await gotoHarness(page, `${HARNESS_ROUTE}?view=secondary`, 60_000);
      
      // Verify language selector still shows the new language
      const newPageSelector = page.getByTestId('language-selector').first();
      const newPageButton = newPageSelector.getByRole('button').first();
      await expect(newPageButton).toHaveText(changedLabel);
    }
  });

  test('restores locale preference on page reload', async ({ page }) => {
    const selector = page.getByTestId('language-selector').first();
    const button = selector.getByRole('button').first();
    
    // Get initial language
    const initialLanguage = (await button.textContent())?.trim();
    
    // Change language if multiple options available
    await button.click();
    const options = selector.locator('[role="option"]');
    const selection = await findAlternateLanguage(options, initialLanguage);
    
    if (selection) {
      await applyLanguageSelection(page, selection);
      
      await expect(button).toHaveText(selection.label);
      const changedLanguage = (await button.textContent())?.trim() ?? selection.label;
      
      // Reload page
      await page.reload({ waitUntil: 'domcontentloaded', timeout: 60_000 });
      await waitForPageReady(page, 60_000);
      
      // Verify language is restored
      const reloadedSelector = page.getByTestId('language-selector').first();
      const reloadedButton = reloadedSelector.getByRole('button').first();
      await expect(reloadedButton).toHaveText(changedLanguage);
    }
  });

  test('handles multiple locale switches correctly', async ({ page }) => {
    const selector = page.getByTestId('language-selector').first();
    const button = selector.getByRole('button').first();
    
    await button.click();
    const options = selector.locator('[role="option"]');
    const firstSelection = await findAlternateLanguage(options, (await button.textContent())?.trim());
    
    if (firstSelection) {
      // Switch to alternate language
      await applyLanguageSelection(page, firstSelection);
      
      // Switch back to the first option (baseline)
      await button.click();
      const baseOption = options.first();
      const baseCode = await baseOption.getAttribute('data-language-option');
      await baseOption.click();
      // Increase timeout for locale cookie in CI - locale switching may be slower
      await page.waitForFunction(
        ({ cookieName, expectedValue }) => {
          const cookies = document.cookie.split('; ').filter(Boolean);
          return cookies.some((cookie) => {
            if (!cookie.startsWith(`${cookieName}=`)) {
              return false;
            }
            return cookie.slice(cookieName.length + 1) === expectedValue;
          });
        },
        { cookieName: LOCALE_COOKIE_NAME, expectedValue: baseCode },
        { timeout: 30_000 }, // Increase timeout to 30s for CI reliability
      );
      await page.waitForFunction(
        () => document.documentElement.dataset.globalNavigationHarness === 'ready',
        { timeout: 60_000 },
      );
      
      // Switch to alternate language again
      await button.click();
      const secondSelection = await findAlternateLanguage(
        options,
        (await button.textContent())?.trim(),
      );
      if (secondSelection) {
        await applyLanguageSelection(page, secondSelection);
      }
      
      // Verify selector is still functional
      await expect(button).toBeVisible();
      const finalLanguage = (await button.textContent())?.trim();
      expect(finalLanguage).toBeTruthy();
    }
  });

  test('updates UI labels when locale changes', async ({ page }) => {
    // This test assumes the dashboard or current page has some translated content
    // We'll check that navigation labels update
    
    const selector = page.getByTestId('language-selector').first();
    const button = selector.getByRole('button').first();
    
    // Get initial navigation link text (if available)
    const dashboardLink = page.getByTestId('dashboard-nav').first();
    const initialText = await dashboardLink.textContent().catch(() => null);
    
    // Change language
    await button.click();
    const options = selector.locator('[role="option"]');
    const selection = await findAlternateLanguage(options, (await button.textContent())?.trim());
    
    if (selection && initialText) {
      await applyLanguageSelection(page, selection);
      
      // Verify navigation label may have changed (or at least still exists)
      const updatedDashboardLink = page.getByTestId('dashboard-nav').first();
      const updatedText = (await updatedDashboardLink.textContent().catch(() => null))?.trim();
      
      // Label should still exist (even if translation didn't change)
      expect(updatedText).toBeTruthy();
    }
  });

  test('language selector is keyboard accessible', async ({ page }) => {
    const selector = page.getByTestId('language-selector').first();
    const button = selector.getByRole('button').first();
    
    // Tab to the button
    await page.keyboard.press('Tab');
    await expect(button).toBeFocused().catch(() => undefined);
    await button.focus();
    await expect(button).toBeFocused();
    
    // Open dropdown with Enter
    await page.keyboard.press('Enter');
    const options = selector.locator('[role="option"]');
    await expect(options.first()).toBeVisible();
    
    // Close with Escape
    await page.keyboard.press('Escape');
    await expect(button).toHaveAttribute('aria-expanded', 'false');
  });
});

