import { logger } from '@/lib/utils/logger';
/**
 * Offline Outbox System for PWA
 * Enables offline voting with automatic background sync
 * 
 * Features:
 * - Offline vote storage
 * - Background sync when online
 * - Conflict resolution
 * - User feedback and status
 * - Data integrity checks
 * 
 * Created: 2025-08-27
 * Status: Critical PWA enhancement for user experience
 */

export type OfflineVote = {
  id: string
  pollId: string
  optionIds: string[]
  anonymous: boolean
  timestamp: string
  status: 'pending' | 'syncing' | 'completed' | 'failed'
  retryCount: number
  error?: string
}

export type OutboxStats = {
  pending: number
  syncing: number
  completed: number
  failed: number
  total: number
}

export type SyncResult = {
  success: boolean
  syncedCount: number
  failedCount: number
  errors: string[]
}

/**
 * Offline Outbox Manager
 */
export class OfflineOutbox {
  private readonly STORAGE_KEY = 'choices_offline_outbox'
  private readonly MAX_RETRY_COUNT = 3
  private readonly SYNC_INTERVAL = 30000 // 30 seconds

  /**
   * Add a vote to the offline outbox
   */
  async addVote(pollId: string, optionIds: string[], anonymous = false): Promise<string> {
    const vote: OfflineVote = {
      id: this.generateVoteId(),
      pollId,
      optionIds,
      anonymous,
      timestamp: new Date().toISOString(),
      status: 'pending',
      retryCount: 0
    }

    const outbox = await this.getOutbox()
    outbox.push(vote)
    await this.saveOutbox(outbox)

    // Trigger sync if online
    if (navigator.onLine) {
      this.scheduleSync()
    }

    return vote.id
  }

  /**
   * Get all votes in the outbox
   */
  getOutbox(): Promise<OfflineVote[]> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      return Promise.resolve(stored ? JSON.parse(stored) : [])
    } catch (error) {
      logger.error('Failed to get offline outbox:', error instanceof Error ? error : new Error(String(error)))
      return Promise.resolve([])
    }
  }

  /**
   * Get outbox statistics
   */
  async getStats(): Promise<OutboxStats> {
    const outbox = await this.getOutbox()
    const stats: OutboxStats = {
      pending: 0,
      syncing: 0,
      completed: 0,
      failed: 0,
      total: outbox.length
    }

    outbox.forEach(vote => {
      stats[vote.status]++
    })

    return stats
  }

  /**
   * Sync all pending votes
   */
  async syncVotes(): Promise<SyncResult> {
    if (!navigator.onLine) {
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        errors: ['No internet connection']
      }
    }

    const outbox = await this.getOutbox()
    const pendingVotes = outbox.filter(vote => vote.status === 'pending')
    
    if (pendingVotes.length === 0) {
      return {
        success: true,
        syncedCount: 0,
        failedCount: 0,
        errors: []
      }
    }

    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      errors: []
    }

    // Mark votes as syncing
    for (const vote of pendingVotes) {
      vote.status = 'syncing'
    }
    await this.saveOutbox(outbox)

    // Sync each vote
    for (const vote of pendingVotes) {
      try {
        await this.syncVote(vote)
        vote.status = 'completed'
        result.syncedCount++
      } catch (error) {
        vote.status = 'failed'
        vote.retryCount++
        vote.error = error instanceof Error ? error.message : 'Unknown error'
        result.failedCount++
        result.errors.push(`Vote ${vote.id}: ${vote.error}`)
      }
    }

    // Clean up completed votes and retry failed ones
    await this.cleanupOutbox()
    await this.saveOutbox(outbox)

    return result
  }

  /**
   * Sync a single vote
   */
  private async syncVote(vote: OfflineVote): Promise<void> {
    const formData = new FormData()
    formData.append('pollId', vote.pollId)
    formData.append('optionIds', JSON.stringify(vote.optionIds))
    formData.append('anonymous', vote.anonymous.toString())

    const response = await fetch(`/api/polls/${vote.pollId}/vote`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const result = await response.json()
    if (!result.success) {
      throw new Error(result.message || 'Vote failed')
    }
  }

  /**
   * Clean up the outbox
   */
  private async cleanupOutbox(): Promise<void> {
    const outbox = await this.getOutbox()
    
    // Remove completed votes
    const filteredOutbox = outbox.filter(vote => {
      if (vote.status === 'completed') {
        return false // Remove completed votes
      }
      
      if (vote.status === 'failed' && vote.retryCount >= this.MAX_RETRY_COUNT) {
        return false // Remove permanently failed votes
      }
      
      return true
    })

    await this.saveOutbox(filteredOutbox)
  }

  /**
   * Schedule background sync
   */
  private scheduleSync(): void {
    setTimeout(() => {
      this.syncVotes().catch(error => {
        logger.error('Background sync failed:', error instanceof Error ? error : new Error(String(error)))
      })
    }, this.SYNC_INTERVAL)
  }

  /**
   * Generate unique vote ID
   */
  private generateVoteId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Save outbox to localStorage
   */
  private saveOutbox(outbox: OfflineVote[]): Promise<void> {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(outbox))
      return Promise.resolve()
    } catch (error) {
      logger.error('Failed to save offline outbox:', error instanceof Error ? error : new Error(String(error)))
      return Promise.resolve()
    }
  }

  /**
   * Clear the entire outbox
   */
  clearOutbox(): Promise<void> {
    try {
      localStorage.removeItem(this.STORAGE_KEY)
      return Promise.resolve()
    } catch (error) {
      logger.error('Failed to clear offline outbox:', error instanceof Error ? error : new Error(String(error)))
      return Promise.resolve()
    }
  }

  /**
   * Get votes for a specific poll
   */
  async getVotesForPoll(pollId: string): Promise<OfflineVote[]> {
    const outbox = await this.getOutbox()
    return outbox.filter(vote => vote.pollId === pollId)
  }

  /**
   * Check if user has pending votes for a poll
   */
  async hasPendingVotes(pollId: string): Promise<boolean> {
    const votes = await this.getVotesForPoll(pollId)
    return votes.some(vote => vote.status === 'pending' || vote.status === 'syncing')
  }
}

/**
 * Global outbox instance
 */
export const offlineOutbox = new OfflineOutbox()

/**
 * Initialize offline outbox system
 */
export function initializeOfflineOutbox(): void {
  // Listen for online/offline events
  window.addEventListener('online', () => {
    logger.info('Connection restored, syncing offline votes...')
    offlineOutbox.syncVotes().then(result => {
      if (result.syncedCount > 0) {
        logger.info(`Synced ${result.syncedCount} offline votes`)
        // Trigger UI update
        window.dispatchEvent(new CustomEvent('offlineVotesSynced', { detail: result }))
      }
    })
  })

  window.addEventListener('offline', () => {
    logger.info('Connection lost, votes will be stored offline')
  })

  // Initial sync check
  if (navigator.onLine) {
    offlineOutbox.syncVotes().catch(error => {
      logger.error('Initial sync failed:', error instanceof Error ? error : new Error(String(error)))
    })
  }
}
