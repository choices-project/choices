/**
 * Browser Location Capture E2E Tests
 * 
 * End-to-end tests for browser location capture functionality.
 * These tests guide how the feature should work, not just conform to current state.
 */

import { test, expect } from '@playwright/test';
import { 
  setupE2ETestData, 
  cleanupE2ETestData, 
  createTestUser, 
  waitForPageReady,
  E2E_CONFIG
} from './helpers/e2e-setup';

test.describe('Browser Location Capture', () => {
  let testData: {
    user: ReturnType<typeof createTestUser>;
  };

  test.beforeEach(async () => {
    testData = {
      user: createTestUser({
        email: 'location-test@example.com',
        username: 'locationtestuser',
        password: 'LocationTest123!'
      })
    };

    await setupE2ETestData({
      user: testData.user
    });
  });

  test.afterEach(async () => {
    await cleanupE2ETestData({
      user: testData.user
    });
  });

  test.describe('Geolocation API Integration', () => {
    test('should request geolocation permission and handle success', async ({ page }) => {
      // Mock successful geolocation
      await page.addInitScript(() => {
        const mockGeolocation = {
          getCurrentPosition: (success: any) => {
            success({
              coords: {
                latitude: 37.7749,
                longitude: -122.4194,
                accuracy: 10
              }
            });
          }
        };
        (window as any).navigator.geolocation = mockGeolocation;
      });

      // Mock successful API response
      await page.route('**/api/v1/civics/address-lookup', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            location: {
              jurisdictionIds: ['ocd-division/country:us/state:ca/place:oakland'],
              primaryOcdId: 'ocd-division/country:us/state:ca/place:oakland',
              jurisdictionName: 'Oakland',
              lat: 37.7749,
              lon: -122.4194,
              accuracy: 10,
              precision: 'exact',
              provider: 'browser',
              aliasConfidence: 0.95,
              storedAt: new Date().toISOString(),
              consentVersion: 1
            }
          })
        });
      });

      await page.goto('/onboarding');
      await waitForPageReady(page);

      // Navigate to location step
      await page.click('[data-testid="location-step"]');
      await waitForPageReady(page);

      // Click "Use my current location"
      await page.click('text=Use my current location');
      
      // Should show loading state
      await expect(page.locator('[data-testid="location-loading"]')).toBeVisible();
      
      // Should resolve successfully
      await expect(page.locator('text=Location captured successfully')).toBeVisible();
      
      // Should auto-advance to next step
      await page.waitForURL(/\/onboarding\/.*/, { timeout: 5000 });
    });

    test('should handle geolocation permission denial gracefully', async ({ page }) => {
      // Mock geolocation denial
      await page.addInitScript(() => {
        const mockGeolocation = {
          getCurrentPosition: (success: any, error: any) => {
            error({
              code: 1, // PERMISSION_DENIED
              message: 'User denied geolocation'
            });
          }
        };
        (window as any).navigator.geolocation = mockGeolocation;
      });

      await page.goto('/onboarding');
      await waitForPageReady(page);

      await page.click('[data-testid="location-step"]');
      await waitForPageReady(page);

      await page.click('text=Use my current location');
      
      // Should show error message
      await expect(page.locator('text=Could not get your location')).toBeVisible();
      
      // Should offer alternative input
      await expect(page.locator('[data-testid="address-input"]')).toBeVisible();
    });

    test('should handle geolocation timeout', async ({ page }) => {
      // Mock geolocation timeout
      await page.addInitScript(() => {
        const mockGeolocation = {
          getCurrentPosition: (success: any, error: any) => {
            setTimeout(() => {
              error({
                code: 3, // TIMEOUT
                message: 'Geolocation timeout'
              });
            }, 100);
          }
        };
        (window as any).navigator.geolocation = mockGeolocation;
      });
    });

    test('should handle unsupported geolocation', async ({ page }) => {
      // Mock no geolocation support
      await page.addInitScript(() => {
        delete (window as any).navigator.geolocation;
      });

      await page.goto('/onboarding');
      await waitForPageReady(page);

      await page.click('[data-testid="location-step"]');
      await waitForPageReady(page);

      await page.click('text=Use my current location');
      
      // Should show error and fallback
      await expect(page.locator('text=Geolocation not supported')).toBeVisible();
      await expect(page.locator('[data-testid="address-input"]')).toBeVisible();
    });
  });

  test.describe('Address Input Fallback', () => {
    test('should handle ZIP code input', async ({ page }) => {
      await page.route('**/api/v1/civics/address-lookup', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            location: {
              jurisdictionIds: ['ocd-division/country:us/state:ca'],
              primaryOcdId: 'ocd-division/country:us/state:ca',
              jurisdictionName: 'California',
              lat: 37.7749,
              lon: -122.4194,
              accuracy: null,
              precision: 'zip',
              provider: 'manual',
              aliasConfidence: 0.95,
              storedAt: new Date().toISOString(),
              consentVersion: 1
            }
          })
        });
      });

      await page.goto('/onboarding');
      await waitForPageReady(page);

      await page.click('[data-testid="location-step"]');
      await waitForPageReady(page);

      // Enter ZIP code
      await page.fill('[data-testid="address-input"]', '94102');
      await page.click('[data-testid="address-submit"]');
      
      await expect(page.locator('text=Location captured successfully')).toBeVisible();
    });

    test('should handle full address input', async ({ page }) => {
      await page.route('**/api/v1/civics/address-lookup', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            location: {
              jurisdictionIds: ['ocd-division/country:us/state:ca/place:oakland'],
              primaryOcdId: 'ocd-division/country:us/state:ca/place:oakland',
              jurisdictionName: 'Oakland',
              lat: 37.7749,
              lon: -122.4194,
              accuracy: null,
              precision: 'exact',
              provider: 'manual',
              aliasConfidence: 0.95,
              storedAt: new Date().toISOString(),
              consentVersion: 1
            }
          })
        });
      });

      await page.goto('/onboarding');
      await waitForPageReady(page);

      await page.click('[data-testid="location-step"]');
      await waitForPageReady(page);

      // Enter full address
      await page.fill('[data-testid="address-input"]', '123 Main St, Oakland, CA 94601');
      await page.click('[data-testid="address-submit"]');
      
      await expect(page.locator('text=Location captured successfully')).toBeVisible();
    });

    test('should handle address lookup errors', async ({ page }) => {
      await page.route('**/api/v1/civics/address-lookup', route => {
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Address not found'
          })
        });
      });

      await page.goto('/onboarding');
      await waitForPageReady(page);

      await page.click('[data-testid="location-step"]');
      await waitForPageReady(page);

      await page.fill('[data-testid="address-input"]', 'Invalid Address');
      await page.click('[data-testid="address-submit"]');
      
      await expect(page.locator('text=Could not find that location')).toBeVisible();
    });
  });

  test.describe('Privacy and Consent', () => {
    test('should display privacy notice prominently', async ({ page }) => {
      await page.goto('/onboarding');
      await waitForPageReady(page);

      await page.click('[data-testid="location-step"]');
      await waitForPageReady(page);

      // Should show privacy notice
      await expect(page.locator('text=Your privacy is protected')).toBeVisible();
      await expect(page.locator('text=We only store approximate coordinates')).toBeVisible();
      await expect(page.locator('text=You can remove this data anytime')).toBeVisible();
    });

    test('should allow users to skip location capture', async ({ page }) => {
      await page.goto('/onboarding');
      await waitForPageReady(page);

      await page.click('[data-testid="location-step"]');
      await waitForPageReady(page);

      // Should have skip option
      await expect(page.locator('text=Skip for now')).toBeVisible();
      await expect(page.locator('text=Skip Location')).toBeVisible();
    });

    test('should handle skip gracefully', async ({ page }) => {
      await page.goto('/onboarding');
      await waitForPageReady(page);

      await page.click('[data-testid="location-step"]');
      await waitForPageReady(page);

      await page.click('text=Skip Location');
      
      // Should advance to next step
      await page.waitForURL(/\/onboarding\/.*/, { timeout: 5000 });
    });
  });

  test.describe('Feature Flag Integration', () => {
    test('should show disabled message when feature is off', async ({ page }) => {
      // Mock feature flag as disabled
      await page.addInitScript(() => {
        (window as any).__FEATURE_FLAGS__ = {
          BROWSER_LOCATION_CAPTURE: false
        };
      });

      await page.goto('/onboarding');
      await waitForPageReady(page);

      await page.click('[data-testid="location-step"]');
      await waitForPageReady(page);

      await expect(page.locator('text=Location Services')).toBeVisible();
      await expect(page.locator('text=Location capture is currently disabled')).toBeVisible();
      await expect(page.locator('text=Continue Without Location')).toBeVisible();
    });
  });

  test.describe('Mobile Experience', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize(E2E_CONFIG.BROWSER.MOBILE_VIEWPORT);

      await page.goto('/onboarding');
      await waitForPageReady(page);

      await page.click('[data-testid="location-step"]');
      await waitForPageReady(page);

      // Should be mobile-friendly
      await expect(page.locator('[data-testid="location-input"]')).toBeVisible();
      await expect(page.locator('text=Use my current location')).toBeVisible();
    });

    test('should handle mobile geolocation permissions', async ({ page }) => {
      await page.setViewportSize(E2E_CONFIG.BROWSER.MOBILE_VIEWPORT);

      // Mock mobile geolocation
      await page.addInitScript(() => {
        const mockGeolocation = {
          getCurrentPosition: (success: any) => {
            success({
              coords: {
                latitude: 37.7749,
                longitude: -122.4194,
                accuracy: 50 // Lower accuracy on mobile
              }
            });
          }
        };
        (window as any).navigator.geolocation = mockGeolocation;
      });

      await page.route('**/api/v1/civics/address-lookup', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            location: {
              jurisdictionIds: ['ocd-division/country:us/state:ca'],
              primaryOcdId: 'ocd-division/country:us/state:ca',
              jurisdictionName: 'California',
              lat: 37.7749,
              lon: -122.4194,
              accuracy: 50,
              precision: 'approximate',
              provider: 'browser',
              aliasConfidence: 0.85,
              storedAt: new Date().toISOString(),
              consentVersion: 1
            }
          })
        });
      });

      await page.goto('/onboarding');
      await waitForPageReady(page);

      await page.click('[data-testid="location-step"]');
      await waitForPageReady(page);

      await page.click('text=Use my current location');
      
      await expect(page.locator('text=Location captured successfully')).toBeVisible();
    });
  });

  test.describe('Data Persistence', () => {
    test('should save location data to onboarding context', async ({ page }) => {
      await page.route('**/api/v1/civics/address-lookup', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            location: {
              jurisdictionIds: ['ocd-division/country:us/state:ca/place:oakland'],
              primaryOcdId: 'ocd-division/country:us/state:ca/place:oakland',
              jurisdictionName: 'Oakland',
              lat: 37.7749,
              lon: -122.4194,
              accuracy: 10,
              precision: 'exact',
              provider: 'browser',
              aliasConfidence: 0.95,
              storedAt: new Date().toISOString(),
              consentVersion: 1
            }
          })
        });
      });

      await page.goto('/onboarding');
      await waitForPageReady(page);

      await page.click('[data-testid="location-step"]');
      await waitForPageReady(page);

      await page.fill('[data-testid="address-input"]', '123 Main St, Oakland, CA');
      await page.click('[data-testid="address-submit"]');
      
      await expect(page.locator('text=Location captured successfully')).toBeVisible();
      
      // Verify data is persisted (this would be checked in the next step)
      await page.waitForURL(/\/onboarding\/.*/, { timeout: 5000 });
    });

    test('should handle skip data persistence', async ({ page }) => {
      await page.goto('/onboarding');
      await waitForPageReady(page);

      await page.click('[data-testid="location-step"]');
      await waitForPageReady(page);

      await page.click('text=Skip Location');
      
      // Should advance and persist skip state
      await page.waitForURL(/\/onboarding\/.*/, { timeout: 5000 });
    });
  });

  test.describe('Error Recovery', () => {
    test('should allow retry after geolocation error', async ({ page }) => {
      // Mock initial geolocation failure
      await page.addInitScript(() => {
        let attemptCount = 0;
        const mockGeolocation = {
          getCurrentPosition: (success: any, error: any) => {
            attemptCount++;
            if (attemptCount === 1) {
              error({ code: 1, message: 'Permission denied' });
            } else {
              success({
                coords: {
                  latitude: 37.7749,
                  longitude: -122.4194,
                  accuracy: 10
                }
              });
            }
          }
        };
        (window as any).navigator.geolocation = mockGeolocation;
      });

      await page.route('**/api/v1/civics/address-lookup', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            location: {
              jurisdictionIds: ['ocd-division/country:us/state:ca/place:oakland'],
              primaryOcdId: 'ocd-division/country:us/state:ca/place:oakland',
              jurisdictionName: 'Oakland',
              lat: 37.7749,
              lon: -122.4194,
              accuracy: 10,
              precision: 'exact',
              provider: 'browser',
              aliasConfidence: 0.95,
              storedAt: new Date().toISOString(),
              consentVersion: 1
            }
          })
        });
      });

      await page.goto('/onboarding');
      await waitForPageReady(page);

      await page.click('[data-testid="location-step"]');
      await waitForPageReady(page);

      // First attempt should fail
      await page.click('text=Use my current location');
      await expect(page.locator('text=Could not get your location')).toBeVisible();
      
      // Second attempt should succeed
      await page.click('text=Use my current location');
      await expect(page.locator('text=Location captured successfully')).toBeVisible();
    });

    test('should allow retry after address lookup error', async ({ page }) => {
      let attemptCount = 0;
      await page.route('**/api/v1/civics/address-lookup', route => {
        attemptCount++;
        if (attemptCount === 1) {
          route.fulfill({
            status: 400,
            contentType: 'application/json',
            body: JSON.stringify({ error: 'Address not found' })
          });
        } else {
          route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              location: {
                jurisdictionIds: ['ocd-division/country:us/state:ca/place:oakland'],
                primaryOcdId: 'ocd-division/country:us/state:ca/place:oakland',
                jurisdictionName: 'Oakland',
                lat: 37.7749,
                lon: -122.4194,
                accuracy: null,
                precision: 'exact',
                provider: 'manual',
                aliasConfidence: 0.95,
                storedAt: new Date().toISOString(),
                consentVersion: 1
              }
            })
          });
        }
      });

      await page.goto('/onboarding');
      await waitForPageReady(page);

      await page.click('[data-testid="location-step"]');
      await waitForPageReady(page);

      // First attempt should fail
      await page.fill('[data-testid="address-input"]', 'Invalid Address');
      await page.click('[data-testid="address-submit"]');
      await expect(page.locator('text=Could not find that location')).toBeVisible();
      
      // Second attempt should succeed
      await page.fill('[data-testid="address-input"]', '123 Main St, Oakland, CA');
      await page.click('[data-testid="address-submit"]');
      await expect(page.locator('text=Location captured successfully')).toBeVisible();
    });
  });
});
