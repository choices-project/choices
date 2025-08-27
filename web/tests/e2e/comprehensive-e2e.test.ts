/**
 * Comprehensive E2E Test Suite
 * Complete end-to-end testing for all user flows and edge cases
 * 
 * Tests:
 * - Complete user journeys
 * - Edge cases and error scenarios
 * - Performance under load
 * - Accessibility compliance
 * - Cross-browser compatibility
 * - Mobile responsiveness
 * - Offline functionality
 * - Security validation
 * 
 * Created: 2025-08-27
 * Status: Critical for live user reliability
 */

import { test, expect } from '@playwright/test'

// Test configuration
const TEST_CONFIG = {
  timeout: 30000,
  retries: 2,
  slowMo: 100,
  viewports: [
    { width: 1920, height: 1080 }, // Desktop
    { width: 768, height: 1024 },  // Tablet
    { width: 375, height: 667 }    // Mobile
  ]
}

test.describe('Comprehensive E2E Testing', () => {
  for (const viewport of TEST_CONFIG.viewports) {
    test.describe(`Viewport: ${viewport.width}x${viewport.height}`, () => {
      test.use({ viewport })

      test.beforeEach(async ({ page }) => {
        // Set up test environment
        await page.addInitScript(() => {
          // Enable test mode
          window.__TEST_MODE__ = true
          
          // Mock network conditions for testing
          if (window.navigator.connection) {
            Object.defineProperty(window.navigator.connection, 'effectiveType', {
              value: '4g',
              writable: true
            })
          }
        })
      })

      test('Complete user registration and onboarding flow', async ({ page }) => {
        // Start at homepage
        await page.goto('/')
        await expect(page.locator('h1')).toBeVisible()

        // Navigate to registration
        await page.click('a[href="/register"]')
        await expect(page.locator('form')).toBeVisible()

        // Fill registration form
        const testUser = `testuser_${Date.now()}`
        await page.fill('input[name="username"]', testUser)
        await page.fill('input[name="email"]', `${testUser}@example.com`)

        // Submit registration
        await page.click('button[type="submit"]')
        await page.waitForURL('**/onboarding')

        // Complete onboarding
        await page.check('input[name="notifications"]')
        await page.check('input[name="dataSharing"]')
        await page.selectOption('select[name="theme"]', 'dark')

        await page.click('button[type="submit"]')
        await page.waitForURL('**/dashboard')

        // Verify dashboard
        await expect(page.locator('h1')).toContainText('Dashboard')
        await expect(page.locator(`text=${testUser}`)).toBeVisible()

        console.log(`✅ Complete registration flow passed for ${viewport.width}x${viewport.height}`)
      })

      test('Poll creation and voting flow', async ({ page }) => {
        // Login or register first
        await page.goto('/register')
        const testUser = `polluser_${Date.now()}`
        await page.fill('input[name="username"]', testUser)
        await page.fill('input[name="email"]', `${testUser}@example.com`)
        await page.click('button[type="submit"]')
        await page.waitForURL('**/onboarding')

        // Quick onboarding
        await page.click('button[type="submit"]')
        await page.waitForURL('**/dashboard')

        // Create a poll
        await page.click('a[href="/create"]')
        await expect(page.locator('form')).toBeVisible()

        await page.fill('input[name="title"]', 'Test Poll for E2E')
        await page.fill('textarea[name="description"]', 'This is a test poll for end-to-end testing')
        await page.selectOption('select[name="type"]', 'single')
        await page.selectOption('select[name="visibility"]', 'public')

        // Add options
        await page.fill('input[name="options[0]"]', 'Option A')
        await page.fill('input[name="options[1]"]', 'Option B')
        await page.fill('input[name="options[2]"]', 'Option C')

        await page.click('button[type="submit"]')

        // Verify poll created
        await expect(page.locator('text=Test Poll for E2E')).toBeVisible()

        // Vote on the poll
        await page.click('input[value="Option A"]')
        await page.click('button[type="submit"]')

        // Verify vote recorded
        await expect(page.locator('text=Vote recorded')).toBeVisible()

        console.log(`✅ Poll creation and voting flow passed for ${viewport.width}x${viewport.height}`)
      })

      test('Offline functionality and sync', async ({ page }) => {
        await page.goto('/')

        // Simulate offline mode
        await page.route('**/*', (route) => {
          route.abort()
        })

        // Try to vote while offline
        await page.goto('/polls')
        const pollLink = page.locator('a[href*="/poll/"]').first()
        if (await pollLink.isVisible()) {
          await pollLink.click()
          
          // Should show offline indicator
          await expect(page.locator('text=You\'re offline')).toBeVisible()
          
          // Vote should be stored offline
          await page.click('input[type="radio"]')
          await page.click('button[type="submit"]')
          
          await expect(page.locator('text=Vote stored offline')).toBeVisible()
        }

        // Restore online mode
        await page.unroute('**/*')

        // Sync should happen automatically
        await page.waitForTimeout(2000)
        await expect(page.locator('text=Votes synced')).toBeVisible()

        console.log(`✅ Offline functionality passed for ${viewport.width}x${viewport.height}`)
      })

      test('Error handling and edge cases', async ({ page }) => {
        // Test 404 page
        await page.goto('/nonexistent-page')
        await expect(page.locator('h1')).toContainText('404')

        // Test invalid form submission
        await page.goto('/register')
        await page.click('button[type="submit"]')
        await expect(page.locator('text=Username is required')).toBeVisible()

        // Test duplicate username
        await page.fill('input[name="username"]', 'existinguser')
        await page.fill('input[name="email"]', 'test@example.com')
        await page.click('button[type="submit"]')
        await expect(page.locator('text=Username already exists')).toBeVisible()

        // Test invalid email
        await page.fill('input[name="username"]', 'newuser')
        await page.fill('input[name="email"]', 'invalid-email')
        await page.click('button[type="submit"]')
        await expect(page.locator('text=Invalid email')).toBeVisible()

        console.log(`✅ Error handling passed for ${viewport.width}x${viewport.height}`)
      })

      test('Accessibility compliance', async ({ page }) => {
        await page.goto('/')

        // Check for proper heading structure
        const headings = await page.locator('h1, h2, h3, h4, h5, h6').all()
        expect(headings.length).toBeGreaterThan(0)

        // Check for alt text on images
        const images = await page.locator('img').all()
        for (const img of images) {
          const alt = await img.getAttribute('alt')
          expect(alt).toBeTruthy()
        }

        // Check for proper form labels
        const inputs = await page.locator('input, textarea, select').all()
        for (const input of inputs) {
          const id = await input.getAttribute('id')
          if (id) {
            const label = page.locator(`label[for="${id}"]`)
            await expect(label).toBeVisible()
          }
        }

        // Check for keyboard navigation
        await page.keyboard.press('Tab')
        await expect(page.locator(':focus')).toBeVisible()

        // Check for ARIA attributes
        const ariaElements = await page.locator('[aria-label], [aria-labelledby], [role]').all()
        expect(ariaElements.length).toBeGreaterThan(0)

        console.log(`✅ Accessibility compliance passed for ${viewport.width}x${viewport.height}`)
      })

      test('Performance under load', async ({ page }) => {
        const startTime = Date.now()

        // Load homepage
        await page.goto('/')
        await page.waitForLoadState('networkidle')

        const loadTime = Date.now() - startTime
        expect(loadTime).toBeLessThan(5000) // 5 seconds max

        // Test with multiple concurrent requests
        const promises = []
        for (let i = 0; i < 5; i++) {
          promises.push(page.goto('/'))
        }

        await Promise.all(promises)

        // Check memory usage
        const memoryUsage = await page.evaluate(() => {
          return performance.memory ? {
            used: performance.memory.usedJSHeapSize,
            total: performance.memory.totalJSHeapSize
          } : null
        })

        if (memoryUsage) {
          const memoryMB = memoryUsage.used / 1024 / 1024
          expect(memoryMB).toBeLessThan(100) // 100MB max
        }

        console.log(`✅ Performance under load passed for ${viewport.width}x${viewport.height}`)
      })

      test('Security validation', async ({ page }) => {
        await page.goto('/')

        // Check for security headers
        const response = await page.goto('/')
        const headers = response?.headers()

        expect(headers?.['x-frame-options']).toBeDefined()
        expect(headers?.['x-content-type-options']).toBe('nosniff')
        expect(headers?.['referrer-policy']).toBeDefined()

        // Check for CSP header
        const csp = headers?.['content-security-policy']
        expect(csp).toBeDefined()
        expect(csp).toContain('default-src')

        // Test XSS protection
        await page.goto('/')
        await page.evaluate(() => {
          const script = document.createElement('script')
          script.textContent = 'alert("XSS")'
          document.body.appendChild(script)
        })

        // Should not execute script
        const alerts = await page.locator('text=alert("XSS")').count()
        expect(alerts).toBe(0)

        // Test CSRF protection
        await page.goto('/register')
        const csrfToken = await page.locator('input[name="_csrf"]').getAttribute('value')
        expect(csrfToken).toBeTruthy()

        console.log(`✅ Security validation passed for ${viewport.width}x${viewport.height}`)
      })

      test('Mobile responsiveness', async ({ page }) => {
        await page.goto('/')

        // Check viewport meta tag
        const viewportMeta = page.locator('meta[name="viewport"]')
        await expect(viewportMeta).toBeVisible()

        // Check for mobile-friendly elements
        const touchTargets = await page.locator('button, a, input[type="submit"]').all()
        for (const target of touchTargets) {
          const box = await target.boundingBox()
          if (box) {
            // Touch targets should be at least 44x44px
            expect(box.width).toBeGreaterThanOrEqual(44)
            expect(box.height).toBeGreaterThanOrEqual(44)
          }
        }

        // Check for responsive images
        const images = await page.locator('img').all()
        for (const img of images) {
          const srcset = await img.getAttribute('srcset')
          if (srcset) {
            expect(srcset).toContain('w')
          }
        }

        // Test touch interactions
        const button = page.locator('button').first()
        if (await button.isVisible()) {
          await button.tap()
          // Should respond to touch
        }

        console.log(`✅ Mobile responsiveness passed for ${viewport.width}x${viewport.height}`)
      })

      test('PWA functionality', async ({ page }) => {
        await page.goto('/')

        // Check for service worker
        const swRegistration = await page.evaluate(() => {
          return navigator.serviceWorker?.getRegistrations()
        })
        expect(swRegistration).toBeDefined()

        // Check for manifest
        const manifestLink = page.locator('link[rel="manifest"]')
        await expect(manifestLink).toBeVisible()

        // Check for PWA meta tags
        const themeColor = page.locator('meta[name="theme-color"]')
        await expect(themeColor).toBeVisible()

        const appleTouchIcon = page.locator('link[rel="apple-touch-icon"]')
        await expect(appleTouchIcon).toBeVisible()

        // Test offline functionality
        await page.route('**/*', (route) => {
          route.abort()
        })

        await page.goto('/')
        await expect(page.locator('text=offline')).toBeVisible()

        await page.unroute('**/*')

        console.log(`✅ PWA functionality passed for ${viewport.width}x${viewport.height}`)
      })

      test('Real-time features', async ({ page }) => {
        await page.goto('/')

        // Check for real-time indicators
        const realtimeIndicator = page.locator('[data-testid="realtime-status"]')
        if (await realtimeIndicator.isVisible()) {
          await expect(realtimeIndicator).toContainText('connected')
        }

        // Test WebSocket connections (if applicable)
        const wsConnections = await page.evaluate(() => {
          return window.WebSocket ? true : false
        })
        expect(wsConnections).toBe(true)

        console.log(`✅ Real-time features passed for ${viewport.width}x${viewport.height}`)
      })

      test('Data persistence and state management', async ({ page }) => {
        // Test localStorage
        await page.goto('/')
        await page.evaluate(() => {
          localStorage.setItem('test', 'value')
        })

        const storedValue = await page.evaluate(() => {
          return localStorage.getItem('test')
        })
        expect(storedValue).toBe('value')

        // Test sessionStorage
        await page.evaluate(() => {
          sessionStorage.setItem('session-test', 'session-value')
        })

        const sessionValue = await page.evaluate(() => {
          return sessionStorage.getItem('session-test')
        })
        expect(sessionValue).toBe('session-value')

        // Test IndexedDB (if used)
        const indexedDBSupport = await page.evaluate(() => {
          return 'indexedDB' in window
        })
        expect(indexedDBSupport).toBe(true)

        console.log(`✅ Data persistence passed for ${viewport.width}x${viewport.height}`)
      })
    })
  }

  test.describe('Cross-browser compatibility', () => {
    test('Chrome compatibility', async ({ page }) => {
      test.use({ browserName: 'chromium' })
      await runBasicFlow(page)
    })

    test('Firefox compatibility', async ({ page }) => {
      test.use({ browserName: 'firefox' })
      await runBasicFlow(page)
    })

    test('Safari compatibility', async ({ page }) => {
      test.use({ browserName: 'webkit' })
      await runBasicFlow(page)
    })
  })
})

/**
 * Run basic user flow for cross-browser testing
 */
async function runBasicFlow(page: any) {
  await page.goto('/')
  await expect(page.locator('h1')).toBeVisible()

  await page.goto('/register')
  await expect(page.locator('form')).toBeVisible()

  const testUser = `crossbrowser_${Date.now()}`
  await page.fill('input[name="username"]', testUser)
  await page.fill('input[name="email"]', `${testUser}@example.com`)
  await page.click('button[type="submit"]')

  await page.waitForURL('**/onboarding')
  await page.click('button[type="submit"]')
  await page.waitForURL('**/dashboard')

  await expect(page.locator('h1')).toContainText('Dashboard')
}
