/**
 * Minimal Performance Telemetry
 * 
 * Simple, lightweight telemetry for database operations.
 * Provides basic counters and timing without the complexity of the full optimization suite.
 */

import { logger } from '@/lib/logger';

type TelemetryCounters = {
  dbQueryCount: number;
  dbQueryErrors: number;
  cacheHitRate: number;
}

type TelemetryTimers = {
  dbQueryDuration: number[];
}

class MinimalTelemetry {
  private counters: TelemetryCounters = {
    dbQueryCount: 0,
    dbQueryErrors: 0,
    cacheHitRate: 0,
  };

  private timers: TelemetryTimers = {
    dbQueryDuration: [],
  };

  private sampleRate = 0.1; // 10% sampling rate

  /**
   * Record a database query
   */
  recordQuery(table: string, duration: number, success: boolean): void {
    // Only sample a percentage of requests to avoid overhead
    if (Math.random() > this.sampleRate) {
      return;
    }

    this.counters.dbQueryCount++;
    
    if (!success) {
      this.counters.dbQueryErrors++;
    }

    // Keep only last 1000 durations for P95 calculation
    this.timers.dbQueryDuration.push(duration);
    if (this.timers.dbQueryDuration.length > 1000) {
      this.timers.dbQueryDuration.shift();
    }

    // Log slow queries (>500ms)
    if (duration > 500) {
      logger.warn('Slow database query detected', {
        table,
        duration,
        success,
      });
    }
  }

  /**
   * Record cache hit/miss
   */
  recordCacheHit(hit: boolean): void {
    if (Math.random() > this.sampleRate) {
      return;
    }

    // Simple moving average for cache hit rate
    const currentRate = this.counters.cacheHitRate;
    const newRate = hit ? 1 : 0;
    this.counters.cacheHitRate = (currentRate * 0.9) + (newRate * 0.1);
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    const durations = this.timers.dbQueryDuration;
    const sortedDurations = [...durations].sort((a, b) => a - b);
    const p95Index = Math.floor(sortedDurations.length * 0.95);
    const p95Duration = sortedDurations[p95Index] || 0;

    return {
      counters: {
        dbQueryCount: this.counters.dbQueryCount,
        dbQueryErrors: this.counters.dbQueryErrors,
        cacheHitRate: Math.round(this.counters.cacheHitRate * 100) / 100,
      },
      timers: {
        dbQueryDurationP95: p95Duration,
        dbQueryDurationAvg: durations.length > 0 
          ? durations.reduce((a, b) => a + b, 0) / durations.length 
          : 0,
      },
      sampleRate: this.sampleRate,
    };
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.counters = {
      dbQueryCount: 0,
      dbQueryErrors: 0,
      cacheHitRate: 0,
    };
    this.timers = {
      dbQueryDuration: [],
    };
  }
}

// Export singleton instance
export const minimalTelemetry = new MinimalTelemetry();








