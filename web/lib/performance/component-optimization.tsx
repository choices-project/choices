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
  { fallback?: React.ReactNode | ((e: unknown) => React.ReactNode); children: React.ReactNode },
  { error: unknown }
> {
  state = { error: null as unknown };
  static getDerivedStateFromError(error: unknown) { return { error }; }
  componentDidCatch(error: unknown) {
    // optional: route through your logger here
    // logger.error('Lazy component crashed', { error });
  }
  render() {
    const { error } = this.state;
    if (error) {
      const { fallback } = this.props;
      if (typeof fallback === 'function') return (fallback as (e: unknown) => React.ReactNode)(error);
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
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <LazyComp {...props.props} />
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
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <LC {...(rest as P)} />
        </InlineErrorBoundary>
      </React.Suspense>
    );
  };
}

/** Performance tracking wrapper */
export function withPerformanceTracking<P extends Record<string, unknown>>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return function PerformanceTrackedComponent(props: P) {
    const startTime = React.useRef(Date.now());
    
    React.useEffect(() => {
      const duration = Date.now() - startTime.current;
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
        <MemoizedComponent {...props} />
      </PerformanceTracker>
    );
  };
}

/** Performance tracker component */
function PerformanceTracker({ componentName, children }: { componentName: string; children: React.ReactNode }) {
  const startTime = React.useRef(Date.now());
  
  React.useEffect(() => {
    const duration = Date.now() - startTime.current;
    // logger.debug('Component render performance', { componentName, duration });
  });

  return <>{children}</>;
}

/** Hook for creating memoized callbacks with dependency tracking */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return React.useCallback(callback, deps);
}

/** Hook for creating memoized values with dependency tracking */
export function useMemoizedValue<T>(
  factory: () => T,
  deps: React.DependencyList
): T {
  return React.useMemo(factory, deps);
}
