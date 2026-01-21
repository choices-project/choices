/**
 * Standardized Error Messages
 *
 * Centralized error message constants for consistent error handling
 * across the application. Used by EnhancedErrorDisplay and other
 * error handling components.
 *
 * Created: January 21, 2026
 * Status: ✅ ACTIVE
 */

export type ErrorMessageConfig = {
  title: string;
  message: string;
  tip?: string;
  details?: string;
  severity?: 'error' | 'warning' | 'info';
};

export const ERROR_MESSAGES: Record<string, ErrorMessageConfig> = {
  POLL_NOT_FOUND: {
    title: 'Poll Not Found',
    message: 'The poll you\'re looking for doesn\'t exist or has been removed.',
    tip: 'Check the poll ID or return to the polls list.',
    details: 'This poll may have been deleted or the URL may be incorrect.',
    severity: 'error',
  },

  NETWORK_ERROR: {
    title: 'Connection Error',
    message: 'Unable to connect to the server.',
    tip: 'Check your internet connection and try again.',
    details: 'This might be a temporary network problem. Please verify your connection.',
    severity: 'error',
  },

  PROFILE_NOT_FOUND: {
    title: 'Profile Not Found',
    message: 'Your profile could not be loaded.',
    tip: 'You may need to complete onboarding to access your profile.',
    details: 'If you just signed up, please complete the onboarding process first.',
    severity: 'warning',
  },

  ONBOARDING_REQUIRED: {
    title: 'Onboarding Required',
    message: 'Please complete onboarding to access this page.',
    tip: 'Complete your profile setup to continue.',
    details: 'You need to finish the onboarding process before accessing this feature.',
    severity: 'info',
  },

  UNAUTHORIZED: {
    title: 'Access Denied',
    message: 'You must be logged in to access this page.',
    tip: 'Please sign in to continue.',
    details: 'This page requires authentication.',
    severity: 'error',
  },

  SERVER_ERROR: {
    title: 'Server Error',
    message: 'Something went wrong on our end.',
    tip: 'Please try again in a few moments. If the problem persists, contact support.',
    details: 'The server encountered an unexpected error while processing your request.',
    severity: 'error',
  },

  TIMEOUT_ERROR: {
    title: 'Request Timeout',
    message: 'The request took too long to complete.',
    tip: 'Please try again. The server may be experiencing high load.',
    details: 'The operation timed out after 30 seconds.',
    severity: 'warning',
  },

  VALIDATION_ERROR: {
    title: 'Validation Error',
    message: 'Please check your input and try again.',
    tip: 'Review the form fields for any highlighted errors.',
    details: 'Some required fields may be missing or invalid.',
    severity: 'warning',
  },
};

/**
 * Get error message configuration by key
 */
export function getErrorMessage(key: string): ErrorMessageConfig | undefined {
  return ERROR_MESSAGES[key];
}

/**
 * Get error message configuration with fallback
 */
export function getErrorMessageWithFallback(
  key: string,
  fallback: ErrorMessageConfig
): ErrorMessageConfig {
  return ERROR_MESSAGES[key] ?? fallback;
}

/**
 * Create a custom error message configuration
 */
export function createErrorMessage(config: ErrorMessageConfig): ErrorMessageConfig {
  return config;
}
