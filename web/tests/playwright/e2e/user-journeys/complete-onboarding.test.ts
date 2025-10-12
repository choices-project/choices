/**
 * Complete Onboarding E2E Test
 * 
 * Tests the complete user onboarding journey including:
 * - User registration
 * - Onboarding flow
 * - Dashboard access
 * - Profile completion
 */

import { test, expect } from '@playwright/test';

test.describe('Complete Onboarding Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the landing page
    await page.goto('/');
  });

  test('should complete full onboarding flow', async ({ page }) => {
    // Step 1: Navigate to registration
    await page.click('[data-testid="get-started-btn"]');
    await expect(page).toHaveURL('/auth');

    // Step 2: Register new user
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.fill('[data-testid="confirm-password-input"]', 'password123');
    await page.click('[data-testid="register-btn"]');

    // Step 3: Should redirect to onboarding
    await expect(page).toHaveURL('/onboarding');
    await expect(page.locator('[data-testid="onboarding-flow"]')).toBeVisible();

    // Step 4: Complete onboarding steps
    // Welcome step
    await expect(page.locator('[data-testid="welcome-step"]')).toBeVisible();
    await page.click('[data-testid="welcome-next"]');

    // Privacy step
    await expect(page.locator('[data-testid="privacy-step"]')).toBeVisible();
    await page.check('[data-testid="notifications-checkbox"]');
    await page.check('[data-testid="data-sharing-checkbox"]');
    await page.click('[data-testid="privacy-next"]');

    // Demographics step
    await expect(page.locator('[data-testid="demographics-step"]')).toBeVisible();
    await page.fill('[data-testid="age-input"]', '25');
    await page.selectOption('[data-testid="gender-select"]', 'other');
    await page.fill('[data-testid="location-input"]', 'San Francisco, CA');
    await page.click('[data-testid="demographics-next"]');

    // Auth step (should be pre-authenticated)
    await expect(page.locator('[data-testid="auth-step"]')).toBeVisible();
    await page.click('[data-testid="auth-next"]');

    // Profile step
    await expect(page.locator('[data-testid="profile-step"]')).toBeVisible();
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="bio-textarea"]', 'Test user bio');
    await page.click('[data-testid="profile-next"]');

    // Complete step
    await expect(page.locator('[data-testid="complete-step"]')).toBeVisible();
    await page.click('[data-testid="complete-finish"]');

    // Step 5: Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="dashboard-page"]')).toBeVisible();
  });

  test('should handle onboarding skip options', async ({ page }) => {
    // Navigate to onboarding
    await page.goto('/onboarding');

    // Welcome step - skip
    await expect(page.locator('[data-testid="welcome-step"]')).toBeVisible();
    await page.click('[data-testid="welcome-skip"]');

    // Privacy step - continue
    await expect(page.locator('[data-testid="privacy-step"]')).toBeVisible();
    await page.click('[data-testid="privacy-next"]');

    // Demographics step - skip
    await expect(page.locator('[data-testid="demographics-step"]')).toBeVisible();
    await page.click('[data-testid="demographics-skip"]');

    // Auth step - continue
    await expect(page.locator('[data-testid="auth-step"]')).toBeVisible();
    await page.click('[data-testid="auth-next"]');

    // Profile step - skip
    await expect(page.locator('[data-testid="profile-step"]')).toBeVisible();
    await page.click('[data-testid="profile-skip"]');

    // Complete step
    await expect(page.locator('[data-testid="complete-step"]')).toBeVisible();
    await page.click('[data-testid="complete-finish"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should handle onboarding back navigation', async ({ page }) => {
    // Navigate to onboarding
    await page.goto('/onboarding');

    // Welcome step
    await expect(page.locator('[data-testid="welcome-step"]')).toBeVisible();
    await page.click('[data-testid="welcome-next"]');

    // Privacy step
    await expect(page.locator('[data-testid="privacy-step"]')).toBeVisible();
    await page.click('[data-testid="privacy-back"]');

    // Should go back to welcome step
    await expect(page.locator('[data-testid="welcome-step"]')).toBeVisible();
  });

  test('should validate form inputs', async ({ page }) => {
    // Navigate to onboarding
    await page.goto('/onboarding');

    // Welcome step
    await page.click('[data-testid="welcome-next"]');

    // Privacy step
    await page.click('[data-testid="privacy-next"]');

    // Demographics step - test validation
    await expect(page.locator('[data-testid="demographics-step"]')).toBeVisible();
    
    // Try to continue without filling required fields
    await page.click('[data-testid="demographics-next"]');
    
    // Should show validation errors
    await expect(page.locator('[data-testid="age-input"]')).toHaveAttribute('required');
    await expect(page.locator('[data-testid="gender-select"]')).toHaveAttribute('required');

    // Fill required fields
    await page.fill('[data-testid="age-input"]', '25');
    await page.selectOption('[data-testid="gender-select"]', 'other');
    await page.fill('[data-testid="location-input"]', 'San Francisco, CA');
    await page.click('[data-testid="demographics-next"]');

    // Should proceed to next step
    await expect(page.locator('[data-testid="auth-step"]')).toBeVisible();
  });

  test('should handle onboarding errors gracefully', async ({ page }) => {
    // Mock network error
    await page.route('**/api/onboarding/progress', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' }),
      });
    });

    // Navigate to onboarding
    await page.goto('/onboarding');

    // Welcome step
    await page.click('[data-testid="welcome-next"]');

    // Privacy step
    await page.click('[data-testid="privacy-next"]');

    // Demographics step
    await page.fill('[data-testid="age-input"]', '25');
    await page.selectOption('[data-testid="gender-select"]', 'other');
    await page.fill('[data-testid="location-input"]', 'San Francisco, CA');
    await page.click('[data-testid="demographics-next"]');

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });

  test('should persist onboarding data across steps', async ({ page }) => {
    // Navigate to onboarding
    await page.goto('/onboarding');

    // Welcome step
    await page.click('[data-testid="welcome-next"]');

    // Privacy step
    await page.check('[data-testid="notifications-checkbox"]');
    await page.check('[data-testid="data-sharing-checkbox"]');
    await page.click('[data-testid="privacy-next"]');

    // Demographics step
    await page.fill('[data-testid="age-input"]', '25');
    await page.selectOption('[data-testid="gender-select"]', 'other');
    await page.fill('[data-testid="location-input"]', 'San Francisco, CA');
    await page.click('[data-testid="demographics-next"]');

    // Auth step
    await page.click('[data-testid="auth-next"]');

    // Profile step
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.fill('[data-testid="bio-textarea"]', 'Test user bio');
    await page.click('[data-testid="profile-next"]');

    // Complete step
    await page.click('[data-testid="complete-finish"]');

    // Should redirect to dashboard with persisted data
    await expect(page).toHaveURL('/dashboard');
    
    // Verify user profile is created
    await expect(page.locator('[data-testid="user-name"]')).toHaveText('testuser');
  });

  test('should handle onboarding interruption and resume', async ({ page }) => {
    // Navigate to onboarding
    await page.goto('/onboarding');

    // Welcome step
    await page.click('[data-testid="welcome-next"]');

    // Privacy step
    await page.check('[data-testid="notifications-checkbox"]');
    await page.click('[data-testid="privacy-next"]');

    // Demographics step
    await page.fill('[data-testid="age-input"]', '25');
    await page.selectOption('[data-testid="gender-select"]', 'other');
    await page.fill('[data-testid="location-input"]', 'San Francisco, CA');
    await page.click('[data-testid="demographics-next"]');

    // Navigate away
    await page.goto('/');

    // Navigate back to onboarding
    await page.goto('/onboarding');

    // Should resume from where we left off
    await expect(page.locator('[data-testid="auth-step"]')).toBeVisible();
  });

  test('should handle mobile onboarding flow', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Navigate to onboarding
    await page.goto('/onboarding');

    // Welcome step
    await expect(page.locator('[data-testid="welcome-step"]')).toBeVisible();
    await page.click('[data-testid="welcome-next"]');

    // Privacy step
    await expect(page.locator('[data-testid="privacy-step"]')).toBeVisible();
    await page.check('[data-testid="notifications-checkbox"]');
    await page.click('[data-testid="privacy-next"]');

    // Demographics step
    await expect(page.locator('[data-testid="demographics-step"]')).toBeVisible();
    await page.fill('[data-testid="age-input"]', '25');
    await page.selectOption('[data-testid="gender-select"]', 'other');
    await page.fill('[data-testid="location-input"]', 'San Francisco, CA');
    await page.click('[data-testid="demographics-next"]');

    // Auth step
    await expect(page.locator('[data-testid="auth-step"]')).toBeVisible();
    await page.click('[data-testid="auth-next"]');

    // Profile step
    await expect(page.locator('[data-testid="profile-step"]')).toBeVisible();
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.click('[data-testid="profile-next"]');

    // Complete step
    await expect(page.locator('[data-testid="complete-step"]')).toBeVisible();
    await page.click('[data-testid="complete-finish"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should handle onboarding with existing user', async ({ page }) => {
    // Mock existing user
    await page.route('**/api/auth/login', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 'user-123', email: 'test@example.com' },
          requiresOnboarding: true,
        }),
      });
    });

    // Navigate to onboarding
    await page.goto('/onboarding');

    // Should start onboarding flow
    await expect(page.locator('[data-testid="onboarding-flow"]')).toBeVisible();
    await expect(page.locator('[data-testid="welcome-step"]')).toBeVisible();
  });

  test('should handle onboarding completion error', async ({ page }) => {
    // Mock completion error
    await page.route('**/api/onboarding/complete', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Failed to complete onboarding' }),
      });
    });

    // Navigate to onboarding
    await page.goto('/onboarding');

    // Complete all steps
    await page.click('[data-testid="welcome-next"]');
    await page.click('[data-testid="privacy-next"]');
    await page.fill('[data-testid="age-input"]', '25');
    await page.selectOption('[data-testid="gender-select"]', 'other');
    await page.fill('[data-testid="location-input"]', 'San Francisco, CA');
    await page.click('[data-testid="demographics-next"]');
    await page.click('[data-testid="auth-next"]');
    await page.fill('[data-testid="username-input"]', 'testuser');
    await page.click('[data-testid="profile-next"]');

    // Try to complete
    await page.click('[data-testid="complete-finish"]');

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });
});
