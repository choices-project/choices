'use client'

import { Fingerprint, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'

import { devLog } from '@/lib/utils/logger'

export default function BiometricSetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [step, setStep] = useState<'intro' | 'registering' | 'success'>('intro')
  
  const router = useRouter()

  const handleSetupBiometric = async () => {
    setIsLoading(true)
    setError('')
    setMessage('')

    try {
      setStep('registering')
      setMessage('Setting up biometric authentication...')

      // Get current user info using existing profile API
      const userResponse = await fetch('/api/profile')
      const userData = await userResponse.json()

      if (!userResponse.ok || !userData.profile) {
        throw new Error('Please log in to set up biometric authentication')
      }

      const user = userData.profile

      // Get registration options
      const optionsResponse = await fetch('/api/v1/aut@/features/auth/types/webauthn/register/options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          username: user.email || user.id
        })
      })

      const optionsData = await optionsResponse.json()

      if (!optionsResponse.ok) {
        throw new Error(optionsData.error || 'Failed to get registration options')
      }

      // Convert base64 challenge to ArrayBuffer
      const challenge = Uint8Array.from(atob(optionsData.challenge), c => c.charCodeAt(0))
      
      // Convert user ID to ArrayBuffer
      const userId = Uint8Array.from(atob(optionsData.user.id), c => c.charCodeAt(0))

      // Create credential
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: optionsData.rp,
          user: {
            id: userId,
            name: optionsData.user.name,
            displayName: optionsData.user.displayName
          },
          pubKeyCredParams: optionsData.pubKeyCredParams,
          timeout: optionsData.timeout,
          attestation: optionsData.attestation,
          authenticatorSelection: optionsData.authenticatorSelection,
          excludeCredentials: optionsData.excludeCredentials
        }
      }) as PublicKeyCredential

      if (!credential) {
        throw new Error('Biometric setup was cancelled or failed')
      }

      // Convert credential data for transmission
      const attestationResponse = credential.response as AuthenticatorAttestationResponse
      
      const credentialData = {
        id: credential.id,
        type: credential.type,
        rawId: Array.from(new Uint8Array(credential.rawId)),
        response: {
          attestationObject: Array.from(new Uint8Array(attestationResponse.attestationObject)),
          clientDataJSON: Array.from(new Uint8Array(attestationResponse.clientDataJSON))
        }
      }

      // Register the credential
      const registerResponse = await fetch('/api/v1/aut@/features/auth/types/webauthn/register/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: credentialData,
          challenge: optionsData.challenge,
          userId: user.id
        })
      })

      const registerData = await registerResponse.json()

      if (!registerResponse.ok) {
        throw new Error(registerData.error || 'Failed to register biometric credential')
      }

      setStep('success')
      setMessage('🎉 Biometric authentication setup successful!')

      // Redirect after a short delay
      setTimeout(() => {
        router.push('/profile')
      }, 2000)

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      devLog('Biometric setup error:', { error: err })
      setError(err.message || 'Failed to set up biometric authentication')
      setStep('intro')
    } finally {
      setIsLoading(false)
    }
  }

  const checkBiometricSupport = () => {
    return window.PublicKeyCredential && 
           typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
  }

  const [isSupported, setIsSupported] = useState<boolean | null>(null)

  useEffect(() => {
    const checkSupport = async () => {
      if (checkBiometricSupport()) {
        try {
          const isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
          setIsSupported(isAvailable)
        } catch {
          setIsSupported(false)
        }
      } else {
        setIsSupported(false)
      }
    }

    checkSupport()
  }, [])

  if (isSupported === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Checking biometric support...</p>
        </div>
      </div>
    )
  }

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="max-w-md w-full space-y-8 p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Biometric Authentication Not Supported
            </h1>
            <p className="text-gray-600 mb-6">
              Your device or browser doesn&apos;t support biometric authentication. 
              You can still use email and password login.
            </p>
            <button
              onClick={() => router.push('/profile')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Back to Profile
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Fingerprint className="h-12 w-12 text-blue-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Set Up Biometric Authentication
          </h1>
          <p className="text-gray-600">
            Use your fingerprint, face, or other biometric to sign in securely
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {message && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <CheckCircle2 className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-green-700">{message}</p>
              </div>
            </div>
          </div>
        )}

        {step === 'intro' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                How it works:
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Touch your fingerprint sensor or use face recognition</li>
                <li>• Your biometric data stays on your device</li>
                <li>• No passwords needed for future logins</li>
                <li>• Works across all your devices</li>
              </ul>
            </div>

            <button
              onClick={handleSetupBiometric}
              disabled={isLoading}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Fingerprint className="h-5 w-5 mr-2" />
                  Set Up Biometric Authentication
                </>
              )}
            </button>

            <button
              onClick={() => router.push('/profile')}
              className="w-full text-gray-600 hover:text-gray-800 transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}

        {step === 'registering' && (
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="text-gray-600">
              Please follow your device&apos;s biometric prompt...
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-4">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold text-gray-900">
              Setup Complete!
            </h2>
            <p className="text-gray-600">
              You can now use biometric authentication to sign in.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
