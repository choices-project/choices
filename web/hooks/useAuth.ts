'use client'

import { useContext, useMemo } from 'react'

import { AuthContext } from '@/contexts/AuthContext'

export function useAuth() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return useMemo(
    () => ({
      user: context.user,
      isLoading: context.loading,
      logout: context.signOut
    }),
    [context.user, context.loading, context.signOut]
  )
}
