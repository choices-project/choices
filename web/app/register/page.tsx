'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, User, Lock, Fingerprint, Smartphone, CheckCircle2, AlertCircle } from 'lucide-react'
import { isWebAuthnSupported, isBiometricAvailable, registerBiometric } from '@/lib/webauthn'

function RegisterFormContent() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [biometricSupported, setBiometricSupported] = useState<boolean | null>(null)
  const [biometricAvailable, setBiometricAvailable] = useState<boolean | null>(null)
  const [biometricRegistered, setBiometricRegistered] = useState(false)
  const [showDeviceFlow, setShowDeviceFlow] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'

  // Check biometric support on component mount
  useEffect(() => {
    const checkBiometricSupport = async () => {
      try {
        const supported = isWebAuthnSupported()
        setBiometricSupported(supported)
        
        if (supported) {
          const available = await isBiometricAvailable()
          setBiometricAvailable(available)
        }
      } catch (error) {
        console.error('Error checking biometric support:', error)
        setBiometricSupported(false)
        setBiometricAvailable(false)
      }
    }
    
    checkBiometricSupport()
  }, [])

  const validateForm = () => {
    if (!username.trim()) {
      setError('Username is required')
      return false
    }
    
    if (username.length < 3) {
      setError('Username must be at least 3 characters long')
      return false
    }
    
    if (username.length > 20) {
      setError('Username must be less than 20 characters')
      return false
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError('Username can only contain letters, numbers, underscores, and hyphens')
      return false
    }
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return false
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    
    if (!biometricAvailable && !showDeviceFlow) {
      setError('Please enable biometric authentication or choose device flow')
      return false
    }
    
    return true
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (!validateForm()) {
      setLoading(false)
      return
    }

    try {
      // Register user with username/password
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          enableBiometric: biometricAvailable,
          enableDeviceFlow: showDeviceFlow
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Registration failed. Please try again.')
      } else {
        setMessage('Account created successfully! Setting up authentication...')
        
        // If biometric is available, register it
        if (biometricAvailable && !biometricRegistered) {
          try {
            await registerBiometric(data.user.id, username)
            setBiometricRegistered(true)
            setMessage('Biometric authentication registered! Redirecting...')
          } catch (bioError) {
            console.error('Biometric registration failed:', bioError)
            setMessage('Account created! Biometric setup failed, but you can still sign in with password.')
          }
        }
        
        // Redirect after a short delay
        setTimeout(() => {
          router.push('/login?message=Registration successful! Please sign in.')
        }, 2000)
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBiometricToggle = () => {
    if (biometricAvailable) {
      setShowDeviceFlow(false)
    }
  }

  const handleDeviceFlowToggle = () => {
    setShowDeviceFlow(!showDeviceFlow)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join Choices with secure authentication
          </p>
        </div>

        <form onSubmit={handleRegister} className="mt-8 space-y-6">
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
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="yourusername"
                  pattern="[a-zA-Z0-9_-]+"
                  title="Letters, numbers, underscores, and hyphens only"
                />
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                3-20 characters, letters, numbers, _ and - only
              </p>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                  minLength={8}
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                />
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          {/* Authentication Methods */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">Authentication Methods</h3>
            
            {/* Biometric Authentication */}
            {biometricSupported && (
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Fingerprint className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Biometric Authentication</p>
                    <p className="text-xs text-gray-500">
                      {biometricAvailable 
                        ? 'Use fingerprint, Face ID, or other biometrics' 
                        : 'Not available on this device'
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  {biometricAvailable ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            )}

            {/* Device Flow Authentication */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Smartphone className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Device Flow Authentication</p>
                  <p className="text-xs text-gray-500">Sign in using another device</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleDeviceFlowToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showDeviceFlow ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showDeviceFlow ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading || (!biometricAvailable && !showDeviceFlow)}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">Loading...</div>}>
      <RegisterFormContent />
    </Suspense>
  )
}
