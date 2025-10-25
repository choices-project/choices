'use client'

import { useEffect } from 'react'

import { useUserStore } from '@/lib/stores'
import { getSupabaseBrowserClient } from '@/utils/supabase/client'

/**
 * UserStore Provider
 * 
 * Initializes the UserStore with Supabase authentication state.
 * This replaces the AuthProvider and integrates with Zustand.
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */
export function UserStoreProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setSession, setAuthenticated, setLoading, setError } = useUserStore()

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        console.log('🔄 UserStoreProvider: Starting initialization...')
        setLoading(true)
        const supabase = await getSupabaseBrowserClient()
        
        if (!mounted) return

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('🔄 UserStoreProvider: Initial session check:', { hasSession: !!session, hasUser: !!session?.user, error })
        
        if (error) {
          console.error('Failed to get session:', error)
          setError(error.message)
          setAuthenticated(false)
        } else if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
          setAuthenticated(!!session?.user)
          console.log('🔄 UserStoreProvider: Initial state set:', { hasUser: !!session?.user, authenticated: !!session?.user })
          
          // Additional verification: check profile API if we have a session
          if (session?.user) {
            try {
              const response = await fetch('/api/profile', {
                credentials: 'include',
              })
              if (response.ok) {
                const profileData = await response.json()
                if (profileData.profile) {
                  console.log('✅ UserStoreProvider: Authentication verified via profile API')
                  setAuthenticated(true)
                } else {
                  console.log('⚠️ UserStoreProvider: Session exists but no profile found')
                }
              }
            } catch (profileError) {
              console.log('⚠️ UserStoreProvider: Profile API check failed:', profileError)
            }
          }
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event: string, session) => {
            if (mounted) {
              console.log('🔄 UserStoreProvider: Auth state change:', { event, hasUser: !!session?.user })
              setSession(session)
              setUser(session?.user ?? null)
              setAuthenticated(!!session?.user)
              setLoading(false)
              
              // Force a re-render if we have a session but the state wasn't updated
              if (session?.user && !useUserStore.getState().isAuthenticated) {
                console.log('🔄 UserStoreProvider: Forcing authentication state update')
                setAuthenticated(true)
              }
            }
          }
        )

        return () => subscription.unsubscribe()
      } catch (error) {
        console.error('Failed to initialize Supabase client:', error)
        if (mounted) {
          setError(error instanceof Error ? error.message : 'Authentication failed')
          setLoading(false)
        }
      }
    }

        // Additional periodic authentication check for E2E tests
        const periodicAuthCheck = setInterval(async () => {
          if (mounted) {
            try {
              const response = await fetch('/api/profile', {
                credentials: 'include',
              })
              if (response.ok) {
                const profileData = await response.json()
                if (profileData.profile && !useUserStore.getState().isAuthenticated) {
                  console.log('🔄 UserStoreProvider: Periodic check found authenticated user, updating state')
                  setAuthenticated(true)
                  // Also try to get the session from Supabase
                  const supabase = await getSupabaseBrowserClient()
                  const { data: { session } } = await supabase.auth.getSession()
                  if (session) {
                    setSession(session)
                    setUser(session.user)
                    setAuthenticated(true)
                    console.log('✅ UserStoreProvider: Session and user state updated')
                  }
                }
              }
            } catch (error) {
              // Silent fail for periodic checks
            }
          }
        }, 5000) // Check every 5 seconds (reduced frequency to prevent React errors)

    const cleanup = initializeAuth()

    return () => {
      mounted = false
      clearInterval(periodicAuthCheck)
      cleanup.then(cleanupFn => cleanupFn?.())
    }
  }, [setUser, setSession, setAuthenticated, setLoading, setError])

  return <>{children}</>
}
