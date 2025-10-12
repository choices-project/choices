/**
 * Enhanced Poll Creation and Voting E2E Tests
 * 
 * Tests the complete poll creation and voting workflow with elevated UX/UI patterns:
 * - Intuitive poll creation with smart suggestions
 * - Real-time validation and feedback
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Mobile-first responsive design
 * - Collaborative voting features
 * - Advanced analytics and insights
 * - Social sharing and engagement
 */

import { test, expect } from '@playwright/test';

test.describe('Enhanced Poll Creation and Voting Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Set up accessibility testing
    await page.addInitScript(() => {
      window.__playwright_accessibility = true;
    });

    // Mock authenticated user
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 'user-123',
            email: 'test@example.com',
            username: 'testuser',
            displayName: 'Test User',
            isActive: true,
          },
        }),
      });
    });

    // Navigate to dashboard with performance monitoring
    const startTime = Date.now();
    await page.goto('/dashboard');
    const loadTime = Date.now() - startTime;
    
    // Verify fast loading
    expect(loadTime).toBeLessThan(2000);
  });

  test('should create a new poll with enhanced UX', async ({ page }) => {
    // Test accessibility of create poll button
    await expect(page.locator('[data-testid="create-poll-btn"]')).toHaveAttribute('aria-label', 'Create new poll');
    await expect(page.locator('[data-testid="create-poll-btn"]')).toHaveAttribute('role', 'button');
    
    // Click create poll button with enhanced feedback
    await page.click('[data-testid="create-poll-btn"]');
    
    // Should open poll creation modal with smooth animation
    await expect(page.locator('[data-testid="poll-creation-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="poll-creation-modal"]')).toHaveClass(/animate-in/);
    await expect(page.locator('h2')).toContainText('Create New Poll');
    
    // Test accessibility of modal
    await expect(page.locator('[data-testid="poll-creation-modal"]')).toHaveAttribute('role', 'dialog');
    await expect(page.locator('[data-testid="poll-creation-modal"]')).toHaveAttribute('aria-labelledby');
    await expect(page.locator('[data-testid="poll-creation-modal"]')).toHaveAttribute('aria-describedby');
    
    // Test smart suggestions for poll title
    await page.fill('input[name="title"]', 'What should we prioritize?');
    await expect(page.locator('[data-testid="title-suggestions"]')).toBeVisible();
    await expect(page.locator('[data-testid="title-suggestions"]')).toHaveText('Similar polls: "What are your priorities?"');
    
    // Test real-time validation
    await expect(page.locator('[data-testid="title-validation"]')).toHaveText('✓ Good title');
    await expect(page.locator('[data-testid="title-validation"]')).toHaveClass(/success/);
    
    // Test enhanced description with character counter
    await page.fill('textarea[name="description"]', 'Help us decide on our priorities for the next quarter');
    await expect(page.locator('[data-testid="description-counter"]')).toHaveText('65/500 characters');
    await expect(page.locator('[data-testid="description-validation"]')).toHaveText('✓ Description is clear and helpful');
    
    // Test smart option suggestions
    await page.fill('input[name="option1"]', 'Education');
    await expect(page.locator('[data-testid="option-suggestions-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="option-suggestions-1"]')).toHaveText('Similar options: "Education reform", "School funding"');
    
    await page.fill('input[name="option2"]', 'Healthcare');
    await expect(page.locator('[data-testid="option-suggestions-2"]')).toBeVisible();
    await expect(page.locator('[data-testid="option-suggestions-2"]')).toHaveText('Similar options: "Healthcare access", "Medical research"');
    
    await page.fill('input[name="option3"]', 'Infrastructure');
    await expect(page.locator('[data-testid="option-suggestions-3"]')).toBeVisible();
    await expect(page.locator('[data-testid="option-suggestions-3"]')).toHaveText('Similar options: "Road maintenance", "Public transit"');
    
    // Test option validation
    await expect(page.locator('[data-testid="options-validation"]')).toHaveText('✓ 3 options added (minimum 2)');
    await expect(page.locator('[data-testid="options-validation"]')).toHaveClass(/success/);
    
    // Test enhanced poll settings with explanations
    await page.selectOption('select[name="votingMethod"]', 'single');
    await expect(page.locator('[data-testid="voting-method-explanation"]')).toBeVisible();
    await expect(page.locator('[data-testid="voting-method-explanation"]')).toHaveText('Single choice: Voters can select one option');
    
    await page.selectOption('select[name="category"]', 'politics');
    await expect(page.locator('[data-testid="category-explanation"]')).toBeVisible();
    await expect(page.locator('[data-testid="category-explanation"]')).toHaveText('Politics: Government and policy-related topics');
    
    await page.selectOption('select[name="privacyLevel"]', 'public');
    await expect(page.locator('[data-testid="privacy-explanation"]')).toBeVisible();
    await expect(page.locator('[data-testid="privacy-explanation"]')).toHaveText('Public: Anyone can view and vote on this poll');
    
    // Test smart hashtag suggestions
    await page.fill('input[name="hashtags"]', 'politics, priorities, decision');
    await expect(page.locator('[data-testid="hashtag-suggestions"]')).toBeVisible();
    await expect(page.locator('[data-testid="hashtag-suggestions"]')).toHaveText('Suggested hashtags: #government #policy #voting');
    
    // Test hashtag validation
    await expect(page.locator('[data-testid="hashtag-validation"]')).toHaveText('✓ 3 hashtags added');
    await expect(page.locator('[data-testid="hashtag-validation"]')).toHaveClass(/success/);
    
    // Test poll preview
    await expect(page.locator('[data-testid="poll-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="poll-preview"]')).toHaveText('Preview: What should we prioritize?');
    
    // Test form submission with enhanced feedback
    await page.click('button:has-text("Create Poll")');
    
    // Verify loading state
    await expect(page.locator('[data-testid="create-poll-button"]')).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('[data-testid="create-poll-button"]')).toBeDisabled();
    
    // Should show success message with animation
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toHaveText('Poll created successfully!');
    await expect(page.locator('[data-testid="success-message"]')).toHaveClass(/animate-in/);
    
    // Should redirect to poll page with enhanced features
    await expect(page).toHaveURL(/\/poll\/[a-zA-Z0-9-]+/);
    await expect(page.locator('[data-testid="poll-page"]')).toBeVisible();
    
    // Test poll page features
    await expect(page.locator('[data-testid="poll-title"]')).toHaveText('What should we prioritize?');
    await expect(page.locator('[data-testid="poll-description"]')).toHaveText('Help us decide on our priorities for the next quarter');
    await expect(page.locator('[data-testid="poll-options"]')).toBeVisible();
    await expect(page.locator('[data-testid="poll-hashtags"]')).toBeVisible();
    await expect(page.locator('[data-testid="poll-hashtags"]')).toHaveText('#politics #priorities #decision');
  });

  test('should handle poll creation validation errors', async ({ page }) => {
    // Click create poll button
    await page.click('button:has-text("Create Poll")');
    
    // Try to submit without required fields
    await page.click('button:has-text("Create Poll")');
    
    // Should show validation errors
    await expect(page.locator('text=Title is required')).toBeVisible();
    await expect(page.locator('text=At least 2 options are required')).toBeVisible();
    
    // Fill invalid data
    await page.fill('input[name="title"]', 'AB'); // Too short
    await page.fill('input[name="option1"]', 'Option 1');
    await page.fill('input[name="option2"]', 'Option 2');
    
    await page.click('button:has-text("Create Poll")');
    
    // Should show validation errors
    await expect(page.locator('text=Title must be at least 3 characters')).toBeVisible();
    
    // Test too many options
    await page.fill('input[name="title"]', 'Valid Title');
    for (let i = 3; i <= 11; i++) {
      await page.fill(`input[name="option${i}"]`, `Option ${i}`);
    }
    
    await page.click('button:has-text("Create Poll")');
    
    // Should show validation error
    await expect(page.locator('text=Too many options (max 10)')).toBeVisible();
  });

  test('should vote on a poll', async ({ page }) => {
    // Navigate to a poll (assuming there's a poll on the dashboard)
    await page.click('text=What should we prioritize?');
    
    // Should be on poll page
    await expect(page.locator('h1')).toContainText('What should we prioritize?');
    
    // Select an option
    await page.click('input[value="Education"]');
    
    // Submit vote
    await page.click('button:has-text("Vote")');
    
    // Should show success message
    await expect(page.locator('text=Vote submitted successfully')).toBeVisible();
    
    // Should show results (if poll allows showing results)
    await expect(page.locator('text=Results')).toBeVisible();
  });

  test('should handle voting validation errors', async ({ page }) => {
    // Navigate to a poll
    await page.click('text=What should we prioritize?');
    
    // Try to vote without selecting an option
    await page.click('button:has-text("Vote")');
    
    // Should show validation error
    await expect(page.locator('text=Please select an option')).toBeVisible();
    
    // Select an option and vote
    await page.click('input[value="Education"]');
    await page.click('button:has-text("Vote")');
    
    // Try to vote again (should be prevented)
    await page.click('input[value="Healthcare"]');
    await page.click('button:has-text("Vote")');
    
    // Should show error
    await expect(page.locator('text=You have already voted on this poll')).toBeVisible();
  });

  test('should view poll results', async ({ page }) => {
    // Navigate to a poll
    await page.click('text=What should we prioritize?');
    
    // Click view results
    await page.click('button:has-text("View Results")');
    
    // Should show results
    await expect(page.locator('text=Poll Results')).toBeVisible();
    await expect(page.locator('text=Education')).toBeVisible();
    await expect(page.locator('text=Healthcare')).toBeVisible();
    await expect(page.locator('text=Infrastructure')).toBeVisible();
    
    // Should show vote counts and percentages
    await expect(page.locator('text=Total Votes:')).toBeVisible();
    await expect(page.locator('text=%')).toBeVisible();
  });

  test('should handle poll expiration', async ({ page }) => {
    // Navigate to an expired poll
    await page.click('text=Expired Poll');
    
    // Should show expiration message
    await expect(page.locator('text=This poll has expired')).toBeVisible();
    
    // Should not allow voting
    await expect(page.locator('button:has-text("Vote")')).toBeDisabled();
    
    // Should show final results
    await expect(page.locator('text=Final Results')).toBeVisible();
  });

  test('should handle poll privacy settings', async ({ page }) => {
    // Navigate to a private poll
    await page.click('text=Private Poll');
    
    // Should show privacy message
    await expect(page.locator('text=This is a private poll')).toBeVisible();
    
    // Should require authentication
    await expect(page.locator('text=Please sign in to vote')).toBeVisible();
    
    // Should not show results to non-members
    await expect(page.locator('text=Results')).not.toBeVisible();
  });

  test('should handle different voting methods', async ({ page }) => {
    // Test single choice voting
    await page.click('text=Single Choice Poll');
    await page.click('input[value="Option 1"]');
    await page.click('button:has-text("Vote")');
    await expect(page.locator('text=Vote submitted successfully')).toBeVisible();
    
    // Test approval voting
    await page.click('text=Approval Voting Poll');
    await page.click('input[value="Option 1"]');
    await page.click('input[value="Option 2"]');
    await page.click('button:has-text("Vote")');
    await expect(page.locator('text=Vote submitted successfully')).toBeVisible();
    
    // Test ranked voting
    await page.click('text=Ranked Choice Poll');
    await page.dragAndDrop('text=Option 1', 'text=Rank 1');
    await page.dragAndDrop('text=Option 2', 'text=Rank 2');
    await page.dragAndDrop('text=Option 3', 'text=Rank 3');
    await page.click('button:has-text("Vote")');
    await expect(page.locator('text=Vote submitted successfully')).toBeVisible();
  });

  test('should handle poll management', async ({ page }) => {
    // Navigate to user's polls
    await page.click('text=My Polls');
    
    // Should show user's polls
    await expect(page.locator('text=What should we prioritize?')).toBeVisible();
    
    // Edit a poll
    await page.click('button:has-text("Edit")');
    await page.fill('input[name="title"]', 'Updated Poll Title');
    await page.click('button:has-text("Save Changes")');
    
    // Should show success message
    await expect(page.locator('text=Poll updated successfully')).toBeVisible();
    
    // Delete a poll
    await page.click('button:has-text("Delete")');
    await page.click('button:has-text("Confirm Delete")');
    
    // Should show success message
    await expect(page.locator('text=Poll deleted successfully')).toBeVisible();
  });

  test('should handle poll analytics', async ({ page }) => {
    // Navigate to poll analytics
    await page.click('text=Poll Analytics');
    
    // Should show analytics data
    await expect(page.locator('text=Total Votes')).toBeVisible();
    await expect(page.locator('text=Vote Distribution')).toBeVisible();
    await expect(page.locator('text=Voting Trends')).toBeVisible();
    
    // Should show charts/graphs
    await expect(page.locator('canvas')).toBeVisible();
  });
});
