import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { devLog } from '@/lib/logger';

interface DemographicData {
  totalUsers: number
  ageDistribution: { range: string; count: number; percentage: number }[]
  geographicSpread: { state: string; count: number; percentage: number }[]
  commonInterests: { interest: string; count: number; percentage: number }[]
  topValues: { value: string; count: number; percentage: number }[]
  educationLevels: { level: string; count: number; percentage: number }[]
  incomeBrackets: { bracket: string; count: number; percentage: number }[]
  urbanRural: { type: string; count: number; percentage: number }[]
  recentPolls: any[]
  recentVotes: any[]
  lastUpdated: string
}

export function useDemographics() {
  const [data, setData] = useState<DemographicData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDemographics = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/demographics')
        
        if (!response.ok) {
          throw new Error('Failed to fetch demographic data')
        }
        
        const demographicData = await response.json()
        setData(demographicData)
      } catch (err) {
        devLog('Error fetching demographics:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchDemographics()
  }, [])

  return { data, loading, error }
}
