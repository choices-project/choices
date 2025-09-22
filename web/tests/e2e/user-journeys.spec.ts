/**
 * User Journey E2E Tests - V2 Upgrade
 * 
 * Tests complete user workflows from registration to voting using V2 mock factory
 * for test data setup and improved test patterns.
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

test.describe('User Journeys - V2', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
    poll: ReturnType<typeof createTestPoll>;
  };

  test.beforeEach(async ({ page }) => {
    // Create test data using V2 patterns
    testData = {
      user: createTestUser(),
      poll: createTestPoll({
        title: 'V2 User Journey Test Poll',
        description: 'Testing complete user journey with V2 mock factory setup',
        options: ['Option 1', 'Option 2', 'Option 3', 'Option 4']
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

  test('should complete new user onboarding journey with V2 setup', async ({ page }) => {
    // Step 1: Landing page
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1:has-text("Choices")')).toBeVisible();
    
    // Step 2: Click sign up
    await page.click('[data-testid="sign-up-button"]');
    await page.waitForURL('/register');
    
    // Step 3: Wait for form hydration
    await page.waitForSelector('[data-testid="register-hydrated"]', { state: 'attached' });
    await expect(page.locator('[data-testid="register-hydrated"]')).toHaveText('1');
    
    // Step 4: Select password registration method (since WebAuthn is now default)
    await page.click('button:has-text("Password Account")');
    await page.waitForTimeout(500); // Wait for form to render
    
    // Step 5: Fill registration form with V2 test data
    console.log('V2 Test user data:', testData.user);
    await page.fill('[data-testid="email"]', testData.user.email);
    await page.fill('[data-testid="username"]', testData.user.username);
    await page.fill('[data-testid="password"]', testData.user.password);
    await page.fill('[data-testid="confirm-password"]', testData.user.password);
    
    // Step 6: Submit registration
    await page.click('[data-testid="register-button"]');
    
    // Step 7: Wait for successful navigation to onboarding
    await page.waitForURL('/onboarding*');
    
    // Step 8: Verify we're on the enhanced onboarding page
    await expect(page).toHaveURL(/\/onboarding/);
    await expect(page.locator('[data-testid="welcome-step"]')).toBeVisible();
  });

  test('should complete poll creation and voting journey with V2 setup', async ({ page }) => {
    // Set up test data for this journey
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Capture console logs
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    // Step 1: Register user
    await page.click('[data-testid="sign-up-button"]');
    await page.waitForURL('/register');
    
    // Wait for form hydration
    await page.waitForSelector('[data-testid="register-hydrated"]', { state: 'attached' });
    await expect(page.locator('[data-testid="register-hydrated"]')).toHaveText('1');
    
    // Select password registration method
    await page.click('button:has-text("Password Account")');
    await page.waitForTimeout(500);
    
    await page.fill('[data-testid="email"]', testData.user.email);
    await page.fill('[data-testid="username"]', testData.user.username);
    await page.fill('[data-testid="password"]', testData.user.password);
    await page.fill('[data-testid="confirm-password"]', testData.user.password);
    
    await page.click('[data-testid="register-button"]');
    await page.waitForURL('/onboarding*');
    
    // Step 2: Complete enhanced onboarding (9 steps)
    await page.click('[data-testid="welcome-next"]');
    await page.click('[data-testid="privacy-next"]');
    await page.click('[data-testid="tour-next"]');
    await page.click('[data-testid="data-usage-next"]');
    await page.click('[data-testid="auth-next"]');
    await page.click('[data-testid="profile-next"]');
    await page.click('[data-testid="interests-next"]');
    await page.click('[data-testid="experience-next"]');
    
    // Use App Router-aware assertions for the final step
    await Promise.all([
      page.waitForURL('**/dashboard', { waitUntil: 'commit' }),
      page.click('[data-testid="complete-onboarding"]'),
    ]);
    
    await expect(page).toHaveURL(/\/dashboard$/);
    
    // Step 3: Navigate to polls
    await page.click('[data-testid="polls-nav"]');
    await page.waitForURL('/polls');
    
    // Step 4: Create a poll using V2 test data
    await page.click('[data-testid="create-poll-button"]');
    await page.waitForURL('/polls/create');
    
    // Step 5: Fill poll form with V2 test data
    await page.fill('[data-testid="poll-create-title"]', testData.poll.title);
    await page.fill('[data-testid="poll-create-description"]', testData.poll.description);
    await page.selectOption('[data-testid="poll-create-voting-method"]', 'single');
    await page.fill('[data-testid="poll-create-option-input-1"]', testData.poll.options[0]);
    await page.fill('[data-testid="poll-create-option-input-2"]', testData.poll.options[1]);
    
    // Step 6: Submit poll
    await page.click('[data-testid="poll-create-submit"]');
    await page.waitForURL(/\/polls\/[a-f0-9-]+/);
    
    // Step 7: Verify poll was created with V2 test data
    await expect(page.locator('[data-testid="poll-title"]')).toHaveText(testData.poll.title);
    await expect(page.locator(`text=${testData.poll.options[0]}`)).toBeVisible();
    await expect(page.locator(`text=${testData.poll.options[1]}`)).toBeVisible();
    
    // Step 8: Vote on the poll
    await page.click('[data-testid="vote-button"]');
    await page.waitForTimeout(1000);
    
    // Step 9: Verify vote was recorded
    await expect(page.locator('[data-testid="vote-count"]')).toContainText('1');
    await expect(page.locator('[data-testid="poll-results"]')).toBeVisible();

    // Log console output for debugging
    console.log('V2 Console logs during test:', consoleLogs);
  });

  test('should complete WebAuthn authentication journey with V2 setup', async ({ page }) => {
    // Set up test data for WebAuthn journey
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Step 1: Register with regular authentication first
    await page.click('[data-testid="sign-up-button"]');
    await page.waitForURL('/register');
    
    // Wait for form hydration
    await page.waitForSelector('[data-testid="register-hydrated"]', { state: 'attached' });
    await expect(page.locator('[data-testid="register-hydrated"]')).toHaveText('1');
    
    await page.fill('[data-testid="email"]', testData.user.email);
    await page.fill('[data-testid="username"]', testData.user.username);
    await page.fill('[data-testid="password"]', testData.user.password);
    await page.fill('[data-testid="confirm-password"]', testData.user.password);
    
    await page.click('[data-testid="register-button"]');
    await page.waitForURL('/onboarding*');
    
    // Step 2: Complete enhanced onboarding (9 steps)
    await page.click('[data-testid="welcome-next"]');
    await page.click('[data-testid="privacy-next"]');
    await page.click('[data-testid="tour-next"]');
    await page.click('[data-testid="data-usage-next"]');
    await page.click('[data-testid="auth-next"]');
    await page.click('[data-testid="profile-next"]');
    await page.click('[data-testid="interests-next"]');
    await page.click('[data-testid="experience-next"]');
    
    // Use App Router-aware assertions for the final step
    await Promise.all([
      page.waitForURL('**/dashboard', { waitUntil: 'commit' }),
      page.click('[data-testid="complete-onboarding"]'),
    ]);
    
    await expect(page).toHaveURL(/\/dashboard$/);
    
    // Step 3: Navigate to profile to set up WebAuthn
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="profile-link"]');
    await page.waitForURL('/profile');
    
    // Step 4: Set up biometric authentication
    await page.click('[data-testid="biometric-setup-button"]');
    await page.waitForURL('/profile/biometric-setup');
    
    // Step 5: Register biometric credential
    await page.click('[data-testid="webauthn-register"]');
    
    // Note: In a real test environment, this would require actual biometric interaction
    // For now, we just verify the UI is present
    await expect(page.locator('[data-testid="webauthn-prompt"]')).toBeVisible();
    
    // Step 6: Logout
    await page.click('[data-testid="logout-button"]');
    await page.waitForURL('/');
    
    // Step 7: Login with biometric
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/login');
    
    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.click('[data-testid="webauthn-login"]');
    
    // Verify biometric prompt is shown
    await expect(page.locator('[data-testid="webauthn-auth-prompt"]')).toBeVisible();
  });

  test('should complete PWA installation journey with V2 setup', async ({ page }) => {
    // Set up test data for PWA journey
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Step 1: Register and login
    await page.click('[data-testid="sign-up-button"]');
    await page.waitForURL('/register');
    
    // Wait for form hydration
    await page.waitForSelector('[data-testid="register-hydrated"]', { state: 'attached' });
    await expect(page.locator('[data-testid="register-hydrated"]')).toHaveText('1');
    
    await page.fill('[data-testid="email"]', testData.user.email);
    await page.fill('[data-testid="username"]', testData.user.username);
    await page.fill('[data-testid="password"]', testData.user.password);
    await page.fill('[data-testid="confirm-password"]', testData.user.password);
    
    await page.click('[data-testid="register-button"]');
    await page.waitForURL('/onboarding*');
    
    // Step 2: Complete enhanced onboarding (9 steps)
    await page.click('[data-testid="welcome-next"]');
    await page.click('[data-testid="privacy-next"]');
    await page.click('[data-testid="tour-next"]');
    await page.click('[data-testid="data-usage-next"]');
    await page.click('[data-testid="auth-next"]');
    await page.click('[data-testid="profile-next"]');
    await page.click('[data-testid="interests-next"]');
    await page.click('[data-testid="experience-next"]');
    
    // Use App Router-aware assertions for the final step
    await Promise.all([
      page.waitForURL('**/dashboard', { waitUntil: 'commit' }),
      page.click('[data-testid="complete-onboarding"]'),
    ]);
    
    await expect(page).toHaveURL(/\/dashboard$/);
    
    // Step 3: Check PWA status
    await expect(page.locator('[data-testid="pwa-status"]')).toBeVisible();
    
    // Step 4: Mock installation prompt
    await page.evaluate(() => {
      const event = new Event('beforeinstallprompt');
      (event as any).prompt = () => Promise.resolve();
      (event as any).userChoice = Promise.resolve({ outcome: 'accepted' });
      window.dispatchEvent(event);
    });
    
    // Step 5: Verify installation prompt appears
    await expect(page.locator('[data-testid="pwa-install-prompt"]')).toBeVisible();
    
    // Step 6: Accept installation
    await page.click('[data-testid="pwa-install-button"]');
    await page.waitForTimeout(1000);
    
    // Step 7: Verify PWA is installed
    await expect(page.locator('[data-testid="pwa-install-prompt"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="pwa-installed-status"]')).toBeVisible();
  });

  test('should complete admin user journey with V2 setup', async ({ page }) => {
    // Create admin user with V2 setup
    const adminUser = createTestUser({
      email: 'admin@example.com',
      username: 'admin'
    });

    // Set up admin test data
    await setupE2ETestData({
      user: adminUser,
      poll: testData.poll
    });

    // Step 1: Register as admin user
    await page.click('[data-testid="sign-up-button"]');
    await page.waitForURL('/register');
    
    // Wait for form hydration
    await page.waitForSelector('[data-testid="register-hydrated"]', { state: 'attached' });
    await expect(page.locator('[data-testid="register-hydrated"]')).toHaveText('1');
    
    await page.fill('[data-testid="email"]', adminUser.email);
    await page.fill('[data-testid="username"]', adminUser.username);
    await page.fill('[data-testid="password"]', adminUser.password);
    await page.fill('[data-testid="confirm-password"]', adminUser.password);
    
    await page.click('[data-testid="register-button"]');
    await page.waitForURL('/onboarding*');
    
    // Step 2: Complete enhanced onboarding (9 steps)
    await page.click('[data-testid="welcome-next"]');
    await page.click('[data-testid="privacy-next"]');
    await page.click('[data-testid="tour-next"]');
    await page.click('[data-testid="data-usage-next"]');
    await page.click('[data-testid="auth-next"]');
    await page.click('[data-testid="profile-next"]');
    await page.click('[data-testid="interests-next"]');
    await page.click('[data-testid="experience-next"]');
    
    // Use App Router-aware assertions for the final step
    await Promise.all([
      page.waitForURL('**/dashboard', { waitUntil: 'commit' }),
      page.click('[data-testid="complete-onboarding"]'),
    ]);
    
    await expect(page).toHaveURL(/\/dashboard$/);
    
    // Step 3: Try to access admin page (should be denied for regular users)
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    
    // Step 4: Should show access denied or redirect to login
    // (depending on authentication state)
    const isAccessDenied = await page.locator('text=Access Denied').count();
    const isLoginPage = await page.locator('text=Sign in to your account').count();
    
    expect(isAccessDenied > 0 || isLoginPage > 0).toBe(true);
  });

  test('should complete error recovery journey with V2 setup', async ({ page }) => {
    // Step 1: Try to access protected route without authentication
    await page.goto('/dashboard');
    
    // Step 2: Should either redirect to login or show dashboard (depending on auth state)
    await page.waitForLoadState('networkidle');
    
    // Step 3: If we're on dashboard, logout first; if on login, try invalid login
    const currentUrl = page.url();
    if (currentUrl.includes('/dashboard')) {
      // We're already logged in, logout first
      await page.click('[data-testid="logout-button"]');
      await page.waitForURL('/');
      await page.goto('/login');
    }
    
    // Step 4: Try invalid login
    await page.fill('[data-testid="login-email"]', 'invalid@example.com');
    await page.fill('[data-testid="login-password"]', 'wrongpassword');
    await page.click('[data-testid="login-submit"]');
    
    // Step 5: Verify error message
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
    
    // Step 6: Register a new user to test recovery with V2 setup
    await page.click('[data-testid="sign-up-button"]');
    await page.waitForURL('/register');
    
    // Wait for form hydration
    await page.waitForSelector('[data-testid="register-hydrated"]', { state: 'attached' });
    await expect(page.locator('[data-testid="register-hydrated"]')).toHaveText('1');
    
    await page.fill('[data-testid="email"]', testData.user.email);
    await page.fill('[data-testid="username"]', testData.user.username);
    await page.fill('[data-testid="password"]', testData.user.password);
    await page.fill('[data-testid="confirm-password"]', testData.user.password);
    
    await page.click('[data-testid="register-button"]');
    
    // Step 7: Verify successful registration and navigation
    await page.waitForURL('/onboarding*');
    await expect(page).toHaveURL(/\/onboarding/);
  });

  test('should complete cross-device synchronization journey with V2 setup', async ({ page, browser }) => {
    // Set up test data for cross-device journey
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Step 1: Register on first device
    await page.click('[data-testid="sign-up-button"]');
    await page.waitForURL('/register');
    
    // Wait for form hydration
    await page.waitForSelector('[data-testid="register-hydrated"]', { state: 'attached' });
    await expect(page.locator('[data-testid="register-hydrated"]')).toHaveText('1');
    
    await page.fill('[data-testid="email"]', testData.user.email);
    await page.fill('[data-testid="username"]', testData.user.username);
    await page.fill('[data-testid="password"]', testData.user.password);
    await page.fill('[data-testid="confirm-password"]', testData.user.password);
    
    await page.click('[data-testid="register-button"]');
    await page.waitForURL('/onboarding*');
    
    // Step 2: Complete enhanced onboarding (9 steps)
    await page.click('[data-testid="welcome-next"]');
    await page.click('[data-testid="privacy-next"]');
    await page.click('[data-testid="tour-next"]');
    await page.click('[data-testid="data-usage-next"]');
    await page.click('[data-testid="auth-next"]');
    await page.click('[data-testid="profile-next"]');
    await page.click('[data-testid="interests-next"]');
    await page.click('[data-testid="experience-next"]');
    
    // Use App Router-aware assertions for the final step
    await Promise.all([
      page.waitForURL('**/dashboard', { waitUntil: 'commit' }),
      page.click('[data-testid="complete-onboarding"]'),
    ]);
    
    await expect(page).toHaveURL(/\/dashboard$/);
    
    // Step 3: Create a poll on first device using V2 test data
    await page.click('[data-testid="polls-nav"]');
    await page.waitForURL('/polls');
    
    await page.click('[data-testid="create-poll-button"]');
    await page.waitForURL('/polls/create');
    
    await page.fill('[data-testid="poll-create-title"]', testData.poll.title);
    await page.fill('[data-testid="poll-create-option-input-0"]', testData.poll.options[0]);
    await page.fill('[data-testid="poll-create-option-input-1"]', testData.poll.options[1]);
    
    await page.click('[data-testid="poll-create-submit"]');
    await page.waitForURL(/\/polls\/[a-f0-9-]+/);
    
    // Step 4: Open second browser context (simulating second device)
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    
    // Step 5: Login on second device
    await page2.goto('/login');
    await page2.fill('[data-testid="login-email"]', testData.user.email);
    await page2.fill('[data-testid="login-password"]', testData.user.password);
    await page2.click('[data-testid="login-submit"]');
    await page2.waitForURL('/dashboard');
    
    // Step 6: Verify poll is visible on second device
    await page2.click('[data-testid="polls-nav"]');
    await page2.waitForURL('/polls');
    await expect(page2.locator(`text=${testData.poll.title}`)).toBeVisible();
    
    // Step 7: Vote on second device
    await page2.click(`text=${testData.poll.title}`);
    await page2.waitForURL(/\/polls\/[a-f0-9-]+/);
    await page2.click('[data-testid="vote-button"]');
    await page2.waitForTimeout(1000);
    
    // Step 8: Verify vote is reflected on first device
    await page.reload();
    await expect(page.locator('[data-testid="vote-count"]')).toContainText('1');
    
    // Cleanup
    await context2.close();
  });

  test('should complete offline functionality journey with V2 setup', async ({ page }) => {
    // Set up test data for offline journey
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Step 1: Register and login
    await page.click('[data-testid="sign-up-button"]');
    await page.waitForURL('/register');
    
    // Wait for form hydration
    await page.waitForSelector('[data-testid="register-hydrated"]', { state: 'attached' });
    await expect(page.locator('[data-testid="register-hydrated"]')).toHaveText('1');
    
    await page.fill('[data-testid="email"]', testData.user.email);
    await page.fill('[data-testid="username"]', testData.user.username);
    await page.fill('[data-testid="password"]', testData.user.password);
    await page.fill('[data-testid="confirm-password"]', testData.user.password);
    
    await page.click('[data-testid="register-button"]');
    await page.waitForURL('/onboarding*');
    
    // Step 2: Complete enhanced onboarding (9 steps)
    await page.click('[data-testid="welcome-next"]');
    await page.click('[data-testid="privacy-next"]');
    await page.click('[data-testid="tour-next"]');
    await page.click('[data-testid="data-usage-next"]');
    await page.click('[data-testid="auth-next"]');
    await page.click('[data-testid="profile-next"]');
    await page.click('[data-testid="interests-next"]');
    await page.click('[data-testid="experience-next"]');
    
    // Use App Router-aware assertions for the final step
    await Promise.all([
      page.waitForURL('**/dashboard', { waitUntil: 'commit' }),
      page.click('[data-testid="complete-onboarding"]'),
    ]);
    
    await expect(page).toHaveURL(/\/dashboard$/);
    
    // Step 3: Go offline
    await page.context().setOffline(true);
    
    // Step 4: Verify offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    
    // Step 5: Try to create a poll (should be queued)
    await page.click('[data-testid="create-poll-button"]');
    await page.waitForURL('/polls/create');
    
    await page.fill('[data-testid="poll-create-title"]', 'Offline test poll');
    await page.fill('[data-testid="poll-create-option-input-0"]', 'Option 1');
    await page.fill('[data-testid="poll-create-option-input-1"]', 'Option 2');
    
    await page.click('[data-testid="poll-create-submit"]');
    
    // Step 6: Verify offline queue
    await expect(page.locator('[data-testid="offline-queue"]')).toBeVisible();
    
    // Step 7: Go back online
    await page.context().setOffline(false);
    
    // Step 8: Verify sync
    await page.waitForTimeout(2000);
    await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="offline-queue"]')).not.toBeVisible();
  });
});
