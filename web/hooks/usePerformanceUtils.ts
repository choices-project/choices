'use client'

import { useState, useEffect } from 'react'

import { devLog } from '@/lib/utils/logger';

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
        
        // Dynamic imports - only loaded on client side
        const performanceModule = await import('../lib/performance-monitor-simple')
        
        setUtils({
          performanceMonitor: new performanceModule.SimplePerformanceMonitor()
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
