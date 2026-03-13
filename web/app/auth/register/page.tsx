'use client'

import { Eye, EyeOff, Loader2, Lock, Shield, Smartphone } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { register as serverRegister } from '@/app/actions/register'

import { PasskeyButton } from '@/features/auth/components/PasskeyButton'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { logger } from '@/lib/utils/logger'

import { useI18n } from '@/hooks/useI18n'



export default function RegisterPage() {
  const router = useRouter()
  const { t } = useI18n()
  const [error, setError] = React.useState<string>('')
  const [success, setSuccess] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Read URL parameter directly from window.location (works even during SSR/hydration)
  // This avoids useSearchParams which can cause hydration issues
  const getInitialMethod = (): 'password' | 'passkey' => {
    if (typeof window === 'undefined') return 'passkey'

    // Check URL parameter first (most reliable for E2E)
    const params = new URLSearchParams(window.location.search)
    if (params.get('method') === 'password') {
      return 'password'
    }

    // Check localStorage for E2E test override
    try {
      const e2eMethod = localStorage.getItem('e2e-registration-method')
      if (e2eMethod === 'password') {
        return 'password'
      }
    } catch {
      // localStorage might not be available during SSR
    }

    return 'passkey'
  }

  const [registrationMethod, setRegistrationMethod] = React.useState<'password' | 'passkey'>(getInitialMethod())
  const [hydrated, setHydrated] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)
  const [showPassword, setShowPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)

  React.useEffect(() => {
    // Set hydrated and mounted state after component mounts
    // This only runs on the client side after React hydrates
    setHydrated(true)
    setMounted(true)

    // For E2E tests, also check localStorage to default to password mode
    if (typeof window !== 'undefined') {
      // Check URL parameter (re-check in case it changed)
      const params = new URLSearchParams(window.location.search)
      const urlMethod = params.get('method')

      // Debug logging for E2E tests
      if (process.env.NODE_ENV !== 'production' || typeof window !== 'undefined') {
        logger.debug('[RegisterPage] URL params', { search: window.location.search });
        logger.debug('[RegisterPage] method param from URL', { urlMethod });
        logger.debug('[RegisterPage] localStorage e2e-registration-method', { value: localStorage.getItem('e2e-registration-method') });
      }

      if (urlMethod === 'password') {
        logger.debug('[RegisterPage] Setting registrationMethod to password from URL param (useEffect)');
        setRegistrationMethod('password')
        return
      }

      // Check localStorage for E2E test override
      try {
        const e2eMethod = localStorage.getItem('e2e-registration-method')
        if (e2eMethod === 'password') {
          logger.debug('[RegisterPage] Setting registrationMethod to password from localStorage (useEffect)');
          setRegistrationMethod('password')
          return
        }
      } catch {
        // localStorage might not be available
      }
    }
  }, [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const fd = new FormData(e.currentTarget)
      const username = String(fd.get('username') ?? '').trim()
      const email = String(fd.get('email') ?? '').trim()
      const password = String(fd.get('password') ?? '')
      const confirm = String(fd.get('confirmPassword') ?? '')

      if (!username || username.length < 3) {
        setError(t('auth.register.error.username') || 'Username must be at least 3 characters')
        return
      }
      if (!email || !email.includes('@')) {
        setError(t('auth.register.error.email') || 'Please enter a valid email address')
        return
      }
      if (password !== confirm) {
        setError(t('auth.register.error.passwordMismatch') || 'Passwords do not match')
        return
      }
      if (password.length < 8) {
        setError(t('auth.register.error.passwordLength') || 'Password must be at least 8 characters long')
        return
      }

      const result = await serverRegister(fd, {
        ipAddress: '',
        userAgent: '',
        userId: ''
      })
      if (!result.ok) {
        setError(result.error ?? (t('auth.register.error.failed') || 'Registration failed'))
        return
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasskeySuccess = () => {
    setSuccess(true)
    // Redirect to onboarding after a brief delay
    setTimeout(() => {
      router.push('/onboarding')
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Hydration sentinel so the test can safely proceed */}
        <div
          data-testid="register-hydrated"
          data-hydrated={hydrated ? 'true' : 'false'}
          aria-hidden="true"
          style={{ display: 'none' }}
        >
          {hydrated ? 'hydrated' : 'not-hydrated'}
        </div>
        {/* Visible hydration indicator for E2E tests - always render but with conditional content */}
        <div
          data-testid="register-mounted"
          data-mounted={mounted ? 'true' : 'false'}
          style={{ position: 'absolute', left: '-9999px', visibility: 'hidden' }}
        >
          {mounted ? 'mounted' : 'not-mounted'}
        </div>

        <div className="text-center">
          <h1 className="mt-6 text-4xl font-extrabold text-foreground">
            {t('auth.register.title') || 'Create your account'}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t('auth.register.subtitle') || 'Join Choices and start making better decisions'}
          </p>
        </div>

        {/* Registration Method Selection */}
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">{t('auth.register.chooseMethod') || "Choose how you'd like to sign up:"}</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Passkey Registration Option - Primary (always enabled) */}
            <button
              type="button"
              onClick={() => setRegistrationMethod('passkey')}
              className={`relative p-4 border-2 rounded-lg transition-all duration-200 ${
                registrationMethod === 'passkey'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                  : 'border-border bg-card hover:border-border'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Smartphone className={`h-5 w-5 ${registrationMethod === 'passkey' ? 'text-green-600' : 'text-muted-foreground'}`} />
                <div className="text-left">
                  <div className="font-medium text-foreground">{t('auth.register.passkeyOption') || 'Passkey Account (Recommended)'}</div>
                  <div className="text-sm text-muted-foreground">{t('auth.register.passkeyDescription') || 'Secure, passwordless authentication with biometrics'}</div>
                </div>
                {registrationMethod === 'passkey' && (
                  <div className="ml-auto">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
                      {t('auth.register.recommended') || 'Recommended'}
                    </span>
                  </div>
                )}
              </div>
            </button>

            {/* Password Registration Option - Secondary */}
            <button
              type="button"
              data-testid="password-account-button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                logger.debug('Password button clicked, setting registrationMethod to password');
                setRegistrationMethod('password');
              }}
              onMouseDown={(e) => {
                // Also handle mousedown as fallback for E2E tests
                if (!hydrated) {
                  e.preventDefault();
                  return;
                }
              }}
              className={`relative p-4 border-2 rounded-lg transition-all duration-200 ${
                registrationMethod === 'password'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-border bg-card hover:border-border'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Lock className={`h-5 w-5 ${registrationMethod === 'password' ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="text-left">
                  <div className="font-medium text-foreground">{t('auth.register.passwordOption') || 'Password Account'}</div>
                  <div className="text-sm text-muted-foreground">{t('auth.register.passwordDescription') || 'Traditional username and password'}</div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Password Registration Form */}
        {registrationMethod === 'password' && (
          <form
            data-testid="register-form"
            noValidate
            // DO NOT add action/method; let React handle it
            onSubmit={handleSubmit}
            className="mt-8 space-y-6"
          >
          {error && (
            <p id="register-error" role="alert" data-testid="register-error" className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {success && (
            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    {t('auth.register.successRedirect') || 'Account created successfully! Redirecting to onboarding...'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="register-username" className="mb-1 block text-foreground/80">{t('auth.register.username') || 'Username'}</label>
            <Input
              id="register-username"
              name="username"
              data-testid="username"
              required
              aria-invalid={!!error}
              aria-describedby={error ? 'register-error' : undefined}
              className="border-border bg-card text-foreground"
            />
          </div>
          <div>
            <label htmlFor="register-displayName" className="mb-1 block text-foreground/80">{t('auth.register.displayName') || 'Display Name'}</label>
            <Input
              id="register-displayName"
              name="displayName"
              data-testid="displayName"
              required
              aria-invalid={!!error}
              aria-describedby={error ? 'register-error' : undefined}
              className="border-border bg-card text-foreground"
            />
          </div>
          <div>
            <label htmlFor="register-email" className="mb-1 block text-foreground/80">{t('auth.register.email') || 'Email'}</label>
            <Input
              id="register-email"
              name="email"
              type="email"
              data-testid="email"
              required
              aria-invalid={!!error}
              aria-describedby={error ? 'register-error' : undefined}
              className="border-border bg-card text-foreground"
            />
          </div>
          <div>
            <label htmlFor="register-password" className="mb-1 block text-foreground/80">{t('auth.register.password') || 'Password'}</label>
            <div className="relative">
              <Input
                id="register-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                data-testid="password"
                required
                aria-invalid={!!error}
                aria-describedby={error ? 'register-error' : undefined}
                className="border-border bg-card text-foreground pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label htmlFor="register-confirm-password" className="mb-1 block text-foreground/80">{t('auth.register.confirmPassword') || 'Confirm password'}</label>
            <div className="relative">
              <Input
                id="register-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                data-testid="confirmPassword"
                required
                aria-invalid={!!error}
                aria-describedby={error ? 'register-error' : undefined}
                className="border-border bg-card text-foreground pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" data-testid="register-submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                {t('auth.register.submitting') || 'Creating account...'}
              </>
            ) : (
              t('auth.register.submit') || 'Create account'
            )}
          </Button>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {t('auth.register.alreadyHaveAccount') || 'Already have an account?'}{' '}
              <Link href="/auth" className="font-medium text-primary hover:text-primary/90">
                {t('auth.register.signIn') || 'Sign in'}
              </Link>
            </p>
          </div>
        </form>
        )}

        {/* Passkey Registration */}
        {registrationMethod === 'passkey' && (
          <div className="mt-8 space-y-6">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300" data-testid="register-error">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-green-700 dark:border-green-800 dark:bg-green-900/30 dark:text-green-300">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Shield className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      {t('auth.register.passkeySuccess') || 'Passkey created successfully! Redirecting to onboarding...'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-900/30">
              <div className="flex items-start space-x-3">
                <Smartphone className="mt-0.5 h-6 w-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="mb-2 font-semibold text-blue-900 dark:text-blue-100">{t('auth.register.passkeyWhatIs') || 'What is a Passkey?'}</h3>
                  <p className="mb-3 text-sm text-blue-800 dark:text-blue-200">
                    {t('auth.register.passkeyExplanation') || "A passkey is a secure, passwordless way to sign in using your device's built-in security features like fingerprint, face recognition, or PIN."}
                  </p>
                  <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
                    <li>• {t('auth.register.passkeyBenefit1') || 'More secure than passwords'}</li>
                    <li>• {t('auth.register.passkeyBenefit2') || 'Works across all your devices'}</li>
                    <li>• {t('auth.register.passkeyBenefit3') || 'No need to remember complex passwords'}</li>
                    <li>• {t('auth.register.passkeyBenefit4') || "Protected by your device's security"}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <PasskeyButton
                mode="register"
                onSuccess={handlePasskeySuccess}
                onError={(error: string) => setError(error)}
              />

              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {t('auth.register.alreadyHaveAccount') || 'Already have an account?'}{' '}
                  <Link href="/auth" className="font-medium text-primary hover:text-primary/90">
                    {t('auth.register.signIn') || 'Sign in'}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
