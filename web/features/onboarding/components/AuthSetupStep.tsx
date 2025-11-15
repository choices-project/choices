'use client'

import {
  Shield,
  Mail,
  Key,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Smartphone,
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PasskeyButton } from '@/features/auth/components/PasskeyButton'
import { useUserActions, useUserError, useUserLoading, useUserStore } from '@/lib/stores';
import { logger } from '@/lib/utils/logger';
import { getSupabaseBrowserClient } from '@/utils/supabase/client'

import type { AuthSetupStepProps, AuthMethod } from '../types';

/**
 * Authentication Setup Step Component
 *
 * Handles user authentication setup during onboarding with multiple options:
 * - Email authentication with Supabase
 * - Social login (Google, GitHub)
 * - WebAuthn/Passkey registration
 * - Anonymous access
 * - Skip option for testing
 *
 * Features:
 * - Email validation and error handling
 * - Social OAuth integration
 * - Passkey registration with fallback
 * - E2E testing bypass
 * - Responsive design
 *
 * @param {AuthSetupStepProps} props - Component props
 * @returns {JSX.Element} Authentication setup interface
 */
const toErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const candidate = (error as { message?: unknown }).message;
    if (typeof candidate === 'string') {
      return candidate;
    }
  }
  return 'An unexpected error occurred. Please try again.';
};

export default function AuthSetupStep({
  data,
  onUpdate,
  onNext,
  onBack,
  forceInteractive = false,
}: AuthSetupStepProps) {
  const [authMethod, setAuthMethod] = useState<AuthMethod>(data?.authMethod || 'email')
  const [email, setEmail] = useState(data?.email || '')
  const [success, setSuccess] = useState(false)
  const [currentSection, setCurrentSection] = useState<'overview' | 'setup' | 'complete'>('overview')

  const userError = useUserError();
  const isLoading = useUserLoading();
  const { setLoading, setError, clearError, signOut } = useUserActions();
  const initializeAuth = useUserStore((state) => state.initializeAuth);
  const setSessionAndDerived = useUserStore((state) => state.setSessionAndDerived);

  useEffect(() => {
    clearError();
    setSuccess(false);
  }, [authMethod, clearError]);

  const syncSupabaseSession = React.useCallback(async () => {
    try {
      const supabase = await getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        initializeAuth(session.user, session, true);
        setSessionAndDerived(session);
      } else {
        initializeAuth(null, null, false);
      }
    } catch (error) {
      logger.error('Auth setup failed to synchronize Supabase session', error);
    }
  }, [initializeAuth, setSessionAndDerived]);

  // E2E bypass: If we're in test environment, render a simple version
  if (
    !forceInteractive &&
    (process.env.NODE_ENV === 'test' ||
      process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://test.supabase.co')
  ) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-4">Authentication Setup</h2>
        <p className="text-gray-600 mb-6">Choose your authentication method</p>
        <button
          onClick={onNext}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
        >
          Continue
        </button>
      </div>
    )
  }

  const handleEmailSignup = async () => {
    if (!email) {
      setError('Please enter your email address')
      return
    }

    setLoading(true)
    clearError()

    try {
      const supabase = await getSupabaseBrowserClient()
      if (!supabase) {
        setError('Authentication service not available')
        return
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/onboarding?step=auth-setup`
        }
      })

      if (error) {
        throw error;
      }

      await syncSupabaseSession();
      setSuccess(true);
      onUpdate({
        email,
        authMethod: 'email',
        authSetupCompleted: true,
      });
    } catch (err: unknown) {
      setError(toErrorMessage(err) || 'Failed to send verification email');
    } finally {
      setLoading(false)
    }
  }

  const handleSocialAuth = async (provider: 'google' | 'github') => {
    setLoading(true)
    clearError()

    try {
      const supabase = await getSupabaseBrowserClient()
      if (!supabase) {
        setError('Authentication service not available')
        return
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/onboarding?step=auth-setup`
        }
      })

      if (error) {
        throw error;
      }
      await syncSupabaseSession();
    } catch (err: unknown) {
      setError(toErrorMessage(err) || `Failed to sign in with ${provider}`);
    } finally {
      setLoading(false);
    }
  }

  const handleWebAuthnAuth = async () => {
    onUpdate({
      authMethod: 'webauthn',
      authSetupCompleted: true
    })
    clearError();
    setSuccess(true)
    await syncSupabaseSession();
  }

  const handleAnonymousAuth = () => {
    onUpdate({
      authMethod: 'anonymous',
      authSetupCompleted: true
    })
    clearError();
    setSuccess(true)
    initializeAuth(null, null, false)
  }



  const handleNext = () => {
    if (authMethod === 'anonymous') {
      handleAnonymousAuth();
      onNext();
      return;
    }

    if (authMethod === 'skip') {
      onUpdate({
        authMethod: 'skip',
        authSetupCompleted: true,
      });
      setSuccess(true);
      onNext();
      return;
    }

    if (success) {
      onNext();
    } else {
      setCurrentSection('setup');
    }
  };

  const authOptions = useMemo(
    () => [
      {
        method: 'email' as AuthMethod,
        title: 'Email',
        description: 'Secure login with email verification',
        icon: Mail,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        bullets: ['No password needed', 'Magic link login', 'Secure verification'],
      },
      {
        method: 'social' as AuthMethod,
        title: 'Social Login',
        description: 'Sign in with Google or GitHub',
        icon: Shield,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        bullets: ['One-click login', 'Trusted providers', 'Enhanced security'],
      },
      {
        method: 'webauthn' as AuthMethod,
        title: 'Passkey',
        description: 'Secure biometric authentication',
        icon: Smartphone,
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        bullets: ['Fingerprint/Face ID', 'No passwords', 'Maximum security'],
      },
      {
        method: 'anonymous' as AuthMethod,
        title: 'Anonymous',
        description: 'Vote without creating an account',
        icon: Key,
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        bullets: ['No personal info', 'Maximum privacy', 'Limited features'],
      },
      {
        method: 'skip' as AuthMethod,
        title: 'Skip for Now',
        description: 'Set up authentication later',
        icon: ArrowRight,
        iconBg: 'bg-gray-100',
        iconColor: 'text-gray-600',
        bullets: ['Continue onboarding', 'Setup later', 'Limited access'],
      },
    ],
    [],
  );

  const renderOptionButton = (option: (typeof authOptions)[number]) => {
    const Icon = option.icon;
    const isSelected = authMethod === option.method;
    return (
      <button
        key={option.method}
        type="button"
        className={`rounded-lg border bg-card text-card-foreground shadow-sm text-left transition-shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 hover:shadow-lg ${
          isSelected ? 'border-blue-300 ring-1 ring-blue-200' : ''
        }`}
        onClick={() => setAuthMethod(option.method)}
        aria-pressed={isSelected}
        aria-label={`Select ${option.title} authentication method`}
        data-testid={`auth-option-${option.method}`}
      >
        <div className="flex flex-col space-y-1.5 p-6 text-center">
          <div
            className={`w-12 h-12 ${option.iconBg} rounded-lg flex items-center justify-center mx-auto mb-2`}
          >
            <Icon className={`h-6 w-6 ${option.iconColor}`} />
          </div>
          <h3 className="font-semibold tracking-tight text-lg">{option.title}</h3>
        </div>
        <div className="p-6 pt-0">
          <p className="text-sm text-gray-600 mb-3">{option.description}</p>
          <div className="space-y-2 text-left">
            {option.bullets.map((bullet) => (
              <div className="flex items-center gap-2 text-xs" key={bullet}>
                <CheckCircle className="h-3 w-3 text-green-600" />
                <span>{bullet}</span>
              </div>
            ))}
          </div>
        </div>
      </button>
    );
  };

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">Secure Your Account</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Choose how you&apos;d like to authenticate. You can always change this later.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {authOptions.map(renderOptionButton)}
      </div>

      <div className="text-center">
        <Button onClick={handleNext} size="lg" data-testid="auth-continue">
          Continue with {authMethod === 'email' ? 'Email' :
                         authMethod === 'social' ? 'Social Login' :
                         authMethod === 'webauthn' ? 'Passkey' :
                         authMethod === 'anonymous' ? 'Anonymous' : 'Skip'}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const renderSetup = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Set Up Authentication</h3>
        <p className="text-gray-600">Complete your authentication setup</p>
      </div>

      {authMethod === 'email' && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              Email Authentication
            </CardTitle>
            <CardDescription>
              We&apos;ll send you a secure login link
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {userError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg animate-shake">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{userError}</span>
                </div>
                <button
                  onClick={() => clearError()}
                  className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg animate-bounce">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Check your email for the login link!</span>
                </div>
                <div className="mt-2 text-xs text-green-600">
                  We&apos;ve sent a secure login link to your email address.
                </div>
              </div>
            )}

            <Button
              onClick={handleEmailSignup}
              disabled={isLoading || !email}
              className="w-full"
            >
              {isLoading ? 'Sending...' : 'Send Login Link'}
            </Button>
          </CardContent>
        </Card>
      )}

      {authMethod === 'social' && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Social Authentication
            </CardTitle>
            <CardDescription>
              Choose your preferred social login provider
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => handleSocialAuth('google')}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>

            <Button
              onClick={() => handleSocialAuth('github')}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              Continue with GitHub
            </Button>

            {userError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{userError}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {authMethod === 'webauthn' && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-purple-600" />
              Passkey Authentication
            </CardTitle>
            <CardDescription>
              Set up secure biometric authentication
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Secure & Convenient</p>
                  <ul className="space-y-1">
                    <li>• Use your fingerprint or Face ID</li>
                    <li>• No passwords to remember</li>
                    <li>• Works across all your devices</li>
                    <li>• Maximum security with privacy</li>
                  </ul>
                </div>
              </div>
            </div>

            <PasskeyButton
              mode="register"
              primary={true}
              onSuccess={handleWebAuthnAuth}
        onError={(errorMessage) => setError(errorMessage)}
              className="w-full"
            />

      {userError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-4 w-4" />
            <span className="text-sm">{userError}</span>
                </div>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg animate-bounce">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Passkey registered successfully!</span>
                </div>
                <div className="mt-2 text-xs text-green-600">
                  You can now use your biometric authentication to sign in.
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {authMethod === 'anonymous' && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-purple-600" />
              Anonymous Access
            </CardTitle>
            <CardDescription>
              You can vote anonymously without creating an account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Limited Features</p>
                  <ul className="space-y-1">
                    <li>• Cannot create polls</li>
                    <li>• Cannot save preferences</li>
                    <li>• Limited access to analytics</li>
                    <li>• Cannot participate in research</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              onClick={handleAnonymousAuth}
              className="w-full"
            >
              Continue Anonymously
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between max-w-md mx-auto">
        <Button variant="outline" onClick={() => setCurrentSection('overview')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        {success && (
          <Button onClick={onNext}>
            Continue
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )

  const renderContent = () => {
    if (currentSection === 'overview') {
      return renderOverview()
    } else if (currentSection === 'setup') {
      return renderSetup()
    }
    return renderOverview()
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {renderContent()}
    </div>
  )
}
