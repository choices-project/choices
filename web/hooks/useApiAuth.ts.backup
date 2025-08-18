'use client'

import { useState, useEffect, useCallback } from 'react'
import { getApiAuthManager, ApiAuthContext } from '../lib/api'
import { useAuth } from './useAuth'

export interface ApiAuthState {
  authContext: ApiAuthContext | null
  isLoading: boolean
  error: Error | null
}

export interface ApiAuthActions {
  refreshAuthContext: () => Promise<void>
  clearError: () => void
}

export function useApiAuth(): ApiAuthState & ApiAuthActions {
  const { isAuthenticated, user } = useAuth()
  const [state, setState] = useState<ApiAuthState>({
    authContext: null,
    isLoading: true,
    error: null,
  })

  const apiAuthManager = getApiAuthManager()

  // Initialize API authentication context
  useEffect(() => {
    const initializeApiAuth = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }))

        if (isAuthenticated && user) {
          const authContext = await apiAuthManager.getAuthContext()
          setState(prev => ({
            ...prev,
            authContext,
            isLoading: false,
          }))
        } else {
          setState(prev => ({
            ...prev,
            authContext: null,
            isLoading: false,
          }))
        }
      } catch (error) {
        console.error('API Auth initialization error:', error)
        setState(prev => ({
          ...prev,
          authContext: null,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Failed to initialize API authentication'),
        }))
      }
    }

    initializeApiAuth()
  }, [isAuthenticated, user, apiAuthManager])

  // Refresh authentication context
  const refreshAuthContext = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      if (isAuthenticated && user) {
        const authContext = await apiAuthManager.getAuthContext()
        setState(prev => ({
          ...prev,
          authContext,
          isLoading: false,
        }))
      } else {
        setState(prev => ({
          ...prev,
          authContext: null,
          isLoading: false,
        }))
      }
    } catch (error) {
      console.error('Refresh API Auth error:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Failed to refresh API authentication'),
      }))
    }
  }, [isAuthenticated, user, apiAuthManager])

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    refreshAuthContext,
    clearError,
  }
}

// Hook for checking API authentication status
export function useApiAuthStatus(): { isApiAuthenticated: boolean; isLoading: boolean } {
  const { authContext, isLoading } = useApiAuth()
  return { 
    isApiAuthenticated: !!authContext?.isAuthenticated, 
    isLoading 
  }
}

// Hook for getting API authentication context
export function useApiAuthContext(): ApiAuthContext | null {
  const { authContext } = useApiAuth()
  return authContext
}

// Hook for API authentication actions only
export function useApiAuthActions(): ApiAuthActions {
  const { refreshAuthContext, clearError } = useApiAuth()
  return { refreshAuthContext, clearError }
}
