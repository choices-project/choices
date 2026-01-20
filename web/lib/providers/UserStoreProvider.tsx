'use client'

import React, { type ReactNode, useEffect, useRef } from 'react'

import { useUserStore } from '@/lib/stores/userStore'

/**
 * UserStoreProvider
 *
 * This provider exists for organizational purposes and potential future
 * store initialization logic. The actual store (useUserStore) is a Zustand
 * store that can be used directly anywhere with selectors.
 *
 * IMPORTANT: Do NOT pass the entire store state through context, as this
 * would cause all consumers to re-render on any state change.
 * Instead, use useUserStore with selectors directly in components.
 */
export function UserStoreProvider({ children }: { children: ReactNode }) {
  const hasRehydrated = useRef(false)

  useEffect(() => {
    if (hasRehydrated.current) {
      return
    }
    hasRehydrated.current = true
    void useUserStore.persist.rehydrate()
  }, [])

  // Zustand store is available globally
  return <>{children}</>
}

// Deprecated - use useUserStore directly with selectors
export function useUserStoreContext() {
  throw new Error(
    'useUserStoreContext is deprecated. Use useUserStore with selectors directly: ' +
    'const user = useUserStore(state => state.user)'
  )
}
