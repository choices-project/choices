/**
 * @fileoverview Service Worker Configuration
 * 
 * Centralized configuration for service worker behavior and caching strategies.
 * 
 * @author Choices Platform Team
 */

/**
 * Service worker version
 * Increment this to force service worker update across all clients
 */
export const SW_VERSION = 'v1.0.0';

/**
 * Cache names configuration
 * These must match the service worker's cache names
 */
export const CACHE_CONFIG = {
  version: SW_VERSION,
  prefix: 'choices-pwa',
  
  /**
   * Individual cache names
   */
  names: {
    static: `choices-pwa-${SW_VERSION}-static`,
    dynamic: `choices-pwa-${SW_VERSION}-dynamic`,
    api: `choices-pwa-${SW_VERSION}-api`,
    images: `choices-pwa-${SW_VERSION}-images`,
  },
  
  /**
   * Maximum age for cached items (in milliseconds)
   */
  maxAge: {
    static: 7 * 24 * 60 * 60 * 1000,      // 7 days
    dynamic: 24 * 60 * 60 * 1000,         // 1 day  
    api: 5 * 60 * 1000,                   // 5 minutes
    images: 30 * 24 * 60 * 60 * 1000,     // 30 days
  },
  
  /**
   * Maximum number of entries per cache
   */
  maxEntries: {
    static: 100,
    dynamic: 50,
    api: 100,
    images: 200,
  },
} as const;

/**
 * Static assets to cache immediately on service worker install
 * Critical assets that must be available offline
 */
export const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
] as const;

/**
 * API routes that should be cached for offline access
 * These will use Network-First strategy with offline fallback
 */
export const CACHEABLE_API_ROUTES = [
  '/api/polls',
  '/api/polls/trending',
  '/api/representatives',
  '/api/representatives/my',
  '/api/civics',
  '/api/feeds',
  '/api/hashtags',
  '/api/trending/hashtags',
  '/api/dashboard',
  '/api/dashboard/data',
  '/api/profile',
  '/api/user/profile',
] as const;

/**
 * API routes that should NEVER be cached
 * These require always-fresh data or involve sensitive operations
 */
export const UNCACHEABLE_API_ROUTES = [
  '/api/auth',
  '/api/admin',
  '/api/polls/*/vote',     // Voting must be real-time
  '/api/polls/*/close',    // Poll operations
  '/api/polls/*/lock',
  '/api/profile/update',   // Profile updates
  '/api/contact/messages', // Messaging
  '/api/pwa/offline/sync', // Sync operations
] as const;

/**
 * Routes that should always fetch from network
 * Even when offline, these should show offline page rather than cached version
 */
export const NETWORK_ONLY_ROUTES = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/register',
  '/api/admin/*',
] as const;

/**
 * Background sync configuration
 */
export const BACKGROUND_SYNC_CONFIG = {
  /**
   * Sync tags for different operations
   */
  tags: {
    votes: 'sync-votes',
    civicActions: 'sync-civic-actions',
    contacts: 'sync-contacts',
    profile: 'sync-profile',
  },
  
  /**
   * Retry configuration
   */
  retry: {
    maxAttempts: 3,
    backoffDelay: 5000,  // 5 seconds
  },
} as const;

/**
 * Push notification configuration
 */
export const PUSH_CONFIG = {
  /**
   * VAPID public key for push notifications
   * This should be generated and stored in environment variables
   * For now, using placeholder - MUST BE REPLACED in production
   */
  vapidPublicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  
  /**
   * Default notification options
   */
  defaultOptions: {
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-192x192.svg',
    vibrate: [200, 100, 200],
    requireInteraction: false,
  },
  
  /**
   * Notification categories with custom icons
   */
  categories: {
    poll: {
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-192x192.svg',
    },
    civic: {
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-192x192.svg',
    },
    hashtag: {
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-192x192.svg',
    },
    system: {
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-192x192.svg',
    },
  },
} as const;

/**
 * PWA installation prompt configuration
 */
export const INSTALL_PROMPT_CONFIG = {
  /**
   * Minimum visits before showing install prompt
   */
  minVisits: 3,
  
  /**
   * Minimum time on site (ms) before showing prompt
   */
  minTimeOnSite: 2 * 60 * 1000, // 2 minutes
  
  /**
   * Days to wait before showing prompt again after dismissal
   */
  dismissCooldown: 7,
  
  /**
   * Storage key for tracking prompt dismissals
   */
  storageKey: 'pwa-install-prompt-dismissed',
} as const;

/**
 * Offline queue configuration
 */
export const OFFLINE_QUEUE_CONFIG = {
  /**
   * Maximum number of actions to queue
   */
  maxQueueSize: 50,
  
  /**
   * Storage key for offline queue
   */
  storageKey: 'pwa-offline-queue',
  
  /**
   * Maximum age for queued items (ms)
   */
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
} as const;

/**
 * Service worker update check interval
 */
export const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000; // 1 hour

/**
 * Development mode configuration
 */
export const DEV_CONFIG = {
  /**
   * Enable service worker in development
   * @default false
   */
  enableInDev: process.env.NODE_ENV === 'development' && 
                process.env.NEXT_PUBLIC_PWA_DEV === 'true',
  
  /**
   * Log all service worker events
   */
  verboseLogging: process.env.NEXT_PUBLIC_PWA_DEBUG === 'true',
} as const;

