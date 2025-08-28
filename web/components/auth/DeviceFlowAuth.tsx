'use client'

import { useState, useEffect, useCallback } from 'react'
import { logger } from '@/lib/logger';
import { useRouter } from 'next/navigation'
import { 
  Smartphone, 
  Copy, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle,
  ExternalLink
} from 'lucide-react'

interface DeviceFlowAuthProps {
  provider: 'google' | 'github' | 'facebook' | 'twitter' | 'linkedin' | 'discord'
  redirectTo?: string
  onSuccess?: () => void
  onError?: () => void
  className?: string
}

interface DeviceFlowData {
  deviceCode: string
  userCode: string
  verificationUri: string
  expiresIn: number
  interval: number
}

export default function DeviceFlowAuth({ 
  provider,
  redirectTo = '/dashboard',
  onSuccess, 
  onError, 
  className = '' 
}: DeviceFlowAuthProps) {
  const [deviceFlowData, setDeviceFlowData] = useState<DeviceFlowData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  const router = useRouter()

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [pollingInterval])

  // Update time remaining
  useEffect(() => {
    if (!deviceFlowData || timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setError('Device flow has expired. Please try again.')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [deviceFlowData, timeRemaining])

  const startPolling = useCallback((deviceCode: string, interval: number) => {
    setIsPolling(true)
    
    const intervalId = setInterval(async () => {
      try {
        const response = await fetch('/api/auth/device-flow/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ deviceCode }),
        })

        const data = await response.json()

        if (data.success && data.session) {
          clearInterval(intervalId)
          setPollingInterval(null)
          setIsPolling(false)
          setIsSuccess(true)
          
          // Call success callback
          onSuccess?.()
          
          // Redirect after a short delay
          setTimeout(() => {
            router.push(redirectTo)
          }, 1500)
          
          return
        }

        // Continue polling if not successful
        if (data.error && data.error !== 'Device flow still pending') {
          clearInterval(intervalId)
          setPollingInterval(null)
          setIsPolling(false)
          setError(data.error)
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err)
        logger.error('Polling error:', new Error(errorMessage))
        // Don't stop polling on network errors, just log them
      }
    }, interval * 1000)

    setPollingInterval(intervalId)
  }, [onSuccess, router, redirectTo])

  const startDeviceFlow = useCallback(async () => {
    setIsLoading(true)
    setError('')
    setIsSuccess(false)
    setDeviceFlowData(null)
    
    try {
      const response = await fetch('/api/auth/device-flow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          redirectTo,
          scopes: ['openid', 'email', 'profile']
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create device flow')
      }

      if (!data.success) {
        throw new Error(data.error || 'Device flow creation failed')
      }

      setDeviceFlowData({
        deviceCode: data.deviceCode,
        userCode: data.userCode,
        verificationUri: data.verificationUri,
        expiresIn: data.expiresIn,
        interval: data.interval
      })

      setTimeRemaining(data.expiresIn)
      startPolling(data.deviceCode, data.interval)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start device flow'
      setError(errorMessage)
              onError?.()
    } finally {
      setIsLoading(false)
    }
  }, [provider, redirectTo, onError, startPolling])

  const copyToClipboard = async () => {
    if (!deviceFlowData) return
    
    try {
      await navigator.clipboard.writeText(deviceFlowData.userCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      logger.error('Failed to copy:', new Error(errorMessage))
    }
  }

  const openVerificationUri = () => {
    if (!deviceFlowData) return
    window.open(deviceFlowData.verificationUri, '_blank', 'noopener,noreferrer')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getProviderDisplayName = (provider: string) => {
    const names = {
      google: 'Google',
      github: 'GitHub',
      facebook: 'Facebook',
      twitter: 'Twitter',
      linkedin: 'LinkedIn',
      discord: 'Discord'
    }
    return names[provider as keyof typeof names] || provider
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Smartphone className="w-6 h-6 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Device Authentication
        </h3>
        <p className="text-gray-600">
          Sign in to {getProviderDisplayName(provider)} using your mobile device or another browser
        </p>
      </div>

      {!deviceFlowData && !isLoading && (
        <button
          onClick={startDeviceFlow}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Start Device Flow
        </button>
      )}

      {isLoading && (
        <div className="text-center">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Setting up device flow...</p>
        </div>
      )}

      {deviceFlowData && !isSuccess && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Your Code:</span>
              <button
                onClick={copyToClipboard}
                className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="bg-white border border-gray-300 rounded px-3 py-2 text-center">
              <span className="text-2xl font-mono font-bold text-gray-900 tracking-wider">
                {deviceFlowData.userCode}
              </span>
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Go to: <span className="font-mono text-blue-600">{deviceFlowData.verificationUri}</span>
            </p>
            <button
              onClick={openVerificationUri}
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              Open verification page
            </button>
            <p className="text-sm text-gray-600">
              Enter the code above to sign in
            </p>
          </div>

          {isPolling && (
            <div className="text-center">
              <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Waiting for authentication... ({formatTime(timeRemaining)} remaining)
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <button
            onClick={startDeviceFlow}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
          >
            Try Again
          </button>
        </div>
      )}

      {isSuccess && (
        <div className="text-center">
          <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p className="text-green-700 font-medium">Authentication successful!</p>
          <p className="text-sm text-gray-600">Redirecting to {redirectTo}...</p>
        </div>
      )}
    </div>
  )
}
