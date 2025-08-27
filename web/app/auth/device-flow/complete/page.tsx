'use client'

import { useState, useEffect, Suspense } from 'react'
import { logger } from '@/lib/logger';
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

function DeviceFlowCompleteContent() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string>('')
  const [userCode, setUserCode] = useState<string>('')
  const [userId, setUserId] = useState<string>('')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const completeDeviceFlow = async () => {
      try {
        if (!supabase) {
          throw new Error('Supabase client not available')
        }

        // Get current user session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError || !session?.user) {
          throw new Error('No active session found. Please sign in first.')
        }

        const userCodeParam = searchParams.get('user_code')
        if (!userCodeParam) {
          throw new Error('No user code provided')
        }

        setUserCode(userCodeParam)
        setUserId(session.user.id)
        
        // Log the device flow completion for debugging
        logger.info('Device flow completion initiated:', { userCode: userCodeParam, userId: session.user.id })

        // Complete the device flow
        const response = await fetch('/api/auth/device-flow/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userCode: userCodeParam,
            userId: session.user.id
          }),
        })

        const data = await response.json()

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to complete device flow')
        }

        setIsSuccess(true)
        
        // Redirect after a short delay
        setTimeout(() => {
          router.push('/dashboard')
        }, 2000)

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
        setError(errorMessage)
      } finally {
        setIsLoading(false)
      }
    }

    completeDeviceFlow()
  }, [searchParams, router, supabase])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Completing Device Flow
            </h2>
            <p className="text-gray-600">
              Please wait while we complete your authentication...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Successful!
            </h2>
            <p className="text-gray-600 mb-4">
              Your device has been successfully authenticated.
            </p>
            <p className="text-sm text-gray-500">
              Redirecting to dashboard...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Authentication Failed
          </h2>
          <p className="text-gray-600 mb-4">
            {error}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => router.push('/login')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
            <button
              onClick={() => window.close()}
              className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
            >
              Close Window
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DeviceFlowCompletePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Loading...
            </h2>
          </div>
        </div>
      </div>
    }>
      <DeviceFlowCompleteContent />
    </Suspense>
  )
}
