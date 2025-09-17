/**
 * Origin Validation Utilities
 * 
 * Enhanced origin validation for security and CSRF protection.
 * Validates request origins against trusted domains and handles
 * development, staging, and production environments.
 */

import { devLog } from '../logger';

export type OriginConfig = {
  allowedOrigins: string[];
  allowLocalhost: boolean;
  allowVercelPreview: boolean;
  strictMode: boolean;
}

/**
 * Default origin configuration
 */
const DEFAULT_ORIGIN_CONFIG: OriginConfig = {
  allowedOrigins: [
    'https://choices-platform.vercel.app',
    'https://choices.app',
    'https://www.choices.app',
  ],
  allowLocalhost: process.env.NODE_ENV === 'development',
  allowVercelPreview: true,
  strictMode: process.env.NODE_ENV === 'production',
};

/**
 * Enhanced origin validation with environment awareness
 */
export function validateOrigin(
  request: Request,
  config: Partial<OriginConfig> = {}
): { valid: boolean; reason?: string; origin?: string } {
  const finalConfig = { ...DEFAULT_ORIGIN_CONFIG, ...config };
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  const referer = request.headers.get('referer');

  // Extract origin from referer if origin header is missing
  const effectiveOrigin = origin || (referer ? new URL(referer).origin : null);

  if (!effectiveOrigin) {
    // Allow requests without origin (e.g., direct API calls, mobile apps)
    if (!finalConfig.strictMode) {
      return { valid: true, reason: 'No origin header (non-strict mode)' };
    }
    return { valid: false, reason: 'Missing origin header' };
  }

  // Parse the origin URL
  let originUrl: URL;
  try {
    originUrl = new URL(effectiveOrigin);
  } catch {
    return { valid: false, reason: 'Invalid origin URL format' };
  }

  const originHostname = originUrl.hostname;

  // Check localhost allowance
  if (finalConfig.allowLocalhost && isLocalhost(originHostname)) {
    return { valid: true, reason: 'Localhost allowed in development' };
  }

  // Check Vercel preview URLs
  if (finalConfig.allowVercelPreview && isVercelPreview(originHostname)) {
    return { valid: true, reason: 'Vercel preview URL allowed' };
  }

  // Check against allowed origins
  const isAllowed = finalConfig.allowedOrigins.some(allowedOrigin => {
    try {
      const allowedUrl = new URL(allowedOrigin);
      return allowedUrl.hostname === originHostname;
    } catch {
      return false;
    }
  });

  if (isAllowed) {
    return { valid: true, reason: 'Origin in allowed list' };
  }

  return { 
    valid: false, 
    reason: `Origin not allowed: ${effectiveOrigin}`,
    origin: effectiveOrigin
  };
}

/**
 * Require trusted origin - throws error if invalid
 */
export function requireTrustedOrigin(
  request: Request,
  config?: Partial<OriginConfig>
): void {
  const validation = validateOrigin(request, config);
  
  if (!validation.valid) {
    devLog('Origin validation failed:', {
      reason: validation.reason,
      origin: validation.origin,
      host: request.headers.get('host'),
      userAgent: request.headers.get('user-agent'),
      method: request.method,
      path: new URL(request.url).pathname
    });
    
    throw new Error(`Origin validation failed: ${validation.reason}`);
  }
}

/**
 * Check if hostname is localhost
 */
export function isLocalhost(hostname: string): boolean {
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.startsWith('192.168.') ||
    hostname.startsWith('10.') ||
    hostname.startsWith('172.')
  );
}

/**
 * Check if hostname is a Vercel preview URL
 */
export function isVercelPreview(hostname: string): boolean {
  return (
    hostname.endsWith('.vercel.app') ||
    hostname.endsWith('.vercel.live') ||
    hostname.includes('vercel-preview')
  );
}

/**
 * Get origin from request with fallback to referer
 */
export function getRequestOrigin(request: Request): string | null {
  const origin = request.headers.get('origin');
  if (origin) return origin;

  const referer = request.headers.get('referer');
  if (referer) {
    try {
      return new URL(referer).origin;
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Extract hostname from origin or referer
 */
export function getRequestHostname(request: Request): string | null {
  const origin = getRequestOrigin(request);
  if (!origin) return null;

  try {
    return new URL(origin).hostname;
  } catch {
    return null;
  }
}

/**
 * Check if request is from same origin
 */
export function isSameOrigin(request: Request): boolean {
  const origin = getRequestOrigin(request);
  const host = request.headers.get('host');
  
  if (!origin || !host) return false;

  try {
    const originUrl = new URL(origin);
    return originUrl.hostname === host;
  } catch {
    return false;
  }
}

/**
 * Get client IP address with proxy support
 */
export function getClientIP(request: Request): string {
  // Check for forwarded headers (common in proxy setups)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIP = forwarded.split(',')[0];
    if (firstIP) {
      return firstIP.trim();
    }
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback
  return 'unknown';
}

/**
 * Check if request is from a bot/crawler
 */
export function isBotRequest(request: Request): boolean {
  const userAgent = request.headers.get('user-agent') || '';
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /go-http/i,
    /httpie/i,
    /postman/i,
  ];

  return botPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * Get request fingerprint for rate limiting
 */
export function getRequestFingerprint(request: Request): string {
  const ip = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || '';
  const acceptLanguage = request.headers.get('accept-language') || '';
  
  // Create a simple fingerprint
  const fingerprint = `${ip}|${userAgent}|${acceptLanguage}`;
  
  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}
