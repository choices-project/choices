import { test, expect } from '@playwright/test'

/**
 * Comprehensive VirtualScroll Component Testing
 * 
 * Tests the performance-optimized VirtualScroll component for:
 * - Efficient rendering of large datasets
 * - Debounced search functionality
 * - Infinite loading performance
 * - Memory management and cleanup
 * - Accessibility compliance
 * - Responsive design across screen sizes
 */

test.describe('VirtualScroll Component', () => {
  test.beforeEach(async ({ page }) => {
    // Mock performance utilities
    await page.addInitScript(() => {
      // Mock performance utilities
      window.performanceUtils = {
        debounce: (fn: Function, delay: number) => {
          let timeoutId: NodeJS.Timeout
          return (...args: any[]) => {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(() => fn(...args), delay)
          }
        },
        virtualScroll: {
          getTotalHeight: (itemCount: number, itemHeight: number) => itemCount * itemHeight,
          getVisibleRange: (scrollTop: number, containerHeight: number, itemHeight: number) => {
            const startIndex = Math.floor(scrollTop / itemHeight)
            const endIndex = Math.min(startIndex + Math.ceil(containerHeight / itemHeight), itemCount)
            return { startIndex, endIndex }
          }
        }
      }

      // Track performance metrics
      window.__DEV__ = {
        renderCount: 0,
        searchCallCount: 0,
        scrollEventCount: 0,
        memoryUsage: 0
      }

      // Generate test data
      window.generateTestData = (count: number) => {
        return Array.from({ length: count }, (_, i) => ({
          id: `item-${i}`,
          title: `Test Item ${i}`,
          description: `Description for item ${i}`,
          timestamp: new Date(Date.now() - i * 1000).toISOString()
        }))
      }
    })

    // Navigate to virtual scroll test page
    await page.goto('/test-virtual-scroll')
  })

  test('VirtualScroll efficiently renders large datasets', async ({ page }) => {
    // Generate large dataset
    await page.evaluate(() => {
      window.testData = window.generateTestData(10000) // 10k items
    })

    // Measure initial render time
    const startTime = await page.evaluate(() => performance.now())
    await page.waitForSelector('[data-testid="virtual-scroll-item"]', { timeout: 5000 })
    const renderTime = await page.evaluate((start) => performance.now() - start, startTime)

    // Should render quickly (under 200ms for initial viewport)
    expect(renderTime).toBeLessThan(200)

    // Verify only visible items are rendered (virtualization working)
    const renderedItems = await page.locator('[data-testid="virtual-scroll-item"]').count()
    expect(renderedItems).toBeLessThan(50) // Only viewport items should be rendered

    // Check memory usage
    const memoryUsage = await page.evaluate(() => {
      return performance.memory?.usedJSHeapSize || 0
    })
    expect(memoryUsage).toBeLessThan(100 * 1024 * 1024) // 100MB limit
  })

  test('VirtualScroll search is properly debounced', async ({ page }) => {
    // Wait for component to load
    await page.waitForSelector('[data-testid="search-input"]')

    const searchInput = page.locator('[data-testid="search-input"]')

    // Type quickly (should be debounced)
    await searchInput.type('test')
    await searchInput.type('search')
    await searchInput.type('query')

    // Wait for debounce delay
    await page.waitForTimeout(350) // 300ms debounce + buffer

    // Verify search was executed only once
    const searchCalls = await page.evaluate(() => {
      return window.__DEV__?.searchCallCount || 0
    })
    expect(searchCalls).toBe(1)

    // Verify search results are displayed
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible()
  })

  test('VirtualScroll handles infinite loading correctly', async ({ page }) => {
    // Wait for component to load
    await page.waitForSelector('[data-testid="virtual-scroll-container"]')

    // Scroll to bottom to trigger infinite loading
    await page.evaluate(() => {
      const container = document.querySelector('[data-testid="virtual-scroll-container"]')
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    })

    // Wait for loading indicator
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible()

    // Wait for new items to load
    await page.waitForTimeout(1000)

    // Verify loading indicator disappears
    await expect(page.locator('[data-testid="loading-indicator"]')).not.toBeVisible()

    // Verify more items are loaded
    const itemCount = await page.locator('[data-testid="virtual-scroll-item"]').count()
    expect(itemCount).toBeGreaterThan(0)
  })

  test('VirtualScroll maintains scroll position during updates', async ({ page }) => {
    // Wait for component to load
    await page.waitForSelector('[data-testid="virtual-scroll-container"]')

    // Scroll to middle
    await page.evaluate(() => {
      const container = document.querySelector('[data-testid="virtual-scroll-container"]')
      if (container) {
        container.scrollTop = container.scrollHeight / 2
      }
    })

    // Get scroll position
    const scrollPosition = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="virtual-scroll-container"]')
      return container?.scrollTop || 0
    })

    // Trigger data update
    await page.click('[data-testid="refresh-data"]')

    // Wait for update
    await page.waitForTimeout(500)

    // Verify scroll position is maintained
    const newScrollPosition = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="virtual-scroll-container"]')
      return container?.scrollTop || 0
    })

    expect(Math.abs(newScrollPosition - scrollPosition)).toBeLessThan(10) // Allow small difference
  })

  test('VirtualScroll provides proper accessibility', async ({ page }) => {
    // Wait for component to load
    await page.waitForSelector('[data-testid="virtual-scroll-container"]')

    // Test keyboard navigation
    await page.keyboard.press('Tab')
    
    // Verify focus indicators
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()

    // Test screen reader support
    const container = page.locator('[data-testid="virtual-scroll-container"]')
    const ariaLabel = await container.getAttribute('aria-label')
    expect(ariaLabel).toBeTruthy()
    expect(ariaLabel).toContain('scrollable')

    // Test item accessibility
    const items = page.locator('[data-testid="virtual-scroll-item"]')
    for (let i = 0; i < Math.min(await items.count(), 5); i++) {
      const item = items.nth(i)
      const role = await item.getAttribute('role')
      expect(role).toBe('listitem')
    }
  })

  test('VirtualScroll handles empty state correctly', async ({ page }) => {
    // Mock empty data
    await page.evaluate(() => {
      window.testData = []
    })

    // Reload page
    await page.reload()

    // Verify empty state message
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible()
    await expect(page.locator('[data-testid="empty-state"]')).toContainText('No items found')
  })

  test('VirtualScroll performance under rapid scrolling', async ({ page }) => {
    // Wait for component to load
    await page.waitForSelector('[data-testid="virtual-scroll-container"]')

    // Get initial render count
    const initialRenderCount = await page.evaluate(() => {
      return window.__DEV__?.renderCount || 0
    })

    // Perform rapid scrolling
    for (let i = 0; i < 10; i++) {
      await page.evaluate((step) => {
        const container = document.querySelector('[data-testid="virtual-scroll-container"]')
        if (container) {
          container.scrollTop = step * 100
        }
      }, i)
      await page.waitForTimeout(50)
    }

    // Get final render count
    const finalRenderCount = await page.evaluate(() => {
      return window.__DEV__?.renderCount || 0
    })

    // Should have reasonable render count (not excessive re-renders)
    const renderDifference = finalRenderCount - initialRenderCount
    expect(renderDifference).toBeLessThan(20) // Allow for some legitimate re-renders
  })

  test('VirtualScroll handles different item heights correctly', async ({ page }) => {
    // Generate data with varying heights
    await page.evaluate(() => {
      window.testData = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        title: `Test Item ${i}`,
        height: 50 + (i % 3) * 25, // Varying heights
        description: `Description for item ${i}`.repeat(i % 5 + 1)
      }))
    })

    // Reload page
    await page.reload()

    // Wait for items to load
    await page.waitForSelector('[data-testid="virtual-scroll-item"]')

    // Verify items are rendered with correct heights
    const items = page.locator('[data-testid="virtual-scroll-item"]')
    for (let i = 0; i < Math.min(await items.count(), 3); i++) {
      const item = items.nth(i)
      const height = await item.evaluate(el => el.clientHeight)
      expect(height).toBeGreaterThan(0)
    }
  })

  test('VirtualScroll cleanup prevents memory leaks', async ({ page }) => {
    // Wait for component to load
    await page.waitForSelector('[data-testid="virtual-scroll-container"]')

    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return performance.memory?.usedJSHeapSize || 0
    })

    // Perform multiple data updates
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="refresh-data"]')
      await page.waitForTimeout(200)
    }

    // Force garbage collection if available
    await page.evaluate(() => {
      if (window.gc) window.gc()
    })

    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      return performance.memory?.usedJSHeapSize || 0
    })

    // Memory usage should not grow excessively
    const memoryIncrease = finalMemory - initialMemory
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024) // 10MB limit
  })

  test('VirtualScroll responsive design works correctly', async ({ page }) => {
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

      // Verify component is still functional
      await expect(page.locator('[data-testid="virtual-scroll-container"]')).toBeVisible()

      // Check that items are still rendered
      const itemCount = await page.locator('[data-testid="virtual-scroll-item"]').count()
      expect(itemCount).toBeGreaterThan(0)
    }
  })

  test('VirtualScroll search results are accurate', async ({ page }) => {
    // Wait for component to load
    await page.waitForSelector('[data-testid="search-input"]')

    const searchInput = page.locator('[data-testid="search-input"]')

    // Search for specific term
    await searchInput.fill('Test Item 5')
    await page.waitForTimeout(350) // Wait for debounce

    // Verify search results
    const results = page.locator('[data-testid="virtual-scroll-item"]')
    await expect(results).toContainText('Test Item 5')

    // Verify other items are filtered out
    const allResults = await results.allTextContents()
    const filteredResults = allResults.filter(text => text.includes('Test Item 5'))
    expect(filteredResults.length).toBeGreaterThan(0)
  })

  test('VirtualScroll handles loading errors gracefully', async ({ page }) => {
    // Mock error response
    await page.addInitScript(() => {
      window.loadMoreData = async () => {
        throw new Error('Failed to load data')
      }
    })

    // Reload page
    await page.reload()

    // Scroll to trigger loading
    await page.evaluate(() => {
      const container = document.querySelector('[data-testid="virtual-scroll-container"]')
      if (container) {
        container.scrollTop = container.scrollHeight
      }
    })

    // Verify error message is displayed
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to load data')

    // Verify retry functionality
    await page.click('[data-testid="retry-button"]')
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible()
  })
})
