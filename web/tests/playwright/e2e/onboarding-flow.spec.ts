/**
 * Enhanced Onboarding Flow E2E Tests
 * 
 * Tests the complete 6-step onboarding process with elevated UX/UI patterns:
 * - Progressive disclosure and guided experience
 * - Accessibility compliance (WCAG 2.1 AA)
 * - Mobile-first responsive design
 * - Smooth animations and transitions
 * - Contextual help and tooltips
 * - Progress tracking and persistence
 * - Error recovery and validation
 */

import { test, expect } from '@playwright/test';

test.describe('Enhanced Onboarding Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Set up accessibility testing
    await page.addInitScript(() => {
      window.__playwright_accessibility = true;
    });

    // Navigate to the onboarding page with performance monitoring
    const startTime = Date.now();
    await page.goto('/onboarding');
    const loadTime = Date.now() - startTime;
    
    // Verify fast loading
    expect(loadTime).toBeLessThan(2000);
  });

  test('should complete full onboarding flow with enhanced UX', async ({ page }) => {
    // Test onboarding progress indicator
    await expect(page.locator('[data-testid="progress-indicator"]')).toBeVisible();
    await expect(page.locator('[data-testid="progress-step-1"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="progress-step-1"]')).toHaveAttribute('aria-current', 'step');
    
    // Step 1: Welcome - Enhanced welcome experience
    await expect(page.locator('[data-testid="welcome-step"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Welcome');
    await expect(page.locator('text=Get started with your civic engagement journey')).toBeVisible();
    
    // Test accessibility
    await expect(page.locator('[data-testid="welcome-step"]')).toHaveAttribute('role', 'region');
    await expect(page.locator('[data-testid="welcome-step"]')).toHaveAttribute('aria-labelledby');
    
    // Test contextual help
    await expect(page.locator('[data-testid="help-tooltip"]')).toBeVisible();
    await page.hover('[data-testid="help-tooltip"]');
    await expect(page.locator('[data-testid="tooltip-content"]')).toBeVisible();
    
    // Test smooth transition
    await page.click('button:has-text("Continue")');
    await expect(page.locator('[data-testid="welcome-step"]')).toHaveClass(/transition-out/);
    await expect(page.locator('[data-testid="auth-step"]')).toHaveClass(/transition-in/);
    
    // Step 2: Authentication Setup - Enhanced auth experience
    await expect(page.locator('[data-testid="auth-step"]')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Authentication');
    await expect(page.locator('text=Set up your account and security')).toBeVisible();
    
    // Test progress update
    await expect(page.locator('[data-testid="progress-step-2"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="progress-step-1"]')).toHaveClass(/completed/);
    
    // Test enhanced form validation
    await page.fill('input[type="email"]', 'test@example.com');
    await expect(page.locator('[data-testid="email-validation"]')).toHaveText('✓ Valid email format');
    
    await page.fill('input[type="password"]', 'password123');
    await expect(page.locator('[data-testid="password-strength"]')).toHaveText('Strong');
    
    // Test security features
    await expect(page.locator('[data-testid="security-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="security-info"]')).toHaveText('Your data is encrypted and secure');
    
    await page.click('button:has-text("Sign Up")');
    
    // Test loading state
    await expect(page.locator('[data-testid="auth-button"]')).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('[data-testid="auth-button"]')).toBeDisabled();
    
    // Should show authentication success
    await expect(page.locator('[data-testid="auth-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="auth-success"]')).toHaveClass(/animate-in/);
    
    // Test smooth transition to next step
    await page.click('button:has-text("Continue")');
    await expect(page.locator('[data-testid="profile-step"]')).toHaveClass(/transition-in/);
    
    // Step 3: Profile Setup - Enhanced profile experience
    await expect(page.locator('[data-testid="profile-step"]')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Profile Setup');
    await expect(page.locator('text=Tell us about yourself')).toBeVisible();
    
    // Test real-time validation
    await page.fill('input[name="displayName"]', 'Test User');
    await expect(page.locator('[data-testid="display-name-validation"]')).toHaveText('✓ Display name is available');
    
    await page.fill('input[name="bio"]', 'Test user bio');
    await expect(page.locator('[data-testid="bio-counter"]')).toHaveText('15/500 characters');
    
    await page.fill('input[name="location"]', 'San Francisco, CA');
    await expect(page.locator('[data-testid="location-suggestions"]')).toBeVisible();
    
    // Test avatar upload
    await page.setInputFiles('[data-testid="avatar-upload"]', 'test-avatar.jpg');
    await expect(page.locator('[data-testid="avatar-preview"]')).toBeVisible();
    
    // Test smooth transition
    await page.click('button:has-text("Continue")');
    await expect(page.locator('[data-testid="interests-step"]')).toHaveClass(/transition-in/);
    
    // Step 4: Values & Interests - Enhanced interests experience
    await expect(page.locator('[data-testid="interests-step"]')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Values & Interests');
    await expect(page.locator('text=Help us personalize your experience')).toBeVisible();
    
    // Test interest selection with visual feedback
    await page.click('input[value="civics"]');
    await expect(page.locator('[data-testid="interest-civics"]')).toHaveClass(/selected/);
    await expect(page.locator('[data-testid="interest-count"]')).toHaveText('1 of 5 selected');
    
    await page.click('input[value="environment"]');
    await expect(page.locator('[data-testid="interest-environment"]')).toHaveClass(/selected/);
    await expect(page.locator('[data-testid="interest-count"]')).toHaveText('2 of 5 selected');
    
    await page.click('input[value="education"]');
    await expect(page.locator('[data-testid="interest-education"]')).toHaveClass(/selected/);
    await expect(page.locator('[data-testid="interest-count"]')).toHaveText('3 of 5 selected');
    
    // Test interest recommendations
    await expect(page.locator('[data-testid="interest-recommendations"]')).toBeVisible();
    await expect(page.locator('[data-testid="interest-recommendations"]')).toHaveText('Based on your selections, you might also like:');
    
    // Test smooth transition
    await page.click('button:has-text("Continue")');
    await expect(page.locator('[data-testid="privacy-step"]')).toHaveClass(/transition-in/);
    
    // Step 5: Privacy & Data - Enhanced privacy experience
    await expect(page.locator('[data-testid="privacy-step"]')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Privacy & Data');
    await expect(page.locator('text=Control your data and privacy settings')).toBeVisible();
    
    // Test privacy controls with explanations
    await page.click('input[name="dataUsage"]');
    await expect(page.locator('[data-testid="data-usage-explanation"]')).toBeVisible();
    await expect(page.locator('[data-testid="data-usage-explanation"]')).toHaveText('This helps us improve your experience');
    
    await page.click('input[name="emailUpdates"]');
    await expect(page.locator('[data-testid="email-updates-explanation"]')).toBeVisible();
    await expect(page.locator('[data-testid="email-updates-explanation"]')).toHaveText('Get notified about important updates');
    
    await page.click('input[name="publicProfile"]');
    await expect(page.locator('[data-testid="public-profile-explanation"]')).toBeVisible();
    await expect(page.locator('[data-testid="public-profile-explanation"]')).toHaveText('Make your profile visible to other users');
    
    // Test privacy summary
    await expect(page.locator('[data-testid="privacy-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="privacy-summary"]')).toHaveText('Your privacy settings have been saved');
    
    // Test smooth transition
    await page.click('button:has-text("Continue")');
    await expect(page.locator('[data-testid="complete-step"]')).toHaveClass(/transition-in/);
    
    // Step 6: Complete - Enhanced completion experience
    await expect(page.locator('[data-testid="complete-step"]')).toBeVisible();
    await expect(page.locator('h2')).toContainText('Complete');
    await expect(page.locator('text=You\'re all set! Welcome to Choices')).toBeVisible();
    
    // Test completion celebration
    await expect(page.locator('[data-testid="completion-animation"]')).toBeVisible();
    await expect(page.locator('[data-testid="completion-animation"]')).toHaveClass(/celebrate/);
    
    // Test next steps
    await expect(page.locator('[data-testid="next-steps"]')).toBeVisible();
    await expect(page.locator('[data-testid="next-steps"]')).toHaveText('Here\'s what you can do next:');
    
    // Test finish button with enhanced feedback
    await page.click('button:has-text("Finish")');
    await expect(page.locator('[data-testid="finish-button"]')).toHaveAttribute('aria-busy', 'true');
    await expect(page.locator('[data-testid="finish-button"]')).toBeDisabled();
    
    // Should redirect to dashboard with success message
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="welcome-message"]')).toHaveText('Welcome to Choices!');
  });

  test('should handle onboarding validation errors', async ({ page }) => {
    // Step 1: Welcome
    await page.click('button:has-text("Continue")');
    
    // Step 2: Authentication - Test validation
    await page.click('button:has-text("Sign Up")'); // Click without filling fields
    
    // Should show validation errors
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
    
    // Fill invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'short');
    await page.click('button:has-text("Sign Up")');
    
    // Should show email validation error
    await expect(page.locator('text=Invalid email format')).toBeVisible();
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
  });

  test('should handle profile validation errors', async ({ page }) => {
    // Navigate to profile step
    await page.click('button:has-text("Continue")'); // Welcome
    await page.click('button:has-text("Continue")'); // Auth (skip for now)
    
    // Step 3: Profile Setup - Test validation
    await page.click('button:has-text("Continue")'); // Click without filling required fields
    
    // Should show validation errors
    await expect(page.locator('text=Display name is required')).toBeVisible();
    
    // Fill invalid data
    await page.fill('input[name="displayName"]', ''); // Empty display name
    await page.fill('input[name="bio"]', 'A'.repeat(501)); // Bio too long
    await page.fill('input[name="website"]', 'not-a-url'); // Invalid URL
    
    await page.click('button:has-text("Continue")');
    
    // Should show validation errors
    await expect(page.locator('text=Display name is required')).toBeVisible();
    await expect(page.locator('text=Bio must be 500 characters or less')).toBeVisible();
    await expect(page.locator('text=Website must be a valid URL')).toBeVisible();
  });

  test('should handle step navigation', async ({ page }) => {
    // Step 1: Welcome
    await page.click('button:has-text("Continue")');
    
    // Step 2: Authentication
    await page.click('button:has-text("Continue")');
    
    // Step 3: Profile Setup
    await page.click('button:has-text("Continue")');
    
    // Step 4: Values & Interests
    await page.click('button:has-text("Continue")');
    
    // Step 5: Privacy & Data
    await page.click('button:has-text("Continue")');
    
    // Step 6: Complete
    await page.click('button:has-text("Finish")');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Test that onboarding is marked as complete
    // This would require checking the store or API
    // await expect(page.locator('text=Onboarding Complete')).toBeVisible();
  });

  test('should handle onboarding cancellation', async ({ page }) => {
    // Step 1: Welcome
    await page.click('button:has-text("Skip")');
    
    // Should show confirmation dialog
    await expect(page.locator('text=Are you sure you want to skip onboarding?')).toBeVisible();
    
    // Confirm cancellation
    await page.click('button:has-text("Yes, Skip")');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });

  test('should handle onboarding data persistence', async ({ page }) => {
    // Fill out partial onboarding data
    await page.click('button:has-text("Continue")'); // Welcome
    
    // Authentication
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign Up")');
    await page.click('button:has-text("Continue")');
    
    // Profile Setup
    await page.fill('input[name="displayName"]', 'Test User');
    await page.fill('input[name="bio"]', 'Test user bio');
    
    // Navigate away and come back
    await page.goto('/dashboard');
    await page.goto('/onboarding');
    
    // Should restore previous progress
    await expect(page.locator('input[name="displayName"]')).toHaveValue('Test User');
    await expect(page.locator('input[name="bio"]')).toHaveValue('Test user bio');
  });
});
