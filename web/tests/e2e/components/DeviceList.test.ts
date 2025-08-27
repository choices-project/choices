import { test, expect } from '@playwright/test'

/**
 * Comprehensive DeviceList Component Testing
 * 
 * Tests the recently optimized DeviceList component for:
 * - React Hooks stability and performance
 * - Device management functionality
 * - Accessibility compliance
 * - Error handling and user feedback
 * - QR code generation and display
 */

test.describe('DeviceList Component', () => {
  test.beforeEach(async ({ page }) => {
    // Mock WebAuthn API for testing
    await page.addInitScript(() => {
      // Mock getUserCredentials
      window.getUserCredentials = async (userId: string) => ({
        success: true,
        credentials: [
          {
            id: 'device-1',
            name: 'Test iPhone',
            deviceInfo: { deviceType: 'ios', platform: 'apple', browser: 'Safari' },
            lastUsed: '2024-12-19T10:00:00Z',
            isCurrent: true,
            authenticatorType: 'platform'
          },
          {
            id: 'device-2',
            name: 'Test MacBook',
            deviceInfo: { deviceType: 'macos', platform: 'apple', browser: 'Chrome' },
            lastUsed: '2024-12-18T15:30:00Z',
            isCurrent: false,
            authenticatorType: 'cross-platform'
          }
        ]
      })

      // Mock removeCredential
      window.removeCredential = async (deviceId: string) => ({
        success: true
      })

      // Mock generateQRCodeData
      window.generateQRCodeData = async (userId: string) => ({
        success: true,
        qrData: 'test-qr-code-data-for-device-setup'
      })

      // Track render count for performance testing
      window.__DEV__ = {
        renderCount: 0,
        searchCallCount: 0
      }
    })

    // Navigate to device management page
    await page.goto('/test-device-list')
  })

  test('DeviceList loads and displays devices correctly', async ({ page }) => {
    // Wait for devices to load
    await page.waitForSelector('[data-testid="device-item"]', { timeout: 5000 })

    // Verify devices are displayed
    const deviceItems = page.locator('[data-testid="device-item"]')
    await expect(deviceItems).toHaveCount(2)

    // Check first device (current device)
    const firstDevice = deviceItems.first()
    await expect(firstDevice.locator('[data-testid="device-name"]')).toContainText('Test iPhone')
    await expect(firstDevice.locator('[data-testid="current-badge"]')).toBeVisible()

    // Check second device (non-current)
    const secondDevice = deviceItems.nth(1)
    await expect(secondDevice.locator('[data-testid="device-name"]')).toContainText('Test MacBook')
    await expect(secondDevice.locator('[data-testid="remove-button"]')).toBeVisible()
  })

  test('DeviceList maintains stable React Hooks references', async ({ page }) => {
    // Wait for initial load
    await page.waitForSelector('[data-testid="device-item"]')

    // Get initial render count
    const initialRenderCount = await page.evaluate(() => {
      return window.__DEV__?.renderCount || 0
    })

    // Trigger multiple state changes
    await page.click('[data-testid="refresh-devices"]')
    await page.waitForTimeout(100)
    await page.click('[data-testid="refresh-devices"]')
    await page.waitForTimeout(100)

    // Get final render count
    const finalRenderCount = await page.evaluate(() => {
      return window.__DEV__?.renderCount || 0
    })

    // Should have minimal re-renders (React Hooks stability)
    const renderDifference = finalRenderCount - initialRenderCount
    expect(renderDifference).toBeLessThan(5) // Allow for some legitimate re-renders
  })

  test('DeviceList properly removes devices', async ({ page }) => {
    // Wait for devices to load
    await page.waitForSelector('[data-testid="device-item"]')

    // Find remove button for non-current device
    const removeButton = page.locator('[data-testid="remove-button"]').first()
    await removeButton.click()

    // Confirm removal dialog should appear
    await expect(page.locator('[data-testid="confirm-remove-dialog"]')).toBeVisible()

    // Confirm removal
    await page.click('[data-testid="confirm-remove-button"]')

    // Verify device is removed from list
    await expect(page.locator('[data-testid="device-item"]')).toHaveCount(1)

    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Device removed successfully')
  })

  test('DeviceList shows QR code for device setup', async ({ page }) => {
    // Wait for devices to load
    await page.waitForSelector('[data-testid="device-item"]')

    // Click QR code button
    const qrButton = page.locator('[data-testid="qr-code-button"]').first()
    await qrButton.click()

    // Verify QR code modal appears
    await expect(page.locator('[data-testid="qr-code-modal"]')).toBeVisible()

    // Check QR code data is displayed
    await expect(page.locator('[data-testid="qr-code-data"]')).toContainText('test-qr-code-data-for-device-setup')

    // Test copy functionality
    await page.click('[data-testid="copy-qr-code"]')
    await expect(page.locator('[data-testid="copy-success"]')).toBeVisible()

    // Close modal
    await page.click('[data-testid="close-modal"]')
    await expect(page.locator('[data-testid="qr-code-modal"]')).not.toBeVisible()
  })

  test('DeviceList handles errors gracefully', async ({ page }) => {
    // Mock error response
    await page.addInitScript(() => {
      window.getUserCredentials = async () => ({
        success: false,
        error: 'Failed to load devices'
      })
    })

    // Reload page to trigger error
    await page.reload()

    // Verify error message is displayed
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to load devices')

    // Verify retry functionality
    await page.click('[data-testid="retry-button"]')
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible()
  })

  test('DeviceList provides proper accessibility', async ({ page }) => {
    // Wait for devices to load
    await page.waitForSelector('[data-testid="device-item"]')

    // Test keyboard navigation
    await page.keyboard.press('Tab')
    
    // Verify focus indicators
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()

    // Test screen reader support
    const deviceItems = page.locator('[data-testid="device-item"]')
    for (let i = 0; i < await deviceItems.count(); i++) {
      const item = deviceItems.nth(i)
      const ariaLabel = await item.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
      expect(ariaLabel).toContain('device')
    }

    // Test button accessibility
    const buttons = page.locator('button')
    for (let i = 0; i < await buttons.count(); i++) {
      const button = buttons.nth(i)
      const ariaLabel = await button.getAttribute('aria-label')
      if (ariaLabel) {
        expect(ariaLabel).not.toBe('')
      }
    }
  })

  test('DeviceList handles empty state correctly', async ({ page }) => {
    // Mock empty response
    await page.addInitScript(() => {
      window.getUserCredentials = async () => ({
        success: true,
        credentials: []
      })
    })

    // Reload page
    await page.reload()

    // Verify empty state message
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible()
    await expect(page.locator('[data-testid="empty-state"]')).toContainText('No devices found')

    // Verify add device button is available
    await expect(page.locator('[data-testid="add-device-button"]')).toBeVisible()
  })

  test('DeviceList performance is optimized', async ({ page }) => {
    // Measure initial load time
    const startTime = performance.now()
    await page.waitForSelector('[data-testid="device-item"]')
    const loadTime = performance.now() - startTime

    // Should load quickly
    expect(loadTime).toBeLessThan(2000)

    // Check memory usage
    const memoryUsage = await page.evaluate(() => {
      return performance.memory?.usedJSHeapSize || 0
    })

    // Should use reasonable memory
    expect(memoryUsage).toBeLessThan(50 * 1024 * 1024) // 50MB limit
  })

  test('DeviceList handles loading states correctly', async ({ page }) => {
    // Mock slow response
    await page.addInitScript(() => {
      window.getUserCredentials = async () => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        return {
          success: true,
          credentials: []
        }
      }
    })

    // Reload page
    await page.reload()

    // Verify loading indicator appears
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible()

    // Wait for load to complete
    await page.waitForSelector('[data-testid="empty-state"]', { timeout: 5000 })

    // Verify loading indicator disappears
    await expect(page.locator('[data-testid="loading-indicator"]')).not.toBeVisible()
  })

  test('DeviceList device icons are displayed correctly', async ({ page }) => {
    // Wait for devices to load
    await page.waitForSelector('[data-testid="device-item"]')

    // Check device icons are present
    const deviceIcons = page.locator('[data-testid="device-icon"]')
    await expect(deviceIcons).toHaveCount(2)

    // Verify icons have proper accessibility
    for (let i = 0; i < await deviceIcons.count(); i++) {
      const icon = deviceIcons.nth(i)
      const ariaHidden = await icon.getAttribute('aria-hidden')
      expect(ariaHidden).toBe('true') // Icons should be decorative
    }
  })

  test('DeviceList add device functionality works', async ({ page }) => {
    // Wait for devices to load
    await page.waitForSelector('[data-testid="device-item"]')

    // Click add device button
    await page.click('[data-testid="add-device-button"]')

    // Verify navigation to device setup
    await expect(page).toHaveURL(/.*\/device-setup.*/)
  })
})
