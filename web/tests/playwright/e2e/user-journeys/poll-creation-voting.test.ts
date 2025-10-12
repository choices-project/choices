/**
 * Poll Creation and Voting E2E Test
 * 
 * Tests the complete poll creation and voting workflow including:
 * - Poll creation
 * - Poll voting
 * - Results viewing
 * - Poll management
 */

import { test, expect } from '@playwright/test';

test.describe('Poll Creation and Voting Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authenticated user
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 'user-123', email: 'test@example.com' },
          requiresOnboarding: false,
        }),
      });
    });

    // Navigate to dashboard
    await page.goto('/dashboard');
  });

  test('should create a new poll and vote on it', async ({ page }) => {
    // Step 1: Navigate to poll creation
    await page.click('[data-testid="create-poll-btn"]');
    await expect(page).toHaveURL('/polls/create');

    // Step 2: Fill poll creation form
    await page.fill('[data-testid="poll-title-input"]', 'What is your favorite programming language?');
    await page.fill('[data-testid="poll-description-input"]', 'Please select your preferred programming language.');

    // Add poll options
    await page.fill('[data-testid="option-input-0"]', 'JavaScript');
    await page.click('[data-testid="add-option-btn"]');
    await page.fill('[data-testid="option-input-1"]', 'Python');
    await page.click('[data-testid="add-option-btn"]');
    await page.fill('[data-testid="option-input-2"]', 'TypeScript');
    await page.click('[data-testid="add-option-btn"]');
    await page.fill('[data-testid="option-input-3"]', 'Rust');

    // Set poll settings
    await page.selectOption('[data-testid="voting-method-select"]', 'single');
    await page.selectOption('[data-testid="category-select"]', 'technology');
    await page.selectOption('[data-testid="privacy-level-select"]', 'public');

    // Add hashtags
    await page.fill('[data-testid="hashtags-input"]', 'programming, technology, coding');
    await page.fill('[data-testid="primary-hashtag-input"]', 'programming');

    // Step 3: Create the poll
    await page.click('[data-testid="create-poll-btn"]');

    // Should redirect to poll page
    await expect(page).toHaveURL(/\/polls\/[a-zA-Z0-9-]+/);
    await expect(page.locator('[data-testid="poll-page"]')).toBeVisible();

    // Step 4: Verify poll details
    await expect(page.locator('[data-testid="poll-title"]')).toHaveText('What is your favorite programming language?');
    await expect(page.locator('[data-testid="poll-description"]')).toHaveText('Please select your preferred programming language.');
    await expect(page.locator('[data-testid="poll-options"]')).toBeVisible();

    // Step 5: Vote on the poll
    await page.click('[data-testid="vote-option-0"]'); // Vote for JavaScript
    await page.click('[data-testid="submit-vote-btn"]');

    // Should show vote confirmation
    await expect(page.locator('[data-testid="vote-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="vote-success-message"]')).toHaveText('Your vote has been recorded!');

    // Step 6: View poll results
    await page.click('[data-testid="view-results-btn"]');
    await expect(page.locator('[data-testid="poll-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="results-chart"]')).toBeVisible();
  });

  test('should handle poll creation validation', async ({ page }) => {
    // Navigate to poll creation
    await page.goto('/polls/create');

    // Try to create poll without title
    await page.fill('[data-testid="poll-description-input"]', 'Test description');
    await page.fill('[data-testid="option-input-0"]', 'Option 1');
    await page.fill('[data-testid="option-input-1"]', 'Option 2');
    await page.click('[data-testid="create-poll-btn"]');

    // Should show validation error
    await expect(page.locator('[data-testid="title-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="title-error"]')).toHaveText('Title is required');

    // Fill title
    await page.fill('[data-testid="poll-title-input"]', 'Test Poll Title');

    // Try to create poll with only one option
    await page.click('[data-testid="create-poll-btn"]');

    // Should show validation error
    await expect(page.locator('[data-testid="options-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="options-error"]')).toHaveText('At least 2 options are required');

    // Add second option
    await page.fill('[data-testid="option-input-1"]', 'Option 2');

    // Should be able to create poll now
    await page.click('[data-testid="create-poll-btn"]');
    await expect(page).toHaveURL(/\/polls\/[a-zA-Z0-9-]+/);
  });

  test('should handle different voting methods', async ({ page }) => {
    // Create approval voting poll
    await page.goto('/polls/create');
    await page.fill('[data-testid="poll-title-input"]', 'Which features do you want?');
    await page.fill('[data-testid="option-input-0"]', 'Feature A');
    await page.fill('[data-testid="option-input-1"]', 'Feature B');
    await page.fill('[data-testid="option-input-2"]', 'Feature C');
    await page.selectOption('[data-testid="voting-method-select"]', 'approval');
    await page.click('[data-testid="create-poll-btn"]');

    // Vote on approval poll
    await expect(page.locator('[data-testid="poll-page"]')).toBeVisible();
    await page.check('[data-testid="vote-option-0"]'); // Vote for Feature A
    await page.check('[data-testid="vote-option-2"]'); // Vote for Feature C
    await page.click('[data-testid="submit-vote-btn"]');

    // Should show vote confirmation
    await expect(page.locator('[data-testid="vote-confirmation"]')).toBeVisible();
  });

  test('should handle poll voting errors', async ({ page }) => {
    // Create a poll
    await page.goto('/polls/create');
    await page.fill('[data-testid="poll-title-input"]', 'Test Poll');
    await page.fill('[data-testid="option-input-0"]', 'Option 1');
    await page.fill('[data-testid="option-input-1"]', 'Option 2');
    await page.click('[data-testid="create-poll-btn"]');

    // Try to vote without selecting an option
    await page.click('[data-testid="submit-vote-btn"]');

    // Should show validation error
    await expect(page.locator('[data-testid="vote-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="vote-error"]')).toHaveText('Please select an option');

    // Select an option and vote
    await page.click('[data-testid="vote-option-0"]');
    await page.click('[data-testid="submit-vote-btn"]');

    // Should show vote confirmation
    await expect(page.locator('[data-testid="vote-confirmation"]')).toBeVisible();
  });

  test('should handle poll results and analytics', async ({ page }) => {
    // Create a poll
    await page.goto('/polls/create');
    await page.fill('[data-testid="poll-title-input"]', 'Analytics Test Poll');
    await page.fill('[data-testid="option-input-0"]', 'Option A');
    await page.fill('[data-testid="option-input-1"]', 'Option B');
    await page.fill('[data-testid="option-input-2"]', 'Option C');
    await page.click('[data-testid="create-poll-btn"]');

    // Vote on the poll
    await page.click('[data-testid="vote-option-0"]');
    await page.click('[data-testid="submit-vote-btn"]');

    // View results
    await page.click('[data-testid="view-results-btn"]');
    await expect(page.locator('[data-testid="poll-results"]')).toBeVisible();

    // Check analytics
    await expect(page.locator('[data-testid="total-votes"]')).toBeVisible();
    await expect(page.locator('[data-testid="participation-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="results-chart"]')).toBeVisible();

    // Check individual option results
    await expect(page.locator('[data-testid="option-result-0"]')).toBeVisible();
    await expect(page.locator('[data-testid="option-result-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="option-result-2"]')).toBeVisible();
  });

  test('should handle poll management', async ({ page }) => {
    // Create a poll
    await page.goto('/polls/create');
    await page.fill('[data-testid="poll-title-input"]', 'Management Test Poll');
    await page.fill('[data-testid="option-input-0"]', 'Option 1');
    await page.fill('[data-testid="option-input-1"]', 'Option 2');
    await page.click('[data-testid="create-poll-btn"]');

    // Navigate to dashboard
    await page.goto('/dashboard');

    // Check poll in dashboard
    await expect(page.locator('[data-testid="poll-item-0"]')).toBeVisible();
    await expect(page.locator('[data-testid="poll-title"]')).toHaveText('Management Test Poll');

    // Edit poll
    await page.click('[data-testid="edit-poll-btn"]');
    await expect(page).toHaveURL(/\/polls\/[a-zA-Z0-9-]+\/edit/);
    await expect(page.locator('[data-testid="poll-edit-form"]')).toBeVisible();

    // Update poll title
    await page.fill('[data-testid="poll-title-input"]', 'Updated Management Test Poll');
    await page.click('[data-testid="save-poll-btn"]');

    // Should redirect back to poll page
    await expect(page).toHaveURL(/\/polls\/[a-zA-Z0-9-]+/);
    await expect(page.locator('[data-testid="poll-title"]')).toHaveText('Updated Management Test Poll');

    // Delete poll
    await page.goto('/dashboard');
    await page.click('[data-testid="delete-poll-btn"]');
    await page.click('[data-testid="confirm-delete-btn"]');

    // Should show deletion confirmation
    await expect(page.locator('[data-testid="delete-confirmation"]')).toBeVisible();
  });

  test('should handle poll sharing and social features', async ({ page }) => {
    // Create a poll
    await page.goto('/polls/create');
    await page.fill('[data-testid="poll-title-input"]', 'Shareable Test Poll');
    await page.fill('[data-testid="option-input-0"]', 'Option 1');
    await page.fill('[data-testid="option-input-1"]', 'Option 2');
    await page.click('[data-testid="create-poll-btn"]');

    // Share poll
    await page.click('[data-testid="share-poll-btn"]');
    await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();

    // Copy poll link
    await page.click('[data-testid="copy-link-btn"]');
    await expect(page.locator('[data-testid="link-copied-message"]')).toBeVisible();

    // Share on social media
    await page.click('[data-testid="share-twitter-btn"]');
    await expect(page).toHaveURL(/twitter\.com\/intent\/tweet/);

    // Go back to poll
    await page.goBack();
    await expect(page.locator('[data-testid="poll-page"]')).toBeVisible();
  });

  test('should handle poll comments and discussions', async ({ page }) => {
    // Create a poll
    await page.goto('/polls/create');
    await page.fill('[data-testid="poll-title-input"]', 'Discussion Test Poll');
    await page.fill('[data-testid="option-input-0"]', 'Option 1');
    await page.fill('[data-testid="option-input-1"]', 'Option 2');
    await page.click('[data-testid="create-poll-btn"]');

    // Add a comment
    await page.fill('[data-testid="comment-input"]', 'This is a test comment');
    await page.click('[data-testid="submit-comment-btn"]');

    // Should show comment
    await expect(page.locator('[data-testid="comment-0"]')).toBeVisible();
    await expect(page.locator('[data-testid="comment-text"]')).toHaveText('This is a test comment');

    // Reply to comment
    await page.click('[data-testid="reply-comment-btn"]');
    await page.fill('[data-testid="reply-input"]', 'This is a reply');
    await page.click('[data-testid="submit-reply-btn"]');

    // Should show reply
    await expect(page.locator('[data-testid="reply-0"]')).toBeVisible();
    await expect(page.locator('[data-testid="reply-text"]')).toHaveText('This is a reply');
  });

  test('should handle poll expiration and closure', async ({ page }) => {
    // Create a poll with expiration
    await page.goto('/polls/create');
    await page.fill('[data-testid="poll-title-input"]', 'Expiring Test Poll');
    await page.fill('[data-testid="option-input-0"]', 'Option 1');
    await page.fill('[data-testid="option-input-1"]', 'Option 2');
    
    // Set expiration date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    await page.fill('[data-testid="end-date-input"]', tomorrow.toISOString().split('T')[0]);
    
    await page.click('[data-testid="create-poll-btn"]');

    // Should show expiration info
    await expect(page.locator('[data-testid="poll-expiration"]')).toBeVisible();
    await expect(page.locator('[data-testid="time-remaining"]')).toBeVisible();

    // Vote on the poll
    await page.click('[data-testid="vote-option-0"]');
    await page.click('[data-testid="submit-vote-btn"]');

    // Should show vote confirmation
    await expect(page.locator('[data-testid="vote-confirmation"]')).toBeVisible();
  });

  test('should handle mobile poll creation and voting', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Create a poll
    await page.goto('/polls/create');
    await page.fill('[data-testid="poll-title-input"]', 'Mobile Test Poll');
    await page.fill('[data-testid="option-input-0"]', 'Option 1');
    await page.fill('[data-testid="option-input-1"]', 'Option 2');
    await page.click('[data-testid="create-poll-btn"]');

    // Vote on the poll
    await page.click('[data-testid="vote-option-0"]');
    await page.click('[data-testid="submit-vote-btn"]');

    // Should show vote confirmation
    await expect(page.locator('[data-testid="vote-confirmation"]')).toBeVisible();

    // View results
    await page.click('[data-testid="view-results-btn"]');
    await expect(page.locator('[data-testid="poll-results"]')).toBeVisible();
  });

  test('should handle poll voting with different user types', async ({ page }) => {
    // Create a poll
    await page.goto('/polls/create');
    await page.fill('[data-testid="poll-title-input"]', 'User Type Test Poll');
    await page.fill('[data-testid="option-input-0"]', 'Option 1');
    await page.fill('[data-testid="option-input-1"]', 'Option 2');
    await page.click('[data-testid="create-poll-btn"]');

    // Vote as authenticated user
    await page.click('[data-testid="vote-option-0"]');
    await page.click('[data-testid="submit-vote-btn"]');

    // Should show vote confirmation
    await expect(page.locator('[data-testid="vote-confirmation"]')).toBeVisible();

    // Logout and try to vote as anonymous user
    await page.click('[data-testid="logout-btn"]');
    await page.goto('/polls/create');
    await page.fill('[data-testid="poll-title-input"]', 'Anonymous Test Poll');
    await page.fill('[data-testid="option-input-0"]', 'Option 1');
    await page.fill('[data-testid="option-input-1"]', 'Option 2');
    await page.click('[data-testid="create-poll-btn"]');

    // Should be able to vote anonymously
    await page.click('[data-testid="vote-option-0"]');
    await page.click('[data-testid="submit-vote-btn"]');

    // Should show vote confirmation
    await expect(page.locator('[data-testid="vote-confirmation"]')).toBeVisible();
  });
});
