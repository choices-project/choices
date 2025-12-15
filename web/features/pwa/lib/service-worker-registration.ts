import logger from '@/lib/utils/logger';
/**
 * @fileoverview Service Worker Registration and Lifecycle Management
 * 
 * Handles service worker registration, updates, and communication.
 * 
 * Features:
 * - Only registers in production or localhost
 * - Detects and notifies user of updates
 * - Handles registration errors gracefully
 * - Provides unregister functionality for development
 * 
 * @author Choices Platform Team
 */

/**
 * Configuration for service worker registration
 */
export type ServiceWorkerConfig = {
  /**
   * Callback fired when service worker is registered successfully
   */
  onSuccess?: (registration: ServiceWorkerRegistration) => void;
  
  /**
   * Callback fired when a new service worker update is available
   */
  onUpdate?: (registration: ServiceWorkerRegistration) => void;
  
  /**
   * Callback fired when service worker registration fails
   */
  onError?: (error: Error) => void;
  
  /**
   * Callback fired when service worker becomes active
   */
  onActive?: () => void;
  
  /**
   * Whether to enable debug logging
   * @default false
   */
  debug?: boolean;
}

/**
 * Service Worker registration state
 */
type RegistrationState = {
  registration: ServiceWorkerRegistration | null;
  isRegistered: boolean;
  isUpdateAvailable: boolean;
  isOffline: boolean;
}

// Global state
const state: RegistrationState = {
  registration: null,
  isRegistered: false,
  isUpdateAvailable: false,
  isOffline: typeof window !== 'undefined' && typeof navigator !== 'undefined' ? !navigator.onLine : false,
};

/**
 * Check if service workers are supported in current browser
 * 
 * @returns {boolean} True if service workers are supported
 */
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator;
}

/**
 * Check if we're in production environment
 * Production = not localhost, not 127.0.0.1, uses HTTPS or localhost HTTP
 * 
 * @returns {boolean} True if production environment
 */
function isProduction(): boolean {
  if (typeof window === 'undefined') return false;
  
  const { protocol, hostname } = window.location;
  const isLocalhost = hostname === 'localhost' || 
                     hostname === '127.0.0.1' ||
                     hostname === '[::1]';
  
  // Allow registration on localhost for development
  // Require HTTPS in production
  return isLocalhost || protocol === 'https:';
}

/**
 * Register the service worker
 * 
 * This should be called once when the app loads, typically in _app.tsx or layout.tsx
 * 
 * @param {ServiceWorkerConfig} config - Configuration options
 * @returns {Promise<ServiceWorkerRegistration | null>} Registration object or null if not supported
 * 
 * @example
 * ```typescript
 * register({
 *   onSuccess: (registration) => logger.info('SW registered:', registration),
 *   onUpdate: (registration) => notifyUser('App update available!'),
 *   onError: (error) => logger.error('SW registration failed:', error),
 * });
 * ```
 */
export async function register(config: ServiceWorkerConfig = {}): Promise<ServiceWorkerRegistration | null> {
  // Only register in browser environment
  if (typeof window === 'undefined') {
    if (config.debug) logger.info('[SW] Server-side, skipping registration');
    return null;
  }
  
  // Check browser support
  if (!isServiceWorkerSupported()) {
    if (config.debug) logger.info('[SW] Service workers not supported');
    return null;
  }
  
  // Check environment
  if (!isProduction()) {
    if (config.debug) logger.info('[SW] Non-production environment detected');
    // Still allow registration in development for testing
  }
  
  try {
    if (config.debug) logger.info('[SW] Registering service worker...');
    
    // Wait for page to load before registering
    if (document.readyState === 'loading') {
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          logger.warn('[SW] Page load timeout, proceeding with registration');
          resolve();
        }, 5000); // 5 second timeout
        
        window.addEventListener('load', () => {
          clearTimeout(timeout);
          resolve();
        }, { once: true });
      });
    }
    
    // Check if service worker file exists before registering
    // This prevents registration errors in development or when file is missing
    try {
      const response = await fetch('/service-worker.js', { method: 'HEAD' });
      if (!response.ok && response.status !== 404) {
        // If file doesn't exist, skip registration gracefully
        if (config.debug) logger.info('[SW] Service worker file not found, skipping registration');
        return null;
      }
    } catch (fetchError) {
      // If fetch fails (e.g., network error), still try to register
      // The browser will handle the error appropriately
      if (config.debug) logger.warn('[SW] Could not check service worker file existence', fetchError);
    }
    
    // Register service worker with timeout
    const registrationPromise = navigator.serviceWorker.register('/service-worker.js', {
      scope: '/',
    });
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Service worker registration timeout')), 10000); // 10 second timeout
    });
    
    const registration = await Promise.race([registrationPromise, timeoutPromise]);
    
    state.registration = registration;
    state.isRegistered = true;
    
    if (config.debug) {
      logger.info('[SW] Registration successful:', registration);
      logger.info('[SW] Scope:', registration.scope);
    }
    
    // Set up update detection
    registration.addEventListener('updatefound', () => {
      handleUpdateFound(registration, config);
    });
    
    // Check for updates periodically (every hour)
    setInterval(() => {
      if (config.debug) logger.info('[SW] Checking for updates...');
      registration.update();
    }, 60 * 60 * 1000);
    
    // Handle initial state
    if (registration.active) {
      if (config.debug) logger.info('[SW] Service worker active');
      config.onActive?.();
    }
    
    // Call success callback
    config.onSuccess?.(registration);
    
    // Set up online/offline detection
    setupNetworkDetection(config);
    
    return registration;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    // Don't log as error if it's a missing file or timeout - these are expected in some scenarios
    if (errorMessage.includes('timeout') || errorMessage.includes('404') || errorMessage.includes('Failed to fetch')) {
      logger.warn('[SW] Registration skipped:', errorMessage);
    } else {
      logger.error('[SW] Registration failed:', error);
    }
    
    config.onError?.(error as Error);
    return null;
  }
}

/**
 * Handle service worker update found event
 * 
 * @param {ServiceWorkerRegistration} registration - Service worker registration
 * @param {ServiceWorkerConfig} config - Configuration options
 */
function handleUpdateFound(registration: ServiceWorkerRegistration, config: ServiceWorkerConfig): void {
  const installingWorker = registration.installing;
  
  if (!installingWorker) return;
  
  if (config.debug) logger.info('[SW] Update found, installing new version...');
  
  installingWorker.addEventListener('statechange', () => {
    if (installingWorker.state === 'installed') {
      if (navigator.serviceWorker.controller) {
        // New service worker available
        if (config.debug) logger.info('[SW] New version available!');
        state.isUpdateAvailable = true;
        config.onUpdate?.(registration);
      } else {
        // First install
        if (config.debug) logger.info('[SW] Content cached for offline use');
        config.onActive?.();
      }
    }
    
    if (installingWorker.state === 'activated') {
      if (config.debug) logger.info('[SW] New version activated');
      state.isUpdateAvailable = false;
    }
  });
}

/**
 * Set up network online/offline detection
 * 
 * @param {ServiceWorkerConfig} config - Configuration options
 */
function setupNetworkDetection(config: ServiceWorkerConfig): void {
  window.addEventListener('online', () => {
    state.isOffline = false;
    if (config.debug) logger.info('[SW] Network: Online');
  });
  
  window.addEventListener('offline', () => {
    state.isOffline = true;
    if (config.debug) logger.info('[SW] Network: Offline');
  });
}

/**
 * Activate waiting service worker immediately
 * Call this when user accepts the update prompt
 * 
 * @returns {Promise<void>}
 * 
 * @example
 * ```typescript
 * // User clicked "Update Now" button
 * await activateUpdate();
 * window.location.reload();
 * ```
 */
export async function activateUpdate(): Promise<void> {
  if (!state.registration?.waiting) {
    logger.warn('[SW] No waiting service worker to activate');
    return;
  }
  
  // Tell waiting service worker to skip waiting
  state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  
  // Wait for controlling service worker to change
  await new Promise<void>((resolve) => {
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      resolve();
    }, { once: true });
  });
}

/**
 * Unregister service worker
 * Useful for development or troubleshooting
 * 
 * @returns {Promise<boolean>} True if unregistered successfully
 * 
 * @example
 * ```typescript
 * await unregister();
 * logger.info('Service worker unregistered');
 * ```
 */
export async function unregister(): Promise<boolean> {
  if (!isServiceWorkerSupported()) {
    return false;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const success = await registration.unregister();
    
    if (success) {
      logger.info('[SW] Unregistered successfully');
      state.registration = null;
      state.isRegistered = false;
      state.isUpdateAvailable = false;
    }
    
    return success;
  } catch (error) {
    logger.error('[SW] Unregister failed:', error);
    return false;
  }
}

/**
 * Get current service worker registration state
 * 
 * @returns {RegistrationState} Current state
 */
export function getState(): Readonly<RegistrationState> {
  return { ...state } as Readonly<RegistrationState>;
}

/**
 * Check if app is currently offline
 * 
 * @returns {boolean} True if offline
 */
export function isOffline(): boolean {
  return state.isOffline;
}

/**
 * Check if service worker is registered
 * 
 * @returns {boolean} True if registered
 */
export function isRegistered(): boolean {
  return state.isRegistered;
}

/**
 * Check if update is available
 * 
 * @returns {boolean} True if update available
 */
export function isUpdateAvailable(): boolean {
  return state.isUpdateAvailable;
}

/**
 * Send message to service worker
 * 
 * @param message - Message to send
 * @returns Response from service worker
 * 
 * @example
 * ```typescript
 * const version = await sendMessage({ type: 'GET_VERSION' });
 * logger.info('SW version:', version);
 * ```
 */
export type ServiceWorkerMessage<
  TType extends string = string,
  TPayload extends Record<string, unknown> = Record<string, unknown>,
> = {
  type: TType;
} & TPayload;

export async function sendMessage<TMessage extends ServiceWorkerMessage, TResponse = unknown>(
  message: TMessage
): Promise<TResponse> {
  if (!state.registration?.active) {
    throw new Error('No active service worker');
  }
  
  return new Promise((resolve, reject) => {
    const messageChannel = new MessageChannel();
    
    messageChannel.port1.onmessage = (event) => {
      const { data } = event;
      if (data && typeof data === 'object' && 'error' in data) {
        reject((data as { error: unknown }).error);
      } else {
        resolve(data as TResponse);
      }
    };
    
    if (!state.registration?.active) {
      reject(new Error('No active service worker'));
      return;
    }
    state.registration.active.postMessage(message, [messageChannel.port2]);
  });
}

/**
 * Clear all service worker caches
 * Useful for development or troubleshooting
 * 
 * @returns {Promise<void>}
 */
export async function clearCaches(): Promise<void> {
  if (!state.registration?.active) {
    throw new Error('No active service worker');
  }
  
  state.registration.active.postMessage({ type: 'CLEAR_CACHE' });
  logger.info('[SW] Cache clear requested');
}

/**
 * Get service worker version
 * 
 * @returns {Promise<string>} Version string
 */
export async function getVersion(): Promise<string> {
  try {
    const response = await sendMessage<
      { type: 'GET_VERSION' },
      { version?: string }
    >({ type: 'GET_VERSION' });
    return typeof response.version === 'string' ? response.version : 'unknown';
  } catch (error) {
    logger.error('[SW] Failed to get version:', error);
    return 'unknown';
  }
}

