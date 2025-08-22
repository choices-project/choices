'use client'

import { useState, Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { Eye, EyeOff, Mail, Lock, User, Github, Chrome, Fingerprint } from 'lucide-react'
import { isWebAuthnSupported, isBiometricAvailable } from '@/lib/webauthn'

function RegisterFormContent() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [biometricSupported, setBiometricSupported] = useState<boolean | null>(null)
  const [biometricAvailable, setBiometricAvailable] = useState<boolean | null>(null)
  
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (!supabase) {
      setError('Authentication service not available. Please try again later.')
      setLoading(false)
      return
    }

    // Create proper redirect URL for email verification
    const baseUrl = window.location.origin
    const emailRedirectTo = `${baseUrl}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`

    const { error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          name: formData.name,
        },
        emailRedirectTo: emailRedirectTo,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
    } else {
      setMessage('Check your email to confirm your account! Please check your spam folder if you don\'t see it.')
    }
    setLoading(false)
  }

  const handleOAuthRegister = async (provider: 'google' | 'github') => {
    setLoading(true)
    setError(null)
    setMessage(null)

    if (!supabase) {
      setError('Authentication service not available. Please try again later.')
      setLoading(false)
      return
    }

    const { error: signUpError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=${redirectTo}`,
      },
    })

    if (signUpError) {
      setError(signUpError.message)
    }
    setLoading(false)
  }

  const handleBiometricRegister = async () => {
    setLoading(true)
    setError(null)
    setMessage(null)

    if (!biometricAvailable) {
      setError('Biometric authentication is not available on this device.')
      setLoading(false)
      return
    }

    // Redirect to biometric setup page
    router.push(`/auth/biometric-setup?redirectTo=${encodeURIComponent(redirectTo)}`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Create your account</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        {message && <p className="text-green-500 text-center mb-4">{message}</p>}

        <form onSubmit={handleEmailRegister} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <div className="relative">
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="John Doe"
              />
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            </div>
          </div>
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
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
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
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
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
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
          
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">Or continue with</p>
          <div className="flex justify-center space-x-4 mt-4">
            <button
              onClick={() => handleOAuthRegister('google')}
              className="p-3 border border-gray-300 rounded-full hover:bg-gray-50 transition duration-150 ease-in-out"
              aria-label="Sign up with Google"
              disabled={loading}
            >
              <Chrome size={24} className="text-red-500" />
            </button>
            <button
              onClick={() => handleOAuthRegister('github')}
              className="p-3 border border-gray-300 rounded-full hover:bg-gray-50 transition duration-150 ease-in-out"
              aria-label="Sign up with GitHub"
              disabled={loading}
            >
              <Github size={24} className="text-gray-800" />
            </button>
            {biometricAvailable && (
              <button
                onClick={handleBiometricRegister}
                className="p-3 border border-gray-300 rounded-full hover:bg-gray-50 transition duration-150 ease-in-out"
                aria-label="Sign up with biometric authentication"
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

        <p className="mt-6 text-center text-sm text-gray-600">
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
