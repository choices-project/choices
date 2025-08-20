/**
 * Modular Differential Privacy Implementation
 * 
 * This module provides differential privacy mechanisms with feature flag integration.
 * It preserves the existing functionality while making it more modular and configurable.
 */

import { isFeatureEnabled } from '../../lib/feature-flags'

export interface PrivacyBudget {
  epsilon: number
  delta: number
  sensitivity: number
}

export interface NoisyResult {
  value: number
  noise: number
  privacyBudget: PrivacyBudget
  confidence: number
}

export interface PrivacyConfig {
  epsilon: number // Privacy parameter (lower = more private)
  delta: number // Failure probability
  sensitivity: number // Maximum change in output
  mechanism: 'laplace' | 'gaussian' | 'exponential'
}

export class DifferentialPrivacy {
  private privacyBudget: PrivacyBudget
  private config: PrivacyConfig
  private enabled: boolean

  constructor(config: PrivacyConfig) {
    this.config = config
    this.privacyBudget = {
      epsilon: config.epsilon,
      delta: config.delta,
      sensitivity: config.sensitivity
    }
    this.enabled = isFeatureEnabled('advancedPrivacy')
  }

  // Check if differential privacy is enabled
  isEnabled(): boolean {
    return this.enabled
  }

  // Laplace Mechanism for numerical queries
  laplaceMechanism(value: number): NoisyResult {
    if (!this.enabled) {
      return {
        value,
        noise: 0,
        privacyBudget: { ...this.privacyBudget },
        confidence: 1.0
      }
    }

    const scale = this.privacyBudget.sensitivity / this.privacyBudget.epsilon
    const noise = this.sampleLaplace(0, scale)
    const noisyValue = value + noise

    return {
      value: noisyValue,
      noise: Math.abs(noise),
      privacyBudget: { ...this.privacyBudget },
      confidence: this.calculateConfidence(scale)
    }
  }

  // Gaussian Mechanism for numerical queries
  gaussianMechanism(value: number): NoisyResult {
    if (!this.enabled) {
      return {
        value,
        noise: 0,
        privacyBudget: { ...this.privacyBudget },
        confidence: 1.0
      }
    }

    const sigma = Math.sqrt(2 * Math.log(1.25 / this.privacyBudget.delta)) * 
                  this.privacyBudget.sensitivity / this.privacyBudget.epsilon
    
    const noise = this.sampleGaussian(0, sigma)
    const noisyValue = value + noise

    return {
      value: noisyValue,
      noise: Math.abs(noise),
      privacyBudget: { ...this.privacyBudget },
      confidence: this.calculateConfidence(sigma)
    }
  }

  // Exponential Mechanism for categorical queries
  exponentialMechanism<T>(items: T[], utilityFunction: (item: T) => number): T {
    if (!this.enabled) {
      // Return the item with highest utility when privacy is disabled
      return items.reduce((best: any, current: any) => 
        utilityFunction(current) > utilityFunction(best) ? current : best
      )
    }

    const utilities = items.map(item => utilityFunction(item))
    const maxUtility = Math.max(...utilities)
    
    // Normalize utilities to [0, 1]
    const normalizedUtilities = utilities.map(u => u - maxUtility)
    
    // Calculate probabilities
    const probabilities = normalizedUtilities.map(u => 
      Math.exp(this.privacyBudget.epsilon * u / (2 * this.privacyBudget.sensitivity))
    )
    
    const totalProbability = probabilities.reduce((sum: any, p: any) => sum + p, 0)
    const normalizedProbabilities = probabilities.map(p => p / totalProbability)
    
    // Sample based on probabilities
    return this.weightedRandomChoice(items, normalizedProbabilities)
  }

  // Histogram with differential privacy
  privateHistogram<T>(data: T[], categories: T[]): Map<T, NoisyResult> {
    const histogram = new Map<T, number>()
    
    // Initialize histogram
    categories.forEach(category => histogram.set(category, 0))
    
    // Count occurrences
    data.forEach(item => {
      if (histogram.has(item)) {
        histogram.set(item, histogram.get(item)! + 1)
      }
    })
    
    // Add noise to each count
    const noisyHistogram = new Map<T, NoisyResult>()
    histogram.forEach((count: any, category: any) => {
      noisyHistogram.set(category, this.laplaceMechanism(count))
    })
    
    return noisyHistogram
  }

  // Mean with differential privacy
  privateMean(values: number[]): NoisyResult {
    const mean = values.reduce((sum: any, val: any) => sum + val, 0) / values.length
    return this.gaussianMechanism(mean)
  }

  // Median with differential privacy
  privateMedian(values: number[]): NoisyResult {
    const sorted = [...values].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    return this.laplaceMechanism(median)
  }

  // Variance with differential privacy
  privateVariance(values: number[]): NoisyResult {
    const mean = values.reduce((sum: any, val: any) => sum + val, 0) / values.length
    const variance = values.reduce((sum: any, val: any) => sum + Math.pow(val - mean, 2), 0) / values.length
    return this.gaussianMechanism(variance)
  }

  // Range queries with differential privacy
  privateRangeQuery(values: number[], min: number, max: number): NoisyResult {
    const count = values.filter(val => val >= min && val <= max).length
    return this.laplaceMechanism(count)
  }

  // Top-k queries with differential privacy
  privateTopK<T>(items: T[], k: number, scoreFunction: (item: T) => number): T[] {
    const scoredItems = items.map(item => ({
      item,
      score: scoreFunction(item)
    }))
    
    // Sort by score
    scoredItems.sort((a, b) => b.score - a.score)
    
    // Use exponential mechanism to select top-k
    const topK: T[] = []
    for (let i = 0; i < Math.min(k, scoredItems.length); i++) {
      const remainingItems = scoredItems.slice(i).map(si => si.item)
      const selected = this.exponentialMechanism(remainingItems, item => {
        const scoredItem = scoredItems.find(si => si.item === item)
        return scoredItem ? scoredItem.score : 0
      })
      topK.push(selected)
    }
    
    return topK
  }

  // Composition of privacy budgets
  composePrivacyBudgets(budgets: PrivacyBudget[]): PrivacyBudget {
    const totalEpsilon = budgets.reduce((sum: any, budget: any) => sum + budget.epsilon, 0)
    const totalDelta = budgets.reduce((sum: any, budget: any) => sum + budget.delta, 0)
    const maxSensitivity = Math.max(...budgets.map(budget => budget.sensitivity))
    
    return {
      epsilon: totalEpsilon,
      delta: totalDelta,
      sensitivity: maxSensitivity
    }
  }

  // Adaptive privacy budget management
  adaptivePrivacyBudget(initialBudget: PrivacyBudget, usage: number): PrivacyBudget {
    const remainingEpsilon = Math.max(0, initialBudget.epsilon - usage * 0.1)
    const remainingDelta = Math.max(0, initialBudget.delta - usage * 0.01)
    
    return {
      epsilon: remainingEpsilon,
      delta: remainingDelta,
      sensitivity: initialBudget.sensitivity
    }
  }

  // Privacy-preserving aggregation
  privateAggregation<T>(data: T[], aggregator: (items: T[]) => number): NoisyResult {
    const result = aggregator(data)
    return this.gaussianMechanism(result)
  }

  // Utility functions
  private sampleLaplace(mean: number, scale: number): number {
    const u = Math.random() - 0.5
    return mean - scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u))
  }

  private sampleGaussian(mean: number, sigma: number): number {
    // Box-Muller transform
    const u1 = Math.random()
    const u2 = Math.random()
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    return mean + sigma * z0
  }

  private weightedRandomChoice<T>(items: T[], probabilities: number[]): T {
    const random = Math.random()
    let cumulativeProbability = 0
    
    for (let i = 0; i < items.length; i++) {
      cumulativeProbability += probabilities[i]
      if (random <= cumulativeProbability) {
        return items[i]
      }
    }
    
    return items[items.length - 1]
  }

  private calculateConfidence(scale: number): number {
    // Calculate confidence interval based on noise scale
    return Math.max(0.5, 1 - scale / 100)
  }

  // Privacy budget tracking
  private budgetUsed = 0

  getRemainingBudget(): PrivacyBudget {
    return this.adaptivePrivacyBudget(this.privacyBudget, this.budgetUsed)
  }

  useBudget(amount: number): boolean {
    const remaining = this.getRemainingBudget()
    if (remaining.epsilon >= amount) {
      this.budgetUsed += amount
      return true
    }
    return false
  }

  // Reset privacy budget
  resetBudget(): void {
    this.budgetUsed = 0
  }
}

// Privacy-preserving analytics
export class PrivateAnalytics {
  private dp: DifferentialPrivacy

  constructor(epsilon: number = 1.0, delta: number = 1e-5) {
    this.dp = new DifferentialPrivacy({
      epsilon,
      delta,
      sensitivity: 1,
      mechanism: 'gaussian'
    })
  }

  // Check if private analytics is enabled
  isEnabled(): boolean {
    return this.dp.isEnabled()
  }

  // Private demographic analysis
  privateDemographics(data: any[]): Map<string, NoisyResult> {
    const ageGroups = ['18-25', '26-35', '36-45', '46-55', '56+']
    const educationLevels = ['High School', 'Bachelor', 'Master', 'PhD']
    const incomeBrackets = ['<50k', '50k-100k', '100k-200k', '>200k']
    
    const demographics = new Map<string, NoisyResult>()
    
    // Age distribution
    ageGroups.forEach(group => {
      const count = data.filter(d => d.ageGroup === group).length
      demographics.set(`age_${group}`, this.dp.laplaceMechanism(count))
    })
    
    // Education distribution
    educationLevels.forEach(level => {
      const count = data.filter(d => d.education === level).length
      demographics.set(`education_${level}`, this.dp.laplaceMechanism(count))
    })
    
    // Income distribution
    incomeBrackets.forEach(bracket => {
      const count = data.filter(d => d.income === bracket).length
      demographics.set(`income_${bracket}`, this.dp.laplaceMechanism(count))
    })
    
    return demographics
  }

  // Private voting patterns
  privateVotingPatterns(votes: any[]): Map<string, NoisyResult> {
    const patterns = new Map<string, NoisyResult>()
    
    // Vote distribution by category
    const categories = Array.from(new Set(votes.map(v => v.category)))
    categories.forEach(category => {
      const count = votes.filter(v => v.category === category).length
      patterns.set(`category_${category}`, this.dp.laplaceMechanism(count))
    })
    
    // Vote distribution by time
    const timeSlots = ['morning', 'afternoon', 'evening', 'night']
    timeSlots.forEach(slot => {
      const count = votes.filter(v => v.timeSlot === slot).length
      patterns.set(`time_${slot}`, this.dp.laplaceMechanism(count))
    })
    
    // Participation rate
    const participationRate = votes.length / 1000 // Assuming 1000 total users
    patterns.set('participation_rate', this.dp.gaussianMechanism(participationRate))
    
    return patterns
  }

  // Private trend analysis
  privateTrendAnalysis(data: any[]): Map<string, NoisyResult> {
    const trends = new Map<string, NoisyResult>()
    
    // Growth rate
    const growthRate = this.calculateGrowthRate(data)
    trends.set('growth_rate', this.dp.gaussianMechanism(growthRate))
    
    // Engagement score
    const engagementScore = this.calculateEngagementScore(data)
    trends.set('engagement_score', this.dp.gaussianMechanism(engagementScore))
    
    // Retention rate
    const retentionRate = this.calculateRetentionRate(data)
    trends.set('retention_rate', this.dp.gaussianMechanism(retentionRate))
    
    return trends
  }

  private calculateGrowthRate(data: any[]): number {
    // Simplified growth rate calculation
    return data.length > 0 ? Math.log(data.length) : 0
  }

  private calculateEngagementScore(data: any[]): number {
    // Simplified engagement score
    return data.length > 0 ? data.reduce((sum: any, item: any) => sum + (item.engagement || 0), 0) / data.length : 0
  }

  private calculateRetentionRate(data: any[]): number {
    // Simplified retention rate
    const activeUsers = data.filter(item => item.lastActivity > Date.now() - 7 * 24 * 60 * 60 * 1000).length
    return data.length > 0 ? activeUsers / data.length : 0
  }
}

// Privacy budget manager
export class PrivacyBudgetManager {
  private budgets: Map<string, PrivacyBudget> = new Map()
  private usage: Map<string, number> = new Map()
  private enabled: boolean

  constructor() {
    this.enabled = isFeatureEnabled('advancedPrivacy')
    
    // Initialize default budgets
    this.budgets.set('demographics', { epsilon: 1.0, delta: 1e-5, sensitivity: 1 })
    this.budgets.set('voting', { epsilon: 2.0, delta: 1e-5, sensitivity: 1 })
    this.budgets.set('trends', { epsilon: 1.5, delta: 1e-5, sensitivity: 1 })
    this.budgets.set('analytics', { epsilon: 3.0, delta: 1e-5, sensitivity: 1 })
  }

  // Check if privacy budget management is enabled
  isEnabled(): boolean {
    return this.enabled
  }

  getBudget(category: string): PrivacyBudget | null {
    return this.budgets.get(category) || null
  }

  useBudget(category: string, amount: number): boolean {
    if (!this.enabled) {
      return true // Always allow when privacy is disabled
    }

    const budget = this.budgets.get(category)
    const used = this.usage.get(category) || 0
    
    if (budget && used + amount <= budget.epsilon) {
      this.usage.set(category, used + amount)
      return true
    }
    
    return false
  }

  getRemainingBudget(category: string): number {
    if (!this.enabled) {
      return 100 // Return high value when privacy is disabled
    }

    const budget = this.budgets.get(category)
    const used = this.usage.get(category) || 0
    
    return budget ? Math.max(0, budget.epsilon - used) : 0
  }

  resetBudget(category: string): void {
    this.usage.set(category, 0)
  }

  resetAllBudgets(): void {
    this.usage.clear()
  }
}

// Export singleton instances - lazy initialization
let privacyBudgetManagerInstance: PrivacyBudgetManager | null = null
let privateAnalyticsInstance: PrivateAnalytics | null = null

export const getPrivacyBudgetManager = (): PrivacyBudgetManager => {
  if (!privacyBudgetManagerInstance) {
    privacyBudgetManagerInstance = new PrivacyBudgetManager()
  }
  return privacyBudgetManagerInstance
}

export const getPrivateAnalytics = (): PrivateAnalytics => {
  if (!privateAnalyticsInstance) {
    privateAnalyticsInstance = new PrivateAnalytics()
  }
  return privateAnalyticsInstance
}

// For backward compatibility - only call getters in browser
export const privacyBudgetManager = typeof window !== 'undefined' ? getPrivacyBudgetManager() : null
export const privateAnalytics = typeof window !== 'undefined' ? getPrivateAnalytics() : null
