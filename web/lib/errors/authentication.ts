/**
 * Authentication Error Classes
 * 
 * Errors related to user authentication, authorization, and session management.
 */

import { ApplicationError, ErrorDetails } from './base';

export class AuthenticationError extends ApplicationError {
  constructor(message: string = 'Authentication required', details?: ErrorDetails) {
    super(message, 401, 'AUTH_REQUIRED', details);
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message: string = 'Insufficient permissions', details?: ErrorDetails) {
    super(message, 403, 'AUTH_INSUFFICIENT_PERMISSIONS', details);
  }
}

export class InvalidCredentialsError extends ApplicationError {
  constructor(message: string = 'Invalid credentials provided', details?: ErrorDetails) {
    super(message, 401, 'AUTH_INVALID_CREDENTIALS', details);
  }
}

export class SessionExpiredError extends ApplicationError {
  constructor(message: string = 'Session has expired', details?: ErrorDetails) {
    super(message, 401, 'AUTH_SESSION_EXPIRED', details);
  }
}

export class WebAuthnError extends ApplicationError {
  constructor(message: string = 'WebAuthn authentication failed', details?: ErrorDetails) {
    super(message, 401, 'AUTH_WEBAUTHN_FAILED', details);
  }
}

export class PasskeyNotFoundError extends ApplicationError {
  constructor(message: string = 'Passkey not found', details?: ErrorDetails) {
    super(message, 404, 'AUTH_PASSKEY_NOT_FOUND', details);
  }
}

export class PasskeyAlreadyExistsError extends ApplicationError {
  constructor(message: string = 'Passkey already exists for this user', details?: ErrorDetails) {
    super(message, 409, 'AUTH_PASSKEY_EXISTS', details);
  }
}
