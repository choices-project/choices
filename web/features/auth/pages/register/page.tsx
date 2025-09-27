'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { register as serverRegister } from '@/app/actions/register'
import { PasskeyButton } from '@/components/PasskeyButton'
import { FEATURE_FLAGS } from '@/lib/core/feature-flags'
import { Shield, Smartphone, Lock } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = React.useState<string>('')
  const [success, setSuccess] = React.useState(false)
  const [registrationMethod, setRegistrationMethod] = React.useState<'password' | 'passkey'>('passkey')
  const [hydrated, setHydrated] = React.useState(false)
  
  React.useEffect(() => setHydrated(true), [])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()                        // 🔑 stop the GET submit
    setError('')

    const fd = new FormData(e.currentTarget)  // read from DOM, not React state
    const _username = String(fd.get('username') || '').trim()
    const _email = String(fd.get('email') || '').trim()
    const password = String(fd.get('password') || '')
    const confirm = String(fd.get('confirmPassword') || '')

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    // E2E env returns { ok: true } immediately
    const result = await serverRegister(fd, { ipAddress: '', userAgent: '', userId: '' })
    if (!result.ok) {
      setError(result.error || 'Registration failed')
      return
    }

    router.replace('/onboarding?step=welcome') // redirect on success
  }

  const handlePasskeySuccess = () => {
    setSuccess(true)
    // Redirect to onboarding after a brief delay
    setTimeout(() => {
      router.push('/onboarding')
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Hydration sentinel so the test can safely proceed */}
        <div data-testid="register-hydrated" hidden>{hydrated ? '1' : '0'}</div>
        
        <div className="text-center">
          <h1 className="mt-6 text-4xl font-extrabold text-gray-900">
            Create your account
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Join Choices and start making better decisions
          </p>
        </div>

        {/* Registration Method Selection */}
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">Choose how you&apos;d like to sign up:</p>
          </div>
          
          <div className="grid grid-cols-1 gap-3">
            {/* Passkey Registration Option - Primary */}
            {FEATURE_FLAGS.WEBAUTHN && (
              <button
                type="button"
                onClick={() => setRegistrationMethod('passkey')}
                className={`relative p-4 border-2 rounded-lg transition-all duration-200 ${
                  registrationMethod === 'passkey'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Smartphone className={`h-5 w-5 ${registrationMethod === 'passkey' ? 'text-green-600' : 'text-gray-400'}`} />
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Passkey Account (Recommended)</div>
                    <div className="text-sm text-gray-500">Secure, passwordless authentication with biometrics</div>
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
            )}

            {/* Password Registration Option - Secondary */}
            <button
              type="button"
              onClick={() => setRegistrationMethod('password')}
              className={`relative p-4 border-2 rounded-lg transition-all duration-200 ${
                registrationMethod === 'password'
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Lock className={`h-5 w-5 ${registrationMethod === 'password' ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="text-left">
                  <div className="font-medium text-gray-900">Password Account</div>
                  <div className="text-sm text-gray-500">Traditional username and password</div>
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
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    Account created successfully! Redirecting to onboarding...
                  </p>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block mb-1">Username</label>
            <input name="username" data-testid="username" required className="input" />
          </div>
          <div>
            <label className="block mb-1">Email</label>
            <input name="email" type="email" data-testid="email" required className="input" />
          </div>
          <div>
            <label className="block mb-1">Password</label>
            <input name="password" type="password" data-testid="password" required className="input" />
          </div>
          <div>
            <label className="block mb-1">Confirm password</label>
            <input name="confirmPassword" type="password" data-testid="confirm-password" required className="input" />
          </div>

          <button type="submit" data-testid="register-button" className="btn btn-primary">
            Create account
          </button>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <a href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
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
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md" data-testid="register-error">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Shield className="h-5 w-5 text-green-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800">
                      Passkey created successfully! Redirecting to onboarding...
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start space-x-3">
                <Smartphone className="h-6 w-6 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">What is a Passkey?</h3>
                  <p className="text-sm text-blue-800 mb-3">
                    A passkey is a secure, passwordless way to sign in using your device&apos;s built-in security features like fingerprint, face recognition, or PIN.
                  </p>
                  <ul className="text-sm text-blue-800 space-y-1">
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
