import logger from '@/lib/utils/logger';
/**
 * Sentry Error Tracking and Monitoring
 * 
 * Comprehensive error tracking and performance monitoring integration
 * 
 * Created: January 26, 2025
 * Status: ✅ PRODUCTION
 * 
 * Note: Sentry is optional - install with: npm install @sentry/nextjs
 */

// Dynamic import for Sentry (optional dependency)
// Sentry is optional - may not be installed
let Sentry: any = null;

// Try to load Sentry if available
try {
   
   
  Sentry = require('@sentry/nextjs');
} catch {
  // Sentry not installed - that's okay, functions will no-op
}

/**
 * Initialize Sentry for error tracking and performance monitoring
 * Should be called once at application startup
 */
export function initSentry() {
  if (!Sentry) {
    logger.info('[Sentry] Not installed - install with: npm install @sentry/nextjs');
    return;
  }

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const environment = process.env.NODE_ENV ?? 'development';
  const release = process.env.NEXT_PUBLIC_APP_VERSION ?? '1.0.0';

  // Only initialize if DSN is provided
  if (!dsn) {
    logger.warn('[Sentry] DSN not provided, Sentry monitoring disabled');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    release,

    // Performance monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    
    // Session replay (development only for now)
    replaysSessionSampleRate: environment === 'production' ? 0 : 0.1,
    replaysOnErrorSampleRate: environment === 'production' ? 0 : 1.0,

    // Filter out localhost errors in production
    beforeSend(event: any, _hint: any) {
      if (environment === 'production') {
        // Don't send events from localhost
        if (event.request?.url?.includes('localhost')) {
          return null;
        }
      }
      return event;
    },

    // Integrate with existing logger
    integrations: [
      new Sentry.BrowserTracing({
        // Set sampling rate for performance monitoring
        tracePropagationTargets: ['localhost', /^\//],
      }),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Ignore specific errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
      'atomicFindClose',
      'fb_xd_fragment',
      'bmi_SafeAddOnload',
      'EBCallBackMessageReceived',
      // Network errors that are user-related
      'NetworkError',
      'Network request failed',
      // Third-party scripts
      'script error',
    ],

    // Filter out noise
    beforeBreadcrumb(breadcrumb: any) {
      // Filter out noisy breadcrumbs
      if (breadcrumb.category === 'console') {
        // Only log console.error and console.warn
        if (breadcrumb.level === 'log' || breadcrumb.level === 'info') {
          return null;
        }
      }
      return breadcrumb;
    },
  });

  logger.info(`[Sentry] Initialized for environment: ${environment}`);
}

/**
 * Capture an exception with context
 */
export function captureException(
  error: Error,
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
    level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
    user?: {
      id?: string;
      email?: string;
      username?: string;
    };
  }
) {
  if (!Sentry) return;

  Sentry.withScope((scope: any) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    if (context?.level) {
      scope.setLevel(context.level);
    }

    if (context?.user) {
      scope.setUser(context.user);
    }

    Sentry.captureException(error);
  });
}

/**
 * Capture a message (not an exception)
 */
export function captureMessage(
  message: string,
  level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info',
  context?: {
    tags?: Record<string, string>;
    extra?: Record<string, unknown>;
  }
) {
  if (!Sentry) return;

  Sentry.withScope((scope: any) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
    }

    scope.setLevel(level);
    Sentry.captureMessage(message);
  });
}

/**
 * Start a performance transaction
 */
export function startTransaction(
  name: string,
  op: string = 'custom'
): any {
  if (!Sentry) return null;
  return Sentry.startTransaction({
    name,
    op,
  });
}

/**
 * Set user context for error tracking
 */
export function setUser(user: {
  id?: string;
  email?: string;
  username?: string;
  ip_address?: string;
}) {
  if (!Sentry) return;
  Sentry.setUser(user);
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUser() {
  if (!Sentry) return;
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(breadcrumb: {
  message?: string;
  category?: string;
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  data?: Record<string, unknown>;
}) {
  if (!Sentry) return;
  Sentry.addBreadcrumb(breadcrumb);
}

// Export Sentry for advanced usage (may be null if not installed)
export { Sentry };

