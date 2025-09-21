import { test, expect } from '@playwright/test';

test.describe('Enhanced Voting System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to polls page first
    await page.goto('/polls');
  });

  test('should display enhanced voting interface with all methods', async ({ page }) => {
    // Check if voting interface is visible
    await expect(page.locator('[data-testid="voting-form"]')).toBeVisible();
    
    // Check for voting method indicators
    await expect(page.locator('text=Cast Your Vote')).toBeVisible();
    
    // Check for verification tier badge
    await expect(page.locator('text=Tier')).toBeVisible();
  });

  test('should support single choice voting', async ({ page }) => {
    // Start voting
    await page.click('[data-testid="start-voting-button"]');
    
    // Check if single choice voting interface is displayed
    await expect(page.locator('[data-testid="voting-form"]')).toBeVisible();
    
    // Select an option (assuming single choice is the default)
    const firstOption = page.locator('input[type="radio"]').first();
    await firstOption.click();
    
    // Submit vote
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Check for success message or redirect
    await expect(page.locator('text=Vote submitted')).toBeVisible();
  });

  test('should support approval voting', async ({ page }) => {
    // Start voting
    await page.click('[data-testid="start-voting-button"]');
    
    // Check if voting interface is displayed
    await expect(page.locator('[data-testid="voting-form"]')).toBeVisible();
    
    // For approval voting, we would need to select multiple options
    // This test assumes the poll is configured for approval voting
    const checkboxes = page.locator('input[type="checkbox"]');
    if (await checkboxes.count() > 0) {
      await checkboxes.first().click();
      await checkboxes.nth(1).click();
      
      // Submit vote
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      
      // Check for success message
      await expect(page.locator('text=Vote submitted')).toBeVisible();
    }
  });

  test('should support ranked choice voting', async ({ page }) => {
    // Start voting
    await page.click('[data-testid="start-voting-button"]');
    
    // Check if voting interface is displayed
    await expect(page.locator('[data-testid="voting-form"]')).toBeVisible();
    
    // For ranked choice voting, we would need to rank options
    // This test assumes the poll is configured for ranked choice voting
    const rankingElements = page.locator('[data-testid*="rank"]');
    if (await rankingElements.count() > 0) {
      // Select first choice
      await rankingElements.first().click();
      
      // Submit vote
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      
      // Check for success message
      await expect(page.locator('text=Vote submitted')).toBeVisible();
    }
  });

  test('should support quadratic voting', async ({ page }) => {
    // Start voting
    await page.click('[data-testid="start-voting-button"]');
    
    // Check if voting interface is displayed
    await expect(page.locator('[data-testid="voting-form"]')).toBeVisible();
    
    // For quadratic voting, we would need to allocate credits
    // This test assumes the poll is configured for quadratic voting
    const creditInputs = page.locator('input[type="number"]');
    if (await creditInputs.count() > 0) {
      await creditInputs.first().fill('5');
      
      // Submit vote
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      
      // Check for success message
      await expect(page.locator('text=Vote submitted')).toBeVisible();
    }
  });

  test('should support range voting', async ({ page }) => {
    // Start voting
    await page.click('[data-testid="start-voting-button"]');
    
    // Check if voting interface is displayed
    await expect(page.locator('[data-testid="voting-form"]')).toBeVisible();
    
    // For range voting, we would need to set ratings
    // This test assumes the poll is configured for range voting
    const rangeInputs = page.locator('input[type="range"]');
    if (await rangeInputs.count() > 0) {
      await rangeInputs.first().fill('7');
      
      // Submit vote
      const submitButton = page.locator('button[type="submit"]');
      await submitButton.click();
      
      // Check for success message
      await expect(page.locator('text=Vote submitted')).toBeVisible();
    }
  });

  test('should handle offline voting with PWA', async ({ page }) => {
    // Check if PWA features are available
    const pwaIndicator = page.locator('[data-testid="pwa-indicator"]');
    if (await pwaIndicator.count() > 0) {
      await expect(pwaIndicator).toBeVisible();
    }
    
    // Start voting
    await page.click('[data-testid="start-voting-button"]');
    
    // Check if offline voting is supported
    const offlineIndicator = page.locator('[data-testid="offline-voting"]');
    if (await offlineIndicator.count() > 0) {
      await expect(offlineIndicator).toBeVisible();
    }
  });

  test('should display voting results after submission', async ({ page }) => {
    // Start voting
    await page.click('[data-testid="start-voting-button"]');
    
    // Submit a vote
    const firstOption = page.locator('input[type="radio"]').first();
    await firstOption.click();
    
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Check if results are displayed
    await expect(page.locator('[data-testid="voting-results"]')).toBeVisible();
    
    // Check for vote count
    await expect(page.locator('text=votes')).toBeVisible();
  });

  test('should handle voting errors gracefully', async ({ page }) => {
    // Start voting
    await page.click('[data-testid="start-voting-button"]');
    
    // Try to submit without selecting an option
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Check for error message
    await expect(page.locator('text=Please select an option')).toBeVisible();
  });

  test('should show verification tier information', async ({ page }) => {
    // Check if verification tier is displayed
    await expect(page.locator('text=Tier')).toBeVisible();
    
    // Check for tier-specific features
    const tierBadge = page.locator('[data-testid="verification-tier"]');
    if (await tierBadge.count() > 0) {
      await expect(tierBadge).toBeVisible();
    }
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if voting interface is still visible and functional
    await expect(page.locator('[data-testid="voting-form"]')).toBeVisible();
    
    // Start voting
    await page.click('[data-testid="start-voting-button"]');
    
    // Check if voting options are accessible
    const firstOption = page.locator('input[type="radio"]').first();
    await expect(firstOption).toBeVisible();
  });
});
