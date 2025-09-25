/**
 * HTTP utilities
 * 
 * This module provides HTTP-related utility functions for the application.
 * It replaces the old @/shared/utils/lib/http imports.
 */

export function requireTrustedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  
  // Allow localhost for development
  if (host?.includes('localhost') || host?.includes('127.0.0.1')) {
    return true;
  }
  
  // Add your trusted origins here
  const trustedOrigins = [
    'https://yourdomain.com',
    'https://www.yourdomain.com'
  ];
  
  return origin ? trustedOrigins.includes(origin) : false;
}

export function isLocalhost(ip: string | null): boolean {
  if (!ip) return false;
  return ip === '127.0.0.1' || ip === '::1' || ip === 'localhost';
}










