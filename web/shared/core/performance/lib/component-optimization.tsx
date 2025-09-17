// lib/performance/component-optimization.tsx
import * as React from 'react';

type LazyProps<P> = {
  /**
   * Dynamically import a component:
   *   () => import('../../components/Heavy').then(m => m.Heavy)
   */
  loader: () => Promise<{ default: React.ComponentType<P> }>;
  /** Props to pass into the lazy component */
  props: P;
  /** Suspense fallback */
  fallback?: React.ReactNode;
  /** Error UI */
  errorFallback?: React.ReactNode | ((err: unknown) => React.ReactNode);
};

/** Minimal, local error boundary (replace with your shared one if you have it) */
class InlineErrorBoundary extends React.Component<
  { fallback?: React.ReactNode | ((_e: unknown) => React.ReactNode); children: React.ReactNode },
  { error: unknown }
> {
  state = { error: null as unknown };
  static override getDerivedStateFromError(error: unknown) { return { error }; }
  override componentDidCatch(_error: unknown) {
    // optional: route through your logger here
    // logger.error('Lazy component crashed', { error });
  }
  override render() {
    const { error } = this.state;
    if (error) {
      const { fallback } = this.props;
      if (typeof fallback === 'function') return (fallback as (_e: unknown) => React.ReactNode)(error);
      return fallback ?? <div role="alert">Something went wrong.</div>;
    }
    return this.props.children;
  }
}

/** Memoized lazy wrapper (prevents re-wrapping on each render) */
export function LazyOptimized<P extends Record<string, unknown>>(props: LazyProps<P>) {
  const { loader, fallback, errorFallback } = props;

  const LazyComp = React.useMemo(() => React.lazy(loader), [loader]);

  return (
    <React.Suspense fallback={fallback ?? <div>Loading…</div>}>
      <InlineErrorBoundary fallback={errorFallback}>
        { }
        <LazyComp {...(props.props as any)} />
      </InlineErrorBoundary>
    </React.Suspense>
  );
}

/** Convenience HOC for local lazy registration */
export function withLazy<P extends Record<string, unknown>>(loader: () => Promise<{ default: React.ComponentType<P> }>) {
  const LC = React.lazy(loader);
  return function LazyWrapped(props: P & { fallback?: React.ReactNode; errorFallback?: React.ReactNode | ((e: unknown) => React.ReactNode) }) {
    const { fallback, errorFallback, ...rest } = props;
    return (
      <React.Suspense fallback={fallback ?? <div>Loading…</div>}>
        <InlineErrorBoundary fallback={errorFallback}>
          { }
          <LC {...(rest as any)} />
        </InlineErrorBoundary>
      </React.Suspense>
    );
  };
}

/** Performance tracking wrapper */
export function withPerformanceTracking<P extends Record<string, unknown>>(
  WrappedComponent: React.ComponentType<P>,
  _componentName: string
) {
  return function PerformanceTrackedComponent(props: P) {
    React.useEffect(() => {
      // Performance tracking disabled - uncomment to enable logging
      // const startTime = Date.now();
      // const duration = Date.now() - startTime;
      // logger.debug('Component render performance', { componentName, duration });
    });

    return <WrappedComponent {...props} />;
  };
}

/** Memoized component wrapper with performance tracking */
export function createMemoizedComponent<P extends Record<string, unknown>>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  const MemoizedComponent = React.memo(Component);
  
  return function PerformanceTrackedMemoizedComponent(props: P) {
    return (
      <PerformanceTracker componentName={componentName}>
        <MemoizedComponent {...(props as any)} />
      </PerformanceTracker>
    );
  };
}

/** Performance tracker component */
function PerformanceTracker({ componentName: _componentName, children }: { componentName: string; children: React.ReactNode }) {
  React.useEffect(() => {
    // Performance tracking disabled - uncomment to enable logging
    // const startTime = Date.now();
    // const duration = Date.now() - startTime;
    // logger.debug('Component render performance', { componentName, duration });
  });

  return <>{children}</>;
}

/**
 * Performance optimization utilities
 * 
 * Note: These utilities have been removed in favor of direct React hook usage
 * to maintain proper dependency tracking and ESLint compliance.
 * 
 * Use React.useCallback and React.useMemo directly in your components
 * with explicit dependency arrays for better maintainability.
 */
