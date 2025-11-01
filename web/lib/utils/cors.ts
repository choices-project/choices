/**
 * CORS Utility
 * 
 * CORS configuration and utilities
 * 
 * Created: October 26, 2025
 * Status: ACTIVE
 */

export type CorsOptions = {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

/**
 * Default CORS options
 */
export const defaultCorsOptions: CorsOptions = {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  credentials: true,
  maxAge: 86400
};

/**
 * Create CORS headers
 */
export function createCorsHeaders(options: CorsOptions = defaultCorsOptions): Record<string, string> {
  const headers: Record<string, string> = {};
  
  if (options.origin) {
    if (Array.isArray(options.origin)) {
      headers['Access-Control-Allow-Origin'] = options.origin.join(', ');
    } else if (typeof options.origin === 'string') {
      headers['Access-Control-Allow-Origin'] = options.origin;
    } else {
      headers['Access-Control-Allow-Origin'] = '*';
    }
  }
  
  if (options.methods) {
    headers['Access-Control-Allow-Methods'] = options.methods.join(', ');
  }
  
  if (options.allowedHeaders) {
    headers['Access-Control-Allow-Headers'] = options.allowedHeaders.join(', ');
  }
  
  if (options.credentials) {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  
  if (options.maxAge) {
    headers['Access-Control-Max-Age'] = options.maxAge.toString();
  }
  
  return headers;
}

/**
 * Handle CORS preflight request
 */
export function handleCorsPreflight(options: CorsOptions = defaultCorsOptions): Response {
  return new Response(null, {
    status: 200,
    headers: createCorsHeaders(options)
  });
}

export default {
  defaultCorsOptions,
  createCorsHeaders,
  handleCorsPreflight
};