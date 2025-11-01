'use client'

import React, { createContext, useContext, type ReactNode } from 'react'

import { useUserStore } from '@/lib/stores/userStore'

// Create context for user store
const UserStoreContext = createContext<ReturnType<typeof useUserStore> | null>(null)

// Provider component
export function UserStoreProvider({ children }: { children: ReactNode }) {
  const userStore = useUserStore()
  
  return (
    <UserStoreContext.Provider value={userStore}>
      {children}
    </UserStoreContext.Provider>
  )
}

// Hook to use the user store context
export function useUserStoreContext() {
  const context = useContext(UserStoreContext)
  if (!context) {
    throw new Error('useUserStoreContext must be used within a UserStoreProvider')
  }
  return context
}
