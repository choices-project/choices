'use client'

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { devLog } from '@/lib/logger';

interface TestingUtils {
  testingSuite: any
  comprehensiveTestingRunner: any
  crossPlatformTesting: any
  mobileCompatibilityTesting: any
}

export function useTestingUtils() {
  const [utils, setUtils] = useState<TestingUtils | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadTestingUtils = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Dynamic imports - only loaded on client side
        const [testingSuiteModule, comprehensiveTestingModule, crossPlatformModule, mobileModule] = await Promise.all([
          import('../lib/testing-suite'),
          import('../lib/comprehensive-testing-runner'),
          import('../lib/cross-platform-testing'),
          import('../lib/mobile-compatibility-testing')
        ])
        
        setUtils({
          testingSuite: testingSuiteModule.testingSuite,
          comprehensiveTestingRunner: comprehensiveTestingModule.comprehensiveTestingRunner,
          crossPlatformTesting: crossPlatformModule.crossPlatformTesting,
          mobileCompatibilityTesting: mobileModule.mobileCompatibilityTesting
        })
      } catch (err) {
        devLog('Error loading testing utils:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadTestingUtils()
  }, [])

  return { utils, loading, error }
}
