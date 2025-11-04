/**
 * @fileoverview Cache Strategy Utilities for Service Worker
 * 
 * TypeScript utilities and types for managing service worker caching.
 * Complements service worker's cache strategies with client-side utilities.
 * 
 * @author Choices Platform Team
 */

/**
 * Cache strategy types matching service worker implementation
 */
export enum CacheStrategy {
  /** Cache first, network fallback - best for static assets */
  CACHE_FIRST = 'cache-first',
  
  /** Network first, cache fallback - best for API calls */
  NETWORK_FIRST = 'network-first',
  
  /** Return cached immediately, update in background - best for images */
  STALE_WHILE_REVALIDATE = 'stale-while-revalidate',
  
  /** Always fetch from network, no cache - best for real-time data */
  NETWORK_ONLY = 'network-only',
  
  /** Always serve from cache, never network - best for offline-only */
  CACHE_ONLY = 'cache-only',
}

/**
 * Cache names used by service worker
 * Must match service worker cache names
 */
export const CACHE_NAMES = {
  static: 'choices-pwa-v1.0.0-static',
  dynamic: 'choices-pwa-v1.0.0-dynamic',
  api: 'choices-pwa-v1.0.0-api',
  images: 'choices-pwa-v1.0.0-images',
} as const;

/**
 * Maximum cache ages in milliseconds
 * Must match service worker configuration
 */
export const CACHE_MAX_AGE = {
  static: 7 * 24 * 60 * 60 * 1000,      // 7 days
  dynamic: 24 * 60 * 60 * 1000,         // 1 day
  api: 5 * 60 * 1000,                   // 5 minutes
  images: 30 * 24 * 60 * 60 * 1000,     // 30 days
} as const;

/**
 * API endpoints that should be cached for offline use
 */
export const CACHEABLE_API_ROUTES = [
  '/api/polls',
  '/api/representatives',
  '/api/civics',
  '/api/feeds',
  '/api/hashtags',
  '/api/dashboard',
  '/api/profile',
] as const;

/**
 * Cache entry metadata
 */
export interface CacheEntry {
  url: string;
  timestamp: number;
  strategy: CacheStrategy;
  size?: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  totalEntries: number;
  totalSize: number;
  caches: {
    name: string;
    entries: number;
    size: number;
  }[];
}

/**
 * Get all cached entries across all caches
 * 
 * @returns {Promise<CacheEntry[]>} Array of cache entries
 */
export async function getAllCachedEntries(): Promise<CacheEntry[]> {
  if (!('caches' in window)) {
    return [];
  }
  
  const cacheNames = await caches.keys();
  const entries: CacheEntry[] = [];
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    
    for (const request of requests) {
      const response = await cache.match(request);
      
      if (response) {
        const blob = await response.blob();
        
        entries.push({
          url: request.url,
          timestamp: Date.now(), // Note: SW doesn't store timestamps, using current time
          strategy: getCacheStrategy(request.url),
          size: blob.size,
        });
      }
    }
  }
  
  return entries;
}

/**
 * Get cache statistics
 * 
 * @returns {Promise<CacheStats>} Cache statistics
 */
export async function getCacheStats(): Promise<CacheStats> {
  if (!('caches' in window)) {
    return {
      totalEntries: 0,
      totalSize: 0,
      caches: [],
    };
  }
  
  const cacheNames = await caches.keys();
  const cacheStats = [];
  let totalEntries = 0;
  let totalSize = 0;
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    let cacheSize = 0;
    
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        cacheSize += blob.size;
      }
    }
    
    cacheStats.push({
      name: cacheName,
      entries: requests.length,
      size: cacheSize,
    });
    
    totalEntries += requests.length;
    totalSize += cacheSize;
  }
  
  return {
    totalEntries,
    totalSize,
    caches: cacheStats,
  };
}

/**
 * Clear specific cache by name
 * 
 * @param {string} cacheName - Name of cache to clear
 * @returns {Promise<boolean>} True if deleted successfully
 */
export async function clearCache(cacheName: string): Promise<boolean> {
  if (!('caches' in window)) {
    return false;
  }
  
  return await caches.delete(cacheName);
}

/**
 * Clear all caches
 * 
 * @returns {Promise<number>} Number of caches cleared
 */
export async function clearAllCaches(): Promise<number> {
  if (!('caches' in window)) {
    return 0;
  }
  
  const cacheNames = await caches.keys();
  let cleared = 0;
  
  for (const cacheName of cacheNames) {
    const success = await caches.delete(cacheName);
    if (success) cleared++;
  }
  
  return cleared;
}

/**
 * Determine cache strategy based on URL
 * Helper function to understand how a URL will be cached
 * 
 * @param {string} url - URL to check
 * @returns {CacheStrategy} Appropriate cache strategy
 */
export function getCacheStrategy(url: string): CacheStrategy {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    
    // Static assets - cache first
    if (
      pathname.endsWith('.js') ||
      pathname.endsWith('.css') ||
      pathname.endsWith('.woff') ||
      pathname.endsWith('.woff2') ||
      pathname.startsWith('/_next/static/')
    ) {
      return CacheStrategy.CACHE_FIRST;
    }
    
    // Images - stale while revalidate
    if (
      pathname.endsWith('.jpg') ||
      pathname.endsWith('.jpeg') ||
      pathname.endsWith('.png') ||
      pathname.endsWith('.gif') ||
      pathname.endsWith('.webp') ||
      pathname.endsWith('.svg')
    ) {
      return CacheStrategy.STALE_WHILE_REVALIDATE;
    }
    
    // API calls - network first
    if (pathname.startsWith('/api/')) {
      return CacheStrategy.NETWORK_FIRST;
    }
    
    // Default - network first
    return CacheStrategy.NETWORK_FIRST;
  } catch (error) {
    return CacheStrategy.NETWORK_FIRST;
  }
}

/**
 * Check if URL should be cached
 * 
 * @param {string} url - URL to check
 * @returns {boolean} True if URL should be cached
 */
export function shouldCache(url: string): boolean {
  try {
    const urlObj = new URL(url);
    
    // Don't cache external URLs
    if (urlObj.origin !== window.location.origin) {
      return false;
    }
    
    // Don't cache authentication endpoints
    if (urlObj.pathname.startsWith('/api/auth/')) {
      return false;
    }
    
    // Don't cache admin endpoints
    if (urlObj.pathname.startsWith('/api/admin/')) {
      return false;
    }
    
    // Don't cache POST/PUT/DELETE requests (only handled for GET in SW)
    // This is a URL check, not request method, so we assume GET
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Format bytes to human-readable format
 * 
 * @param {number} bytes - Number of bytes
 * @returns {string} Formatted string (e.g., "1.5 MB")
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Calculate cache age in human-readable format
 * 
 * @param {number} timestamp - Timestamp in milliseconds
 * @returns {string} Human-readable age (e.g., "2 hours ago")
 */
export function formatCacheAge(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
}

/**
 * Preload critical resources into cache
 * Call this during app initialization to ensure offline functionality
 * 
 * @param {string[]} urls - URLs to preload
 * @returns {Promise<void>}
 */
export async function preloadResources(urls: string[]): Promise<void> {
  if (!('caches' in window)) {
    return;
  }
  
  const cache = await caches.open(CACHE_NAMES.static);
  
  await Promise.allSettled(
    urls.map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch (error) {
        console.warn(`Failed to preload ${url}:`, error);
      }
    })
  );
}

