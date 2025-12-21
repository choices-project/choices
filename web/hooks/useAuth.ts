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
  // Since context.loading and context.isLoading are the same value (isLoading is an alias),
  // we can use either one in the dependency array
  return useMemo(
    () => ({
      user: context.user,
      isLoading: context.isLoading, // Use the alias from context
      logout: context.signOut, // Alias for backward compatibility
    }),
    [context.user, context.loading, context.signOut] // Use context.loading since isLoading is just an alias
  )
}
