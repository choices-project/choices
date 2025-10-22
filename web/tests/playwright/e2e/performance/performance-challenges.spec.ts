import { test, expect } from '@playwright/test';
import type { Database } from '@/types/database';
import { T } from '@/lib/testing/testIds';

test.describe('Performance Challenges', () => {
  test('should handle large poll creation under load', async ({ page }) => {
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // Challenge: Create a poll with maximum options (10)
    const maxOptions = 10;
    const pollTitle = 'Performance Test Poll - ' + 'A'.repeat(200); // Max title length
    const pollDescription = 'B'.repeat(1000); // Max description length
    
    // Step 1: Fill basic information
    await page.fill('[data-testid="poll-title-input"]', pollTitle);
    await page.fill('[data-testid="poll-description-input"]', pollDescription);
    
    // Navigate to next step
    const nextButton = page.locator('button:has-text("Next")').first();
    if (await nextButton.isVisible()) {
      await nextButton.click();
      await page.waitForLoadState('networkidle');
    }
    
    // Step 2: Add maximum options (challenge: 10 options)
    for (let i = 0; i < maxOptions; i++) {
      const optionInput = page.locator(`[data-testid="option-input-${i}"]`);
      if (await optionInput.isVisible()) {
        await optionInput.fill(`Option ${i + 1} - ${'C'.repeat(100)}`);
      } else if (i < 2) {
        // If option inputs don't exist, try to add them
        const addOptionBtn = page.locator('[data-testid="add-option-btn"]');
        if (await addOptionBtn.isVisible()) {
          await addOptionBtn.click();
        }
      }
    }
    
    // Navigate through remaining steps
    for (let step = 2; step < 5; step++) {
      const nextBtn = page.locator('button:has-text("Next")').first();
      if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForLoadState('networkidle');
      }
    }
    
    // Challenge: Submit and measure performance
    const startTime = performance.now();
    // Look for create poll button
    const createButton = page.locator('[data-testid="create-poll-btn"]');
    if (await createButton.isVisible()) {
      await createButton.click();
    } else {
      // Fallback to any submit button
      const submitBtn = page.locator('button:has-text("Create Poll")').first();
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
      }
    }
    await page.waitForLoadState('networkidle');
    const endTime = performance.now();
    
    const loadTime = endTime - startTime;
    console.log(`Large poll creation took: ${loadTime}ms`);
    
    // Challenge: Should complete within reasonable time even with max data
    expect(loadTime).toBeLessThan(30000); // 30 seconds max
  });

  test('should handle rapid navigation without memory leaks', async ({ page }) => {
    // Challenge: Rapid navigation between pages
    const pages = ['/', '/auth', '/onboarding', '/admin', '/polls/create'];
    
    for (let i = 0; i < 5; i++) { // 5 rounds of navigation
      for (const pageUrl of pages) {
        await page.goto(pageUrl);
        await page.waitForLoadState('networkidle');
        
        // Challenge: Check for memory leaks by monitoring performance
        const memory = await page.evaluate(() => {
          return (performance as any).memory?.usedJSHeapSize || 0;
        });
        
        console.log(`Memory usage at ${pageUrl}: ${memory} bytes`);
        
        // Challenge: Memory should not grow excessively
        expect(memory).toBeLessThan(100 * 1024 * 1024); // 100MB limit
      }
    }
  });

  test('should handle concurrent user interactions', async ({ page }) => {
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // Challenge: Rapid form interactions
    const startTime = performance.now();
    
    // Simulate rapid typing
    await page.fill('[data-testid="poll-title-input"]', 'Concurrent Test Poll');
    await page.fill('[data-testid="poll-description-input"]', 'Testing rapid interactions');
    
    // Challenge: Add options rapidly
    for (let i = 0; i < 5; i++) {
      await page.fill(`[data-testid="option-input-${i}"]`, `Rapid Option ${i + 1}`);
    }
    
    // Challenge: Rapid form submissions
    await page.click('[data-testid="create-poll-btn"]');
    
    const endTime = performance.now();
    const interactionTime = endTime - startTime;
    
    console.log(`Rapid interactions completed in: ${interactionTime}ms`);
    
    // Challenge: Should handle rapid interactions smoothly
    expect(interactionTime).toBeLessThan(10000); // 10 seconds max
  });
});
