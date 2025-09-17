/**
 * Lazy Loading Utilities
 * 
 * Provides utilities for implementing lazy loading of components,
 * images, and other resources to improve initial page load performance.
 */

import { lazy, Suspense } from 'react';
import type { ComponentType } from 'react';
import { performanceMetrics } from './performance-metrics';

interface LazyLoadOptions {
  threshold?: number;
  rootMargin?: string;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

interface LazyComponentOptions extends LazyLoadOptions {
  retryCount?: number;
  retryDelay?: number;
}

/**
 * Create a lazy-loaded component with error boundary and retry logic
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions = {}
): ComponentType<any> {
  const {
    retryCount = 3,
    retryDelay = 1000,
    fallback = React.createElement('div', null, 'Loading...'),
    onLoad,
    onError,
  } = options;

  const LazyComponent = lazy(async () => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const startTime = performance.now();
        const module = await importFn();
        const loadTime = performance.now() - startTime;
        
        // Track lazy loading performance
        performanceMetrics.addMetric('lazy-component-load', loadTime);
        
        onLoad?.();
        return module;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < retryCount) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }
    
    onError?.(lastError!);
    throw lastError;
  });

  return function LazyWrapper(props: any) {
    return React.createElement(
      Suspense,
      { fallback },
      React.createElement(LazyComponent, props)
    );
  };
}

/**
 * Lazy load images with intersection observer
 */
export function lazyLoadImages(
  selector: string = 'img[data-src]',
  options: LazyLoadOptions = {}
): () => void {
  const {
    threshold = 0.1,
    rootMargin = '50px',
  } = options;

  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return () => {};
  }

  const imageObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          
          if (src) {
            const startTime = performance.now();
            
            img.src = src;
            img.removeAttribute('data-src');
            
            img.onload = () => {
              const loadTime = performance.now() - startTime;
              performanceMetrics.addMetric('lazy-image-load', loadTime);
              options.onLoad?.();
            };
            
            img.onerror = (error) => {
              options.onError?.(error as any);
            };
          }
          
          imageObserver.unobserve(img);
        }
      });
    },
    {
      threshold,
      rootMargin,
    }
  );

  // Observe all images with data-src attribute
  const images = document.querySelectorAll(selector);
  images.forEach((img) => imageObserver.observe(img));

  // Return cleanup function
  return () => {
    imageObserver.disconnect();
  };
}

/**
 * Lazy load components based on route
 */
export function createRouteBasedLazyLoading() {
  const loadedRoutes = new Set<string>();
  
  return function lazyLoadRoute(route: string, importFn: () => Promise<any>) {
    if (loadedRoutes.has(route)) {
      return Promise.resolve();
    }
    
    const startTime = performance.now();
    
    return importFn().then((module) => {
      const loadTime = performance.now() - startTime;
      performanceMetrics.addMetric('lazy-route-load', loadTime);
      loadedRoutes.add(route);
      return module;
    });
  };
}

/**
 * Preload critical resources
 */
export function preloadCriticalResources(resources: Array<{
  href: string;
  as: 'script' | 'style' | 'image' | 'font' | 'fetch';
  crossorigin?: boolean;
}>): void {
  if (typeof document === 'undefined') return;
  
  resources.forEach(({ href, as, crossorigin }) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    
    if (crossorigin) {
      link.crossOrigin = 'anonymous';
    }
    
    document.head.appendChild(link);
  });
}

/**
 * Lazy load third-party scripts
 */
export function lazyLoadScript(
  src: string,
  options: {
    async?: boolean;
    defer?: boolean;
    onLoad?: () => void;
    onError?: (error: Error) => void;
  } = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script is already loaded
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.src = src;
    script.async = options.async ?? true;
    script.defer = options.defer ?? false;
    
    const startTime = performance.now();
    
    script.onload = () => {
      const loadTime = performance.now() - startTime;
      performanceMetrics.addMetric('lazy-script-load', loadTime);
      options.onLoad?.();
      resolve();
    };
    
    script.onerror = (error) => {
      options.onError?.(error as any);
      reject(error);
    };
    
    document.head.appendChild(script);
  });
}

/**
 * Lazy load CSS
 */
export function lazyLoadCSS(
  href: string,
  options: {
    onLoad?: () => void;
    onError?: (error: Error) => void;
  } = {}
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if CSS is already loaded
    if (document.querySelector(`link[href="${href}"]`)) {
      resolve();
      return;
    }
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    
    const startTime = performance.now();
    
    link.onload = () => {
      const loadTime = performance.now() - startTime;
      performanceMetrics.addMetric('lazy-css-load', loadTime);
      options.onLoad?.();
      resolve();
    };
    
    link.onerror = (error) => {
      options.onError?.(error as any);
      reject(error);
    };
    
    document.head.appendChild(link);
  });
}

/**
 * Create a lazy loading hook for React components
 */
export function useLazyLoading<T>(
  importFn: () => Promise<T>,
  deps: React.DependencyList = []
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  retry: () => void;
} {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);
  
  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const startTime = performance.now();
      const result = await importFn();
      const loadTime = performance.now() - startTime;
      
      performanceMetrics.addMetric('lazy-hook-load', loadTime);
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, deps);
  
  React.useEffect(() => {
    load();
  }, [load]);
  
  return {
    data,
    loading,
    error,
    retry: load,
  };
}

/**
 * Lazy load components with viewport detection
 */
export function createViewportLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyComponentOptions & {
    viewportThreshold?: number;
  } = {}
): ComponentType<any> {
  const { viewportThreshold = 0.1, ...lazyOptions } = options;
  
  return function ViewportLazyWrapper(props: any) {
    const [isInViewport, setIsInViewport] = React.useState(false);
    const ref = React.useRef<HTMLDivElement>(null);
    
    React.useEffect(() => {
      if (!ref.current || typeof window === 'undefined') return;
      
      const observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry && entry.isIntersecting) {
            setIsInViewport(true);
            observer.disconnect();
          }
        },
        { threshold: viewportThreshold }
      );
      
      observer.observe(ref.current);
      
      return () => observer.disconnect();
    }, []);
    
    if (!isInViewport) {
      return React.createElement('div', { 
        ref, 
        style: { minHeight: '200px' } 
      });
    }
    
    const LazyComponent = createLazyComponent(importFn, lazyOptions);
    return React.createElement(LazyComponent, props);
  };
}

// Export React for the hooks
import React from 'react';
