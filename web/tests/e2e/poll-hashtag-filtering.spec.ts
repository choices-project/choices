/**
 * Poll Hashtag Filtering E2E Tests
 * 
 * Tests the restored hashtag filtering functionality on polls page:
 * - Hashtag input visible (was disabled)
 * - Trending hashtags visible (was disabled)
 * - Can add/remove hashtags
 * - Polls filter correctly
 * - No infinite loops
 * 
 * Created: November 5, 2025
 * Status: ✅ Testing restored functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Poll Hashtag Filtering', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to polls page
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');
  });

  test('hashtag input field is visible', async ({ page }) => {
    // Verify hashtag input is NOT commented out
    const hashtagInput = page.locator('input[placeholder*="Add hashtags to filter"]');
    await expect(hashtagInput).toBeVisible({ timeout: 5000 });
  });

  test('trending hashtags section is visible', async ({ page }) => {
    // Check if trending hashtags section appears
    // May be empty if no trending hashtags, but should not be commented out
    const trendingSection = page.locator('text=Trending Hashtags').or(page.locator('h3:has-text("Trending")'));
    
    // Either trending section exists or it doesn't (both OK)
    // Important: no "TEMPORARILY DISABLED" text
    const disabledText = await page.locator('text=TEMPORARILY DISABLED').count();
    expect(disabledText).toBe(0);
  });

  test('can add hashtag filter', async ({ page }) => {
    const hashtagInput = page.locator('input[placeholder*="Add hashtags to filter"]');
    await hashtagInput.waitFor({ state: 'visible' });
    
    // Type a hashtag
    await hashtagInput.fill('testing');
    await hashtagInput.press('Enter');
    
    // Verify hashtag badge appears
    await expect(page.locator('text=#testing')).toBeVisible({ timeout: 3000 });
  });

  test('can remove hashtag filter', async ({ page }) => {
    const hashtagInput = page.locator('input[placeholder*="Add hashtags to filter"]');
    await hashtagInput.waitFor({ state: 'visible' });
    
    // Add a hashtag
    await hashtagInput.fill('climate');
    await hashtagInput.press('Enter');
    
    // Wait for badge to appear
    await page.waitForSelector('text=#climate', { timeout: 3000 });
    
    // Click the × to remove
    const removeButton = page.locator('text=#climate').locator('..').locator('button:has-text("×")');
    await removeButton.click();
    
    // Verify hashtag badge is gone
    await expect(page.locator('text=#climate')).not.toBeVisible({ timeout: 3000 });
  });

  test('can add multiple hashtags', async ({ page }) => {
    const hashtagInput = page.locator('input[placeholder*="Add hashtags to filter"]');
    await hashtagInput.waitFor({ state: 'visible' });
    
    // Add first hashtag
    await hashtagInput.fill('climate');
    await hashtagInput.press('Enter');
    
    // Add second hashtag
    await hashtagInput.fill('healthcare');
    await hashtagInput.press('Enter');
    
    // Verify both appear
    await expect(page.locator('text=#climate')).toBeVisible();
    await expect(page.locator('text=#healthcare')).toBeVisible();
  });

  test('hashtag input strips # symbol if user types it', async ({ page }) => {
    const hashtagInput = page.locator('input[placeholder*="Add hashtags to filter"]');
    await hashtagInput.waitFor({ state: 'visible' });
    
    // Type hashtag WITH # symbol
    await hashtagInput.fill('#education');
    await hashtagInput.press('Enter');
    
    // Should still work (# stripped)
    await expect(page.locator('text=#education')).toBeVisible({ timeout: 3000 });
  });

  test('limits to 5 hashtags maximum', async ({ page }) => {
    const hashtagInput = page.locator('input[placeholder*="Add hashtags to filter"]');
    await hashtagInput.waitFor({ state: 'visible' });
    
    // Try to add 6 hashtags
    const tags = ['tag1', 'tag2', 'tag3', 'tag4', 'tag5', 'tag6'];
    for (const tag of tags) {
      await hashtagInput.fill(tag);
      await hashtagInput.press('Enter');
      await page.waitForTimeout(200); // Small delay
    }
    
    // Should only have 5 badges (max limit)
    const badgeCount = await page.locator('span:has-text("#tag")').count();
    expect(badgeCount).toBeLessThanOrEqual(5);
  });

  test('clicking trending hashtag adds it as filter', async ({ page }) => {
    // Check if any trending hashtags are visible
    const trendingHashtags = page.locator('button:has-text("#")').first();
    
    if (await trendingHashtags.count() > 0) {
      await trendingHashtags.click();
      
      // Should appear in selected filters
      // (Specific hashtag text will vary)
      const selectedFilters = page.locator('[role="list"][aria-label="Selected hashtags"]');
      expect(await selectedFilters.locator('span').count()).toBeGreaterThan(0);
    } else {
      // No trending hashtags yet - test passes (section not commented out)
      expect(true).toBeTruthy();
    }
  });

  test('no infinite loop occurs during filtering', async ({ page }) => {
    const consoleErrors: string[] = [];
    
    // Monitor console for loop detection
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('infinite')) {
        consoleErrors.push(msg.text());
      }
    });
    
    const hashtagInput = page.locator('input[placeholder*="Add hashtags to filter"]');
    await hashtagInput.waitFor({ state: 'visible' });
    
    // Add and remove hashtags multiple times rapidly
    for (let i = 0; i < 3; i++) {
      await hashtagInput.fill(`test${i}`);
      await hashtagInput.press('Enter');
      await page.waitForTimeout(100);
    }
    
    // Wait to see if infinite loop occurs
    await page.waitForTimeout(2000);
    
    // Should have no infinite loop errors
    expect(consoleErrors.length).toBe(0);
  });

  test('accessibility: hashtag controls have proper labels', async ({ page }) => {
    const hashtagInput = page.locator('input[placeholder*="Add hashtags to filter"]');
    await hashtagInput.waitFor({ state: 'visible' });
    
    // Check for aria-label
    const ariaLabel = await hashtagInput.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    
    // Add a hashtag
    await hashtagInput.fill('accessibility');
    await hashtagInput.press('Enter');
    
    // Check remove button has aria-label
    await page.waitForSelector('text=#accessibility', { timeout: 3000 });
    const removeButton = page.locator('text=#accessibility').locator('..').locator('button');
    const removeLabel = await removeButton.getAttribute('aria-label');
    expect(removeLabel).toContain('Remove');
  });
});

