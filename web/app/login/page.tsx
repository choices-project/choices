'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Eye, EyeOff, Mail, Lock, Github, Chrome, Fingerprint, Shield, Settings } from 'lucide-react'
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
  const redirectTo = searchParams.get('redirectTo') || '/dashboard'
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

    if (!supabase) {
      setError('Authentication service not available. Please try again later.')
      setLoading(false)
      return
    }

    try {
      // Use Supabase's built-in authentication
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError(signInError.message)
      } else if (data.user) {
        setMessage('Logged in successfully! Redirecting...')
        
        // Check if user is admin and redirect accordingly
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('trust_tier')
          .eq('user_id', data.user.id)
          .single()

        // Redirect based on user role
        if (profile?.trust_tier === 'T3') {
          // Admin user - redirect to admin dashboard
          router.push('/admin')
        } else {
          // Regular user - redirect to dashboard
          router.push(redirectTo)
        }
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
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`
      }
    })

    if (signInError) {
      setError(signInError.message)
      setLoading(false)
    }
  }

  const handleBiometricLogin = async () => {
    if (!biometricUsername.trim()) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)
    setError(null)

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
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          </div>
          <p className="text-gray-600">Sign in to your Choices account</p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}
        
        {message && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-600 text-sm">{message}</p>
          </div>
        )}

        {/* Biometric Login Section */}
        {biometricSupported && biometricAvailable && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <Fingerprint className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Biometric Login</h3>
            </div>
            <div className="space-y-3">
              <input
                type="email"
                placeholder="Enter your email"
                value={biometricUsername}
                onChange={(e) => setBiometricUsername(e.target.value)}
                className="w-full px-3 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleBiometricLogin}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Fingerprint className="h-4 w-4" />
                {loading ? 'Authenticating...' : 'Login with Biometrics'}
              </button>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* Email/Password Login Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* OAuth Buttons */}
        <div className="mt-6 space-y-3">
          <button
            onClick={() => handleOAuthLogin('google')}
            disabled={loading}
            className="w-full bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Chrome className="h-4 w-4" />
            Continue with Google
          </button>
          
          <button
            onClick={() => handleOAuthLogin('github')}
            disabled={loading}
            className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Github className="h-4 w-4" />
            Continue with GitHub
          </button>
        </div>

        {/* Links */}
        <div className="mt-6 text-center space-y-2">
          <Link href="/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
            Forgot your password?
          </Link>
          <div className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:text-blue-500">
              Sign up
            </Link>
          </div>
        </div>

        {/* Admin Quick Links */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="h-4 w-4 text-gray-600" />
            <h4 className="text-sm font-medium text-gray-700">Admin Quick Access</h4>
          </div>
          <div className="space-y-2">
            <Link 
              href="/auth/biometric-setup" 
              className="block text-sm text-blue-600 hover:text-blue-500"
            >
              Set up biometric authentication
            </Link>
            <Link 
              href="/admin" 
              className="block text-sm text-blue-600 hover:text-blue-500"
            >
              Admin dashboard
            </Link>
            <Link 
              href="/pwa-features" 
              className="block text-sm text-blue-600 hover:text-blue-500"
            >
              PWA features & testing
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  )
}
