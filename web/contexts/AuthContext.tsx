'use client'

import type { User, Session } from '@supabase/supabase-js'
import React, { createContext, useContext, useEffect, useState } from 'react'

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

export { AuthContext }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const supabase = await getSupabaseBrowserClient()
        
        if (!mounted) return

        // Get initial session
        const { data: { session } } = await supabase.auth.getSession()
        if (mounted) {
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event: string, session: Session | null) => {
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
          setLoading(false)
        }
      }
    }

    const cleanup = initializeAuth()

    return () => {
      mounted = false
      cleanup.then(cleanupFn => cleanupFn?.())
    }
  }, [])

  const signOut = async () => {
    try {
      const supabase = await getSupabaseBrowserClient()
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Failed to sign out:', error)
    }
  }

  const refreshSession = async () => {
    try {
      const supabase = await getSupabaseBrowserClient()
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
    } catch (error) {
      console.error('Failed to refresh session:', error)
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
