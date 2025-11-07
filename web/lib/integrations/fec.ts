/**
 * FEC (Federal Election Commission) API Integration
 * 
 * Provides integration with the FEC API for candidate verification,
 * filing status checks, and official candidate data retrieval.
 * 
 * API Documentation: https://api.open.fec.gov/developers/
 * 
 * @created 2025-01-30
 */

import logger from '@/lib/utils/logger'

import type { FECCommittee } from './fec/client'

export type FECCandidate = {
  candidate_id: string
  name: string
  party_full: string | null
  office: 'P' | 'S' | 'H' // President, Senate, House
  office_full: string
  state: string | null
  district: string | null
  election_years: number[]
  candidate_status: 'C' | 'F' | 'N' | 'P' // Candidate, Future, Not a candidate, Prior
  cycles: number[]
}

export type FECSearchResult = {
  results: FECCandidate[]
  pagination: {
    page: number
    per_page: number
    count: number
    pages: number
  }
}

export type FECConfig = {
  apiKey: string
  baseUrl?: string
}

/**
 * FEC API Client
 * Handles requests to the FEC API with rate limiting and error handling
 */
export class FECClient {
  private apiKey: string
  private baseUrl: string
  private rateLimitDelay = 1000 // 1 second between requests (FEC limit: 1 req/sec)

  constructor(config: FECConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl ?? 'https://api.open.fec.gov/v1'
  }

  /**
   * Verify candidate filing by FEC ID
   */
  async verifyCandidate(fecId: string): Promise<FECCandidate | null> {
    try {
      const response: any = await this.request(`/candidates/`, {
        candidate_id: fecId,
        per_page: 1
      })

      if (response.results && response.results.length > 0) {
        return response.results[0]
      }

      return null
    } catch (error) {
      logger.error('FEC API error:', error)
      // Error logged, return null to indicate verification failure
      return null
    }
  }

  /**
   * Search candidates by name and office
   */
  async searchCandidates(params: {
    name?: string
    office?: 'P' | 'S' | 'H'
    state?: string
    district?: string
    election_year?: number
  }): Promise<FECCandidate[]> {
    try {
      const response: any = await this.request(`/candidates/`, {
        ...params,
        per_page: 20
      })

      return response.results ?? []
    } catch (error) {
      logger.error('FEC API search error:', error)
      // Error logged, return empty array
      return []
    }
  }

  /**
   * Get candidate committee information
   */
  async getCandidateCommittees(candidateId: string): Promise<FECCommittee[]> {
    try {
      const response = await this.request(`/candidates/${candidateId}/committees/`, {
        per_page: 20
      }) as { results?: FECCommittee[] }

      return response.results ?? []
    } catch (error) {
      logger.error('FEC API committees error:', error)
      // Error logged, return empty array
      return []
    }
  }

  /**
   * Check if candidate is active (filed for current cycle)
   */
  async isCandidateActive(fecId: string, electionYear?: number): Promise<boolean> {
    const candidate = await this.verifyCandidate(fecId)
    if (!candidate) return false

    const currentYear = electionYear ?? new Date().getFullYear()
    return candidate.election_years.includes(currentYear) &&
           candidate.candidate_status === 'C'
  }

  /**
   * Make request to FEC API
   */
  private async request(endpoint: string, params: Record<string, string | number | undefined>): Promise<unknown> {
    // Rate limiting
    await this.delay(this.rateLimitDelay)

    const url = new URL(`${this.baseUrl}${endpoint}`)
    url.searchParams.set('api_key', this.apiKey)
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value))
      }
    })

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`FEC API error: ${response.status} ${response.statusText}`)
    }

    return response.json()
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Create FEC client instance
 */
export function createFECClient(apiKey?: string): FECClient {
  const key = apiKey ?? process.env.FEC_API_KEY ?? ''
  
  if (!key) {
    logger.warn('FEC_API_KEY not configured. FEC features will be limited.')
  }

  return new FECClient({
    apiKey: key,
    baseUrl: 'https://api.open.fec.gov/v1'
  })
}

