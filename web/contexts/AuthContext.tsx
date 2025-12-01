'use client';


import type { User, Session } from '@supabase/supabase-js'
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'

import { useUserStore } from '@/lib/stores/userStore'
import logger from '@/lib/utils/logger'
import { getSupabaseBrowserClient } from '@/utils/supabase/client'

type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  isLoading: boolean  // Alias for backward compatibility
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)
const IS_E2E_HARNESS = process.env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1'

export { AuthContext }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const initializeAuth = useUserStore((state) => state.initializeAuth)
  const setSessionAndDerived = useUserStore((state) => state.setSessionAndDerived)
  const setProfile = useUserStore((state) => state.setProfile)
  const setProfileLoading = useUserStore((state) => state.setProfileLoading)
  const setUserError = useUserStore((state) => state.setUserError)
  const clearUserError = useUserStore((state) => state.clearUserError)
  const storeSignOut = useUserStore((state) => state.signOut)

  const hydrateProfile = useCallback(
    async (client: Awaited<ReturnType<typeof getSupabaseBrowserClient>>, userId: string) => {
      setProfileLoading(true)
      try {
        const { data, error } = await client
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (error) {
          logger.error('Failed to fetch user profile from Supabase', error)
          setUserError('Unable to load profile information. Please try again.')
          return
        }

        setProfile(data ?? null)
        clearUserError()
      } catch (error) {
        logger.error('Unexpected error while hydrating user profile', error)
        setUserError('Unexpected error while loading profile.')
      } finally {
        setProfileLoading(false)
      }
    },
    [clearUserError, setProfile, setProfileLoading, setUserError],
  )

  const applySession = useCallback(
    async (
      supabaseClient: Awaited<ReturnType<typeof getSupabaseBrowserClient>>,
      nextSession: Session | null,
    ) => {
      if (nextSession?.user) {
        initializeAuth(nextSession.user, nextSession, true)
        setSessionAndDerived(nextSession)
        await hydrateProfile(supabaseClient, nextSession.user.id)
      } else {
        initializeAuth(null, null, false)
        storeSignOut()
      }
    },
    [hydrateProfile, initializeAuth, setSessionAndDerived, storeSignOut],
  )

  useEffect(() => {
    if (IS_E2E_HARNESS) {
      initializeAuth(null, null, false)
      setLoading(false)
      return
    }

    let mounted = true

    const bootstrapAuth = async (): Promise<(() => void) | undefined> => {
      try {
        const supabase = await getSupabaseBrowserClient()

        if (!mounted) return undefined

        // Get initial session
        const { data: { session } } = await supabase.auth.getSession()
        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
          await applySession(supabase, session)
          setLoading(false)
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event: string, session: Session | null) => {
            if (mounted) {
              // Log auth state changes for debugging
              if (process.env.NODE_ENV === 'development') {
                logger.debug('Auth state changed', { event, hasSession: !!session, userId: session?.user?.id })
              }
              setSession(session)
              setUser(session?.user ?? null)
              setLoading(false)
              await applySession(supabase, session)
            }
          }
        )

        return () => subscription.unsubscribe()
      } catch (error) {
        logger.error('Failed to initialize Supabase client:', error)
        if (mounted) {
          setLoading(false)
        }
        return undefined
      }
    }

    const cleanup = bootstrapAuth()

    return () => {
      mounted = false
      cleanup.then(cleanupFn => cleanupFn?.())
    }
  }, [applySession, initializeAuth])

  const signOut = async () => {
    if (IS_E2E_HARNESS) {
      storeSignOut()
      initializeAuth(null, null, false)
      setSession(null)
      setUser(null)
      return
    }

    try {
      const supabase = await getSupabaseBrowserClient()
      await supabase.auth.signOut()
      storeSignOut()
      initializeAuth(null, null, false)
      setSession(null)
      setUser(null)
    } catch (error) {
      logger.error('Failed to sign out:', error)
    }
  }

  const refreshSession = async () => {
    if (IS_E2E_HARNESS) {
      return
    }

    try {
      const supabase = await getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      await applySession(supabase, session)
    } catch (error) {
      logger.error('Failed to refresh session:', error)
    }
  }

  const value = {
    user,
    session,
    loading,
    isLoading: loading,  // Alias for backward compatibility
    signOut,
    refreshSession,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Alias for backward compatibility
export const useSupabaseAuth = useAuth
