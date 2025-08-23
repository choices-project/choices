'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Fingerprint, Shield, CheckCircle, XCircle, AlertTriangle, ArrowLeft } from 'lucide-react'
import { 
  registerBiometric, 
  isWebAuthnSupported, 
  isBiometricAvailable 
} from '@/lib/webauthn'

function BiometricSetupContent() {
  const [isSupported, setIsSupported] = useState<boolean | null>(null)
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null)
  const [isRegistering, setIsRegistering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/'

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
      console.error('Error checking biometric support:', error)
      setError('Failed to check biometric support')
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim() || !email.trim()) {
      setError('Please enter both username and email')
      return
    }

    setIsRegistering(true)
    setError(null)

    try {
      // First create a temporary user account
      const tempUserId = `tempDate.now()}Math.random().toString(36).substr(2, 9)}`
      
      const result = await registerBiometric(tempUserId, username.trim())
      
      if (result.success) {
        setSuccess(true)
        // Redirect to complete registration with email
        router.push(`/auth/complete-registration?username=${encodeURIComponent(username)}&email=${encodeURIComponent(email)}&redirectTo=${encodeURIComponent(redirectTo)}`)
      } else {
        setError(result.error || 'Biometric registration failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
    } finally {
      setIsRegistering(false)
    }
  }

  const getStatusIcon = () => {
    if (success) return <CheckCircle className="h-6 w-6 text-green-500" />
    if (error) return <XCircle className="h-6 w-6 text-red-500" />
    if (isRegistering) return <AlertTriangle className="h-6 w-6 text-yellow-500 animate-pulse" />
    return <Shield className="h-6 w-6 text-blue-500" />
  }

  const getStatusText = () => {
    if (success) return 'Biometric setup complete!'
    if (error) return error
    if (isRegistering) return 'Setting up biometric authentication...'
    if (isAvailable) return 'Ready to set up biometric authentication'
    if (isSupported) return 'Biometric authentication not available on this device'
    return 'WebAuthn not supported in this browser'
  }

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Biometric Authentication Not Supported</h2>
          <p className="text-gray-600 mb-6">
            Your browser doesn&apos;t support biometric authentication. Please use a modern browser or try a different signup method.
          </p>
          <button
            onClick={() => router.push('/register')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-150 ease-in-out"
          >
            <ArrowLeft className="inline h-4 w-4 mr-2" />
            Back to Signup
          </button>
        </div>
      </div>
    )
  }

  if (!isAvailable) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Biometric Authentication Not Available</h2>
          <p className="text-gray-600 mb-6">
            Your device doesn't have biometric authentication capabilities. Please use a different signup method.
          </p>
          <button
            onClick={() => router.push('/register')}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition duration-150 ease-in-out"
          >
            <ArrowLeft className="inline h-4 w-4 mr-2" />
            Back to Signup
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="text-center mb-6">
          <Fingerprint className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Biometric Setup</h2>
          <p className="text-gray-600">
            Set up fingerprint, Face ID, or other biometric authentication
          </p>
        </div>

        {/* Status Display */}
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
          <div className="flex items-center justify-center space-x-3">
            {getStatusIcon()}
            <span className="text-sm font-medium text-gray-700">{getStatusText()}</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <XCircle className="h-5 w-5 text-red-400 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="Choose a username"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="your@email.com"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start">
              <Shield className="h-5 w-5 text-blue-400 mr-2 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800 mb-1">How it works</h4>
                <p className="text-sm text-blue-700">
                  We'll create a secure biometric credential on your device. Your fingerprint, Face ID, or other biometric data stays on your device and is never shared with us.
                </p>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isRegistering || !username.trim() || !email.trim()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRegistering ? (
              <div className="flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 mr-2 animate-pulse" />
                Setting up biometric authentication...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <Fingerprint className="h-4 w-4 mr-2" />
                Set up biometric authentication
              </div>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/register')}
            className="text-blue-600 hover:underline text-sm"
          >
            <ArrowLeft className="inline h-4 w-4 mr-1" />
            Back to other signup options
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BiometricSetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Fingerprint className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-600">Loading biometric setup...</p>
        </div>
      </div>
    }>
      <BiometricSetupContent />
    </Suspense>
  )
}
