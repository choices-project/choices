import { test, expect } from '@playwright/test';

test.describe('Error Resilience Challenges', () => {
  test('should handle network failures gracefully', async ({ page }) => {
    // Challenge: Simulate network failures
    await page.route('**/api/**', route => {
      // Randomly fail 50% of API calls
      if (Math.random() < 0.5) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });
    
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // Challenge: Try to create poll with network failures
    await page.fill('[data-testid="poll-title-input"]', 'Network Failure Test');
    await page.fill('[data-testid="poll-description-input"]', 'Testing network resilience');
    await page.fill('[data-testid="option-input-0"]', 'Option 1');
    await page.fill('[data-testid="option-input-1"]', 'Option 2');
    
    await page.click('[data-testid="create-poll-btn"]');
    
    // Challenge: Should show appropriate error handling
    // Either success or graceful error message
    const hasError = await page.locator('[data-testid*="error"]').isVisible();
    const hasSuccess = await page.locator('[data-testid*="success"]').isVisible();
    
    expect(hasError || hasSuccess).toBeTruthy();
  });

  test('should handle malformed data gracefully', async ({ page }) => {
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // Challenge: Submit with invalid data
    await page.fill('[data-testid="poll-title-input"]', ''); // Empty title
    await page.fill('[data-testid="poll-description-input"]', 'X'.repeat(2000)); // Too long
    await page.fill('[data-testid="option-input-0"]', ''); // Empty option
    
    await page.click('[data-testid="create-poll-btn"]');
    
    // Challenge: Should show validation errors
    const hasValidationError = await page.locator('[data-testid*="error"]').isVisible();
    expect(hasValidationError).toBeTruthy();
  });

  test('should handle browser storage failures', async ({ page }) => {
    // Challenge: Disable localStorage
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => null,
          setItem: () => { throw new Error('Storage full'); },
          removeItem: () => {},
          clear: () => {}
        }
      });
    });
    
    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    
    // Challenge: Should still work without localStorage
    const currentUrl = page.url();
    expect(currentUrl).toContain('/onboarding');
  });

  test('should handle concurrent user sessions', async ({ page, context }) => {
    // Challenge: Create multiple browser contexts
    const contexts = [];
    for (let i = 0; i < 3; i++) {
      contexts.push(await context.browser().newContext());
    }
    
    // Challenge: Navigate to same page in multiple contexts
    const pages = await Promise.all(
      contexts.map(ctx => ctx.newPage())
    );
    
    await Promise.all(
      pages.map(p => p.goto('/polls/create'))
    );
    
    // Challenge: All pages should load successfully
    for (const p of pages) {
      await p.waitForLoadState('networkidle');
      expect(p.url()).toContain('/polls/create');
    }
    
    // Cleanup
    await Promise.all(contexts.map(ctx => ctx.close()));
  });
});
