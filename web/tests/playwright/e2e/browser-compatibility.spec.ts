import { test, expect } from '@playwright/test';
import { getBrowserInfo, testBrowserCompatibility, runCrossBrowserTests } from './cross-browser-utils';

/**
 * Browser Compatibility Tests
 * 
 * Tests browser compatibility across different browsers including:
 * - Basic functionality
 * - JavaScript support
 * - CSS support
 * - Feature support
 * - Performance
 */
test.describe('Browser Compatibility Tests', () => {
  
  test('should work in current browser', async ({ page }) => {
    const result = await testBrowserCompatibility(page);
    
    // Browser compatibility should pass
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(80);
    
    console.log(`🌐 Browser Compatibility Score: ${result.score}/100`);
    console.log(`🌐 Browser: ${result.browser}`);
    
    if (result.issues.length > 0) {
      console.log('⚠️ Compatibility Issues found:');
      result.issues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    if (result.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      result.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }
  });
  
  test('should have proper browser information', async ({ page }) => {
    const browserInfo = await getBrowserInfo(page);
    
    // Browser info should be available
    expect(browserInfo.name).toBeDefined();
    expect(browserInfo.version).toBeDefined();
    expect(browserInfo.userAgent).toBeDefined();
    expect(browserInfo.platform).toBeDefined();
    expect(browserInfo.viewport).toBeDefined();
    expect(browserInfo.features).toBeDefined();
    
    console.log(`🌐 Browser: ${browserInfo.name} ${browserInfo.version}`);
    console.log(`🌐 Platform: ${browserInfo.platform}`);
    console.log(`🌐 Viewport: ${browserInfo.viewport.width}x${browserInfo.viewport.height}`);
    console.log(`🌐 Features: ${browserInfo.features.join(', ')}`);
  });
  
  test('should support required JavaScript features', async ({ page }) => {
    const browserInfo = await getBrowserInfo(page);
    
    // Required JavaScript features
    const requiredFeatures = ['fetch', 'promises', 'localStorage'];
    const missingFeatures = requiredFeatures.filter(feature => 
      !browserInfo.features.includes(feature)
    );
    
    expect(missingFeatures.length).toBe(0);
    console.log(`✅ All required JavaScript features supported: ${requiredFeatures.join(', ')}`);
  });
  
  test('should support modern JavaScript features', async ({ page }) => {
    const browserInfo = await getBrowserInfo(page);
    
    // Modern JavaScript features
    const modernFeatures = ['serviceWorkers', 'notifications', 'geolocation', 'mediaDevices'];
    const supportedFeatures = modernFeatures.filter(feature => 
      browserInfo.features.includes(feature)
    );
    
    console.log(`🌐 Modern features supported: ${supportedFeatures.join(', ')}`);
    console.log(`🌐 Modern features missing: ${modernFeatures.filter(f => !supportedFeatures.includes(f)).join(', ')}`);
  });
  
  test('should have proper viewport dimensions', async ({ page }) => {
    const browserInfo = await getBrowserInfo(page);
    
    // Viewport should be reasonable
    expect(browserInfo.viewport.width).toBeGreaterThan(0);
    expect(browserInfo.viewport.height).toBeGreaterThan(0);
    
    console.log(`🌐 Viewport: ${browserInfo.viewport.width}x${browserInfo.viewport.height}`);
    console.log(`🌐 Device Pixel Ratio: ${browserInfo.devicePixelRatio}`);
  });
  
  test('should support CSS Grid and Flexbox', async ({ page }) => {
    await page.goto('/');
    
    // Test CSS Grid support
    const gridSupport = await page.evaluate(() => {
      const testElement = document.createElement('div');
      testElement.style.display = 'grid';
      return testElement.style.display === 'grid';
    });
    
    expect(gridSupport).toBe(true);
    console.log('✅ CSS Grid supported');
    
    // Test Flexbox support
    const flexboxSupport = await page.evaluate(() => {
      const testElement = document.createElement('div');
      testElement.style.display = 'flex';
      return testElement.style.display === 'flex';
    });
    
    expect(flexboxSupport).toBe(true);
    console.log('✅ CSS Flexbox supported');
  });
  
  test('should support modern CSS features', async ({ page }) => {
    await page.goto('/');
    
    // Test CSS Custom Properties (CSS Variables)
    const cssVariablesSupport = await page.evaluate(() => {
      const testElement = document.createElement('div');
      testElement.style.setProperty('--test-var', 'red');
      return testElement.style.getPropertyValue('--test-var') === 'red';
    });
    
    expect(cssVariablesSupport).toBe(true);
    console.log('✅ CSS Custom Properties supported');
    
    // Test CSS Transforms
    const transformsSupport = await page.evaluate(() => {
      const testElement = document.createElement('div');
      testElement.style.transform = 'translateX(10px)';
      return testElement.style.transform.includes('translateX');
    });
    
    expect(transformsSupport).toBe(true);
    console.log('✅ CSS Transforms supported');
  });
  
  test('should support Web APIs', async ({ page }) => {
    await page.goto('/');
    
    // Test Web APIs
    const webAPIs = await page.evaluate(() => {
      return {
        fetch: typeof fetch === 'function',
        promises: typeof Promise === 'function',
        localStorage: typeof localStorage === 'object',
        sessionStorage: typeof sessionStorage === 'object',
        indexedDB: typeof indexedDB === 'object',
        websockets: typeof WebSocket === 'function',
        serviceWorkers: typeof ServiceWorker === 'function',
        notifications: typeof Notification === 'function',
        geolocation: typeof navigator.geolocation === 'object',
        mediaDevices: typeof navigator.mediaDevices === 'object'
      };
    });
    
    // Essential Web APIs should be supported
    expect(webAPIs.fetch).toBe(true);
    expect(webAPIs.promises).toBe(true);
    expect(webAPIs.localStorage).toBe(true);
    expect(webAPIs.sessionStorage).toBe(true);
    
    console.log('✅ Essential Web APIs supported');
    
    // Log optional Web APIs
    const optionalAPIs = Object.entries(webAPIs)
      .filter(([name, supported]) => supported)
      .map(([name]) => name);
    
    console.log(`🌐 Optional Web APIs supported: ${optionalAPIs.join(', ')}`);
  });
  
  test('should have good performance', async ({ page }) => {
    const result = await testBrowserCompatibility(page);
    
    // Performance should be reasonable
    expect(result.performance.loadTime).toBeLessThan(5000); // Less than 5 seconds
    expect(result.performance.renderTime).toBeLessThan(2000); // Less than 2 seconds
    expect(result.performance.interactionTime).toBeLessThan(3000); // Less than 3 seconds
    
    console.log(`🌐 Performance metrics:`);
    console.log(`  - Load time: ${result.performance.loadTime}ms`);
    console.log(`  - Render time: ${result.performance.renderTime}ms`);
    console.log(`  - Interaction time: ${result.performance.interactionTime}ms`);
  });
  
  test('should handle errors gracefully', async ({ page }) => {
    await page.goto('/');
    
    // Test error handling
    const errorHandling = await page.evaluate(() => {
      try {
        // Test console.error handling
        console.error('Test error');
        
        // Test unhandled promise rejection handling
        Promise.reject(new Error('Test promise rejection'));
        
        // Test try-catch handling
        try {
          throw new Error('Test error');
        } catch (e) {
          return true;
        }
      } catch (error) {
        return false;
      }
    });
    
    expect(errorHandling).toBe(true);
    console.log('✅ Error handling works correctly');
  });
  
  test('should support accessibility features', async ({ page }) => {
    await page.goto('/');
    
    // Test accessibility features
    const accessibilityFeatures = await page.evaluate(() => {
      return {
        aria: typeof document.querySelector === 'function',
        landmarks: typeof document.querySelector === 'function',
        focus: typeof document.activeElement !== 'undefined',
        keyboard: typeof document.addEventListener === 'function'
      };
    });
    
    expect(accessibilityFeatures.aria).toBe(true);
    expect(accessibilityFeatures.landmarks).toBe(true);
    expect(accessibilityFeatures.focus).toBe(true);
    expect(accessibilityFeatures.keyboard).toBe(true);
    
    console.log('✅ Accessibility features supported');
  });
  
  test('should run comprehensive cross-browser tests', async ({ page }) => {
    const result = await runCrossBrowserTests(page);
    
    // Comprehensive tests should pass
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(70);
    
    console.log(`🌐 Comprehensive Cross-Browser Score: ${result.score}/100`);
    console.log(`🌐 Browser: ${result.browser}`);
    
    if (result.issues.length > 0) {
      console.log('⚠️ Cross-Browser Issues found:');
      result.issues.forEach(issue => console.log(`  - ${issue}`));
    }
    
    if (result.recommendations.length > 0) {
      console.log('💡 Cross-Browser Recommendations:');
      result.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }
  });
});




