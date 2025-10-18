import { type Page, expect } from '@playwright/test';

/**
 * Cross-Browser Testing Utilities
 * 
 * Provides utilities for cross-browser testing including:
 * - Browser detection
 * - Feature support testing
 * - Compatibility validation
 * - Performance comparison
 */

export interface BrowserInfo {
  name: string;
  version: string;
  userAgent: string;
  platform: string;
  viewport: { width: number; height: number };
  devicePixelRatio: number;
  features: string[];
}

export interface CrossBrowserTestResult {
  browser: string;
  passed: boolean;
  score: number; // 0-100
  issues: string[];
  recommendations: string[];
  performance: {
    loadTime: number;
    renderTime: number;
    interactionTime: number;
  };
}

export interface CrossBrowserMetrics {
  overall: CrossBrowserTestResult;
  chromium: CrossBrowserTestResult;
  firefox: CrossBrowserTestResult;
  webkit: CrossBrowserTestResult;
  edge: CrossBrowserTestResult;
}

/**
 * Get browser information
 */
export async function getBrowserInfo(page: Page): Promise<BrowserInfo> {
  const browserInfo = await page.evaluate(() => {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    const devicePixelRatio = window.devicePixelRatio;
    
    // Detect browser
    let browserName = 'unknown';
    let browserVersion = 'unknown';
    
    if (userAgent.includes('Chrome')) {
      browserName = 'Chrome';
      const match = userAgent.match(/Chrome\/(\d+)/);
      browserVersion = match ? match[1] || 'unknown' : 'unknown';
    } else if (userAgent.includes('Firefox')) {
      browserName = 'Firefox';
      const match = userAgent.match(/Firefox\/(\d+)/);
      browserVersion = match ? match[1] || 'unknown' : 'unknown';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browserName = 'Safari';
      const match = userAgent.match(/Version\/(\d+)/);
      browserVersion = match ? match[1] || 'unknown' : 'unknown';
    } else if (userAgent.includes('Edg')) {
      browserName = 'Edge';
      const match = userAgent.match(/Edg\/(\d+)/);
      browserVersion = match ? match[1] || 'unknown' : 'unknown';
    }
    
    // Detect features
    const features = [];
    if (typeof window.fetch === 'function') features.push('fetch');
    if (typeof window.Promise === 'function') features.push('promises');
    if (typeof window.localStorage === 'object') features.push('localStorage');
    if (typeof window.sessionStorage === 'object') features.push('sessionStorage');
    if (typeof window.indexedDB === 'function') features.push('indexedDB');
    if (typeof window.WebSocket === 'function') features.push('websockets');
    if (typeof window.ServiceWorker === 'function') features.push('serviceWorkers');
    if (typeof window.Notification === 'function') features.push('notifications');
    if (typeof window.Geolocation === 'function') features.push('geolocation');
    if (typeof window.MediaDevices === 'function') features.push('mediaDevices');
    if (typeof window.IntersectionObserver === 'function') features.push('intersectionObserver');
    if (typeof window.ResizeObserver === 'function') features.push('resizeObserver');
    if (typeof window.MutationObserver === 'function') features.push('mutationObserver');
    if (typeof window.PerformanceObserver === 'function') features.push('performanceObserver');
    
    return {
      name: browserName,
      version: browserVersion,
      userAgent,
      platform,
      viewport,
      devicePixelRatio,
      features
    };
  });
  
  return browserInfo;
}

/**
 * Test browser compatibility
 */
export async function testBrowserCompatibility(page: Page): Promise<CrossBrowserTestResult> {
  const browserInfo = await getBrowserInfo(page);
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Test 1: Basic functionality
  try {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  } catch (error) {
    issues.push(`Page load failed: ${error}`);
    recommendations.push('Fix page loading issues');
  }
  
  // Test 2: JavaScript functionality
  try {
    const jsWorking = await page.evaluate(() => {
      return typeof window !== 'undefined' && 
             typeof document !== 'undefined' && 
             typeof console !== 'undefined';
    });
    
    if (!jsWorking) {
      issues.push('JavaScript not working properly');
      recommendations.push('Fix JavaScript functionality');
    }
  } catch (error) {
    issues.push(`JavaScript error: ${error}`);
    recommendations.push('Fix JavaScript errors');
  }
  
  // Test 3: CSS functionality
  try {
    const cssWorking = await page.evaluate(() => {
      const testElement = document.createElement('div');
      testElement.style.color = 'red';
      return testElement.style.color === 'red';
    });
    
    if (!cssWorking) {
      issues.push('CSS not working properly');
      recommendations.push('Fix CSS functionality');
    }
  } catch (error) {
    issues.push(`CSS error: ${error}`);
    recommendations.push('Fix CSS errors');
  }
  
  // Test 4: Feature support
  const requiredFeatures = ['fetch', 'promises', 'localStorage'];
  const missingFeatures = requiredFeatures.filter(feature => 
    !browserInfo.features.includes(feature)
  );
  
  if (missingFeatures.length > 0) {
    issues.push(`Missing features: ${missingFeatures.join(', ')}`);
    recommendations.push('Add polyfills for missing features');
  }
  
  // Test 5: Performance
  const performanceMetrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    return {
      loadTime: navigation.loadEventEnd - navigation.loadEventStart,
      renderTime: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      interactionTime: navigation.loadEventEnd - navigation.fetchStart
    };
  });
  
  // Calculate score
  const score = Math.max(0, 100 - (issues.length * 20));
  
  return {
    browser: browserInfo.name,
    passed: issues.length === 0,
    score,
    issues,
    recommendations,
    performance: performanceMetrics
  };
}

/**
 * Test responsive design
 */
export async function testResponsiveDesign(page: Page): Promise<CrossBrowserTestResult> {
  const browserInfo = await getBrowserInfo(page);
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Test different viewport sizes
  const viewports = [
    { width: 320, height: 568, name: 'Mobile' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 1024, height: 768, name: 'Desktop' },
    { width: 1920, height: 1080, name: 'Large Desktop' }
  ];
  
  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // Check if page is responsive
    const isResponsive = await page.evaluate(() => {
      const body = document.body;
      const bodyWidth = body.scrollWidth;
      const viewportWidth = window.innerWidth;
      
      // Check for horizontal scroll
      return bodyWidth <= viewportWidth;
    });
    
    if (!isResponsive) {
      issues.push(`Not responsive at ${viewport.name} (${viewport.width}x${viewport.height})`);
      recommendations.push(`Fix responsive design for ${viewport.name} viewport`);
    }
  }
  
  // Calculate score
  const score = Math.max(0, 100 - (issues.length * 25));
  
  return {
    browser: browserInfo.name,
    passed: issues.length === 0,
    score,
    issues,
    recommendations,
    performance: {
      loadTime: 0,
      renderTime: 0,
      interactionTime: 0
    }
  };
}

/**
 * Test browser-specific features
 */
export async function testBrowserSpecificFeatures(page: Page): Promise<CrossBrowserTestResult> {
  const browserInfo = await getBrowserInfo(page);
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Test browser-specific features
  if (browserInfo.name === 'Chrome') {
    // Test Chrome-specific features
    const chromeFeatures = await page.evaluate(() => {
      return {
        webGL: typeof WebGLRenderingContext !== 'undefined',
        webGL2: typeof WebGL2RenderingContext !== 'undefined',
        webAudio: typeof AudioContext !== 'undefined',
        webRTC: typeof RTCPeerConnection !== 'undefined'
      };
    });
    
    if (!chromeFeatures.webGL) {
      issues.push('WebGL not supported in Chrome');
      recommendations.push('Add WebGL fallback');
    }
  } else if (browserInfo.name === 'Firefox') {
    // Test Firefox-specific features
    const firefoxFeatures = await page.evaluate(() => {
      return {
        webGL: typeof WebGLRenderingContext !== 'undefined',
        webGL2: typeof WebGL2RenderingContext !== 'undefined',
        webAudio: typeof AudioContext !== 'undefined',
        webRTC: typeof RTCPeerConnection !== 'undefined'
      };
    });
    
    if (!firefoxFeatures.webGL) {
      issues.push('WebGL not supported in Firefox');
      recommendations.push('Add WebGL fallback');
    }
  } else if (browserInfo.name === 'Safari') {
    // Test Safari-specific features
    const safariFeatures = await page.evaluate(() => {
      return {
        webGL: typeof WebGLRenderingContext !== 'undefined',
        webGL2: typeof WebGL2RenderingContext !== 'undefined',
        webAudio: typeof AudioContext !== 'undefined',
        webRTC: typeof RTCPeerConnection !== 'undefined'
      };
    });
    
    if (!safariFeatures.webGL) {
      issues.push('WebGL not supported in Safari');
      recommendations.push('Add WebGL fallback');
    }
  } else if (browserInfo.name === 'Edge') {
    // Test Edge-specific features
    const edgeFeatures = await page.evaluate(() => {
      return {
        webGL: typeof WebGLRenderingContext !== 'undefined',
        webGL2: typeof WebGL2RenderingContext !== 'undefined',
        webAudio: typeof AudioContext !== 'undefined',
        webRTC: typeof RTCPeerConnection !== 'undefined'
      };
    });
    
    if (!edgeFeatures.webGL) {
      issues.push('WebGL not supported in Edge');
      recommendations.push('Add WebGL fallback');
    }
  }
  
  // Calculate score
  const score = Math.max(0, 100 - (issues.length * 20));
  
  return {
    browser: browserInfo.name,
    passed: issues.length === 0,
    score,
    issues,
    recommendations,
    performance: {
      loadTime: 0,
      renderTime: 0,
      interactionTime: 0
    }
  };
}

/**
 * Run comprehensive cross-browser tests
 */
export async function runCrossBrowserTests(page: Page): Promise<CrossBrowserTestResult> {
  console.log('🌐 Running comprehensive cross-browser tests...');
  
  const compatibility = await testBrowserCompatibility(page);
  const responsive = await testResponsiveDesign(page);
  const features = await testBrowserSpecificFeatures(page);
  
  // Combine results
  const allIssues = [...compatibility.issues, ...responsive.issues, ...features.issues];
  const allRecommendations = [...compatibility.recommendations, ...responsive.recommendations, ...features.recommendations];
  
  const overallScore = Math.round((compatibility.score + responsive.score + features.score) / 3);
  
  return {
    browser: compatibility.browser,
    passed: allIssues.length === 0,
    score: overallScore,
    issues: allIssues,
    recommendations: allRecommendations,
    performance: compatibility.performance
  };
}

/**
 * Generate cross-browser report
 */
export function generateCrossBrowserReport(metrics: CrossBrowserMetrics): string {
  return `
# Cross-Browser Test Report

## Overall Cross-Browser Score: ${metrics.overall.score}/100

## Browser Compatibility Results

### Chrome: ${metrics.chromium.score}/100
${metrics.chromium.issues.length > 0 ? 
  `**Issues:**\n${metrics.chromium.issues.map(i => `- ${i}`).join('\n')}` : 
  '✅ No issues found'}

### Firefox: ${metrics.firefox.score}/100
${metrics.firefox.issues.length > 0 ? 
  `**Issues:**\n${metrics.firefox.issues.map(i => `- ${i}`).join('\n')}` : 
  '✅ No issues found'}

### Safari: ${metrics.webkit.score}/100
${metrics.webkit.issues.length > 0 ? 
  `**Issues:**\n${metrics.webkit.issues.map(i => `- ${i}`).join('\n')}` : 
  '✅ No issues found'}

### Edge: ${metrics.edge.score}/100
${metrics.edge.issues.length > 0 ? 
  `**Issues:**\n${metrics.edge.issues.map(i => `- ${i}`).join('\n')}` : 
  '✅ No issues found'}

## Performance Comparison
- Chrome: ${metrics.chromium.performance.loadTime}ms load time
- Firefox: ${metrics.firefox.performance.loadTime}ms load time
- Safari: ${metrics.webkit.performance.loadTime}ms load time
- Edge: ${metrics.edge.performance.loadTime}ms load time

## Recommendations
${metrics.overall.recommendations.map(r => `- ${r}`).join('\n')}

## Cross-Browser Status
${metrics.overall.passed ? '🟢 COMPATIBLE' : '🔴 COMPATIBILITY ISSUES DETECTED'}
`;
}




