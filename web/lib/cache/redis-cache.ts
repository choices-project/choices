/**
 * Redis Cache Module
 * 
 * Simple in-memory cache implementation (Redis replacement)
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

class MemoryCache {
  private cache = new Map<string, CacheEntry<any>>()

  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.value
  }

  async set<T>(key: string, value: T, ttlMs: number = 300000): Promise<void> {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlMs
    })
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async clear(): Promise<void> {
    this.cache.clear()
  }

  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key)
    return entry ? Date.now() <= entry.expiresAt : false
  }
}

const cache = new MemoryCache()

export default cache

export const CacheKeys = {
  DASHBOARD_DATA: (userId: string) => `dashboard:${userId}`,
  USER_PROFILE: (userId: string) => `profile:${userId}`,
  POLL_RESULTS: (pollId: string) => `poll:${pollId}:results`,
  TRENDING_HASHTAGS: () => 'trending:hashtags',
  ANALYTICS_DATA: (key: string) => `analytics:${key}`,
  ADMIN_DASHBOARD: () => 'admin:dashboard',
  PLATFORM_STATS: () => 'platform:stats'
}

export const CacheTTL = {
  USER_DATA: 300000, // 5 minutes
  POLL_DATA: 60000,  // 1 minute
  ANALYTICS: 180000, // 3 minutes
  TRENDING: 300000,  // 5 minutes
  ADMIN_DATA: 600000, // 10 minutes
  PLATFORM_STATS: 300000 // 5 minutes
}
