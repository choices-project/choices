/**
 * CSRF-Aware Fetch Helper
 * 
 * Automatically handles CSRF token acquisition and inclusion for state-changing requests.
 * This fixes the critical issue where authentication was completely broken due to
 * missing X-CSRF-Token headers.
 * 
 * Created: January 25, 2025
 * Updated: January 25, 2025
 */

import { createCsrfHeaders } from '@/shared/core/security/lib/csrf-client';

/**
 * CSRF-aware fetch wrapper that automatically includes CSRF tokens
 * for state-changing HTTP methods (POST, PUT, PATCH, DELETE).
 * 
 * @param url - The URL to fetch
 * @param options - Fetch options (method, body, headers, etc.)
 * @returns Promise<Response> - The fetch response
 */
export async function csrfFetch(
  url: string | URL,
  options: RequestInit = {}
): Promise<Response> {
  const method = options.method?.toUpperCase() || 'GET';
  
  // Only add CSRF protection for state-changing methods
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  
  if (stateChangingMethods.includes(method)) {
    // Get CSRF headers (this will fetch token if needed)
    const csrfHeaders = await createCsrfHeaders();
    
    // Merge with existing headers
    const headers = new Headers(options.headers);
    Object.entries(csrfHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });
    
    return fetch(url, Object.assign({}, options, {
      headers,
    }));
  }
  
  // For safe methods (GET, HEAD, OPTIONS), use regular fetch
  return fetch(url, options);
}

/**
 * Convenience method for POST requests with JSON body
 */
export async function csrfPost(
  url: string | URL,
  data: unknown,
  options: Omit<RequestInit, 'method' | 'body'> = {}
): Promise<Response> {
  return csrfFetch(url, Object.assign({}, options, {
    method: 'POST',
    headers: Object.assign({
      'Content-Type': 'application/json',
    }, options.headers),
    body: JSON.stringify(data),
  }));
}

/**
 * Convenience method for PUT requests with JSON body
 */
export async function csrfPut(
  url: string | URL,
  data: unknown,
  options: Omit<RequestInit, 'method' | 'body'> = {}
): Promise<Response> {
  return csrfFetch(url, Object.assign({}, options, {
    method: 'PUT',
    headers: Object.assign({
      'Content-Type': 'application/json',
    }, options.headers),
    body: JSON.stringify(data),
  }));
}

/**
 * Convenience method for PATCH requests with JSON body
 */
export async function csrfPatch(
  url: string | URL,
  data: unknown,
  options: Omit<RequestInit, 'method' | 'body'> = {}
): Promise<Response> {
  return csrfFetch(url, Object.assign({}, options, {
    method: 'PATCH',
    headers: Object.assign({
      'Content-Type': 'application/json',
    }, options.headers),
    body: JSON.stringify(data),
  }));
}

/**
 * Convenience method for DELETE requests
 */
export async function csrfDelete(
  url: string | URL,
  options: Omit<RequestInit, 'method'> = {}
): Promise<Response> {
  return csrfFetch(url, Object.assign({}, options, {
    method: 'DELETE',
  }));
}
