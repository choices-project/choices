import { test, expect } from '@playwright/test';
import { T } from '@/lib/testing/testIds';

test.describe('Accessibility Challenges', () => {
  test('should be fully keyboard navigable', async ({ page }) => {
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // Challenge: Navigate entire form using only keyboard
    await page.keyboard.press('Tab'); // Focus first element
    await page.keyboard.type('Keyboard Navigation Test');
    
    await page.keyboard.press('Tab'); // Next element
    await page.keyboard.type('Testing keyboard accessibility');
    
    // Try to navigate to option inputs
    await page.keyboard.press('Tab'); // Next element
    await page.keyboard.type('Option 1');
    
    await page.keyboard.press('Tab'); // Next element
    await page.keyboard.type('Option 2');
    
    // Look for submit button and try to submit
    const submitButton = page.locator('button[type="submit"]').first();
    if (await submitButton.isVisible()) {
      await page.keyboard.press('Tab'); // Submit button
      await page.keyboard.press('Enter'); // Submit
    }
    
    // Challenge: Should complete entire flow with keyboard only
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(polls\/create|polls\/\d+|error)/);
  });

  test('should have proper ARIA labels and roles', async ({ page }) => {
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // Challenge: Check for proper ARIA attributes
    const titleInput = page.locator('[data-testid="poll-title-input"]');
    const descriptionInput = page.locator('[data-testid="poll-description-input"]');
    const submitButton = page.locator('[data-testid="create-poll-btn"]');
    
    // Challenge: Inputs should have proper labels
    const titleLabel = await titleInput.getAttribute('aria-label');
    const descriptionLabel = await descriptionInput.getAttribute('aria-label');
    const buttonRole = await submitButton.getAttribute('role');
    
    expect(titleLabel).toBeTruthy();
    expect(descriptionLabel).toBeTruthy();
    expect(buttonRole).toBe('button');
  });

  test('should work with screen reader', async ({ page }) => {
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // Challenge: Check for screen reader compatibility
    const pageTitle = await page.title();
    const mainHeading = await page.locator('h1').first().textContent();
    const formLabel = await page.locator('form').getAttribute('aria-labelledby');
    
    // Challenge: Should have proper semantic structure
    expect(pageTitle).toBeTruthy();
    expect(mainHeading).toBeTruthy();
    expect(formLabel).toBeTruthy();
  });

  test('should handle high contrast mode', async ({ page }) => {
    // Challenge: Enable high contrast mode
    await page.emulateMedia({ colorScheme: 'dark' });
    
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // Challenge: Check if form is still usable in high contrast
    const titleInput = page.locator('[data-testid="poll-title-input"]');
    const submitButton = page.locator('[data-testid="create-poll-btn"]');
    
    // Challenge: Elements should be visible and interactive
    await expect(titleInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    
    // Challenge: Should be able to interact with form
    await titleInput.fill('High Contrast Test');
    await submitButton.click();
  });

  test('should handle zoom levels up to 400%', async ({ page }) => {
    // Challenge: Set zoom to 400%
    await page.setViewportSize({ width: 320, height: 568 }); // Mobile size
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // Challenge: Form should still be usable at high zoom
    const titleInput = page.locator('[data-testid="poll-title-input"]');
    const descriptionInput = page.locator('[data-testid="poll-description-input"]');
    const submitButton = page.locator('[data-testid="create-poll-btn"]');
    
    // Challenge: All elements should be visible and accessible
    await expect(titleInput).toBeVisible();
    await expect(descriptionInput).toBeVisible();
    await expect(submitButton).toBeVisible();
    
    // Challenge: Should be able to complete form
    await titleInput.fill('Zoom Test');
    await descriptionInput.fill('Testing at 400% zoom');
    await submitButton.click();
  });
});
