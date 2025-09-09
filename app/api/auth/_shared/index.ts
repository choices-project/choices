/**
 * Authentication Shared Utilities
 * 
 * Centralized exports for cookie management and CSRF protection
 * Used across all authentication API routes for consistency
 */

// Cookie management
export {
  SESSION_COOKIE,
  CSRF_COOKIE,
  setSessionCookie,
  clearSessionCookie,
  setCsrfCookie,
  clearCsrfCookie,
} from "./cookies";

// CSRF protection
export {
  getOrSetCsrfCookie,
  verifyCsrfToken,
  requiresCsrfProtection,
  validateCsrfProtection,
  createCsrfErrorResponse,
} from "./csrf";
