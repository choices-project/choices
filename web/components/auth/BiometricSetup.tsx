'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Fingerprint, Shield, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { 
  registerBiometric, 
  isWebAuthnSupported, 
  isBiometricAvailable,
  getUserBiometricCredentials,
  hasBiometricCredentials
} from '@/lib/webauthn'
import { devLog } from '@/lib/logger'

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
  onError?: (error: string) => void
}

export default function BiometricSetup({ userId, username, onSuccess, onError }: BiometricSetupProps) {
  const [isSupported, setIsSupported] = useState<boolean | null>(null)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [hasCredentials, setHasCredentials] = useState<boolean | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    checkBiometricSupport()
  }, [])

  const checkBiometricSupport = useCallback(async () => {
    try {
      const supported = isWebAuthnSupported()
      setIsSupported(supported)

      if (supported) {
        const available = await isBiometricAvailable()
        setIsAvailable(available)

        if (available) {
          const hasCreds = await hasBiometricCredentials()
          setHasCredentials(hasCreds)
          
          // Check for existing credentials to provide better user feedback
          if (hasCreds) {
            const existingCreds = await getUserBiometricCredentials()
            devLog('Existing biometric credentials found:', existingCreds.credentials?.length || 0)
          }
        }
      }
    } catch (error) {
      devLog('Error checking biometric support:', error)
      setError('Failed to check biometric support')
    }
  }, [])

  const handleRegister = async () => {
    setIsRegistering(true)
    setError(null)

    try {
      const result = await registerBiometric(userId, username)
      
      if (result.success) {
        setSuccess(true)
        setHasCredentials(true)
        onSuccess?.()
      } else {
        setError(result.error || 'Registration failed')
        onError?.(result.error || 'Registration failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error instanceof Error ? error.message : "Unknown error" : 'Unknown error'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsRegistering(false)
    }
  }

  const getStatusIcon = () => {
    if (success) return <CheckCircle className="h-5 w-5 text-green-500" />
    if (error) return <XCircle className="h-5 w-5 text-red-500" />
    if (isRegistering) return <AlertTriangle className="h-5 w-5 text-yellow-500 animate-pulse" />
    return <Shield className="h-5 w-5 text-blue-500" />
  }

  const getStatusText = () => {
    if (success) return 'Biometric authentication setup complete!'
    if (error) return error
    if (isRegistering) return 'Setting up biometric authentication...'
    if (hasCredentials) return 'Biometric authentication already configured'
    if (isAvailable) return 'Ready to set up biometric authentication'
    if (isSupported) return 'Biometric authentication not available on this device'
    return 'WebAuthn not supported in this browser'
  }

  const getStatusColor = () => {
    if (success) return 'text-green-600'
    if (error) return 'text-red-600'
    if (isRegistering) return 'text-yellow-600'
    if (hasCredentials) return 'text-green-600'
    if (isAvailable) return 'text-blue-600'
    return 'text-gray-600'
  }

  if (isSupported === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Biometric Authentication
          </CardTitle>
          <CardDescription>
            Checking biometric support...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Fingerprint className="h-5 w-5" />
          Biometric Authentication
        </CardTitle>
        <CardDescription>
          Set up fingerprint or face recognition for secure, passwordless login
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Display */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          {getStatusIcon()}
          <span className={`font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        {/* Support Status */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">WebAuthn Support</span>
            <Badge variant={isSupported ? "default" : "secondary"}>
              {isSupported ? "Supported" : "Not Supported"}
            </Badge>
          </div>
          
          {isSupported && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Biometric Available</span>
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
  )
}
