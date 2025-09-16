/**
 * Code Splitting Utilities
 * 
 * Provides utilities for implementing code splitting strategies
 * to reduce initial bundle size and improve loading performance.
 */

import * as React from 'react';
import { ComponentType, lazy } from 'react';
import { performanceMetrics } from '../lib/performance/performance-metrics';

interface CodeSplittingOptions {
  retryCount?: number;
  retryDelay?: number;
  timeout?: number;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

interface RouteSplittingOptions extends CodeSplittingOptions {
  preload?: boolean;
  preloadDelay?: number;
}

/**
 * Create a code-split component with advanced error handling
 */
export function createCodeSplitComponent<T extends ComponentType<Record<string, unknown>>>(
  importFn: () => Promise<{ default: T }>,
  options: CodeSplittingOptions = {}
): ComponentType<Record<string, unknown>> {
  const {
    retryCount = 3,
    retryDelay = 1000,
    timeout = 10000,
    fallback = React.createElement('div', null, 'Loading...'),
    onLoad,
    onError,
  } = options;

  const LazyComponent = lazy(async () => {
    let lastError: Error | null = null;
    
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Component load timeout')), timeout);
    });
    
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const startTime = performance.now();
        
        // Race between import and timeout
        const moduleResult = await Promise.race([
          importFn(),
          timeoutPromise,
        ]);
        
        const loadTime = performance.now() - startTime;
        
        // Track code splitting performance
        performanceMetrics.addMetric('code-split-load', loadTime);
        
        onLoad?.();
        return moduleResult;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retryCount) {
          // Exponential backoff
          const delay = retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    onError?.(lastError!);
    throw lastError;
  });

  return function CodeSplitWrapper(props: Record<string, unknown>) {
    return React.createElement(
      React.Suspense,
      { fallback },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      React.createElement(LazyComponent, props as any)
    );
  };
}

/**
 * Create route-based code splitting
 */
export function createRouteCodeSplitting() {
  const routeCache = new Map<string, Promise<Record<string, unknown>>>();
  const preloadedRoutes = new Set<string>();
  
  return {
    /**
     * Load route component
     */
    loadRoute: (route: string, importFn: () => Promise<Record<string, unknown>>, options: RouteSplittingOptions = {}) => {
      const { preload: _preload = false, preloadDelay: _preloadDelay = 0 } = options;
      
      // Check cache first
      if (routeCache.has(route)) {
        return routeCache.get(route)!;
      }
      
      const loadPromise = (async () => {
        const startTime = performance.now();
        
        try {
          const moduleResult = await importFn();
          const loadTime = performance.now() - startTime;
          
          performanceMetrics.addMetric('route-split-load', loadTime);
          return moduleResult;
        } catch (error) {
          performanceMetrics.addMetric('route-split-error', 1);
          throw error;
        }
      })();
      
      routeCache.set(route, loadPromise);
      return loadPromise;
    },
    
    /**
     * Preload route component
     */
    preloadRoute: (route: string, importFn: () => Promise<Record<string, unknown>>, delay: number = 0) => {
      if (preloadedRoutes.has(route)) return;
      
      setTimeout(() => {
        if (!routeCache.has(route)) {
          const preloadPromise = (async () => {
            const startTime = performance.now();
            
            try {
              const moduleResult = await importFn();
              const loadTime = performance.now() - startTime;
              
              performanceMetrics.addMetric('route-split-load', loadTime);
              return moduleResult;
            } catch (error) {
              performanceMetrics.addMetric('route-split-error', 1);
              throw error;
            }
          })();
          routeCache.set(route, preloadPromise);
        }
        preloadedRoutes.add(route);
      }, delay);
    },
    
    /**
     * Get cached route
     */
    getCachedRoute: (route: string) => {
      return routeCache.get(route);
    },
    
    /**
     * Clear route cache
     */
    clearCache: () => {
      routeCache.clear();
      preloadedRoutes.clear();
    },
  };
}

/**
 * Create feature-based code splitting
 */
export function createFeatureCodeSplitting() {
  const featureCache = new Map<string, Promise<Record<string, unknown>>>();
  
  return {
    /**
     * Load feature component
     */
    loadFeature: (feature: string, importFn: () => Promise<Record<string, unknown>>) => {
      if (featureCache.has(feature)) {
        return featureCache.get(feature)!;
      }
      
      const loadPromise = (async () => {
        const startTime = performance.now();
        
        try {
          const moduleResult = await importFn();
          const loadTime = performance.now() - startTime;
          
          performanceMetrics.addMetric('feature-split-load', loadTime);
          return moduleResult;
        } catch (error) {
          performanceMetrics.addMetric('feature-split-error', 1);
          throw error;
        }
      })();
      
      featureCache.set(feature, loadPromise);
      return loadPromise;
    },
    
    /**
     * Preload feature component
     */
    preloadFeature: (feature: string, importFn: () => Promise<Record<string, unknown>>) => {
      if (!featureCache.has(feature)) {
        const loadPromise = (async () => {
          const startTime = performance.now();
          
          try {
            const moduleResult = await importFn();
            const loadTime = performance.now() - startTime;
            
            performanceMetrics.addMetric('feature-split-load', loadTime);
            return moduleResult;
          } catch (error) {
            performanceMetrics.addMetric('feature-split-error', 1);
            throw error;
          }
        })();
        
        featureCache.set(feature, loadPromise);
      }
    },
    
    /**
     * Get cached feature
     */
    getCachedFeature: (feature: string) => {
      return featureCache.get(feature);
    },
  };
}

/**
 * Create vendor code splitting
 */
export function createVendorCodeSplitting() {
  const vendorCache = new Map<string, Promise<Record<string, unknown>>>();
  
  return {
    /**
     * Load vendor library
     */
    loadVendor: (vendor: string, importFn: () => Promise<Record<string, unknown>>) => {
      if (vendorCache.has(vendor)) {
        return vendorCache.get(vendor)!;
      }
      
      const loadPromise = (async () => {
        const startTime = performance.now();
        
        try {
          const moduleResult = await importFn();
          const loadTime = performance.now() - startTime;
          
          performanceMetrics.addMetric('vendor-split-load', loadTime);
          return moduleResult;
        } catch (error) {
          performanceMetrics.addMetric('vendor-split-error', 1);
          throw error;
        }
      })();
      
      vendorCache.set(vendor, loadPromise);
      return loadPromise;
    },
    
    /**
     * Preload vendor library
     */
    preloadVendor: (vendor: string, importFn: () => Promise<Record<string, unknown>>) => {
      if (!vendorCache.has(vendor)) {
        const loadPromise = (async () => {
          const startTime = performance.now();
          
          try {
            const moduleResult = await importFn();
            const loadTime = performance.now() - startTime;
            
            performanceMetrics.addMetric('vendor-split-load', loadTime);
            return moduleResult;
          } catch (error) {
            performanceMetrics.addMetric('vendor-split-error', 1);
            throw error;
          }
        })();
        
        vendorCache.set(vendor, loadPromise);
      }
    },
  };
}

/**
 * Create conditional code splitting
 */
export function createConditionalCodeSplitting<T>(
  condition: () => boolean,
  importFn: () => Promise<T>,
  fallback?: T
): Promise<T> {
  if (condition()) {
    const startTime = performance.now();
    
    return importFn().then((moduleResult) => {
      const loadTime = performance.now() - startTime;
      performanceMetrics.addMetric('conditional-split-load', loadTime);
      return moduleResult;
    });
  }
  
  return Promise.resolve(fallback as T);
}

/**
 * Create dynamic import with error boundary
 */
export async function createDynamicImport<T>(
  importFn: () => Promise<T>,
  options: {
    retryCount?: number;
    retryDelay?: number;
    onError?: (error: Error) => void;
  } = {}
): Promise<T> {
  const { retryCount = 3, retryDelay = 1000, onError } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      const startTime = performance.now();
      const moduleResult = await importFn();
      const loadTime = performance.now() - startTime;
      
      performanceMetrics.addMetric('dynamic-import-load', loadTime);
      return moduleResult;
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < retryCount) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  onError?.(lastError!);
  throw lastError;
}

/**
 * Create code splitting strategy based on user agent
 */
export function createUserAgentCodeSplitting<T>(
  importFn: () => Promise<T>,
  userAgent: string = typeof navigator !== 'undefined' ? navigator.userAgent : ''
): Promise<T> {
  const startTime = performance.now();
  
  return importFn().then((moduleResult) => {
    const loadTime = performance.now() - startTime;
    
    // Track performance by user agent
    const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent);
    const metricName = isMobile ? 'mobile-code-split-load' : 'desktop-code-split-load';
    
    performanceMetrics.addMetric(metricName, loadTime);
    return moduleResult;
  });
}

/**
 * Create code splitting with prefetching
 */
export function createPrefetchCodeSplitting<T>(
  importFn: () => Promise<T>,
  prefetchDelay: number = 2000
): {
  load: () => Promise<T>;
  prefetch: () => void;
} {
  let prefetched: Promise<T> | null = null;
  
  const prefetch = () => {
    if (!prefetched) {
      prefetched = importFn();
    }
  };
  
  const load = () => {
    if (prefetched) {
      return prefetched;
    }
    
    return importFn();
  };
  
  // Auto-prefetch after delay
  setTimeout(prefetch, prefetchDelay);
  
  return { load, prefetch };
}

