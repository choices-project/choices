'use client'

import type { ReactNode } from 'react';
import { createContext, useContext } from 'react'
import type { AuthState, AuthActions } from './useSupabaseAuth';
import { useSupabaseAuth } from './useSupabaseAuth'

type AuthContextType = {} & AuthState & AuthActions

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useSupabaseAuth()
  
  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
