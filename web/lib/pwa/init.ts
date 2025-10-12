/**
 * PWA Initialization Script
 * 
 * This script initializes PWA functionality when the app loads.
 * It should be called early in the application lifecycle.
 */

import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { logger } from '@/lib/utils/logger';

import { initializeServiceWorker } from './service-worker';

/**
 * Initialize PWA functionality
 */
export async function initializePWA(): Promise<void> {
  try {
    // Check if PWA feature is enabled
    if (!isFeatureEnabled('PWA')) {
      logger.info('PWA: Feature is disabled, skipping initialization');
      return;
    }

    logger.info('PWA: Initializing PWA functionality...');

    // Initialize service worker
    const swStatus = await initializeServiceWorker();
    logger.info('PWA: Service worker status:', swStatus);

    // Set up PWA event listeners
    setupPWAEventListeners();

    // Check for updates periodically
    setupUpdateChecks();

    logger.info('PWA: Initialization completed successfully');

  } catch (error) {
    logger.error('PWA: Initialization failed:', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Set up PWA event listeners
 */
function setupPWAEventListeners(): void {
  // Listen for app installation
  window.addEventListener('appinstalled', () => {
    logger.info('PWA: App installed successfully');
    
    // Dispatch custom event for analytics
    window.dispatchEvent(new CustomEvent('pwa-installed', {
      detail: { timestamp: new Date().toISOString() }
    }));
  });

  // Listen for before install prompt
  window.addEventListener('beforeinstallprompt', (event) => {
    logger.info('PWA: Before install prompt event received');
    
    // Dispatch custom event for UI components
    window.dispatchEvent(new CustomEvent('pwa-installable', {
      detail: { event }
    }));
  });

  // Listen for online/offline events
  window.addEventListener('online', () => {
    logger.info('PWA: Connection restored');
    
    // Dispatch custom event for sync components
    window.dispatchEvent(new CustomEvent('pwa-online', {
      detail: { timestamp: new Date().toISOString() }
    }));
  });

  window.addEventListener('offline', () => {
    logger.info('PWA: Connection lost');
    
    // Dispatch custom event for offline components
    window.dispatchEvent(new CustomEvent('pwa-offline', {
      detail: { timestamp: new Date().toISOString() }
    }));
  });

  // Listen for service worker updates
  window.addEventListener('sw-update-available', (event) => {
    logger.info('PWA: Service worker update available');
    
    // Dispatch custom event for update UI
    window.dispatchEvent(new CustomEvent('pwa-update-available', {
      detail: event
    }));
  });
}

/**
 * Set up periodic update checks
 */
function setupUpdateChecks(): void {
  // Check for updates every 30 minutes
  setInterval(async () => {
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.update();
        }
      }
    } catch (error) {
      logger.error('PWA: Update check failed:', error instanceof Error ? error : undefined, { error: error instanceof Error ? error.message : String(error) });
    }
  }, 30 * 60 * 1000); // 30 minutes
}

/**
 * Check PWA support
 */
export function checkPWASupport(): {
  isSupported: boolean;
  features: {
    serviceWorker: boolean;
    pushManager: boolean;
    notifications: boolean;
    installPrompt: boolean;
  };
} {
  const isSupported = 'serviceWorker' in navigator;
  
  return {
    isSupported,
    features: {
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      notifications: 'Notification' in window,
      installPrompt: 'onbeforeinstallprompt' in window
    }
  };
}

/**
 * Get PWA installation criteria
 */
export function getInstallationCriteria(): {
  hasServiceWorker: boolean;
  hasManifest: boolean;
  isHTTPS: boolean;
  isEngaging: boolean;
} {
  return {
    hasServiceWorker: 'serviceWorker' in navigator,
    hasManifest: !!document.querySelector('link[rel="manifest"]'),
    isHTTPS: location.protocol === 'https:' || location.hostname === 'localhost',
    isEngaging: checkEngagement()
  };
}

/**
 * Check if user has been engaging with the app
 */
function checkEngagement(): boolean {
  // Simple engagement check based on session duration
  const sessionStart = sessionStorage.getItem('pwa-session-start');
  if (!sessionStart) {
    sessionStorage.setItem('pwa-session-start', Date.now().toString());
    return false;
  }
  
  const sessionDuration = Date.now() - parseInt(sessionStart);
  return sessionDuration > 30000; // 30 seconds
}

/**
 * Register PWA analytics events
 */
export function trackPWAEvent(eventName: string, properties?: Record<string, any>): void {
  try {
    // This would typically send to your analytics service
    logger.info('PWA: Analytics event', { eventName, properties });
    
    // Dispatch custom event for analytics
    window.dispatchEvent(new CustomEvent('pwa-analytics', {
      detail: { eventName, properties, timestamp: new Date().toISOString() }
    }));
  } catch (error) {
    logger.error('PWA: Failed to track analytics event:', error instanceof Error ? error : undefined, { error: error instanceof Error ? error.message : String(error) });
  }
}
