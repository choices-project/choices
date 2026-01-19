import { describe, expect, it } from '@jest/globals';

import {
  WebAuthnError,
  WebAuthnErrorType,
} from '@/features/auth/lib/webauthn/error-handling';

describe('WebAuthn error handling', () => {
  it('derives status code and user message from error type', () => {
    const error = new WebAuthnError(
      WebAuthnErrorType.INVALID_CREDENTIAL,
      'Credential verification failed'
    );

    expect(error.name).toBe('WebAuthnError');
    expect(error.type).toBe(WebAuthnErrorType.INVALID_CREDENTIAL);
    expect(error.statusCode).toBe(404);
    expect(error.userMessage).toBe('Invalid credential provided.');
  });

  it('allows overriding user message and attaching details', () => {
    const error = new WebAuthnError(
      WebAuthnErrorType.RATE_LIMITED,
      'Too many attempts',
      'Slow down',
      { retryAfter: 120 }
    );

    expect(error.statusCode).toBe(429);
    expect(error.userMessage).toBe('Slow down');
    expect(error.details).toEqual({ retryAfter: 120 });
  });

  it('defaults to internal error code for unknown error types', () => {
    const error = new WebAuthnError(
      'UNKNOWN_ERROR' as WebAuthnErrorType,
      'Unexpected condition'
    );

    expect(error.statusCode).toBe(500);
    expect(error.userMessage).toBe('An unknown error occurred.');
  });
});


