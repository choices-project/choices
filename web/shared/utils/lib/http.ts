/**
 * HTTP Security Helpers
 * 
 * Provides origin validation and CSRF protection for state-changing routes.
 */

export function requireTrustedOrigin(req: Request) {
  // Only enforce on state-changing verbs; allow preview/branch URLs
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return;
  
  const origin = req.headers.get('origin') ?? new URL(req.headers.get('referer') ?? '', 'http://x').origin;
  const allowed = [
    process.env.APP_ORIGIN!,                   // prod app
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
    ...(process.env.VERCEL ? ['https://*.vercel.app'] : []),
  ];
  
  if (!origin || !allowed.some(p => 
    origin === p || (p.endsWith('*.vercel.app') && origin.endsWith('.vercel.app'))
  )) {
    throw new Error('Untrusted origin');
  }
}

// Helper for getting client IP
export function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

// Helper for getting user agent
export function getUserAgent(req: Request): string {
  return req.headers.get('user-agent') || 'unknown';
}
