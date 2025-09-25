/**
 * Social Signup Component
 * 
 * Feature-flagged component for social OAuth signup.
 * Returns null when feature is disabled (zero bundle impact).
 */

'use client'

import { useState } from 'react'
import { isFeatureEnabled } from '@/lib/core/feature-flags'
import { Github } from 'lucide-react'

type SocialSignupProps = {
  onSuccess?: (provider: string) => void
  onError?: (error: string) => void
  placement?: string
}

export default function SocialSignup({ onSuccess, onError, placement: _placement = 'signup-page' }: SocialSignupProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)

  // Feature flag check
  if (!isFeatureEnabled('SOCIAL_SHARING') || !isFeatureEnabled('SOCIAL_SIGNUP')) {
    return null
  }

  const handleSocialSignup = async (provider: string) => {
    setIsLoading(provider)

    try {
      // TODO: Implement actual OAuth flow with Supabase
      // For now, just simulate the flow
      console.log(`Social signup with ${provider}`)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      onSuccess?.(provider)
    } catch (error) {
      console.error('Social signup failed:', error)
      onError?.(error instanceof Error ? error.message : 'Signup failed')
    } finally {
      setIsLoading(null)
    }
  }

  const socialProviders = [
    {
      id: 'google',
      name: 'Google',
      icon: '🔍', // Placeholder - would use proper Google icon
      color: '#4285F4'
    },
    {
      id: 'github',
      name: 'GitHub',
      icon: Github,
      color: '#333333'
    },
    {
      id: 'apple',
      name: 'Apple',
      icon: '🍎', // Placeholder - would use proper Apple icon
      color: '#000000'
    }
  ]

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Sign up with social account</h3>
        <p className="text-sm text-gray-600">Quick and secure signup</p>
      </div>

      <div className="space-y-3">
        {socialProviders.map((provider) => {
          return (
            <button
              key={provider.id}
              onClick={() => handleSocialSignup(provider.id)}
              disabled={isLoading !== null}
              className="w-full flex items-center justify-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
              style={{ borderColor: provider.color }}
            >
              {typeof provider.icon === 'string' ? (
                <span className="text-xl">{provider.icon}</span>
              ) : (
                <provider.icon className="h-5 w-5" />
              )}
              <span className="font-medium">
                {isLoading === provider.id ? 'Connecting...' : `Continue with ${provider.name}`}
              </span>
            </button>
          )
        })}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or</span>
        </div>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <button className="text-blue-600 hover:underline">
            Sign in
          </button>
        </p>
      </div>

      <div className="text-xs text-gray-500 text-center">
        By signing up, you agree to our Terms of Service and Privacy Policy.
        We use WebAuthn for secure authentication.
      </div>
    </div>
  )
}
