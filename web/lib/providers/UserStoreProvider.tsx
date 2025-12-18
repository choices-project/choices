'use client'

import React, { type ReactNode } from 'react'

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
  // Simply render children - the Zustand store is available globally
  // Consumers should use useUserStore with selectors for performance
  return <>{children}</>
}

// Deprecated - use useUserStore directly with selectors
export function useUserStoreContext() {
  throw new Error(
    'useUserStoreContext is deprecated. Use useUserStore with selectors directly: ' +
    'const user = useUserStore(state => state.user)'
  )
}
