/**
 * HTTP Security Helpers
 * 
 * Provides origin validation and CSRF protection for state-changing routes.
 */

export function requireTrustedOrigin(req: Request) {
  // Only enforce on state-changing verbs; allow preview/branch URLs
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) return;
  
  const originHeader = req.headers.get('origin');
  const referer = req.headers.get('referer');
  let origin = '';
  
  try {
    origin = originHeader || (referer ? new URL(referer).origin : '');
  } catch {
    origin = '';
  }

  const envOrigin = process.env.APP_ORIGIN;
  const allowed = [
    envOrigin,
    ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : []),
    ...(process.env.VERCEL ? ['https://*.vercel.app'] : []),
  ].filter((v): v is string => typeof v === 'string' && v.length > 0);

  const isAllowed = origin && allowed.some(p => {
    if (p === origin) return true;
    if (p.endsWith('*.vercel.app')) {
      try {
        const url = new URL(origin);
        return url.hostname.endsWith('.vercel.app');
      } catch {
        return false;
      }
    }
    return false;
  });

  if (!isAllowed) {
    throw new Error('Untrusted origin');
  }
}

// Helper for getting client IP
export function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  
  if (forwarded) {
    const firstForwarded = forwarded.split(',')[0];
    return firstForwarded?.trim() ?? '';
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
