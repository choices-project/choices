/**
 * Log Sanitization Utilities
 *
 * Prevents sensitive data (passwords, tokens, PII) from being logged.
 * Use these utilities before logging any data that may contain sensitive information.
 *
 * Created: November 2025
 * Status: ACTIVE
 */

/**
 * Keys that indicate sensitive data (case-insensitive matching)
 */
const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'key',
  'auth',
  'credential',
  'api_key',
  'apiKey',
  'access_token',
  'refresh_token',
  'session',
  'cookie',
  'authorization',
  'bearer',
];

/**
 * Sanitize sensitive data from log objects
 *
 * Replaces sensitive values with '***' and partially masks email addresses.
 *
 * @example
 * const data = { email: 'user@example.com', password: 'secret123' };
 * const sanitized = sanitizeForLogging(data);
 * // { email: 'us***@ex***', password: '***' }
 */
export function sanitizeForLogging(data: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    // Check if key indicates sensitive data
    if (SENSITIVE_KEYS.some(sk => lowerKey.includes(sk.toLowerCase()))) {
      sanitized[key] = '***';
      continue;
    }

    // Handle email addresses (partial masking)
    if (typeof value === 'string' && value.includes('@')) {
      const [local, domain] = value.split('@');
      if (local && domain) {
        // Show first 2 chars of local, mask rest
        const maskedLocal = local.length > 2
          ? `${local.substring(0, 2)}***`
          : '***';
        // Show first 2 chars of domain, mask rest
        const maskedDomain = domain.length > 2
          ? `${domain.substring(0, 2)}***`
          : '***';
        sanitized[key] = `${maskedLocal}@${maskedDomain}`;
        continue;
      }
    }

    // Handle nested objects
    if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      sanitized[key] = sanitizeForLogging(value as Record<string, unknown>);
      continue;
    }

    // Handle arrays
    if (Array.isArray(value)) {
      sanitized[key] = value.map(item => {
        if (item && typeof item === 'object' && !(item instanceof Date)) {
          return sanitizeForLogging(item as Record<string, unknown>);
        }
        return item;
      });
      continue;
    }

    // Keep non-sensitive values as-is
    sanitized[key] = value;
  }

  return sanitized;
}

/**
 * Sanitize FormData for logging
 *
 * Removes password, token, and other sensitive fields from FormData before logging.
 *
 * @example
 * const sanitized = sanitizeFormData(formData);
 * logger.debug('Form data', sanitized);
 */
export function sanitizeFormData(formData: FormData): Record<string, string> {
  const entries: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    const lowerKey = key.toLowerCase();

    // Mask sensitive fields
    if (SENSITIVE_KEYS.some(sk => lowerKey.includes(sk.toLowerCase()))) {
      entries[key] = '***';
    } else {
      entries[key] = String(value);
    }
  }

  return entries;
}

/**
 * Sanitize URL query parameters for logging
 *
 * Removes sensitive query parameters before logging.
 */
export function sanitizeQueryParams(params: URLSearchParams | Record<string, string>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  const entries = params instanceof URLSearchParams
    ? Array.from(params.entries())
    : Object.entries(params);

  for (const [key, value] of entries) {
    const lowerKey = key.toLowerCase();

    if (SENSITIVE_KEYS.some(sk => lowerKey.includes(sk.toLowerCase()))) {
      sanitized[key] = '***';
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Check if a key indicates sensitive data
 */
export function isSensitiveKey(key: string): boolean {
  const lowerKey = key.toLowerCase();
  return SENSITIVE_KEYS.some(sk => lowerKey.includes(sk.toLowerCase()));
}

/**
 * Mask sensitive value (returns '***' for any input)
 */
export function maskSensitive(_value: unknown): string {
  return '***';
}

/**
 * Partially mask email address for logging
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return email;
  }

  const [local, domain] = email.split('@');
  if (!local || !domain) {
    return '***';
  }

  const maskedLocal = local.length > 2
    ? `${local.substring(0, 2)}***`
    : '***';
  const maskedDomain = domain.length > 2
    ? `${domain.substring(0, 2)}***`
    : '***';

  return `${maskedLocal}@${maskedDomain}`;
}

