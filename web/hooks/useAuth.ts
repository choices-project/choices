'use client'

import { useContext, useMemo } from 'react'

import { AuthContext } from '@/contexts/AuthContext'

export function useAuth() {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  // Return a stable object - context is already memoized in AuthProvider
  // We create an object with the expected API (logout alias for signOut, isLoading alias for loading)
  // Use useMemo to ensure the object identity is stable based on the underlying values
  return useMemo(
    () => ({
      user: context.user,
      isLoading: context.isLoading,
      logout: context.signOut, // Alias for backward compatibility
    }),
    [context.user, context.isLoading, context.signOut]
  )
}
