/**
 * CSRF Fetch Utility
 *
 * Fetch utility with CSRF protection
 *
 * Created: October 26, 2025
 * Status: ACTIVE
 */

const mergeRequestInit = (base: RequestInit, extras: RequestInit): RequestInit => {
  const merged: RequestInit = Object.assign({}, base);
  for (const [key, value] of Object.entries(extras) as [
    keyof RequestInit,
    RequestInit[keyof RequestInit],
  ][]) {
    if (value !== undefined && value !== null) {
      (merged as Record<string, unknown>)[key as string] = value;
    } else {
      delete (merged as Record<string, unknown>)[key as string];
    }
  }
  return merged;
};

/**
 * Fetch with CSRF token
 */
export async function csrfFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

  const headers = new Headers(options.headers);
  if (csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
  }

  return fetch(url, mergeRequestInit(options, { headers }));
}

/**
 * GET request with CSRF protection
 */
export async function csrfGet(url: string, options: RequestInit = {}): Promise<Response> {
  return csrfFetch(url, mergeRequestInit(options, { method: 'GET' }));
}

/**
 * POST request with CSRF protection
 */
export async function csrfPost(url: string, data?: unknown, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');

  const fetchOptions = mergeRequestInit(options, {
    method: 'POST',
    headers,
  });

  if (data !== undefined) {
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

  const fetchOptions = mergeRequestInit(options, {
    method: 'PUT',
    headers,
  });

  if (data !== undefined) {
    fetchOptions.body = JSON.stringify(data);
  }

  return csrfFetch(url, fetchOptions);
}

/**
 * DELETE request with CSRF protection
 */
export async function csrfDelete(url: string, options: RequestInit = {}): Promise<Response> {
  return csrfFetch(url, mergeRequestInit(options, { method: 'DELETE' }));
}

export default {
  csrfFetch,
  csrfGet,
  csrfPost,
  csrfPut,
  csrfDelete
};
