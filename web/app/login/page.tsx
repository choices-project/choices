'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Eye, EyeOff, Mail, Lock, Github, Chrome, Fingerprint } from 'lucide-react'
import { isWebAuthnSupported, isBiometricAvailable, authenticateBiometric } from '@/lib/webauthn'

function LoginFormContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [biometricSupported, setBiometricSupported] = useState<boolean | null>(null)
  const [biometricAvailable, setBiometricAvailable] = useState<boolean | null>(null)
  const [biometricUsername, setBiometricUsername] = useState('')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  // Use a smarter default redirect - let the auth callback decide
  const redirectTo = searchParams.get('redirectTo') || '/'
  const supabase = createClient()

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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Login failed. Please try again.')
      } else {
        setMessage('Logged in successfully! Redirecting...')
        // Store tokens in cookies for middleware access
        if (data.token) {
          // Set auth token as HTTP-only cookie
          document.cookie = `auth-token=${data.token}; path=/; max-age=3600; secure; samesite=strict`
          // Store refresh token in localStorage for token refresh
          localStorage.setItem('refresh-token', data.refreshToken)
        }
        router.push(redirectTo)
      }
    } catch (error) {
      console.error('Login error:', error)
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    setLoading(true)
    setError(null)
    setMessage(null)

    if (!supabase) {
      setError('Authentication service not available. Please try again later.')
      setLoading(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=${redirectTo}`,
      },
    })

    if (signInError) {
      setError(signInError.message)
    }
    setLoading(false)
  }

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (!supabase) {
      setError('Authentication service not available. Please try again later.')
      setLoading(false)
      return
    }

    const { error: magicLinkError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=${redirectTo}`,
      },
    })

    if (magicLinkError) {
      setError(magicLinkError.message)
    } else {
      setMessage('Check your email for the magic link!')
    }
    setLoading(false)
  }

  const handleBiometricLogin = async () => {
    if (!biometricUsername.trim()) {
      setError('Please enter your email address for biometric login')
      return
    }

    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const result = await authenticateBiometric(biometricUsername.trim())
      
      if (result.success) {
        setMessage('Biometric authentication successful! Redirecting...')
        router.push(redirectTo)
      } else {
        setError(result.error || 'Biometric authentication failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Sign in to your account</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {message && <p className="text-green-500 text-center mb-4">{message}</p>}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="you@example.com"
              />
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
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
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">Or continue with</p>
          <div className="flex justify-center space-x-4 mt-4">
            <button
              onClick={() => handleOAuthLogin('google')}
              className="p-3 border border-gray-300 rounded-full hover:bg-gray-50 transition duration-150 ease-in-out"
              aria-label="Sign in with Google"
              disabled={loading}
            >
              <Chrome size={24} className="text-red-500" />
            </button>
            <button
              onClick={() => handleOAuthLogin('github')}
              className="p-3 border border-gray-300 rounded-full hover:bg-gray-50 transition duration-150 ease-in-out"
              aria-label="Sign in with GitHub"
              disabled={loading}
            >
              <Github size={24} className="text-gray-800" />
            </button>
            {biometricAvailable && (
              <button
                onClick={handleBiometricLogin}
                className="p-3 border border-gray-300 rounded-full hover:bg-gray-50 transition duration-150 ease-in-out"
                aria-label="Sign in with biometric authentication"
                disabled={loading}
                title="Use fingerprint, Face ID, or other biometric authentication"
              >
                <Fingerprint size={24} className="text-blue-600" />
              </button>
            )}
          </div>
          {biometricSupported && !biometricAvailable && (
            <p className="text-sm text-gray-500 mt-2">
              Biometric authentication not available on this device
            </p>
          )}
        </div>

        {/* Biometric Login Section */}
        {biometricAvailable && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Biometric Login</h3>
            <div className="flex space-x-2">
              <input
                type="email"
                value={biometricUsername}
                onChange={(e) => setBiometricUsername(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 px-3 py-2 border border-blue-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <button
                onClick={handleBiometricLogin}
                disabled={loading || !biometricUsername.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <Fingerprint className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={handleMagicLinkLogin}
            className="text-blue-600 hover:underline text-sm"
            disabled={loading}
          >
            Forgot password or want a magic link?
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don't have an account?{' '}
          <Link href="/register" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">Loading...</div>}>
      <LoginFormContent />
    </Suspense>
  )
}
