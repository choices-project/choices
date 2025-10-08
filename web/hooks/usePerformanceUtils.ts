'use client'

import { useState, useEffect } from 'react'
import { devLog } from '@/lib/logger';

type PerformanceUtils = {
  performanceMonitor: unknown
}

export function usePerformanceUtils() {
  const [utils, setUtils] = useState<PerformanceUtils | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadPerformanceUtils = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Performance utilities - using fallback implementation
        setUtils({
          performanceMonitor: {
            startTiming: (name: string) => console.time(name),
            endTiming: (name: string) => console.timeEnd(name),
            measure: (name: string, fn: () => void) => {
              console.time(name)
              const result = fn()
              console.timeEnd(name)
              return result
            }
          }
        } as any)
      } catch (err) {
        devLog('Error loading performance utils:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadPerformanceUtils()
  }, [])

  return { utils, loading, error }
}
