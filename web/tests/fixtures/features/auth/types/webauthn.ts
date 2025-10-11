/**
 * WebAuthn Test Fixtures - V2
 * 
 * This file provides test fixtures for WebAuthn functionality,
 * including mock credentials, options, and responses.
 * 
 * Created: January 21, 2025
 * Status: Active - WebAuthn testing infrastructure
 * Version: V2 - Modernized for current testing patterns
 */

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface WebAuthnCredential {
  id: string;
  type: 'public-key';
  rawId: ArrayBuffer;
  response: {
    attestationObject: ArrayBuffer;
    clientDataJSON: ArrayBuffer;
  };
}

export interface WebAuthnOptions {
  challenge: ArrayBuffer;
  rp: {
    name: string;
    id: string;
  };
  user: {
    id: ArrayBuffer;
    name: string;
    displayName: string;
  };
  pubKeyCredParams: Array<{
    type: 'public-key';
    alg: number;
  }>;
  timeout: number;
  attestation: 'none' | 'indirect' | 'direct';
}

export interface WebAuthnAssertion {
  id: string;
  type: 'public-key';
  rawId: ArrayBuffer;
  response: {
    authenticatorData: ArrayBuffer;
    clientDataJSON: ArrayBuffer;
    signature: ArrayBuffer;
    userHandle?: ArrayBuffer;
  };
}

// ============================================================================
// MOCK CREDENTIALS
// ============================================================================

export const MOCK_WEBAUTHN_CREDENTIAL: WebAuthnCredential = {
  id: 'mock-credential-id-123',
  type: 'public-key',
  rawId: new ArrayBuffer(16),
  response: {
    attestationObject: new ArrayBuffer(64),
    clientDataJSON: new ArrayBuffer(32),
  },
};

export const MOCK_WEBAUTHN_OPTIONS: WebAuthnOptions = {
  challenge: new ArrayBuffer(32),
  rp: {
    name: 'Choices Platform',
    id: 'localhost',
  },
  user: {
    id: new ArrayBuffer(16),
    name: 'test@example.com',
    displayName: 'Test User',
  },
  pubKeyCredParams: [
    {
      type: 'public-key',
      alg: -7, // ES256
    },
    {
      type: 'public-key',
      alg: -257, // RS256
    },
  ],
  timeout: 60000,
  attestation: 'none',
};

export const MOCK_WEBAUTHN_ASSERTION: WebAuthnAssertion = {
  id: 'mock-credential-id-123',
  type: 'public-key',
  rawId: new ArrayBuffer(16),
  response: {
    authenticatorData: new ArrayBuffer(37),
    clientDataJSON: new ArrayBuffer(32),
    signature: new ArrayBuffer(64),
    userHandle: new ArrayBuffer(16),
  },
};

// ============================================================================
// MOCK RESPONSES
// ============================================================================

export const MOCK_REGISTRATION_RESPONSE = {
  success: true,
  credential: MOCK_WEBAUTHN_CREDENTIAL,
  message: 'Registration successful',
};

export const MOCK_AUTHENTICATION_RESPONSE = {
  success: true,
  assertion: MOCK_WEBAUTHN_ASSERTION,
  message: 'Authentication successful',
};

export const MOCK_ERROR_RESPONSE = {
  success: false,
  error: 'WebAuthn operation failed',
  message: 'An error occurred during WebAuthn operation',
};

// ============================================================================
// MOCK FUNCTIONS
// ============================================================================

export const mockWebAuthnCreate = jest.fn().mockResolvedValue(MOCK_WEBAUTHN_CREDENTIAL);
export const mockWebAuthnGet = jest.fn().mockResolvedValue(MOCK_WEBAUTHN_ASSERTION);

export const mockWebAuthnIsSupported = jest.fn().mockReturnValue(true);
export const mockWebAuthnIsAvailable = jest.fn().mockReturnValue(true);

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Create a mock WebAuthn credential for testing
 */
export function createMockCredential(overrides: Partial<WebAuthnCredential> = {}): WebAuthnCredential {
  return {
    ...MOCK_WEBAUTHN_CREDENTIAL,
    ...overrides,
  };
}

/**
 * Create mock WebAuthn options for testing
 */
export function createMockOptions(overrides: Partial<WebAuthnOptions> = {}): WebAuthnOptions {
  return {
    ...MOCK_WEBAUTHN_OPTIONS,
    ...overrides,
  };
}

/**
 * Create mock WebAuthn assertion for testing
 */
export function createMockAssertion(overrides: Partial<WebAuthnAssertion> = {}): WebAuthnAssertion {
  return {
    ...MOCK_WEBAUTHN_ASSERTION,
    ...overrides,
  };
}

/**
 * Reset all WebAuthn mocks
 */
export function resetWebAuthnMocks(): void {
  mockWebAuthnCreate.mockClear();
  mockWebAuthnGet.mockClear();
  mockWebAuthnIsSupported.mockClear();
  mockWebAuthnIsAvailable.mockClear();
}

/**
 * Set up WebAuthn mocks for successful operations
 */
export function setupSuccessfulWebAuthnMocks(): void {
  mockWebAuthnCreate.mockResolvedValue(MOCK_WEBAUTHN_CREDENTIAL);
  mockWebAuthnGet.mockResolvedValue(MOCK_WEBAUTHN_ASSERTION);
  mockWebAuthnIsSupported.mockReturnValue(true);
  mockWebAuthnIsAvailable.mockReturnValue(true);
}

/**
 * Set up WebAuthn mocks for failed operations
 */
export function setupFailedWebAuthnMocks(): void {
  mockWebAuthnCreate.mockRejectedValue(new Error('WebAuthn create failed'));
  mockWebAuthnGet.mockRejectedValue(new Error('WebAuthn get failed'));
  mockWebAuthnIsSupported.mockReturnValue(false);
  mockWebAuthnIsAvailable.mockReturnValue(false);
}
