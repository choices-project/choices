'use client';


import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useShallow } from 'zustand/react/shallow'

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

  // Use a single selector with useShallow to get all store actions at once
  // This reduces the number of subscriptions and ensures stable references
  const storeSession = useUserStore((state) => state.session)
  const storeUser = useUserStore((state) => state.user)
  const storeActions = useUserStore(
    useShallow((state) => ({
      setLoading: state.setLoading,
      initializeAuth: state.initializeAuth,
      setSessionAndDerived: state.setSessionAndDerived,
      setProfile: state.setProfile,
      setProfileLoading: state.setProfileLoading,
      setUserError: state.setUserError,
      clearUserError: state.clearUserError,
      storeSignOut: state.signOut,
    }))
  )

  // Use refs to ensure stable callbacks and prevent infinite loops
  // Zustand actions are stable, but we use refs as an extra safety measure
  const initializeAuthRef = useRef(storeActions.initializeAuth)
  const setSessionAndDerivedRef = useRef(storeActions.setSessionAndDerived)
  const setProfileRef = useRef(storeActions.setProfile)
  const setProfileLoadingRef = useRef(storeActions.setProfileLoading)
  const setUserErrorRef = useRef(storeActions.setUserError)
  const clearUserErrorRef = useRef(storeActions.clearUserError)
  const storeSignOutRef = useRef(storeActions.storeSignOut)
  const setStoreLoadingRef = useRef(storeActions.setLoading)

  // Keep refs in sync - useShallow ensures the object reference is stable, but actions inside might change
  // Actually, Zustand actions are always stable, so these effects should never run, but we keep them for safety
  useEffect(() => { initializeAuthRef.current = storeActions.initializeAuth }, [storeActions.initializeAuth])
  useEffect(() => { setSessionAndDerivedRef.current = storeActions.setSessionAndDerived }, [storeActions.setSessionAndDerived])
  useEffect(() => { setProfileRef.current = storeActions.setProfile }, [storeActions.setProfile])
  useEffect(() => { setProfileLoadingRef.current = storeActions.setProfileLoading }, [storeActions.setProfileLoading])
  useEffect(() => { setUserErrorRef.current = storeActions.setUserError }, [storeActions.setUserError])
  useEffect(() => { clearUserErrorRef.current = storeActions.clearUserError }, [storeActions.clearUserError])
  useEffect(() => { storeSignOutRef.current = storeActions.storeSignOut }, [storeActions.storeSignOut])
  useEffect(() => { setStoreLoadingRef.current = storeActions.setLoading }, [storeActions.setLoading])

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

    // Check for E2E bypass flag (same logic as dashboard page)
    // This allows tests to bypass auth initialization
    const shouldBypassAuth = typeof window !== 'undefined' && 
      window.localStorage.getItem('e2e-dashboard-bypass') === '1'

    if (IS_E2E_HARNESS || shouldBypassAuth) {
      // DIAGNOSTIC: Log bypass in AuthContext
      if (process.env.DEBUG_DASHBOARD === '1' || shouldBypassAuth) {
        logger.debug('🚨 AuthContext: Bypassing auth initialization', {
          IS_E2E_HARNESS,
          shouldBypassAuth,
          bypassFlag: typeof window !== 'undefined' ? window.localStorage.getItem('e2e-dashboard-bypass') : 'SSR',
        });
      }
      initializeAuthRef.current(null, null, false)
      setStoreLoadingRef.current(false)
      setLoading(false)
      return
    }

    let mounted = true

    const bootstrapAuth = async (): Promise<(() => void) | undefined> => {
      // DIAGNOSTIC: Log auth bootstrap start
      if (process.env.DEBUG_DASHBOARD === '1' || (typeof window !== 'undefined' && window.localStorage.getItem('e2e-dashboard-bypass') === '1')) {
        logger.debug('🚨 AuthContext: Starting auth bootstrap', {
          mounted,
          shouldBypassAuth: typeof window !== 'undefined' && window.localStorage.getItem('e2e-dashboard-bypass') === '1',
        });
      }
      try {
        setStoreLoadingRef.current(true)
        const supabase = await getSupabaseBrowserClient()

        if (!mounted) return undefined

        // Get initial session with timeout to prevent hanging
        const sessionPromise = supabase.auth.getSession()
        const timeoutPromise = new Promise<{ data: { session: Session | null } }>((resolve) => {
          setTimeout(() => resolve({ data: { session: null } }), 5000) // 5 second timeout
        })
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise])
        
        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
          await applySession(supabase, session)
          setStoreLoadingRef.current(false)
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
              setStoreLoadingRef.current(false)
            }
          }
        )

        return () => subscription.unsubscribe()
      } catch (error) {
        logger.error('Failed to initialize Supabase client:', error)
        if (mounted) {
          // Always set loading to false, even on error, to prevent UI from being stuck
          setLoading(false)
          // Initialize with null session on error
          initializeAuthRef.current(null, null, false)
          setStoreLoadingRef.current(false)
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

  // Fallback: if the auth form updated the user store, sync it into context state.
  useEffect(() => {
    if (session || !storeSession) {
      return
    }
    setSession(storeSession)
    setUser(storeUser ?? storeSession.user ?? null)
    setStoreLoadingRef.current(false)
    setLoading(false)
  }, [session, storeSession, storeUser])

  const signOut = useCallback(async () => {
    if (IS_E2E_HARNESS) {
      storeSignOutRef.current()
      initializeAuthRef.current(null, null, false)
      setSession(null)
      setUser(null)
      // Redirect to landing page after logout
      if (typeof window !== 'undefined') {
        window.location.replace('/landing')
      }
      return
    }

    try {
      // Clear local state first to prevent any UI flicker
      storeSignOutRef.current();
      initializeAuthRef.current(null, null, false);
      setSession(null);
      setUser(null);

      // Clear localStorage and sessionStorage
      if (typeof window !== 'undefined') {
        window.localStorage.clear();
        window.sessionStorage.clear();
      }

      // Call logout API endpoint to properly clear cookies
      // Use a timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5_000); // 5 second timeout

      try {
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          logger.warn('Logout API call failed, attempting direct signOut');
          // Fallback to direct Supabase signOut
          const supabase = await getSupabaseBrowserClient();
          await supabase.auth.signOut().catch((err) => {
            logger.warn('Direct Supabase signOut also failed:', err);
          });
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);
        // If fetch fails (network error, timeout, etc.), try direct Supabase signOut
        if (fetchError instanceof Error && fetchError.name !== 'AbortError') {
          logger.warn('Logout API fetch failed, attempting direct signOut', fetchError);
          try {
            const supabase = await getSupabaseBrowserClient();
            await supabase.auth.signOut();
          } catch (supabaseError) {
            logger.warn('Direct Supabase signOut also failed:', supabaseError);
          }
        }
      }

      // Always redirect to landing page, even if API calls fail
      if (typeof window !== 'undefined') {
        // Use replace instead of href to prevent back button issues
        // This ensures users are taken back to the landing page after sign out
        window.location.replace('/landing');
      }
    } catch (error) {
      logger.error('Failed to sign out:', error);
      // Still clear state and redirect even if logout fails
      storeSignOutRef.current();
      initializeAuthRef.current(null, null, false);
      setSession(null);
      setUser(null);
      if (typeof window !== 'undefined') {
        window.localStorage.clear();
        window.sessionStorage.clear();
        window.location.replace('/landing');
      }
    }
  }, []) // Empty deps - uses refs for store actions

  const refreshSession = useCallback(async () => {
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
  }, [applySession]) // applySession is stable

  // Fallback: if a Supabase token exists in localStorage but context is empty, refresh.
  const hasRefreshedFromStorageRef = useRef(false)
  useEffect(() => {
    if (hasRefreshedFromStorageRef.current || session || loading || IS_E2E_HARNESS) {
      return
    }
    if (typeof window === 'undefined') {
      return
    }
    const hasToken = Object.keys(window.localStorage).some(
      (key) => key.startsWith('sb-') && key.endsWith('auth-token'),
    )
    if (hasToken) {
      hasRefreshedFromStorageRef.current = true
      void refreshSession()
    }
  }, [session, loading, refreshSession])

  // Fallback: if refresh fails to populate, hydrate from localStorage token shape.
  useEffect(() => {
    if (session || loading || IS_E2E_HARNESS) {
      return
    }
    if (typeof window === 'undefined') {
      return
    }
    const tokenKey = Object.keys(window.localStorage).find(
      (key) => key.startsWith('sb-') && key.endsWith('auth-token'),
    )
    if (!tokenKey) {
      return
    }
    try {
      const raw = window.localStorage.getItem(tokenKey)
      if (!raw) return
      const parsed = JSON.parse(raw) as Session
      if (!parsed?.user) return
      setSession(parsed)
      setUser(parsed.user)
      initializeAuthRef.current(parsed.user, parsed, true)
      setSessionAndDerivedRef.current(parsed)
      setLoading(false)
    } catch (error) {
      logger.warn('AuthContext failed to hydrate from localStorage session', error)
    }
  }, [session, loading])

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      isLoading: loading,  // Alias for backward compatibility
      signOut,
      refreshSession,
    }),
    [user, session, loading, signOut, refreshSession]
  )

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
