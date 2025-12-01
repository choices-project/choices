/**
 * Error Sanitization Utilities
 * 
 * Provides utilities to sanitize errors before returning them to clients.
 * Ensures sensitive information like database connection strings, stack traces,
 * and internal paths are never exposed in production.
 * 
 * Created: 2025-01-XX
 * Status: ✅ ACTIVE
 */

import logger from '@/lib/utils/logger';

/**
 * Patterns that indicate sensitive information in error messages
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /key/i,
  /credential/i,
  /connection string/i,
  /database url/i,
  /supabase.*key/i,
  /api.*key/i,
  /\.env/i,
  /\/home\/[^/]+/i, // Home directory paths
  /\/Users\/[^/]+/i, // User directory paths
  /file:\/\/\/[^/]+/i, // File paths
  /at \w+ \(.*:\d+:\d+\)/i, // Stack trace patterns
];

/**
 * Sanitize error message to remove sensitive information
 */
export function sanitizeErrorMessage(message: string): string {
  let sanitized = message;

  // Check for sensitive patterns
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(sanitized)) {
      // Replace sensitive parts with generic message
      sanitized = sanitized.replace(pattern, '[REDACTED]');
    }
  }

  // Remove file paths
  sanitized = sanitized.replace(/\/[^\s]+/g, '[PATH]');

  // Remove email addresses (might contain sensitive info)
  sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]');

  // Remove IP addresses
  sanitized = sanitized.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '[IP]');

  return sanitized;
}

/**
 * Sanitize database error messages
 * Database errors often contain connection details, table names, and query information
 */
export function sanitizeDatabaseError(error: unknown): string {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // In production, return generic message
    return 'Database operation failed';
  }

  // In development, sanitize but show some details
  const message = error instanceof Error ? error.message : String(error);
  return sanitizeErrorMessage(message);
}

/**
 * Sanitize Supabase errors
 * Supabase errors may contain project URLs, API keys, or database details
 */
export function sanitizeSupabaseError(error: unknown): string {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    return 'Service temporarily unavailable';
  }

  const message = error instanceof Error ? error.message : String(error);
  
  // Remove Supabase-specific sensitive info
  const sanitized = message
    .replace(/https?:\/\/[^.]+\.supabase\.(co|io)\/[^\s]+/g, '[SUPABASE_URL]')
    .replace(/sb-[a-zA-Z0-9_-]+/g, '[SUPABASE_KEY]');

  return sanitizeErrorMessage(sanitized);
}

/**
 * Get user-friendly error message based on error type
 */
export function getUserFriendlyError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    // Network errors
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }

    // Database errors
    if (message.includes('database') || message.includes('connection') || message.includes('query')) {
      return 'Service temporarily unavailable. Please try again later.';
    }

    // Authentication errors
    if (message.includes('auth') || message.includes('unauthorized') || message.includes('token')) {
      return 'Authentication required. Please log in and try again.';
    }

    // Validation errors
    if (message.includes('validation') || message.includes('invalid')) {
      return 'Invalid input. Please check your data and try again.';
    }

    // Rate limiting
    if (message.includes('rate limit') || message.includes('too many')) {
      return 'Too many requests. Please wait a moment and try again.';
    }

    // Generic fallback
    return 'An error occurred. Please try again later.';
  }

  return 'An unexpected error occurred. Please try again later.';
}

/**
 * Sanitize error for logging (keeps details but removes sensitive info)
 */
export function sanitizeErrorForLogging(error: unknown): {
  message: string;
  name?: string;
  stack?: string;
  sanitized: boolean;
} {
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (error instanceof Error) {
    const message = isProduction 
      ? sanitizeErrorMessage(error.message)
      : error.message;
    
    const result: {
      message: string;
      name?: string;
      stack?: string;
      sanitized: boolean;
    } = {
      message,
      name: error.name,
      sanitized: isProduction,
    };
    
    if (!isProduction && error.stack) {
      result.stack = error.stack;
    }
    
    return result;
  }

  return {
    message: String(error),
    sanitized: false,
  };
}

/**
 * Log error with sanitization
 */
export function logSanitizedError(context: string, error: unknown): void {
  const sanitized = sanitizeErrorForLogging(error);
  
  logger.error(`${context}:`, {
    message: sanitized.message,
    name: sanitized.name,
    stack: sanitized.stack,
    sanitized: sanitized.sanitized,
  });
}

