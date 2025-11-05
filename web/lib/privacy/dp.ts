// ============================================================================
// PHASE 2: DIFFERENTIAL PRIVACY IMPLEMENTATION
// ============================================================================
// Agent A2 - Privacy Specialist
// 
// This module implements differential privacy with Laplace noise generation,
// epsilon budget tracking, and k-anonymity gates for the Ranked Choice
// Democracy Revolution platform.
// 
// Features:
// - Laplace noise generation for differential privacy
// - Epsilon budget tracking and management
// - K-anonymity enforcement with configurable thresholds
// - Privacy-aware data aggregation
// - Budget allocation and monitoring

import { withOptional } from '@/lib/util/objects';
// 
// Created: January 15, 2025
// Status: Phase 2 Implementation
// ============================================================================

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export type EpsilonBudget = {
  total: number;
  used: number;
  remaining: number;
  operations: EpsilonOperation[];
}

export type EpsilonOperation = {
  operation: string;
  epsilon: number;
  timestamp: number;
  context: string;
}

export type EpsilonBudgetStatus = {
  remaining: number;
  used: number;
  operations: EpsilonOperation[];
  utilizationPercent: number;
  canAllocate: (epsilon: number) => boolean;
}

export type PrivacyConfig = {
  defaultEpsilon: number;
  maxEpsilonPerPoll: number;
  kAnonymityThresholds: {
    public: number;
    loggedIn: number;
    internal: number;
  };
  minPercentageThreshold: number;
  noiseScale: number;
}

export type DPCountResult = {
  originalCount: number;
  noisyCount: number;
  epsilon: number;
  confidence: number;
  privacyLoss: number;
}

export type KAnonymityResult = {
  shouldShow: boolean;
  reason: string;
  threshold: number;
  actualCount: number;
  context: 'public' | 'loggedIn' | 'internal';
}

// ============================================================================
// DIFFERENTIAL PRIVACY MANAGER
// ============================================================================

export class DifferentialPrivacyManager {
  private budgets: Map<string, EpsilonBudget> = new Map();
  private config: PrivacyConfig;

  constructor(config: PrivacyConfig = this.getDefaultConfig()) {
    this.config = config;
  }

  private getDefaultConfig(): PrivacyConfig {
    return {
      defaultEpsilon: 0.8,
      maxEpsilonPerPoll: 1.0,
      kAnonymityThresholds: {
        public: 100,
        loggedIn: 50,
        internal: 25
      },
      minPercentageThreshold: 0.01, // 1%
      noiseScale: 1.0
    };
  }

  // ============================================================================
  // LAPLACE NOISE GENERATION
  // ============================================================================

  /**
   * Generate Laplace noise for differential privacy
   * @param epsilon - Privacy parameter (higher = less privacy, more accuracy)
   * @returns Laplace noise value
   */
  laplaceNoise(epsilon: number): number {
    const u = Math.random() - 0.5;
    return -(1 / epsilon) * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
  }

  /**
   * Apply differential privacy to a count
   * @param count - Original count
   * @param epsilon - Privacy parameter
   * @returns Noisy count with privacy protection
   */
  dpCount(count: number, epsilon: number = this.config.defaultEpsilon): DPCountResult {
    const noise = this.laplaceNoise(epsilon);
    const noisyCount = Math.max(0, Math.round(count + noise));
    
    // Calculate confidence interval (approximate)
    const confidence = this.calculateConfidence(epsilon);
    const privacyLoss = this.calculatePrivacyLoss(epsilon);

    return {
      originalCount: count,
      noisyCount,
      epsilon,
      confidence,
      privacyLoss
    };
  }

  /**
   * Apply differential privacy to multiple counts
   * @param counts - Array of original counts
   * @param epsilon - Total epsilon budget to allocate
   * @returns Array of noisy counts
   */
  dpCounts(counts: number[], epsilon: number = this.config.defaultEpsilon): DPCountResult[] {
    const epsilonPerCount = epsilon / counts.length;
    
    return counts.map(count => this.dpCount(count, epsilonPerCount));
  }

  // ============================================================================
  // EPSILON BUDGET MANAGEMENT
  // ============================================================================

  /**
   * Track epsilon usage for a poll
   * @param pollId - Poll identifier
   * @param epsilon - Epsilon amount used
   * @param operation - Description of the operation
   * @param context - Additional context
   */
  trackEpsilonUsage(
    pollId: string, 
    epsilon: number, 
    operation: string, 
    context: string = ''
  ): void {
    const budget = this.getOrCreateBudget(pollId);
    
    // Check if we can allocate this epsilon
    if (budget.remaining < epsilon) {
      throw new Error(`Epsilon budget exceeded for poll ${pollId}. Requested: ${epsilon}, Available: ${budget.remaining}`);
    }

    budget.used += epsilon;
    budget.remaining -= epsilon;
    budget.operations.push({
      operation,
      epsilon,
      timestamp: Date.now(),
      context
    });

    // Log the usage
    console.log(`Epsilon usage tracked: ${operation} used ${epsilon} (${budget.remaining} remaining)`);
  }

  /**
   * Get epsilon budget status for a poll
   * @param pollId - Poll identifier
   * @returns Budget status and utilization
   */
  getBudgetStatus(pollId: string): EpsilonBudgetStatus {
    const budget = this.budgets.get(pollId);
    if (!budget) {
      return {
        remaining: this.config.maxEpsilonPerPoll,
        used: 0,
        operations: [],
        utilizationPercent: 0,
        canAllocate: (epsilon: number) => epsilon <= this.config.maxEpsilonPerPoll
      };
    }

    const utilizationPercent = (budget.used / (budget.used + budget.remaining)) * 100;

    return {
      remaining: budget.remaining,
      used: budget.used,
      operations: budget.operations,
      utilizationPercent,
      canAllocate: (epsilon: number) => epsilon <= budget.remaining
    };
  }

  /**
   * Check if we can allocate epsilon for an operation
   * @param pollId - Poll identifier
   * @param epsilon - Epsilon amount needed
   * @returns Whether allocation is possible
   */
  canAllocateEpsilon(pollId: string, epsilon: number): boolean {
    const status = this.getBudgetStatus(pollId);
    return status.canAllocate(epsilon);
  }

  /**
   * Allocate epsilon budget for an operation
   * @param pollId - Poll identifier
   * @param epsilon - Epsilon amount to allocate
   * @param operation - Operation description
   * @param context - Additional context
   * @returns Whether allocation was successful
   */
  allocateEpsilon(
    pollId: string, 
    epsilon: number, 
    operation: string, 
    context: string = ''
  ): boolean {
    if (!this.canAllocateEpsilon(pollId, epsilon)) {
      return false;
    }

    this.trackEpsilonUsage(pollId, epsilon, operation, context);
    return true;
  }

  // ============================================================================
  // K-ANONYMITY ENFORCEMENT
  // ============================================================================

  /**
   * Check if a breakdown should be shown based on k-anonymity
   * @param groupSize - Size of the group
   * @param context - Display context
   * @param totalCount - Total count for percentage calculation
   * @returns K-anonymity result
   */
  shouldShowBreakdown(
    groupSize: number, 
    context: 'public' | 'loggedIn' | 'internal',
    totalCount: number = 0
  ): KAnonymityResult {
    const threshold = this.config.kAnonymityThresholds[context];
    const minPercentage = this.config.minPercentageThreshold;
    const minCount = Math.ceil(totalCount * minPercentage);
    
    const meetsKAnonymity = groupSize >= threshold;
    const meetsPercentage = totalCount === 0 || groupSize >= minCount;
    
    const shouldShow = meetsKAnonymity && meetsPercentage;
    
    let reason = '';
    if (!meetsKAnonymity) {
      reason = `Group size ${groupSize} below k-anonymity threshold ${threshold}`;
    } else if (!meetsPercentage) {
      reason = `Group size ${groupSize} below minimum percentage threshold ${minCount}`;
    } else {
      reason = 'Meets all privacy requirements';
    }

    return {
      shouldShow,
      reason,
      threshold,
      actualCount: groupSize,
      context
    };
  }

  /**
   * Filter breakdowns based on k-anonymity
   * @param breakdown - Data breakdown to filter
   * @param context - Display context
   * @param totalCount - Total count for percentage calculation
   * @returns Filtered breakdown with privacy protection
   */
  filterBreakdowns(
    breakdown: Record<string, any>, 
    context: 'public' | 'loggedIn' | 'internal',
    totalCount: number = 0
  ): Record<string, any> {
    const filtered: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(breakdown)) {
      if (typeof value === 'object' && value.count !== undefined) {
        const kAnonymityResult = this.shouldShowBreakdown(value.count, context, totalCount);
        
        if (kAnonymityResult.shouldShow) {
          // Apply differential privacy to the count
          const dpResult = this.dpCount(value.count, this.config.defaultEpsilon);
          
          filtered[key] = withOptional(value, {
            count: dpResult.noisyCount,
            originalCount: value.count,
            privacyProtected: true,
            epsilon: dpResult.epsilon,
            confidence: dpResult.confidence
          });
        } else {
          // Suppress the breakdown
          filtered[key] = withOptional(value, {
            count: 0,
            suppressed: true,
            reason: kAnonymityResult.reason
          });
        }
      } else {
        filtered[key] = value;
      }
    }
    
    return filtered;
  }

  // ============================================================================
  // PRIVACY-AWARE AGGREGATION
  // ============================================================================

  /**
   * Create privacy-aware breakdown with DP and k-anonymity
   * @param data - Raw data to aggregate
   * @param pollId - Poll identifier
   * @param context - Display context
   * @param epsilon - Epsilon budget to use
   * @returns Privacy-protected breakdown
   */
  createPrivacyAwareBreakdown(
    data: unknown[],
    pollId: string,
    context: 'public' | 'loggedIn' | 'internal',
    epsilon: number = this.config.defaultEpsilon
  ): Record<string, unknown> {
    // Check if we can allocate epsilon
    if (!this.canAllocateEpsilon(pollId, epsilon)) {
      throw new Error(`Cannot allocate epsilon ${epsilon} for poll ${pollId}`);
    }

    // Create initial breakdown
    const breakdown = this.createInitialBreakdown(data);
    const totalCount = data.length;

    // Apply k-anonymity filtering and differential privacy
    const privacyProtectedBreakdown = this.filterBreakdowns(breakdown, context, totalCount);

    // Track epsilon usage
    this.trackEpsilonUsage(pollId, epsilon, 'privacy-aware-breakdown', context);

    return {
      breakdown: privacyProtectedBreakdown,
      totalCount,
      privacyConfig: {
        context,
        epsilon,
        kAnonymityThreshold: this.config.kAnonymityThresholds[context],
        minPercentageThreshold: this.config.minPercentageThreshold
      },
      metadata: {
        originalDataPoints: data.length,
        suppressedGroups: Object.values(privacyProtectedBreakdown).filter((v): v is { suppressed: boolean } => typeof v === 'object' && v !== null && 'suppressed' in v && Boolean(v.suppressed)).length,
        privacyProtectedGroups: Object.values(privacyProtectedBreakdown).filter((v): v is { privacyProtected: boolean } => typeof v === 'object' && v !== null && 'privacyProtected' in v && Boolean(v.privacyProtected)).length
      }
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private getOrCreateBudget(pollId: string): EpsilonBudget {
    if (!this.budgets.has(pollId)) {
      this.budgets.set(pollId, {
        total: this.config.maxEpsilonPerPoll,
        used: 0,
        remaining: this.config.maxEpsilonPerPoll,
        operations: []
      });
    }
    return this.budgets.get(pollId)!;
  }

  private calculateConfidence(epsilon: number): number {
    // Approximate confidence based on epsilon
    // Higher epsilon = higher confidence (less privacy)
    return Math.min(0.95, 0.5 + (epsilon * 0.3));
  }

  private calculatePrivacyLoss(epsilon: number): number {
    // Privacy loss is directly related to epsilon
    return epsilon;
  }

  private createInitialBreakdown(data: unknown[]): Record<string, unknown> {
    const breakdown: Record<string, unknown> = {};
    
    // Aggregate data by extracting categorical attributes
    // Supports: category, type, demographic fields, geographic data
    data.forEach(item => {
      const itemData = item as any;
      
      // Primary key: use category, type, or demographic field
      const key = itemData.category || 
                  itemData.type || 
                  itemData.age_group || 
                  itemData.state || 
                  itemData.party_affiliation ||
                  itemData.trust_tier ||
                  'uncategorized';
      
      if (!breakdown[key]) {
        breakdown[key] = {
          count: 0,
          items: []
        };
      }
      
      const existing = breakdown[key] as any;
      existing.count = (existing.count || 0) + 1;
      existing.items = [...(existing.items || []), item];
      breakdown[key] = existing;
    });

    return breakdown;
  }

  // ============================================================================
  // BUDGET MANAGEMENT
  // ============================================================================

  /**
   * Reset epsilon budget for a poll
   * @param pollId - Poll identifier
   */
  resetBudget(pollId: string): void {
    this.budgets.delete(pollId);
  }

  /**
   * Get all budget statuses
   * @returns Map of poll IDs to budget statuses
   */
  getAllBudgetStatuses(): Map<string, EpsilonBudgetStatus> {
    const statuses = new Map<string, EpsilonBudgetStatus>();
    
    for (const [pollId, _] of this.budgets) {
      statuses.set(pollId, this.getBudgetStatus(pollId));
    }
    
    return statuses;
  }

  /**
   * Get total epsilon usage across all polls
   * @returns Total usage statistics
   */
  getTotalUsage(): {
    totalPolls: number;
    totalEpsilonUsed: number;
    totalEpsilonAvailable: number;
    averageUtilization: number;
  } {
    let totalUsed = 0;
    let totalAvailable = 0;
    
    for (const [_, budget] of this.budgets) {
      totalUsed += budget.used;
      totalAvailable += budget.total;
    }
    
    const totalPolls = this.budgets.size;
    const averageUtilization = totalAvailable > 0 ? (totalUsed / totalAvailable) * 100 : 0;
    
    return {
      totalPolls,
      totalEpsilonUsed: totalUsed,
      totalEpsilonAvailable: totalAvailable,
      averageUtilization
    };
  }
}

// ============================================================================
// EXPORTED UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate Laplace noise for differential privacy
 * @param epsilon - Privacy parameter
 * @returns Laplace noise value
 */
export function laplaceNoise(epsilon: number): number {
  const u = Math.random() - 0.5;
  return -(1 / epsilon) * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}

/**
 * Apply differential privacy to a count
 * @param count - Original count
 * @param epsilon - Privacy parameter
 * @returns Noisy count
 */
export function dpCount(count: number, epsilon: number = 0.8): number {
  return Math.max(0, Math.round(count + laplaceNoise(epsilon)));
}

/**
 * Check if a group meets k-anonymity requirements
 * @param groupSize - Size of the group
 * @param k - K-anonymity threshold
 * @param minPercentage - Minimum percentage of total
 * @param total - Total count
 * @returns Whether group should be shown
 */
export function showBucket(
  groupSize: number, 
  k: number = 100, 
  minPercentage: number = 0.01, 
  total: number = 0
): boolean {
  const minCount = Math.ceil(total * minPercentage);
  return groupSize >= k && groupSize >= minCount;
}

// ============================================================================
// EXPORTED CLASS
// ============================================================================

export default DifferentialPrivacyManager;
