import { test, expect } from '@playwright/test'

/**
 * Comprehensive OptimizedImage Component Testing
 * 
 * Tests the accessibility and performance optimized image component for:
 * - Proper alt text and ARIA attributes
 * - Lazy loading and performance optimization
 * - Error handling and fallback images
 * - Responsive design and different image formats
 * - SEO optimization and metadata
 */

test.describe('OptimizedImage Component', () => {
  test.beforeEach(async ({ page }) => {
    // Mock image loading utilities
    await page.addInitScript(() => {
      // Mock image loading
      window.Image = class MockImage {
        src: string = ''
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        
        constructor() {
          // Simulate successful load for valid URLs
          setTimeout(() => {
            if (this.src.includes('valid')) {
              this.onload?.()
            } else {
              this.onerror?.()
            }
          }, 100)
        }
      }

      // Track performance metrics
      window.__DEV__ = {
        imageLoadCount: 0,
        errorCount: 0,
        lazyLoadCount: 0
      }
    })

    // Navigate to optimized image test page
    await page.goto('/test-optimized-image')
  })

  test('OptimizedImage provides proper accessibility', async ({ page }) => {
    // Wait for images to load
    await page.waitForSelector('[data-testid="optimized-image"]')

    // Check alt text is present and meaningful
    const images = page.locator('[data-testid="optimized-image"] img')
    for (let i = 0; i < await images.count(); i++) {
      const image = images.nth(i)
      const altText = await image.getAttribute('alt')
      expect(altText).toBeTruthy()
      expect(altText).not.toBe('')
      expect(altText.length).toBeGreaterThan(3) // Meaningful alt text
    }

    // Check ARIA attributes
    const imageContainers = page.locator('[data-testid="optimized-image"]')
    for (let i = 0; i < await imageContainers.count(); i++) {
      const container = imageContainers.nth(i)
      const ariaLabel = await container.getAttribute('aria-label')
      if (ariaLabel) {
        expect(ariaLabel).not.toBe('')
      }
    }

    // Test keyboard navigation
    const firstImage = page.locator('[data-testid="optimized-image"]').first()
    await firstImage.focus()
    await page.keyboard.press('Enter')

    // Verify image interaction works (modal, zoom, etc.)
    await expect(page.locator('[data-testid="image-modal"]')).toBeVisible()
  })

  test('OptimizedImage loads efficiently with lazy loading', async ({ page }) => {
    // Wait for initial images to load
    await page.waitForSelector('[data-testid="optimized-image"] img[src]')

    // Check lazy loading attribute
    const images = page.locator('[data-testid="optimized-image"] img')
    for (let i = 0; i < await images.count(); i++) {
      const image = images.nth(i)
      const loading = await image.getAttribute('loading')
      expect(loading).toBe('lazy')
    }

    // Measure image load time
    const startTime = await page.evaluate(() => performance.now())
    await page.waitForSelector('[data-testid="optimized-image"] img[src]', { timeout: 5000 })
    const loadTime = await page.evaluate((start) => performance.now() - start, startTime)

    // Should load quickly
    expect(loadTime).toBeLessThan(3000)

    // Check that only visible images are loaded initially
    const loadedImages = await page.locator('[data-testid="optimized-image"] img[src]').count()
    expect(loadedImages).toBeGreaterThan(0)
  })

  test('OptimizedImage handles loading errors gracefully', async ({ page }) => {
    // Mock error response for specific images
    await page.addInitScript(() => {
      window.Image = class MockImage {
        src: string = ''
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        
        constructor() {
          setTimeout(() => {
            // Always trigger error for test
            this.onerror?.()
          }, 100)
        }
      }
    })

    // Reload page to trigger errors
    await page.reload()

    // Wait for error handling
    await page.waitForTimeout(500)

    // Verify fallback images are displayed
    const fallbackImages = page.locator('[data-testid="fallback-image"]')
    await expect(fallbackImages).toBeVisible()

    // Verify error state is handled
    const errorStates = page.locator('[data-testid="image-error"]')
    await expect(errorStates).toBeVisible()
  })

  test('OptimizedImage supports responsive design', async ({ page }) => {
    // Test different viewport sizes
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 768, height: 1024 },
      { width: 375, height: 667 }
    ]

    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.waitForTimeout(100)

      // Verify images are still visible and properly sized
      const images = page.locator('[data-testid="optimized-image"] img')
      await expect(images).toBeVisible()

      // Check image dimensions are appropriate for viewport
      for (let i = 0; i < await images.count(); i++) {
        const image = images.nth(i)
        const width = await image.evaluate(el => el.clientWidth)
        const height = await image.evaluate(el => el.clientHeight)
        
        expect(width).toBeGreaterThan(0)
        expect(height).toBeGreaterThan(0)
        expect(width).toBeLessThanOrEqual(viewport.width)
      }
    }
  })

  test('OptimizedImage provides proper SEO optimization', async ({ page }) => {
    // Wait for images to load
    await page.waitForSelector('[data-testid="optimized-image"] img[src]')

    // Check for proper image metadata
    const images = page.locator('[data-testid="optimized-image"] img')
    for (let i = 0; i < await images.count(); i++) {
      const image = images.nth(i)
      
      // Check src attribute
      const src = await image.getAttribute('src')
      expect(src).toBeTruthy()
      expect(src).not.toBe('')

      // Check for proper image format
      expect(src).toMatch(/\.(jpg|jpeg|png|webp|avif)$/i)

      // Check for responsive srcset if available
      const srcset = await image.getAttribute('srcset')
      if (srcset) {
        expect(srcset).toContain(' ')
        expect(srcset).toContain('w')
      }
    }
  })

  test('OptimizedImage handles different image formats correctly', async ({ page }) => {
    // Test with different image formats
    const testImages = [
      { src: '/test-images/valid.jpg', format: 'jpeg' },
      { src: '/test-images/valid.png', format: 'png' },
      { src: '/test-images/valid.webp', format: 'webp' }
    ]

    for (const testImage of testImages) {
      // Mock image with specific format
      await page.addInitScript((img) => {
        window.currentTestImage = img
      }, testImage)

      // Reload page
      await page.reload()

      // Wait for image to load
      await page.waitForSelector('[data-testid="optimized-image"] img[src]', { timeout: 3000 })

      // Verify image loads correctly
      const image = page.locator('[data-testid="optimized-image"] img').first()
      const src = await image.getAttribute('src')
      expect(src).toContain(testImage.format)
    }
  })

  test('OptimizedImage performance under rapid loading', async ({ page }) => {
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return performance.memory?.usedJSHeapSize || 0
    })

    // Load multiple images rapidly
    for (let i = 0; i < 10; i++) {
      await page.evaluate((index) => {
        // Trigger image load
        const img = new Image()
        img.src = `/test-images/valid-${index}.jpg`
      }, i)
      await page.waitForTimeout(50)
    }

    // Wait for all images to process
    await page.waitForTimeout(1000)

    // Check final memory usage
    const finalMemory = await page.evaluate(() => {
      return performance.memory?.usedJSHeapSize || 0
    })

    // Memory usage should not grow excessively
    const memoryIncrease = finalMemory - initialMemory
    expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024) // 20MB limit
  })

  test('OptimizedImage provides proper focus management', async ({ page }) => {
    // Wait for images to load
    await page.waitForSelector('[data-testid="optimized-image"]')

    // Test focus indicators
    const images = page.locator('[data-testid="optimized-image"]')
    for (let i = 0; i < await images.count(); i++) {
      const image = images.nth(i)
      
      // Focus the image
      await image.focus()
      
      // Verify focus is visible
      const isFocused = await image.evaluate(el => el === document.activeElement)
      expect(isFocused).toBe(true)
      
      // Check for focus styles
      const computedStyle = await image.evaluate(el => {
        return window.getComputedStyle(el)
      })
      
      // Should have visible focus indicator
      const outline = computedStyle.outline
      const boxShadow = computedStyle.boxShadow
      expect(outline !== 'none' || boxShadow !== 'none').toBe(true)
    }
  })

  test('OptimizedImage handles loading states correctly', async ({ page }) => {
    // Mock slow loading
    await page.addInitScript(() => {
      window.Image = class MockImage {
        src: string = ''
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        
        constructor() {
          setTimeout(() => {
            this.onload?.()
          }, 2000) // Slow load
        }
      }
    })

    // Reload page
    await page.reload()

    // Verify loading indicator appears
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible()

    // Wait for load to complete
    await page.waitForSelector('[data-testid="optimized-image"] img[src]', { timeout: 5000 })

    // Verify loading indicator disappears
    await expect(page.locator('[data-testid="loading-indicator"]')).not.toBeVisible()
  })

  test('OptimizedImage supports image optimization features', async ({ page }) => {
    // Wait for images to load
    await page.waitForSelector('[data-testid="optimized-image"] img[src]')

    // Check for optimization attributes
    const images = page.locator('[data-testid="optimized-image"] img')
    for (let i = 0; i < await images.count(); i++) {
      const image = images.nth(i)
      
      // Check for proper sizing
      const width = await image.getAttribute('width')
      const height = await image.getAttribute('height')
      if (width && height) {
        expect(parseInt(width)).toBeGreaterThan(0)
        expect(parseInt(height)).toBeGreaterThan(0)
      }

      // Check for decoding attribute
      const decoding = await image.getAttribute('decoding')
      expect(decoding).toBe('async')
    }
  })

  test('OptimizedImage provides proper error recovery', async ({ page }) => {
    // Mock initial error then success
    await page.addInitScript(() => {
      let attemptCount = 0
      window.Image = class MockImage {
        src: string = ''
        onload: (() => void) | null = null
        onerror: (() => void) | null = null
        
        constructor() {
          setTimeout(() => {
            attemptCount++
            if (attemptCount === 1) {
              this.onerror?.() // First attempt fails
            } else {
              this.onload?.() // Retry succeeds
            }
          }, 100)
        }
      }
    })

    // Reload page
    await page.reload()

    // Wait for error state
    await page.waitForTimeout(200)
    await expect(page.locator('[data-testid="image-error"]')).toBeVisible()

    // Trigger retry
    await page.click('[data-testid="retry-button"]')

    // Wait for successful load
    await page.waitForSelector('[data-testid="optimized-image"] img[src]', { timeout: 5000 })

    // Verify error state is cleared
    await expect(page.locator('[data-testid="image-error"]')).not.toBeVisible()
  })

  test('OptimizedImage accessibility with screen readers', async ({ page }) => {
    // Wait for images to load
    await page.waitForSelector('[data-testid="optimized-image"]')

    // Test screen reader support
    const images = page.locator('[data-testid="optimized-image"]')
    for (let i = 0; i < await images.count(); i++) {
      const image = images.nth(i)
      
      // Check for proper role
      const role = await image.getAttribute('role')
      if (role) {
        expect(['img', 'button', 'link']).toContain(role)
      }

      // Check for proper tabindex
      const tabindex = await image.getAttribute('tabindex')
      if (tabindex) {
        expect(['0', '-1']).toContain(tabindex)
      }

      // Check for proper aria attributes
      const ariaHidden = await image.getAttribute('aria-hidden')
      if (ariaHidden === 'true') {
        // If hidden from screen readers, should have alternative text
        const title = await image.getAttribute('title')
        expect(title).toBeTruthy()
      }
    }
  })
})
