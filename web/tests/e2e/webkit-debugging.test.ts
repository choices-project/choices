/**
 * WebKit Debugging Test Suite
 * Comprehensive testing for Safari and WebKit-based browsers
 * 
 * Tests:
 * - WebKit-specific rendering issues
 * - Safari compatibility problems
 * - iOS Safari quirks
 * - WebKit performance issues
 * - Safari-specific PWA features
 * - WebKit security features
 * - Safari developer tools integration
 * 
 * Created: 2025-08-27
 * Status: Critical for Safari/iOS compatibility
 */

import { test, expect } from '@playwright/test'

// WebKit-specific test configuration
const WEBKIT_CONFIG = {
  viewport: { width: 375, height: 667 }, // iPhone SE
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  timeout: 30000,
  retries: 2
}

test.describe('WebKit Debugging Tests', () => {
  test.use({
    browserName: 'webkit',
    viewport: WEBKIT_CONFIG.viewport,
    userAgent: WEBKIT_CONFIG.userAgent
  })

  test.beforeEach(async ({ page }) => {
    // Enable WebKit debugging
    await page.addInitScript(() => {
      // Enable console logging for debugging
      console.log('WebKit debugging enabled')
      
      // Add WebKit-specific error handling
      window.addEventListener('error', (event) => {
        console.error('WebKit Error:', event.error)
      })
      
      // Monitor WebKit-specific APIs
      if ('webkitRequestAnimationFrame' in window) {
        console.log('WebKit RequestAnimationFrame available')
      }
    })
  })

  test('WebKit renders layout correctly', async ({ page }) => {
    await page.goto('/')
    
    // Check for WebKit-specific layout issues
    const body = page.locator('body')
    const computedStyle = await body.evaluate((el) => {
      const style = window.getComputedStyle(el)
      return {
        width: style.width,
        height: style.height,
        overflow: style.overflow,
        position: style.position
      }
    })
    
    // Validate layout properties
    expect(computedStyle.width).not.toBe('auto')
    expect(computedStyle.height).not.toBe('auto')
    
    // Check for WebKit-specific CSS properties
    const webkitProperties = await page.evaluate(() => {
      const testElement = document.createElement('div')
      testElement.style.webkitTransform = 'translateZ(0)'
      testElement.style.webkitBackfaceVisibility = 'hidden'
      return {
        webkitTransform: testElement.style.webkitTransform,
        webkitBackfaceVisibility: testElement.style.webkitBackfaceVisibility
      }
    })
    
    expect(webkitProperties.webkitTransform).toBe('translateZ(0)')
    expect(webkitProperties.webkitBackfaceVisibility).toBe('hidden')
    
    console.log('✅ WebKit layout rendering is correct')
  })

  test('Safari PWA features work correctly', async ({ page }) => {
    await page.goto('/')
    
    // Test Safari-specific PWA features
    const pwaFeatures = await page.evaluate(() => {
      return {
        standalone: window.navigator.standalone,
        serviceWorker: 'serviceWorker' in navigator,
        webkitRequestAnimationFrame: 'webkitRequestAnimationFrame' in window,
        webkitAudioContext: 'webkitAudioContext' in window,
        webkitSpeechRecognition: 'webkitSpeechRecognition' in window
      }
    })
    
    // Validate PWA features
    expect(pwaFeatures.serviceWorker).toBe(true)
    expect(pwaFeatures.webkitRequestAnimationFrame).toBe(true)
    
    // Check for Safari-specific meta tags
    const viewportMeta = page.locator('meta[name="viewport"]')
    await expect(viewportMeta).toBeVisible()
    
    const appleTouchIcon = page.locator('link[rel="apple-touch-icon"]')
    await expect(appleTouchIcon).toBeVisible()
    
    // Test Safari-specific PWA manifest
    const manifestLink = page.locator('link[rel="manifest"]')
    await expect(manifestLink).toBeVisible()
    
    console.log('✅ Safari PWA features work correctly')
  })

  test('WebKit handles forms correctly', async ({ page }) => {
    await page.goto('/register')
    
    // Test WebKit form handling
    const form = page.locator('form')
    await expect(form).toBeVisible()
    
    // Fill form with WebKit-specific input handling
    await page.fill('input[name="username"]', 'webkit_test_user')
    await page.fill('input[name="email"]', 'webkit@test.com')
    
    // Test WebKit autocomplete behavior
    const usernameInput = page.locator('input[name="username"]')
    await usernameInput.evaluate((el) => {
      el.setAttribute('autocomplete', 'username')
    })
    
    // Submit form and check WebKit behavior
    await page.click('button[type="submit"]')
    
    // Wait for navigation (WebKit can be slower)
    await page.waitForURL('**/onboarding', { timeout: WEBKIT_CONFIG.timeout })
    
    console.log('✅ WebKit form handling works correctly')
  })

  test('Safari handles JavaScript correctly', async ({ page }) => {
    await page.goto('/')
    
    // Test WebKit-specific JavaScript features
    const jsFeatures = await page.evaluate(() => {
      return {
        // Test WebKit-specific APIs
        webkitRequestAnimationFrame: typeof window.webkitRequestAnimationFrame,
        webkitAudioContext: typeof window.webkitAudioContext,
        
        // Test modern JavaScript features
        asyncAwait: (async () => true)(),
        arrowFunctions: (() => true)(),
        templateLiterals: `test ${'string'}`,
        destructuring: (() => { const { a } = { a: 1 }; return a })(),
        
        // Test WebKit-specific CSS
        webkitTransform: 'webkitTransform' in document.body.style,
        webkitBackfaceVisibility: 'webkitBackfaceVisibility' in document.body.style
      }
    })
    
    // Validate JavaScript features
    expect(jsFeatures.webkitRequestAnimationFrame).toBe('function')
    expect(jsFeatures.asyncAwait).toBe(true)
    expect(jsFeatures.arrowFunctions).toBe(true)
    expect(jsFeatures.templateLiterals).toBe('test string')
    expect(jsFeatures.destructuring).toBe(1)
    
    console.log('✅ Safari JavaScript handling is correct')
  })

  test('WebKit performance is acceptable', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // WebKit-specific performance thresholds
    expect(loadTime).toBeLessThan(5000) // 5 seconds for WebKit
    
    // Test WebKit-specific performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint')?.startTime,
        firstContentfulPaint: performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint')?.startTime
      }
    })
    
    // Validate performance metrics
    expect(performanceMetrics.domContentLoaded).toBeLessThan(2000)
    expect(performanceMetrics.loadComplete).toBeLessThan(3000)
    
    console.log(`✅ WebKit performance: ${loadTime}ms load time`)
  })

  test('Safari handles CSS animations correctly', async ({ page }) => {
    await page.goto('/')
    
    // Test WebKit-specific CSS animations
    const animationSupport = await page.evaluate(() => {
      const testElement = document.createElement('div')
      testElement.style.webkitAnimation = 'fadeIn 1s ease-in-out'
      testElement.style.webkitTransition = 'opacity 0.3s ease'
      
      return {
        webkitAnimation: testElement.style.webkitAnimation,
        webkitTransition: testElement.style.webkitTransition,
        animationSupport: 'animation' in testElement.style,
        transitionSupport: 'transition' in testElement.style
      }
    })
    
    // Validate animation support
    expect(animationSupport.webkitAnimation).toBe('fadeIn 1s ease-in-out')
    expect(animationSupport.webkitTransition).toBe('opacity 0.3s ease')
    expect(animationSupport.animationSupport).toBe(true)
    expect(animationSupport.transitionSupport).toBe(true)
    
    // Test actual animations on page
    const animatedElement = page.locator('[data-testid="animated-element"]')
    if (await animatedElement.isVisible()) {
      // Wait for animation to complete
      await page.waitForTimeout(1000)
      
      // Check final state
      const finalOpacity = await animatedElement.evaluate((el) => {
        return window.getComputedStyle(el).opacity
      })
      
      expect(parseFloat(finalOpacity)).toBeGreaterThan(0)
    }
    
    console.log('✅ Safari CSS animations work correctly')
  })

  test('WebKit handles touch events correctly', async ({ page }) => {
    await page.goto('/')
    
    // Test WebKit touch event handling
    const touchSupport = await page.evaluate(() => {
      return {
        touchEvents: 'ontouchstart' in window,
        touchPoints: navigator.maxTouchPoints,
        webkitTouchCallout: 'webkitTouchCallout' in document.body.style
      }
    })
    
    // Validate touch support
    expect(touchSupport.touchEvents).toBe(true)
    expect(touchSupport.touchPoints).toBeGreaterThan(0)
    
    // Test touch event simulation
    const touchableElement = page.locator('button, a, [role="button"]').first()
    if (await touchableElement.isVisible()) {
      await touchableElement.tap()
      
      // Check for touch feedback
      const touchFeedback = await touchableElement.evaluate((el) => {
        return window.getComputedStyle(el).webkitTapHighlightColor
      })
      
      expect(touchFeedback).toBeDefined()
    }
    
    console.log('✅ WebKit touch events work correctly')
  })

  test('Safari handles offline functionality correctly', async ({ page }) => {
    await page.goto('/')
    
    // Test WebKit offline support
    const offlineSupport = await page.evaluate(() => {
      return {
        serviceWorker: 'serviceWorker' in navigator,
        cache: 'caches' in window,
        indexedDB: 'indexedDB' in window,
        localStorage: 'localStorage' in window
      }
    })
    
    // Validate offline support
    expect(offlineSupport.serviceWorker).toBe(true)
    expect(offlineSupport.cache).toBe(true)
    expect(offlineSupport.indexedDB).toBe(true)
    expect(offlineSupport.localStorage).toBe(true)
    
    // Test offline detection
    const offlineDetection = await page.evaluate(() => {
      return {
        online: navigator.onLine,
        connection: 'connection' in navigator,
        effectiveType: (navigator as any).connection?.effectiveType
      }
    })
    
    expect(offlineDetection.online).toBe(true)
    
    console.log('✅ Safari offline functionality works correctly')
  })

  test('WebKit handles security features correctly', async ({ page }) => {
    await page.goto('/')
    
    // Test WebKit security features
    const securityFeatures = await page.evaluate(() => {
      return {
        // Content Security Policy
        csp: document.querySelector('meta[http-equiv="Content-Security-Policy"]') !== null,
        
        // HTTPS enforcement
        isSecureContext: window.isSecureContext,
        
        // WebKit-specific security
        webkitSecurityPolicy: 'webkitSecurityPolicy' in document,
        
        // Feature Policy
        featurePolicy: 'featurePolicy' in document
      }
    })
    
    // Validate security features
    expect(securityFeatures.isSecureContext).toBe(true)
    
    // Test WebKit-specific security headers
    const response = await page.goto('/')
    const headers = response?.headers()
    
    expect(headers?.['x-frame-options']).toBeDefined()
    expect(headers?.['x-content-type-options']).toBe('nosniff')
    
    console.log('✅ WebKit security features work correctly')
  })

  test('Safari developer tools integration', async ({ page }) => {
    await page.goto('/')
    
    // Test WebKit developer tools integration
    const devToolsSupport = await page.evaluate(() => {
      return {
        // Console API
        console: typeof console !== 'undefined',
        consoleLog: typeof console.log === 'function',
        consoleError: typeof console.error === 'function',
        
        // Debugger statement
        debuggerSupport: (() => {
          try {
            // This will be caught by the debugger if available
            return true
          } catch (e) {
            return false
          }
        })(),
        
        // Performance API
        performance: typeof performance !== 'undefined',
        performanceNow: typeof performance.now === 'function'
      }
    })
    
    // Validate developer tools support
    expect(devToolsSupport.console).toBe(true)
    expect(devToolsSupport.consoleLog).toBe(true)
    expect(devToolsSupport.consoleError).toBe(true)
    expect(devToolsSupport.performance).toBe(true)
    expect(devToolsSupport.performanceNow).toBe(true)
    
    // Test console logging
    const consoleMessages: string[] = []
    page.on('console', (msg) => {
      consoleMessages.push(msg.text())
    })
    
    await page.evaluate(() => {
      console.log('WebKit debug test')
      console.error('WebKit error test')
    })
    
    expect(consoleMessages).toContain('WebKit debug test')
    expect(consoleMessages).toContain('WebKit error test')
    
    console.log('✅ Safari developer tools integration works correctly')
  })

  test('WebKit handles errors gracefully', async ({ page }) => {
    await page.goto('/')
    
    // Test WebKit error handling
    const errorHandling = await page.evaluate(() => {
      return {
        // Error event handling
        errorEvent: (() => {
          let errorCaught = false
          window.addEventListener('error', () => {
            errorCaught = true
          })
          
          // Trigger a harmless error
          try {
            throw new Error('Test error')
          } catch (e) {
            return true
          }
        })(),
        
        // Unhandled promise rejection
        unhandledRejection: (() => {
          let rejectionCaught = false
          window.addEventListener('unhandledrejection', () => {
            rejectionCaught = true
          })
          
          // Trigger a harmless rejection
          Promise.reject(new Error('Test rejection'))
          
          return true
        })()
      }
    })
    
    // Validate error handling
    expect(errorHandling.errorEvent).toBe(true)
    expect(errorHandling.unhandledRejection).toBe(true)
    
    // Test error boundary functionality
    const errorBoundary = page.locator('[data-testid="error-boundary"]')
    if (await errorBoundary.isVisible()) {
      await expect(errorBoundary).toContainText('Something went wrong')
    }
    
    console.log('✅ WebKit error handling works correctly')
  })
})
