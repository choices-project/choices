/**
 * WebAuthn Prompt Component
 * 
 * Component for WebAuthn authentication prompts
 */

import React, { useState, useEffect } from 'react';

import { logger } from '@/lib/utils/logger';

export interface FeatureWrapperProps {
  children: React.ReactNode;
  className?: string;
  feature?: string;
  mode?: 'register' | 'authenticate';
  onComplete?: () => Promise<void>;
  onCancel?: () => void;
  onError?: (error: Error) => void;
}

export const FeatureWrapper: React.FC<FeatureWrapperProps> = ({ 
  children, 
  className = '',
  feature,
  mode = 'authenticate',
  onComplete,
  onCancel,
  onError
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if WebAuthn is supported
    const checkSupport = async () => {
      if (typeof window !== 'undefined' && window.PublicKeyCredential) {
        try {
          const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsSupported(available);
        } catch (error) {
          logger.warn('WebAuthn support check failed', { error: error instanceof Error ? error.message : String(error) });
          setIsSupported(false);
        }
      }
    };

    checkSupport();
  }, []);

  const handleWebAuthnAction = async () => {
    if (!isSupported) {
      onError?.(new Error('WebAuthn not supported on this device'));
      return;
    }

    setIsLoading(true);
    try {
      if (mode === 'register') {
        await handleRegistration();
      } else {
        await handleAuthentication();
      }
      await onComplete?.();
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistration = async () => {
    try {
      // Use the existing WebAuthn registration implementation
      const { beginRegister } = await import('@/features/auth/lib/webauthn/client');
      const result = await beginRegister();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      logger.info('WebAuthn registration completed for feature:', { feature });
    } catch (error) {
      logger.error('WebAuthn registration failed:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  };

  const handleAuthentication = async () => {
    try {
      // Use the existing WebAuthn authentication implementation
      const { beginAuthenticate } = await import('@/features/auth/lib/webauthn/client');
      const result = await beginAuthenticate();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      logger.info('WebAuthn authentication completed for feature:', { feature });
    } catch (error) {
      logger.error('WebAuthn authentication failed:', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  };

  return (
    <div className={`feature-wrapper ${className}`}>
      {children}
      {feature && (
        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
          <h3 className="font-semibold text-gray-900 mb-2">
            WebAuthn {mode === 'register' ? 'Registration' : 'Authentication'}
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            {isSupported 
              ? `Secure ${mode} using your device's biometric or security key`
              : 'WebAuthn is not supported on this device'
            }
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleWebAuthnAction}
              disabled={!isSupported || isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : `${mode === 'register' ? 'Register' : 'Authenticate'}`}
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeatureWrapper;