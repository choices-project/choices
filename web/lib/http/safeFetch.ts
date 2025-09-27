// Safe HTTP utilities with typed responses
// Created: 2025-01-16
// Purpose: Type-safe fetch wrapper with discriminated union responses

import type { ApiResult, ApiErr } from '../../types/api';

/**
 * Type-safe JSON fetch that returns discriminated union
 */
export async function safeJson<T>(
  input: RequestInfo, 
  init?: RequestInit
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(input, init);
    const body = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      return {
        ok: false,
        code: `HTTP_${response.status}`,
        message: body?.message ?? response.statusText,
        details: { status: response.status, body }
      };
    }
    
    return {
      ok: true,
      data: body as T
    };
  } catch (error) {
    return {
      ok: false,
      code: 'NETWORK',
      message: error instanceof Error ? error.message : String(error),
      details: { originalError: error }
    };
  }
}

/**
 * Type-safe fetch for non-JSON responses
 */
export async function safeFetch(
  input: RequestInfo,
  init?: RequestInit
): Promise<ApiResult<Response>> {
  try {
    const response = await fetch(input, init);
    
    if (!response.ok) {
      return {
        ok: false,
        code: `HTTP_${response.status}`,
        message: response.statusText,
        details: { status: response.status }
      };
    }
    
    return {
      ok: true,
      data: response
    };
  } catch (error) {
    return {
      ok: false,
      code: 'NETWORK',
      message: error instanceof Error ? error.message : String(error),
      details: { originalError: error }
    };
  }
}

/**
 * Type-safe fetch with automatic retry logic
 */
export async function safeJsonWithRetry<T>(
  input: RequestInfo,
  init?: RequestInit,
  maxRetries = 3
): Promise<ApiResult<T>> {
  let lastError: ApiErr | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const result = await safeJson<T>(input, init);
    
    if (result.ok) {
      return result;
    }
    
    lastError = result;
    
    // Don't retry on client errors (4xx) except 429 (rate limit)
    if (result.code.startsWith('HTTP_4') && !result.code.includes('429')) {
      break;
    }
    
    // Don't retry on the last attempt
    if (attempt === maxRetries) {
      break;
    }
    
    // Exponential backoff
    const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  
  return lastError!;
}


