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

import { getSupabaseBrowserClient } from '@/utils/supabase/client'

import { PasskeyButton } from '@/features/auth/components/PasskeyButton'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'


import { useUserActions, useUserError, useUserLoading } from '@/lib/stores';
import { logger } from '@/lib/utils/logger';

import { useI18n } from '@/hooks/useI18n'


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
const toErrorMessage = (error: unknown, t?: (key: string) => string): string => {
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    const candidate = (error as { message?: unknown }).message;
    if (typeof candidate === 'string') {
      return candidate;
    }
  }
  return t ? t('onboarding.auth.errors.unexpected') : 'An unexpected error occurred. Please try again.';
};

export default function AuthSetupStep({
  data,
  onUpdate,
  onNext,
  forceInteractive = false,
}: AuthSetupStepProps) {
  const { t } = useI18n();
  const isBypass =
    !forceInteractive &&
    (process.env.NODE_ENV === 'test' ||
      process.env.NEXT_PUBLIC_SUPABASE_URL === 'https://test.supabase.co');
  const [authMethod, setAuthMethod] = useState<AuthMethod>(data?.authMethod || 'email')
  const [email, setEmail] = useState(data?.email || '')
  const [success, setSuccess] = useState(false)
  const [currentSection, setCurrentSection] = useState<'overview' | 'setup' | 'complete'>('overview')

  const userError = useUserError();
  const isLoading = useUserLoading();
  const {
    setLoading,
    setError,
    clearError,
    initializeAuth,
    setSessionAndDerived,
  } = useUserActions();

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

  // E2E bypass content (keep hooks order consistent; render conditionally later)
  const renderBypass = (
    <div className="max-w-2xl mx-auto text-center">
      <h2 className="text-2xl font-bold mb-4">{t('onboarding.auth.test.title')}</h2>
      <p className="text-gray-600 mb-6">{t('onboarding.auth.test.subtitle')}</p>
      <button
        onClick={onNext}
        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
      >
        {t('onboarding.auth.actions.continue')}
      </button>
    </div>
  )

  const handleEmailSignup = async () => {
    if (!email) {
      setError(t('onboarding.auth.email.validation.required'))
      return
    }

    setLoading(true)
    clearError()

    try {
      const supabase = await getSupabaseBrowserClient()
      if (!supabase) {
        setError(t('onboarding.auth.errors.serviceUnavailable'))
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

      if (forceInteractive) {
        await syncSupabaseSession();
      }
      setSuccess(true);
      onUpdate({
        email,
        authMethod: 'email',
        authSetupCompleted: true,
      });
    } catch (err: unknown) {
      setError(toErrorMessage(err, t) || t('onboarding.auth.email.errors.sendFailed'));
    } finally {
      setLoading(false)
    }
  }

  const handleSocialAuth = async (provider: 'google' | 'github') => {
    if (forceInteractive) {
      clearError()
      setSuccess(true)
      onUpdate({
        authMethod: 'social',
        socialProvider: provider,
        authSetupCompleted: true,
      })
      return
    }

    setLoading(true)
    clearError()

    try {
      const supabase = await getSupabaseBrowserClient()
      if (!supabase) {
        setError(t('onboarding.auth.errors.serviceUnavailable'))
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
      const providerName = provider === 'google' ? t('onboarding.auth.social.google') : t('onboarding.auth.social.github');
      setError(toErrorMessage(err, t) || t('onboarding.auth.social.errors.signInFailed', { provider: providerName }));
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
        title: t('onboarding.auth.options.email.title'),
        description: t('onboarding.auth.options.email.description'),
        icon: Mail,
        iconBg: 'bg-blue-100',
        iconColor: 'text-blue-600',
        bullets: [
          t('onboarding.auth.options.email.bullets.noPassword'),
          t('onboarding.auth.options.email.bullets.magicLink'),
          t('onboarding.auth.options.email.bullets.secure'),
        ],
      },
      {
        method: 'social' as AuthMethod,
        title: t('onboarding.auth.options.social.title'),
        description: t('onboarding.auth.options.social.description'),
        icon: Shield,
        iconBg: 'bg-green-100',
        iconColor: 'text-green-600',
        bullets: [
          t('onboarding.auth.options.social.bullets.oneClick'),
          t('onboarding.auth.options.social.bullets.trusted'),
          t('onboarding.auth.options.social.bullets.enhanced'),
        ],
      },
      {
        method: 'webauthn' as AuthMethod,
        title: t('onboarding.auth.options.webauthn.title'),
        description: t('onboarding.auth.options.webauthn.description'),
        icon: Smartphone,
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        bullets: [
          t('onboarding.auth.options.webauthn.bullets.biometric'),
          t('onboarding.auth.options.webauthn.bullets.noPassword'),
          t('onboarding.auth.options.webauthn.bullets.maximum'),
        ],
      },
      {
        method: 'anonymous' as AuthMethod,
        title: t('onboarding.auth.options.anonymous.title'),
        description: t('onboarding.auth.options.anonymous.description'),
        icon: Key,
        iconBg: 'bg-purple-100',
        iconColor: 'text-purple-600',
        bullets: [
          t('onboarding.auth.options.anonymous.bullets.noPersonal'),
          t('onboarding.auth.options.anonymous.bullets.maximum'),
          t('onboarding.auth.options.anonymous.bullets.limited'),
        ],
      },
      {
        method: 'skip' as AuthMethod,
        title: t('onboarding.auth.options.skip.title'),
        description: t('onboarding.auth.options.skip.description'),
        icon: ArrowRight,
        iconBg: 'bg-gray-100',
        iconColor: 'text-gray-600',
        bullets: [
          t('onboarding.auth.options.skip.bullets.continue'),
          t('onboarding.auth.options.skip.bullets.setupLater'),
          t('onboarding.auth.options.skip.bullets.limited'),
        ],
      },
    ],
    [t],
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
        aria-label={t('onboarding.auth.options.ariaLabel', { method: option.title })}
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

  const renderOverview = () => {
    const methodLabels = {
      email: t('onboarding.auth.options.email.title'),
      social: t('onboarding.auth.options.social.title'),
      webauthn: t('onboarding.auth.options.webauthn.title'),
      anonymous: t('onboarding.auth.options.anonymous.title'),
      skip: t('onboarding.auth.options.skip.title'),
    };

    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-gray-900">{t('onboarding.auth.overview.title')}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('onboarding.auth.overview.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {authOptions.map(renderOptionButton)}
        </div>

        <div className="text-center">
          <Button onClick={handleNext} size="lg" data-testid="auth-continue">
            {t('onboarding.auth.overview.continueWith', { method: methodLabels[authMethod] || methodLabels.skip })}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderSetup = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('onboarding.auth.setup.title')}</h3>
        <p className="text-gray-600">{t('onboarding.auth.setup.subtitle')}</p>
      </div>

      {authMethod === 'email' && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600" />
              {t('onboarding.auth.email.cardTitle')}
            </CardTitle>
            <CardDescription>
              {t('onboarding.auth.email.cardDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('onboarding.auth.email.fields.email.label')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('onboarding.auth.email.fields.email.placeholder')}
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
                  {t('onboarding.auth.errors.dismiss')}
                </button>
              </div>
            )}

            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg animate-bounce">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">{t('onboarding.auth.email.success.checkEmail')}</span>
                </div>
                <div className="mt-2 text-xs text-green-600">
                  {t('onboarding.auth.email.success.sent')}
                </div>
              </div>
            )}

            <Button
              onClick={handleEmailSignup}
              disabled={isLoading || !email}
              className="w-full"
            >
              {isLoading ? t('onboarding.auth.email.actions.sending') : t('onboarding.auth.email.actions.sendLink')}
            </Button>
          </CardContent>
        </Card>
      )}

      {authMethod === 'social' && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              {t('onboarding.auth.social.cardTitle')}
            </CardTitle>
            <CardDescription>
              {t('onboarding.auth.social.cardDescription')}
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
              {t('onboarding.auth.social.actions.continueWithGoogle')}
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
              {t('onboarding.auth.social.actions.continueWithGitHub')}
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
              {t('onboarding.auth.webauthn.cardTitle')}
            </CardTitle>
            <CardDescription>
              {t('onboarding.auth.webauthn.cardDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">{t('onboarding.auth.webauthn.benefits.title')}</p>
                  <ul className="space-y-1">
                    <li>• {t('onboarding.auth.webauthn.benefits.biometric')}</li>
                    <li>• {t('onboarding.auth.webauthn.benefits.noPassword')}</li>
                    <li>• {t('onboarding.auth.webauthn.benefits.crossDevice')}</li>
                    <li>• {t('onboarding.auth.webauthn.benefits.maximum')}</li>
                  </ul>
                </div>
              </div>
            </div>

            {forceInteractive ? (
              <Button
                onClick={handleWebAuthnAuth}
                className="w-full"
                data-testid="harness-create-passkey"
              >
                {t('onboarding.auth.webauthn.actions.create')}
              </Button>
            ) : null}
            {forceInteractive ? (
              <button
                type="button"
                style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}
                aria-hidden="true"
                data-testid="passkey-setup"
                onClick={handleWebAuthnAuth}
              />
            ) : (
              <PasskeyButton
                mode="register"
                primary={true}
                onSuccess={handleWebAuthnAuth}
                onError={(errorMessage) => setError(errorMessage)}
                className="w-full"
              />
            )}

            {/* Test harness trigger for environments that mock WebAuthn */}
            <button
              type="button"
              style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}
              aria-hidden="true"
              data-testid="mock-passkey-button"
              onClick={handleWebAuthnAuth}
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
                  <span className="text-sm">{t('onboarding.auth.webauthn.success.registered')}</span>
                </div>
                <div className="mt-2 text-xs text-green-600">
                  {t('onboarding.auth.webauthn.success.canUse')}
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
              {t('onboarding.auth.anonymous.cardTitle')}
            </CardTitle>
            <CardDescription>
              {t('onboarding.auth.anonymous.cardDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">{t('onboarding.auth.anonymous.limitations.title')}</p>
                  <ul className="space-y-1">
                    <li>• {t('onboarding.auth.anonymous.limitations.noPolls')}</li>
                    <li>• {t('onboarding.auth.anonymous.limitations.noPreferences')}</li>
                    <li>• {t('onboarding.auth.anonymous.limitations.limitedAnalytics')}</li>
                    <li>• {t('onboarding.auth.anonymous.limitations.noResearch')}</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              onClick={handleAnonymousAuth}
              className="w-full"
            >
              {t('onboarding.auth.anonymous.actions.continue')}
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between max-w-md mx-auto">
        <Button variant="outline" onClick={() => setCurrentSection('overview')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('onboarding.auth.actions.back')}
        </Button>
        {success && (
          <Button onClick={onNext}>
            {t('onboarding.auth.actions.continue')}
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
      {isBypass ? renderBypass : renderContent()}
    </div>
  )
}
