/**
 * User Journey E2E Tests
 * 
 * Tests complete user workflows from registration to voting.
 * This ensures the entire user experience works end-to-end.
 */

import { test, expect } from '@playwright/test';

test.describe('User Journeys', () => {
  let testUser: { email: string; username: string; password: string };

  test.beforeEach(async ({ page }) => {
    // Set up test data
    testUser = {
      email: `test-${Date.now()}@example.com`,
      username: `testuser-${Date.now()}`,
      password: 'password123'
    };

    // Navigate to the app
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should complete new user onboarding journey', async ({ page }) => {
    // Step 1: Landing page
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Choices')).toBeVisible();
    
    // Step 2: Click sign up
    await page.click('[data-testid="sign-up-button"]');
    await page.waitForURL('/register');
    
    // Step 3: Fill registration form
    await page.fill('[data-testid="email"]', testUser.email);
    await page.fill('[data-testid="username"]', testUser.username);
    await page.fill('[data-testid="password"]', testUser.password);
    await page.fill('[data-testid="confirm-password"]', testUser.password);
    
    // Step 4: Submit registration
    await page.click('[data-testid="register-submit"]');
    await page.waitForURL('/onboarding');
    
    // Step 5: Complete onboarding
    await expect(page.locator('text=Welcome to Choices')).toBeVisible();
    await page.click('[data-testid="complete-onboarding"]');
    await page.waitForURL('/dashboard');
    
    // Step 6: Verify dashboard access
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
  });

  test('should complete poll creation and voting journey', async ({ page }) => {
    // Step 1: Register and login
    await page.click('[data-testid="sign-up-button"]');
    await page.waitForURL('/register');
    
    await page.fill('[data-testid="email"]', testUser.email);
    await page.fill('[data-testid="username"]', testUser.username);
    await page.fill('[data-testid="password"]', testUser.password);
    await page.fill('[data-testid="confirm-password"]', testUser.password);
    
    await page.click('[data-testid="register-submit"]');
    await page.waitForURL('/onboarding');
    
    await page.click('[data-testid="complete-onboarding"]');
    await page.waitForURL('/dashboard');
    
    // Step 2: Navigate to polls
    await page.click('[data-testid="polls-nav"]');
    await page.waitForURL('/polls');
    
    // Step 3: Create a new poll
    await page.click('[data-testid="create-poll-button"]');
    await page.waitForURL('/polls/create');
    
    // Step 4: Fill poll form
    await page.fill('[data-testid="poll-create-title"]', 'What should be our top priority?');
    await page.fill('[data-testid="poll-create-description"]', 'Help us decide what to focus on next.');
    await page.fill('[data-testid="poll-create-option-input-0"]', 'Climate Action');
    await page.fill('[data-testid="poll-create-option-input-1"]', 'Economic Growth');
    await page.fill('[data-testid="poll-create-option-input-2"]', 'Social Justice');
    
    // Step 5: Submit poll
    await page.click('[data-testid="poll-create-submit"]');
    await page.waitForURL(/\/polls\/[a-f0-9-]+/);
    
    // Step 6: Verify poll was created
    await expect(page.locator('[data-testid="poll-title"]')).toHaveText('What should be our top priority?');
    await expect(page.locator('text=Climate Action')).toBeVisible();
    await expect(page.locator('text=Economic Growth')).toBeVisible();
    await expect(page.locator('text=Social Justice')).toBeVisible();
    
    // Step 7: Vote on the poll
    await page.click('[data-testid="vote-button"]');
    await page.waitForTimeout(1000);
    
    // Step 8: Verify vote was recorded
    await expect(page.locator('[data-testid="vote-count"]')).toContainText('1');
    await expect(page.locator('[data-testid="poll-results"]')).toBeVisible();
  });

  test('should complete WebAuthn authentication journey', async ({ page }) => {
    // Step 1: Register with regular authentication
    await page.click('[data-testid="sign-up-button"]');
    await page.waitForURL('/register');
    
    await page.fill('[data-testid="email"]', testUser.email);
    await page.fill('[data-testid="username"]', testUser.username);
    await page.fill('[data-testid="password"]', testUser.password);
    await page.fill('[data-testid="confirm-password"]', testUser.password);
    
    await page.click('[data-testid="register-submit"]');
    await page.waitForURL('/onboarding');
    
    await page.click('[data-testid="complete-onboarding"]');
    await page.waitForURL('/dashboard');
    
    // Step 2: Navigate to profile
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="profile-link"]');
    await page.waitForURL('/profile');
    
    // Step 3: Set up biometric authentication
    await page.click('[data-testid="biometric-setup-button"]');
    await page.waitForURL('/profile/biometric-setup');
    
    // Step 4: Register biometric credential
    await page.click('[data-testid="webauthn-register"]');
    
    // Note: In a real test environment, this would require actual biometric interaction
    // For now, we just verify the UI is present
    await expect(page.locator('[data-testid="webauthn-prompt"]')).toBeVisible();
    
    // Step 5: Logout
    await page.click('[data-testid="logout-button"]');
    await page.waitForURL('/');
    
    // Step 6: Login with biometric
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/login');
    
    await page.fill('[data-testid="login-email"]', testUser.email);
    await page.click('[data-testid="webauthn-login"]');
    
    // Verify biometric prompt is shown
    await expect(page.locator('[data-testid="webauthn-auth-prompt"]')).toBeVisible();
  });

  test('should complete PWA installation journey', async ({ page }) => {
    // Step 1: Register and login
    await page.click('[data-testid="sign-up-button"]');
    await page.waitForURL('/register');
    
    await page.fill('[data-testid="email"]', testUser.email);
    await page.fill('[data-testid="username"]', testUser.username);
    await page.fill('[data-testid="password"]', testUser.password);
    await page.fill('[data-testid="confirm-password"]', testUser.password);
    
    await page.click('[data-testid="register-submit"]');
    await page.waitForURL('/onboarding');
    
    await page.click('[data-testid="complete-onboarding"]');
    await page.waitForURL('/dashboard');
    
    // Step 2: Check PWA status
    await expect(page.locator('[data-testid="pwa-status"]')).toBeVisible();
    
    // Step 3: Mock installation prompt
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt');
      (event as any).prompt = () => Promise.resolve();
      (event as any).userChoice = Promise.resolve({ outcome: 'accepted' });
      window.dispatchEvent(event);
    });
    
    // Step 4: Verify installation prompt appears
    await expect(page.locator('[data-testid="pwa-install-prompt"]')).toBeVisible();
    
    // Step 5: Accept installation
    await page.click('[data-testid="pwa-install-button"]');
    await page.waitForTimeout(1000);
    
    // Step 6: Verify PWA is installed
    await expect(page.locator('[data-testid="pwa-install-prompt"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="pwa-installed-status"]')).toBeVisible();
  });

  test('should complete admin user journey', async ({ page }) => {
    // Note: This test assumes we have a way to create admin users
    // In a real scenario, this would require special test setup
    
    // Step 1: Login as admin user
    await page.goto('/login');
    await page.fill('[data-testid="login-email"]', 'admin@example.com');
    await page.fill('[data-testid="login-password"]', 'adminpassword');
    await page.click('[data-testid="login-submit"]');
    
    // Step 2: Navigate to admin dashboard
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Step 3: Verify admin access
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
    
    // Step 4: Check user management
    await page.click('[data-testid="admin-users-tab"]');
    await expect(page.locator('[data-testid="admin-user-list"]')).toBeVisible();
    
    // Step 5: Check poll management
    await page.click('[data-testid="admin-polls-tab"]');
    await expect(page.locator('[data-testid="admin-poll-list"]')).toBeVisible();
    
    // Step 6: Check system status
    await page.click('[data-testid="admin-system-tab"]');
    await expect(page.locator('[data-testid="system-status"]')).toBeVisible();
  });

  test('should complete error recovery journey', async ({ page }) => {
    // Step 1: Try to access protected route without authentication
    await page.goto('/dashboard');
    await page.waitForURL('/login');
    
    // Step 2: Try invalid login
    await page.fill('[data-testid="login-email"]', 'invalid@example.com');
    await page.fill('[data-testid="login-password"]', 'wrongpassword');
    await page.click('[data-testid="login-submit"]');
    
    // Step 3: Verify error message
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
    
    // Step 4: Recover with valid login
    await page.fill('[data-testid="login-email"]', testUser.email);
    await page.fill('[data-testid="login-password"]', testUser.password);
    await page.click('[data-testid="login-submit"]');
    
    // Step 5: Verify successful login
    await page.waitForURL('/dashboard');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should complete cross-device synchronization journey', async ({ page, browser }) => {
    // Step 1: Create a poll on first device
    await page.click('[data-testid="sign-up-button"]');
    await page.waitForURL('/register');
    
    await page.fill('[data-testid="email"]', testUser.email);
    await page.fill('[data-testid="username"]', testUser.username);
    await page.fill('[data-testid="password"]', testUser.password);
    await page.fill('[data-testid="confirm-password"]', testUser.password);
    
    await page.click('[data-testid="register-submit"]');
    await page.waitForURL('/onboarding');
    
    await page.click('[data-testid="complete-onboarding"]');
    await page.waitForURL('/dashboard');
    
    // Create a poll
    await page.click('[data-testid="create-poll-button"]');
    await page.waitForURL('/polls/create');
    
    await page.fill('[data-testid="poll-create-title"]', 'Cross-device test poll');
    await page.fill('[data-testid="poll-create-option-input-0"]', 'Option 1');
    await page.fill('[data-testid="poll-create-option-input-1"]', 'Option 2');
    
    await page.click('[data-testid="poll-create-submit"]');
    await page.waitForURL(/\/polls\/[a-f0-9-]+/);
    
    // Step 2: Open second browser context (simulating second device)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    
    // Step 3: Login on second device
    await page2.goto('/login');
    await page2.fill('[data-testid="login-email"]', testUser.email);
    await page2.fill('[data-testid="login-password"]', testUser.password);
    await page2.click('[data-testid="login-submit"]');
    await page2.waitForURL('/dashboard');
    
    // Step 4: Verify poll is visible on second device
    await page2.click('[data-testid="polls-nav"]');
    await page2.waitForURL('/polls');
    await expect(page2.locator('text=Cross-device test poll')).toBeVisible();
    
    // Step 5: Vote on second device
    await page2.click('text=Cross-device test poll');
    await page2.waitForURL(/\/polls\/[a-f0-9-]+/);
    await page2.click('[data-testid="vote-button"]');
    await page2.waitForTimeout(1000);
    
    // Step 6: Verify vote is reflected on first device
    await page.reload();
    await expect(page.locator('[data-testid="vote-count"]')).toContainText('1');
    
    // Cleanup
    await context2.close();
  });

  test('should complete offline functionality journey', async ({ page }) => {
    // Step 1: Register and login
    await page.click('[data-testid="sign-up-button"]');
    await page.waitForURL('/register');
    
    await page.fill('[data-testid="email"]', testUser.email);
    await page.fill('[data-testid="username"]', testUser.username);
    await page.fill('[data-testid="password"]', testUser.password);
    await page.fill('[data-testid="confirm-password"]', testUser.password);
    
    await page.click('[data-testid="register-submit"]');
    await page.waitForURL('/onboarding');
    
    await page.click('[data-testid="complete-onboarding"]');
    await page.waitForURL('/dashboard');
    
    // Step 2: Go offline
    await page.context().setOffline(true);
    
    // Step 3: Verify offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    
    // Step 4: Try to create a poll (should be queued)
    await page.click('[data-testid="create-poll-button"]');
    await page.waitForURL('/polls/create');
    
    await page.fill('[data-testid="poll-create-title"]', 'Offline test poll');
    await page.fill('[data-testid="poll-create-option-input-0"]', 'Option 1');
    await page.fill('[data-testid="poll-create-option-input-1"]', 'Option 2');
    
    await page.click('[data-testid="poll-create-submit"]');
    
    // Step 5: Verify offline queue
    await expect(page.locator('[data-testid="offline-queue"]')).toBeVisible();
    
    // Step 6: Go back online
    await page.context().setOffline(false);
    
    // Step 7: Verify sync
    await page.waitForTimeout(2000);
    await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="offline-queue"]')).not.toBeVisible();
  });
});
