/**
 * Realtime Update Manager
 * 
 * Implements scalable realtime architecture with diff-based updates and adaptive throttling
 * for the ranked choice democracy platform.
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

export interface RealtimeConfig {
  throttleMs: number;
  maxDiffsInMemory: number;
  batchSize: number;
  adaptiveThrottling: boolean;
}

export interface PollUpdate {
  pollId: string;
  type: 'vote' | 'elimination' | 'round_complete' | 'poll_close';
  data: any;
  timestamp: number;
}

export interface PollDiff {
  pollId: string;
  round: number;
  delta: {
    eliminated?: string[];
    newCounts?: Record<string, number>;
    winner?: string;
    totalBallots?: number;
  };
  timestamp: number;
  checksum: string;
}

export interface UpdateQueue {
  updates: PollUpdate[];
  lastProcessed: number;
  isThrottled: boolean;
  throttleUntil: number;
}

export interface InitialState {
  snapshot: any;
  diffs: PollDiff[];
  lastUpdate: number;
  checksum: string;
}

export class RealtimeUpdateManager {
  private config: RealtimeConfig;
  private updateQueues: Map<string, UpdateQueue> = new Map();
  private supabaseClient: any;
  private diffStorage: Map<string, PollDiff[]> = new Map();
  private snapshots: Map<string, any> = new Map();
  private rateTracking: Map<string, number[]> = new Map();

  constructor(config?: Partial<RealtimeConfig>) {
    this.config = {
      throttleMs: 1000, // 1 update per second
      maxDiffsInMemory: 100,
      batchSize: 10,
      adaptiveThrottling: true,
      ...config
    };

    // Initialize Supabase client
    this.supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }

  /**
   * Publish an update with adaptive throttling
   */
  publishUpdate(pollId: string, update: PollUpdate): void {
    const queue = this.getOrCreateQueue(pollId);
    queue.updates.push(update);
    
    // Track rate for adaptive throttling
    this.trackRate(pollId);
    
    // Calculate adaptive throttle based on current traffic
    const currentRate = this.calculateCurrentRate(pollId);
    const throttleMs = this.calculateAdaptiveThrottle(currentRate);
    
    if (!queue.isThrottled || Date.now() > queue.throttleUntil) {
      this.processQueue(pollId);
      queue.setThrottled(throttleMs);
    }
  }

  /**
   * Calculate adaptive throttle based on traffic patterns
   */
  private calculateAdaptiveThrottle(currentRate: number): number {
    if (!this.config.adaptiveThrottling) {
      return this.config.throttleMs;
    }

    if (currentRate >= 200) return 250; // 4 updates/sec for high traffic
    if (currentRate >= 100) return 500; // 2 updates/sec for medium traffic
    if (currentRate < 10) return 2000; // 0.5 updates/sec for low traffic
    return 1000; // 1 update/sec default
  }

  /**
   * Process queued updates for a poll
   */
  private processQueue(pollId: string): void {
    const queue = this.updateQueues.get(pollId);
    if (!queue || queue.updates.length === 0) return;
    
    // Batch updates for efficiency
    const batchedUpdate = this.createBatchedUpdate(queue.updates);
    if (batchedUpdate) {
      this.broadcastDiff(pollId, batchedUpdate);
      this.storeDiff(pollId, batchedUpdate);
    }
    
    // Clear processed updates
    queue.updates = [];
    queue.lastProcessed = Date.now();
  }

  /**
   * Create a batched diff from multiple updates
   */
  private createBatchedUpdate(updates: PollUpdate[]): PollDiff | null {
    if (updates.length === 0) return null;

    const latestUpdate = updates[updates.length - 1];
    const delta: PollDiff['delta'] = {};

    // Aggregate changes from all updates
    for (const update of updates) {
      switch (update.type) {
        case 'vote':
          delta.totalBallots = (delta.totalBallots || 0) + 1;
          break;
        case 'elimination':
          delta.eliminated = [...(delta.eliminated || []), ...update.data.eliminated];
          break;
        case 'round_complete':
          delta.newCounts = { ...delta.newCounts, ...update.data.counts };
          break;
        case 'poll_close':
          delta.winner = update.data.winner;
          break;
      }
    }

    return {
      pollId: latestUpdate.pollId,
      round: latestUpdate.data.round || 0,
      delta,
      timestamp: Date.now(),
      checksum: this.calculateDiffChecksum({ delta, round: latestUpdate.data.round || 0 })
    };
  }

  /**
   * Broadcast diff to all connected clients
   */
  private broadcastDiff(pollId: string, diff: PollDiff): void {
    const channel = `poll:${pollId}`;
    const message = {
      type: 'rcv:diff',
      pollId: diff.pollId,
      round: diff.round,
      delta: diff.delta,
      timestamp: diff.timestamp,
      checksum: diff.checksum
    };
    
    try {
      // Use Supabase Realtime for fanout
      this.supabaseClient.channel(channel).send(message);
      logger.info(`Broadcasted diff for poll ${pollId}`, { round: diff.round, checksum: diff.checksum });
    } catch (error) {
      logger.error(`Failed to broadcast diff for poll ${pollId}`, { error: error instanceof Error ? error.message : String(error) });
    }
  }

  /**
   * Store diff for historical access
   */
  private storeDiff(pollId: string, diff: PollDiff): void {
    const diffs = this.diffStorage.get(pollId) || [];
    diffs.push(diff);
    
    // Maintain max diffs in memory
    if (diffs.length > this.config.maxDiffsInMemory) {
      diffs.shift();
    }
    
    this.diffStorage.set(pollId, diffs);
  }

  /**
   * Get initial state for new connections (snapshot + recent diffs)
   */
  getInitialState(pollId: string): InitialState {
    const snapshot = this.getCurrentSnapshot(pollId);
    const recentDiffs = this.getRecentDiffs(pollId, this.config.maxDiffsInMemory);
    
    return {
      snapshot,
      diffs: recentDiffs,
      lastUpdate: Date.now(),
      checksum: this.calculateStateChecksum(snapshot, recentDiffs)
    };
  }

  /**
   * Get current snapshot for a poll
   */
  private getCurrentSnapshot(pollId: string): any {
    return this.snapshots.get(pollId) || {
      pollId,
      status: 'active',
      totalVotes: 0,
      rounds: [],
      lastUpdate: Date.now()
    };
  }

  /**
   * Get recent diffs for a poll
   */
  private getRecentDiffs(pollId: string, maxCount: number): PollDiff[] {
    const diffs = this.diffStorage.get(pollId) || [];
    return diffs.slice(-maxCount);
  }

  /**
   * Track rate for adaptive throttling
   */
  private trackRate(pollId: string): void {
    const now = Date.now();
    const rates = this.rateTracking.get(pollId) || [];
    
    // Keep only last 60 seconds of data
    const cutoff = now - 60000;
    const recentRates = rates.filter(timestamp => timestamp > cutoff);
    recentRates.push(now);
    
    this.rateTracking.set(pollId, recentRates);
  }

  /**
   * Calculate current rate (updates per minute)
   */
  private calculateCurrentRate(pollId: string): number {
    const rates = this.rateTracking.get(pollId) || [];
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    return rates.filter(timestamp => timestamp > oneMinuteAgo).length;
  }

  /**
   * Get or create update queue for a poll
   */
  private getOrCreateQueue(pollId: string): UpdateQueue {
    if (!this.updateQueues.has(pollId)) {
      const queue: UpdateQueue = {
        updates: [],
        lastProcessed: 0,
        isThrottled: false,
        throttleUntil: 0,
        setThrottled: function(throttleMs: number) {
          this.isThrottled = true;
          this.throttleUntil = Date.now() + throttleMs;
        }
      };
      this.updateQueues.set(pollId, queue);
    }
    return this.updateQueues.get(pollId)!;
  }

  /**
   * Calculate checksum for diff integrity
   */
  private calculateDiffChecksum(diff: Partial<PollDiff>): string {
    const data = JSON.stringify(diff);
    // Simple hash function - in production, use crypto.createHash
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(16);
  }

  /**
   * Calculate checksum for state integrity
   */
  private calculateStateChecksum(snapshot: any, diffs: PollDiff[]): string {
    const data = JSON.stringify({ snapshot, diffs });
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  /**
   * Update snapshot for a poll
   */
  updateSnapshot(pollId: string, snapshot: any): void {
    this.snapshots.set(pollId, {
      ...snapshot,
      lastUpdate: Date.now()
    });
  }

  /**
   * Clean up old data
   */
  cleanup(pollId?: string): void {
    if (pollId) {
      this.updateQueues.delete(pollId);
      this.diffStorage.delete(pollId);
      this.snapshots.delete(pollId);
      this.rateTracking.delete(pollId);
    } else {
      this.updateQueues.clear();
      this.diffStorage.clear();
      this.snapshots.clear();
      this.rateTracking.clear();
    }
  }
}

// Extend UpdateQueue with throttling methods
declare module './update-manager' {
  interface UpdateQueue {
    setThrottled(throttleMs: number): void;
  }
}

// UpdateQueue interface is defined above with setThrottled method
