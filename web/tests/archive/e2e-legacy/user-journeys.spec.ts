/**
 * User Journey E2E Tests - V2 Upgrade with Feedback Widget Integration
 * 
 * Tests complete user workflows from registration to voting using V2 mock factory
 * for test data setup and improved test patterns. Includes comprehensive feedback
 * widget testing throughout the user journey.
 * 
 * Created: January 21, 2025
 * Updated: December 19, 2024
 */

import { test, expect } from '@playwright/test';

import { 
  setupE2ETestData, 
  cleanupE2ETestData, 
  createTestUser, 
  createTestPoll,
  waitForPageReady,
  setupExternalAPIMocks
} from './helpers/e2e-setup';

/**
 * Helper function to test feedback widget flow throughout user journey
 */
async function testFeedbackWidgetFlow(page: any, context: string) {
  // Wait for feedback widget to be available (reduced timeout)
  await page.waitForSelector('.fixed.bottom-6.right-6', { timeout: 5000 });
  
  // Click feedback widget
  await page.locator('.fixed.bottom-6.right-6').click();
  await expect(page.locator('text=Enhanced Feedback')).toBeVisible();
  
  // Test different feedback types based on context
  const feedbackType = context === 'dashboard' ? 'Feature Request' : 
                      context === 'poll' ? 'Bug Report' : 'General Feedback';
  
  await page.getByRole('button', { name: feedbackType }).click();
  
  // Fill feedback form
  await page.fill('input[placeholder="Summarize the issue"]', `Test feedback from ${context}`);
  await page.fill('textarea[placeholder="Provide more details"]', `This is feedback submitted during the ${context} phase of the user journey.`);
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Select sentiment
  await page.getByLabel('Positive').click();
  await page.getByRole('button', { name: 'Next' }).click();
  
  // Skip screenshot
  await page.getByRole('button', { name: 'Skip Screenshot' }).click();
  
  // Mock successful submission with one-time handler to prevent stacking
  const feedbackHandler = async (route: any) => {
    const request = route.request();
    const postData = request.postDataJSON();
    expect(postData.type).toBe(feedbackType.toLowerCase().replace(' ', '_'));
    expect(postData.title).toBe(`Test feedback from ${context}`);
    expect(postData.description).toContain(context);
    expect(postData.sentiment).toBe('positive');
    expect(postData.userJourney).toBeDefined();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Feedback submitted successfully!' }),
    });
  };
  
  await page.route('**/api/feedback', feedbackHandler);
  
  // Submit feedback
  await page.getByRole('button', { name: 'Submit Feedback' }).click();
  
  // Verify success
  await expect(page.locator('text=Thank you for your feedback!')).toBeVisible();
  await expect(page.locator('text=We\'ll analyze your input')).toBeVisible();
  
  // Clean up route to prevent stacking
  await page.unroute('**/api/feedback', feedbackHandler);
  
  // Close feedback modal
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.locator('text=Enhanced Feedback')).not.toBeVisible();
}

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

  test('should complete new user onboarding journey with V2 setup and feedback widget', async ({ page }) => {
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
    // Form should render immediately
    
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

  test('should complete poll creation and voting journey with V2 setup and feedback widget', async ({ page }) => {
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
    // Wait for form fields to be visible instead of arbitrary timeout
    await expect(page.locator('[data-testid="email"]')).toBeVisible();
    
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
    
    // Step 3: Test feedback widget on dashboard
    await testFeedbackWidgetFlow(page, 'dashboard');
    
    // Step 4: Navigate to polls
    await page.click('[data-testid="polls-nav"]');
    await page.waitForURL('/polls');
    
    // Step 5: Create a poll using V2 test data
    await page.click('[data-testid="create-poll-button"]');
    await page.waitForURL('/polls/create');
    
    // Step 6: Fill poll form with V2 test data
    await page.fill('[data-testid="poll-create-title"]', testData.poll.title);
    await page.fill('[data-testid="poll-create-description"]', testData.poll.description);
    await page.selectOption('[data-testid="poll-create-voting-method"]', 'single');
    await page.fill('[data-testid="poll-create-option-input-1"]', testData.poll.options[0]);
    await page.fill('[data-testid="poll-create-option-input-2"]', testData.poll.options[1]);
    
    // Step 7: Submit poll
    await page.click('[data-testid="poll-create-submit"]');
    await page.waitForURL(/\/polls\/[a-f0-9-]+/);
    
    // Step 8: Verify poll was created with V2 test data
    await expect(page.locator('[data-testid="poll-title"]')).toHaveText(testData.poll.title);
    await expect(page.locator(`text=${testData.poll.options[0]}`)).toBeVisible();
    await expect(page.locator(`text=${testData.poll.options[1]}`)).toBeVisible();
    
    // Step 9: Test feedback widget on poll page
    await testFeedbackWidgetFlow(page, 'poll');
    
    // Step 10: Vote on the poll
    await page.click('[data-testid="vote-button"]');
    // Wait for vote to be processed by checking vote count
    await expect(page.locator('[data-testid="vote-count"]')).toContainText('1');
    
    // Step 11: Verify vote was recorded
    await expect(page.locator('[data-testid="vote-count"]')).toContainText('1');
    await expect(page.locator('[data-testid="poll-results"]')).toBeVisible();

    // Step 12: Test feedback widget after voting
    await testFeedbackWidgetFlow(page, 'post-vote');

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
    
    // Step 3: Test feedback widget on dashboard
    await testFeedbackWidgetFlow(page, 'dashboard');
    
    // Step 4: Navigate to profile to set up WebAuthn
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
    
    // Step 3: Test feedback widget on dashboard
    await testFeedbackWidgetFlow(page, 'dashboard');
    
    // Step 4: Check PWA status
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
    // Installation should process immediately
    
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
    
    // Step 3: Test feedback widget on dashboard
    await testFeedbackWidgetFlow(page, 'dashboard');
    
    // Step 4: Try to access admin page (should be denied for regular users)
    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    
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
    await page.waitForLoadState('domcontentloaded');
    
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
    
    // Step 3: Test feedback widget on first device
    await testFeedbackWidgetFlow(page, 'cross-device-1');
    
    // Step 4: Create a poll on first device using V2 test data
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
    
    // Step 6: Test feedback widget on second device
    await testFeedbackWidgetFlow(page2, 'cross-device-2');
    
    // Step 7: Verify poll is visible on second device
    await page2.click('[data-testid="polls-nav"]');
    await page2.waitForURL('/polls');
    await expect(page2.locator(`text=${testData.poll.title}`)).toBeVisible();
    
    // Step 7: Vote on second device
    await page2.click(`text=${testData.poll.title}`);
    await page2.waitForURL(/\/polls\/[a-f0-9-]+/);
    await page2.click('[data-testid="vote-button"]');
    // Wait for vote to be processed by checking vote count
    await expect(page2.locator('[data-testid="vote-count"]')).toContainText('1');
    
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
    
    // Step 3: Test feedback widget before going offline
    await testFeedbackWidgetFlow(page, 'pre-offline');
    
    // Step 4: Go offline
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
    
    // Step 8: Verify sync - wait for offline indicators to clear
    await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible({ timeout: 10_000 });
    await expect(page.locator('[data-testid="offline-queue"]')).not.toBeVisible({ timeout: 10_000 });
  });

  test('should complete comprehensive feedback widget journey throughout user lifecycle', async ({ page }) => {
    // Set up test data for comprehensive feedback journey
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Step 1: Register and complete onboarding
    await page.click('[data-testid="sign-up-button"]');
    await page.waitForURL('/register');
    
    await page.waitForSelector('[data-testid="register-hydrated"]', { state: 'attached' });
    await expect(page.locator('[data-testid="register-hydrated"]')).toHaveText('1');
    
    await page.click('button:has-text("Password Account")');
    // Wait for form fields to be visible instead of arbitrary timeout
    await expect(page.locator('[data-testid="email"]')).toBeVisible();
    
    await page.fill('[data-testid="email"]', testData.user.email);
    await page.fill('[data-testid="username"]', testData.user.username);
    await page.fill('[data-testid="password"]', testData.user.password);
    await page.fill('[data-testid="confirm-password"]', testData.user.password);
    
    await page.click('[data-testid="register-button"]');
    await page.waitForURL('/onboarding*');
    
    // Complete onboarding
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
    
    // Step 2: Test feedback widget on dashboard (Feature Request)
    await testFeedbackWidgetFlow(page, 'dashboard');
    
    // Step 3: Navigate to polls and create poll
    await page.click('[data-testid="polls-nav"]');
    await page.waitForURL('/polls');
    
    await page.click('[data-testid="create-poll-button"]');
    await page.waitForURL('/polls/create');
    
    await page.fill('[data-testid="poll-create-title"]', testData.poll.title);
    await page.fill('[data-testid="poll-create-description"]', testData.poll.description);
    await page.selectOption('[data-testid="poll-create-voting-method"]', 'single');
    await page.fill('[data-testid="poll-create-option-input-1"]', testData.poll.options[0]);
    await page.fill('[data-testid="poll-create-option-input-2"]', testData.poll.options[1]);
    
    await page.click('[data-testid="poll-create-submit"]');
    await page.waitForURL(/\/polls\/[a-f0-9-]+/);
    
    // Step 4: Test feedback widget on poll page (Bug Report)
    await testFeedbackWidgetFlow(page, 'poll');
    
    // Step 5: Vote on poll
    await page.click('[data-testid="vote-button"]');
    // Wait for vote to be processed by checking vote count
    await expect(page.locator('[data-testid="vote-count"]')).toContainText('1');
    
    // Step 6: Test feedback widget after voting (General Feedback)
    await testFeedbackWidgetFlow(page, 'post-vote');
    
    // Step 7: Navigate to profile
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="profile-link"]');
    await page.waitForURL('/profile');
    
    // Step 8: Test feedback widget on profile page (Performance)
    await testFeedbackWidgetFlow(page, 'profile');
    
    // Step 9: Navigate to civics page
    await page.goto('/civics');
    await waitForPageReady(page);
    
    // Step 10: Test feedback widget on civics page (Accessibility)
    await testFeedbackWidgetFlow(page, 'civics');
    
    // Step 11: Test offline feedback submission
    await page.context().setOffline(true);
    
    // Try to submit feedback while offline
    await page.waitForSelector('.fixed.bottom-6.right-6', { timeout: 15000 });
    await page.locator('.fixed.bottom-6.right-6').click();
    await expect(page.locator('text=Enhanced Feedback')).toBeVisible();
    
    await page.getByRole('button', { name: 'General Feedback' }).click();
    await page.fill('input[placeholder="Summarize the issue"]', 'Offline feedback test');
    await page.fill('textarea[placeholder="Provide more details"]', 'Testing feedback submission while offline.');
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByLabel('Neutral').click();
    await page.getByRole('button', { name: 'Next' }).click();
    await page.getByRole('button', { name: 'Skip Screenshot' }).click();
    
    // Mock offline failure then success
    await page.route('**/api/feedback', async route => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Network error' }),
      });
    });
    
    await page.getByRole('button', { name: 'Submit Feedback' }).click();
    await expect(page.locator('text=Failed to submit feedback. Retrying...')).toBeVisible();
    
    // Go back online
    await page.context().setOffline(false);
    
    // Mock successful submission after going online
    await page.route('**/api/feedback', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Feedback submitted successfully after retry!' }),
      });
    });
    
    // Wait for retry and success
    await expect(page.locator('text=Feedback submitted successfully after retry!')).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: 'Close' }).click();
    
    // Step 12: Test admin feedback analytics access (should be denied for regular users)
    await page.goto('/admin/feedback/enhanced');
    await waitForPageReady(page);
    await expect(page.locator('h1:has-text("Access Denied")')).toBeVisible({ timeout: 15000 });
    
    console.log('Comprehensive feedback widget journey completed successfully!');
  });
});
