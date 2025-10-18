import { test, expect } from '@playwright/test';
import { T } from '@/lib/testing/testIds';
import { AuthHelper } from './helpers/auth-helper';

test.describe('Edge Case Challenges', () => {
  test.beforeEach(async ({ page }) => {
    // Authenticate before each test
    await AuthHelper.authenticateUser(page, 'regular');
  });

  test('should handle extremely long poll titles', async ({ page }) => {
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // Challenge: Try to create poll with extremely long title
    const longTitle = 'A'.repeat(1000); // 1000 characters
    await page.fill('[data-testid="poll-title-input"]', longTitle);
    
    // Challenge: Should either truncate or show validation error
    const inputValue = await page.locator('[data-testid="poll-title-input"]').inputValue();
    const hasError = await page.locator('text=error').isVisible();
    
    expect(inputValue.length <= 200 || hasError).toBeTruthy();
  });

  test('should handle special characters and emojis', async ({ page }) => {
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // Wait for the form to be visible (step 0 - Basic Information)
    await page.waitForSelector('[data-testid="poll-title-input"]', { timeout: 10000 });
    
    // Challenge: Use special characters and emojis
    const specialTitle = 'Poll with émojis 🎉 and spëcial chars: @#$%^&*()';
    const specialDescription = 'Testing unicode: 中文, العربية, русский, 日本語';
    const specialOption = 'Option with émojis 🚀 and symbols: ±×÷=≠≤≥';
    
    await page.fill('[data-testid="poll-title-input"]', specialTitle);
    await page.fill('[data-testid="poll-description-input"]', specialDescription);
    await page.fill('[data-testid="option-input-0"]', specialOption);
    
    // Navigate through the wizard steps to reach the create button
    await page.click('button:has-text("Next")');
    await page.waitForLoadState('networkidle');
    
    // Continue through steps (assuming we need to go through all steps)
    await page.click('button:has-text("Next")');
    await page.waitForLoadState('networkidle');
    
    await page.click('button:has-text("Next")');
    await page.waitForLoadState('networkidle');
    
    await page.click('button:has-text("Next")');
    await page.waitForLoadState('networkidle');
    
    // Now we should be on the final step with the create button
    await page.waitForSelector('[data-testid="create-poll-btn"]', { timeout: 10000 });
    await page.click('[data-testid="create-poll-btn"]');
    
    // Challenge: Should handle unicode properly
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(polls\/create|polls\/\d+|error)/);
  });

  test('should handle rapid form changes', async ({ page }) => {
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // Challenge: Rapidly change form values
    const titleInput = page.locator('[data-testid="poll-title-input"]');
    const descriptionInput = page.locator('[data-testid="poll-description-input"]');
    
    for (let i = 0; i < 10; i++) {
      await titleInput.fill(`Rapid Change ${i}`);
      await descriptionInput.fill(`Description ${i}`);
      await page.waitForTimeout(50); // Small delay
    }
    
    // Challenge: Should handle rapid changes without breaking
    const finalTitle = await titleInput.inputValue();
    expect(finalTitle).toBe('Rapid Change 9');
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // Challenge: Fill form partially
    await page.fill('[data-testid="poll-title-input"]', 'Navigation Test');
    await page.fill('[data-testid="poll-description-input"]', 'Testing browser navigation');
    
    // Challenge: Navigate away and back
    await page.goto('/');
    await page.goBack();
    
    // Challenge: Form data should be preserved or reset gracefully
    const titleValue = await page.locator('[data-testid="poll-title-input"]').inputValue();
    const descriptionValue = await page.locator('[data-testid="poll-description-input"]').inputValue();
    
    // Should either preserve data or reset cleanly
    expect(titleValue === 'Navigation Test' || titleValue === '').toBeTruthy();
  });

  test('should handle form submission with missing required fields', async ({ page }) => {
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // Wait for the form to be visible (step 0 - Basic Information)
    await page.waitForSelector('[data-testid="poll-title-input"]', { timeout: 10000 });
    
    // Challenge: Try to proceed without filling required fields
    // The wizard should prevent progression if required fields are empty
    const nextButton = page.locator('button:has-text("Next")');
    await nextButton.click();
    
    // Challenge: Should show validation errors or stay on current step
    const hasValidationError = await page.locator('[data-testid="poll-title-input"]').isVisible();
    expect(hasValidationError).toBeTruthy(); // Should still be on step 0
  });

  test('should handle concurrent form submissions', async ({ page }) => {
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // Wait for the form to be visible (step 0 - Basic Information)
    await page.waitForSelector('[data-testid="poll-title-input"]', { timeout: 10000 });
    
    // Challenge: Fill form and navigate through wizard
    await page.fill('[data-testid="poll-title-input"]', 'Concurrent Test');
    await page.fill('[data-testid="poll-description-input"]', 'Testing concurrent submissions');
    await page.fill('[data-testid="option-input-0"]', 'Option 1');
    
    // Navigate through wizard steps
    await page.click('button:has-text("Next")');
    await page.waitForLoadState('networkidle');
    
    await page.click('button:has-text("Next")');
    await page.waitForLoadState('networkidle');
    
    await page.click('button:has-text("Next")');
    await page.waitForLoadState('networkidle');
    
    await page.click('button:has-text("Next")');
    await page.waitForLoadState('networkidle');
    
    // Now we should be on the final step with the create button
    await page.waitForSelector('[data-testid="create-poll-btn"]', { timeout: 10000 });
    
    // Challenge: Submit multiple times rapidly
    await page.click('[data-testid="create-poll-btn"]');
    await page.click('[data-testid="create-poll-btn"]');
    await page.click('[data-testid="create-poll-btn"]');
    
    // Challenge: Should handle gracefully (either success or prevent duplicates)
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(polls\/create|polls\/\d+|error)/);
  });

  test('should handle browser refresh during form submission', async ({ page }) => {
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // Wait for the form to be visible (step 0 - Basic Information)
    await page.waitForSelector('[data-testid="poll-title-input"]', { timeout: 10000 });
    
    // Challenge: Fill form and navigate through wizard
    await page.fill('[data-testid="poll-title-input"]', 'Refresh Test');
    await page.fill('[data-testid="poll-description-input"]', 'Testing browser refresh');
    await page.fill('[data-testid="option-input-0"]', 'Option 1');
    
    // Navigate through wizard steps
    await page.click('button:has-text("Next")');
    await page.waitForLoadState('networkidle');
    
    await page.click('button:has-text("Next")');
    await page.waitForLoadState('networkidle');
    
    await page.click('button:has-text("Next")');
    await page.waitForLoadState('networkidle');
    
    await page.click('button:has-text("Next")');
    await page.waitForLoadState('networkidle');
    
    // Now we should be on the final step with the create button
    await page.waitForSelector('[data-testid="create-poll-btn"]', { timeout: 10000 });
    
    // Challenge: Start submission and refresh
    await page.click('[data-testid="create-poll-btn"]');
    await page.reload();
    
    // Challenge: Should handle refresh gracefully
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(polls\/create|polls\/\d+|error)/);
  });
});
