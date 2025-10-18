'use client'

import { Fingerprint, Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { useState, useEffect, createContext, useContext } from 'react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
// Native WebAuthn implementation to avoid decorator issues


import { devLog } from '@/lib/utils/logger'

// Context for sharing biometric setup state
const BiometricSetupContext = createContext<{
  isSupported: boolean | null;
  isAvailable: boolean | null;
  hasCredentials: boolean | null;
  isRegistering: boolean;
  error: string | null;
  success: boolean;
}>({
  isSupported: null,
  isAvailable: null,
  hasCredentials: null,
  isRegistering: false,
  error: null,
  success: false
});

// Hook to use biometric setup context
export function useBiometricSetupContext() {
  return useContext(BiometricSetupContext);
}

interface BiometricSetupProps {
  userId: string
  username: string
  onSuccess?: () => void
  onError?: () => void
}

export default function BiometricSetup({ userId, username, onSuccess, onError }: BiometricSetupProps) {
  // Validate required parameters
  if (!userId || !username) {
    throw new Error('userId and username are required for biometric setup')
  }
  const [isSupported, setIsSupported] = useState<boolean | null>(null)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [hasCredentials, setHasCredentials] = useState<boolean | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Create context value to share state
  const contextValue = {
    isSupported,
    isAvailable,
    hasCredentials,
    isRegistering,
    error,
    success
  }

  // Initialize biometric support check on component mount
  useEffect(() => {
    const initializeBiometricSupport = async () => {
      try {
        // Dynamic import to avoid build-time decorator issues
        const { isWebAuthnSupported, isBiometricAvailable, getUserCredentials } = await import('@/features/auth/lib/webauthn/client');
        
        const supported = isWebAuthnSupported()
        setIsSupported(supported)

        if (supported) {
          const available = await isBiometricAvailable()
          setIsAvailable(available)

          if (available) {
            // Check for existing credentials to provide better user feedback
            const existingCreds = await getUserCredentials()
            const hasCreds = Array.isArray(existingCreds) && existingCreds.length > 0
            setHasCredentials(hasCreds)
            
            if (hasCreds) {
              devLog('Existing biometric credentials found:', { count: existingCreds.length })
            }
          }
        }
      } catch (error) {
        devLog('Error checking biometric support:', { error })
        setError('Failed to check biometric support')
      }
    }

    initializeBiometricSupport()
  }, [userId])



  const handleRegister = async () => {
    setIsRegistering(true)
    setError(null)

    try {
      // Dynamic import to avoid build-time decorator issues
      const { registerBiometric } = await import('@/features/auth/lib/webauthn/client');
      const result = await registerBiometric()
      
      if (result.success) {
        setSuccess(true)
        setHasCredentials(true)
        onSuccess?.()
      } else {
        const errorMessage = typeof result.error === 'string' ? result.error : 'Registration failed'
        setError(errorMessage)
        // Use the error parameter properly in the callback
        onError?.()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed'
      setError(errorMessage)
      // Use the error parameter properly in the callback
      onError?.()
    } finally {
      setIsRegistering(false)
    }
  }

  return (
    <BiometricSetupContext.Provider value={contextValue}>
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Biometric Authentication Setup
            <Shield className="h-4 w-4 text-green-600" />
          </CardTitle>
          <CardDescription>
            Set up fingerprint or face recognition for secure, passwordless login for {username}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Status Indicators */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">WebAuthn Support</span>
              <Badge variant={isSupported ? "default" : "secondary"}>
                {isSupported ? "Supported" : "Not Supported"}
              </Badge>
            </div>

            {isSupported && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Biometric Availability</span>
                <Badge variant={isAvailable ? "default" : "secondary"}>
                  {isAvailable ? "Available" : "Not Available"}
                </Badge>
              </div>
            )}

            {isAvailable && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Credentials Status</span>
                <Badge variant={hasCredentials ? "default" : "secondary"}>
                  {hasCredentials ? "Configured" : "Not Configured"}
                </Badge>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Display */}
          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Your biometric authentication has been successfully configured. 
                You can now use fingerprint or face recognition to log in.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Button */}
          {isSupported && isAvailable && !hasCredentials && !success && (
            <Button 
              onClick={handleRegister}
              disabled={isRegistering}
              className="w-full"
            >
              {isRegistering ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Setting up...
                </>
              ) : (
                <>
                  <Fingerprint className="h-4 w-4 mr-2" />
                  Set Up Biometric Authentication
                </>
              )}
            </Button>
          )}

          {/* Already Configured */}
          {hasCredentials && !success && (
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-green-700 font-medium">Biometric authentication is already configured</p>
              <p className="text-green-600 text-sm">You can use fingerprint or face recognition to log in</p>
            </div>
          )}

          {/* Not Supported */}
          {!isSupported && (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <XCircle className="h-8 w-8 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-700 font-medium">WebAuthn not supported</p>
              <p className="text-gray-600 text-sm">
                Your browser doesn&apos;t support WebAuthn. Please use a modern browser like Chrome, Firefox, or Safari.
              </p>
            </div>
          )}

          {/* Not Available */}
          {isSupported && !isAvailable && (
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <XCircle className="h-8 w-8 text-gray-500 mx-auto mb-2" />
              <p className="text-gray-700 font-medium">Biometric authentication not available</p>
              <p className="text-gray-600 text-sm">
                Your device doesn&apos;t have biometric authentication capabilities or it&apos;s not enabled.
              </p>
            </div>
          )}

          {/* Security Information */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Security Features</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Biometric data never leaves your device</li>
              <li>• Uses industry-standard WebAuthn protocol</li>
              <li>• Protected by your device&apos;s secure enclave</li>
              <li>• Cannot be copied or transferred</li>
              <li>• Automatically logs all authentication attempts</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </BiometricSetupContext.Provider>
  )
}
