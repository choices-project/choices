// CSRF (Cross-Site Request Forgery) protection utilities
import crypto from 'crypto';

/**
 * Generate a CSRF token
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate a CSRF token
 */
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  if (!token || !sessionToken) {
    return false;
  }
  
  // Simple comparison for now - in production, use proper CSRF validation
  return token === sessionToken;
}

/**
 * Generate a CSRF token for a session
 */
export function generateSessionCSRFToken(sessionId: string): string {
  const secret = process.env.CSRF_SECRET || 'default-csrf-secret';
  return crypto.createHmac('sha256', secret).update(sessionId).digest('hex');
}

/**
 * Validate CSRF token against session
 */
export function validateSessionCSRFToken(token: string, sessionId: string): boolean {
  if (!token || !sessionId) {
    return false;
  }
  
  const expectedToken = generateSessionCSRFToken(sessionId);
  return token === expectedToken;
}
