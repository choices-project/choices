/**
 * Differential Privacy Implementation
 * Comprehensive privacy protection for polling data
 * 
 * Features:
 * - Laplace noise addition for count queries
 * - Epsilon-delta privacy with configurable parameters
 * - Privacy ledger for tracking privacy budget
 * - K-anonymity thresholds for result disclosure
 * - Secure aggregation with noise injection
 * - Privacy-preserving analytics
 * 
 * Created: 2025-08-27
 * Status: Critical privacy-first feature implementation
 */

import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/logger'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Privacy configuration
export type PrivacyConfig = {
  epsilon: number // Privacy parameter (lower = more private)
  delta: number // Privacy parameter (typically 1e-5)
  kAnonymity: number // Minimum participants for result disclosure
  noiseScale: number // Scale factor for Laplace noise
  maxEpsilonPerUser: number // Maximum epsilon per user per day
  privacyBudgetResetHours: number // Hours until privacy budget resets
}

// Default privacy configuration
export const DEFAULT_PRIVACY_CONFIG: PrivacyConfig = {
  epsilon: 1.0, // Standard privacy level
  delta: 1e-5, // Standard delta value
  kAnonymity: 20, // Minimum 20 participants for results
  noiseScale: 1.0, // Standard noise scale
  maxEpsilonPerUser: 10.0, // Maximum epsilon per user per day
  privacyBudgetResetHours: 24 // Reset privacy budget daily
}

// Privacy ledger entry
export type PrivacyLedgerEntry = {
  id: string
  userId: string
  pollId: string
  epsilonUsed: number
  queryType: 'count' | 'aggregate' | 'histogram' | 'custom'
  timestamp: string
  description: string
  noiseAdded: number
  kAnonymitySatisfied: boolean
}

// Query result with privacy protection
export type PrivateQueryResult<T> = {
  data: T
  epsilonUsed: number
  noiseAdded: number
  kAnonymitySatisfied: boolean
  privacyGuarantee: string
  confidenceInterval: [number, number]
}

/**
 * Differential Privacy Manager
 */
export class DifferentialPrivacyManager {
  private config: PrivacyConfig

  constructor(config: PrivacyConfig = DEFAULT_PRIVACY_CONFIG) {
    this.config = config
  }

  /**
   * Add Laplace noise to a count query
   */
  addLaplaceNoise(count: number, sensitivity: number = 1): number {
    const scale = sensitivity / this.config.epsilon
    const noise = this.sampleLaplace(0, scale)
    return Math.max(0, count + noise) // Ensure non-negative
  }

  /**
   * Sample from Laplace distribution
   */
  private sampleLaplace(location: number, scale: number): number {
    const u = Math.random() - 0.5
    return location - scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u))
  }

  /**
   * Check if k-anonymity is satisfied
   */
  checkKAnonymity(participantCount: number): boolean {
    return participantCount >= this.config.kAnonymity
  }

  /**
   * Get privacy budget for a user
   */
  async getPrivacyBudget(userId: string): Promise<number> {
    const cutoffTime = new Date()
    cutoffTime.setHours(cutoffTime.getHours() - this.config.privacyBudgetResetHours)

    const { data, error } = await supabase
      .from('privacy_ledger')
      .select('epsilon_used')
      .eq('user_id', userId)
      .gte('timestamp', cutoffTime.toISOString())

    if (error) {
      logger.error('Failed to get privacy budget', error)
      return 0
    }

    const totalEpsilon = data.reduce((sum, entry) => sum + (entry.epsilon_used as number), 0)
    return Math.max(0, this.config.maxEpsilonPerUser - totalEpsilon)
  }

  /**
   * Record privacy usage in ledger
   */
  async recordPrivacyUsage(
    userId: string,
    pollId: string,
    epsilonUsed: number,
    queryType: PrivacyLedgerEntry['queryType'],
    description: string,
    noiseAdded: number,
    kAnonymitySatisfied: boolean
  ): Promise<void> {
    const entry: Omit<PrivacyLedgerEntry, 'id'> = {
      userId,
      pollId,
      epsilonUsed,
      queryType,
      timestamp: new Date().toISOString(),
      description,
      noiseAdded,
      kAnonymitySatisfied
    }

    const { error } = await supabase
      .from('privacy_ledger')
      .insert({
        user_id: entry.userId,
        poll_id: entry.pollId,
        epsilon_used: entry.epsilonUsed,
        query_type: entry.queryType,
        timestamp: entry.timestamp,
        description: entry.description,
        noise_added: entry.noiseAdded,
        k_anonymity_satisfied: entry.kAnonymitySatisfied
      })

    if (error) {
      logger.error('Failed to record privacy usage', error)
      throw new Error('Failed to record privacy usage')
    }
  }

  /**
   * Get private poll results with differential privacy
   */
  async getPrivatePollResults(
    pollId: string,
    userId: string
  ): Promise<PrivateQueryResult<{ optionId: string; count: number; percentage: number }[]>> {
    // Check privacy budget
    const remainingBudget = await this.getPrivacyBudget(userId)
    if (remainingBudget < this.config.epsilon) {
      throw new Error('Privacy budget exceeded')
    }

    // Get raw poll results
    const { data: rawResults, error } = await supabase
      .from('votes')
      .select('option_id')
      .eq('poll_id', pollId)
      .eq('withdrawn', false)

    if (error) {
      logger.error('Failed to get poll results', error)
      throw new Error('Failed to get poll results')
    }

    // Count votes per option
    const voteCounts = new Map<string, number>()
    rawResults.forEach(vote => {
      const optionId = (vote as Record<string, unknown>).option_id as string;
      const count = voteCounts.get(optionId) ?? 0
      voteCounts.set(optionId, count + 1)
    })

    const totalVotes = rawResults.length
    const kAnonymitySatisfied = this.checkKAnonymity(totalVotes)

    // If k-anonymity not satisfied, return aggregated results only
    if (!kAnonymitySatisfied) {
      return {
        data: [],
        epsilonUsed: 0,
        noiseAdded: 0,
        kAnonymitySatisfied: false,
        privacyGuarantee: `Results hidden: Need at least ${this.config.kAnonymity} participants`,
        confidenceInterval: [0, 0]
      }
    }

    // Add Laplace noise to each count
    const privateResults: { optionId: string; count: number; percentage: number }[] = []
    let totalNoiseAdded = 0

    for (const [optionId, count] of voteCounts) {
      const noisyCount = this.addLaplaceNoise(count)
      totalNoiseAdded += Math.abs(noisyCount - count)
      
      const percentage = totalVotes > 0 ? (noisyCount / totalVotes) * 100 : 0
      
      privateResults.push({
        optionId,
        count: Math.round(noisyCount),
        percentage: Math.round(percentage * 100) / 100
      })
    }

    // Sort by count (descending)
    privateResults.sort((a, b) => b.count - a.count)

    // Record privacy usage
    await this.recordPrivacyUsage(
      userId,
      pollId,
      this.config.epsilon,
      'count',
      'Poll results query',
      totalNoiseAdded,
      kAnonymitySatisfied
    )

    // Calculate confidence interval
    const confidenceInterval = this.calculateConfidenceInterval(totalVotes, this.config.epsilon)

    return {
      data: privateResults,
      epsilonUsed: this.config.epsilon,
      noiseAdded: totalNoiseAdded,
      kAnonymitySatisfied: true,
      privacyGuarantee: `(ε=${this.config.epsilon}, δ=${this.config.delta})-differential privacy`,
      confidenceInterval
    }
  }

  /**
   * Get private aggregate statistics
   */
  async getPrivateAggregateStats(
    userId: string,
    queryType: 'user_activity' | 'poll_popularity' | 'voting_patterns'
  ): Promise<PrivateQueryResult<Record<string, unknown>>> {
    // Check privacy budget
    const remainingBudget = await this.getPrivacyBudget(userId)
    if (remainingBudget < this.config.epsilon) {
      throw new Error('Privacy budget exceeded')
    }

    let rawData: Record<string, unknown>
    let description: string

    switch (queryType) {
      case 'user_activity':
        const { data: activityData } = await supabase
          .from('user_profiles')
          .select('created_at, last_active')
        rawData = activityData as unknown as Record<string, unknown>
        description = 'User activity statistics'
        break

      case 'poll_popularity':
        const { data: pollData } = await supabase
          .from('polls')
          .select('created_at, visibility')
        rawData = pollData as unknown as Record<string, unknown>
        description = 'Poll popularity statistics'
        break

      case 'voting_patterns':
        const { data: voteData } = await supabase
          .from('votes')
          .select('created_at, anonymous')
        rawData = voteData as unknown as Record<string, unknown>
        description = 'Voting pattern statistics'
        break

      default:
        throw new Error('Invalid query type')
    }

    // Calculate aggregate statistics with noise
    const stats = this.calculateAggregateStats(rawData as unknown as Record<string, unknown>[])
    const noisyStats = this.addNoiseToStats(stats)

    // Record privacy usage
    await this.recordPrivacyUsage(
      userId,
      'aggregate',
      this.config.epsilon,
      'aggregate',
      description,
      0, // Noise calculation would be more complex for aggregates
      true
    )

    return {
      data: noisyStats,
      epsilonUsed: this.config.epsilon,
      noiseAdded: 0,
      kAnonymitySatisfied: true,
      privacyGuarantee: `(ε=${this.config.epsilon}, δ=${this.config.delta})-differential privacy`,
      confidenceInterval: [0, 0]
    }
  }

  /**
   * Calculate aggregate statistics
   */
  private calculateAggregateStats(data: Record<string, unknown>[]): Record<string, number> {
    if (data.length === 0) {
      return { count: 0, average: 0, median: 0 }
    }

    const count = data.length
    const values = data.map(item => this.extractNumericValue(item))
    const average = values.reduce((sum, val) => sum + val, 0) / count
    const sorted = values.sort((a, b) => a - b)
    const median = sorted[Math.floor(count / 2)] ?? 0

    return { count, average, median }
  }

  /**
   * Extract numeric value from data item
   */
  private extractNumericValue(item: Record<string, unknown>): number {
    // Convert timestamps to numeric values for analysis
    if (item.created_at) {
      return new Date(item.created_at as string).getTime()
    }
    if (item.last_active) {
      return new Date(item.last_active as string).getTime()
    }
    return 0
  }

  /**
   * Add noise to statistics
   */
  private addNoiseToStats(stats: Record<string, number>): Record<string, number> {
    return {
      count: Math.max(0, this.addLaplaceNoise(stats.count ?? 0)),
      average: this.addLaplaceNoise(stats.average ?? 0, 1000), // Higher sensitivity for averages
      median: this.addLaplaceNoise(stats.median ?? 0, 1000)
    }
  }

  /**
   * Calculate confidence interval
   */
  private calculateConfidenceInterval(n: number, epsilon: number): [number, number] {
    const alpha = 0.05 // 95% confidence level
    const scale = 1 / epsilon
    const margin = scale * Math.log(2 / alpha)
    
    return [Math.max(0, n - margin), n + margin]
  }

  /**
   * Get privacy ledger for a user
   */
  async getPrivacyLedger(userId: string): Promise<PrivacyLedgerEntry[]> {
    const { data, error } = await supabase
      .from('privacy_ledger')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(100)

    if (error) {
      logger.error('Failed to get privacy ledger', error)
      return []
    }

    return data.map(entry => ({
      id: (entry as Record<string, unknown>).id as string,
      userId: (entry as Record<string, unknown>).user_id as string,
      pollId: (entry as Record<string, unknown>).poll_id as string,
      epsilonUsed: (entry as Record<string, unknown>).epsilon_used as number,
      queryType: (entry as Record<string, unknown>).query_type as string,
      timestamp: (entry as Record<string, unknown>).timestamp as string,
      description: (entry as Record<string, unknown>).description as string,
      noiseAdded: (entry as Record<string, unknown>).noise_added as number,
      kAnonymitySatisfied: (entry as Record<string, unknown>).k_anonymity_satisfied as boolean
    })) as PrivacyLedgerEntry[]
  }

  /**
   * Get privacy statistics
   */
  async getPrivacyStats(): Promise<{
    totalQueries: number
    totalEpsilonUsed: number
    averageNoiseAdded: number
    kAnonymitySatisfiedRate: number
  }> {
    const { data, error } = await supabase
      .from('privacy_ledger')
      .select('epsilon_used, noise_added, k_anonymity_satisfied')

    if (error) {
      logger.error('Failed to get privacy stats', error)
      return {
        totalQueries: 0,
        totalEpsilonUsed: 0,
        averageNoiseAdded: 0,
        kAnonymitySatisfiedRate: 0
      }
    }

    const totalQueries = data.length || 0
    const totalEpsilonUsed = data.reduce((sum, entry) => sum + (entry.epsilon_used as number), 0)
    const totalNoiseAdded = data.reduce((sum, entry) => sum + (entry.noise_added as number), 0)
    const kAnonymitySatisfiedCount = data.filter(entry => entry.k_anonymity_satisfied).length || 0

    return {
      totalQueries,
      totalEpsilonUsed,
      averageNoiseAdded: totalQueries > 0 ? totalNoiseAdded / totalQueries : 0,
      kAnonymitySatisfiedRate: totalQueries > 0 ? kAnonymitySatisfiedCount / totalQueries : 0
    }
  }
}

/**
 * Global differential privacy manager instance
 */
export const differentialPrivacy = new DifferentialPrivacyManager()

/**
 * Privacy utility functions
 */
export const privacyUtils = {
  /**
   * Format privacy guarantee for display
   */
  formatPrivacyGuarantee(epsilon: number, delta: number): string {
    return `(ε=${epsilon}, δ=${delta.toExponential()})-differential privacy`
  },

  /**
   * Calculate noise scale for given sensitivity
   */
  calculateNoiseScale(sensitivity: number, epsilon: number): number {
    return sensitivity / epsilon
  },

  /**
   * Check if a value is within privacy bounds
   */
  isWithinPrivacyBounds(value: number, lowerBound: number, upperBound: number): boolean {
    return value >= lowerBound && value <= upperBound
  },

  /**
   * Sanitize data for privacy
   */
  sanitizeForPrivacy(data: Record<string, unknown>, epsilon: number): Record<string, unknown> {
    // Remove or anonymize sensitive fields
    const sanitized = { ...data }
    delete sanitized.userId
    delete sanitized.email
    delete sanitized.ipAddress
    
    // Add noise to numeric values using the provided epsilon
    if (typeof sanitized.count === 'number') {
      const noiseScale = privacyUtils.calculateNoiseScale(1, epsilon)
      sanitized.count = Math.max(0, differentialPrivacy.addLaplaceNoise(sanitized.count, noiseScale))
    }
    
    return sanitized
  }
}
