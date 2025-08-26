'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Eye, EyeOff, User, Lock, Fingerprint, Smartphone } from 'lucide-react'
import { isWebAuthnSupported, isBiometricAvailable, authenticateBiometric } from '@/lib/webauthn'
import SocialLoginButtons from '@/components/auth/SocialLoginButtons'
import DeviceFlowAuth from '@/components/auth/DeviceFlowAuth'
import { OAuthProvider } from '@/types/auth'

function LoginFormContent() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [biometricSupported, setBiometricSupported] = useState<boolean | null>(null)
  const [biometricAvailable, setBiometricAvailable] = useState<boolean | null>(null)
  const [showDeviceFlow, setShowDeviceFlow] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<'google' | 'github'>('google')
  
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

  const handleUsernameLogin = async (e: React.FormEvent) => {
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
          username,
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

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setLoading(true)
    setError(null)
    setMessage(null)

    if (!supabase) {
      setError('Authentication service not available. Please try again later.')
      setLoading(false)
      return
    }

    // Map our OAuth providers to Supabase supported providers
    const supabaseProvider = getSupabaseProvider(provider)
    if (!supabaseProvider) {
      setError(`OAuth provider ${provider} is not yet configured`)
      setLoading(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: supabaseProvider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=${redirectTo}`,
      },
    })

    if (signInError) {
      setError(signInError.message)
    }
    setLoading(false)
  }

  const getSupabaseProvider = (provider: OAuthProvider): 'google' | 'github' | 'facebook' | 'twitter' | 'linkedin' | 'discord' | null => {
    const providerMap: Record<OAuthProvider, 'google' | 'github' | 'facebook' | 'twitter' | 'linkedin' | 'discord' | null> = {
      google: 'google',
      github: 'github',
      facebook: 'facebook',
      twitter: 'twitter',
      linkedin: 'linkedin',
      discord: 'discord',
      instagram: 'facebook', // Instagram uses Facebook OAuth
      tiktok: null // TikTok OAuth not yet supported by Supabase
    }
    return providerMap[provider]
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

    // For username-based system, we'll use the internal email format
    const internalEmail = `${username.toLowerCase()}@choices.local`

    const { error: magicLinkError } = await supabase.auth.signInWithOtp({
      email: internalEmail,
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
    if (!username.trim()) {
      setError('Please enter your username for biometric login')
      return
    }

    setLoading(true)
    setError(null)
    setMessage(null)

    try {
      const result = await authenticateBiometric(username.trim())
      
      if (result.success) {
        setMessage('Biometric authentication successful! Redirecting...')
        router.push(redirectTo)
      } else {
        const errorMessage = result.error?.message || 'Biometric authentication failed'
        setError(errorMessage)
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

        <form onSubmit={handleUsernameLogin} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <div className="relative">
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase())}
                required
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="yourusername"
              />
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
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

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
          
          <SocialLoginButtons 
            onProviderClick={handleOAuthLogin}
            redirectTo={redirectTo}
            isLoading={loading}
            className="mt-4"
          />
          
          {biometricAvailable && (
            <div className="mt-4 text-center">
              <button
                onClick={handleBiometricLogin}
                className="p-3 border border-gray-300 rounded-full hover:bg-gray-50 transition duration-150 ease-in-out"
                aria-label="Sign in with biometric authentication"
                disabled={loading}
                title="Use fingerprint, Face ID, or other biometric authentication"
              >
                <Fingerprint size={24} className="text-blue-600" />
              </button>
            </div>
          )}
          {biometricSupported && !biometricAvailable && (
            <p className="text-sm text-gray-500 mt-2 text-center">
              Biometric authentication not available on this device
            </p>
          )}
        </div>

        {/* Biometric Login Section */}
        {biometricAvailable && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Biometric Login</h3>
            <p className="text-sm text-blue-700 mb-2">
              Use your fingerprint, Face ID, or other biometric authentication
            </p>
            <button
              onClick={handleBiometricLogin}
              disabled={loading || !username.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
            >
              <Fingerprint className="h-4 w-4" />
              Sign in with Biometrics
            </button>
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
