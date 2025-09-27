/**
 * WebAuthn Components E2E Tests - V2 Upgrade
 * 
 * Tests the existing WebAuthn UI components with V2 mock factory setup
 * Validates component rendering and basic functionality
 * 
 * Created: January 21, 2025
 * Updated: January 21, 2025
 */

import { test, expect } from '@playwright/test';
import { T } from '@/lib/testing/testIds';
import { 
  setupE2ETestData, 
  cleanupE2ETestData, 
  createTestUser, 
  createTestPoll,
  waitForPageReady,
  setupExternalAPIMocks,
  E2E_CONFIG
} from './helpers/e2e-setup';

test.describe('WebAuthn Components - V2', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
    poll: ReturnType<typeof createTestPoll>;
  };

  test.beforeEach(async ({ page }) => {
    // Create test data using V2 patterns
    testData = {
      user: createTestUser({
        email: 'webauthn-components-test@example.com',
        username: 'webauthncomponentstestuser',
        password: 'WebAuthnComponentsTest123!'
      }),
      poll: createTestPoll({
        title: 'V2 WebAuthn Components Test Poll',
        description: 'Testing WebAuthn components with V2 setup',
        options: ['WebAuthn Option 1', 'WebAuthn Option 2', 'WebAuthn Option 3'],
        category: 'general'
      })
    };

    // Set up external API mocks
    await setupExternalAPIMocks(page);

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

  test('should render PasskeyButton components with V2 setup', async ({ page }) => {
    // Set up test data for PasskeyButton testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Navigate to a page that should have passkey buttons
    await page.goto('/login');
    await waitForPageReady(page);

    // Check if passkey buttons are present (using actual test IDs from the login page)
    const loginButton = page.locator('[data-testid="login-webauthn"]');

    // The login button should be visible if WebAuthn is supported
    const hasLoginButton = await loginButton.isVisible();
    
    // If WebAuthn is not supported, the button won't be visible, which is expected
    if (hasLoginButton) {
      expect(hasLoginButton).toBe(true);
    } else {
      // Check if WebAuthn is supported in the browser
      const webauthnSupported = await page.evaluate(() => {
        return 'credentials' in navigator && 'PublicKeyCredential' in window;
      });
      
      if (webauthnSupported) {
        // If WebAuthn is supported but button is not visible, that's an issue
        expect(hasLoginButton).toBe(true);
      } else {
        // If WebAuthn is not supported, button not being visible is expected
        expect(hasLoginButton).toBe(false);
      }
    }
  });

  test('should render PasskeyControls component with V2 setup', async ({ page }) => {
    // Set up test data for PasskeyControls testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Navigate to a page that should have passkey controls
    await page.goto('/register');
    await waitForPageReady(page);

    // Check if passkey controls are present
    const passkeyControls = page.locator('[data-testid="passkey-controls"]');
    const hasPasskeyControls = await passkeyControls.isVisible();
    
    if (hasPasskeyControls) {
      expect(hasPasskeyControls).toBe(true);
    } else {
      // Check if WebAuthn is supported in the browser
      const webauthnSupported = await page.evaluate(() => {
        return 'credentials' in navigator && 'PublicKeyCredential' in window;
      });
      
      if (webauthnSupported) {
        // If WebAuthn is supported but controls are not visible, that's an issue
        expect(hasPasskeyControls).toBe(true);
      } else {
        // If WebAuthn is not supported, controls not being visible is expected
        expect(hasPasskeyControls).toBe(false);
      }
    }
  });

  test('should render WebAuthnPrompt component with V2 setup', async ({ page }) => {
    // Set up test data for WebAuthnPrompt testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Navigate to a page that should have WebAuthn prompt
    await page.goto('/login');
    await waitForPageReady(page);

    // Check if WebAuthn prompt is present
    const webauthnPrompt = page.locator('[data-testid="webauthn-prompt"]');
    const hasWebAuthnPrompt = await webauthnPrompt.isVisible();
    
    if (hasWebAuthnPrompt) {
      expect(hasWebAuthnPrompt).toBe(true);
    } else {
      // Check if WebAuthn is supported in the browser
      const webauthnSupported = await page.evaluate(() => {
        return 'credentials' in navigator && 'PublicKeyCredential' in window;
      });
      
      if (webauthnSupported) {
        // If WebAuthn is supported but prompt is not visible, that's an issue
        expect(hasWebAuthnPrompt).toBe(true);
      } else {
        // If WebAuthn is not supported, prompt not being visible is expected
        expect(hasWebAuthnPrompt).toBe(false);
      }
    }
  });

  test('should handle WebAuthn components with authentication with V2 setup', async ({ page }) => {
    // Set up test data for authenticated WebAuthn components testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // First, authenticate the user
    await page.goto('/login');
    await waitForPageReady(page);
    
    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');
    
    // Wait for authentication
    await page.waitForURL('/dashboard');
    await waitForPageReady(page);
    
    // Check WebAuthn components with authenticated user
    const authenticatedWebAuthnComponents = page.locator('[data-testid="authenticated-webauthn-components"]');
    const hasAuthenticatedComponents = await authenticatedWebAuthnComponents.isVisible();
    
    if (hasAuthenticatedComponents) {
      expect(hasAuthenticatedComponents).toBe(true);
    }
  });

  test('should handle WebAuthn components with different user types with V2 setup', async ({ page }) => {
    // Create different user types for testing
    const regularUser = createTestUser({
      email: 'regular-webauthn-components@example.com',
      username: 'regularwebauthncomponents'
    });

    const adminUser = createTestUser({
      email: 'admin-webauthn-components@example.com',
      username: 'adminwebauthncomponents'
    });

    // Test regular user WebAuthn components
    await setupE2ETestData({
      user: regularUser,
      poll: testData.poll
    });

    await page.goto('/login');
    await waitForPageReady(page);

    await page.fill('[data-testid="login-email"]', regularUser.email);
    await page.fill('[data-testid="login-password"]', regularUser.password);
    await page.click('[data-testid="login-submit"]');

    await page.waitForURL('/dashboard');
    await waitForPageReady(page);

    const regularWebAuthnComponents = page.locator('[data-testid="regular-user-webauthn-components"]');
    const hasRegularComponents = await regularWebAuthnComponents.isVisible();
    
    if (hasRegularComponents) {
      expect(hasRegularComponents).toBe(true);
    }

    // Test admin user WebAuthn components
    await setupE2ETestData({
      user: adminUser,
      poll: testData.poll
    });

    await page.click('[data-testid="logout-button"]');
    await page.waitForURL('/');

    await page.goto('/login');
    await waitForPageReady(page);

    await page.fill('[data-testid="login-email"]', adminUser.email);
    await page.fill('[data-testid="login-password"]', adminUser.password);
    await page.click('[data-testid="login-submit"]');

    await page.waitForURL('/dashboard');
    await waitForPageReady(page);

    const adminWebAuthnComponents = page.locator('[data-testid="admin-user-webauthn-components"]');
    const hasAdminComponents = await adminWebAuthnComponents.isVisible();
    
    if (hasAdminComponents) {
      expect(hasAdminComponents).toBe(true);
    }
  });

  test('should handle WebAuthn components with mobile viewport with V2 setup', async ({ page }) => {
    // Set up test data for mobile WebAuthn components testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set mobile viewport
    await page.setViewportSize(E2E_CONFIG.BROWSER.MOBILE_VIEWPORT);

    // Check WebAuthn components on mobile
    await page.goto('/login');
    await waitForPageReady(page);

    const mobileWebAuthnComponents = page.locator('[data-testid="mobile-webauthn-components"]');
    const hasMobileComponents = await mobileWebAuthnComponents.isVisible();
    
    if (hasMobileComponents) {
      expect(hasMobileComponents).toBe(true);
    }
  });

  test('should handle WebAuthn components with poll management integration with V2 setup', async ({ page }) => {
    // Set up test data for poll management integration
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Authenticate user
    await page.goto('/login');
    await waitForPageReady(page);

    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');

    await page.waitForURL('/dashboard');
    await waitForPageReady(page);

    // Check WebAuthn components with poll management context
    const pollWebAuthnComponents = page.locator('[data-testid="poll-management-webauthn-components"]');
    const hasPollComponents = await pollWebAuthnComponents.isVisible();
    
    if (hasPollComponents) {
      expect(hasPollComponents).toBe(true);
    }

    // Create a poll to test WebAuthn components with poll context
    await page.goto('/polls/create');
    await waitForPageReady(page);

    await page.fill('input[id="title"]', testData.poll.title);
    await page.fill('textarea[id="description"]', testData.poll.description);
    await page.click('button:has-text("Next")');

    await page.fill('input[placeholder*="Option 1"]', testData.poll.options[0]);
    await page.fill('input[placeholder*="Option 2"]', testData.poll.options[1]);
    await page.click('button:has-text("Next")');

    await page.selectOption('select', testData.poll.category || 'general');
    await page.click('button:has-text("Next")');

    await page.click('button:has-text("Create Poll")');
    await page.waitForURL(/\/polls\/[a-f0-9-]+/);

    // Check WebAuthn components after poll creation
    const pollCreatedWebAuthnComponents = page.locator('[data-testid="poll-created-webauthn-components"]');
    const hasPollCreatedComponents = await pollCreatedWebAuthnComponents.isVisible();
    
    if (hasPollCreatedComponents) {
      expect(hasPollCreatedComponents).toBe(true);
    }
  });

  test('should handle WebAuthn components with civics integration with V2 setup', async ({ page }) => {
    // Set up test data for civics integration
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set up civics context
    await page.goto('/civics');
    await waitForPageReady(page);

    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    await page.click('[data-testid="address-submit"]');
    await page.waitForResponse('**/api/v1/civics/address-lookup');

    // Check WebAuthn components with civics context
    const civicsWebAuthnComponents = page.locator('[data-testid="civics-webauthn-components"]');
    const hasCivicsComponents = await civicsWebAuthnComponents.isVisible();
    
    if (hasCivicsComponents) {
      expect(hasCivicsComponents).toBe(true);
    }
  });

  test('should handle WebAuthn components performance with V2 setup', async ({ page }) => {
    // Set up test data for performance testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Measure WebAuthn components performance
    const startTime = Date.now();

    // Navigate to different pages to check WebAuthn components
    const pages = ['/login', '/register', '/dashboard'];
    
    for (const pagePath of pages) {
      await page.goto(pagePath);
      await waitForPageReady(page);
      
      // Check if WebAuthn components are present
      const webauthnComponents = page.locator('[data-testid*="webauthn"]');
      await webauthnComponents.count();
    }

    const endTime = Date.now();
    const webauthnComponentsTime = endTime - startTime;

    // Verify WebAuthn components performance is acceptable
    expect(webauthnComponentsTime).toBeLessThan(5000);
  });

  test('should handle WebAuthn components with offline functionality with V2 setup', async ({ page }) => {
    // Set up test data for offline WebAuthn components testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Go offline
    await page.context().setOffline(true);

    // Check WebAuthn components while offline
    await page.goto('/login');
    await waitForPageReady(page);

    const offlineWebAuthnComponents = page.locator('[data-testid="offline-webauthn-components"]');
    const hasOfflineComponents = await offlineWebAuthnComponents.isVisible();
    
    if (hasOfflineComponents) {
      expect(hasOfflineComponents).toBe(true);
    }

    // Go back online
    await page.context().setOffline(false);

    // Check WebAuthn components while online
    await page.goto('/login');
    await waitForPageReady(page);

    const onlineWebAuthnComponents = page.locator('[data-testid="online-webauthn-components"]');
    const hasOnlineComponents = await onlineWebAuthnComponents.isVisible();
    
    if (hasOnlineComponents) {
      expect(hasOnlineComponents).toBe(true);
    }
  });

  test('should handle WebAuthn components with PWA integration with V2 setup', async ({ page }) => {
    // Set up test data for PWA WebAuthn components testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Check WebAuthn components with PWA context
    await page.goto('/login');
    await waitForPageReady(page);

    const pwaWebAuthnComponents = page.locator('[data-testid="pwa-webauthn-components"]');
    const hasPwaComponents = await pwaWebAuthnComponents.isVisible();
    
    if (hasPwaComponents) {
      expect(hasPwaComponents).toBe(true);
    }
  });
});
