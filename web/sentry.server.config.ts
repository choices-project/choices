/**
 * Sentry Server Configuration
 * 
 * This file configures Sentry for the server side
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

        // Uncomment the line below to enable Spotlight (https://spotlightjs.com)
        // spotlight: process.env.NODE_ENV === 'development',
      });
    })
    .catch(() => {
      // Sentry not installed - silently skip
    });
}

