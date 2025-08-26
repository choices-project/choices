'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { devLog } from '@/lib/logger';

interface PerformanceUtils {
  performanceMonitor: any
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
        
        // Dynamic imports - only loaded on client side
        const performanceModule = await import('../lib/performance-monitor-simple')
        
        setUtils({
          performanceMonitor: performanceModule.simplePerformanceMonitor
        })
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
