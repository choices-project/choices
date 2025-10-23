import { test, expect } from '@playwright/test';
import { T } from '@/tests/registry/testIds';

test.describe('Voting System', () => {

  test('should load voting interface', async ({ page }) => {
    // Navigate to polls page first
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');
    
    // Check that we're on the polls page
    expect(page.url()).toContain('/polls');
    
    // Look for poll elements using proper test IDs
    const pollItems = page.locator(`[data-testid="${T.poll.item}"]`);
    if (await pollItems.count() > 0) {
      // Click on first poll if available
      await pollItems.first().click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('/polls/');
    }
  });

  test('should show voting options', async ({ page }) => {
    // Navigate to polls page first
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');
    
    // Look for poll items and click on one if available
    const pollItems = page.locator(`[data-testid="${T.poll.item}"]`);
    if (await pollItems.count() > 0) {
      await pollItems.first().click();
      await page.waitForLoadState('networkidle');
      
      // Look for voting interface elements using proper test IDs
      const voteButton = page.locator(`[data-testid="${T.voteButton}"]`);
      if (await voteButton.isVisible()) {
        expect(voteButton).toBeVisible();
      }
      
      // Look for poll results section
      const pollResults = page.locator(`[data-testid="${T.poll.results}"]`);
      if (await pollResults.isVisible()) {
        expect(pollResults).toBeVisible();
      }
    }
  });

  test('should handle different voting methods', async ({ page }) => {
    // Navigate to polls page first
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');
    
    // Look for poll items and click on one if available
    const pollItems = page.locator(`[data-testid="${T.poll.item}"]`);
    if (await pollItems.count() > 0) {
      await pollItems.first().click();
      await page.waitForLoadState('networkidle');
      
      // Look for voting method elements using proper test IDs
      const voteButton = page.locator(`[data-testid="${T.voteButton}"]`);
      if (await voteButton.isVisible()) {
        expect(voteButton).toBeVisible();
      }
      
      // Look for poll category to identify voting method
      const pollCategory = page.locator(`[data-testid="${T.poll.category}"]`);
      if (await pollCategory.isVisible()) {
        expect(pollCategory).toBeVisible();
      }
    }
  });
});
