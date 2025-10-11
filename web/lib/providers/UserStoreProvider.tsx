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
  const { setUser, setSession, setLoading, setError } = useUserStore()

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        setLoading(true)
        const supabase = await getSupabaseBrowserClient()
        
        if (!mounted) return

        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Failed to get session:', error)
          setError(error.message)
        } else if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event: string, session) => {
            if (mounted) {
              setSession(session)
              setUser(session?.user ?? null)
              setLoading(false)
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

    const cleanup = initializeAuth()

    return () => {
      mounted = false
      cleanup.then(cleanupFn => cleanupFn?.())
    }
  }, [setUser, setSession, setLoading, setError])

  return <>{children}</>
}
