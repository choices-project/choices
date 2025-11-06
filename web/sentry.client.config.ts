/**
 * Sentry Client Configuration
 * 
 * This file configures Sentry for the browser/client side
 * 
 * Created: January 26, 2025
 * 
 * Note: Sentry is optional - install with: npm install @sentry/nextjs
 */

// Only initialize if Sentry is installed and DSN is configured
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  import('@sentry/nextjs')
    .then((Sentry) => {
      Sentry.init({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

        // Adjust this value in production, or use tracesSampler for greater control
        tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

        // Setting this option to true will print useful information to the console while you're setting up Sentry.
        debug: false,

        // Replay can only be used with the Sentry Session Replay feature enabled
        replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0 : 0.1,
        replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 0 : 1.0,

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
      });
    })
    .catch(() => {
      // Sentry not installed - silently skip
    });
}

