export function register() {
  // Verify this runs in Vercel logs:
  console.log('[instrumentation] runtime=', process.env.NEXT_RUNTIME);

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    if (typeof (globalThis as any).self === 'undefined') {
      Object.defineProperty(globalThis, 'self', {
        value: globalThis,
        configurable: true,
        enumerable: false,
        writable: true,
      });
    }

    // Initialize Sentry if DSN is configured
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      try {
        // Sentry is initialized via sentry.server.config.ts and sentry.client.config.ts
        // This is just a placeholder for any server-side initialization needed
        console.log('[instrumentation] Sentry DSN detected, monitoring enabled');
      } catch (error) {
        console.warn('[instrumentation] Failed to initialize Sentry:', error);
      }
    }
  }
}
