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
  }
}
