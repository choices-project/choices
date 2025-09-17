'use client'

import { useEffect, useCallback, useState } from 'react'
import type { User, Session} from '@supabase/supabase-js';
import { AuthError } from '@supabase/supabase-js'
import { createBrowserClientSafe } from '@/lib/supabase-ssr-safe'
import { devLog } from '@/lib/logger'

export type AuthState = {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  isLoading: boolean
  error: AuthError | null
}

export type AuthActions = {
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateProfile: (updates: Record<string, unknown>) => Promise<void>
  clearError: () => void
}

export function useSupabaseAuth(): AuthState & AuthActions {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  })

  const supabase = createBrowserClientSafe()

  // Initialize authentication state
  useEffect(() => {
    if (!supabase) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: new AuthError('Client initialization failed'),
      }))
      return
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          devLog('Error getting initial session:', error)
          setState(prev => ({
            ...prev,
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
            error,
          }))
          return
        }

        setState(prev => ({
          ...prev,
          user: session?.user || null,
          session,
          isAuthenticated: !!session?.user,
          isLoading: false,
          error: null,
        }))
      } catch (error) {
        devLog('Error in getInitialSession:', error)
        setState(prev => ({
          ...prev,
          user: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
          error: error instanceof AuthError ? error : new AuthError('Session initialization failed'),
        }))
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        devLog('Auth state changed:', event, session?.user.id)
        
        setState(prev => ({
          ...prev,
          user: session?.user || null,
          session,
          isAuthenticated: !!session?.user,
          isLoading: false,
          error: null,
        }))
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  // Sign in function
  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      throw new Error('Supabase client not available')
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        devLog('Sign in error:', error)
        setState(prev => ({
          ...prev,
          isLoading: false,
          error,
        }))
        throw error
      }

      setState(prev => ({
        ...prev,
        user: data.user,
        session: data.session,
        isAuthenticated: !!data.user,
        isLoading: false,
        error: null,
      }))
    } catch (error) {
      devLog('Sign in error:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof AuthError ? error : new AuthError('Sign in failed'),
      }))
      throw error
    }
  }, [supabase])

  // Sign up function
  const signUp = useCallback(async (email: string, password: string, metadata?: Record<string, unknown>) => {
    if (!supabase) {
      throw new Error('Supabase client not available')
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      })

      if (error) {
        devLog('Sign up error:', error)
        setState(prev => ({
          ...prev,
          isLoading: false,
          error,
        }))
        throw error
      }

      setState(prev => ({
        ...prev,
        user: data.user,
        session: data.session,
        isAuthenticated: !!data.user,
        isLoading: false,
        error: null,
      }))
    } catch (error) {
      devLog('Sign up error:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof AuthError ? error : new AuthError('Sign up failed'),
      }))
      throw error
    }
  }, [supabase])

  // Sign out function
  const signOut = useCallback(async () => {
    if (!supabase) {
      throw new Error('Supabase client not available')
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const { error } = await supabase.auth.signOut()

      if (error) {
        devLog('Sign out error:', error)
        setState(prev => ({
          ...prev,
          isLoading: false,
          error,
        }))
        throw error
      }

      setState(prev => ({
        ...prev,
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      }))
    } catch (error) {
      devLog('Sign out error:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof AuthError ? error : new AuthError('Sign out failed'),
      }))
      throw error
    }
  }, [supabase])

  // Reset password function
  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) {
      throw new Error('Supabase client not available')
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (error) {
        devLog('Reset password error:', error)
        setState(prev => ({
          ...prev,
          isLoading: false,
          error,
        }))
        throw error
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
      }))
    } catch (error) {
      devLog('Reset password error:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof AuthError ? error : new AuthError('Reset password failed'),
      }))
      throw error
    }
  }, [supabase])

  // Update profile function
  const updateProfile = useCallback(async (updates: Record<string, unknown>) => {
    if (!supabase) {
      throw new Error('Supabase client not available')
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      const { data, error } = await supabase.auth.updateUser(updates)

      if (error) {
        devLog('Update profile error:', error)
        setState(prev => ({
          ...prev,
          isLoading: false,
          error,
        }))
        throw error
      }

      setState(prev => ({
        ...prev,
        user: data.user,
        session: prev.session, // Keep existing session as updateUser doesn't return new session
        isLoading: false,
        error: null,
      }))
    } catch (error) {
      devLog('Update profile error:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof AuthError ? error : new AuthError('Update profile failed'),
      }))
      throw error
    }
  }, [supabase])

  // Clear error function
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    clearError,
  }
}

// Hook for checking authentication status
export function useAuthStatus(): { isAuthenticated: boolean; isLoading: boolean } {
  const { isAuthenticated, isLoading } = useSupabaseAuth()
  return { isAuthenticated, isLoading }
}

// Hook for getting current user
export function useUser(): User | null {
  const { user } = useSupabaseAuth()
  return user
}

// Hook for authentication actions only
export function useAuthActions(): AuthActions {
  const { signIn, signUp, signOut, resetPassword, updateProfile, clearError } = useSupabaseAuth()
  return { signIn, signUp, signOut, resetPassword, updateProfile, clearError }
}
