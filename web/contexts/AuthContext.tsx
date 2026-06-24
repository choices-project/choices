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

import { getSupabaseBrowserClient } from '@/utils/supabase/client'

import { hydrateBrowserSessionFromServer } from '@/lib/auth/browser-session'
import { PROFILE_SELECT_COLUMNS } from '@/lib/api/response-builders'
import { env } from '@/lib/config/env'
import {
  useSession,
  useUser,
  useUserActions,
} from '@/lib/stores/userStore'
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
const IS_E2E_HARNESS = env.NEXT_PUBLIC_ENABLE_E2E_HARNESS === '1'

export { AuthContext }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  const storeSession = useSession()
  const storeUser = useUser()
  const {
    setLoading: setStoreLoading,
    initializeAuth,
    setSessionAndDerived,
    setProfile,
    setProfileLoading,
    setUserError,
    clearUserError,
    signOut: storeSignOut,
  } = useUserActions()

  const initializeAuthRef = useRef(initializeAuth)
  const setSessionAndDerivedRef = useRef(setSessionAndDerived)
  const setProfileRef = useRef(setProfile)
  const setProfileLoadingRef = useRef(setProfileLoading)
  const setUserErrorRef = useRef(setUserError)
  const clearUserErrorRef = useRef(clearUserError)
  const storeSignOutRef = useRef(storeSignOut)
  const setStoreLoadingRef = useRef(setStoreLoading)
  /** Prevents onAuthStateChange / hydration from re-adopting a session mid-logout. */
  const signOutInProgressRef = useRef(false)

  useEffect(() => { initializeAuthRef.current = initializeAuth }, [initializeAuth])
  useEffect(() => { setSessionAndDerivedRef.current = setSessionAndDerived }, [setSessionAndDerived])
  useEffect(() => { setProfileRef.current = setProfile }, [setProfile])
  useEffect(() => { setProfileLoadingRef.current = setProfileLoading }, [setProfileLoading])
  useEffect(() => { setUserErrorRef.current = setUserError }, [setUserError])
  useEffect(() => { clearUserErrorRef.current = clearUserError }, [clearUserError])
  useEffect(() => { storeSignOutRef.current = storeSignOut }, [storeSignOut])
  useEffect(() => { setStoreLoadingRef.current = setStoreLoading }, [setStoreLoading])

  const hydrateProfile = useCallback(
    async (client: Awaited<ReturnType<typeof getSupabaseBrowserClient>>, userId: string) => {
      setProfileLoadingRef.current(true)
      try {
        const { data, error } = await client
          .from('user_profiles')
          .select(PROFILE_SELECT_COLUMNS)
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
    (
      supabaseClient: Awaited<ReturnType<typeof getSupabaseBrowserClient>>,
      nextSession: Session | null,
    ) => {
      if (signOutInProgressRef.current) {
        return
      }
      if (nextSession?.user) {
        initializeAuthRef.current(nextSession.user, nextSession, true)
        setSessionAndDerivedRef.current(nextSession)
        // Profile hydration is intentionally fire-and-forget. Previously this
        // was awaited, which meant a slow `user_profiles` query could keep
        // the auth-loading state pinned to `true` indefinitely — trapping
        // every consumer behind <AuthGuard> on "Checking authentication...".
        // Identity is already established by the session; the profile is an
        // enrichment the rest of the UI can render around.
        void hydrateProfile(supabaseClient, nextSession.user.id)
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

    // Hard ceiling on how long the UI can sit on "Checking authentication...".
    // Empirically, supabase.auth.getSession() can hang indefinitely when the
    // browser's `navigator.locks` is stuck (e.g. a previous worker/tab held
    // the auth lock and never released it — common in Incognito and after a
    // crashed tab). The previous bootstrap had only an 8s WARNING log here,
    // no escape: isLoading stayed true forever.
    const GET_SESSION_HARD_TIMEOUT_MS = 10_000

    const adoptSession = (session: Session | null, supabase: Awaited<ReturnType<typeof getSupabaseBrowserClient>>) => {
      if (!mounted || signOutInProgressRef.current) return
      setSession(session)
      setUser(session?.user ?? null)
      applySession(supabase, session)
      setStoreLoadingRef.current(false)
      setLoading(false)
    }

    const bootstrapAuth = async (): Promise<(() => void) | undefined> => {
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

        // CRITICAL: subscribe to auth state changes BEFORE awaiting getSession.
        // If getSession() hangs (lock stuck, network stalled), we still need
        // the listener wired up so a real session arriving later — via
        // sign-in, token refresh, or cross-tab broadcast — can unblock the UI.
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (event: string, nextSession: Session | null) => {
            if (!mounted) return
            if (process.env.NODE_ENV === 'development') {
              logger.debug('Auth state changed', {
                event,
                hasSession: !!nextSession,
                userId: nextSession?.user?.id,
              })
            }
            adoptSession(nextSession, supabase)
          },
        )

        // Start in parallel with getSession — httpOnly cookies are invisible to the client until hydrated.
        const serverHydrationPromise = hydrateBrowserSessionFromServer()

        // Race getSession() against a hard timeout. On timeout we DO NOT
        // substitute a fake `{ session: null }` (previous attempts at that
        // caused production false-logouts where middleware-validated cookies
        // were silently overridden client-side). Instead we just unblock the
        // loading state and let the listener above adopt the real session if
        // and when it finally arrives.
        const sessionPromise = supabase.auth
          .getSession()
          .then((r): { kind: 'resolved'; session: Session | null } => ({
            kind: 'resolved',
            session: r.data.session ?? null,
          }))
          .catch((err): { kind: 'error'; error: unknown } => ({ kind: 'error', error: err }))

        const timeoutPromise = new Promise<{ kind: 'timeout' }>((resolve) => {
          window.setTimeout(() => resolve({ kind: 'timeout' }), GET_SESSION_HARD_TIMEOUT_MS)
        })

        const raceResult = await Promise.race([sessionPromise, timeoutPromise])

        if (!mounted) return () => subscription.unsubscribe()

        const adoptWithServerFallback = async (
          clientSession: Session | null,
        ): Promise<void> => {
          const session = clientSession ?? (await serverHydrationPromise)
          adoptSession(session, supabase)
        }

        if (raceResult.kind === 'resolved') {
          await adoptWithServerFallback(raceResult.session)
        } else if (raceResult.kind === 'error') {
          const session = await serverHydrationPromise
          if (session) {
            adoptSession(session, supabase)
          } else {
            logger.warn(
              'AuthContext: getSession() rejected — unblocking UI; preserving any persisted auth state',
              { error: raceResult.error },
            )
            setStoreLoadingRef.current(false)
            setLoading(false)
          }
        } else {
          const serverSession = await serverHydrationPromise
          if (serverSession) {
            adoptSession(serverSession, supabase)
          } else {
            logger.error(
              `AuthContext: getSession() did not resolve within ${GET_SESSION_HARD_TIMEOUT_MS}ms — unblocking UI; will adopt real session if/when it arrives`,
            )
            setStoreLoadingRef.current(false)
            setLoading(false)
            void sessionPromise.then(async (late) => {
              if (!mounted || late.kind !== 'resolved') return
              await adoptWithServerFallback(late.session)
            })
          }
        }

        return () => subscription.unsubscribe()
      } catch (error) {
        logger.error('Failed to initialize Supabase client:', error)
        if (mounted) {
          // Always set loading to false, even on error, to prevent UI from being stuck
          setLoading(false)
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
    if (signOutInProgressRef.current || session || !storeSession) {
      return
    }
    setSession(storeSession)
    setUser(storeUser ?? storeSession.user ?? null)
    setStoreLoadingRef.current(false)
    setLoading(false)
  }, [session, storeSession, storeUser])

  const signOut = useCallback(async () => {
    if (signOutInProgressRef.current) {
      return
    }
    signOutInProgressRef.current = true

    storeSignOutRef.current()
    initializeAuthRef.current(null, null, false)
    setSession(null)
    setUser(null)

    if (typeof window === 'undefined') {
      return
    }

    try {
      const supabase = await getSupabaseBrowserClient()
      await supabase.auth.signOut({ scope: 'local' })
    } catch (error) {
      logger.warn('Local Supabase signOut during logout failed', { error })
    }

    try {
      window.localStorage.clear()
      window.sessionStorage.clear()
    } catch {
      // Private browsing / disabled storage
    }

    // Server route clears httpOnly Supabase cookies, then redirects to `/`.
    // A full navigation avoids races with onAuthStateChange re-hydrating cookies.
    window.location.replace('/api/auth/clear-session')
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
    if (
      signOutInProgressRef.current ||
      hasRefreshedFromStorageRef.current ||
      session ||
      loading ||
      IS_E2E_HARNESS
    ) {
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
    if (signOutInProgressRef.current || session || loading || IS_E2E_HARNESS) {
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
