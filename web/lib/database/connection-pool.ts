/// <reference types="node" />

/**
 * Database Connection Pool Manager
 * 
 * Implements intelligent connection pooling, monitoring, and management
 * for database connections in the Choices platform.
 * 
 * Created: September 15, 2025
 * Agent D - Database Specialist
 */

import type { SupabaseClient } from '@supabase/supabase-js'

import { logger } from '@/lib/utils/logger'
import { getSupabaseServerClient } from '@/utils/supabase/server'

// Connection pool configuration
export type PoolConfig = {
  minConnections: number
  maxConnections: number
  acquireTimeoutMillis: number
  idleTimeoutMillis: number
  maxLifetimeMillis: number
  validationQuery: string
  validationQueryTimeout: number
  leakDetectionThreshold: number
  connectionTimeoutMillis: number
}

// Connection pool metrics
export type PoolMetrics = {
  activeConnections: number
  idleConnections: number
  totalConnections: number
  pendingRequests: number
  connectionWaitTime: number
  connectionAcquisitionTime: number
  connectionLeaks: number
  connectionTimeouts: number
  validationFailures: number
  lastValidationTime: number
}

// Connection wrapper
type ConnectionWrapper = {
  id: string
  connection: SupabaseClient
  createdAt: number
  lastUsed: number
  isActive: boolean
  isIdle: boolean
  validationCount: number
  lastValidation: number
}

// Connection pool statistics
type PoolStats = {
  totalCreated: number
  totalDestroyed: number
  totalAcquired: number
  totalReleased: number
  totalValidated: number
  totalLeaked: number
  totalTimeouts: number
  connectionAcquisitionTime: number
  validationFailures: number
}

/**
 * Database Connection Pool Manager
 * 
 * Manages database connections with intelligent pooling, monitoring, and optimization.
 */
export class ConnectionPoolManager {
  private config: PoolConfig
  private connections: Map<string, ConnectionWrapper> = new Map()
  private idleConnections: Set<string> = new Set()
  private activeConnections: Set<string> = new Set()
  private pendingRequests: Array<{
    resolve: (connectionId: string) => void
    reject: (error: Error) => void
    timestamp: number
  }> = []
  
  private stats: PoolStats = {
    totalCreated: 0,
    totalDestroyed: 0,
    totalAcquired: 0,
    totalReleased: 0,
    totalValidated: 0,
    totalLeaked: 0,
    totalTimeouts: 0,
    connectionAcquisitionTime: 0,
    validationFailures: 0
  }

  private isInitialized: boolean = false
  private cleanupInterval: NodeJS.Timeout | null = null
  private validationInterval: NodeJS.Timeout | null = null
  private leakDetectionInterval: NodeJS.Timeout | null = null

  constructor(config?: Partial<PoolConfig>) {
    this.config = Object.assign({}, {
      minConnections: 2,
      maxConnections: 10,
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 600000, // 10 minutes
      maxLifetimeMillis: 1800000, // 30 minutes
      validationQuery: 'SELECT 1',
      validationQueryTimeout: 5000,
      leakDetectionThreshold: 60000, // 1 minute
      connectionTimeoutMillis: 10000,
    }, config)

    this.initialize()
  }

  /**
   * Initialize connection pool
   */
  private async initialize(): Promise<void> {
    try {
      // Create minimum connections
      await this.createMinimumConnections()
      
      // Start background processes
      this.startCleanupProcess()
      this.startValidationProcess()
      this.startLeakDetection()
      
      this.isInitialized = true
      logger.info('Connection pool initialized', {
        minConnections: this.config.minConnections,
        maxConnections: this.config.maxConnections
      })
    } catch (error) {
      logger.error('Failed to initialize connection pool', error instanceof Error ? error : new Error('Unknown error'))
      throw error
    }
  }

  /**
   * Create minimum required connections
   */
  private async createMinimumConnections(): Promise<void> {
    const promises = []
    
    for (let i = 0; i < this.config.minConnections; i++) {
      promises.push(this.createConnection())
    }
    
    await Promise.all(promises)
  }

  /**
   * Create a new database connection
   */
  private async createConnection(): Promise<string> {
    try {
      const connection = await getSupabaseServerClient()
      const connectionId = this.generateConnectionId()
      const now = Date.now()
      
      const wrapper: ConnectionWrapper = {
        id: connectionId,
        connection,
        createdAt: now,
        lastUsed: now,
        isActive: false,
        isIdle: true,
        validationCount: 0,
        lastValidation: now
      }
      
      this.connections.set(connectionId, wrapper)
      this.idleConnections.add(connectionId)
      this.stats.totalCreated++
      
      logger.debug('Database connection created', { connectionId })
      
      return connectionId
    } catch (error) {
      logger.error('Failed to create database connection', error instanceof Error ? error : new Error('Unknown error'))
      throw error
    }
  }

  /**
   * Acquire a connection from the pool
   */
  async acquireConnection(): Promise<SupabaseClient> {
    if (!this.isInitialized) {
      throw new Error('Connection pool not initialized')
    }

    const startTime = Date.now()
    
    try {
      // Try to get an idle connection first
      let connectionId = this.getIdleConnection()
      
      if (!connectionId) {
        // No idle connections, try to create a new one
        if (this.connections.size < this.config.maxConnections) {
          connectionId = await this.createConnection()
        } else {
          // Pool is full, wait for a connection to become available
          connectionId = await this.waitForConnection()
        }
      }
      
      if (!connectionId) {
        throw new Error('Failed to acquire connection')
      }
      
      // Mark connection as active
      const wrapper = this.connections.get(connectionId)!
      wrapper.isActive = true
      wrapper.isIdle = false
      wrapper.lastUsed = Date.now()
      
      this.idleConnections.delete(connectionId)
      this.activeConnections.add(connectionId)
      this.stats.totalAcquired++
      
      const acquisitionTime = Date.now() - startTime
      this.stats.connectionAcquisitionTime = acquisitionTime
      
      logger.debug('Connection acquired', { 
        connectionId, 
        acquisitionTime,
        activeConnections: this.activeConnections.size,
        idleConnections: this.idleConnections.size
      })
      
      return wrapper.connection
    } catch (error) {
      this.stats.totalTimeouts++
      logger.error('Failed to acquire connection', error instanceof Error ? error : new Error('Unknown error'))
      throw error
    }
  }

  /**
   * Release a connection back to the pool
   */
  async releaseConnection(connection: SupabaseClient): Promise<void> {
    try {
      // Find the connection wrapper
      let connectionId: string | null = null
      
      for (const [id, wrapper] of Array.from(this.connections.entries())) {
        if (wrapper.connection === connection) {
          connectionId = id
          break
        }
      }
      
      if (!connectionId) {
        logger.warn('Attempted to release unknown connection')
        return
      }
      
      const wrapper = this.connections.get(connectionId)!
      
      // Validate connection before returning to pool
      const isValid = await this.validateConnection(wrapper)
      
      if (isValid) {
        // Return to idle pool
        wrapper.isActive = false
        wrapper.isIdle = true
        wrapper.lastUsed = Date.now()
        
        this.activeConnections.delete(connectionId)
        this.idleConnections.add(connectionId)
        this.stats.totalReleased++
        
        logger.debug('Connection released', { 
          connectionId,
          activeConnections: this.activeConnections.size,
          idleConnections: this.idleConnections.size
        })
      } else {
        // Connection is invalid, destroy it
        await this.destroyConnection(connectionId)
        logger.warn('Invalid connection destroyed', { connectionId })
      }
    } catch (error) {
      logger.error('Error releasing connection', error instanceof Error ? error : new Error('Unknown error'))
    }
  }

  /**
   * Get an idle connection
   */
  private getIdleConnection(): string | null {
    if (this.idleConnections.size === 0) {
      return null
    }
    
    const connectionId = this.idleConnections.values().next().value
    if (connectionId === undefined) {
      return null
    }
    
    this.idleConnections.delete(connectionId)
    
    return connectionId
  }

  /**
   * Wait for a connection to become available
   */
  private async waitForConnection(): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.pendingRequests.findIndex(req => req.resolve === resolve)
        if (index !== -1) {
          this.pendingRequests.splice(index, 1)
        }
        reject(new Error('Connection acquisition timeout'))
      }, this.config.acquireTimeoutMillis)
      
      this.pendingRequests.push({
        resolve: (connectionId: string) => {
          clearTimeout(timeout)
          resolve(connectionId)
        },
        reject: (error: Error) => {
          clearTimeout(timeout)
          reject(error)
        },
        timestamp: Date.now()
      })
    })
  }

  /**
   * Validate a connection
   */
  private async validateConnection(wrapper: ConnectionWrapper): Promise<boolean> {
    try {
      const startTime = Date.now()
      
      // Execute validation query
      const { error } = await wrapper.connection
        .from('polls')
        .select('id')
        .limit(1)
      
      const validationTime = Date.now() - startTime
      wrapper.validationCount++
      wrapper.lastValidation = Date.now()
      this.stats.totalValidated++
      
      if (error) {
        logger.warn('Connection validation failed', error, { 
          connectionId: wrapper.id,
          validationTime
        })
        return false
      }
      
      logger.debug('Connection validated', { 
        connectionId: wrapper.id,
        validationTime,
        validationCount: wrapper.validationCount
      })
      
      return true
    } catch (error) {
      this.stats.validationFailures++
      logger.error('Connection validation error', error instanceof Error ? error : new Error('Unknown error'), {
        connectionId: wrapper.id
      })
      return false
    }
  }

  /**
   * Destroy a connection
   */
  private async destroyConnection(connectionId: string): Promise<void> {
    try {
      const wrapper = this.connections.get(connectionId)
      if (!wrapper) {
        return
      }
      
      // Close the connection if it has a close method
      if (wrapper.connection && 'close' in wrapper.connection && typeof wrapper.connection.close === 'function') {
        await (wrapper.connection as { close: () => Promise<void> }).close()
      }
      
      // Remove from all sets
      this.connections.delete(connectionId)
      this.idleConnections.delete(connectionId)
      this.activeConnections.delete(connectionId)
      
      this.stats.totalDestroyed++
      
      logger.debug('Connection destroyed', { connectionId })
    } catch (error) {
      logger.error('Error destroying connection', error instanceof Error ? error : new Error('Unknown error'), {
        connectionId
      })
    }
  }

  /**
   * Start cleanup process for idle connections
   */
  private startCleanupProcess(): void {
    this.cleanupInterval = setInterval(async () => {
      await this.cleanupIdleConnections()
    }, 60000) // Every minute
  }

  /**
   * Start validation process for connections
   */
  private startValidationProcess(): void {
    this.validationInterval = setInterval(async () => {
      await this.validateAllConnections()
    }, 300000) // Every 5 minutes
  }

  /**
   * Start leak detection process
   */
  private startLeakDetection(): void {
    this.leakDetectionInterval = setInterval(() => {
      this.detectConnectionLeaks()
    }, 30000) // Every 30 seconds
  }

  /**
   * Clean up idle connections
   */
  private async cleanupIdleConnections(): Promise<void> {
    const now = Date.now()
    const connectionsToDestroy: string[] = []
    
    for (const connectionId of Array.from(this.idleConnections)) {
      const wrapper = this.connections.get(connectionId)!
      
      // Check if connection is too old
      if (now - wrapper.createdAt > this.config.maxLifetimeMillis) {
        connectionsToDestroy.push(connectionId)
        continue
      }
      
      // Check if connection has been idle too long
      if (now - wrapper.lastUsed > this.config.idleTimeoutMillis) {
        connectionsToDestroy.push(connectionId)
        continue
      }
    }
    
    // Destroy old/idle connections (but keep minimum)
    const toDestroy = connectionsToDestroy.slice(0, Math.max(0, connectionsToDestroy.length - this.config.minConnections))
    
    for (const connectionId of toDestroy) {
      await this.destroyConnection(connectionId)
    }
    
    if (toDestroy.length > 0) {
      logger.info('Cleaned up idle connections', { 
        destroyed: toDestroy.length,
        remaining: this.connections.size
      })
    }
  }

  /**
   * Validate all connections
   */
  private async validateAllConnections(): Promise<void> {
    const validationPromises = []
    
    for (const [connectionId, wrapper] of Array.from(this.connections.entries())) {
      validationPromises.push(
        this.validateConnection(wrapper).then(isValid => {
          if (!isValid) {
            return this.destroyConnection(connectionId)
          }
        })
      )
    }
    
    await Promise.all(validationPromises)
  }

  /**
   * Detect connection leaks
   */
  private detectConnectionLeaks(): void {
    const now = Date.now()
    
    for (const connectionId of Array.from(this.activeConnections)) {
      const wrapper = this.connections.get(connectionId)!
      
      if (now - wrapper.lastUsed > this.config.leakDetectionThreshold) {
        this.stats.totalLeaked++
        logger.warn('Connection leak detected', {
          connectionId,
          lastUsed: wrapper.lastUsed,
          age: now - wrapper.lastUsed
        })
      }
    }
  }

  /**
   * Get connection pool metrics
   */
  getMetrics(): PoolMetrics {
    const now = Date.now()
    const pendingWaitTime = this.pendingRequests.length > 0 
      ? now - Math.min(...this.pendingRequests.map(req => req.timestamp))
      : 0
    
    return {
      activeConnections: this.activeConnections.size,
      idleConnections: this.idleConnections.size,
      totalConnections: this.connections.size,
      pendingRequests: this.pendingRequests.length,
      connectionWaitTime: pendingWaitTime,
      connectionAcquisitionTime: this.stats.connectionAcquisitionTime,
      connectionLeaks: this.stats.totalLeaked,
      connectionTimeouts: this.stats.totalTimeouts,
      validationFailures: this.stats.validationFailures,
      lastValidationTime: now
    }
  }

  /**
   * Get connection pool statistics
   */
  getStats(): PoolStats {
    return { ...this.stats }
  }

  /**
   * Get pool health status
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy'
    issues: string[]
    recommendations: string[]
  } {
    const metrics = this.getMetrics()
    const issues: string[] = []
    const recommendations: string[] = []
    
    // Check connection utilization
    const utilizationRate = (metrics.activeConnections / this.config.maxConnections) * 100
    
    if (utilizationRate > 90) {
      issues.push('High connection utilization')
      recommendations.push('Consider increasing maxConnections')
    }
    
    // Check for connection leaks
    if (metrics.connectionLeaks > 0) {
      issues.push('Connection leaks detected')
      recommendations.push('Review connection release patterns')
    }
    
    // Check for timeouts
    if (metrics.connectionTimeouts > 0) {
      issues.push('Connection acquisition timeouts')
      recommendations.push('Consider increasing acquireTimeoutMillis')
    }
    
    // Check for validation failures
    if (metrics.validationFailures > 0) {
      issues.push('Connection validation failures')
      recommendations.push('Check database connectivity and configuration')
    }
    
    // Check for pending requests
    if (metrics.pendingRequests > 0) {
      issues.push('Pending connection requests')
      recommendations.push('Consider increasing maxConnections or reducing load')
    }
    
    let status: 'healthy' | 'degraded' | 'unhealthy'
    if (issues.length === 0) {
      status = 'healthy'
    } else if (issues.length <= 2) {
      status = 'degraded'
    } else {
      status = 'unhealthy'
    }
    
    return { status, issues, recommendations }
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Shutdown connection pool
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down connection pool')
    
    // Clear intervals
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    if (this.validationInterval) {
      clearInterval(this.validationInterval)
    }
    if (this.leakDetectionInterval) {
      clearInterval(this.leakDetectionInterval)
    }
    
    // Reject pending requests
    for (const request of this.pendingRequests) {
      request.reject(new Error('Connection pool shutdown'))
    }
    this.pendingRequests = []
    
    // Destroy all connections
    const destroyPromises = Array.from(this.connections.keys()).map(connectionId =>
      this.destroyConnection(connectionId)
    )
    
    await Promise.all(destroyPromises)
    
    this.isInitialized = false
    logger.info('Connection pool shutdown complete')
  }
}

// Global connection pool instance
let connectionPool: ConnectionPoolManager | null = null

/**
 * Get or create connection pool instance
 */
export function getConnectionPool(config?: Partial<PoolConfig>): ConnectionPoolManager {
  if (!connectionPool) {
    connectionPool = new ConnectionPoolManager(config)
  }
  return connectionPool
}

/**
 * Shutdown connection pool
 */
export async function shutdownConnectionPool(): Promise<void> {
  if (connectionPool) {
    await connectionPool.shutdown()
    connectionPool = null
  }
}

export default ConnectionPoolManager
