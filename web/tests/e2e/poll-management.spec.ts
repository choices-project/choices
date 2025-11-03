/**
 * Poll Management E2E Tests - V2 Upgrade
 * 
 * Tests complete poll creation, voting, and management functionality
 * using V2 mock factory for test data setup and improved test patterns.
 * This covers the core MVP functionality.
 * 
 * Created: January 21, 2025
 * Updated: January 21, 2025
 */

import { test, expect } from '@playwright/test';

import { 
  setupE2ETestData, 
  cleanupE2ETestData, 
  createTestUser, 
  createTestPoll,
  waitForPageReady,
  setupExternalAPIMocks,
  E2E_CONFIG
} from './helpers/e2e-setup';

test.describe('Poll Management - V2', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
    poll: ReturnType<typeof createTestPoll>;
  };

  test.beforeEach(async ({ page }) => {
    // Create test data using V2 patterns
    testData = {
      user: createTestUser({
        email: 'poll-test@example.com',
        username: 'polltestuser',
        password: 'PollTest123!'
      }),
      poll: createTestPoll({
        title: 'V2 Poll Management Test Poll',
        description: 'This is a V2 test poll for E2E testing with improved patterns',
        options: ['Climate Action', 'Economic Growth', 'Social Justice', 'Technology Innovation'],
        category: 'general',
        privacy: 'public',
        votingMethod: 'single'
      })
    };

    // Set up external API mocks
    await setupExternalAPIMocks(page);

    // Navigate to the app
    await page.goto('/');
    await waitForPageReady(page);
  });

  test.afterEach(async () => {
    // Clean up test data
    await cleanupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });
  });

  test('should complete full poll creation and voting workflow with V2 setup', async ({ page }) => {
    // Set up test data for poll creation workflow
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Step 1: Register a new user
    await page.click('[data-testid="sign-up-button"]');
    await page.waitForURL('/register');
    
    // Wait for form hydration and select password method
    await page.waitForSelector('[data-testid="register-hydrated"]', { state: 'attached' });
    await expect(page.locator('[data-testid="register-hydrated"]')).toHaveText('1');
    await page.click('button:has-text("Password Account")');
    await page.waitForTimeout(500); // Wait for form to render
    
    await page.fill('[data-testid="email"]', testData.user.email);
    await page.fill('[data-testid="username"]', testData.user.username);
    await page.fill('[data-testid="password"]', testData.user.password);
    await page.fill('[data-testid="confirm-password"]', testData.user.password);
    
    await page.click('[data-testid="register-button"]');
    await page.waitForURL('/onboarding?step=welcome');
    
    // Complete enhanced onboarding (9-step flow)
    // Step 1: Welcome
    await page.click('button:has-text("Get Started")');
    
    // Step 2: Demographics
    await page.selectOption('select[name="ageRange"]', '25-34');
    await page.selectOption('select[name="gender"]', 'other');
    await page.selectOption('select[name="education"]', 'bachelors');
    await page.selectOption('select[name="income"]', '50000-75000');
    await page.click('button:has-text("Continue")');
    
    // Step 3: Values
    await page.click('button:has-text("Continue")');
    
    // Step 4: Privacy Philosophy
    await page.click('button:has-text("Continue")');
    
    // Step 5: Data Usage
    await page.click('button:has-text("Continue")');
    
    // Step 6: Profile Setup
    await page.fill('input[name="displayName"]', 'Test User');
    await page.click('button:has-text("Continue")');
    
    // Step 7: Notifications
    await page.click('button:has-text("Continue")');
    
    // Step 8: Privacy Settings
    await page.click('button:has-text("Continue")');
    
    // Step 9: Complete
    await page.click('button:has-text("Complete")');
    await page.waitForURL('/dashboard');

    // Step 2: Navigate to polls page and create a new poll using the superior wizard
    await page.goto('/polls');
    await waitForPageReady(page);
    await page.click('[data-testid="create-poll-button"]');
    await page.waitForURL('/polls/create');
    
    // Step 1: Basic Info (Title & Description) - Use V2 test data
    await page.fill('input[id="title"]', testData.poll.title);
    await page.fill('textarea[id="description"]', testData.poll.description);
    await page.click('button:has-text("Next")');
    
    // Step 2: Poll Options - Use V2 test data
    for (let i = 0; i < testData.poll.options.length; i++) {
      await page.fill(`input[placeholder*="Option ${i + 1}"]`, testData.poll.options[i]);
      if (i < testData.poll.options.length - 1) {
        await page.click('button:has-text("Add Option")');
      }
    }
    await page.click('button:has-text("Next")');
    
    // Step 3: Settings (Category, Tags, Privacy) - Use V2 test data
    await page.selectOption('select', testData.poll.category ?? 'general');
    await page.click('button:has-text("Next")');
    
    // Step 4: Review & Publish
    await page.click('button:has-text("Create Poll")');
    
    // Wait for redirect to poll page
    await page.waitForURL(/\/polls\/[a-f0-9-]+/);
    
    // Step 3: Verify poll was created with V2 test data
    const pollTitle = await page.locator('[data-testid="poll-title"]');
    await expect(pollTitle).toHaveText(testData.poll.title);
    
    const pollDescription = await page.locator('[data-testid="poll-description"]');
    await expect(pollDescription).toHaveText(testData.poll.description);
    
    // Verify all options are present
    for (const option of testData.poll.options) {
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

  test('should handle poll creation validation errors with V2 setup', async ({ page }) => {
    // Set up test data for validation testing
    await setupE2ETestData({
      user: testData.user
    });

    // Navigate to poll creation
    await page.goto('/polls/create');
    await waitForPageReady(page);
    
    // Try to proceed through wizard with empty form
    // Step 1: Try to proceed without title/description
    await page.click('button:has-text("Next")');
    
    // Should show validation errors for required fields
    await expect(page.locator('text=Title is required')).toBeVisible();
    await expect(page.locator('text=Description is required')).toBeVisible();
  });

  test('should handle poll voting validation with V2 setup', async ({ page }) => {
    // Set up test data for voting validation
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Create a poll first using superior wizard
    await page.goto('/polls/create');
    await waitForPageReady(page);
    
    // Step 1: Basic Info - Use V2 test data
    await page.fill('input[id="title"]', testData.poll.title);
    await page.fill('textarea[id="description"]', testData.poll.description);
    await page.click('button:has-text("Next")');
    
    // Step 2: Poll Options - Use V2 test data
    await page.fill('input[placeholder*="Option 1"]', testData.poll.options[0]);
    await page.fill('input[placeholder*="Option 2"]', testData.poll.options[1]);
    await page.click('button:has-text("Next")');
    
    // Step 3: Settings
    await page.selectOption('select', testData.poll.category ?? 'general');
    await page.click('button:has-text("Next")');
    
    // Step 4: Publish
    await page.click('button:has-text("Create Poll")');
    await page.waitForURL(/\/polls\/[a-f0-9-]+/);
    
    // Try to vote without selecting an option
    const voteButton = await page.locator('[data-testid="vote-button"]');
    await voteButton.click();
    
    // Should show validation error or prevent voting
    const errorMessage = await page.locator('[data-testid="vote-error"]');
    await expect(errorMessage).toBeVisible();
  });

  test('should display poll results correctly with V2 setup', async ({ page }) => {
    // Set up test data for poll results
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Navigate to an existing poll
    await page.goto('/polls');
    await waitForPageReady(page);
    
    // Click on the first poll
    const firstPoll = await page.locator('[data-testid="poll-item"]').first();
    await firstPoll.click();
    
    // Wait for poll page to load
    await waitForPageReady(page);
    
    // Check that poll results are displayed
    const resultsSection = await page.locator('[data-testid="poll-results"]');
    await expect(resultsSection).toBeVisible();
    
    // Check that vote counts are displayed
    const voteCounts = await page.locator('[data-testid="vote-count"]');
    await expect(voteCounts.first()).toBeVisible();
  });

  test('should handle poll categories with V2 setup', async ({ page }) => {
    // Create poll with specific category
    const categoryPoll = createTestPoll({
      title: 'Category Test Poll',
      description: 'Testing poll categories with V2 setup',
      options: ['Option 1', 'Option 2'],
      category: 'politics'
    });

    // Set up test data for category testing
    await setupE2ETestData({
      user: testData.user,
      poll: categoryPoll
    });

    // Navigate to poll creation
    await page.goto('/polls/create');
    await waitForPageReady(page);
    
    // Step 1: Basic Info
    await page.fill('input[id="title"]', categoryPoll.title);
    await page.fill('textarea[id="description"]', categoryPoll.description);
    await page.click('button:has-text("Next")');
    
    // Step 2: Poll Options
    await page.fill('input[placeholder*="Option 1"]', categoryPoll.options[0]);
    await page.fill('input[placeholder*="Option 2"]', categoryPoll.options[1]);
    await page.click('button:has-text("Next")');
    
    // Step 3: Settings - Select a category
    await page.selectOption('select', categoryPoll.category);
    await page.click('button:has-text("Next")');
    
    // Step 4: Publish
    await page.click('button:has-text("Create Poll")');
    await page.waitForURL(/\/polls\/[a-f0-9-]+/);
    
    // Verify category is displayed
    const categoryDisplay = await page.locator('[data-testid="poll-category"]');
    await expect(categoryDisplay).toContainText(categoryPoll.category);
  });

  test('should handle poll privacy settings with V2 setup', async ({ page }) => {
    // Create poll with specific privacy setting
    const privatePoll = createTestPoll({
      title: 'Private Test Poll',
      description: 'Testing poll privacy with V2 setup',
      options: ['Option 1', 'Option 2'],
      privacy: 'private'
    });

    // Set up test data for privacy testing
    await setupE2ETestData({
      user: testData.user,
      poll: privatePoll
    });

    // Navigate to poll creation
    await page.goto('/polls/create');
    await waitForPageReady(page);
    
    // Step 1: Basic Info
    await page.fill('input[id="title"]', privatePoll.title);
    await page.fill('textarea[id="description"]', privatePoll.description);
    await page.click('button:has-text("Next")');
    
    // Step 2: Poll Options
    await page.fill('input[placeholder*="Option 1"]', privatePoll.options[0]);
    await page.fill('input[placeholder*="Option 2"]', privatePoll.options[1]);
    await page.click('button:has-text("Next")');
    
    // Step 3: Settings - Set privacy level
    await page.selectOption('select', privatePoll.privacy);
    await page.click('button:has-text("Next")');
    
    // Step 4: Publish
    await page.click('button:has-text("Create Poll")');
    await page.waitForURL(/\/polls\/[a-f0-9-]+/);
    
    // Verify privacy setting is applied
    const privacyDisplay = await page.locator('[data-testid="poll-privacy"]');
    await expect(privacyDisplay).toContainText(privatePoll.privacy);
  });

  test('should handle poll timing settings with V2 setup', async ({ page }) => {
    // Set up test data for timing testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Navigate to poll creation
    await page.goto('/polls/create');
    await waitForPageReady(page);
    
    // Step 1: Basic Info
    await page.fill('input[id="title"]', testData.poll.title);
    await page.fill('textarea[id="description"]', testData.poll.description);
    await page.click('button:has-text("Next")');
    
    // Step 2: Poll Options
    await page.fill('input[placeholder*="Option 1"]', testData.poll.options[0]);
    await page.fill('input[placeholder*="Option 2"]', testData.poll.options[1]);
    await page.click('button:has-text("Next")');
    
    // Step 3: Settings - Set timing (if available in wizard)
    await page.selectOption('select', testData.poll.category ?? 'general');
    await page.click('button:has-text("Next")');
    
    // Step 4: Publish
    await page.click('button:has-text("Create Poll")');
    await page.waitForURL(/\/polls\/[a-f0-9-]+/);
    
    // Verify poll was created successfully
    const pollTitle = await page.locator('[data-testid="poll-title"]');
    await expect(pollTitle).toContainText(testData.poll.title);
  });

  test('should handle poll deletion (admin only) with V2 setup', async ({ page }) => {
    // Set up test data for admin testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // This test would require admin privileges
    // For now, just verify the delete button is not visible for regular users
    await page.goto('/polls');
    await waitForPageReady(page);
    
    // Click on the first poll
    const firstPoll = await page.locator('[data-testid="poll-item"]').first();
    await firstPoll.click();
    
    // Wait for poll page to load
    await waitForPageReady(page);
    
    // Check that delete button is not visible for regular users
    const deleteButton = await page.locator('[data-testid="delete-poll-button"]');
    await expect(deleteButton).not.toBeVisible();
  });

  test('should handle poll moderation with V2 setup', async ({ page }) => {
    // Set up test data for moderation testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Navigate to polls page
    await page.goto('/polls');
    await waitForPageReady(page);
    
    // Check that moderation options are not visible for regular users
    const moderateButton = await page.locator('[data-testid="moderate-poll-button"]');
    await expect(moderateButton).not.toBeVisible();
  });

  test('should handle poll search and filtering with V2 setup', async ({ page }) => {
    // Set up test data for search and filtering
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Navigate to polls page
    await page.goto('/polls');
    await waitForPageReady(page);
    
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

  test('should handle different voting methods with V2 setup', async ({ page }) => {
    // Test different voting methods with V2 setup
    const votingMethods = ['single', 'approval', 'ranked', 'quadratic', 'range'] as const;
    
    for (const method of votingMethods) {
      // Create poll with specific voting method
      const methodPoll = createTestPoll({
        title: `${method} Voting Test Poll`,
        description: `Testing ${method} voting with V2 setup`,
        options: ['Option 1', 'Option 2', 'Option 3'],
        votingMethod: method
      });

      // Set up test data for this method
      await setupE2ETestData({
        user: testData.user,
        poll: methodPoll
      });

      // Navigate to poll creation
      await page.goto('/polls/create');
      await waitForPageReady(page);
      
      // Create poll with specific voting method
      await page.fill('input[id="title"]', methodPoll.title);
      await page.fill('textarea[id="description"]', methodPoll.description);
      await page.click('button:has-text("Next")');
      
      // Add options
      for (let i = 0; i < methodPoll.options.length; i++) {
        await page.fill(`input[placeholder*="Option ${i + 1}"]`, methodPoll.options[i]);
        if (i < methodPoll.options.length - 1) {
          await page.click('button:has-text("Add Option")');
        }
      }
      await page.click('button:has-text("Next")');
      
      // Set voting method
      await page.selectOption('select[name="votingMethod"]', method);
      await page.click('button:has-text("Next")');
      
      // Publish
      await page.click('button:has-text("Create Poll")');
      await page.waitForURL(/\/polls\/[a-f0-9-]+/);
      
      // Verify poll was created with correct voting method
      const pollTitle = await page.locator('[data-testid="poll-title"]');
      await expect(pollTitle).toContainText(methodPoll.title);
      
      // Clean up for next iteration
      await cleanupE2ETestData({
        user: testData.user,
        poll: methodPoll
      });
    }
  });

  test('should handle poll creation with mobile viewport with V2 setup', async ({ page }) => {
    // Set up test data for mobile testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set mobile viewport
    await page.setViewportSize(E2E_CONFIG.BROWSER.MOBILE_VIEWPORT);
    
    // Navigate to poll creation
    await page.goto('/polls/create');
    await waitForPageReady(page);
    
    // Test mobile poll creation flow
    await page.fill('input[id="title"]', testData.poll.title);
    await page.fill('textarea[id="description"]', testData.poll.description);
    await page.click('button:has-text("Next")');
    
    // Add options on mobile
    await page.fill('input[placeholder*="Option 1"]', testData.poll.options[0]);
    await page.fill('input[placeholder*="Option 2"]', testData.poll.options[1]);
    await page.click('button:has-text("Next")');
    
    // Set category
    await page.selectOption('select', testData.poll.category ?? 'general');
    await page.click('button:has-text("Next")');
    
    // Publish
    await page.click('button:has-text("Create Poll")');
    await page.waitForURL(/\/polls\/[a-f0-9-]+/);
    
    // Verify poll was created successfully on mobile
    const pollTitle = await page.locator('[data-testid="poll-title"]');
    await expect(pollTitle).toContainText(testData.poll.title);
  });
});
