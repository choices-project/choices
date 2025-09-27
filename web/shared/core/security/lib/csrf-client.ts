/**
 * Client-side CSRF Token Management
 * 
 * Provides utilities for managing CSRF tokens in the browser
 * Used by frontend components to include CSRF tokens in API requests
 */

/**
 * Gets the CSRF token from the cookie
 * 
 * @returns CSRF token string or null if not found
 */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') {
    return null; // Server-side rendering
  }

  const cookies = document.cookie.split(';');
  const csrfCookie = cookies.find(cookie => 
    cookie.trim().startsWith('choices_csrf=') || 
    cookie.trim().startsWith('__Host-choices_csrf=')
  );

  if (!csrfCookie) {
    return null;
  }

  return csrfCookie.split('=')[1]?.trim() || null;
}

/**
 * Creates headers object with CSRF token for API requests
 * 
 * @param additionalHeaders - Additional headers to include
 * @returns Headers object with CSRF token
 */
export function createCsrfHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  const csrfToken = getCsrfToken();
  
  if (!csrfToken) {
    console.warn('CSRF token not found in cookies');
    return additionalHeaders;
  }

  return Object.assign({
    'X-CSRF-Token': csrfToken,
    'Content-Type': 'application/json',
  }, additionalHeaders);
}

/**
 * Fetches CSRF token from server if not present in cookies
 * This should be called on app initialization
 * 
 * @returns Promise that resolves to CSRF token or null
 */
export async function ensureCsrfToken(): Promise<string | null> {
  const existingToken = getCsrfToken();
  
  if (existingToken) {
    return existingToken;
  }

  try {
    // Make a request to get CSRF token (this will set the cookie)
    const response = await fetch('/api/auth/csrf', {
      method: 'GET',
      credentials: 'include',
    });

    if (response.ok) {
      // Token should now be in cookies
      return getCsrfToken();
    }
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
  }

  return null;
}

/**
 * Makes an authenticated API request with CSRF protection
 * 
 * @param url - API endpoint URL
 * @param options - Fetch options
 * @returns Promise with fetch response
 */
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  // Ensure we have a CSRF token
  await ensureCsrfToken();

  // Add CSRF headers
  const headers = createCsrfHeaders(options.headers as Record<string, string>);

  return fetch(url, Object.assign({}, options, {
    headers,
    credentials: 'include', // Include cookies
  }));
}
