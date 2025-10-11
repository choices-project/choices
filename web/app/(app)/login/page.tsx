'use client'

import { useState, Suspense } from 'react'
import { useFormStatus } from 'react-dom'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, User, Lock, CheckCircle2, AlertCircle } from 'lucide-react'
import { loginAction } from '@/app/actions/login'
import { PasskeyButton } from '@/features/auth/components/PasskeyButton'

// Login button component using useFormStatus
function LoginButton() {
  const { pending } = useFormStatus(); // disables during server-submit
  return (
    <button
      type="submit"
      data-testid="login-submit"
      aria-label="Sign in"
      disabled={pending}
      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? 'Signing In...' : 'Sign In'}
    </button>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Hydration sentinel for E2E tests */}
        <div data-testid="login-hydrated" hidden>{'1'}</div>
        <div>
          <h1 className="mt-6 text-center text-4xl font-extrabold text-gray-900">
            Sign in to your account
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Welcome back to Choices
          </p>
        </div>

        <form action={loginAction} className="mt-8 space-y-6" data-testid="login-form">
          {error && (
            <div 
              className="bg-red-50 border border-red-200 rounded-md p-4" 
              data-testid="login-error"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <div className="ml-3">
                  <p className="text-sm text-green-700">{message}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => {
                    console.log('Email onChange:', e.target.value);
                    setEmail(e.target.value);
                  }}
                  required
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="your@email.com"
                  data-testid="login-email"
                />
                <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password (if you have one)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  placeholder="••••••••"
                  data-testid="login-password"
                />
                <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                If you don&apos;t have a password, you can use biometric authentication
              </p>
            </div>
          </div>

          {/* Biometric Authentication - PasskeyButton handles its own support checking */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gradient-to-br from-blue-50 via-white to-purple-50 text-gray-500">
                  Or continue with
                </span>
              </div>
            </div>

            <PasskeyButton
              mode="authenticate"
              onSuccess={() => {
                setMessage('Authentication successful! Redirecting...')
                setTimeout(() => {
                  router.push('/dashboard')
                }, 1000)
              }}
              onError={(error) => {
                setError(error)
              }}
            />
          </div>

          <LoginButton />
        </form>

        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              Create one
            </Link>
          </p>
          <p className="text-xs text-gray-500">
            Forgot your email? Contact support for assistance.
          </p>
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
      <LoginForm />
    </Suspense>
  )
}
