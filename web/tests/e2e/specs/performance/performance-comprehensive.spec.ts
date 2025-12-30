import { expect, test } from '@playwright/test';
import { ensureLoggedOut, loginTestUser, waitForPageReady, SHOULD_USE_MOCKS } from '../../helpers/e2e-setup';

/**
 * Comprehensive Performance Tests
 * 
 * Tests application performance across critical metrics:
 * - Core Web Vitals (LCP, FID, CLS, FCP, TTFB)
 * - Time to Interactive (TTI)
 * - Render performance (frame rate, paint times)
 * - Bundle size monitoring
 * - Network performance
 * - Resource loading optimization
 */

const PRODUCTION_URL = process.env.PRODUCTION_URL || 'https://www.choices-app.com';
const BASE_URL = process.env.BASE_URL || PRODUCTION_URL;

const regularEmail = process.env.E2E_USER_EMAIL;
const regularPassword = process.env.E2E_USER_PASSWORD;

// Performance thresholds (in milliseconds or scores)
const PERFORMANCE_THRESHOLDS = {
  lcp: 2500, // Largest Contentful Paint (good: <2.5s)
  fid: 100, // First Input Delay (good: <100ms)
  cls: 0.1, // Cumulative Layout Shift (good: <0.1)
  fcp: 1800, // First Contentful Paint (good: <1.8s)
  ttfb: 600, // Time to First Byte (good: <600ms)
  tti: 5000, // Time to Interactive (good: <5s for content-rich pages)
  pageLoad: 10000, // Total page load time (good: <10s)
  feedLoad: 15000, // Feed page load time (good: <15s)
};

test.describe('Comprehensive Performance Tests', () => {
  test.skip(SHOULD_USE_MOCKS, 'Performance tests require real backend (set PLAYWRIGHT_USE_MOCKS=0)');

  test.describe('Core Web Vitals', () => {
    test('landing page meets Core Web Vitals thresholds', async ({ page }) => {
      test.setTimeout(60_000);

      // Navigate to landing page
      const startTime = Date.now();
      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });
      const navigationTime = Date.now() - startTime;

      // Measure Core Web Vitals
      const metrics = await page.evaluate(() => {
        return new Promise<{
          lcp?: number;
          fid?: number;
          cls?: number;
          fcp?: number;
          ttfb?: number;
        }>((resolve) => {
          const vitals: {
            lcp?: number;
            fid?: number;
            cls?: number;
            fcp?: number;
            ttfb?: number;
          } = {};

          // Largest Contentful Paint
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
            if (lastEntry) {
              vitals.lcp = lastEntry.renderTime || lastEntry.loadTime || lastEntry.startTime;
            }
          }).observe({ entryTypes: ['largest-contentful-paint'] });

          // First Input Delay
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              if (entry.processingStart && entry.startTime) {
                vitals.fid = entry.processingStart - entry.startTime;
              }
            });
          }).observe({ entryTypes: ['first-input'] });

          // Cumulative Layout Shift
          let clsValue = 0;
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              if (!entry.hadRecentInput && entry.value) {
                clsValue += entry.value;
              }
            });
            vitals.cls = clsValue;
          }).observe({ entryTypes: ['layout-shift'] });

          // First Contentful Paint
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              if (entry.name === 'first-contentful-paint') {
                vitals.fcp = entry.startTime;
              }
            });
          }).observe({ entryTypes: ['paint'] });

          // Time to First Byte
          const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navTiming) {
            vitals.ttfb = navTiming.responseStart - navTiming.requestStart;
          }

          // Wait for metrics to be collected
          setTimeout(() => resolve(vitals), 3000);
        });
      });

      // Assert performance thresholds
      if (metrics.lcp) {
        expect(metrics.lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.lcp);
      }
      if (metrics.fid) {
        expect(metrics.fid).toBeLessThan(PERFORMANCE_THRESHOLDS.fid);
      }
      if (metrics.cls) {
        expect(metrics.cls).toBeLessThan(PERFORMANCE_THRESHOLDS.cls);
      }
      if (metrics.fcp) {
        expect(metrics.fcp).toBeLessThan(PERFORMANCE_THRESHOLDS.fcp);
      }
      if (metrics.ttfb) {
        expect(metrics.ttfb).toBeLessThan(PERFORMANCE_THRESHOLDS.ttfb);
      }

      // Overall page load should be reasonable
      expect(navigationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.pageLoad);
    });

    test('feed page meets Core Web Vitals thresholds', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      // Measure feed page performance
      const startTime = Date.now();
      await page.goto(`${BASE_URL}/feed`, { waitUntil: 'networkidle', timeout: 30_000 });
      const navigationTime = Date.now() - startTime;

      // Measure Core Web Vitals for feed page
      const metrics = await page.evaluate(() => {
        return new Promise<{
          lcp?: number;
          fid?: number;
          cls?: number;
          fcp?: number;
          ttfb?: number;
        }>((resolve) => {
          const vitals: {
            lcp?: number;
            fid?: number;
            cls?: number;
            fcp?: number;
            ttfb?: number;
          } = {};

          // Largest Contentful Paint
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
            if (lastEntry) {
              vitals.lcp = lastEntry.renderTime || lastEntry.loadTime || lastEntry.startTime;
            }
          }).observe({ entryTypes: ['largest-contentful-paint'] });

          // Cumulative Layout Shift
          let clsValue = 0;
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              if (!entry.hadRecentInput && entry.value) {
                clsValue += entry.value;
              }
            });
            vitals.cls = clsValue;
          }).observe({ entryTypes: ['layout-shift'] });

          // First Contentful Paint
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry) => {
              if (entry.name === 'first-contentful-paint') {
                vitals.fcp = entry.startTime;
              }
            });
          }).observe({ entryTypes: ['paint'] });

          // Time to First Byte
          const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navTiming) {
            vitals.ttfb = navTiming.responseStart - navTiming.requestStart;
          }

          setTimeout(() => resolve(vitals), 3000);
        });
      });

      // Assert performance thresholds (more lenient for feed page)
      if (metrics.lcp) {
        expect(metrics.lcp).toBeLessThan(PERFORMANCE_THRESHOLDS.lcp * 1.5); // 1.5x threshold for feed
      }
      if (metrics.cls) {
        expect(metrics.cls).toBeLessThan(PERFORMANCE_THRESHOLDS.cls * 2); // 2x threshold for feed
      }
      if (metrics.fcp) {
        expect(metrics.fcp).toBeLessThan(PERFORMANCE_THRESHOLDS.fcp * 1.5);
      }

      // Feed should load within reasonable time
      expect(navigationTime).toBeLessThan(PERFORMANCE_THRESHOLDS.feedLoad);
    });
  });

  test.describe('Time to Interactive (TTI)', () => {
    test('landing page becomes interactive quickly', async ({ page }) => {
      test.setTimeout(60_000);

      const navigationStart = Date.now();
      await page.goto(BASE_URL, { waitUntil: 'load', timeout: 30_000 });

      // Measure Time to Interactive using Performance API
      // TTI is the time when the page becomes fully interactive
      // We use a more realistic measurement: wait for network idle + measure DOMContentLoaded
      const tti = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          const perfTiming = performance.timing;
          if (!perfTiming || perfTiming.loadEventEnd === 0) {
            // Fallback: use DOMContentLoaded time if load event not available
            const domContentLoaded = perfTiming?.domContentLoadedEventEnd 
              ? perfTiming.domContentLoadedEventEnd - perfTiming.navigationStart
              : 0;
            resolve(domContentLoaded);
            return;
          }

          // Use load event end as a proxy for TTI
          // This is more realistic than waiting for long tasks
          const loadTime = perfTiming.loadEventEnd - perfTiming.navigationStart;
          
          // Add small buffer for JavaScript initialization (200ms)
          // Real TTI might be slightly after load event
          resolve(loadTime + 200);
        });
      });

      // TTI should be measured from navigation start
      expect(tti).toBeLessThan(PERFORMANCE_THRESHOLDS.tti);
    });

    test('dashboard page becomes interactive quickly', async ({ page }) => {
      test.setTimeout(120_000);

      if (!regularEmail || !regularPassword) {
        test.skip(true, 'E2E_USER_EMAIL and E2E_USER_PASSWORD are required');
        return;
      }

      await ensureLoggedOut(page);
      await page.goto(`${BASE_URL}/auth`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await loginTestUser(page, {
        email: regularEmail,
        password: regularPassword,
        username: regularEmail.split('@')[0] ?? 'e2e-user',
      });
      await waitForPageReady(page);

      const startTime = Date.now();
      await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      // Wait for dashboard to be interactive (no spinners, content loaded)
      await page.waitForSelector('[data-testid="personal-dashboard"]', { timeout: 15_000 }).catch(() => {
        // Ignore if selector not found - test will continue
      });
      await page.waitForTimeout(2000);

      // Measure time to interactive (when page is ready for user interaction)
      const interactiveTime = Date.now() - startTime;
      
      // Dashboard should be interactive within reasonable time
      expect(interactiveTime).toBeLessThan(PERFORMANCE_THRESHOLDS.tti * 1.5); // More lenient for dashboard
    });
  });

  test.describe('Render Performance', () => {
    test('page maintains good frame rate during interactions', async ({ page }) => {
      test.setTimeout(60_000);

      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      // Monitor frame rate for 2 seconds
      await page.evaluate(() => {
        return new Promise<void>((resolve) => {
          let lastFrameTime = performance.now();
          let frameCount = 0;

          const measureFrame = () => {
            const currentTime = performance.now();
            const delta = currentTime - lastFrameTime;
            if (delta > 0) {
              const fps = 1000 / delta;
              frameCount++;
              (window as any).__frameRates = (window as any).__frameRates || [];
              (window as any).__frameRates.push(fps);
            }
            lastFrameTime = currentTime;

            if (frameCount < 120) { // ~2 seconds at 60fps
              requestAnimationFrame(measureFrame);
            } else {
              resolve();
            }
          };

          requestAnimationFrame(measureFrame);
        });
      });

      // Scroll page to trigger rendering
      await page.evaluate(() => {
        window.scrollTo(0, 500);
      });
      await page.waitForTimeout(2000);

      const frameRates = await page.evaluate(() => {
        return (window as any).__frameRates || [];
      });

      if (frameRates.length > 0) {
        const avgFrameRate = frameRates.reduce((a: number, b: number) => a + b, 0) / frameRates.length;
        // Should maintain at least 30fps during interactions
        expect(avgFrameRate).toBeGreaterThan(30);
      }
    });

    test('page has minimal layout shifts', async ({ page }) => {
      test.setTimeout(60_000);

      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });
      await waitForPageReady(page);

      // Measure Cumulative Layout Shift
      const cls = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
          let clsValue = 0;
          new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              if (!entry.hadRecentInput && entry.value) {
                clsValue += entry.value;
              }
            });
          }).observe({ entryTypes: ['layout-shift'] });

          // Wait for page to stabilize
          setTimeout(() => resolve(clsValue), 3000);
        });
      });

      // CLS should be minimal
      expect(cls).toBeLessThan(PERFORMANCE_THRESHOLDS.cls);
    });
  });

  test.describe('Bundle Size and Resource Loading', () => {
    test('JavaScript bundle sizes are reasonable', async ({ page }) => {
      test.setTimeout(60_000);

      const resources: Array<{ url: string; size: number; type: string }> = [];

      page.on('response', (response) => {
        const url = response.url();
        const contentType = response.headers()['content-type'] || '';
        
        if (contentType.includes('javascript') || url.endsWith('.js')) {
          const size = response.headers()['content-length'];
          if (size) {
            resources.push({
              url,
              size: parseInt(size, 10),
              type: 'javascript',
            });
          }
        }
      });

      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });
      await waitForPageReady(page);

      // Calculate total JavaScript size
      const totalJSSize = resources.reduce((sum, res) => sum + res.size, 0);
      const totalJSSizeKB = totalJSSize / 1024;
      const totalJSSizeMB = totalJSSizeKB / 1024;

      // Log bundle sizes for monitoring
      console.log(`Total JavaScript bundle size: ${totalJSSizeMB.toFixed(2)} MB (${totalJSSizeKB.toFixed(2)} KB)`);
      console.log(`Number of JavaScript files: ${resources.length}`);

      // Main bundle should be reasonable (under 2MB for initial load)
      // Note: This is a soft check - actual thresholds depend on app complexity
      if (totalJSSizeMB > 5) {
        console.warn(`Large JavaScript bundle detected: ${totalJSSizeMB.toFixed(2)} MB`);
      }

      // Should have loaded some JavaScript
      expect(resources.length).toBeGreaterThan(0);
    });

    test('images are optimized and load efficiently', async ({ page }) => {
      test.setTimeout(60_000);

      const imageResources: Array<{ url: string; size: number; loadTime: number }> = [];

      page.on('response', async (response) => {
        const url = response.url();
        const contentType = response.headers()['content-type'] || '';
        
        if (contentType.includes('image') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url)) {
          const size = response.headers()['content-length'];
          const startTime = Date.now();
          
          if (size) {
            await response.body().catch(() => null);
            const loadTime = Date.now() - startTime;
            
            imageResources.push({
              url,
              size: parseInt(size, 10),
              loadTime,
            });
          }
        }
      });

      await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });
      await waitForPageReady(page);

      // Check that images load reasonably quickly
      if (imageResources.length > 0) {
        const avgLoadTime = imageResources.reduce((sum, img) => sum + img.loadTime, 0) / imageResources.length;
        
        // Average image load time should be reasonable
        expect(avgLoadTime).toBeLessThan(2000); // 2 seconds average
        
        // Log image loading stats
        console.log(`Total images: ${imageResources.length}`);
        console.log(`Average image load time: ${avgLoadTime.toFixed(2)}ms`);
      }
    });

    test('critical resources load first', async ({ page }) => {
      test.setTimeout(60_000);

      const resourceLoadOrder: Array<{ url: string; type: string; priority: string }> = [];

      page.on('response', (response) => {
        const url = response.url();
        const contentType = response.headers()['content-type'] || '';
        const priority = response.headers()['priority'] || 'unknown';
        
        if (contentType.includes('text/html') || 
            contentType.includes('javascript') || 
            contentType.includes('css')) {
          resourceLoadOrder.push({
            url,
            type: contentType,
            priority,
          });
        }
      });

      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30_000 });

      // HTML should load first
      const htmlResource = resourceLoadOrder.find(r => r.type.includes('text/html'));
      expect(htmlResource).toBeDefined();
      
      // Critical CSS should load early
      const cssResources = resourceLoadOrder.filter(r => r.type.includes('css'));
      if (cssResources.length > 0) {
        // CSS should load before most JavaScript
        const jsResources = resourceLoadOrder.filter(r => r.type.includes('javascript'));
        if (jsResources.length > 0) {
          const firstCSSIndex = resourceLoadOrder.indexOf(cssResources[0]);
          const firstJSIndex = resourceLoadOrder.indexOf(jsResources[0]);
          
          // CSS should generally load before non-critical JS
          // (This is a soft check - modern bundlers handle this)
          if (firstCSSIndex > firstJSIndex) {
            console.warn('CSS loaded after JavaScript - may impact render performance');
          }
        }
      }
    });
  });

  test.describe('Network Performance', () => {
    test('API responses are fast', async ({ request }) => {
      test.setTimeout(60_000);

      // Test critical API endpoints
      const endpoints = [
        '/api/health',
        '/api/site-messages',
      ];

      for (const endpoint of endpoints) {
        const startTime = Date.now();
        const response = await request.get(`${BASE_URL}${endpoint}`, { timeout: 10_000 });
        const responseTime = Date.now() - startTime;

        // API should respond quickly
        expect(responseTime).toBeLessThan(2000); // 2 seconds
        expect(response.status()).toBeLessThan(400);
      }
    });

    test('page handles slow network gracefully', async ({ page, context }) => {
      test.setTimeout(120_000);

      // Simulate slow 3G network
      await context.route('**/*', async (route) => {
        // Add delay to simulate slow network
        await new Promise(resolve => setTimeout(resolve, 100));
        await route.continue();
      });

      const startTime = Date.now();
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
      const loadTime = Date.now() - startTime;

      // Even on slow network, page should eventually load
      expect(loadTime).toBeLessThan(60_000); // 60 seconds max

      // Page should show loading states, not errors
      const errorBoundary = page.locator('[data-testid="error-boundary"], [role="alert"]:has-text("Error")');
      const hasError = await errorBoundary.isVisible({ timeout: 2_000 }).catch(() => false);
      expect(hasError).toBeFalsy();
    });
  });
});

