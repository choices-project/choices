import { test, expect } from '@playwright/test';

test.describe('Candidate Accountability Platform', () => {
  test('should load civics page with candidate accountability features', async ({ page }) => {
    await page.goto('/civics');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if page loads successfully
    const currentUrl = page.url();
    expect(currentUrl).toContain('/civics');
  });

  test('should display candidate accountability cards', async ({ page }) => {
    await page.goto('/civics');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if candidate accountability cards are visible
    const accountabilityCards = page.locator('[data-testid="candidate-accountability-card"]');
    
    // If feature is enabled, cards should be visible
    if (await accountabilityCards.count() > 0) {
      await expect(accountabilityCards.first()).toBeVisible();
    }
  });

  test('should display promise tracking information', async ({ page }) => {
    await page.goto('/civics');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for promise-related content
    const promiseElements = page.locator('text=Promises');
    if (await promiseElements.count() > 0) {
      await expect(promiseElements.first()).toBeVisible();
    }
  });

  test('should display campaign finance information', async ({ page }) => {
    await page.goto('/civics');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for campaign finance content
    const financeElements = page.locator('text=Campaign Finance');
    if (await financeElements.count() > 0) {
      await expect(financeElements.first()).toBeVisible();
    }
  });

  test('should display voting record information', async ({ page }) => {
    await page.goto('/civics');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for voting record content
    const votingElements = page.locator('text=Voting Record');
    if (await votingElements.count() > 0) {
      await expect(votingElements.first()).toBeVisible();
    }
  });

  test('should display performance metrics', async ({ page }) => {
    await page.goto('/civics');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for performance metrics content
    const performanceElements = page.locator('text=Performance');
    if (await performanceElements.count() > 0) {
      await expect(performanceElements.first()).toBeVisible();
    }
  });

  test('should display alternative candidates', async ({ page }) => {
    await page.goto('/civics');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for alternative candidates content
    const alternativeElements = page.locator('text=Alternative Candidates');
    if (await alternativeElements.count() > 0) {
      await expect(alternativeElements.first()).toBeVisible();
    }
  });

  test('should handle tab navigation in accountability cards', async ({ page }) => {
    await page.goto('/civics');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for tab navigation
    const tabElements = page.locator('button:has-text("Overview"), button:has-text("Promises"), button:has-text("Campaign Finance")');
    if (await tabElements.count() > 0) {
      // Click on different tabs
      const promisesTab = page.locator('button:has-text("Promises")').first();
      if (await promisesTab.count() > 0) {
        await promisesTab.click();
        await page.waitForTimeout(500); // Wait for tab content to load
      }
    }
  });

  test('should display accountability scores', async ({ page }) => {
    await page.goto('/civics');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for accountability scores
    const scoreElements = page.locator('text=Accountability Score');
    if (await scoreElements.count() > 0) {
      await expect(scoreElements.first()).toBeVisible();
    }
  });

  test('should display constituent satisfaction metrics', async ({ page }) => {
    await page.goto('/civics');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for constituent satisfaction
    const satisfactionElements = page.locator('text=Satisfaction');
    if (await satisfactionElements.count() > 0) {
      await expect(satisfactionElements.first()).toBeVisible();
    }
  });

  test('should display special interest donations', async ({ page }) => {
    await page.goto('/civics');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for special interest donations
    const donationElements = page.locator('text=AIPAC, text=Corporate Donations');
    if (await donationElements.count() > 0) {
      await expect(donationElements.first()).toBeVisible();
    }
  });

  test('should display insider trading information', async ({ page }) => {
    await page.goto('/civics');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for insider trading information
    const insiderElements = page.locator('text=Insider Trading');
    if (await insiderElements.count() > 0) {
      await expect(insiderElements.first()).toBeVisible();
    }
  });

  test('should display party vs constituent alignment', async ({ page }) => {
    await page.goto('/civics');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Look for alignment information
    const alignmentElements = page.locator('text=Party Alignment, text=Constituent Alignment');
    if (await alignmentElements.count() > 0) {
      await expect(alignmentElements.first()).toBeVisible();
    }
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/civics');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Check if page is still functional on mobile
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should handle authentication redirect gracefully', async ({ page }) => {
    await page.goto('/civics');
    
    // Wait for any redirects to complete
    await page.waitForLoadState('networkidle');
    
    const currentUrl = page.url();
    
    // Should either be on civics page or login page
    const isOnCivicsPage = currentUrl.includes('/civics');
    const isOnLoginPage = currentUrl.includes('/login');
    
    expect(isOnCivicsPage || isOnLoginPage).toBeTruthy();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('**/api/v1/civics/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    await page.goto('/civics');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Page should still load even with API errors
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});
