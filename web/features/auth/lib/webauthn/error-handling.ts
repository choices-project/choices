/**
 * WebAuthn Error Handling
 * 
 * Provides standardized error handling for WebAuthn operations.
 * Maps WebAuthn-specific errors to user-friendly messages and proper HTTP status codes.
 */

import { logger } from '@/lib/utils/logger';


// Local SSR guard to avoid restricted imports and missing exports
const isServer = (): boolean => typeof window === 'undefined';

/**
 * WebAuthn error types
 */
export enum WebAuthnErrorType {
  // Client-side errors
  NOT_SUPPORTED = 'NOT_SUPPORTED',
  NOT_ALLOWED = 'NOT_ALLOWED',
  INVALID_DOMAIN = 'INVALID_DOMAIN',
  CREDENTIAL_EXCLUDED = 'CREDENTIAL_EXCLUDED',
  TIMEOUT = 'TIMEOUT',
  ABORT = 'ABORT',
  
  // Server-side errors
  INVALID_CHALLENGE = 'INVALID_CHALLENGE',
  INVALID_ORIGIN = 'INVALID_ORIGIN',
  INVALID_RP_ID = 'INVALID_RP_ID',
  INVALID_CREDENTIAL = 'INVALID_CREDENTIAL',
  VERIFICATION_FAILED = 'VERIFICATION_FAILED',
  COUNTER_INVALID = 'COUNTER_INVALID',
  CREDENTIAL_EXPIRED = 'CREDENTIAL_EXPIRED',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  CREDENTIAL_NOT_FOUND = 'CREDENTIAL_NOT_FOUND',
  DATABASE_ERROR = 'DATABASE_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  
  // Security errors
  SECURITY_VIOLATION = 'SECURITY_VIOLATION',
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  REPLAY_ATTACK = 'REPLAY_ATTACK',
  
  // System errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}

/**
 * WebAuthn error details interface
 */
export interface WebAuthnErrorDetails {
  [key: string]: unknown;
}

/**
 * WebAuthn error class
 */
export class WebAuthnError extends Error {
  public readonly type: WebAuthnErrorType;
  public readonly statusCode: number;
  public readonly userMessage: string;
  public readonly details?: WebAuthnErrorDetails;

  constructor(
    type: WebAuthnErrorType,
    message: string,
    userMessage?: string,
    details?: WebAuthnErrorDetails
  ) {
    super(message);
    this.name = 'WebAuthnError';
    this.type = type;
    this.statusCode = getStatusCodeForError(type);
    this.userMessage = userMessage ?? getUserMessageForError(type);
    if (details) {
      this.details = details;
    }
  }
}

/**
 * Get HTTP status code for WebAuthn error type
 */
function getStatusCodeForError(type: WebAuthnErrorType): number {
  switch (type) {
    case WebAuthnErrorType.NOT_SUPPORTED:
    case WebAuthnErrorType.NOT_ALLOWED:
    case WebAuthnErrorType.INVALID_DOMAIN:
      return 400; // Bad Request
    
    case WebAuthnErrorType.CREDENTIAL_EXCLUDED:
    case WebAuthnErrorType.INVALID_CREDENTIAL:
    case WebAuthnErrorType.CREDENTIAL_NOT_FOUND:
      return 404; // Not Found
    
    case WebAuthnErrorType.INVALID_CHALLENGE:
    case WebAuthnErrorType.INVALID_ORIGIN:
    case WebAuthnErrorType.INVALID_RP_ID:
    case WebAuthnErrorType.VERIFICATION_FAILED:
    case WebAuthnErrorType.COUNTER_INVALID:
    case WebAuthnErrorType.INVALID_SIGNATURE:
      return 400; // Bad Request
    
    case WebAuthnErrorType.SECURITY_VIOLATION:
    case WebAuthnErrorType.REPLAY_ATTACK:
      return 403; // Forbidden
    
    case WebAuthnErrorType.RATE_LIMITED:
      return 429; // Too Many Requests
    
    case WebAuthnErrorType.USER_NOT_FOUND:
      return 404; // Not Found
    
    case WebAuthnErrorType.CREDENTIAL_EXPIRED:
      return 410; // Gone
    
    case WebAuthnErrorType.DATABASE_ERROR:
    case WebAuthnErrorType.INTERNAL_ERROR:
      return 500; // Internal Server Error
    
    case WebAuthnErrorType.SERVICE_UNAVAILABLE:
      return 503; // Service Unavailable
    
    case WebAuthnErrorType.TIMEOUT:
    case WebAuthnErrorType.ABORT:
      return 408; // Request Timeout
    
    default:
      return 500; // Internal Server Error
  }
}

/**
 * Get user-friendly message for WebAuthn error type
 */
function getUserMessageForError(type: WebAuthnErrorType): string {
  switch (type) {
    case WebAuthnErrorType.NOT_SUPPORTED:
      return 'WebAuthn is not supported on this device or browser.';
    
    case WebAuthnErrorType.NOT_ALLOWED:
      return 'WebAuthn operation was not allowed. Please check your device settings.';
    
    case WebAuthnErrorType.INVALID_DOMAIN:
      return 'Invalid domain for WebAuthn operation.';
    
    case WebAuthnErrorType.CREDENTIAL_EXCLUDED:
      return 'This credential is already registered.';
    
    case WebAuthnErrorType.TIMEOUT:
      return 'WebAuthn operation timed out. Please try again.';
    
    case WebAuthnErrorType.ABORT:
      return 'WebAuthn operation was cancelled.';
    
    case WebAuthnErrorType.INVALID_CHALLENGE:
      return 'Invalid challenge provided. Please try again.';
    
    case WebAuthnErrorType.INVALID_ORIGIN:
      return 'Invalid origin for WebAuthn operation.';
    
    case WebAuthnErrorType.INVALID_RP_ID:
      return 'Invalid relying party ID.';
    
    case WebAuthnErrorType.INVALID_CREDENTIAL:
      return 'Invalid credential provided.';
    
    case WebAuthnErrorType.VERIFICATION_FAILED:
      return 'Credential verification failed. Please try again.';
    
    case WebAuthnErrorType.COUNTER_INVALID:
      return 'Invalid credential counter. This may indicate a security issue.';
    
    case WebAuthnErrorType.CREDENTIAL_EXPIRED:
      return 'This credential has expired. Please register a new one.';
    
    case WebAuthnErrorType.USER_NOT_FOUND:
      return 'User not found.';
    
    case WebAuthnErrorType.CREDENTIAL_NOT_FOUND:
      return 'Credential not found.';
    
    case WebAuthnErrorType.DATABASE_ERROR:
      return 'Database error occurred. Please try again later.';
    
    case WebAuthnErrorType.RATE_LIMITED:
      return 'Too many requests. Please wait before trying again.';
    
    case WebAuthnErrorType.SECURITY_VIOLATION:
      return 'Security violation detected.';
    
    case WebAuthnErrorType.INVALID_SIGNATURE:
      return 'Invalid signature provided.';
    
    case WebAuthnErrorType.REPLAY_ATTACK:
      return 'Replay attack detected.';
    
    case WebAuthnErrorType.INTERNAL_ERROR:
      return 'An internal error occurred. Please try again later.';
    
    case WebAuthnErrorType.SERVICE_UNAVAILABLE:
      return 'Service is temporarily unavailable. Please try again later.';
    
    default:
      return 'An unknown error occurred.';
  }
}

/**
 * Create WebAuthn error from native error
 */
export function createWebAuthnError(
  error: Error,
  context?: string
): WebAuthnError {
  const message = error.message.toLowerCase();
  
  // Map common error messages to WebAuthn error types
  if (message.includes('not supported') || message.includes('notsupported')) {
    return new WebAuthnError(
      WebAuthnErrorType.NOT_SUPPORTED,
      error.message,
      undefined,
      { context, originalError: error.message }
    );
  }
  
  if (message.includes('not allowed') || message.includes('notallowed')) {
    return new WebAuthnError(
      WebAuthnErrorType.NOT_ALLOWED,
      error.message,
      undefined,
      { context, originalError: error.message }
    );
  }
  
  if (message.includes('timeout')) {
    return new WebAuthnError(
      WebAuthnErrorType.TIMEOUT,
      error.message,
      undefined,
      { context, originalError: error.message }
    );
  }
  
  if (message.includes('abort')) {
    return new WebAuthnError(
      WebAuthnErrorType.ABORT,
      error.message,
      undefined,
      { context, originalError: error.message }
    );
  }
  
  if (message.includes('invalid challenge')) {
    return new WebAuthnError(
      WebAuthnErrorType.INVALID_CHALLENGE,
      error.message,
      undefined,
      { context, originalError: error.message }
    );
  }
  
  if (message.includes('verification failed')) {
    return new WebAuthnError(
      WebAuthnErrorType.VERIFICATION_FAILED,
      error.message,
      undefined,
      { context, originalError: error.message }
    );
  }
  
  if (message.includes('database') || message.includes('connection')) {
    return new WebAuthnError(
      WebAuthnErrorType.DATABASE_ERROR,
      error.message,
      undefined,
      { context, originalError: error.message }
    );
  }
  
  // Default to internal error
  return new WebAuthnError(
    WebAuthnErrorType.INTERNAL_ERROR,
    error.message,
    undefined,
    { context, originalError: error.message }
  );
}

/**
 * Handle WebAuthn error and return appropriate response
 */
export function handleWebAuthnError(error: unknown): {
  statusCode: number;
  error: WebAuthnErrorType;
  userMessage: string;
  details?: WebAuthnErrorDetails;
} {
  if (error instanceof WebAuthnError) {
    return {
      statusCode: error.statusCode,
      error: error.type,
      userMessage: error.userMessage,
      ...(error.details && { details: error.details })
    };
  }
  
  if (error instanceof Error) {
    const webAuthnError = createWebAuthnError(error);
    return {
      statusCode: webAuthnError.statusCode,
      error: webAuthnError.type,
      userMessage: webAuthnError.userMessage,
      ...(webAuthnError.details && { details: webAuthnError.details })
    };
  }
  
  // Unknown error
  return {
    statusCode: 500,
    error: WebAuthnErrorType.INTERNAL_ERROR,
    userMessage: 'An unknown error occurred.',
    details: { originalError: String(error) }
  };
}

/**
 * Log WebAuthn error for security auditing
 */
export function logWebAuthnError(
  error: WebAuthnError,
  context?: {
    userId?: string;
    credentialId?: string;
    operation?: string;
    ip?: string;
    userAgent?: string;
  }
): void {
  const logData = {
    errorType: error.type,
    message: error.message,
    statusCode: error.statusCode,
    timestamp: new Date().toISOString(),
    context: {
      ...context,
      credentialId: context?.credentialId ? 
        `${context.credentialId.substring(0, 8)  }...` : undefined
    },
    details: error.details
  };

  // Persist detailed logs on the server when enabled
  if (isServer() && (process.env.WEBAUTHN_ERROR_LOG === '1' || process.env.WEBAUTHN_ERROR_LOG === 'true')) {
    // Fire and forget; avoid blocking request cycle
    void persistWebAuthnError(logData).catch(() => {
      // Swallow file logging errors to avoid cascading failures
    });
  }

  // Console-level logging with severity
  if (error.statusCode >= 500) {
    console.error('WebAuthn server error:', logData);
  } else if (error.statusCode >= 400) {
    console.warn('WebAuthn client error:', logData);
  } else {
    logger.info('WebAuthn error:', { logData });
  }
}

/**
 * Validate WebAuthn operation context
 */
export function validateWebAuthnContext(context: {
  origin?: string;
  rpID?: string;
  challenge?: string;
  credentialId?: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (context.origin) {
    try {
      const url = new URL(context.origin);
      // Enforce HTTPS except for localhost
      const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
      if (!isLocalhost && url.protocol !== 'https:') {
        errors.push('Origin must use HTTPS');
      }
      // Minimal sanity check: must include a hostname
      if (!url.hostname) {
        errors.push('Origin must include a valid hostname');
      }
    } catch {
      errors.push('Invalid origin format');
    }
  }
  
  if (context.rpID) {
    const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!hostnameRegex.test(context.rpID)) {
      errors.push('Invalid RP ID format');
    }
  }
  
  if (context.challenge) {
    try {
      // Validate base64url format
      const base64urlRegex = /^[A-Za-z0-9_-]*$/;
      if (!base64urlRegex.test(context.challenge)) {
        errors.push('Invalid challenge format');
      }
    } catch {
      errors.push('Invalid challenge format');
    }
  }
  
  if (context.credentialId) {
    try {
      // Validate base64url format
      const base64urlRegex = /^[A-Za-z0-9_-]*$/;
      if (!base64urlRegex.test(context.credentialId)) {
        errors.push('Invalid credential ID format');
      }
    } catch {
      errors.push('Invalid credential ID format');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Persist WebAuthn error logs to file (server-only)
 */
async function persistWebAuthnError(data: unknown): Promise<void> {
  if (!isServer()) return; // Double-guard

  const fsPromises = await import('node:fs/promises');
  const pathMod = await import('node:path');

  const dir = pathMod.resolve(process.cwd(), '.reports');
  const file = pathMod.join(dir, 'webauthn-errors.jsonl');

  try {
    // Ensure directory exists
    await fsPromises.mkdir(dir, { recursive: true });
    // Append JSON line
    const line = `${JSON.stringify(data)  }\n`;
    await fsPromises.appendFile(file, line, { encoding: 'utf-8' });
  } catch (err) {
    // Last resort: non-throwing debug log
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Failed to persist WebAuthn error log:', err);
    }
  }
}
