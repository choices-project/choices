/**
 * Poll Creation E2E Tests
 * 
 * End-to-end tests for poll creation functionality
 * 
 * Created: September 15, 2025
 * Updated: September 15, 2025
 */

import { test, expect } from '@playwright/test';

test.describe('Poll Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to poll creation page
    await page.goto('/polls/create');
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="poll-creation-form"]');
  });

  test('should create a basic single-choice poll', async ({ page }) => {
    // Fill in poll details
    await page.fill('[data-testid="poll-title"]', 'Test Single Choice Poll');
    await page.fill('[data-testid="poll-description"]', 'A test poll for single choice voting');
    
    // Select voting method
    await page.selectOption('[data-testid="voting-method"]', 'single');
    
    // Add options
    await page.fill('[data-testid="option-1"]', 'Option A');
    await page.fill('[data-testid="option-2"]', 'Option B');
    await page.fill('[data-testid="option-3"]', 'Option C');
    
    // Set poll timing
    await page.fill('[data-testid="start-time"]', '2025-01-01T00:00');
    await page.fill('[data-testid="end-time"]', '2025-12-31T23:59');
    
    // Submit the form
    await page.click('[data-testid="create-poll-button"]');
    
    // Verify success
    await expect(page.locator('[data-testid="poll-created-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="poll-id"]')).toBeVisible();
    
    // Verify poll details
    await expect(page.locator('[data-testid="poll-title-display"]')).toContainText('Test Single Choice Poll');
    await expect(page.locator('[data-testid="voting-method-display"]')).toContainText('Single Choice');
  });

  test('should create an approval voting poll', async ({ page }) => {
    // Fill in poll details
    await page.fill('[data-testid="poll-title"]', 'Test Approval Poll');
    await page.fill('[data-testid="poll-description"]', 'A test poll for approval voting');
    
    // Select approval voting method
    await page.selectOption('[data-testid="voting-method"]', 'approval');
    
    // Add options
    await page.fill('[data-testid="option-1"]', 'Project A');
    await page.fill('[data-testid="option-2"]', 'Project B');
    await page.fill('[data-testid="option-3"]', 'Project C');
    await page.fill('[data-testid="option-4"]', 'Project D');
    
    // Set poll timing
    await page.fill('[data-testid="start-time"]', '2025-01-01T00:00');
    await page.fill('[data-testid="end-time"]', '2025-12-31T23:59');
    
    // Submit the form
    await page.click('[data-testid="create-poll-button"]');
    
    // Verify success
    await expect(page.locator('[data-testid="poll-created-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="voting-method-display"]')).toContainText('Approval Voting');
  });

  test('should create a ranked choice poll', async ({ page }) => {
    // Fill in poll details
    await page.fill('[data-testid="poll-title"]', 'Test Ranked Choice Poll');
    await page.fill('[data-testid="poll-description"]', 'A test poll for ranked choice voting');
    
    // Select ranked choice voting method
    await page.selectOption('[data-testid="voting-method"]', 'ranked');
    
    // Add options
    await page.fill('[data-testid="option-1"]', 'Candidate A');
    await page.fill('[data-testid="option-2"]', 'Candidate B');
    await page.fill('[data-testid="option-3"]', 'Candidate C');
    
    // Set poll timing
    await page.fill('[data-testid="start-time"]', '2025-01-01T00:00');
    await page.fill('[data-testid="end-time"]', '2025-12-31T23:59');
    
    // Submit the form
    await page.click('[data-testid="create-poll-button"]');
    
    // Verify success
    await expect(page.locator('[data-testid="poll-created-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="voting-method-display"]')).toContainText('Ranked Choice');
  });

  test('should create a quadratic voting poll', async ({ page }) => {
    // Fill in poll details
    await page.fill('[data-testid="poll-title"]', 'Test Quadratic Poll');
    await page.fill('[data-testid="poll-description"]', 'A test poll for quadratic voting');
    
    // Select quadratic voting method
    await page.selectOption('[data-testid="voting-method"]', 'quadratic');
    
    // Add options
    await page.fill('[data-testid="option-1"]', 'Initiative A');
    await page.fill('[data-testid="option-2"]', 'Initiative B');
    await page.fill('[data-testid="option-3"]', 'Initiative C');
    
    // Set poll timing
    await page.fill('[data-testid="start-time"]', '2025-01-01T00:00');
    await page.fill('[data-testid="end-time"]', '2025-12-31T23:59');
    
    // Submit the form
    await page.click('[data-testid="create-poll-button"]');
    
    // Verify success
    await expect(page.locator('[data-testid="poll-created-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="voting-method-display"]')).toContainText('Quadratic Voting');
  });

  test('should create a range voting poll', async ({ page }) => {
    // Fill in poll details
    await page.fill('[data-testid="poll-title"]', 'Test Range Poll');
    await page.fill('[data-testid="poll-description"]', 'A test poll for range voting');
    
    // Select range voting method
    await page.selectOption('[data-testid="voting-method"]', 'range');
    
    // Add options
    await page.fill('[data-testid="option-1"]', 'Movie A');
    await page.fill('[data-testid="option-2"]', 'Movie B');
    await page.fill('[data-testid="option-3"]', 'Movie C');
    
    // Set poll timing
    await page.fill('[data-testid="start-time"]', '2025-01-01T00:00');
    await page.fill('[data-testid="end-time"]', '2025-12-31T23:59');
    
    // Submit the form
    await page.click('[data-testid="create-poll-button"]');
    
    // Verify success
    await expect(page.locator('[data-testid="poll-created-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="voting-method-display"]')).toContainText('Range Voting');
  });

  test('should validate required fields', async ({ page }) => {
    // Try to submit without filling required fields
    await page.click('[data-testid="create-poll-button"]');
    
    // Verify validation errors
    await expect(page.locator('[data-testid="title-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="title-error"]')).toContainText('Title is required');
    
    await expect(page.locator('[data-testid="voting-method-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="voting-method-error"]')).toContainText('Voting method is required');
    
    await expect(page.locator('[data-testid="options-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="options-error"]')).toContainText('At least 2 options are required');
  });

  test('should validate minimum number of options', async ({ page }) => {
    // Fill in poll details
    await page.fill('[data-testid="poll-title"]', 'Test Poll');
    await page.selectOption('[data-testid="voting-method"]', 'single');
    
    // Add only one option
    await page.fill('[data-testid="option-1"]', 'Only Option');
    
    // Try to submit
    await page.click('[data-testid="create-poll-button"]');
    
    // Verify validation error
    await expect(page.locator('[data-testid="options-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="options-error"]')).toContainText('At least 2 options are required');
  });

  test('should validate poll timing', async ({ page }) => {
    // Fill in poll details
    await page.fill('[data-testid="poll-title"]', 'Test Poll');
    await page.selectOption('[data-testid="voting-method"]', 'single');
    await page.fill('[data-testid="option-1"]', 'Option A');
    await page.fill('[data-testid="option-2"]', 'Option B');
    
    // Set invalid timing (end before start)
    await page.fill('[data-testid="start-time"]', '2025-12-31T23:59');
    await page.fill('[data-testid="end-time"]', '2025-01-01T00:00');
    
    // Try to submit
    await page.click('[data-testid="create-poll-button"]');
    
    // Verify validation error
    await expect(page.locator('[data-testid="timing-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="timing-error"]')).toContainText('End time must be after start time');
  });

  test('should allow adding and removing options dynamically', async ({ page }) => {
    // Fill in basic poll details
    await page.fill('[data-testid="poll-title"]', 'Test Dynamic Options Poll');
    await page.selectOption('[data-testid="voting-method"]', 'single');
    
    // Add initial options
    await page.fill('[data-testid="option-1"]', 'Option A');
    await page.fill('[data-testid="option-2"]', 'Option B');
    
    // Add more options
    await page.click('[data-testid="add-option-button"]');
    await page.fill('[data-testid="option-3"]', 'Option C');
    
    await page.click('[data-testid="add-option-button"]');
    await page.fill('[data-testid="option-4"]', 'Option D');
    
    // Remove an option
    await page.click('[data-testid="remove-option-3-button"]');
    
    // Verify option was removed
    await expect(page.locator('[data-testid="option-3"]')).not.toBeVisible();
    
    // Set timing and submit
    await page.fill('[data-testid="start-time"]', '2025-01-01T00:00');
    await page.fill('[data-testid="end-time"]', '2025-12-31T23:59');
    
    await page.click('[data-testid="create-poll-button"]');
    
    // Verify success
    await expect(page.locator('[data-testid="poll-created-success"]')).toBeVisible();
  });

  test('should handle baseline date configuration', async ({ page }) => {
    // Fill in poll details
    await page.fill('[data-testid="poll-title"]', 'Test Baseline Poll');
    await page.selectOption('[data-testid="voting-method"]', 'single');
    await page.fill('[data-testid="option-1"]', 'Option A');
    await page.fill('[data-testid="option-2"]', 'Option B');
    
    // Set poll timing
    await page.fill('[data-testid="start-time"]', '2025-01-01T00:00');
    await page.fill('[data-testid="end-time"]', '2025-12-31T23:59');
    
    // Enable baseline system
    await page.check('[data-testid="enable-baseline"]');
    
    // Set baseline date
    await page.fill('[data-testid="baseline-date"]', '2025-06-01T00:00');
    
    // Enable post-close voting
    await page.check('[data-testid="allow-post-close"]');
    
    // Submit the form
    await page.click('[data-testid="create-poll-button"]');
    
    // Verify success
    await expect(page.locator('[data-testid="poll-created-success"]')).toBeVisible();
    
    // Verify baseline configuration
    await expect(page.locator('[data-testid="baseline-enabled"]')).toBeVisible();
    await expect(page.locator('[data-testid="post-close-enabled"]')).toBeVisible();
  });

  test('should handle poll creation with custom settings', async ({ page }) => {
    // Fill in poll details
    await page.fill('[data-testid="poll-title"]', 'Test Custom Settings Poll');
    await page.selectOption('[data-testid="voting-method"]', 'single');
    await page.fill('[data-testid="option-1"]', 'Option A');
    await page.fill('[data-testid="option-2"]', 'Option B');
    
    // Set poll timing
    await page.fill('[data-testid="start-time"]', '2025-01-01T00:00');
    await page.fill('[data-testid="end-time"]', '2025-12-31T23:59');
    
    // Configure custom settings
    await page.check('[data-testid="require-authentication"]');
    await page.check('[data-testid="allow-anonymous"]');
    await page.selectOption('[data-testid="privacy-level"]', 'private');
    
    // Submit the form
    await page.click('[data-testid="create-poll-button"]');
    
    // Verify success
    await expect(page.locator('[data-testid="poll-created-success"]')).toBeVisible();
    
    // Verify custom settings
    await expect(page.locator('[data-testid="authentication-required"]')).toBeVisible();
    await expect(page.locator('[data-testid="anonymous-allowed"]')).toBeVisible();
    await expect(page.locator('[data-testid="privacy-level-display"]')).toContainText('Private');
  });

  test('should handle form reset functionality', async ({ page }) => {
    // Fill in poll details
    await page.fill('[data-testid="poll-title"]', 'Test Poll');
    await page.fill('[data-testid="poll-description"]', 'Test Description');
    await page.selectOption('[data-testid="voting-method"]', 'single');
    await page.fill('[data-testid="option-1"]', 'Option A');
    await page.fill('[data-testid="option-2"]', 'Option B');
    
    // Reset the form
    await page.click('[data-testid="reset-form-button"]');
    
    // Verify form is reset
    await expect(page.locator('[data-testid="poll-title"]')).toHaveValue('');
    await expect(page.locator('[data-testid="poll-description"]')).toHaveValue('');
    await expect(page.locator('[data-testid="voting-method"]')).toHaveValue('');
    await expect(page.locator('[data-testid="option-1"]')).toHaveValue('');
    await expect(page.locator('[data-testid="option-2"]')).toHaveValue('');
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/api/polls', route => {
      route.abort('failed');
    });
    
    // Fill in poll details
    await page.fill('[data-testid="poll-title"]', 'Test Poll');
    await page.selectOption('[data-testid="voting-method"]', 'single');
    await page.fill('[data-testid="option-1"]', 'Option A');
    await page.fill('[data-testid="option-2"]', 'Option B');
    await page.fill('[data-testid="start-time"]', '2025-01-01T00:00');
    await page.fill('[data-testid="end-time"]', '2025-12-31T23:59');
    
    // Try to submit
    await page.click('[data-testid="create-poll-button"]');
    
    // Verify error handling
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="network-error"]')).toContainText('Network error');
  });

  test('should handle server errors gracefully', async ({ page }) => {
    // Mock server error
    await page.route('**/api/polls', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      });
    });
    
    // Fill in poll details
    await page.fill('[data-testid="poll-title"]', 'Test Poll');
    await page.selectOption('[data-testid="voting-method"]', 'single');
    await page.fill('[data-testid="option-1"]', 'Option A');
    await page.fill('[data-testid="option-2"]', 'Option B');
    await page.fill('[data-testid="start-time"]', '2025-01-01T00:00');
    await page.fill('[data-testid="end-time"]', '2025-12-31T23:59');
    
    // Try to submit
    await page.click('[data-testid="create-poll-button"]');
    
    // Verify error handling
    await expect(page.locator('[data-testid="server-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="server-error"]')).toContainText('Server error');
  });
});
