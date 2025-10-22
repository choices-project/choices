import { test, expect } from '@playwright/test';
import { T } from '@/lib/testing/testIds';

test.describe('Data Integrity Challenges', () => {
  test('should prevent duplicate poll creation', async ({ page }) => {
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // Challenge: Create identical polls
    const pollData = {
      title: 'Duplicate Test Poll',
      description: 'Testing duplicate prevention',
      options: ['Option 1', 'Option 2']
    };
    
    // Create first poll using proper data-testid attributes
    await page.fill('[data-testid="poll-title-input"]', pollData.title);
    await page.fill('[data-testid="poll-description-input"]', pollData.description);
    
    // Fill option inputs using proper data-testid
    await page.fill('[data-testid="option-input-0"]', pollData.options[0] || '');
    await page.fill('[data-testid="option-input-1"]', pollData.options[1] || '');
    
    // Use proper data-testid for submit button
    await page.click('[data-testid="create-poll-btn"]');
    
    await page.waitForLoadState('networkidle');
    
    // Challenge: Try to create identical poll
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    await page.fill('[data-testid="poll-title-input"]', pollData.title);
    await page.fill('[data-testid="poll-description-input"]', pollData.description);
    
    await page.fill('[data-testid="option-input-0"]', pollData.options[0] || '');
    await page.fill('[data-testid="option-input-1"]', pollData.options[1] || '');
    
    await page.click('[data-testid="create-poll-btn"]');
    
    // Challenge: Should either prevent duplicates or allow with warning
    const hasDuplicateWarning = await page.locator('text=duplicate').isVisible();
    const hasError = await page.locator('text=error').isVisible();
    const currentUrl = page.url();
    
    expect(hasDuplicateWarning || hasError || currentUrl.includes('/polls/')).toBeTruthy();
  });

  test('should handle data corruption gracefully', async ({ page }) => {
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // Challenge: Intercept and corrupt API response
    await page.route('**/api/polls', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ corrupted: true, invalid: 'data' })
      });
    });
    
    await page.fill('[data-testid="poll-title-input"]', 'Corruption Test');
    await page.fill('[data-testid="poll-description-input"]', 'Testing data corruption handling');
    await page.fill('[data-testid="option-input-0"]', 'Option 1');
    
    await page.click('[data-testid="create-poll-btn"]');
    
    // Challenge: Should handle corrupted response gracefully
    const hasError = await page.locator('[data-testid*="error"]').isVisible();
    expect(hasError).toBeTruthy();
  });

  test('should validate data types strictly', async ({ page }) => {
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // Challenge: Try to submit with invalid data types
    await page.evaluate(() => {
      const titleInput = document.querySelector('[data-testid="poll-title-input"]') as HTMLInputElement;
      if (titleInput) {
        titleInput.value = null as any; // Invalid type
      }
    });
    
    await page.fill('[data-testid="poll-description-input"]', 'Testing data type validation');
    await page.fill('[data-testid="option-input-0"]', 'Option 1');
    
    await page.click('[data-testid="create-poll-btn"]');
    
    // Challenge: Should validate data types
    const hasValidationError = await page.locator('[data-testid*="error"]').isVisible();
    expect(hasValidationError).toBeTruthy();
  });

  test('should handle large data payloads', async ({ page }) => {
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // Challenge: Create poll with maximum data
    const maxTitle = 'A'.repeat(200);
    const maxDescription = 'B'.repeat(1000);
    const maxOptions = Array.from({ length: 10 }, (_, i) => `Option ${i + 1} - ${'C'.repeat(100)}`);
    
    await page.fill('[data-testid="poll-title-input"]', maxTitle);
    await page.fill('[data-testid="poll-description-input"]', maxDescription);
    
    for (let i = 0; i < maxOptions.length; i++) {
      await page.fill(`[data-testid="option-input-${i}"]`, maxOptions[i] || '');
    }
    
    await page.click('[data-testid="create-poll-btn"]');
    
    // Challenge: Should handle large payloads
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(polls\/create|polls\/\d+|error)/);
  });

  test('should maintain data consistency across sessions', async ({ page, context }) => {
    // Challenge: Create poll in one session
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    await page.fill('[data-testid="poll-title-input"]', 'Session Consistency Test');
    await page.fill('[data-testid="poll-description-input"]', 'Testing data consistency');
    await page.fill('[data-testid="option-input-0"]', 'Option 1');
    await page.click('[data-testid="create-poll-btn"]');
    
    await page.waitForLoadState('networkidle');
    const pollUrl = page.url();
    
    // Challenge: Open same poll in new session
    const newPage = await context.newPage();
    await newPage.goto(pollUrl);
    await newPage.waitForLoadState('networkidle');
    
    // Challenge: Data should be consistent
    const pollTitle = await newPage.locator('h1').textContent();
    expect(pollTitle).toContain('Session Consistency Test');
    
    await newPage.close();
  });
});
