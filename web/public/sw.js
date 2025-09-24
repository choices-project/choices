/**
 * Service Worker for Choices PWA
 * 
 * Comprehensive service worker with advanced caching strategies,
 * offline support, and background sync capabilities.
 */

const CACHE_VERSION = 'choices-v2.0.0';
const CACHE_NAMES = {
  static: `${CACHE_VERSION}-static`,
  dynamic: `${CACHE_VERSION}-dynamic`,
  api: `${CACHE_VERSION}-api`,
  images: `${CACHE_VERSION}-images`
};

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg'
];

// API routes that should be cached
const API_CACHE_PATTERNS = [
  '/api/polls',
  '/api/polls/',
  '/api/pwa/status',
  '/api/pwa/manifest'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAMES.static)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old caches that don't match current version
            if (!Object.values(CACHE_NAMES).includes(cacheName)) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests with appropriate strategies
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request, CACHE_NAMES.static));
  } else if (isAPIRequest(request)) {
    event.respondWith(networkFirst(request, CACHE_NAMES.api));
  } else if (isImageRequest(request)) {
    event.respondWith(cacheFirst(request, CACHE_NAMES.images));
  } else if (isPageRequest(request)) {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAMES.dynamic));
  } else {
    event.respondWith(networkFirst(request, CACHE_NAMES.dynamic));
  }
});

// Background sync for offline votes
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'offline-votes') {
    event.waitUntil(syncOfflineVotes());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New notification from Choices',
      icon: '/icons/icon-192x192.svg',
      badge: '/icons/icon-72x72.svg',
      tag: data.tag || 'choices-notification',
      data: data.data || {},
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/icons/action-view.svg'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/action-dismiss.svg'
        }
      ],
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Choices', options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'view' || !event.action) {
    const url = event.notification.data?.url || '/';
    event.waitUntil(
      clients.openWindow(url)
    );
  }
});

// Cache strategies

/**
 * Cache First Strategy - for static assets
 */
async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache first failed:', error);
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Network First Strategy - for API requests
 */
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response('Offline', { status: 503 });
  }
}

/**
 * Stale While Revalidate Strategy - for pages
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then((networkResponse) => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(() => {
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    return new Response('Offline', { status: 503 });
  });
  
  return cachedResponse || fetchPromise;
}

// Helper functions

function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/_next/static/') ||
         url.pathname.startsWith('/icons/') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.svg') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg') ||
         url.pathname.endsWith('.jpeg') ||
         url.pathname.endsWith('.gif') ||
         url.pathname.endsWith('.webp');
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return API_CACHE_PATTERNS.some((prefix) => url.pathname.startsWith(prefix));
}

function isImageRequest(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
}

function isPageRequest(request) {
  return request.mode === 'navigate' || 
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

// Background sync functions

async function syncOfflineVotes() {
  try {
    console.log('[SW] Syncing offline votes...');
    
    // Get offline votes from IndexedDB or localStorage
    const offlineVotes = await getOfflineVotes();
    
    if (offlineVotes.length === 0) {
      console.log('[SW] No offline votes to sync');
      return;
    }
    
    // Sync each vote
    for (const vote of offlineVotes) {
      try {
        await syncVote(vote);
        await removeOfflineVote(vote.id);
        console.log('[SW] Synced vote:', vote.id);
      } catch (error) {
        console.error('[SW] Failed to sync vote:', vote.id, error);
      }
    }
    
    console.log('[SW] Offline votes sync completed');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

async function syncVote(vote) {
  const response = await fetch('/api/pwa/offline/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      votes: [vote],
      deviceId: 'service-worker',
      timestamp: new Date().toISOString()
    })
  });
  
  if (!response.ok) {
    throw new Error(`Sync failed: ${response.status}`);
  }
  
  return response.json();
}

async function getOfflineVotes() {
  // This would typically read from IndexedDB
  // For now, return empty array
  return [];
}

async function removeOfflineVote(voteId) {
  // This would typically remove from IndexedDB
  console.log('[SW] Removing offline vote:', voteId);
}

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});

console.log('[SW] Service worker script loaded');