'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Github, 
  Twitter, 
  Mail, 
  Shield, 
  Zap, 
  Users,
  ArrowRight,
  CheckCircle
} from 'lucide-react'

interface SocialSignupProps {
  onProviderSelect: (provider: 'google' | 'github' | 'twitter' | 'facebook' | 'linkedin') => void
  onEmailSignup: () => void
  className?: string
}

export default function SocialSignup({ 
  onProviderSelect, 
  onEmailSignup, 
  className = '' 
}: SocialSignupProps) {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleProviderClick = async (provider: 'google' | 'github' | 'twitter' | 'facebook' | 'linkedin') => {
    setIsLoading(true)
    setSelectedProvider(provider)
    
    try {
      await onProviderSelect(provider)
    } catch (error) {
      console.error('Social signup failed:', error)
    } finally {
      setIsLoading(false)
      setSelectedProvider(null)
    }
  }

  const socialProviders = [
    {
      id: 'google' as const,
      name: 'Google',
      icon: '🔍',
      color: 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300',
      description: 'Quick signup with your Google account'
    },
    {
      id: 'github' as const,
      name: 'GitHub',
      icon: '🐙',
      color: 'bg-gray-900 hover:bg-gray-800 text-white',
      description: 'Perfect for developers and tech-savvy users'
    },
    {
      id: 'twitter' as const,
      name: 'Twitter/X',
      icon: '🐦',
      color: 'bg-black hover:bg-gray-800 text-white',
      description: 'Share your voice and connect with activists'
    },
    {
      id: 'facebook' as const,
      name: 'Facebook',
      icon: '📘',
      color: 'bg-blue-600 hover:bg-blue-700 text-white',
      description: 'Connect with your community'
    },
    {
      id: 'linkedin' as const,
      name: 'LinkedIn',
      icon: '💼',
      color: 'bg-blue-700 hover:bg-blue-800 text-white',
      description: 'Professional network integration'
    }
  ]

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-3 py-1">
            <Zap className="w-3 h-3 mr-1" />
            <Users className="w-3 h-3 mr-1" />
            Social First
          </Badge>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Join the Revolution
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          Sign up with your social account to start making your voice heard. 
          <span className="font-semibold text-blue-600"> No email required.</span>
        </p>
      </div>

      {/* Social Providers */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Social Signup
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {socialProviders.map((provider) => (
            <Button
              key={provider.id}
              onClick={() => handleProviderClick(provider.id)}
              disabled={isLoading}
              className={`w-full justify-start ${provider.color} transition-all duration-200 hover:scale-[1.02] ${
                selectedProvider === provider.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <span className="text-xl mr-3">{provider.icon}</span>
              <div className="flex-1 text-left">
                <div className="font-semibold">Continue with {provider.name}</div>
                <div className="text-sm opacity-80">{provider.description}</div>
              </div>
              {selectedProvider === provider.id ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <ArrowRight className="w-5 h-5" />
              )}
            </Button>
          ))}
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-green-600" />
            Why Social Signup?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Instant Access:</strong> No email verification delays</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Secure:</strong> Your social accounts are already verified</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Viral Sharing:</strong> Easy to share polls with your network</span>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Community:</strong> Connect with like-minded activists</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Fallback */}
      <div className="text-center">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with email</span>
          </div>
        </div>
        
        <Button
          onClick={onEmailSignup}
          variant="outline"
          className="mt-4 w-full max-w-sm"
        >
          <Mail className="w-4 h-4 mr-2" />
          Sign up with Email
        </Button>
        
        <p className="text-xs text-gray-500 mt-2">
          Email signup requires verification and may take longer
        </p>
      </div>

      {/* Privacy Notice */}
      <div className="text-center text-xs text-gray-500 space-y-1">
        <p>
          By signing up, you agree to our{' '}
          <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>
          {' '}and{' '}
          <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
        </p>
        <p>
          We only access basic profile information needed for your account
        </p>
      </div>
    </div>
  )
}
