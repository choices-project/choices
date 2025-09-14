'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger';
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, User, Lock, Fingerprint, CheckCircle2, AlertCircle } from 'lucide-react'
import { clientSession } from '@/lib/client-session'
import { safeBrowserAccess } from '@/lib/ssr-safe'
import { isFeatureEnabled } from '@/shared/lib/feature-flags'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [biometricSupported, setBiometricSupported] = useState<boolean | null>(null)
  const [biometricAvailable, setBiometricAvailable] = useState<boolean | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  // Check biometric support on component mount
  useEffect(() => {
    const checkBiometricSupport = async () => {
      try {
        // Check if WebAuthn is supported
        const window = safeBrowserAccess.window()
        const navigator = safeBrowserAccess.navigator()
        const supported = !!(window && 
                         'PublicKeyCredential' in window &&
                         navigator && 'credentials' in navigator)
        setBiometricSupported(supported)
        
        if (supported) {
          // For now, assume biometric is available
          // In a real implementation, you would check for existing credentials
          setBiometricAvailable(true)
        }
          } catch (error) {
      // narrow 'unknown' → Error
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error checking biometric support:', err)
        setBiometricSupported(false)
        setBiometricAvailable(false)
      }
    }
    
    checkBiometricSupport()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (!email.trim()) {
      setError('Email is required')
      setLoading(false)
      return
    }

    try {
      setMessage('Signing you in...')
      
      const result = await clientSession.login(email.toLowerCase(), password || '')

      if (result.success) {
        setMessage('🎉 Login successful! Redirecting...')
        
        // Redirect to the intended destination
        setTimeout(() => {
          router.push(redirectTo)
        }, 1000)
      } else {
        setError(result.error || 'Login failed. Please try again.')
      }
    } catch (error) {
      // narrow 'unknown' → Error
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Login error:', err)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBiometricLogin = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      setMessage('Authenticating with biometric...')
      
      // First, get available credentials for this domain
      const response = await fetch('/api/auth/webauthn/credentials', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const credentialsData = await response.json()
      
      if (!response.ok) {
        throw new Error(credentialsData.error || 'Failed to get biometric credentials')
      }

      if (!credentialsData.credentials || credentialsData.credentials.length === 0) {
        setError('No biometric credentials found. Please set up biometric authentication first.')
        return
      }

      // Get authentication options from server
      const authResponse = await fetch('/api/auth/webauthn/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rpId: safeBrowserAccess.window()?.location?.hostname || 'localhost'
        })
      })

      const authData = await authResponse.json()
      
      if (!authResponse.ok) {
        throw new Error(authData.error || 'Failed to get authentication options')
      }

      // Convert base64 challenge to ArrayBuffer
      const challenge = Uint8Array.from(atob(authData.challenge), c => c.charCodeAt(0))
      
      // Convert credential IDs from base64 to ArrayBuffer
      const allowCredentials = authData.allowCredentials.map((cred: any) => ({
        id: Uint8Array.from(atob(cred.id), c => c.charCodeAt(0)),
        type: 'public-key',
        transports: cred.transports || ['internal']
      }))

      // Get credential from authenticator
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: challenge,
          rpId: authData.rpId,
          allowCredentials: allowCredentials,
          userVerification: 'preferred',
          timeout: 60000
        }
      }) as PublicKeyCredential

      if (!credential) {
        throw new Error('Biometric authentication was cancelled or failed')
      }

      // Convert credential data to base64 for transmission
      const assertionResponse = credential.response as AuthenticatorAssertionResponse
      
      const credentialData = {
        id: credential.id,
        type: credential.type,
        rawId: Array.from(new Uint8Array(credential.rawId)),
        response: {
          authenticatorData: Array.from(new Uint8Array(assertionResponse.authenticatorData)),
          clientDataJSON: Array.from(new Uint8Array(assertionResponse.clientDataJSON)),
          signature: Array.from(new Uint8Array(assertionResponse.signature)),
          userHandle: assertionResponse.userHandle ? Array.from(new Uint8Array(assertionResponse.userHandle)) : null
        }
      }

      // Verify credential with server
      const verifyResponse = await fetch('/api/auth/webauthn/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: credentialData,
          challenge: authData.challenge
        })
      })

      const verifyData = await verifyResponse.json()

      if (!verifyResponse.ok) {
        throw new Error(verifyData.error || 'Biometric verification failed')
      }

      setMessage('🎉 Biometric authentication successful! Redirecting...')
      
      setTimeout(() => {
        router.push(redirectTo)
      }, 1000)

    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Biometric login error:', err)
      setError(err.message || 'Biometric authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="mt-6 text-center text-4xl font-extrabold text-gray-900">
            Sign in to your account
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Welcome back to Choices
          </p>
        </div>

        <form onSubmit={handleLogin} className="mt-8 space-y-6">
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

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your@email.com"
                />
                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password (if you have one)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                If you don't have a password, you can use biometric authentication
              </p>
            </div>
          </div>

          {/* Biometric Authentication */}
          {biometricSupported && biometricAvailable && (
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleBiometricLogin}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Fingerprint className="h-5 w-5 mr-2 text-blue-600" />
                Sign in with biometric
              </button>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || !email}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              Create one
            </Link>
          </p>
          <p className="text-xs text-gray-500">
            Forgot your email? Contact support for assistance.
          </p>
        </div>
      </div>
    </div>
  )
}
