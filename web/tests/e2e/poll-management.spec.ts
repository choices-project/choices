/**
 * Poll Management E2E Tests
 * 
 * Tests complete poll creation, voting, and management functionality.
 * This covers the core MVP functionality.
 */

import { test, expect } from '@playwright/test';

test.describe('Poll Management', () => {
  let testUser: { email: string; username: string; password: string };
  let testPoll: { title: string; description: string; options: string[] };

  test.beforeEach(async ({ page }) => {
    // Set up test data
    testUser = {
      email: `test-${Date.now()}@example.com`,
      username: `testuser-${Date.now()}`,
      password: 'password123'
    };

    testPoll = {
      title: `Test Poll ${Date.now()}`,
      description: 'This is a test poll for E2E testing',
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4']
    };

    // Navigate to the app
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should complete full poll creation and voting workflow', async ({ page }) => {
    // Step 1: Register a new user
    await page.click('[data-testid="sign-up-button"]');
    await page.waitForURL('/register');
    
    await page.fill('[data-testid="email"]', testUser.email);
    await page.fill('[data-testid="username"]', testUser.username);
    await page.fill('[data-testid="password"]', testUser.password);
    await page.fill('[data-testid="confirm-password"]', testUser.password);
    
    await page.click('[data-testid="register-submit"]');
    await page.waitForURL('/onboarding');
    
    // Complete onboarding
    await page.click('[data-testid="complete-onboarding"]');
    await page.waitForURL('/dashboard');

    // Step 2: Create a new poll
    await page.click('[data-testid="create-poll-button"]');
    await page.waitForURL('/polls/create');
    
    // Fill poll form
    await page.fill('[data-testid="poll-create-title"]', testPoll.title);
    await page.fill('[data-testid="poll-create-description"]', testPoll.description);
    
    // Add poll options
    for (let i = 0; i < testPoll.options.length; i++) {
      await page.fill(`[data-testid="poll-create-option-input-${i}"]`, testPoll.options[i]);
      if (i < testPoll.options.length - 1) {
        await page.click('[data-testid="poll-create-add-option"]');
      }
    }
    
    // Submit poll
    await page.click('[data-testid="poll-create-submit"]');
    
    // Wait for redirect to poll page
    await page.waitForURL(/\/polls\/[a-f0-9-]+/);
    
    // Step 3: Verify poll was created
    const pollTitle = await page.locator('[data-testid="poll-title"]');
    await expect(pollTitle).toHaveText(testPoll.title);
    
    const pollDescription = await page.locator('[data-testid="poll-description"]');
    await expect(pollDescription).toHaveText(testPoll.description);
    
    // Verify all options are present
    for (const option of testPoll.options) {
      const optionElement = await page.locator(`text=${option}`);
      await expect(optionElement).toBeVisible();
    }

    // Step 4: Vote on the poll
    const firstOption = await page.locator('[data-testid="vote-button"]').first();
    await firstOption.click();
    
    // Wait for vote to be processed
    await page.waitForTimeout(1000);
    
    // Step 5: Verify vote was recorded
    const voteCount = await page.locator('[data-testid="vote-count"]');
    await expect(voteCount).toContainText('1');
    
    // Step 6: Verify poll results are displayed
    const resultsSection = await page.locator('[data-testid="poll-results"]');
    await expect(resultsSection).toBeVisible();
  });

  test('should handle poll creation validation errors', async ({ page }) => {
    // Navigate to poll creation
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // Try to submit empty form
    await page.click('[data-testid="poll-create-submit"]');
    
    // Check for validation errors
    const titleError = await page.locator('[data-testid="poll-create-title-error"]');
    await expect(titleError).toBeVisible();
    
    const optionsError = await page.locator('[data-testid="poll-create-options-error"]');
    await expect(optionsError).toBeVisible();
  });

  test('should handle poll voting validation', async ({ page }) => {
    // Create a poll first (simplified version)
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    await page.fill('[data-testid="poll-create-title"]', testPoll.title);
    await page.fill('[data-testid="poll-create-option-input-0"]', testPoll.options[0]);
    await page.fill('[data-testid="poll-create-option-input-1"]', testPoll.options[1]);
    
    await page.click('[data-testid="poll-create-submit"]');
    await page.waitForURL(/\/polls\/[a-f0-9-]+/);
    
    // Try to vote without selecting an option
    const voteButton = await page.locator('[data-testid="vote-button"]');
    await voteButton.click();
    
    // Should show validation error or prevent voting
    const errorMessage = await page.locator('[data-testid="vote-error"]');
    await expect(errorMessage).toBeVisible();
  });

  test('should display poll results correctly', async ({ page }) => {
    // Navigate to an existing poll
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');
    
    // Click on the first poll
    const firstPoll = await page.locator('[data-testid="poll-item"]').first();
    await firstPoll.click();
    
    // Wait for poll page to load
    await page.waitForLoadState('networkidle');
    
    // Check that poll results are displayed
    const resultsSection = await page.locator('[data-testid="poll-results"]');
    await expect(resultsSection).toBeVisible();
    
    // Check that vote counts are displayed
    const voteCounts = await page.locator('[data-testid="vote-count"]');
    await expect(voteCounts.first()).toBeVisible();
  });

  test('should handle poll categories', async ({ page }) => {
    // Navigate to poll creation
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // Fill basic poll info
    await page.fill('[data-testid="poll-create-title"]', testPoll.title);
    await page.fill('[data-testid="poll-create-option-input-0"]', testPoll.options[0]);
    await page.fill('[data-testid="poll-create-option-input-1"]', testPoll.options[1]);
    
    // Select a category
    const categorySelect = await page.locator('[data-testid="poll-create-category"]');
    await categorySelect.selectOption('politics');
    
    // Submit poll
    await page.click('[data-testid="poll-create-submit"]');
    await page.waitForURL(/\/polls\/[a-f0-9-]+/);
    
    // Verify category is displayed
    const categoryDisplay = await page.locator('[data-testid="poll-category"]');
    await expect(categoryDisplay).toContainText('politics');
  });

  test('should handle poll privacy settings', async ({ page }) => {
    // Navigate to poll creation
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // Fill basic poll info
    await page.fill('[data-testid="poll-create-title"]', testPoll.title);
    await page.fill('[data-testid="poll-create-option-input-0"]', testPoll.options[0]);
    await page.fill('[data-testid="poll-create-option-input-1"]', testPoll.options[1]);
    
    // Set privacy level
    const privacySelect = await page.locator('[data-testid="poll-create-privacy-level"]');
    await privacySelect.selectOption('private');
    
    // Submit poll
    await page.click('[data-testid="poll-create-submit"]');
    await page.waitForURL(/\/polls\/[a-f0-9-]+/);
    
    // Verify privacy setting is applied
    const privacyDisplay = await page.locator('[data-testid="poll-privacy"]');
    await expect(privacyDisplay).toContainText('private');
  });

  test('should handle poll timing settings', async ({ page }) => {
    // Navigate to poll creation
    await page.goto('/polls/create');
    await page.waitForLoadState('networkidle');
    
    // Fill basic poll info
    await page.fill('[data-testid="poll-create-title"]', testPoll.title);
    await page.fill('[data-testid="poll-create-option-input-0"]', testPoll.options[0]);
    await page.fill('[data-testid="poll-create-option-input-1"]', testPoll.options[1]);
    
    // Set end time
    const endTime = new Date();
    endTime.setHours(endTime.getHours() + 24); // 24 hours from now
    const endTimeString = endTime.toISOString().slice(0, 16); // Format for datetime-local input
    
    await page.fill('[data-testid="poll-create-end-time"]', endTimeString);
    
    // Submit poll
    await page.click('[data-testid="poll-create-submit"]');
    await page.waitForURL(/\/polls\/[a-f0-9-]+/);
    
    // Verify timing is displayed
    const timingDisplay = await page.locator('[data-testid="poll-timing"]');
    await expect(timingDisplay).toBeVisible();
  });

  test('should handle poll deletion (admin only)', async ({ page }) => {
    // This test would require admin privileges
    // For now, just verify the delete button is not visible for regular users
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');
    
    // Click on the first poll
    const firstPoll = await page.locator('[data-testid="poll-item"]').first();
    await firstPoll.click();
    
    // Wait for poll page to load
    await page.waitForLoadState('networkidle');
    
    // Check that delete button is not visible for regular users
    const deleteButton = await page.locator('[data-testid="delete-poll-button"]');
    await expect(deleteButton).not.toBeVisible();
  });

  test('should handle poll moderation', async ({ page }) => {
    // Navigate to polls page
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');
    
    // Check that moderation options are not visible for regular users
    const moderateButton = await page.locator('[data-testid="moderate-poll-button"]');
    await expect(moderateButton).not.toBeVisible();
  });

  test('should handle poll search and filtering', async ({ page }) => {
    // Navigate to polls page
    await page.goto('/polls');
    await page.waitForLoadState('networkidle');
    
    // Test search functionality
    const searchInput = await page.locator('[data-testid="poll-search"]');
    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      
      // Verify search results are filtered
      const pollItems = await page.locator('[data-testid="poll-item"]');
      await expect(pollItems).toHaveCount(0); // No polls should match "test"
    }
    
    // Test category filtering
    const categoryFilter = await page.locator('[data-testid="category-filter"]');
    if (await categoryFilter.count() > 0) {
      await categoryFilter.selectOption('politics');
      await page.waitForTimeout(1000);
      
      // Verify results are filtered by category
      const pollItems = await page.locator('[data-testid="poll-item"]');
      await expect(pollItems).toHaveCount(0); // No polls in politics category
    }
  });
});
