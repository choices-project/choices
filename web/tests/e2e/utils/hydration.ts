/**
 * Hydration Test Utilities - V2
 * 
 * This file provides utilities for testing hydration issues in Next.js,
 * including client-server mismatch detection and hydration error handling.
 * 
 * Created: January 21, 2025
 * Status: Active - Hydration testing infrastructure
 * Version: V2 - Modernized for current testing patterns
 */

import { type Page } from '@playwright/test';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface HydrationError {
  message: string;
  stack?: string;
  component?: string;
  props?: Record<string, any>;
}

export interface HydrationCheckResult {
  isHydrated: boolean;
  hasErrors: boolean;
  errors: HydrationError[];
  timestamp: number;
}

// ============================================================================
// HYDRATION DETECTION
// ============================================================================

/**
 * Check if the page is properly hydrated
 */
export async function checkHydrationStatus(page: Page): Promise<HydrationCheckResult> {
  const result: HydrationCheckResult = {
    isHydrated: false,
    hasErrors: false,
    errors: [],
    timestamp: Date.now(),
  };

  try {
    // Check for hydration errors in console
    const consoleErrors = await page.evaluate(() => {
      const errors: HydrationError[] = [];
      
      // Check for React hydration errors
      if (window.console && window.console.error) {
        const originalError = window.console.error;
        window.console.error = (...args: any[]) => {
          const message = args.join(' ');
          if (message.includes('hydration') || message.includes('Hydration')) {
            errors.push({
              message,
              component: 'Unknown',
            });
          }
          originalError.apply(console, args);
        };
      }
      
      return errors;
    });

    result.errors = consoleErrors;
    result.hasErrors = consoleErrors.length > 0;

    // Check if React is hydrated
    const isHydrated = await page.evaluate(() => {
      // Check if React DevTools are available (indicates hydration)
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        return true;
      }
      
      // Check for hydration markers
      const hydrationMarkers = document.querySelectorAll('[data-hydrated]');
      return hydrationMarkers.length > 0;
    });

    result.isHydrated = isHydrated;

  } catch (error) {
    result.errors.push({
      message: `Hydration check failed: ${error}`,
      component: 'HydrationChecker',
    });
    result.hasErrors = true;
  }

  return result;
}

/**
 * Wait for page to be fully hydrated
 */
export async function waitForHydration(page: Page, timeout = 10000): Promise<HydrationCheckResult> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const result = await checkHydrationStatus(page);
    
    if (result.isHydrated && !result.hasErrors) {
      return result;
    }
    
    // Wait a bit before checking again
    await page.waitForTimeout(100);
  }
  
  // Return final result even if timeout
  return await checkHydrationStatus(page);
}

// ============================================================================
// HYDRATION ERROR HANDLING
// ============================================================================

/**
 * Capture hydration errors from the page
 */
export async function captureHydrationErrors(page: Page): Promise<HydrationError[]> {
  const errors: HydrationError[] = [];
  
  // Listen for console errors
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('hydration') || text.includes('Hydration')) {
        errors.push({
          message: text,
          component: 'Console',
        });
      }
    }
  });
  
  // Listen for page errors
  page.on('pageerror', (error) => {
    if (error.message.includes('hydration') || error.message.includes('Hydration')) {
      errors.push({
        message: error.message,
        stack: error.stack,
        component: 'PageError',
      });
    }
  });
  
  return errors;
}

/**
 * Check for common hydration issues
 */
export async function checkCommonHydrationIssues(page: Page): Promise<HydrationError[]> {
  const issues: HydrationError[] = [];
  
  // Check for client-server mismatch
  const hasMismatch = await page.evaluate(() => {
    // Check for React hydration warnings
    const warnings = document.querySelectorAll('[data-react-hydration-warning]');
    return warnings.length > 0;
  });
  
  if (hasMismatch) {
    issues.push({
      message: 'Client-server mismatch detected',
      component: 'HydrationMismatch',
    });
  }
  
  // Check for missing hydration markers
  const hasHydrationMarkers = await page.evaluate(() => {
    const markers = document.querySelectorAll('[data-hydrated]');
    return markers.length > 0;
  });
  
  if (!hasHydrationMarkers) {
    issues.push({
      message: 'No hydration markers found',
      component: 'HydrationMarkers',
    });
  }
  
  // Check for unhydrated components
  const unhydratedComponents = await page.evaluate(() => {
    const components = document.querySelectorAll('[data-unhydrated]');
    return components.length;
  });
  
  if (unhydratedComponents > 0) {
    issues.push({
      message: `${unhydratedComponents} unhydrated components found`,
      component: 'UnhydratedComponents',
    });
  }
  
  return issues;
}

// ============================================================================
// HYDRATION TESTING UTILITIES
// ============================================================================

/**
 * Test hydration with different user agents
 */
export async function testHydrationWithUserAgent(page: Page, userAgent: string): Promise<HydrationCheckResult> {
  await page.setExtraHTTPHeaders({
    'User-Agent': userAgent,
  });
  
  await page.reload();
  return await waitForHydration(page);
}

/**
 * Test hydration with different viewport sizes
 */
export async function testHydrationWithViewport(page: Page, width: number, height: number): Promise<HydrationCheckResult> {
  await page.setViewportSize({ width, height });
  await page.reload();
  return await waitForHydration(page);
}

/**
 * Test hydration with different network conditions
 */
export async function testHydrationWithNetworkConditions(page: Page, conditions: any): Promise<HydrationCheckResult> {
  await page.route('**/*', (route) => {
    // Simulate network conditions
    setTimeout(() => {
      route.continue();
    }, conditions.delay || 0);
  });
  
  await page.reload();
  return await waitForHydration(page);
}

// ============================================================================
// HYDRATION ASSERTIONS
// ============================================================================

/**
 * Assert that page is properly hydrated
 */
export async function assertPageHydrated(page: Page): Promise<void> {
  const result = await checkHydrationStatus(page);
  
  if (!result.isHydrated) {
    throw new Error('Page is not hydrated');
  }
  
  if (result.hasErrors) {
    throw new Error(`Hydration errors found: ${result.errors.map(e => e.message).join(', ')}`);
  }
}

/**
 * Assert that page has no hydration errors
 */
export async function assertNoHydrationErrors(page: Page): Promise<void> {
  const result = await checkHydrationStatus(page);
  
  if (result.hasErrors) {
    throw new Error(`Hydration errors found: ${result.errors.map(e => e.message).join(', ')}`);
  }
}

/**
 * Assert that specific component is hydrated
 */
export async function assertComponentHydrated(page: Page, selector: string): Promise<void> {
  const isHydrated = await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    return element && element.hasAttribute('data-hydrated');
  }, selector);
  
  if (!isHydrated) {
    throw new Error(`Component ${selector} is not hydrated`);
  }
}

// ============================================================================
// HYDRATION DEBUGGING
// ============================================================================

/**
 * Enable hydration debugging
 */
export async function enableHydrationDebugging(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Enable React hydration debugging
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__.supportsFiber = true;
    }
    
    // Add hydration markers to components
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            if (element.hasAttribute('data-reactroot')) {
              element.setAttribute('data-hydrated', 'true');
            }
          }
        });
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

/**
 * Get hydration debug information
 */
export async function getHydrationDebugInfo(page: Page): Promise<any> {
  return await page.evaluate(() => {
    const info: any = {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      hydrationMarkers: document.querySelectorAll('[data-hydrated]').length,
      unhydratedComponents: document.querySelectorAll('[data-unhydrated]').length,
      reactRoots: document.querySelectorAll('[data-reactroot]').length,
    };
    
    // Check for React DevTools
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      info.reactDevTools = true;
    }
    
    return info;
  });
}
