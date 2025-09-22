'use client'

import { useState } from 'react'
import { devLog } from '@/lib/logger';
import { Shield, Key, CheckCircle, AlertCircle } from 'lucide-react'
import { has, isRecord } from '@/lib/util/guards'

type WebAuthnAuthProps = {
  onAuthenticated: (_userStableId: string, _sessionToken: string) => void
}

type WebAuthnBeginResponse = {
  options: PublicKeyCredentialCreationOptions | PublicKeyCredentialRequestOptions
  session: string
}

type WebAuthnFinishResponse = {
  sessiontoken: string
}

export default function WebAuthnAuth({ onAuthenticated }: WebAuthnAuthProps) {
  const [userStableId, setUserStableId] = useState('')
  const [email, setEmail] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [step, setStep] = useState<'input' | 'registering' | 'logging-in' | 'success'>('input')
  const [error, setError] = useState('')

  const handleRegister = async () => {
    if (!userStableId.trim()) {
      setError('Please enter a user ID')
      return
    }

    setIsRegistering(true)
    setError('')

    try {
      // Step 1: Begin registration
      const beginResponse = await fetch('http://localhost:8081/api/v1/webauthn/register/begin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userstableid: userStableId,
          email: email || undefined,
        }),
      })

      if (!beginResponse.ok) {
        throw new Error('Failed to begin registration')
      }

      const beginDataRaw = await beginResponse.json()
      if (!isRecord(beginDataRaw) || !has(beginDataRaw, 'options') || !has(beginDataRaw, 'session')) {
        throw new Error('Invalid response format')
      }
      const beginData = beginDataRaw as WebAuthnBeginResponse
      setStep('registering')

      // Step 2: Create credentials using WebAuthn API
      const credential = await navigator.credentials.create({
        publicKey: beginData.options as PublicKeyCredentialCreationOptions,
      }) as PublicKeyCredential

      if (!credential) {
        throw new Error('Failed to create credentials')
      }

      // Step 3: Finish registration
      const finishResponse = await fetch('http://localhost:8081/api/v1/webauthn/register/finish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userstableid: userStableId,
          session: beginData.session,
          response: {
            id: credential.id,
            type: credential.type,
            rawId: Array.from(new Uint8Array(credential.rawId)),
            response: {
              clientDataJSON: Array.from(new Uint8Array((credential.response as AuthenticatorAttestationResponse).clientDataJSON)),
              attestationObject: Array.from(new Uint8Array((credential.response as AuthenticatorAttestationResponse).attestationObject)),
            },
          },
        }),
      })

      if (!finishResponse.ok) {
        throw new Error('Failed to complete registration')
      }

      setStep('success')
      setTimeout(() => {
        onAuthenticated(userStableId, 'session-token')
      }, 2000)

    } catch (error) {
      devLog('Registration error:', error)
      setError('Registration failed. Please try again.')
      setStep('input')
    } finally {
      setIsRegistering(false)
    }
  }

  const handleLogin = async () => {
    if (!userStableId.trim()) {
      setError('Please enter a user ID')
      return
    }

    setIsLoggingIn(true)
    setError('')

    try {
      // Step 1: Begin login
      const beginResponse = await fetch('http://localhost:8081/api/v1/webauthn/login/begin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userstableid: userStableId,
        }),
      })

      if (!beginResponse.ok) {
        throw new Error('Failed to begin login')
      }

      const beginDataRaw = await beginResponse.json()
      if (!isRecord(beginDataRaw) || !has(beginDataRaw, 'options') || !has(beginDataRaw, 'session')) {
        throw new Error('Invalid response format')
      }
      const beginData = beginDataRaw as WebAuthnBeginResponse
      setStep('logging-in')

      // Step 2: Get credentials using WebAuthn API
      const assertion = await navigator.credentials.get({
        publicKey: beginData.options,
      }) as PublicKeyCredential

      if (!assertion) {
        throw new Error('Failed to get credentials')
      }

      // Step 3: Finish login
      const finishResponse = await fetch('http://localhost:8081/api/v1/webauthn/login/finish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userstableid: userStableId,
          session: beginData.session,
          response: {
            id: assertion.id,
            type: assertion.type,
            rawId: Array.from(new Uint8Array(assertion.rawId)),
            response: {
              clientDataJSON: Array.from(new Uint8Array((assertion.response as AuthenticatorAssertionResponse).clientDataJSON)),
              authenticatorData: Array.from(new Uint8Array((assertion.response as AuthenticatorAssertionResponse).authenticatorData)),
              signature: Array.from(new Uint8Array((assertion.response as AuthenticatorAssertionResponse).signature)),
              userHandle: (assertion.response as AuthenticatorAssertionResponse).userHandle ? Array.from(new Uint8Array((assertion.response as AuthenticatorAssertionResponse).userHandle!)) : undefined,
            },
          },
        }),
      })

      if (!finishResponse.ok) {
        throw new Error('Failed to complete login')
      }

      const finishDataRaw = await finishResponse.json()
      if (!isRecord(finishDataRaw) || !has(finishDataRaw, 'sessiontoken')) {
        throw new Error('Invalid finish response format')
      }
      const finishData = finishDataRaw as WebAuthnFinishResponse
      setStep('success')
      
      setTimeout(() => {
        onAuthenticated(userStableId, finishData.sessiontoken)
      }, 2000)

    } catch (error) {
      devLog('Login error:', error)
      setError('Login failed. Please try again.')
      setStep('input')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const isWebAuthnSupported = () => {
    return window.PublicKeyCredential !== undefined
  }

  if (!isWebAuthnSupported()) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="text-yellow-800 font-medium">WebAuthn Not Supported</span>
        </div>
        <p className="text-yellow-700 mt-2 text-sm">
          Your browser doesn&apos;t support WebAuthn. Please use a modern browser with biometric authentication support.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Secure Authentication</h3>
          <p className="text-gray-600 text-sm">Use your device&apos;s biometric authentication or security key</p>
        </div>

        {step === 'input' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="user-id" className="block text-sm font-medium text-gray-700 mb-2">
                User ID
              </label>
              <input
                type="text"
                id="user-id"
                value={userStableId}
                onChange={(e) => setUserStableId(e.target.value)}
                placeholder="Enter your user ID"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email (optional)
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-red-800 text-sm">{error}</span>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={handleLogin}
                disabled={isLoggingIn || isRegistering}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                <Key className="w-4 h-4" />
                <span>{isLoggingIn ? 'Logging in...' : 'Login'}</span>
              </button>
              <button
                onClick={handleRegister}
                disabled={isLoggingIn || isRegistering}
                className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2"
              >
                <Shield className="w-4 h-4" />
                <span>{isRegistering ? 'Registering...' : 'Register'}</span>
              </button>
            </div>
          </div>
        )}

        {step === 'registering' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Setting up your credentials</h4>
            <p className="text-gray-600 text-sm">
              Please use your device&apos;s biometric authentication or security key to complete registration.
            </p>
          </div>
        )}

        {step === 'logging-in' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Authenticating</h4>
            <p className="text-gray-600 text-sm">
              Please use your device&apos;s biometric authentication or security key to sign in.
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Authentication successful!</h4>
            <p className="text-gray-600 text-sm">
              Redirecting you to the voting interface...
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
