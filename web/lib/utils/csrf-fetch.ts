/**
 * CSRF Fetch Utility
 * 
 * Fetch utility with CSRF protection
 * 
 * Created: October 26, 2025
 * Status: ACTIVE
 */

/**
 * Fetch with CSRF token
 */
export async function csrfFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  
  const headers = new Headers(options.headers);
  if (csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
  }
  
  return fetch(url, {
    ...options,
    headers
  });
}

/**
 * GET request with CSRF protection
 */
export async function csrfGet(url: string, options: RequestInit = {}): Promise<Response> {
  return csrfFetch(url, {
    ...options,
    method: 'GET'
  });
}

/**
 * POST request with CSRF protection
 */
export async function csrfPost(url: string, data?: unknown, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  
  const fetchOptions: RequestInit = {
    ...options,
    method: 'POST',
    headers
  };
  if (data) {
    fetchOptions.body = JSON.stringify(data);
  }
  return csrfFetch(url, fetchOptions);
}

/**
 * PUT request with CSRF protection
 */
export async function csrfPut(url: string, data?: unknown, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  
  const fetchOptions: RequestInit = {
    ...options,
    method: 'PUT',
    headers
  };
  if (data) {
    fetchOptions.body = JSON.stringify(data);
  }
  return csrfFetch(url, fetchOptions);
}

/**
 * DELETE request with CSRF protection
 */
export async function csrfDelete(url: string, options: RequestInit = {}): Promise<Response> {
  return csrfFetch(url, {
    ...options,
    method: 'DELETE'
  });
}

export default {
  csrfFetch,
  csrfGet,
  csrfPost,
  csrfPut,
  csrfDelete
};