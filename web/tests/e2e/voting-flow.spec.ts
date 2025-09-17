/**
 * Voting Flow E2E Tests
 * 
 * End-to-end tests for the complete voting flow
 * 
 * Created: September 15, 2025
 * Updated: September 15, 2025
 */

import { test, expect } from '@playwright/test';

test.describe('Voting Flow', () => {
  let pollId: string;

  test.beforeAll(async ({ page }) => {
    // Create a test poll for voting
    await page.goto('/polls/create');
    
    await page.fill('[data-testid="poll-title"]', 'E2E Test Poll');
    await page.fill('[data-testid="poll-description"]', 'A poll for E2E testing');
    await page.selectOption('[data-testid="voting-method"]', 'single');
    await page.fill('[data-testid="option-1"]', 'Option A');
    await page.fill('[data-testid="option-2"]', 'Option B');
    await page.fill('[data-testid="option-3"]', 'Option C');
    await page.fill('[data-testid="start-time"]', '2025-01-01T00:00');
    await page.fill('[data-testid="end-time"]', '2025-12-31T23:59');
    
    await page.click('[data-testid="create-poll-button"]');
    await page.waitForSelector('[data-testid="poll-created-success"]');
    
    // Get the poll ID
    pollId = await page.textContent('[data-testid="poll-id"]') || '';
  });

  test('should complete single choice voting flow', async ({ page }) => {
    // Navigate to the poll
    await page.goto(`/polls/${pollId}`);
    
    // Wait for poll to load
    await page.waitForSelector('[data-testid="poll-details"]');
    
    // Verify poll information
    await expect(page.locator('[data-testid="poll-title"]')).toContainText('E2E Test Poll');
    await expect(page.locator('[data-testid="voting-method"]')).toContainText('Single Choice');
    
    // Start voting
    await page.click('[data-testid="start-voting-button"]');
    
    // Wait for voting form
    await page.waitForSelector('[data-testid="voting-form"]');
    
    // Select an option
    await page.click('[data-testid="option-1-radio"]');
    
    // Submit vote
    await page.click('[data-testid="submit-vote-button"]');
    
    // Verify vote confirmation
    await expect(page.locator('[data-testid="vote-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="vote-receipt"]')).toBeVisible();
    
    // Verify vote was recorded
    await expect(page.locator('[data-testid="vote-recorded"]')).toBeVisible();
  });

  test('should complete approval voting flow', async ({ page }) => {
    // Create an approval voting poll
    await page.goto('/polls/create');
    
    await page.fill('[data-testid="poll-title"]', 'E2E Approval Poll');
    await page.selectOption('[data-testid="voting-method"]', 'approval');
    await page.fill('[data-testid="option-1"]', 'Project A');
    await page.fill('[data-testid="option-2"]', 'Project B');
    await page.fill('[data-testid="option-3"]', 'Project C');
    await page.fill('[data-testid="start-time"]', '2025-01-01T00:00');
    await page.fill('[data-testid="end-time"]', '2025-12-31T23:59');
    
    await page.click('[data-testid="create-poll-button"]');
    await page.waitForSelector('[data-testid="poll-created-success"]');
    
    const approvalPollId = await page.textContent('[data-testid="poll-id"]') || '';
    
    // Navigate to the approval poll
    await page.goto(`/polls/${approvalPollId}`);
    await page.waitForSelector('[data-testid="poll-details"]');
    
    // Start voting
    await page.click('[data-testid="start-voting-button"]');
    await page.waitForSelector('[data-testid="voting-form"]');
    
    // Select multiple options
    await page.check('[data-testid="option-1-checkbox"]');
    await page.check('[data-testid="option-3-checkbox"]');
    
    // Submit vote
    await page.click('[data-testid="submit-vote-button"]');
    
    // Verify vote confirmation
    await expect(page.locator('[data-testid="vote-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="selected-options"]')).toContainText('Project A, Project C');
  });

  test('should complete ranked choice voting flow', async ({ page }) => {
    // Create a ranked choice poll
    await page.goto('/polls/create');
    
    await page.fill('[data-testid="poll-title"]', 'E2E Ranked Poll');
    await page.selectOption('[data-testid="voting-method"]', 'ranked');
    await page.fill('[data-testid="option-1"]', 'Candidate A');
    await page.fill('[data-testid="option-2"]', 'Candidate B');
    await page.fill('[data-testid="option-3"]', 'Candidate C');
    await page.fill('[data-testid="start-time"]', '2025-01-01T00:00');
    await page.fill('[data-testid="end-time"]', '2025-12-31T23:59');
    
    await page.click('[data-testid="create-poll-button"]');
    await page.waitForSelector('[data-testid="poll-created-success"]');
    
    const rankedPollId = await page.textContent('[data-testid="poll-id"]') || '';
    
    // Navigate to the ranked poll
    await page.goto(`/polls/${rankedPollId}`);
    await page.waitForSelector('[data-testid="poll-details"]');
    
    // Start voting
    await page.click('[data-testid="start-voting-button"]');
    await page.waitForSelector('[data-testid="voting-form"]');
    
    // Rank the options
    await page.selectOption('[data-testid="option-1-rank"]', '1');
    await page.selectOption('[data-testid="option-2-rank"]', '2');
    await page.selectOption('[data-testid="option-3-rank"]', '3');
    
    // Submit vote
    await page.click('[data-testid="submit-vote-button"]');
    
    // Verify vote confirmation
    await expect(page.locator('[data-testid="vote-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="ranking-display"]')).toContainText('1. Candidate A');
  });

  test('should complete quadratic voting flow', async ({ page }) => {
    // Create a quadratic poll
    await page.goto('/polls/create');
    
    await page.fill('[data-testid="poll-title"]', 'E2E Quadratic Poll');
    await page.selectOption('[data-testid="voting-method"]', 'quadratic');
    await page.fill('[data-testid="option-1"]', 'Initiative A');
    await page.fill('[data-testid="option-2"]', 'Initiative B');
    await page.fill('[data-testid="option-3"]', 'Initiative C');
    await page.fill('[data-testid="start-time"]', '2025-01-01T00:00');
    await page.fill('[data-testid="end-time"]', '2025-12-31T23:59');
    
    await page.click('[data-testid="create-poll-button"]');
    await page.waitForSelector('[data-testid="poll-created-success"]');
    
    const quadraticPollId = await page.textContent('[data-testid="poll-id"]') || '';
    
    // Navigate to the quadratic poll
    await page.goto(`/polls/${quadraticPollId}`);
    await page.waitForSelector('[data-testid="poll-details"]');
    
    // Start voting
    await page.click('[data-testid="start-voting-button"]');
    await page.waitForSelector('[data-testid="voting-form"]');
    
    // Allocate credits
    await page.fill('[data-testid="option-1-credits"]', '5');
    await page.fill('[data-testid="option-2-credits"]', '3');
    await page.fill('[data-testid="option-3-credits"]', '2');
    
    // Verify total cost
    await expect(page.locator('[data-testid="total-cost"]')).toContainText('38'); // 5² + 3² + 2² = 25 + 9 + 4 = 38
    
    // Submit vote
    await page.click('[data-testid="submit-vote-button"]');
    
    // Verify vote confirmation
    await expect(page.locator('[data-testid="vote-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="credits-allocation"]')).toContainText('5 credits to Initiative A');
  });

  test('should complete range voting flow', async ({ page }) => {
    // Create a range poll
    await page.goto('/polls/create');
    
    await page.fill('[data-testid="poll-title"]', 'E2E Range Poll');
    await page.selectOption('[data-testid="voting-method"]', 'range');
    await page.fill('[data-testid="option-1"]', 'Movie A');
    await page.fill('[data-testid="option-2"]', 'Movie B');
    await page.fill('[data-testid="option-3"]', 'Movie C');
    await page.fill('[data-testid="start-time"]', '2025-01-01T00:00');
    await page.fill('[data-testid="end-time"]', '2025-12-31T23:59');
    
    await page.click('[data-testid="create-poll-button"]');
    await page.waitForSelector('[data-testid="poll-created-success"]');
    
    const rangePollId = await page.textContent('[data-testid="poll-id"]') || '';
    
    // Navigate to the range poll
    await page.goto(`/polls/${rangePollId}`);
    await page.waitForSelector('[data-testid="poll-details"]');
    
    // Start voting
    await page.click('[data-testid="start-voting-button"]');
    await page.waitForSelector('[data-testid="voting-form"]');
    
    // Rate the options
    await page.fill('[data-testid="option-1-rating"]', '8');
    await page.fill('[data-testid="option-2-rating"]', '6');
    await page.fill('[data-testid="option-3-rating"]', '4');
    
    // Submit vote
    await page.click('[data-testid="submit-vote-button"]');
    
    // Verify vote confirmation
    await expect(page.locator('[data-testid="vote-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="ratings-display"]')).toContainText('Movie A: 8/10');
  });

  test('should handle vote validation errors', async ({ page }) => {
    // Navigate to the poll
    await page.goto(`/polls/${pollId}`);
    await page.waitForSelector('[data-testid="poll-details"]');
    
    // Start voting
    await page.click('[data-testid="start-voting-button"]');
    await page.waitForSelector('[data-testid="voting-form"]');
    
    // Try to submit without selecting an option
    await page.click('[data-testid="submit-vote-button"]');
    
    // Verify validation error
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('Please select an option');
  });

  test('should handle duplicate voting prevention', async ({ page }) => {
    // Navigate to the poll
    await page.goto(`/polls/${pollId}`);
    await page.waitForSelector('[data-testid="poll-details"]');
    
    // Start voting
    await page.click('[data-testid="start-voting-button"]');
    await page.waitForSelector('[data-testid="voting-form"]');
    
    // Submit first vote
    await page.click('[data-testid="option-1-radio"]');
    await page.click('[data-testid="submit-vote-button"]');
    await page.waitForSelector('[data-testid="vote-confirmation"]');
    
    // Try to vote again
    await page.goto(`/polls/${pollId}`);
    await page.waitForSelector('[data-testid="poll-details"]');
    
    // Should show already voted message
    await expect(page.locator('[data-testid="already-voted"]')).toBeVisible();
    await expect(page.locator('[data-testid="vote-receipt"]')).toBeVisible();
  });

  test('should display results after voting', async ({ page }) => {
    // Navigate to the poll
    await page.goto(`/polls/${pollId}`);
    await page.waitForSelector('[data-testid="poll-details"]');
    
    // View results
    await page.click('[data-testid="view-results-button"]');
    
    // Verify results are displayed
    await expect(page.locator('[data-testid="results-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-votes"]')).toBeVisible();
    await expect(page.locator('[data-testid="option-results"]')).toBeVisible();
  });

  test('should handle poll closure', async ({ page }) => {
    // Create a poll with short duration
    await page.goto('/polls/create');
    
    const now = new Date();
    const startTime = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
    const endTime = new Date(now.getTime() + 60 * 1000); // 1 minute from now
    
    await page.fill('[data-testid="poll-title"]', 'Short Duration Poll');
    await page.selectOption('[data-testid="voting-method"]', 'single');
    await page.fill('[data-testid="option-1"]', 'Option A');
    await page.fill('[data-testid="option-2"]', 'Option B');
    await page.fill('[data-testid="start-time"]', startTime.toISOString().slice(0, 16));
    await page.fill('[data-testid="end-time"]', endTime.toISOString().slice(0, 16));
    
    await page.click('[data-testid="create-poll-button"]');
    await page.waitForSelector('[data-testid="poll-created-success"]');
    
    const shortPollId = await page.textContent('[data-testid="poll-id"]') || '';
    
    // Wait for poll to end
    await page.waitForTimeout(70 * 1000); // Wait 70 seconds
    
    // Navigate to the poll
    await page.goto(`/polls/${shortPollId}`);
    await page.waitForSelector('[data-testid="poll-details"]');
    
    // Should show poll is closed
    await expect(page.locator('[data-testid="poll-closed"]')).toBeVisible();
    await expect(page.locator('[data-testid="voting-disabled"]')).toBeVisible();
  });

  test('should handle post-close voting when enabled', async ({ page }) => {
    // Create a poll with post-close voting enabled
    await page.goto('/polls/create');
    
    const now = new Date();
    const startTime = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
    const endTime = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago
    
    await page.fill('[data-testid="poll-title"]', 'Post-Close Poll');
    await page.selectOption('[data-testid="voting-method"]', 'single');
    await page.fill('[data-testid="option-1"]', 'Option A');
    await page.fill('[data-testid="option-2"]', 'Option B');
    await page.fill('[data-testid="start-time"]', startTime.toISOString().slice(0, 16));
    await page.fill('[data-testid="end-time"]', endTime.toISOString().slice(0, 16));
    await page.check('[data-testid="allow-post-close"]');
    
    await page.click('[data-testid="create-poll-button"]');
    await page.waitForSelector('[data-testid="poll-created-success"]');
    
    const postClosePollId = await page.textContent('[data-testid="poll-id"]') || '';
    
    // Navigate to the poll
    await page.goto(`/polls/${postClosePollId}`);
    await page.waitForSelector('[data-testid="poll-details"]');
    
    // Should show post-close voting is available
    await expect(page.locator('[data-testid="post-close-voting"]')).toBeVisible();
    await expect(page.locator('[data-testid="post-close-banner"]')).toBeVisible();
    
    // Should still allow voting
    await page.click('[data-testid="start-voting-button"]');
    await page.waitForSelector('[data-testid="voting-form"]');
    
    await page.click('[data-testid="option-1-radio"]');
    await page.click('[data-testid="submit-vote-button"]');
    
    await expect(page.locator('[data-testid="vote-confirmation"]')).toBeVisible();
  });

  test('should handle network errors during voting', async ({ page }) => {
    // Navigate to the poll
    await page.goto(`/polls/${pollId}`);
    await page.waitForSelector('[data-testid="poll-details"]');
    
    // Mock network error
    await page.route('**/api/polls/*/vote', route => {
      route.abort('failed');
    });
    
    // Start voting
    await page.click('[data-testid="start-voting-button"]');
    await page.waitForSelector('[data-testid="voting-form"]');
    
    // Submit vote
    await page.click('[data-testid="option-1-radio"]');
    await page.click('[data-testid="submit-vote-button"]');
    
    // Verify error handling
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="network-error"]')).toContainText('Network error');
  });

  test('should handle server errors during voting', async ({ page }) => {
    // Navigate to the poll
    await page.goto(`/polls/${pollId}`);
    await page.waitForSelector('[data-testid="poll-details"]');
    
    // Mock server error
    await page.route('**/api/polls/*/vote', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    // Start voting
    await page.click('[data-testid="start-voting-button"]');
    await page.waitForSelector('[data-testid="voting-form"]');
    
    // Submit vote
    await page.click('[data-testid="option-1-radio"]');
    await page.click('[data-testid="submit-vote-button"]');
    
    // Verify error handling
    await expect(page.locator('[data-testid="server-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="server-error"]')).toContainText('Server error');
  });
});
