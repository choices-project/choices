import { lazy, Suspense, ComponentType, ReactNode } from 'react'
import { logger } from '@/lib/logger'

// Performance monitoring utilities
export const performanceUtils = {
  /**
   * Measure component render time
   */
  measureRenderTime(componentName: string, renderFn: () => void): number {
    const startTime = performance.now()
    renderFn()
    const endTime = performance.now()
    const renderTime = endTime - startTime
    
    // Log slow renders
    if (renderTime > 16) { // 60fps threshold
      logger.warn(`Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`)
    }
    
    return renderTime
  },

  /**
   * Debounce function calls for performance
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    immediate = false
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null
    
    return (...args: Parameters<T>) => {
      const later = () => {
        timeout = null
        if (!immediate) func(...args)
      }
      
      const callNow = immediate && !timeout
      
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(later, wait)
      
      if (callNow) func(...args)
    }
  },

  /**
   * Throttle function calls for performance
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  },

  /**
   * Intersection Observer for lazy loading
   */
  createIntersectionObserver(
    callback: IntersectionObserverCallback,
    options: IntersectionObserverInit = {}
  ): IntersectionObserver {
    const defaultOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '50px',
      threshold: 0.1,
      ...options
    }
    
    return new IntersectionObserver(callback, defaultOptions)
  },

  /**
   * Virtual scrolling utilities
   */
  virtualScroll: {
    /**
     * Calculate visible items for virtual scrolling
     */
    getVisibleItems(
      totalItems: number,
      itemHeight: number,
      containerHeight: number,
      scrollTop: number
    ) {
      const startIndex = Math.floor(scrollTop / itemHeight)
      const endIndex = Math.min(
        startIndex + Math.ceil(containerHeight / itemHeight) + 1,
        totalItems
      )
      
      return {
        startIndex,
        endIndex,
        visibleItems: endIndex - startIndex,
        offsetY: startIndex * itemHeight
      }
    },

    /**
     * Calculate total height for virtual scrolling
     */
    getTotalHeight(totalItems: number, itemHeight: number): number {
      return totalItems * itemHeight
    }
  }
}

// Lazy loading utilities
export const lazyLoading = {
  /**
   * Create a lazy-loaded component with error boundary
   */
  createLazyComponent<T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>,
    fallback?: ReactNode,
    errorFallback?: ReactNode
  ) {
    const LazyComponent = lazy(importFn)
    
    return function LazyWrapper(props: React.ComponentProps<T>) {
      return (
        <Suspense fallback={fallback || <div>Loading...</div>}>
          <ErrorBoundary fallback={errorFallback}>
            <LazyComponent {...props} />
          </ErrorBoundary>
        </Suspense>
      )
    }
  },

  /**
   * Preload a lazy component
   */
  preloadComponent<T extends ComponentType<any>>(
    importFn: () => Promise<{ default: T }>
  ): Promise<T> {
    return importFn().then(module => module.default)
  },

  /**
   * Preload multiple components
   */
  preloadComponents<T extends ComponentType<any>>(
    importFns: Array<() => Promise<{ default: T }>>
  ): Promise<T[]> {
    return Promise.all(importFns.map(fn => fn().then(module => module.default)))
  }
}

// Error Boundary component
class ErrorBoundary extends React.Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('Component error caught by boundary', { error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <h3 className="text-sm font-medium text-red-800">Something went wrong</h3>
          <p className="text-sm text-red-700 mt-1">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
        </div>
      )
    }

    return this.props.children
  }
}

// Memoization utilities
export const memoization = {
  /**
   * Create a memoized component with performance tracking
   */
  createMemoizedComponent<T extends ComponentType<any>>(
    Component: T,
    propsAreEqual?: (prevProps: React.ComponentProps<T>, nextProps: React.ComponentProps<T>) => boolean
  ) {
    const MemoizedComponent = React.memo(Component, propsAreEqual)
    
    return function MemoizedWrapper(props: React.ComponentProps<T>) {
      const componentName = Component.displayName || Component.name || 'Unknown'
      
      return (
        <PerformanceTracker componentName={componentName}>
          <MemoizedComponent {...props} />
        </PerformanceTracker>
      )
    }
  },

  /**
   * Create a memoized callback with performance tracking
   */
  createMemoizedCallback<T extends (...args: any[]) => any>(
    callback: T,
    deps: React.DependencyList,
    callbackName?: string
  ): T {
    return React.useCallback((...args: Parameters<T>) => {
      const startTime = performance.now()
      const result = callback(...args)
      const endTime = performance.now()
      
      if (endTime - startTime > 16) {
        logger.warn(`Slow callback detected: ${callbackName || 'unknown'} took ${(endTime - startTime).toFixed(2)}ms`)
      }
      
      return result
    }, deps) as T
  },

  /**
   * Create a memoized value with performance tracking
   */
  createMemoizedValue<T>(
    factory: () => T,
    deps: React.DependencyList,
    valueName?: string
  ): T {
    return React.useMemo(() => {
      const startTime = performance.now()
      const result = factory()
      const endTime = performance.now()
      
      if (endTime - startTime > 16) {
        logger.warn(`Slow memoization detected: ${valueName || 'unknown'} took ${(endTime - startTime).toFixed(2)}ms`)
      }
      
      return result
    }, deps)
  }
}

// Performance tracking component
function PerformanceTracker({ 
  children, 
  componentName 
}: { 
  children: ReactNode
  componentName: string 
}) {
  const renderCount = React.useRef(0)
  const lastRenderTime = React.useRef(performance.now())
  
  React.useEffect(() => {
    renderCount.current += 1
    const currentTime = performance.now()
    const timeSinceLastRender = currentTime - lastRenderTime.current
    
    // Log frequent re-renders
    if (renderCount.current > 10 && timeSinceLastRender < 1000) {
      logger.warn(`Frequent re-renders detected: ${componentName} rendered ${renderCount.current} times in ${timeSinceLastRender.toFixed(2)}ms`)
    }
    
    lastRenderTime.current = currentTime
  })
  
  return <>{children}</>
}

// Image optimization utilities
export const imageOptimization = {
  /**
   * Create optimized image component
   */
  createOptimizedImage(
    src: string,
    alt: string,
    width?: number,
    height?: number,
    priority = false
  ) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        style={{
          width: width ? `${width}px` : 'auto',
          height: height ? `${height}px` : 'auto'
        }}
      />
    )
  },

  /**
   * Create responsive image component
   */
  createResponsiveImage(
    src: string,
    alt: string,
    sizes: string,
    srcSet?: string
  ) {
    return (
      <img
        src={src}
        alt={alt}
        sizes={sizes}
        srcSet={srcSet}
        loading="lazy"
        decoding="async"
      />
    )
  }
}

// Bundle optimization utilities
export const bundleOptimization = {
  /**
   * Dynamic import with error handling
   */
  async dynamicImport<T>(importFn: () => Promise<T>): Promise<T> {
    try {
      const startTime = performance.now()
      const result = await importFn()
      const endTime = performance.now()
      
      logger.info(`Dynamic import completed in ${(endTime - startTime).toFixed(2)}ms`)
      return result
    } catch (error) {
      logger.error('Dynamic import failed', { error })
      throw error
    }
  },

  /**
   * Preload critical resources
   */
  preloadCriticalResources(resources: Array<{ href: string; as: string; type?: string }>) {
    resources.forEach(({ href, as, type }) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = href
      link.as = as
      if (type) link.type = type
      document.head.appendChild(link)
    })
  },

  /**
   * Prefetch non-critical resources
   */
  prefetchResources(resources: string[]) {
    resources.forEach(href => {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = href
      document.head.appendChild(link)
    })
  }
}

// Export React for use in the file
import React from 'react'

// Export all utilities
export default {
  performanceUtils,
  lazyLoading,
  memoization,
  imageOptimization,
  bundleOptimization
}
