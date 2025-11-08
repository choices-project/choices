/**
 * Service Worker for Choices PWA
 *
 * Aligned with the 2025 typed PWA utilities:
 * - Shared cache/version identifiers
 * - Background sync tags per `BACKGROUND_SYNC_CONFIG`
 * - IndexedDB-backed offline queue compatible with `background-sync.ts`
 */

const SW_VERSION = 'v1.0.0';
const CACHE_PREFIX = 'choices-pwa';
const CACHE_NAMES = {
  static: `${CACHE_PREFIX}-${SW_VERSION}-static`,
  dynamic: `${CACHE_PREFIX}-${SW_VERSION}-dynamic`,
  api: `${CACHE_PREFIX}-${SW_VERSION}-api`,
  images: `${CACHE_PREFIX}-${SW_VERSION}-images`,
};

const STATIC_ASSETS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
];

const CACHEABLE_API_ROUTES = [
  '/api/polls',
  '/api/polls/trending',
  '/api/representatives',
  '/api/representatives/my',
  '/api/civics',
  '/api/feeds',
  '/api/hashtags',
  '/api/trending',
  '/api/dashboard',
  '/api/profile',
  '/api/user/profile',
];

const UNCACHEABLE_API_ROUTES = [
  '/api/auth',
  '/api/admin',
  '/api/polls/*/vote',
  '/api/polls/*/close',
  '/api/polls/*/lock',
  '/api/profile',
  '/api/contact/messages',
  '/api/pwa/offline/sync',
];

const NETWORK_ONLY_ROUTES = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/register',
  '/api/admin',
];

const SYNC_TAG_TO_ACTION_TYPE = {
  'sync-votes': 'vote',
  'sync-civic-actions': 'civic_action',
  'sync-contacts': 'contact',
  'sync-profile': 'profile_update',
};

const ACTION_TYPE_TO_TAG = {
  vote: 'sync-votes',
  civic_action: 'sync-civic-actions',
  contact: 'sync-contacts',
  profile_update: 'sync-profile',
};

const OFFLINE_QUEUE_DB_NAME = 'choices-pwa-offline-queue';
const OFFLINE_QUEUE_DB_VERSION = 1;
const OFFLINE_QUEUE_DB_STORE = 'actions';
const DEFAULT_MAX_ATTEMPTS = 3;
const OFFLINE_FALLBACK_PAGE = '/offline.html';

self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker');

  event.waitUntil(
    caches.open(CACHE_NAMES.static)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch((error) => console.error('[SW] Failed to cache static assets', error))
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker');

  event.waitUntil(
    caches.keys()
      .then((cacheKeys) =>
        Promise.all(
          cacheKeys.map((cacheKey) => {
            if (!Object.values(CACHE_NAMES).includes(cacheKey)) {
              return caches.delete(cacheKey);
            }
            return undefined;
          }),
        ),
      )
      .then(() => self.clients.claim())
      .then(() => readQueueFromIDB())
      .then((queue) => broadcastQueueSize(queue.length)),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (isNetworkOnlyRoute(url.pathname)) {
    event.respondWith(fetch(request).catch(() => offlineResponse(request)));
    return;
  }

  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request, CACHE_NAMES.static));
    return;
  }

  if (isAPIRequest(url.pathname)) {
    event.respondWith(networkFirst(request, CACHE_NAMES.api));
    return;
  }

  if (isImageRequest(request)) {
    event.respondWith(cacheFirst(request, CACHE_NAMES.images));
    return;
  }

  if (isPageRequest(request)) {
    event.respondWith(staleWhileRevalidate(request, CACHE_NAMES.dynamic));
    return;
  }

  event.respondWith(networkFirst(request, CACHE_NAMES.dynamic));
});

self.addEventListener('sync', (event) => {
  if (event.tag && SYNC_TAG_TO_ACTION_TYPE[event.tag]) {
    console.log('[SW] Background sync triggered', event.tag);
    event.waitUntil(handleSyncTag(event.tag));
  }
});

self.addEventListener('push', (event) => {
  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body || 'New notification from Choices',
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-192x192.svg',
    tag: data.tag || 'choices-notification',
    data: data.data || {},
    actions: data.actions || [],
    requireInteraction: Boolean(data.requireInteraction),
    silent: Boolean(data.silent),
  };

  event.waitUntil(self.registration.showNotification(data.title || 'Choices', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(targetUrl));
});

self.addEventListener('message', (event) => {
  const message = event.data || {};

  if (message.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (message.type === 'GET_VERSION' && event.ports?.[0]) {
    event.ports[0].postMessage({ version: SW_VERSION });
  }
});

console.log(`[SW] Service worker loaded (version ${SW_VERSION})`);

// ---------------------------------------------------------------------------
// Caching strategies
// ---------------------------------------------------------------------------

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    broadcastAnalyticsEvent('CACHE_HIT', { cache: cacheName, url: request.url, strategy: 'cache-first' });
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    broadcastAnalyticsEvent('CACHE_MISS', { cache: cacheName, url: request.url, strategy: 'cache-first' });
    return response;
  } catch (error) {
    console.error('[SW] cacheFirst failed', error);
    broadcastAnalyticsEvent('CACHE_MISS', { cache: cacheName, url: request.url, strategy: 'cache-first' });
    if (isPageRequest(request)) {
      return offlineResponse(request);
    }
    return new Response('Offline', { status: 503 });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    broadcastAnalyticsEvent('CACHE_MISS', { cache: cacheName, url: request.url, strategy: 'network-first' });
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      broadcastAnalyticsEvent('CACHE_HIT', { cache: cacheName, url: request.url, strategy: 'network-first' });
      return cached;
    }
    broadcastAnalyticsEvent('CACHE_MISS', { cache: cacheName, url: request.url, strategy: 'network-first' });
    return offlineResponse(request);
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      broadcastAnalyticsEvent('CACHE_MISS', { cache: cacheName, url: request.url, strategy: 'stale-while-revalidate' });
      return response;
    })
    .catch(() => offlineResponse(request));

  if (cachedResponse) {
    broadcastAnalyticsEvent('CACHE_HIT', { cache: cacheName, url: request.url, strategy: 'stale-while-revalidate' });
  }

  return cachedResponse || fetchPromise;
}

async function offlineResponse(request) {
  if (isPageRequest(request)) {
    const fallback = await caches.match(OFFLINE_FALLBACK_PAGE);
    if (fallback) {
      return fallback;
    }
  }
  return new Response('Offline', { status: 503 });
}

// ---------------------------------------------------------------------------
// Background sync + offline queue helpers
// ---------------------------------------------------------------------------

async function handleSyncTag(tag) {
  const actionType = SYNC_TAG_TO_ACTION_TYPE[tag];
  if (!actionType) {
    return;
  }

  const queue = await readQueueFromIDB();
  if (!queue.length) {
    return;
  }

  const sortedQueue = queue.slice().sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
  const updatedQueue = [];

  for (const action of sortedQueue) {
    if (action.type !== actionType) {
      updatedQueue.push(action);
      continue;
    }

    try {
      await dispatchQueuedAction(action);
    } catch (error) {
      const attempts = (action.attempts ?? 0) + 1;
      const maxAttempts = action.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;

      if (attempts < maxAttempts) {
        updatedQueue.push({
          ...action,
          attempts,
          lastError: error instanceof Error ? error.message : String(error),
        });
      } else {
        console.error('[SW] Dropping offline action after max attempts', action.id, error);
      }
    }
  }

  await writeQueueToIDB(updatedQueue);
  await broadcastQueueSize(updatedQueue.length);

  if (updatedQueue.some((action) => action.type === actionType)) {
    try {
      await self.registration.sync?.register(tag);
    } catch (error) {
      console.error('[SW] Failed to re-register background sync', tag, error);
    }
  }
}

async function dispatchQueuedAction(action) {
  const headers = new Headers({
    'X-Offline-Action': 'true',
    'X-Action-Timestamp': String(action.timestamp ?? Date.now()),
  });

  const init = {
    method: action.method || 'POST',
    headers,
  };

  if (action.payload && action.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
    init.body = JSON.stringify(action.payload);
  }

  const response = await fetch(action.endpoint, init);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
}

async function openQueueDB() {
  if (typeof indexedDB === 'undefined') {
    return null;
  }

  return new Promise((resolve) => {
    const request = indexedDB.open(OFFLINE_QUEUE_DB_NAME, OFFLINE_QUEUE_DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(OFFLINE_QUEUE_DB_STORE)) {
        db.createObjectStore(OFFLINE_QUEUE_DB_STORE, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

async function readQueueFromIDB() {
  const db = await openQueueDB();
  if (!db) {
    return [];
  }

  return new Promise((resolve) => {
    const transaction = db.transaction(OFFLINE_QUEUE_DB_STORE, 'readonly');
    const store = transaction.objectStore(OFFLINE_QUEUE_DB_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const raw = Array.isArray(request.result) ? request.result : [];
      resolve(
        raw.filter(
          (entry) =>
            entry &&
            typeof entry.id === 'string' &&
            typeof entry.endpoint === 'string' &&
            typeof entry.method === 'string',
        ),
      );
    };

    request.onerror = () => resolve([]);
    transaction.oncomplete = () => db.close();
    transaction.onabort = () => {
      db.close();
      resolve([]);
    };
  });
}

async function writeQueueToIDB(queue) {
  const db = await openQueueDB();
  if (!db) {
    return;
  }

  await new Promise((resolve) => {
    const transaction = db.transaction(OFFLINE_QUEUE_DB_STORE, 'readwrite');
    const store = transaction.objectStore(OFFLINE_QUEUE_DB_STORE);

    const clearRequest = store.clear();
    clearRequest.onsuccess = () => {
      queue.forEach((action) => {
        store.put(action);
      });
    };
    clearRequest.onerror = () => console.error('[SW] Failed to clear queue store before write');

    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onabort = () => {
      console.error('[SW] Transaction aborted while writing queue to IDB');
      db.close();
      resolve();
    };
  });
}

async function broadcastQueueSize(size) {
  broadcastToClients({
    type: 'OFFLINE_QUEUE_UPDATED',
    size,
    updatedAt: new Date().toISOString(),
  });
}

// ---------------------------------------------------------------------------
// Request helpers
// ---------------------------------------------------------------------------

function isStaticAsset(request) {
  const url = new URL(request.url);
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.gif') ||
    url.pathname.endsWith('.webp')
  );
}

function isImageRequest(request) {
  const url = new URL(request.url);
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url.pathname);
}

function isPageRequest(request) {
  return request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');
}

function isAPIRequest(pathname) {
  if (!pathname.startsWith('/api')) {
    return false;
  }

  if (UNCACHEABLE_API_ROUTES.some((pattern) => matchesPattern(pathname, pattern))) {
    return false;
  }

  return CACHEABLE_API_ROUTES.some((pattern) => matchesPattern(pathname, pattern));
}

function isNetworkOnlyRoute(pathname) {
  return NETWORK_ONLY_ROUTES.some((pattern) => matchesPattern(pathname, pattern));
}

function matchesPattern(pathname, pattern) {
  if (pattern.includes('*')) {
    const escaped = escapeRegExp(pattern).replace(/\\\*/g, '.*');
    return new RegExp(`^${escaped}$`).test(pathname);
  }
  return pathname.startsWith(pattern);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function broadcastAnalyticsEvent(type, properties) {
  broadcastToClients({ type, ...properties });
}

async function broadcastToClients(payload) {
  const clientList = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
  clientList.forEach((client) => {
    client.postMessage(payload);
  });
}
