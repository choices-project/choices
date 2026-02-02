'use client'

import { Shield, Smartphone, Lock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import * as React from 'react'

import { register as serverRegister } from '@/app/actions/register'

import { PasskeyButton } from '@/features/auth/components/PasskeyButton'

import { logger } from '@/lib/utils/logger'


export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = React.useState<string>('')
  const [success, setSuccess] = React.useState(false)

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
    e.preventDefault()                        // 🔑 stop the GET submit
    setError('')

    const fd = new FormData(e.currentTarget)  // read from DOM, not React state
    const username = String(fd.get('username') ?? '').trim()
    const email = String(fd.get('email') ?? '').trim()
    const password = String(fd.get('password') ?? '')
    const confirm = String(fd.get('confirmPassword') ?? '')

    // Validate inputs
    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    // Call server action - it will redirect on success
    const result = await serverRegister(fd, {
      ipAddress: '',
      userAgent: '',
      userId: ''
    })
    if (!result.ok) {
      setError(result.error ?? 'Registration failed')
      return
    }

    // Server action handles redirect, so we don't need to redirect here
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
          <h1 className="mt-6 text-4xl font-extrabold text-gray-900 dark:text-gray-100">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Join Choices and start making better decisions
          </p>
        </div>

        {/* Registration Method Selection */}
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Choose how you&apos;d like to sign up:</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Passkey Registration Option - Primary (always enabled) */}
            <button
              type="button"
              onClick={() => setRegistrationMethod('passkey')}
              className={`relative p-4 border-2 rounded-lg transition-all duration-200 ${
                registrationMethod === 'passkey'
                  ? 'border-green-500 bg-green-50 dark:bg-green-900/30'
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Smartphone className={`h-5 w-5 ${registrationMethod === 'passkey' ? 'text-green-600' : 'text-gray-400'}`} />
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-gray-100">Passkey Account (Recommended)</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Secure, passwordless authentication with biometrics</div>
                </div>
                {registrationMethod === 'passkey' && (
                  <div className="ml-auto">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Recommended
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
                  : 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Lock className={`h-5 w-5 ${registrationMethod === 'password' ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-gray-100">Password Account</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Traditional username and password</div>
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
            <p role="alert" data-testid="register-error" className="text-red-600 text-sm">{error}</p>
          )}

          {success && (
            <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Account created successfully! Redirecting to onboarding...
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block mb-1 text-gray-700 dark:text-gray-300">Username</label>
            <input name="username" data-testid="username" required className="input dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100" />
          </div>
          <div>
            <label className="block mb-1 text-gray-700 dark:text-gray-300">Display Name</label>
            <input name="displayName" data-testid="displayName" required className="input dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100" />
          </div>
          <div>
            <label className="block mb-1 text-gray-700 dark:text-gray-300">Email</label>
            <input name="email" type="email" data-testid="email" required className="input dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100" />
          </div>
          <div>
            <label className="block mb-1 text-gray-700 dark:text-gray-300">Password</label>
            <input name="password" type="password" data-testid="password" required className="input dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100" />
          </div>
          <div>
            <label className="block mb-1 text-gray-700 dark:text-gray-300">Confirm password</label>
            <input name="confirmPassword" type="password" data-testid="confirmPassword" required className="input dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100" />
          </div>

          <button type="submit" data-testid="register-submit" className="btn btn-primary">
            Create account
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <a href="/login" className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
                Sign in
              </a>
            </p>
          </div>
        </form>
        )}

        {/* Passkey Registration */}
        {registrationMethod === 'passkey' && (
          <div className="mt-8 space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-md" data-testid="register-error">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Shield className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
<p className="text-sm font-medium text-green-800 dark:text-green-200">
                    Passkey created successfully! Redirecting to onboarding...
                  </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">What is a Passkey?</h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                    A passkey is a secure, passwordless way to sign in using your device&apos;s built-in security features like fingerprint, face recognition, or PIN.
                  </p>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                    <li>• More secure than passwords</li>
                    <li>• Works across all your devices</li>
                    <li>• No need to remember complex passwords</li>
                    <li>• Protected by your device&apos;s security</li>
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
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
                    Sign in
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
