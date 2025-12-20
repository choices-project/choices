'use client';


import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

import { getSupabaseBrowserClient } from '@/utils/supabase/client'

import { useUserStore } from '@/lib/stores/userStore'
import logger from '@/lib/utils/logger'

import type { User, Session } from '@supabase/supabase-js'

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

  // Use refs to ensure stable callbacks and prevent infinite loops
  const initializeAuthRef = useRef(initializeAuth)
  const setSessionAndDerivedRef = useRef(setSessionAndDerived)
  const setProfileRef = useRef(setProfile)
  const setProfileLoadingRef = useRef(setProfileLoading)
  const setUserErrorRef = useRef(setUserError)
  const clearUserErrorRef = useRef(clearUserError)
  const storeSignOutRef = useRef(storeSignOut)

  // Keep refs in sync (these should be stable, but just in case)
  useEffect(() => { initializeAuthRef.current = initializeAuth }, [initializeAuth])
  useEffect(() => { setSessionAndDerivedRef.current = setSessionAndDerived }, [setSessionAndDerived])
  useEffect(() => { setProfileRef.current = setProfile }, [setProfile])
  useEffect(() => { setProfileLoadingRef.current = setProfileLoading }, [setProfileLoading])
  useEffect(() => { setUserErrorRef.current = setUserError }, [setUserError])
  useEffect(() => { clearUserErrorRef.current = clearUserError }, [clearUserError])
  useEffect(() => { storeSignOutRef.current = storeSignOut }, [storeSignOut])

  const hydrateProfile = useCallback(
    async (client: Awaited<ReturnType<typeof getSupabaseBrowserClient>>, userId: string) => {
      setProfileLoadingRef.current(true)
      try {
        const { data, error } = await client
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (error) {
          logger.error('Failed to fetch user profile from Supabase', error)
          setUserErrorRef.current('Unable to load profile information. Please try again.')
          return
        }

        setProfileRef.current(data ?? null)
        clearUserErrorRef.current()
      } catch (error) {
        logger.error('Unexpected error while hydrating user profile', error)
        setUserErrorRef.current('Unexpected error while loading profile.')
      } finally {
        setProfileLoadingRef.current(false)
      }
    },
    [], // Empty deps - uses refs
  )

  const applySession = useCallback(
    async (
      supabaseClient: Awaited<ReturnType<typeof getSupabaseBrowserClient>>,
      nextSession: Session | null,
    ) => {
      if (nextSession?.user) {
        initializeAuthRef.current(nextSession.user, nextSession, true)
        setSessionAndDerivedRef.current(nextSession)
        await hydrateProfile(supabaseClient, nextSession.user.id)
      } else {
        initializeAuthRef.current(null, null, false)
        storeSignOutRef.current()
      }
    },
    [hydrateProfile], // Only depends on hydrateProfile which is now stable
  )

  // Auth initialization - runs once on mount
  const hasInitializedRef = useRef(false)
  useEffect(() => {
    if (hasInitializedRef.current) return
    hasInitializedRef.current = true

    if (IS_E2E_HARNESS) {
      initializeAuthRef.current(null, null, false)
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
  }, [applySession]) // applySession is now stable

  const signOut = async () => {
    if (IS_E2E_HARNESS) {
      storeSignOut()
      initializeAuth(null, null, false)
      setSession(null)
      setUser(null)
      // Redirect to landing page after logout
      if (typeof window !== 'undefined') {
        window.location.href = '/landing'
      }
      return
    }

    try {
      // Call logout API endpoint to properly clear cookies
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        logger.warn('Logout API call failed, attempting direct signOut');
        // Fallback to direct Supabase signOut
        const supabase = await getSupabaseBrowserClient();
        await supabase.auth.signOut();
      }

      // Clear local state
      storeSignOut();
      initializeAuth(null, null, false);
      setSession(null);
      setUser(null);

      // Clear localStorage and sessionStorage
      if (typeof window !== 'undefined') {
        window.localStorage.clear();
        window.sessionStorage.clear();
        // Hard redirect to ensure cookies are cleared
        window.location.href = '/landing';
      }
    } catch (error) {
      logger.error('Failed to sign out:', error);
      // Still clear state and redirect even if logout fails
      storeSignOut();
      initializeAuth(null, null, false);
      setSession(null);
      setUser(null);
      if (typeof window !== 'undefined') {
        window.localStorage.clear();
        window.sessionStorage.clear();
        window.location.href = '/landing';
      }
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
