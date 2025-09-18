/**
 * Vote Finalization E2E Tests
 * 
 * End-to-end tests for vote finalization and poll results
 * 
 * Created: January 17, 2025
 * Updated: January 17, 2025
 */

import { test, expect } from '@playwright/test';

test.describe('Vote Finalization', () => {
  test('should finalize poll and show results', async ({ page }) => {
    // Create a poll with short duration for testing
    await page.goto('/polls/create');
    
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 2 * 60 * 1000); // 2 minutes from now
    
    await page.fill('[data-testid="poll-title"]', 'Short Duration Poll');
    await page.selectOption('[data-testid="voting-method"]', 'single');
    await page.fill('[data-testid="option-1"]', 'Option A');
    await page.fill('[data-testid="option-2"]', 'Option B');
    await page.fill('[data-testid="start-time"]', startTime.toISOString().slice(0, 16));
    await page.fill('[data-testid="end-date"]', endTime.toISOString().slice(0, 10));
    await page.fill('[data-testid="end-time"]', endTime.toISOString().slice(11, 16));
    
    await page.click('[data-testid="create-poll-button"]');
    await expect(page.locator('[data-testid="poll-created-success"]')).toBeVisible();
    
    const pollId = await page.textContent('[data-testid="poll-id"]') || '';
    
    // Navigate to the poll and vote
    await page.goto(`/polls/${pollId}`);
    await page.waitForSelector('[data-testid="poll-details"]');
    
    // Submit a vote
    await page.click('[data-testid="start-voting-button"]');
    await page.waitForSelector('[data-testid="voting-form"]');
    await page.click('[data-testid="option-1-radio"]');
    await page.click('[data-testid="submit-vote-button"]');
    await page.waitForSelector('[data-testid="vote-confirmation"]');
    
    // Wait for poll to end (2 minutes)
    await page.waitForTimeout(2.5 * 60 * 1000); // 2.5 minutes to be safe
    
    // Refresh the page to trigger finalization
    await page.reload();
    await page.waitForSelector('[data-testid="poll-details"]');
    
    // Should show finalized results - This tests our vote finalization Supabase fix
    await expect(page.locator('[data-testid="finalized-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="vote-count"]')).toBeVisible();
    await expect(page.locator('[data-testid="finalization-timestamp"]')).toBeVisible();
    
    // Should show poll is closed
    await expect(page.locator('[data-testid="poll-closed"]')).toBeVisible();
    await expect(page.locator('[data-testid="voting-disabled"]')).toBeVisible();
  });

  test('should handle post-close voting when enabled', async ({ page }) => {
    // Create a poll with post-close voting enabled
    await page.goto('/polls/create');
    
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 2 * 60 * 1000); // 2 minutes from now
    
    await page.fill('[data-testid="poll-title"]', 'Post-Close Poll');
    await page.selectOption('[data-testid="voting-method"]', 'single');
    await page.fill('[data-testid="option-1"]', 'Option A');
    await page.fill('[data-testid="option-2"]', 'Option B');
    await page.fill('[data-testid="start-time"]', startTime.toISOString().slice(0, 16));
    await page.fill('[data-testid="end-date"]', endTime.toISOString().slice(0, 10));
    await page.fill('[data-testid="end-time"]', endTime.toISOString().slice(11, 16));
    await page.check('[data-testid="allow-post-close"]');
    
    await page.click('[data-testid="create-poll-button"]');
    await expect(page.locator('[data-testid="poll-created-success"]')).toBeVisible();
    
    const pollId = await page.textContent('[data-testid="poll-id"]') || '';
    
    // Navigate to the poll and vote
    await page.goto(`/polls/${pollId}`);
    await page.waitForSelector('[data-testid="poll-details"]');
    
    // Submit a vote
    await page.click('[data-testid="start-voting-button"]');
    await page.waitForSelector('[data-testid="voting-form"]');
    await page.click('[data-testid="option-1-radio"]');
    await page.click('[data-testid="submit-vote-button"]');
    await page.waitForSelector('[data-testid="vote-confirmation"]');
    
    // Wait for poll to end
    await page.waitForTimeout(2.5 * 60 * 1000);
    
    // Refresh the page
    await page.reload();
    await page.waitForSelector('[data-testid="poll-details"]');
    
    // Should show post-close voting is available
    await expect(page.locator('[data-testid="post-close-voting"]')).toBeVisible();
    await expect(page.locator('[data-testid="post-close-banner"]')).toBeVisible();
    
    // Should still allow voting
    await page.click('[data-testid="start-voting-button"]');
    await page.waitForSelector('[data-testid="voting-form"]');
    
    await page.click('[data-testid="option-2-radio"]');
    await page.click('[data-testid="submit-vote-button"]');
    
    await expect(page.locator('[data-testid="vote-confirmation"]')).toBeVisible();
  });

  test('should create poll snapshot with checksum', async ({ page }) => {
    // Create a poll
    await page.goto('/polls/create');
    
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 2 * 60 * 1000);
    
    await page.fill('[data-testid="poll-title"]', 'Snapshot Test Poll');
    await page.selectOption('[data-testid="voting-method"]', 'single');
    await page.fill('[data-testid="option-1"]', 'Option A');
    await page.fill('[data-testid="option-2"]', 'Option B');
    await page.fill('[data-testid="start-time"]', startTime.toISOString().slice(0, 16));
    await page.fill('[data-testid="end-date"]', endTime.toISOString().slice(0, 10));
    await page.fill('[data-testid="end-time"]', endTime.toISOString().slice(11, 16));
    
    await page.click('[data-testid="create-poll-button"]');
    await expect(page.locator('[data-testid="poll-created-success"]')).toBeVisible();
    
    const pollId = await page.textContent('[data-testid="poll-id"]') || '';
    
    // Navigate to the poll and vote
    await page.goto(`/polls/${pollId}`);
    await page.waitForSelector('[data-testid="poll-details"]');
    
    // Submit multiple votes
    await page.click('[data-testid="start-voting-button"]');
    await page.waitForSelector('[data-testid="voting-form"]');
    await page.click('[data-testid="option-1-radio"]');
    await page.click('[data-testid="submit-vote-button"]');
    await page.waitForSelector('[data-testid="vote-confirmation"]');
    
    // Wait for poll to end
    await page.waitForTimeout(2.5 * 60 * 1000);
    
    // Refresh the page
    await page.reload();
    await page.waitForSelector('[data-testid="poll-details"]');
    
    // Should show snapshot information
    await expect(page.locator('[data-testid="snapshot-id"]')).toBeVisible();
    await expect(page.locator('[data-testid="checksum"]')).toBeVisible();
    await expect(page.locator('[data-testid="merkle-root"]')).toBeVisible();
    
    // Should show audit information
    await expect(page.locator('[data-testid="audit-trail"]')).toBeVisible();
    await expect(page.locator('[data-testid="ballot-count"]')).toBeVisible();
  });

  test('should handle finalization errors gracefully', async ({ page }) => {
    // Create a poll
    await page.goto('/polls/create');
    
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 2 * 60 * 1000);
    
    await page.fill('[data-testid="poll-title"]', 'Error Test Poll');
    await page.selectOption('[data-testid="voting-method"]', 'single');
    await page.fill('[data-testid="option-1"]', 'Option A');
    await page.fill('[data-testid="option-2"]', 'Option B');
    await page.fill('[data-testid="start-time"]', startTime.toISOString().slice(0, 16));
    await page.fill('[data-testid="end-date"]', endTime.toISOString().slice(0, 10));
    await page.fill('[data-testid="end-time"]', endTime.toISOString().slice(11, 16));
    
    await page.click('[data-testid="create-poll-button"]');
    await expect(page.locator('[data-testid="poll-created-success"]')).toBeVisible();
    
    const pollId = await page.textContent('[data-testid="poll-id"]') || '';
    
    // Mock finalization error
    await page.route('**/api/polls/*/finalize', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Finalization failed' })
      });
    });
    
    // Wait for poll to end
    await page.waitForTimeout(2.5 * 60 * 1000);
    
    // Navigate to the poll
    await page.goto(`/polls/${pollId}`);
    await page.waitForSelector('[data-testid="poll-details"]');
    
    // Should show finalization error
    await expect(page.locator('[data-testid="finalization-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="finalization-error"]')).toContainText('Failed to finalize poll');
  });

  test('should display real-time results updates', async ({ page }) => {
    // Create a poll
    await page.goto('/polls/create');
    
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 5 * 60 * 1000); // 5 minutes from now
    
    await page.fill('[data-testid="poll-title"]', 'Real-time Poll');
    await page.selectOption('[data-testid="voting-method"]', 'single');
    await page.fill('[data-testid="option-1"]', 'Option A');
    await page.fill('[data-testid="option-2"]', 'Option B');
    await page.fill('[data-testid="start-time"]', startTime.toISOString().slice(0, 16));
    await page.fill('[data-testid="end-date"]', endTime.toISOString().slice(0, 10));
    await page.fill('[data-testid="end-time"]', endTime.toISOString().slice(11, 16));
    
    await page.click('[data-testid="create-poll-button"]');
    await expect(page.locator('[data-testid="poll-created-success"]')).toBeVisible();
    
    const pollId = await page.textContent('[data-testid="poll-id"]') || '';
    
    // Navigate to the poll
    await page.goto(`/polls/${pollId}`);
    await page.waitForSelector('[data-testid="poll-details"]');
    
    // Submit a vote
    await page.click('[data-testid="start-voting-button"]');
    await page.waitForSelector('[data-testid="voting-form"]');
    await page.click('[data-testid="option-1-radio"]');
    await page.click('[data-testid="submit-vote-button"]');
    await page.waitForSelector('[data-testid="vote-confirmation"]');
    
    // View results
    await page.click('[data-testid="view-results-button"]');
    
    // Should show real-time results
    await expect(page.locator('[data-testid="results-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-votes"]')).toContainText('1');
    await expect(page.locator('[data-testid="option-1-votes"]')).toContainText('1');
    await expect(page.locator('[data-testid="option-2-votes"]')).toContainText('0');
    
    // Should show live indicator
    await expect(page.locator('[data-testid="live-indicator"]')).toBeVisible();
  });

  test('should handle poll closure notifications', async ({ page }) => {
    // Create a poll
    await page.goto('/polls/create');
    
    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + 2 * 60 * 1000);
    
    await page.fill('[data-testid="poll-title"]', 'Notification Test Poll');
    await page.selectOption('[data-testid="voting-method"]', 'single');
    await page.fill('[data-testid="option-1"]', 'Option A');
    await page.fill('[data-testid="option-2"]', 'Option B');
    await page.fill('[data-testid="start-time"]', startTime.toISOString().slice(0, 16));
    await page.fill('[data-testid="end-date"]', endTime.toISOString().slice(0, 10));
    await page.fill('[data-testid="end-time"]', endTime.toISOString().slice(11, 16));
    
    await page.click('[data-testid="create-poll-button"]');
    await expect(page.locator('[data-testid="poll-created-success"]')).toBeVisible();
    
    const pollId = await page.textContent('[data-testid="poll-id"]') || '';
    
    // Navigate to the poll
    await page.goto(`/polls/${pollId}`);
    await page.waitForSelector('[data-testid="poll-details"]');
    
    // Wait for poll to end
    await page.waitForTimeout(2.5 * 60 * 1000);
    
    // Should show poll closure notification
    await expect(page.locator('[data-testid="poll-closed-notification"]')).toBeVisible();
    await expect(page.locator('[data-testid="poll-closed-notification"]')).toContainText('Poll has ended');
    
    // Should show final results
    await expect(page.locator('[data-testid="final-results"]')).toBeVisible();
  });
});
