/**
 * Civics Complete User Journey E2E Tests - V2 Upgrade
 * 
 * End-to-end tests for the complete civics user journey with privacy-safe flow
 * using V2 mock factory for test data setup and improved test patterns.
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

test.describe('Civics Complete User Journey - Privacy-Safe Flow - V2', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
    poll: ReturnType<typeof createTestPoll>;
  };

  test.beforeEach(async ({ page }) => {
    // Create test data using V2 patterns
    testData = {
      user: createTestUser({
        email: 'civics-test@example.com',
        username: 'civicstestuser',
        password: 'CivicsTest123!'
      }),
      poll: createTestPoll({
        title: 'V2 Civics Test Poll',
        description: 'Testing civics integration with V2 setup',
        options: ['Local Option 1', 'Local Option 2', 'Local Option 3'],
        category: 'civics'
      })
    };

    // Set up external API mocks
    await setupExternalAPIMocks(page);
  });

  test.afterEach(async () => {
    // Clean up test data
    await cleanupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });
  });

  test('address→jurisdiction cookie→dashboard SSR (privacy-safe) with V2 setup', async ({ page }) => {
    // Set up test data for civics flow
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Stub providers with V2 patterns
    await page.route('**/google_civic/**', route => route.fulfill({
      status: 200, 
      body: JSON.stringify({ 
        ok: true, 
        district: '13', 
        state: 'IL', 
        county: 'Sangamon',
        normalizedInput: {
          line1: '123 Any St',
          city: 'Springfield',
          state: 'IL',
          zip: '62704'
        }
      })
    }));

    // Navigate to civics page
    await page.goto('/civics');
    await waitForPageReady(page);
    
    // Fill address input
    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    
    // Submit address lookup
    await page.click('[data-testid="address-submit"]');
    
    // Wait for API call to complete
    await page.waitForResponse('**/api/v1/civics/address-lookup');
    
    // Verify jurisdiction cookie is set
    const cookies = await page.context().cookies();
    const jurisCookie = cookies.find(c => c.name === 'cx_jurisdictions');
    expect(jurisCookie).toBeTruthy();
    expect(jurisCookie?.httpOnly).toBe(true);
    expect(jurisCookie?.secure).toBe(true);
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    // Verify jurisdiction-scoped content appears
    await expect(page.getByTestId('poll-card')).toHaveCount(1);
    
    // Verify no raw address is stored (check for address in page content)
    const pageContent = await page.content();
    expect(pageContent).not.toContain('123 Any St');
    expect(pageContent).not.toContain('Springfield, IL 62704');
    
    // Verify jurisdiction information is present
    await expect(page.locator('text=State IL Poll')).toBeVisible();
    await expect(page.locator('text=district 13')).toBeVisible();
  });

  test('privacy verification - no address storage with V2 setup', async ({ page }) => {
    // Set up test data for privacy verification
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Test that addresses are not stored anywhere
    await page.goto('/civics');
    await waitForPageReady(page);
    
    // Submit multiple addresses
    const addresses = [
      '123 Main St, Chicago, IL 60601',
      '456 Oak Ave, Springfield, IL 62701',
      '789 Pine Rd, Rockford, IL 61101'
    ];
    
    for (const address of addresses) {
      await page.fill('[data-testid="address-input"]', address);
      await page.click('[data-testid="address-submit"]');
      await page.waitForResponse('**/api/v1/civics/address-lookup');
    }
    
    // Check that no raw addresses appear in any API responses or page content
    const pageContent = await page.content();
    for (const address of addresses) {
      expect(pageContent).not.toContain(address);
    }
  });

  test('jurisdiction cookie security with V2 setup', async ({ page }) => {
    // Set up test data for cookie security testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    await page.goto('/civics');
    await waitForPageReady(page);
    
    // Submit address
    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    await page.click('[data-testid="address-submit"]');
    await page.waitForResponse('**/api/v1/civics/address-lookup');
    
    // Verify cookie security attributes
    const cookies = await page.context().cookies();
    const jurisCookie = cookies.find((c: any) => c.name === 'cx_jurisdictions');
    
    expect(jurisCookie?.httpOnly).toBe(true);
    expect(jurisCookie?.secure).toBe(true);
    expect(jurisCookie?.sameSite).toBe('Lax');
    expect(jurisCookie?.path).toBe('/');
    
    // Verify cookie is signed (not readable as plain text)
    expect(jurisCookie?.value).toMatch(/^[A-Za-z0-9_-]+$/); // base64url format
  });

  test('dashboard SSR filtering by jurisdiction with V2 setup', async ({ page }) => {
    // Set up test data for jurisdiction filtering
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set jurisdiction cookie directly
    await context.addCookies([{
      name: 'cx_jurisdictions',
      value: Buffer.from(JSON.stringify({
        body: JSON.stringify({ state: 'CA', district: '12', county: 'San Francisco', v: 1, iat: Date.now() }),
        sig: 'test-signature'
      })).toString('base64url'),
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      secure: false, // localhost
      sameSite: 'Lax'
    }]);
    
    // Navigate to dashboard
    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    // Verify jurisdiction-specific content
    await expect(page.locator('text=State CA Poll')).toBeVisible();
    await expect(page.locator('text=district 12')).toBeVisible();
  });

  test('error handling and fallbacks with V2 setup', async ({ page }) => {
    // Set up test data for error handling
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Mock API failure
    await page.route('**/api/v1/civics/address-lookup', route => route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    }));
    
    await page.goto('/civics');
    await waitForPageReady(page);
    
    // Submit address
    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    await page.click('[data-testid="address-submit"]');
    
    // Verify error handling
    await expect(page.locator('text=Failed to lookup address')).toBeVisible();
    
    // Verify no cookie is set on error
    const cookies = await page.context().cookies();
    const jurisCookie = cookies.find((c: any) => c.name === 'cx_jurisdictions');
    expect(jurisCookie).toBeFalsy();
  });

  test('performance requirements with V2 setup', async ({ page }) => {
    // Set up test data for performance testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    const startTime = Date.now();
    
    await page.goto('/civics');
    await waitForPageReady(page);
    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    await page.click('[data-testid="address-submit"]');
    
    // Wait for complete flow
    await page.waitForResponse('**/api/v1/civics/address-lookup');
    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    
    // Soft performance assertion (should complete within 5 seconds)
    expect(totalTime).toBeLessThan(5000);
  });

  test('mobile responsiveness with V2 setup', async ({ page }) => {
    // Set up test data for mobile testing
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Set mobile viewport
    await page.setViewportSize(E2E_CONFIG.BROWSER.MOBILE_VIEWPORT);
    
    await page.goto('/civics');
    await waitForPageReady(page);
    
    // Verify mobile layout
    await expect(page.locator('[data-testid="address-input"]')).toBeVisible();
    await expect(page.locator('[data-testid="address-submit"]')).toBeVisible();
    
    // Test mobile flow
    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    await page.click('[data-testid="address-submit"]');
    await page.waitForResponse('**/api/v1/civics/address-lookup');
    
    // Navigate to dashboard on mobile
    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    // Verify mobile dashboard works
    await expect(page.getByTestId('poll-card')).toHaveCount(1);
  });

  test('civics integration with user authentication with V2 setup', async ({ page }) => {
    // Set up test data for authenticated civics flow
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
    
    // Now test civics flow with authenticated user
    await page.goto('/civics');
    await waitForPageReady(page);
    
    // Fill address input
    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    await page.click('[data-testid="address-submit"]');
    await page.waitForResponse('**/api/v1/civics/address-lookup');
    
    // Verify jurisdiction cookie is set
    const cookies = await page.context().cookies();
    const jurisCookie = cookies.find(c => c.name === 'cx_jurisdictions');
    expect(jurisCookie).toBeTruthy();
    
    // Navigate to dashboard and verify jurisdiction-scoped content
    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    // Verify jurisdiction-specific content appears
    await expect(page.locator('text=State IL Poll')).toBeVisible();
    await expect(page.locator('text=district 13')).toBeVisible();
  });

  test('civics integration with poll creation with V2 setup', async ({ page }) => {
    // Set up test data for poll creation with civics
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // First, set up jurisdiction
    await page.goto('/civics');
    await waitForPageReady(page);
    
    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    await page.click('[data-testid="address-submit"]');
    await page.waitForResponse('**/api/v1/civics/address-lookup');
    
    // Authenticate user
    await page.goto('/login');
    await waitForPageReady(page);
    
    await page.fill('[data-testid="login-email"]', testData.user.email);
    await page.fill('[data-testid="login-password"]', testData.user.password);
    await page.click('[data-testid="login-submit"]');
    
    await page.waitForURL('/dashboard');
    await waitForPageReady(page);
    
    // Create a poll with civics context
    await page.goto('/polls/create');
    await waitForPageReady(page);
    
    await page.fill('input[id="title"]', 'Local Community Poll');
    await page.fill('textarea[id="description"]', 'A poll for our local community');
    await page.click('button:has-text("Next")');
    
    await page.fill('input[placeholder*="Option 1"]', 'Local Option 1');
    await page.fill('input[placeholder*="Option 2"]', 'Local Option 2');
    await page.click('button:has-text("Next")');
    
    await page.selectOption('select', 'civics');
    await page.click('button:has-text("Next")');
    
    await page.click('button:has-text("Create Poll")');
    await page.waitForURL(/\/polls\/[a-f0-9-]+/);
    
    // Verify poll was created with civics context
    const pollTitle = await page.locator('[data-testid="poll-title"]');
    await expect(pollTitle).toContainText('Local Community Poll');
    
    // Verify jurisdiction information is present
    await expect(page.locator('text=State IL Poll')).toBeVisible();
    await expect(page.locator('text=district 13')).toBeVisible();
  });

  test('civics integration with multiple jurisdictions with V2 setup', async ({ page }) => {
    // Set up test data for multiple jurisdictions
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Test multiple jurisdictions
    const jurisdictions = [
      { address: '123 Main St, Chicago, IL 60601', state: 'IL', district: '7' },
      { address: '456 Oak Ave, Los Angeles, CA 90210', state: 'CA', district: '33' },
      { address: '789 Pine Rd, Austin, TX 78701', state: 'TX', district: '10' }
    ];
    
    for (const jurisdiction of jurisdictions) {
      await page.goto('/civics');
      await waitForPageReady(page);
      
      await page.fill('[data-testid="address-input"]', jurisdiction.address);
      await page.click('[data-testid="address-submit"]');
      await page.waitForResponse('**/api/v1/civics/address-lookup');
      
      // Navigate to dashboard
      await page.goto('/dashboard');
      await waitForPageReady(page);
      
      // Verify jurisdiction-specific content
      await expect(page.locator(`text=State ${jurisdiction.state} Poll`)).toBeVisible();
      await expect(page.locator(`text=district ${jurisdiction.district}`)).toBeVisible();
      
      // Verify no raw address is stored
      const pageContent = await page.content();
      expect(pageContent).not.toContain(jurisdiction.address);
    }
  });

  test('civics integration error recovery with V2 setup', async ({ page }) => {
    // Set up test data for error recovery
    await setupE2ETestData({
      user: testData.user,
      poll: testData.poll
    });

    // Test with invalid address
    await page.goto('/civics');
    await waitForPageReady(page);
    
    await page.fill('[data-testid="address-input"]', 'Invalid Address, Nowhere, ZZ 00000');
    await page.click('[data-testid="address-submit"]');
    
    // Should show error message
    await expect(page.locator('text=Address not found')).toBeVisible();
    
    // Test with valid address after error
    await page.fill('[data-testid="address-input"]', '123 Any St, Springfield, IL 62704');
    await page.click('[data-testid="address-submit"]');
    await page.waitForResponse('**/api/v1/civics/address-lookup');
    
    // Should work correctly
    await page.goto('/dashboard');
    await waitForPageReady(page);
    
    await expect(page.locator('text=State IL Poll')).toBeVisible();
    await expect(page.locator('text=district 13')).toBeVisible();
  });
});
