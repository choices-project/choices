import { logger } from '@/lib/utils/logger';

const noop = () => undefined;

type NavigationMetricCallback = (
  name: string,
  value: number,
  metadata?: Record<string, unknown>,
) => void;

type ResourceMetricCallback = (
  name: string,
  value: number,
  metadata?: Record<string, unknown>,
) => void;

type PerformanceMonitorCallbacks = {
  recordNavigationMetric: NavigationMetricCallback;
  recordResourceMetric: ResourceMetricCallback;
};

type CleanupFn = () => void;

/**
 * Start performance observers for navigation and resource timings.
 * Returns a cleanup function that disconnects observers.
 */
export function createPerformanceMonitor({
  recordNavigationMetric,
  recordResourceMetric,
}: PerformanceMonitorCallbacks): CleanupFn {
  if (typeof window === 'undefined' || typeof PerformanceObserver === 'undefined') {
    return noop;
  }

  let observer: PerformanceObserver | null = null;

  try {
    observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          recordNavigationMetric('TTFB', navEntry.responseStart - navEntry.requestStart, {
            entryType: 'navigation',
          });
          recordNavigationMetric('FCP', navEntry.domContentLoadedEventEnd - navEntry.fetchStart, {
            entryType: 'navigation',
          });
        } else if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming;
          recordResourceMetric(resourceEntry.name, resourceEntry.duration, {
            entryType: 'resource',
            initiatorType: resourceEntry.initiatorType,
          });
        }
      });
    });

    observer.observe({ entryTypes: ['navigation', 'resource'] });
  } catch (error) {
    logger.warn('Performance Observer not supported:', error);
    observer = null;
  }

  return () => {
    if (observer) {
      try {
        observer.disconnect();
      } catch (error) {
        logger.warn('Failed to disconnect PerformanceObserver:', error);
      }
    }
  };
}

/**
 * Schedule an auto-refresh timer. Returns a cleanup function that clears the timer.
 */
export function createAutoRefreshTimer(
  callback: () => void | Promise<void>,
  interval: number,
): CleanupFn {
  if (typeof window === 'undefined') {
    return noop;
  }

  const handler = () => {
    try {
      const result = callback();
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        (result as Promise<unknown>).catch((error) => {
          logger.error('Auto refresh callback failed:', error);
        });
      }
    } catch (error) {
      logger.error('Auto refresh callback threw:', error);
    }
  };

  const timerId = window.setInterval(handler, interval);

  return () => {
    window.clearInterval(timerId);
  };
}

