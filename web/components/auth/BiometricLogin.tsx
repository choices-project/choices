'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Fingerprint, Shield, CheckCircle, XCircle, AlertTriangle, User } from 'lucide-react'
import { 
  authenticateBiometric, 
  isWebAuthnSupported, 
  isBiometricAvailable
} from '@/lib/webauthn'
import { devLog } from '@/lib/logger'

interface BiometricLoginProps {
  onSuccess?: (user?: any) => void
  onError?: (error: string) => void
  onCancel?: () => void
}

export default function BiometricLogin({ onSuccess, onError, onCancel }: BiometricLoginProps) {
  const [isSupported, setIsSupported] = useState<boolean | null>(null)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [username, setUsername] = useState('')
  const [isAuthenticating, setIsAuthenticating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    checkBiometricSupport()
  }, [])

  const checkBiometricSupport = async () => {
    try {
      const supported = isWebAuthnSupported()
      setIsSupported(supported)

      if (supported) {
        const available = await isBiometricAvailable()
        setIsAvailable(available)
      }
    } catch (error) {
      devLog('Error checking biometric support:', error)
      setError('Failed to check biometric support')
    }
  }

  const handleAuthenticate = async () => {
    if (!username.trim()) {
      setError('Please enter your email address')
      return
    }

    setIsAuthenticating(true)
    setError(null)

    try {
      const result = await authenticateBiometric(username.trim())
      
      if (result.success) {
        setSuccess(true)
        // The server should return user data in the response
        // For now, we'll call onSuccess without user data
        onSuccess?.()
      } else {
        setError(result.error || 'Authentication failed')
        onError?.(result.error || 'Authentication failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsAuthenticating(false)
    }
  }

  const getStatusIcon = () => {
    if (success) return <CheckCircle className="h-5 w-5 text-green-500" />
    if (error) return <XCircle className="h-5 w-5 text-red-500" />
    if (isAuthenticating) return <AlertTriangle className="h-5 w-5 text-yellow-500 animate-pulse" />
    return <Shield className="h-5 w-5 text-blue-500" />
  }

  const getStatusText = () => {
    if (success) return 'Authentication successful!'
    if (error) return error
    if (isAuthenticating) return 'Authenticating with biometric...'
    if (isAvailable) return 'Ready for biometric authentication'
    if (isSupported) return 'Biometric authentication not available on this device'
    return 'WebAuthn not supported in this browser'
  }

  const getStatusColor = () => {
    if (success) return 'text-green-600'
    if (error) return 'text-red-600'
    if (isAuthenticating) return 'text-yellow-600'
    if (isAvailable) return 'text-blue-600'
    return 'text-gray-600'
  }

  if (isSupported === null) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5" />
            Biometric Login
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
          Biometric Login
        </CardTitle>
        <CardDescription>
          Use fingerprint or face recognition to log in securely
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
        </div>

        {/* Login Form */}
        {isSupported && isAvailable && !success && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Email Address</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  type="email"
                  placeholder="Enter your email address"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  disabled={isAuthenticating}
                />
              </div>
              <p className="text-xs text-gray-500">
                Enter the email address associated with your biometric credentials
              </p>
            </div>

            <Button 
              onClick={handleAuthenticate}
              disabled={isAuthenticating || !username.trim()}
              className="w-full"
            >
              {isAuthenticating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Authenticating...
                </>
              ) : (
                <>
                  <Fingerprint className="h-4 w-4 mr-2" />
                  Authenticate with Biometric
                </>
              )}
            </Button>
          </div>
        )}

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
              Authentication successful! You have been logged in securely using biometric authentication.
            </AlertDescription>
          </Alert>
        )}

        {/* Not Supported */}
        {!isSupported && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <XCircle className="h-8 w-8 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-700 font-medium">WebAuthn not supported</p>
            <p className="text-gray-600 text-sm">
              Your browser doesn't support WebAuthn. Please use a modern browser like Chrome, Firefox, or Safari.
            </p>
          </div>
        )}

        {/* Not Available */}
        {isSupported && !isAvailable && (
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <XCircle className="h-8 w-8 text-gray-500 mx-auto mb-2" />
            <p className="text-gray-700 font-medium">Biometric authentication not available</p>
            <p className="text-gray-600 text-sm">
              Your device doesn't have biometric authentication capabilities or it's not enabled.
            </p>
          </div>
        )}

        {/* Cancel Button */}
        {onCancel && (
          <Button 
            variant="outline" 
            onClick={onCancel}
            className="w-full"
            disabled={isAuthenticating}
          >
            Cancel
          </Button>
        )}

        {/* Security Information */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Security Features</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Biometric data never leaves your device</li>
            <li>• Uses industry-standard WebAuthn protocol</li>
            <li>• Protected by your device's secure enclave</li>
            <li>• Cannot be copied or transferred</li>
            <li>• Automatically logs all authentication attempts</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
