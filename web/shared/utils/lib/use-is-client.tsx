/**
 * Client-Only React Hook
 * 
 * This file provides React hooks for client-side detection.
 * It should ONLY be used in client components (with 'use client').
 */

'use client';

import { useEffect, useState } from 'react';

/**
 * Hook to detect if we're running on the client side
 * Returns false during SSR, true after hydration
 */
export function useIsClient(): boolean {
  const [isClient, set] = useState(false);
  useEffect(() => set(true), []);
  return isClient;
}

/**
 * Hook to safely access browser APIs only after client-side hydration
 */
export function useClientOnly<T>(fn: () => T, fallback?: T): T | undefined {
  const isClient = useIsClient();
  if (!isClient) return fallback;
  try {
    return fn();
  } catch (error) {
    console.warn('Client-only hook failed:', error);
    return fallback;
  }
}
