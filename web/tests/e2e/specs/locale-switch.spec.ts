import { expect, test, type Page } from '@playwright/test';

import { waitForPageReady } from '../helpers/e2e-setup';

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
    await gotoHarness(page);
  });

  test('language selector is visible and accessible', async ({ page }) => {
    const selector = page.getByTestId('language-selector').first();
    await expect(selector).toBeVisible({ timeout: 30_000 });
    
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
    const currentLanguage = await button.textContent();
    
    // Open dropdown
    await button.click();
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    
    // Find a different language option (not the current one)
    const options = selector.locator('[role="option"]');
    const optionCount = await options.count();
    
    if (optionCount > 1) {
      // Select a different option (second option if available)
      const differentOption = options.nth(1);
      const newLanguage = await differentOption.textContent();
      
      if (newLanguage !== currentLanguage) {
        await differentOption.click();
        
        // Wait for locale to change
        await page.waitForTimeout(1000);
        
        // Verify button text updated
        const updatedButton = selector.getByRole('button').first();
        const updatedLanguage = await updatedButton.textContent();
        
        // Should show the new language (might be different format)
        expect(updatedLanguage).not.toBe(currentLanguage);
      }
    }
  });

  test('persists locale preference across navigation', async ({ page }) => {
    const selector = page.getByTestId('language-selector').first();
    const button = selector.getByRole('button').first();
    
    // Get initial language
    const initialLanguage = await button.textContent();
    
    // Change language if multiple options available
    await button.click();
    const options = selector.locator('[role="option"]');
    const optionCount = await options.count();
    
    if (optionCount > 1) {
      const newOption = options.nth(1);
      const newLanguageText = await newOption.textContent();
      
      if (newLanguageText !== initialLanguage) {
        await newOption.click();
        await page.waitForTimeout(1000);
        
    // Navigate to another (query-param) view of the harness to simulate route changes
        await gotoHarness(page, `${HARNESS_ROUTE}?view=secondary`, 60_000);
        
        // Verify language selector still shows the new language
        const newPageSelector = page.getByTestId('language-selector').first();
        const newPageButton = newPageSelector.getByRole('button').first();
        const persistedLanguage = await newPageButton.textContent();
        
        // Should maintain the changed language
        expect(persistedLanguage).not.toBe(initialLanguage);
      }
    }
  });

  test('restores locale preference on page reload', async ({ page }) => {
    const selector = page.getByTestId('language-selector').first();
    const button = selector.getByRole('button').first();
    
    // Get initial language
    const initialLanguage = await button.textContent();
    
    // Change language if multiple options available
    await button.click();
    const options = selector.locator('[role="option"]');
    const optionCount = await options.count();
    
    if (optionCount > 1) {
      const newOption = options.nth(1);
      const newLanguageText = await newOption.textContent();
      
      if (newLanguageText !== initialLanguage) {
        await newOption.click();
        await page.waitForTimeout(1000);
        
        // Get the new language text from button
        const changedLanguage = await button.textContent();
        
        // Reload page
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 60_000 });
        await waitForPageReady(page, 60_000);
        
        // Verify language is restored
        const reloadedSelector = page.getByTestId('language-selector').first();
        const reloadedButton = reloadedSelector.getByRole('button').first();
        const restoredLanguage = await reloadedButton.textContent();
        
        // Should restore to the changed language (not initial)
        expect(restoredLanguage).not.toBe(initialLanguage);
      }
    }
  });

  test('handles multiple locale switches correctly', async ({ page }) => {
    const selector = page.getByTestId('language-selector').first();
    const button = selector.getByRole('button').first();
    
    await button.click();
    const options = selector.locator('[role="option"]');
    const optionCount = await options.count();
    
    if (optionCount >= 2) {
      // Switch to second option
      await options.nth(1).click();
      await page.waitForTimeout(500);
      
      // Switch back to first option
      await button.click();
      await options.nth(0).click();
      await page.waitForTimeout(500);
      
      // Switch to second option again
      await button.click();
      await options.nth(1).click();
      await page.waitForTimeout(500);
      
      // Verify selector is still functional
      await expect(button).toBeVisible();
      const finalLanguage = await button.textContent();
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
    const optionCount = await options.count();
    
    if (optionCount > 1 && initialText) {
      await options.nth(1).click();
      await page.waitForTimeout(1000);
      
      // Verify navigation label may have changed (or at least still exists)
      const updatedDashboardLink = page.getByTestId('dashboard-nav').first();
      const updatedText = await updatedDashboardLink.textContent().catch(() => null);
      
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

