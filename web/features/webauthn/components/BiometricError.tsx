'use client'

import { useState } from 'react'
import { 
  AlertTriangle, 
  RefreshCw, 
  Smartphone, 
  Lock, 
  HelpCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import type { WebAuthnError } from '@/lib/shared/webauthn';
import { WebAuthnErrorType } from '@/lib/shared/webauthn'

interface BiometricErrorProps {
  error: WebAuthnError
  onRetry: () => void
  onFallback: () => void
  onHelp: () => void
  className?: string
}

export default function BiometricError({ 
  error, 
  onRetry, 
  onFallback, 
  onHelp, 
  className = '' 
}: BiometricErrorProps) {
  const [isRetrying, setIsRetrying] = useState(false)

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      await onRetry()
    } finally {
      setIsRetrying(false)
    }
  }

  const getErrorIcon = () => {
    switch (error.type) {
      case WebAuthnErrorType.USER_CANCELLED:
        return <XCircle className="w-6 h-6 text-yellow-600" />
      case WebAuthnErrorType.SECURITY_ERROR:
        return <AlertTriangle className="w-6 h-6 text-red-600" />
      case WebAuthnErrorType.NOT_SUPPORTED:
      case WebAuthnErrorType.NOT_AVAILABLE:
        return <HelpCircle className="w-6 h-6 text-gray-600" />
      case WebAuthnErrorType.TIMEOUT:
        return <RefreshCw className="w-6 h-6 text-blue-600" />
      default:
        return <AlertTriangle className="w-6 h-6 text-orange-600" />
    }
  }

  const getErrorColor = () => {
    switch (error.type) {
      case WebAuthnErrorType.USER_CANCELLED:
        return 'border-yellow-200 bg-yellow-50'
      case WebAuthnErrorType.SECURITY_ERROR:
        return 'border-red-200 bg-red-50'
      case WebAuthnErrorType.NOT_SUPPORTED:
      case WebAuthnErrorType.NOT_AVAILABLE:
        return 'border-gray-200 bg-gray-50'
      case WebAuthnErrorType.TIMEOUT:
        return 'border-blue-200 bg-blue-50'
      default:
        return 'border-orange-200 bg-orange-50'
    }
  }

  const getErrorTitle = () => {
    switch (error.type) {
      case WebAuthnErrorType.USER_CANCELLED:
        return 'Authentication Cancelled'
      case WebAuthnErrorType.SECURITY_ERROR:
        return 'Security Error'
      case WebAuthnErrorType.NOT_SUPPORTED:
        return 'Not Supported'
      case WebAuthnErrorType.NOT_AVAILABLE:
        return 'Not Available'
      case WebAuthnErrorType.INVALID_RESPONSE:
        return 'Invalid Response'
      case WebAuthnErrorType.TIMEOUT:
        return 'Authentication Timed Out'
      case WebAuthnErrorType.NETWORK_ERROR:
        return 'Network Error'
      default:
        return 'Authentication Error'
    }
  }

  const getRecoveryOptions = () => {
    const options: any[] = []

    // Always show retry if recoverable
    if (error.recoverable) {
      options.push({
        label: 'Try Again',
        icon: <RefreshCw className="w-4 h-4" />,
        action: handleRetry,
        primary: true,
        loading: isRetrying
      })
    }

    // Show fallback options
    if (error.type !== WebAuthnErrorType.NOT_SUPPORTED && error.type !== WebAuthnErrorType.NOT_AVAILABLE) {
      options.push({
        label: 'Use Password',
        icon: <Lock className="w-4 h-4" />,
        action: onFallback,
        primary: false
      })
    }

    // Show device flow option
    options.push({
      label: 'Use Another Device',
      icon: <Smartphone className="w-4 h-4" />,
      action: onFallback, // This will trigger device flow
      primary: false
    })

    return options
  }

  return (
    <div className={`border rounded-lg p-4 ${getErrorColor()} ${className}`}>
      <div className="flex items-start space-x-3">
        {getErrorIcon()}
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            {getErrorTitle()}
          </h3>
          <p className="text-sm text-gray-700 mb-3">
            {error.message}
          </p>
          
          {error.suggestedAction && (
            <div className="bg-white border border-gray-200 rounded-md p-3 mb-4">
              <div className="flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Suggestion:</span> {error.suggestedAction}
                </p>
              </div>
            </div>
          )}

          {/* Recovery Options */}
          <div className="space-y-2">
            {getRecoveryOptions().map((option, index) => (
              <button
                key={index}
                onClick={option.action}
                disabled={option.loading}
                className={`w-full flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  option.primary
                    ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:bg-gray-100'
                }`}
              >
                {option.loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  option.icon
                )}
                <span>{option.loading ? 'Trying...' : option.label}</span>
              </button>
            ))}
          </div>

          {/* Help Link */}
          <button
            onClick={onHelp}
            className="mt-3 text-sm text-blue-600 hover:text-blue-700 hover:underline"
          >
            Need help? Contact support
          </button>
        </div>
      </div>
    </div>
  )
}











