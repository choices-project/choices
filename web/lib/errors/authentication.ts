/**
 * Authentication Error Classes
 * 
 * Errors related to user authentication, authorization, and session management.
 */

import { ApplicationError, type ErrorDetails } from './base';

export class AuthenticationError extends ApplicationError {
  constructor(message = 'Authentication required', details?: ErrorDetails) {
    super(message, 401, 'AUTH_REQUIRED', details);
  }
}

export class AuthorizationError extends ApplicationError {
  constructor(message = 'Insufficient permissions', details?: ErrorDetails) {
    super(message, 403, 'AUTH_INSUFFICIENT_PERMISSIONS', details);
  }
}

export class InvalidCredentialsError extends ApplicationError {
  constructor(message = 'Invalid credentials provided', details?: ErrorDetails) {
    super(message, 401, 'AUTH_INVALID_CREDENTIALS', details);
  }
}

export class SessionExpiredError extends ApplicationError {
  constructor(message = 'Session has expired', details?: ErrorDetails) {
    super(message, 401, 'AUTH_SESSION_EXPIRED', details);
  }
}

export class WebAuthnError extends ApplicationError {
  constructor(message = 'WebAuthn authentication failed', details?: ErrorDetails) {
    super(message, 401, 'AUTH_WEBAUTHN_FAILED', details);
  }
}

export class PasskeyNotFoundError extends ApplicationError {
  constructor(message = 'Passkey not found', details?: ErrorDetails) {
    super(message, 404, 'AUTH_PASSKEY_NOT_FOUND', details);
  }
}

export class PasskeyAlreadyExistsError extends ApplicationError {
  constructor(message = 'Passkey already exists for this user', details?: ErrorDetails) {
    super(message, 409, 'AUTH_PASSKEY_EXISTS', details);
  }
}
