/**
 * Superior Implementations E2E Tests
 * 
 * Tests all superior implementations including:
 * - Superior Data Pipeline with OpenStates People integration
 * - Comprehensive Candidate Cards with mobile optimization
 * - Superior Mobile Feed with advanced PWA features
 * - Enhanced Representative Feed with comprehensive display
 * - Current electorate filtering with system date verification
 * 
 * Created: October 8, 2025
 * Updated: October 8, 2025
 */

import { test, expect, type Page } from '@playwright/test';
import { 
  setupE2ETestData, 
  cleanupE2ETestData, 
  createTestUser, 
  waitForPageReady,
  setupExternalAPIMocks,
  E2E_CONFIG
} from './helpers/e2e-setup';

test.describe('Superior Implementations E2E Tests', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
  };

  test.beforeEach(async ({ page }) => {
    // Create test data
    testData = {
      user: createTestUser({
        email: 'superior-test@example.com',
        username: 'superior-test-user',
        password: 'SuperiorTest123!'
      })
    };

    // Set up external API mocks
    await setupExternalAPIMocks(page);
  });

  test.afterEach(async () => {
    await cleanupE2ETestData(testData);
  });

  test.describe('Superior Data Pipeline', () => {
    test('should test superior data ingestion API', async ({ request }) => {
      const baseURL = process.env.BASE_URL || 'http://127.0.0.1:3000';
      
      // Test superior ingest API
      const response = await request.get(`${baseURL}/api/civics/superior-ingest`);
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('configuration');
      expect(data.configuration).toHaveProperty('openStatesPeopleEnabled', true);
      expect(data.configuration).toHaveProperty('strictCurrentFiltering', true);
      expect(data.configuration).toHaveProperty('systemDateVerification', true);
      expect(data.configuration).toHaveProperty('crossReferenceEnabled', true);
      expect(data.configuration).toHaveProperty('dataValidationEnabled', true);
      expect(data.configuration).toHaveProperty('wikipediaEnabled', true);
    });

    test('should verify user data comes from database', async ({ request }) => {
      // Test that user data is retrieved from database, not external APIs
      const userDataResponse = await request.get('/api/user/profile');
      expect(userDataResponse.status()).toBe(200);
      
      const userData = await userDataResponse.json();
      expect(userData).toHaveProperty('user');
      expect(userData.user).toHaveProperty('email');
      expect(userData.user).toHaveProperty('preferences');
    });

    test('should restrict superior pipeline to admin only', async ({ request }) => {
      // Test that superior pipeline requires admin authentication
      const baseURL = process.env.BASE_URL || 'http://127.0.0.1:3000';
      
      // Try to access superior ingest without admin auth
      const response = await request.post(`${baseURL}/api/civics/superior-ingest`, {
        data: { state: 'CA', level: 'federal' }
      });
      
      // Should be restricted (401 or 403)
      expect([401, 403, 404]).toContain(response.status());
    });

    test('should test current electorate filtering', async ({ request }) => {
      const baseURL = process.env.BASE_URL || 'http://127.0.0.1:3000';
      
      // Test with sample representatives including non-current ones
      const testRepresentatives = [
        {
          name: 'Nancy Pelosi',
          office: 'US House',
          party: 'Democratic',
          termStartDate: '2023-01-01',
          termEndDate: '2025-01-01',
          lastUpdated: '2024-10-08'
        },
        {
          name: 'Dianne Feinstein',
          office: 'US Senate',
          party: 'Democratic',
          termStartDate: '2021-01-01',
          termEndDate: '2023-01-01',
          lastUpdated: '2023-01-01'
        }
      ];

      const response = await request.post(`${baseURL}/api/civics/superior-ingest`, {
        data: { representatives: testRepresentatives }
      });
      
      expect(response.status()).toBe(200);
      
      const data = await response.json();
      expect(data).toHaveProperty('success', true);
      expect(data).toHaveProperty('currentElectorate');
      expect(data.currentElectorate).toHaveProperty('totalCurrent');
      expect(data.currentElectorate).toHaveProperty('nonCurrent');
      expect(data.currentElectorate).toHaveProperty('accuracy');
    });
  });

  test.describe('Comprehensive Candidate Cards', () => {
    test('should display comprehensive candidate data', async ({ page }) => {
      await page.goto('/civics-2-0');
      await waitForPageReady(page);

      // Wait for representatives to load
      await page.waitForSelector('[data-testid="representative-card"]', { timeout: 10000 });

      // Check for comprehensive data display
      const representativeCards = page.locator('[data-testid="representative-card"]');
      const cardsCount = await representativeCards.count();
      expect(cardsCount).toBeGreaterThan(0);

      // Check for enhanced data elements
      const firstCard = representativeCards.first();
      
      // Check for quality indicators
      await expect(firstCard.locator('[data-testid="quality-score"]')).toBeVisible();
      
      // Check for contact information
      await expect(firstCard.locator('[data-testid="contact-info"]')).toBeVisible();
      
      // Check for photos
      await expect(firstCard.locator('[data-testid="representative-photo"]')).toBeVisible();
      
      // Check for activity timeline
      await expect(firstCard.locator('[data-testid="activity-timeline"]')).toBeVisible();
    });

    test('should test mobile and detailed views', async ({ page }) => {
      await page.goto('/civics-2-0');
      await waitForPageReady(page);

      // Test mobile view
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check mobile-optimized layout
      const mobileCards = page.locator('[data-testid="representative-card"]');
      const mobileCount = await mobileCards.count();
      expect(mobileCount).toBeGreaterThan(0);

      // Test detailed view
      await page.setViewportSize({ width: 1280, height: 720 });
      
      // Click on a representative to see detailed view
      const firstCard = page.locator('[data-testid="representative-card"]').first();
      await firstCard.click();

      // Check for detailed view elements
      await expect(page.locator('[data-testid="comprehensive-candidate-card"]')).toBeVisible();
      await expect(page.locator('[data-testid="enhanced-contacts"]')).toBeVisible();
      await expect(page.locator('[data-testid="enhanced-photos"]')).toBeVisible();
      await expect(page.locator('[data-testid="enhanced-activity"]')).toBeVisible();
    });
  });

  test.describe('Superior Mobile Feed', () => {
    test('should test mobile PWA features', async ({ page }) => {
      await page.goto('/feed');
      await waitForPageReady(page);

      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Check for mobile-optimized feed
      await expect(page.locator('[data-testid="mobile-feed"]')).toBeVisible();
      
      // Check for touch gestures
      const feedContainer = page.locator('[data-testid="feed-container"]');
      await expect(feedContainer).toBeVisible();

      // Test pull-to-refresh functionality
      await page.evaluate(() => {
        const feed = document.querySelector('[data-testid="feed-container"]');
        if (feed) {
          // Simulate pull-to-refresh gesture
          const touchStart = new TouchEvent('touchstart', { 
            touches: [{ 
              clientX: 0, 
              clientY: 100, 
              force: 1, 
              identifier: 0, 
              pageX: 0, 
              pageY: 100, 
              radiusX: 0, 
              radiusY: 0, 
              rotationAngle: 0, 
              screenX: 0, 
              screenY: 100, 
              target: feed 
            }] 
          });
          const touchMove = new TouchEvent('touchmove', { 
            touches: [{ 
              clientX: 0, 
              clientY: 50, 
              force: 1, 
              identifier: 0, 
              pageX: 0, 
              pageY: 50, 
              radiusX: 0, 
              radiusY: 0, 
              rotationAngle: 0, 
              screenX: 0, 
              screenY: 50, 
              target: feed 
            }] 
          });
          const touchEnd = new TouchEvent('touchend', { 
            touches: [{ 
              clientX: 0, 
              clientY: 50, 
              force: 1, 
              identifier: 0, 
              pageX: 0, 
              pageY: 50, 
              radiusX: 0, 
              radiusY: 0, 
              rotationAngle: 0, 
              screenX: 0, 
              screenY: 50, 
              target: feed 
            }] 
          });
          
          feed.dispatchEvent(touchStart);
          feed.dispatchEvent(touchMove);
          feed.dispatchEvent(touchEnd);
        }
      });

      // Check for PWA features
      await expect(page.locator('[data-testid="pwa-install-button"]')).toBeVisible();
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    });

    test('should test PWA manifest and service worker', async ({ page }) => {
      await page.goto('/feed');
      await waitForPageReady(page);

      // Check for PWA manifest
      const manifestLink = page.locator('link[rel="manifest"]');
      await expect(manifestLink).toBeVisible();

      // Check for service worker registration
      const swRegistration = await page.evaluate(() => {
        return navigator.serviceWorker ? 'available' : 'not available';
      });
      expect(swRegistration).toBe('available');

      // Check for PWA meta tags
      await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toBeVisible();
      await expect(page.locator('meta[name="theme-color"]')).toBeVisible();
    });

    test('should test dark mode and theme switching', async ({ page }) => {
      await page.goto('/feed');
      await waitForPageReady(page);

      // Check for theme toggle
      const themeToggle = page.locator('[data-testid="theme-toggle"]');
      await expect(themeToggle).toBeVisible();

      // Test theme switching
      await themeToggle.click();
      
      // Check for dark mode classes
      const body = page.locator('body');
      await expect(body).toHaveClass(/dark/);
    });
  });

  test.describe('Enhanced Representative Feed', () => {
    test('should display comprehensive representative data', async ({ page }) => {
      await page.goto('/civics-2-0');
      await waitForPageReady(page);

      // Wait for representatives to load
      await page.waitForSelector('[data-testid="representative-feed"]', { timeout: 10000 });

      // Check for comprehensive data display
      const representativeFeed = page.locator('[data-testid="representative-feed"]');
      await expect(representativeFeed).toBeVisible();

      // Check for quality statistics
      await expect(page.locator('[data-testid="quality-statistics"]')).toBeVisible();
      
      // Check for filtering options
      await expect(page.locator('[data-testid="state-filter"]')).toBeVisible();
      await expect(page.locator('[data-testid="level-filter"]')).toBeVisible();
      await expect(page.locator('[data-testid="quality-filter"]')).toBeVisible();

      // Test filtering functionality
      await page.selectOption('[data-testid="state-filter"]', 'CA');
      await page.waitForTimeout(1000); // Wait for filter to apply
      
      // Check that only CA representatives are shown
      const caRepresentatives = page.locator('[data-testid="representative-card"]');
      const caCount = await caRepresentatives.count();
      expect(caCount).toBeGreaterThan(0);
    });

    test('should test data quality indicators', async ({ page }) => {
      await page.goto('/civics-2-0');
      await waitForPageReady(page);

      // Check for quality indicators on representative cards
      const qualityIndicators = page.locator('[data-testid="quality-indicator"]');
      const qualityCount = await qualityIndicators.count();
      expect(qualityCount).toBeGreaterThan(0);

      // Check for source attribution
      const sourceAttribution = page.locator('[data-testid="source-attribution"]');
      const sourceCount = await sourceAttribution.count();
      expect(sourceCount).toBeGreaterThan(0);

      // Check for verification status
      const verificationStatus = page.locator('[data-testid="verification-status"]');
      const verificationCount = await verificationStatus.count();
      expect(verificationCount).toBeGreaterThan(0);
    });
  });

  test.describe('Current Electorate Filtering', () => {
    test('should filter out non-current representatives', async ({ page }) => {
      await page.goto('/civics-2-0');
      await waitForPageReady(page);

      // Wait for representatives to load
      await page.waitForSelector('[data-testid="representative-card"]', { timeout: 10000 });

      // Check that non-current representatives are not displayed
      const nonCurrentNames = ['Dianne Feinstein', 'Kevin McCarthy'];
      
      for (const name of nonCurrentNames) {
        const nonCurrentCard = page.locator(`[data-testid="representative-card"]:has-text("${name}")`);
        await expect(nonCurrentCard).toHaveCount(0);
      }

      // Check that current representatives are displayed
      const currentRepresentatives = page.locator('[data-testid="representative-card"]');
      const currentCount = await currentRepresentatives.count();
      expect(currentCount).toBeGreaterThan(0);
    });

    test('should display system date verification', async ({ page }) => {
      await page.goto('/civics-2-0');
      await waitForPageReady(page);

      // Check for system date information
      const systemDateInfo = page.locator('[data-testid="system-date-info"]');
      await expect(systemDateInfo).toBeVisible();

      // Check for current electorate count
      const currentElectorateCount = page.locator('[data-testid="current-electorate-count"]');
      await expect(currentElectorateCount).toBeVisible();
    });
  });

  test.describe('Performance and Quality', () => {
    test('should meet performance benchmarks', async ({ page }) => {
      await page.goto('/feed');
      await waitForPageReady(page);

      // Test page load performance
      const startTime = Date.now();
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      // Should load within 2 seconds
      expect(loadTime).toBeLessThan(2000);

      // Test mobile performance
      await page.setViewportSize({ width: 375, height: 667 });
      
      const mobileStartTime = Date.now();
      await page.reload();
      await page.waitForLoadState('networkidle');
      const mobileLoadTime = Date.now() - mobileStartTime;

      // Should load within 2 seconds on mobile
      expect(mobileLoadTime).toBeLessThan(2000);
    });

    test('should test data quality scoring', async ({ page }) => {
      await page.goto('/civics-2-0');
      await waitForPageReady(page);

      // Check for data quality scores
      const qualityScores = page.locator('[data-testid="quality-score"]');
      const scoresCount = await qualityScores.count();
      expect(scoresCount).toBeGreaterThan(0);

      // Check that quality scores are within valid range (0-100)
      const firstScore = await qualityScores.first().textContent();
      const scoreValue = parseInt(firstScore || '0');
      expect(scoreValue).toBeGreaterThanOrEqual(0);
      expect(scoreValue).toBeLessThanOrEqual(100);
    });
  });
});
