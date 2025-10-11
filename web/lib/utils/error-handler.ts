/**
 * Centralized Error Handling Utilities
 * 
 * Provides consistent error handling patterns across the application.
 * Eliminates duplicate error handling code and standardizes error messages.
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

import { logger } from '@/lib/utils/logger';

// ============================================================================
// ERROR TYPES
// ============================================================================

export type AppError = {
  message: string;
  code: string;
  statusCode: number;
  context?: Record<string, any>;
  timestamp: Date;
}

export type ErrorHandlerOptions = {
  operation: string;
  context?: Record<string, any>;
  fallbackMessage?: string;
  logLevel?: 'error' | 'warn' | 'info';
}

// ============================================================================
// ERROR CREATION
// ============================================================================

/**
 * Create a standardized application error
 */
export function createAppError(
  message: string,
  code: string,
  statusCode: number = 500,
  context?: Record<string, any>
): AppError {
  return {
    message,
    code,
    statusCode,
    context,
    timestamp: new Date()
  };
}

/**
 * Convert unknown error to AppError
 */
export function normalizeError(error: unknown, options: ErrorHandlerOptions): AppError {
  if (error instanceof Error) {
    return createAppError(
      error.message,
      'UNKNOWN_ERROR',
      500,
      { ...options.context, originalError: error.message }
    );
  }

  if (typeof error === 'string') {
    return createAppError(
      error,
      'STRING_ERROR',
      500,
      options.context
    );
  }

  return createAppError(
    options.fallbackMessage || 'An unknown error occurred',
    'UNKNOWN_ERROR',
    500,
    { ...options.context, originalError: String(error) }
  );
}

// ============================================================================
// ERROR HANDLING PATTERNS
// ============================================================================

/**
 * Handle async operations with consistent error handling
 */
export async function handleAsyncOperation<T>(
  operation: () => Promise<T>,
  options: ErrorHandlerOptions
): Promise<{ data?: T; error?: AppError }> {
  try {
    const data = await operation();
    return { data };
  } catch (error) {
    const appError = normalizeError(error, options);
    
    // Log the error
    logger[options.logLevel || 'error'](`${options.operation} failed:`, {
      error: appError,
      context: options.context
    });
    
    return { error: appError };
  }
}

/**
 * Handle sync operations with consistent error handling
 */
export function handleSyncOperation<T>(
  operation: () => T,
  options: ErrorHandlerOptions
): { data?: T; error?: AppError } {
  try {
    const data = operation();
    return { data };
  } catch (error) {
    const appError = normalizeError(error, options);
    
    // Log the error
    logger[options.logLevel || 'error'](`${options.operation} failed:`, {
      error: appError,
      context: options.context
    });
    
    return { error: appError };
  }
}

// ============================================================================
// COMMON ERROR MESSAGES
// ============================================================================

export const COMMON_ERROR_MESSAGES = {
  // Loading errors
  LOAD_FAILED: 'Failed to load data',
  SAVE_FAILED: 'Failed to save data',
  UPDATE_FAILED: 'Failed to update data',
  DELETE_FAILED: 'Failed to delete data',
  
  // Authentication errors
  AUTH_FAILED: 'Authentication failed',
  LOGIN_FAILED: 'Login failed',
  LOGOUT_FAILED: 'Logout failed',
  REGISTRATION_FAILED: 'Registration failed',
  
  // Network errors
  NETWORK_ERROR: 'Network error occurred',
  TIMEOUT_ERROR: 'Request timed out',
  CONNECTION_ERROR: 'Connection failed',
  
  // Validation errors
  VALIDATION_ERROR: 'Validation failed',
  INVALID_INPUT: 'Invalid input provided',
  MISSING_REQUIRED_FIELD: 'Required field is missing',
  
  // Permission errors
  PERMISSION_DENIED: 'Permission denied',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  
  // System errors
  INTERNAL_ERROR: 'Internal server error',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  MAINTENANCE_MODE: 'System is in maintenance mode'
} as const;

// ============================================================================
// ERROR HANDLERS FOR SPECIFIC OPERATIONS
// ============================================================================

/**
 * Handle data loading errors
 */
export function handleLoadError(error: unknown, resource: string): AppError {
  return normalizeError(error, {
    operation: `load_${resource}`,
    fallbackMessage: `Failed to load ${resource}`,
    context: { resource }
  });
}

/**
 * Handle data saving errors
 */
export function handleSaveError(error: unknown, resource: string): AppError {
  return normalizeError(error, {
    operation: `save_${resource}`,
    fallbackMessage: `Failed to save ${resource}`,
    context: { resource }
  });
}

/**
 * Handle authentication errors
 */
export function handleAuthError(error: unknown, operation: string): AppError {
  return normalizeError(error, {
    operation: `auth_${operation}`,
    fallbackMessage: `Authentication ${operation} failed`,
    context: { operation }
  });
}

/**
 * Handle validation errors
 */
export function handleValidationError(error: unknown, field?: string): AppError {
  return normalizeError(error, {
    operation: 'validation',
    fallbackMessage: field ? `Validation failed for ${field}` : 'Validation failed',
    context: { field }
  });
}

// ============================================================================
// ERROR BOUNDARY UTILITIES
// ============================================================================

/**
 * Create error boundary props
 */
export function createErrorBoundaryProps(error: AppError) {
  return {
    error: error.message,
    resetError: () => {
      // This would be implemented by the error boundary component
      window.location.reload();
    }
  };
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(error: AppError): boolean {
  return error.statusCode < 500 && error.code !== 'INTERNAL_ERROR';
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: AppError): string {
  // Map technical errors to user-friendly messages
  const friendlyMessages: Record<string, string> = {
    'NETWORK_ERROR': 'Please check your internet connection and try again.',
    'TIMEOUT_ERROR': 'The request took too long. Please try again.',
    'AUTH_FAILED': 'Please log in again to continue.',
    'PERMISSION_DENIED': 'You don\'t have permission to perform this action.',
    'VALIDATION_ERROR': 'Please check your input and try again.',
    'INTERNAL_ERROR': 'Something went wrong. Please try again later.'
  };

  return friendlyMessages[error.code] || error.message;
}