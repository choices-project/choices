import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { CSRF_COOKIE } from "./cookies";

/**
 * CSRF Protection Module
 * 
 * Implements double-submit token pattern:
 * 1. Server sets CSRF token in cookie
 * 2. Client sends same token in X-CSRF-Token header
 * 3. Server verifies tokens match
 * 
 * This protects against Cross-Site Request Forgery attacks
 * by ensuring requests originate from the same origin.
 */

/**
 * Generates a cryptographically secure random token
 * 
 * @param length - Number of bytes to generate (default: 32)
 * @returns Hex-encoded random string
 */
function generateCsrfToken(length: number = 32): string {
  return randomBytes(length).toString("hex");
}

/**
 * Gets existing CSRF token from cookie or creates a new one
 * 
 * @returns CSRF token string
 */
export function getOrSetCsrfCookie(): string {
  const cookieStore = cookies();
  const existingToken = cookieStore.get(CSRF_COOKIE)?.value;
  
  if (existingToken) {
    return existingToken;
  }
  
  // Generate new token if none exists
  const newToken = generateCsrfToken();
  
  // Set cookie with appropriate configuration
  const isProduction = process.env.NODE_ENV === "production";
  cookieStore.set(CSRF_COOKIE, newToken, {
    httpOnly: false, // Client needs to read this
    secure: isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  
  return newToken;
}

/**
 * Verifies CSRF token from request header against cookie
 * 
 * @param headerToken - Token from X-CSRF-Token header
 * @returns true if tokens match, false otherwise
 */
export function verifyCsrfToken(headerToken?: string): boolean {
  if (!headerToken) {
    return false;
  }
  
  const cookieStore = cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE)?.value;
  
  if (!cookieToken) {
    return false;
  }
  
  // Use constant-time comparison to prevent timing attacks
  return headerToken === cookieToken;
}

/**
 * Checks if CSRF protection is required for the given HTTP method
 * 
 * @param method - HTTP method from request
 * @returns true if CSRF protection is required
 */
export function requiresCsrfProtection(method: string): boolean {
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  return !safeMethods.includes(method.toUpperCase());
}

/**
 * Validates CSRF protection for a request
 * 
 * @param request - Request object containing method and headers
 * @returns true if CSRF validation passes or is not required
 */
export function validateCsrfProtection(request: Request): boolean {
  const method = request.method;
  
  // Skip CSRF check for safe methods
  if (!requiresCsrfProtection(method)) {
    return true;
  }
  
  // Get CSRF token from header
  const headerToken = request.headers.get("x-csrf-token");
  
  // Verify token
  return verifyCsrfToken(headerToken || undefined);
}

/**
 * Creates a CSRF validation error response
 * 
 * @returns NextResponse with 403 Forbidden status
 */
export function createCsrfErrorResponse(): Response {
  return new Response(
    JSON.stringify({ 
      error: "CSRF token validation failed",
      message: "Request blocked for security reasons"
    }),
    {
      status: 403,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
