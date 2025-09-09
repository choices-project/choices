import { NextResponse } from "next/server";

/**
 * Cookie Security Configuration
 * 
 * Production: Uses __Host- prefix for enhanced security
 * Development: Uses standard names for localhost compatibility
 * 
 * __Host- prefix requirements:
 * - secure: true (HTTPS only)
 * - path: "/" (root path)
 * - no Domain attribute (host-bound)
 */
const isProduction = process.env.NODE_ENV === "production";

export const SESSION_COOKIE = isProduction ? "__Host-choices_session" : "choices_session";
export const CSRF_COOKIE = isProduction ? "__Host-choices_csrf" : "choices_csrf";

/**
 * Cookie configuration for production vs development
 */
const getCookieConfig = (maxAgeSec: number) => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  path: "/",
  maxAge: maxAgeSec,
});

/**
 * Sets a secure session cookie with appropriate configuration
 * 
 * @param response - NextResponse object to set cookie on
 * @param token - JWT token to store in cookie
 * @param maxAgeSec - Cookie expiration time in seconds
 */
export function setSessionCookie(
  response: NextResponse,
  token: string,
  maxAgeSec: number
): void {
  response.cookies.set(SESSION_COOKIE, token, getCookieConfig(maxAgeSec));
}

/**
 * Clears the session cookie by setting it to empty with maxAge: 0
 * 
 * @param response - NextResponse object to clear cookie on
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set(SESSION_COOKIE, "", {
    ...getCookieConfig(0),
    maxAge: 0,
  });
}

/**
 * Sets a CSRF token cookie (not httpOnly so client can read it)
 * 
 * @param response - NextResponse object to set cookie on
 * @param token - CSRF token to store
 * @param maxAgeSec - Cookie expiration time in seconds
 */
export function setCsrfCookie(
  response: NextResponse,
  token: string,
  maxAgeSec: number
): void {
  response.cookies.set(CSRF_COOKIE, token, {
    ...getCookieConfig(maxAgeSec),
    httpOnly: false, // Client needs to read this for CSRF protection
  });
}

/**
 * Clears the CSRF cookie
 * 
 * @param response - NextResponse object to clear cookie on
 */
export function clearCsrfCookie(response: NextResponse): void {
  response.cookies.set(CSRF_COOKIE, "", {
    ...getCookieConfig(0),
    httpOnly: false,
    maxAge: 0,
  });
}
