import { useState, useEffect } from 'react'

import { devLog } from '@/lib/utils/logger';

interface DemographicData {
  totalUsers: number
  recentPolls: Array<{
    poll_id: string
    total_votes: number
    participation_rate: number
    created_at: string
  }>
  recentVotes: Array<{
    poll_id: string
    voted_at: string
  }>
  demographics: {
    ageGroups: Array<{ name: string; value: number }>
    locations: Array<{ name: string; value: number }>
    interests: Array<{ name: string; value: number }>
  }
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
        devLog('Error fetching demographics:', { error: err instanceof Error ? err.message : String(err) })
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchDemographics()
  }, [])

  return { data, loading, error }
}
