/**
 * Redis Health Check Service
 * 
 * Monitors Redis connection health and provides status information
 * 
 * Created: 2025-10-29
 * Status: In Progress
 */

import { redisClient } from './client';
import { logger } from '../utils/logger';

export interface RedisHealthStatus {
  isHealthy: boolean;
  isConnected: boolean;
  latency: number | null;
  memoryUsage: {
    used: string;
    peak: string;
    ratio: number;
  } | null;
  info: {
    version: string;
    uptime: number;
    connectedClients: number;
    totalCommandsProcessed: number;
  } | null;
  lastChecked: Date;
  error?: string;
}

class RedisHealthChecker {
  private lastHealthCheck: RedisHealthStatus | null = null;
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startHealthChecks();
  }

  private startHealthChecks(): void {
    // Check Redis health every 30 seconds
    this.checkInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, 30000);

    // Initial health check
    this.performHealthCheck();
  }

  public async performHealthCheck(): Promise<RedisHealthStatus> {
    const startTime = Date.now();
    const healthStatus: RedisHealthStatus = {
      isHealthy: false,
      isConnected: false,
      latency: null,
      memoryUsage: null,
      info: null,
      lastChecked: new Date()
    };

    try {
      if (!redisClient.isAvailable()) {
        healthStatus.error = 'Redis client not available';
        this.lastHealthCheck = healthStatus;
        return healthStatus;
      }

      // Test basic connectivity with ping
      await redisClient.ping();
      healthStatus.isConnected = true;
      healthStatus.latency = Date.now() - startTime;

      // Get Redis info
      const info = await redisClient.info();
      if (info) {
        healthStatus.info = this.parseRedisInfo(info);
      }

      // Get memory usage
      const memoryInfo = await redisClient.memoryUsage();
      if (memoryInfo) {
        healthStatus.memoryUsage = this.parseMemoryInfo(memoryInfo);
      }

      // Determine overall health
      healthStatus.isHealthy = healthStatus.isConnected && 
        healthStatus.latency < 1000 && // Less than 1 second latency
        (!healthStatus.memoryUsage || healthStatus.memoryUsage.ratio < 0.9); // Less than 90% memory usage

      logger.info('Redis health check completed', {
        isHealthy: healthStatus.isHealthy,
        latency: healthStatus.latency,
        memoryRatio: healthStatus.memoryUsage?.ratio
      });

    } catch (error) {
      healthStatus.error = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Redis health check failed:', error);
    }

    this.lastHealthCheck = healthStatus;
    return healthStatus;
  }

  private parseRedisInfo(info: string): RedisHealthStatus['info'] {
    const lines = info.split('\n');
    const parsed: any = {};

    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        parsed[key.trim()] = value.trim();
      }
    }

    return {
      version: parsed.redis_version || 'Unknown',
      uptime: parseInt(parsed.uptime_in_seconds || '0'),
      connectedClients: parseInt(parsed.connected_clients || '0'),
      totalCommandsProcessed: parseInt(parsed.total_commands_processed || '0')
    };
  }

  private parseMemoryInfo(memoryInfo: string): RedisHealthStatus['memoryUsage'] {
    const lines = memoryInfo.split('\n');
    const parsed: any = {};

    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        parsed[key.trim()] = value.trim();
      }
    }

    const used = parseInt(parsed.used_memory_human?.replace(/[^\d]/g, '') || '0');
    const peak = parseInt(parsed.used_memory_peak_human?.replace(/[^\d]/g, '') || '0');
    const ratio = peak > 0 ? used / peak : 0;

    return {
      used: parsed.used_memory_human || '0B',
      peak: parsed.used_memory_peak_human || '0B',
      ratio
    };
  }

  public getLastHealthStatus(): RedisHealthStatus | null {
    return this.lastHealthCheck;
  }

  public async getCurrentHealthStatus(): Promise<RedisHealthStatus> {
    return await this.performHealthCheck();
  }

  public stopHealthChecks(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

// Export singleton instance
export const redisHealthChecker = new RedisHealthChecker();

// Graceful shutdown
process.on('SIGINT', () => {
  redisHealthChecker.stopHealthChecks();
});

process.on('SIGTERM', () => {
  redisHealthChecker.stopHealthChecks();
});
