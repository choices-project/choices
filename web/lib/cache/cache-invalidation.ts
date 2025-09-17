/**
 * Cache Invalidation System
 * 
 * Implements intelligent cache invalidation strategies including time-based,
 * event-based, and dependency-based invalidation for optimal cache management.
 * 
 * Created: September 15, 2025
 * Agent D - Database Specialist
 */

import { logger } from '../logger'
import { RedisClient } from './redis-client'
import { CacheStrategyManager } from './cache-strategies'
import { withOptional } from '../util/objects'

// Invalidation event types
export type InvalidationEvent = 
  | 'poll_created'
  | 'poll_updated'
  | 'poll_deleted'
  | 'vote_cast'
  | 'vote_updated'
  | 'user_updated'
  | 'user_deleted'
  | 'feedback_submitted'
  | 'error_logged'

// Invalidation rule interface
export interface InvalidationRule {
  id: string
  event: InvalidationEvent
  patterns: string[]
  tags: string[]
  delay?: number // Delay in milliseconds before invalidation
  condition?: (data: any) => boolean // Optional condition function
  priority: number // Higher priority rules execute first
}

// Invalidation result interface
export interface InvalidationResult {
  ruleId: string
  event: InvalidationEvent
  invalidatedKeys: number
  invalidatedTags: number
  executionTime: number
  success: boolean
  error?: string
}

// Cache dependency interface
export interface CacheDependency {
  parentKey: string
  childKeys: string[]
  relationship: 'one-to-many' | 'many-to-one' | 'many-to-many'
}

/**
 * Cache Invalidation Manager
 * 
 * Manages cache invalidation rules, dependencies, and execution.
 */
export class CacheInvalidationManager {
  private redisClient: RedisClient
  private strategyManager: CacheStrategyManager
  private rules: Map<string, InvalidationRule> = new Map()
  private dependencies: Map<string, CacheDependency> = new Map()
  private eventQueue: Array<{ event: InvalidationEvent; data: any; timestamp: number }> = []
  private isProcessing: boolean = false

  constructor(redisClient: RedisClient, strategyManager: CacheStrategyManager) {
    this.redisClient = redisClient
    this.strategyManager = strategyManager
    
    // Initialize default rules
    this.initializeDefaultRules()
    
    // Start event processor
    this.startEventProcessor()
  }

  /**
   * Initialize default invalidation rules
   */
  private initializeDefaultRules(): void {
    // Poll-related rules
    this.addRule({
      id: 'poll_created',
      event: 'poll_created',
      patterns: ['polls:*', 'user_polls:*', 'category_polls:*'],
      tags: ['polls', 'user_polls', 'category_polls'],
      priority: 10
    })

    this.addRule({
      id: 'poll_updated',
      event: 'poll_updated',
      patterns: ['poll:*', 'polls:*', 'user_polls:*'],
      tags: ['polls', 'user_polls'],
      priority: 10
    })

    this.addRule({
      id: 'poll_deleted',
      event: 'poll_deleted',
      patterns: ['poll:*', 'poll_votes:*', 'poll_results:*'],
      tags: ['polls', 'votes', 'results'],
      priority: 10
    })

    // Vote-related rules
    this.addRule({
      id: 'vote_cast',
      event: 'vote_cast',
      patterns: ['poll:*', 'poll_results:*', 'user_votes:*', 'voting_stats:*'],
      tags: ['polls', 'votes', 'results', 'user_votes'],
      priority: 9
    })

    this.addRule({
      id: 'vote_updated',
      event: 'vote_updated',
      patterns: ['poll:*', 'poll_results:*', 'user_votes:*'],
      tags: ['polls', 'votes', 'results'],
      priority: 9
    })

    // User-related rules
    this.addRule({
      id: 'user_updated',
      event: 'user_updated',
      patterns: ['user:*', 'user_polls:*', 'user_votes:*', 'user_profile:*'],
      tags: ['users', 'user_polls', 'user_votes'],
      priority: 8
    })

    this.addRule({
      id: 'user_deleted',
      event: 'user_deleted',
      patterns: ['user:*', 'user_polls:*', 'user_votes:*', 'user_feedback:*'],
      tags: ['users', 'user_polls', 'user_votes', 'user_feedback'],
      priority: 8
    })

    // Feedback-related rules
    this.addRule({
      id: 'feedback_submitted',
      event: 'feedback_submitted',
      patterns: ['feedback:*', 'user_feedback:*'],
      tags: ['feedback', 'user_feedback'],
      priority: 7
    })

    // Error-related rules
    this.addRule({
      id: 'error_logged',
      event: 'error_logged',
      patterns: ['error_logs:*', 'system_stats:*'],
      tags: ['error_logs', 'system_stats'],
      priority: 6
    })
  }

  /**
   * Add invalidation rule
   */
  addRule(rule: InvalidationRule): void {
    this.rules.set(rule.id, rule)
    logger.info('Cache invalidation rule added', { ruleId: rule.id, event: rule.event })
  }

  /**
   * Remove invalidation rule
   */
  removeRule(ruleId: string): boolean {
    const removed = this.rules.delete(ruleId)
    if (removed) {
      logger.info('Cache invalidation rule removed', { ruleId })
    }
    return removed
  }

  /**
   * Add cache dependency
   */
  addDependency(dependency: CacheDependency): void {
    this.dependencies.set(dependency.parentKey, dependency)
    logger.info('Cache dependency added', { 
      parentKey: dependency.parentKey, 
      childCount: dependency.childKeys.length 
    })
  }

  /**
   * Remove cache dependency
   */
  removeDependency(parentKey: string): boolean {
    const removed = this.dependencies.delete(parentKey)
    if (removed) {
      logger.info('Cache dependency removed', { parentKey })
    }
    return removed
  }

  /**
   * Trigger invalidation event
   */
  async triggerEvent(event: InvalidationEvent, data: any): Promise<void> {
    this.eventQueue.push({
      event,
      data,
      timestamp: Date.now()
    })
    
    logger.debug('Cache invalidation event queued', { event, dataKeys: Object.keys(data) })
  }

  /**
   * Process invalidation events
   */
  private async startEventProcessor(): Promise<void> {
    setInterval(async () => {
      if (this.isProcessing || this.eventQueue.length === 0) {
        return
      }

      this.isProcessing = true
      
      try {
        const events = this.eventQueue.splice(0, 10) // Process up to 10 events at a time
        
        for (const { event, data, timestamp } of events) {
          await this.processEvent(event, data, timestamp)
        }
      } catch (error) {
        logger.error('Error processing invalidation events', error instanceof Error ? error : new Error('Unknown error'))
      } finally {
        this.isProcessing = false
      }
    }, 100) // Process every 100ms
  }

  /**
   * Process individual invalidation event
   */
  private async processEvent(event: InvalidationEvent, data: any, timestamp: number): Promise<void> {
    const rules = Array.from(this.rules.values())
      .filter(rule => rule.event === event)
      .sort((a, b) => b.priority - a.priority) // Sort by priority (highest first)

    for (const rule of rules) {
      try {
        // Check condition if provided
        if (rule.condition && !rule.condition(data)) {
          continue
        }

        // Apply delay if specified
        if (rule.delay && Date.now() - timestamp < rule.delay) {
          // Re-queue event for later processing
          setTimeout(() => {
            this.eventQueue.push({ event, data, timestamp })
          }, rule.delay - (Date.now() - timestamp))
          continue
        }

        // Execute invalidation
        const result = await this.executeInvalidation(rule, data)
        
        logger.info('Cache invalidation executed', {
          ruleId: rule.id,
          event,
          result
        })
      } catch (error) {
        logger.error('Error executing invalidation rule', error instanceof Error ? error : new Error('Unknown error'), {
          ruleId: rule.id,
          event
        })
      }
    }
  }

  /**
   * Execute invalidation for a specific rule
   */
  private async executeInvalidation(rule: InvalidationRule, data: any): Promise<InvalidationResult> {
    const startTime = Date.now()
    let invalidatedKeys = 0
    let invalidatedTags = 0
    let success = true
    let error: string | undefined

    try {
      // Invalidate by patterns
      for (const pattern of rule.patterns) {
        const expandedPattern = this.expandPattern(pattern, data)
        const result = await this.redisClient.invalidateByPattern(expandedPattern)
        invalidatedKeys += result
      }

      // Invalidate by tags
      if (rule.tags.length > 0) {
        const expandedTags = this.expandTags(rule.tags, data)
        const result = await this.redisClient.invalidateByTags(expandedTags)
        invalidatedTags += result
      }

      // Handle dependencies
      await this.handleDependencies(rule, data)

    } catch (err) {
      success = false
      error = err instanceof Error ? err.message : 'Unknown error'
    }

    return withOptional({
      ruleId: rule.id,
      event: rule.event,
      invalidatedKeys,
      invalidatedTags,
      executionTime: Date.now() - startTime,
      success
    }, {
      error
    })
  }

  /**
   * Expand pattern with data context
   */
  private expandPattern(pattern: string, data: any): string {
    let expandedPattern = pattern

    // Replace common placeholders
    if (data.poll_id) {
      expandedPattern = expandedPattern.replace('*', data.poll_id)
    }
    if (data.user_id) {
      expandedPattern = expandedPattern.replace('*', data.user_id)
    }
    if (data.category) {
      expandedPattern = expandedPattern.replace('*', data.category)
    }

    return expandedPattern
  }

  /**
   * Expand tags with data context
   */
  private expandTags(tags: string[], data: any): string[] {
    return tags.map(tag => {
      let expandedTag = tag

      if (data.poll_id) {
        expandedTag = expandedTag.replace('*', data.poll_id)
      }
      if (data.user_id) {
        expandedTag = expandedTag.replace('*', data.user_id)
      }
      if (data.category) {
        expandedTag = expandedTag.replace('*', data.category)
      }

      return expandedTag
    })
  }

  /**
   * Handle cache dependencies
   */
  private async handleDependencies(rule: InvalidationRule, data: any): Promise<void> {
    for (const [parentKey, dependency] of Array.from(this.dependencies.entries())) {
      // Check if this rule affects the parent key
      const affectsParent = rule.patterns.some(pattern => 
        this.expandPattern(pattern, data).includes(parentKey)
      ) || rule.tags.some(tag => 
        this.expandTags([tag], data).includes(parentKey)
      )

      if (affectsParent) {
        // Invalidate dependent child keys
        for (const childKey of dependency.childKeys) {
          const expandedChildKey = this.expandPattern(childKey, data)
          await this.redisClient.del(expandedChildKey)
        }

        logger.debug('Cache dependencies invalidated', {
          parentKey,
          childCount: dependency.childKeys.length
        })
      }
    }
  }

  /**
   * Manual invalidation by key
   */
  async invalidateByKey(key: string, reason: string = 'manual'): Promise<boolean> {
    try {
      const result = await this.redisClient.del(key)
      
      logger.info('Manual cache invalidation', { key, reason, success: result })
      
      return result
    } catch (error) {
      logger.error('Manual invalidation failed', error instanceof Error ? error : new Error('Unknown error'), { key, reason })
      return false
    }
  }

  /**
   * Manual invalidation by pattern
   */
  async invalidateByPattern(pattern: string, reason: string = 'manual'): Promise<number> {
    try {
      const result = await this.redisClient.invalidateByPattern(pattern)
      
      logger.info('Manual pattern invalidation', { pattern, reason, invalidated: result })
      
      return result
    } catch (error) {
      logger.error('Manual pattern invalidation failed', error instanceof Error ? error : new Error('Unknown error'), { pattern, reason })
      return 0
    }
  }

  /**
   * Manual invalidation by tags
   */
  async invalidateByTags(tags: string[], reason: string = 'manual'): Promise<number> {
    try {
      const result = await this.redisClient.invalidateByTags(tags)
      
      logger.info('Manual tag invalidation', { tags, reason, invalidated: result })
      
      return result
    } catch (error) {
      logger.error('Manual tag invalidation failed', error instanceof Error ? error : new Error('Unknown error'), { tags, reason })
      return 0
    }
  }

  /**
   * Time-based invalidation
   */
  async scheduleInvalidation(
    key: string,
    delayMs: number,
    reason: string = 'scheduled'
  ): Promise<void> {
    setTimeout(async () => {
      await this.invalidateByKey(key, reason)
    }, delayMs)
    
    logger.info('Scheduled cache invalidation', { key, delayMs, reason })
  }

  /**
   * Bulk invalidation
   */
  async bulkInvalidate(
    keys: string[],
    reason: string = 'bulk'
  ): Promise<{ success: number; failed: number }> {
    let success = 0
    let failed = 0

    for (const key of keys) {
      try {
        const result = await this.redisClient.del(key)
        if (result) {
          success++
        } else {
          failed++
        }
      } catch (error) {
        failed++
        logger.error('Bulk invalidation failed for key', error instanceof Error ? error : new Error('Unknown error'), { key })
      }
    }

    logger.info('Bulk cache invalidation completed', { 
      total: keys.length, 
      success, 
      failed, 
      reason 
    })

    return { success, failed }
  }

  /**
   * Get invalidation statistics
   */
  getStats(): {
    rulesCount: number
    dependenciesCount: number
    queuedEvents: number
    isProcessing: boolean
  } {
    return {
      rulesCount: this.rules.size,
      dependenciesCount: this.dependencies.size,
      queuedEvents: this.eventQueue.length,
      isProcessing: this.isProcessing
    }
  }

  /**
   * Clear all invalidation rules and dependencies
   */
  clear(): void {
    this.rules.clear()
    this.dependencies.clear()
    this.eventQueue = []
    logger.info('Cache invalidation manager cleared')
  }
}

/**
 * Cache Invalidation Factory
 * 
 * Creates and manages cache invalidation instances.
 */
export class CacheInvalidationFactory {
  private static instances: Map<string, CacheInvalidationManager> = new Map()

  static create(
    name: string,
    redisClient: RedisClient,
    strategyManager: CacheStrategyManager
  ): CacheInvalidationManager {
    if (!this.instances.has(name)) {
      const manager = new CacheInvalidationManager(redisClient, strategyManager)
      this.instances.set(name, manager)
    }
    
    return this.instances.get(name)!
  }

  static get(name: string): CacheInvalidationManager | undefined {
    return this.instances.get(name)
  }

  static remove(name: string): boolean {
    return this.instances.delete(name)
  }

  static clear(): void {
    this.instances.clear()
  }
}

export default CacheInvalidationManager
