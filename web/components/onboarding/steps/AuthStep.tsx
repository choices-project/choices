'use client'

import { useState } from 'react'
import { Lock, Shield, Users } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { devLog } from '@/lib/logger';

interface AuthStepProps {
  data: any
  onUpdate: (updates: any) => void
  onNext: () => void
  onBack: () => void
}

export default function AuthStep({ data, onUpdate, onNext, onBack }: AuthStepProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/onboarding?step=values`
        }
      })

      if (error) {
        throw error
      }

      // The user will be redirected to OAuth provider
      // When they return, they'll be authenticated
      devLog('OAuth initiated:', provider)
      
    } catch (error: any) {
      devLog('Login error:', error)
      setError(error.message || 'Failed to sign in. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailLogin = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Redirect to login page with return to onboarding
      window.location.href = `/login?redirectTo=${encodeURIComponent('/onboarding?step=values')}`
    } catch (error: any) {
      devLog('Login error:', error)
      setError(error.message || 'Failed to redirect to login.')
    } finally {
      setIsLoading(false)
    }
  }

  const authOptions = [
    {
      provider: 'google' as const,
      label: 'Continue with Google',
      description: 'Quick and secure sign-in',
      icon: '🔍',
      color: 'bg-white border-gray-300 hover:bg-gray-50 text-gray-900'
    },
    {
      provider: 'github' as const,
      label: 'Continue with GitHub',
      description: 'For developers and tech enthusiasts',
      icon: '🐙',
      color: 'bg-gray-900 text-white hover:bg-gray-800'
    },
    {
      provider: 'email' as const,
      label: 'Continue with Email',
      description: 'Traditional email and password',
      icon: '✉️',
      color: 'bg-blue-600 text-white hover:bg-blue-700'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">
          Sign in to participate
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Choose how you'd like to sign in. We only need basic info to get you started.
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs">!</span>
            </div>
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Privacy explanation */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <div className="flex items-start space-x-3">
          <Shield className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">What we collect</h3>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• Basic profile (name, email, avatar)</li>
              <li>• No access to your contacts or posts</li>
              <li>• No tracking across other sites</li>
              <li>• You can delete your data anytime</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Social login options */}
      <div className="space-y-4">
        {authOptions.map((option) => (
          <button
            key={option.provider}
            onClick={() => {
              if (option.provider === 'email') {
                handleEmailLogin()
              } else {
                handleSocialLogin(option.provider)
              }
            }}
            disabled={isLoading}
            className={`
              w-full p-4 rounded-xl border-2 transition-all duration-200 flex items-center space-x-4
              ${option.color}
              ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
            `}
          >
            <span className="text-2xl">{option.icon}</span>
            <div className="text-left">
              <div className="font-semibold">{option.label}</div>
              <div className="text-sm opacity-75">{option.description}</div>
            </div>
            {isLoading && (
              <div className="ml-auto">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Privacy commitment */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Lock className="w-6 h-6 text-gray-600 mt-1 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Our privacy commitment</h3>
            <div className="text-gray-600 text-sm space-y-2">
              <p>
                <strong>Your data is yours:</strong> We never sell, rent, or share your personal information with third parties.
              </p>
              <p>
                <strong>Transparent:</strong> You can see exactly what data we have and delete it anytime.
              </p>
              <p>
                <strong>Secure:</strong> All data is encrypted and stored securely using industry best practices.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          Back
        </button>
        <div className="text-sm text-gray-500">
          Step 2 of 6
        </div>
      </div>
    </div>
  )
}
