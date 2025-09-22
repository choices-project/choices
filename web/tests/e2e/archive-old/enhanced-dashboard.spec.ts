import { test, expect } from '@playwright/test';

test.describe('Enhanced Dashboard System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
  });

  test('should display enhanced dashboard with user-centric metrics', async ({ page }) => {
    // Check if enhanced dashboard is loaded
    await expect(page.locator('[data-testid="enhanced-dashboard"]')).toBeVisible();
    
    // Check for personal metrics
    await expect(page.locator('[data-testid="polls-created-metric"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-polls-metric"]')).toBeVisible();
    await expect(page.locator('[data-testid="votes-cast-metric"]')).toBeVisible();
    await expect(page.locator('[data-testid="trust-score-metric"]')).toBeVisible();
    
    // Check for recent polls section
    await expect(page.locator('[data-testid="recent-polls-section"]')).toBeVisible();
  });

  test('should display navigation tabs for different views', async ({ page }) => {
    // Check navigation tabs
    await expect(page.locator('text=My Activity')).toBeVisible();
    await expect(page.locator('text=My Trends')).toBeVisible();
    await expect(page.locator('text=My Insights')).toBeVisible();
    await expect(page.locator('text=My Engagement')).toBeVisible();
  });

  test('should switch between different dashboard views', async ({ page }) => {
    // Click on My Trends tab
    await page.click('text=My Trends');
    await page.waitForLoadState('networkidle');
    
    // Should show trends content
    await expect(page.locator('text=My Activity Trends')).toBeVisible();
    
    // Click on My Insights tab
    await page.click('text=My Insights');
    await page.waitForLoadState('networkidle');
    
    // Should show insights content
    await expect(page.locator('text=Top Categories')).toBeVisible();
    await expect(page.locator('text=Achievements')).toBeVisible();
    
    // Click on My Engagement tab
    await page.click('text=My Engagement');
    await page.waitForLoadState('networkidle');
    
    // Should show engagement content
    await expect(page.locator('text=Weekly Activity')).toBeVisible();
    await expect(page.locator('text=Monthly Activity')).toBeVisible();
    await expect(page.locator('text=Streak Days')).toBeVisible();
    await expect(page.locator('text=Favorite Categories')).toBeVisible();
  });

  test('should display user metrics with proper values', async ({ page }) => {
    // Check that metrics display numeric values
    const pollsCreated = page.locator('[data-testid="polls-created-metric"] .text-3xl');
    const activePolls = page.locator('[data-testid="active-polls-metric"] .text-3xl');
    const votesCast = page.locator('[data-testid="votes-cast-metric"] .text-3xl');
    const trustScore = page.locator('[data-testid="trust-score-metric"] .text-3xl');
    
    await expect(pollsCreated).toBeVisible();
    await expect(activePolls).toBeVisible();
    await expect(votesCast).toBeVisible();
    await expect(trustScore).toBeVisible();
    
    // Values should be numeric
    const pollsCreatedText = await pollsCreated.textContent();
    const activePollsText = await activePolls.textContent();
    const votesCastText = await votesCast.textContent();
    const trustScoreText = await trustScore.textContent();
    
    expect(Number(pollsCreatedText)).not.toBeNaN();
    expect(Number(activePollsText)).not.toBeNaN();
    expect(Number(votesCastText)).not.toBeNaN();
    expect(Number(trustScoreText)).not.toBeNaN();
  });

  test('should show refresh functionality', async ({ page }) => {
    // Check for refresh button
    const refreshButton = page.locator('button:has([data-testid="refresh-button"])');
    await expect(refreshButton).toBeVisible();
    
    // Check for last updated timestamp
    await expect(page.locator('text=Last updated:')).toBeVisible();
  });

  test('should handle loading state', async ({ page }) => {
    // Navigate to dashboard and check loading state
    await page.goto('/dashboard');
    
    // Should show loading spinner initially
    const loadingSpinner = page.locator('.animate-spin');
    await expect(loadingSpinner).toBeVisible();
    
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="enhanced-dashboard"]')).toBeVisible();
  });

  test('should display achievements with progress', async ({ page }) => {
    // Navigate to insights view
    await page.click('text=My Insights');
    await page.waitForLoadState('networkidle');
    
    // Check for achievements section
    await expect(page.locator('text=Achievements')).toBeVisible();
    
    // Check for achievement items
    const achievements = page.locator('[data-testid="achievement-item"]');
    const achievementCount = await achievements.count();
    expect(achievementCount).toBeGreaterThan(0);
  });

  test('should display favorite categories', async ({ page }) => {
    // Navigate to engagement view
    await page.click('text=My Engagement');
    await page.waitForLoadState('networkidle');
    
    // Check for favorite categories section
    await expect(page.locator('text=Favorite Categories')).toBeVisible();
    
    // Check for category tags
    const categoryTags = page.locator('.bg-blue-100.text-blue-800');
    const tagCount = await categoryTags.count();
    expect(tagCount).toBeGreaterThan(0);
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check that dashboard is still functional
    await expect(page.locator('[data-testid="enhanced-dashboard"]')).toBeVisible();
    
    // Check that metrics are still visible
    await expect(page.locator('[data-testid="polls-created-metric"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-polls-metric"]')).toBeVisible();
    
    // Check that navigation tabs are still accessible
    await expect(page.locator('text=My Activity')).toBeVisible();
    await expect(page.locator('text=My Trends')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API error
    await page.route('/api/dashboard/data', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Should show error state
    await expect(page.locator('text=Error Loading Dashboard')).toBeVisible();
    await expect(page.locator('text=Try Again')).toBeVisible();
  });
});
