'use client'

import { useEffect, useCallback, useState, createContext, useContext } from 'react'
import { LoginCredentials, RegisterData } from '@/types';
import { devLog } from '@/lib/logger';
import { getAuthService, User, AuthError } from '../lib/auth'

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: AuthError | null
}

export interface AuthActions {
  login: (credentials: LoginCredentials) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  clearError: () => void
}

export function useAuth(): AuthState & AuthActions {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  })

  const authService = getAuthService()

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }))

        // Check if user is authenticated
        if (authService.isAuthenticated()) {
          // Get stored user first for immediate UI update
          const storedUser = authService.getStoredUser()
          if (storedUser) {
            setState(prev => ({
              ...prev,
              user: storedUser,
              isAuthenticated: true,
              isLoading: false,
            }))
          }

          // Fetch fresh user data from server
          const user = await authService.getCurrentUser()
          setState(prev => ({
            ...prev,
            user,
            isAuthenticated: !!user,
            isLoading: false,
          }))
        } else {
          setState(prev => ({
            ...prev,
            user: null,
            isAuthenticated: false,
            isLoading: false,
          }))
        }
      } catch (error) {
        devLog('Auth initialization error:', error)
        setState(prev => ({
          ...prev,
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: error instanceof AuthError ? error : new AuthError('INIT_ERROR', 'Failed to initialize authentication'),
        }))
      }
    }

    initializeAuth()
  }, [authService])

  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const session = await authService.login(credentials)
      
      setState(prev => ({
        ...prev,
        user: session.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }))
    } catch (error) {
      devLog('Login error:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof AuthError ? error : new AuthError('LOGIN_ERROR', 'Login failed'),
      }))
      throw error
    }
  }, [authService])

  // Register function
  const register = useCallback(async (data: RegisterData) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const session = await authService.register(data)
      
      setState(prev => ({
        ...prev,
        user: session.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      }))
    } catch (error) {
      devLog('Registration error:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof AuthError ? error : new AuthError('REGISTER_ERROR', 'Registration failed'),
      }))
      throw error
    }
  }, [authService])

  // Logout function
  const logout = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      await authService.logout()
      
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }))
    } catch (error) {
      devLog('Logout error:', error)
      // Even if logout fails, clear local state
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof AuthError ? error : new AuthError('LOGOUT_ERROR', 'Logout failed'),
      }))
    }
  }, [authService])

  // Refresh user function
  const refreshUser = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const user = await authService.getCurrentUser()
      
      setState(prev => ({
        ...prev,
        user,
        isAuthenticated: !!user,
        isLoading: false,
        error: null,
      }))
    } catch (error) {
      devLog('Refresh user error:', error)
      setState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: error instanceof AuthError ? error : new AuthError('REFRESH_ERROR', 'Failed to refresh user'),
      }))
    }
  }, [authService])

  // Clear error function
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    login,
    register,
    logout,
    refreshUser,
    clearError,
  }
}

// Hook for checking authentication status
export function useAuthStatus(): { isAuthenticated: boolean; isLoading: boolean } {
  const { isAuthenticated, isLoading } = useAuth()
  return { isAuthenticated, isLoading }
}

// Hook for getting current user
export function useUser(): User | null {
  const { user } = useAuth()
  return user
}

// Hook for authentication actions only
export function useAuthActions(): AuthActions {
  const { login, register, logout, refreshUser, clearError } = useAuth()
  return { login, register, logout, refreshUser, clearError }
}
