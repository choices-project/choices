/**
 * WebAuthn Utilities Unit Tests
 * 
 * Comprehensive tests for WebAuthn utility functions
 * 
 * Created: September 15, 2025
 * Updated: September 15, 2025
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  arrayBufferToBase64,
  base64ToArrayBuffer,
  generateChallenge,
  isWebAuthnSupported,
  isBiometricAvailable,
  getDeviceInfo,
  handleWebAuthnError,
  getAuthenticatorType,
  WebAuthnErrorType
} from './webauthn';

// Mock the logger
jest.mock('@/lib/logger', () => ({
  devLog: jest.fn()
}));

// Mock global objects
const mockNavigator = {
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  credentials: {
    create: jest.fn(),
    get: jest.fn()
  }
};

const mockWindow = {
  location: {
    hostname: 'localhost'
  }
};

const mockCrypto = {
  getRandomValues: jest.fn()
};

const mockPublicKeyCredential = {
  isUserVerifyingPlatformAuthenticatorAvailable: jest.fn() as jest.MockedFunction<() => Promise<boolean>>
};

describe('WebAuthn Utilities', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock global objects
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true
    });
    
    Object.defineProperty(global, 'window', {
      value: mockWindow,
      writable: true
    });
    
    Object.defineProperty(global, 'crypto', {
      value: mockCrypto,
      writable: true
    });
    
    Object.defineProperty(global, 'PublicKeyCredential', {
      value: mockPublicKeyCredential,
      writable: true
    });
  });

  describe('ArrayBuffer Conversion', () => {
    it('should convert ArrayBuffer to Base64', () => {
      const buffer = new ArrayBuffer(4);
      const view = new Uint8Array(buffer);
      view[0] = 72; // 'H'
      view[1] = 101; // 'e'
      view[2] = 108; // 'l'
      view[3] = 108; // 'l'
      
      const base64 = arrayBufferToBase64(buffer);
      expect(base64).toBe('SGVsbA==');
    });

    it('should convert Base64 to ArrayBuffer', () => {
      const base64 = 'SGVsbA==';
      const buffer = base64ToArrayBuffer(base64);
      const view = new Uint8Array(buffer);
      
      expect(view[0]).toBe(72); // 'H'
      expect(view[1]).toBe(101); // 'e'
      expect(view[2]).toBe(108); // 'l'
      expect(view[3]).toBe(108); // 'l'
    });

    it('should handle empty ArrayBuffer', () => {
      const buffer = new ArrayBuffer(0);
      const base64 = arrayBufferToBase64(buffer);
      expect(base64).toBe('');
      
      const backToBuffer = base64ToArrayBuffer(base64);
      expect(backToBuffer.byteLength).toBe(0);
    });

    it('should handle round-trip conversion', () => {
      const originalBuffer = new ArrayBuffer(8);
      const view = new Uint8Array(originalBuffer);
      for (let i = 0; i < 8; i++) {
        view[i] = Math.floor(Math.random() * 256);
      }
      
      const base64 = arrayBufferToBase64(originalBuffer);
      const convertedBuffer = base64ToArrayBuffer(base64);
      
      expect(convertedBuffer.byteLength).toBe(originalBuffer.byteLength);
      
      const originalView = new Uint8Array(originalBuffer);
      const convertedView = new Uint8Array(convertedBuffer);
      
      for (let i = 0; i < originalView.length; i++) {
        expect(convertedView[i]).toBe(originalView[i]);
      }
    });
  });

  describe('Challenge Generation', () => {
    it('should generate random challenge', () => {
      const mockRandomValues = new Uint8Array(32);
      for (let i = 0; i < 32; i++) {
        mockRandomValues[i] = Math.floor(Math.random() * 256);
      }
      
      mockCrypto.getRandomValues.mockReturnValue(mockRandomValues);
      
      const challenge = generateChallenge();
      expect(challenge).toBeInstanceOf(ArrayBuffer);
      expect(challenge.byteLength).toBe(32);
      
      expect(mockCrypto.getRandomValues).toHaveBeenCalledWith(expect.any(Uint8Array));
    });

    it('should generate different challenges', () => {
      const challenge1 = generateChallenge();
      const challenge2 = generateChallenge();
      
      // Challenges should be different (very high probability)
      expect(challenge1).not.toEqual(challenge2);
    });
  });

  describe('WebAuthn Support Detection', () => {
    it('should detect WebAuthn support when available', () => {
      const supported = isWebAuthnSupported();
      expect(supported).toBe(true);
    });

    it('should detect lack of WebAuthn support', () => {
      // Mock missing WebAuthn support
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true
      });
      
      const supported = isWebAuthnSupported();
      expect(supported).toBe(false);
    });

    it('should detect missing PublicKeyCredential', () => {
      Object.defineProperty(global, 'PublicKeyCredential', {
        value: undefined,
        writable: true
      });
      
      const supported = isWebAuthnSupported();
      expect(supported).toBe(false);
    });

    it('should detect missing navigator.credentials', () => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'test' },
        writable: true
      });
      
      const supported = isWebAuthnSupported();
      expect(supported).toBe(false);
    });
  });

  describe('Biometric Availability', () => {
    it('should check biometric availability when supported', async () => {
      mockPublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable.mockResolvedValue(true);
      
      const available = await isBiometricAvailable();
      expect(available).toBe(true);
      expect(mockPublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable).toHaveBeenCalled();
    });

    it('should return false when biometric not available', async () => {
      mockPublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable.mockResolvedValue(false);
      
      const available = await isBiometricAvailable();
      expect(available).toBe(false);
    });

    it('should return false when WebAuthn not supported', async () => {
      Object.defineProperty(global, 'PublicKeyCredential', {
        value: undefined,
        writable: true
      });
      
      const available = await isBiometricAvailable();
      expect(available).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      mockPublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable.mockRejectedValue(new Error('Test error'));
      
      const available = await isBiometricAvailable();
      expect(available).toBe(false);
    });
  });

  describe('Device Information', () => {
    it('should detect Windows device', () => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        writable: true
      });
      
      const deviceInfo = getDeviceInfo();
      expect(deviceInfo.deviceType).toBe('windows');
      expect(deviceInfo.browser).toBe('chrome');
      expect(deviceInfo.platform).toBe('microsoft');
    });

    it('should detect iOS device', () => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15' },
        writable: true
      });
      
      const deviceInfo = getDeviceInfo();
      expect(deviceInfo.deviceType).toBe('ios');
      expect(deviceInfo.browser).toBe('safari');
      expect(deviceInfo.platform).toBe('apple');
    });

    it('should detect Android device', () => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36' },
        writable: true
      });
      
      const deviceInfo = getDeviceInfo();
      expect(deviceInfo.deviceType).toBe('android');
      expect(deviceInfo.browser).toBe('chrome');
      expect(deviceInfo.platform).toBe('google');
    });

    it('should detect Firefox browser', () => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:91.0) Gecko/20100101 Firefox/91.0' },
        writable: true
      });
      
      const deviceInfo = getDeviceInfo();
      expect(deviceInfo.browser).toBe('firefox');
    });

    it('should handle unknown user agent', () => {
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Unknown Browser' },
        writable: true
      });
      
      const deviceInfo = getDeviceInfo();
      expect(deviceInfo.deviceType).toBe('unknown');
      expect(deviceInfo.browser).toBe('unknown');
      expect(deviceInfo.platform).toBe('unknown');
    });

    it('should handle missing navigator', () => {
      Object.defineProperty(global, 'navigator', {
        value: undefined,
        writable: true
      });
      
      const deviceInfo = getDeviceInfo();
      expect(deviceInfo.deviceType).toBe('unknown');
      expect(deviceInfo.browser).toBe('unknown');
      expect(deviceInfo.platform).toBe('unknown');
    });
  });

  describe('Error Handling', () => {
    it('should handle NotAllowedError', () => {
      const error = { name: 'NotAllowedError', message: 'User cancelled' };
      const webAuthnError = handleWebAuthnError(error);
      
      expect(webAuthnError.type).toBe(WebAuthnErrorType.USER_CANCELLED);
      expect(webAuthnError.message).toBe('Authentication was cancelled by the user');
      expect(webAuthnError.recoverable).toBe(true);
      expect(webAuthnError.suggestedAction).toContain('Try again');
    });

    it('should handle SecurityError', () => {
      const error = { name: 'SecurityError', message: 'Security violation' };
      const webAuthnError = handleWebAuthnError(error);
      
      expect(webAuthnError.type).toBe(WebAuthnErrorType.SECURITY_ERROR);
      expect(webAuthnError.message).toBe('Security error occurred during authentication');
      expect(webAuthnError.recoverable).toBe(false);
      expect(webAuthnError.suggestedAction).toContain('contact support');
    });

    it('should handle InvalidStateError', () => {
      const error = { name: 'InvalidStateError', message: 'Invalid state' };
      const webAuthnError = handleWebAuthnError(error);
      
      expect(webAuthnError.type).toBe(WebAuthnErrorType.INVALID_RESPONSE);
      expect(webAuthnError.message).toBe('Invalid authentication state');
      expect(webAuthnError.recoverable).toBe(true);
    });

    it('should handle NotSupportedError', () => {
      const error = { name: 'NotSupportedError', message: 'Not supported' };
      const webAuthnError = handleWebAuthnError(error);
      
      expect(webAuthnError.type).toBe(WebAuthnErrorType.NOT_SUPPORTED);
      expect(webAuthnError.message).toBe('Biometric authentication is not supported on this device');
      expect(webAuthnError.recoverable).toBe(false);
    });

    it('should handle AbortError', () => {
      const error = { name: 'AbortError', message: 'Aborted' };
      const webAuthnError = handleWebAuthnError(error);
      
      expect(webAuthnError.type).toBe(WebAuthnErrorType.TIMEOUT);
      expect(webAuthnError.message).toBe('Authentication timed out');
      expect(webAuthnError.recoverable).toBe(true);
    });

    it('should handle unknown errors', () => {
      const error = { name: 'UnknownError', message: 'Something went wrong' };
      const webAuthnError = handleWebAuthnError(error);
      
      expect(webAuthnError.type).toBe(WebAuthnErrorType.UNKNOWN);
      expect(webAuthnError.message).toBe('Something went wrong');
      expect(webAuthnError.recoverable).toBe(true);
    });

    it('should handle errors without name', () => {
      const error = { message: 'Generic error' };
      const webAuthnError = handleWebAuthnError(error);
      
      expect(webAuthnError.type).toBe(WebAuthnErrorType.UNKNOWN);
      expect(webAuthnError.message).toBe('Generic error');
    });

    it('should handle errors without message', () => {
      const error = { name: 'SomeError' };
      const webAuthnError = handleWebAuthnError(error);
      
      expect(webAuthnError.type).toBe(WebAuthnErrorType.UNKNOWN);
      expect(webAuthnError.message).toBe('SomeError');
    });
  });

  describe('Authenticator Type Detection', () => {
    it('should detect platform authenticator', () => {
      const credential = {
        authenticatorAttachment: 'platform'
      } as PublicKeyCredential;
      
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)' },
        writable: true
      });
      
      const type = getAuthenticatorType(credential);
      expect(type).toBe('face');
    });

    it('should detect fingerprint on Android', () => {
      const credential = {
        authenticatorAttachment: 'platform'
      } as PublicKeyCredential;
      
      Object.defineProperty(global, 'navigator', {
        value: { userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36' },
        writable: true
      });
      
      const type = getAuthenticatorType(credential);
      expect(type).toBe('fingerprint');
    });

    it('should detect cross-platform authenticator', () => {
      const credential = {
        authenticatorAttachment: 'cross-platform'
      } as PublicKeyCredential;
      
      const type = getAuthenticatorType(credential);
      expect(type).toBe('cross-platform');
    });

    it('should handle unknown authenticator attachment', () => {
      const credential = {} as PublicKeyCredential;
      
      const type = getAuthenticatorType(credential);
      expect(type).toBe('unknown');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null/undefined errors', () => {
      const webAuthnError = handleWebAuthnError(null);
      expect(webAuthnError.type).toBe(WebAuthnErrorType.UNKNOWN);
      expect(webAuthnError.message).toBe('Unknown error');
    });

    it('should handle empty string errors', () => {
      const webAuthnError = handleWebAuthnError('');
      expect(webAuthnError.type).toBe(WebAuthnErrorType.UNKNOWN);
      expect(webAuthnError.message).toBe('Unknown error');
    });

    it('should handle numeric errors', () => {
      const webAuthnError = handleWebAuthnError(123);
      expect(webAuthnError.type).toBe(WebAuthnErrorType.UNKNOWN);
      expect(webAuthnError.message).toBe('Unknown error');
    });
  });
});
