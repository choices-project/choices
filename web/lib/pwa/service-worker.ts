/**
 * PWA Service Worker Registration and Management
 * 
 * Handles service worker registration, updates, and communication
 * with the main application thread.
 */

import { logger } from '@/lib/utils/logger';

export interface ServiceWorkerStatus {
  [key: string]: unknown;
  isSupported: boolean;
  isRegistered: boolean;
  isActive: boolean;
  isInstalling: boolean;
  isWaiting: boolean;
  registration?: ServiceWorkerRegistration;
  error?: string;
}

export interface ServiceWorkerMessage {
  type: string;
  data?: any;
}

class ServiceWorkerManager {
  private registration: ServiceWorkerRegistration | null = null;
  private updateAvailable = false;
  private listeners: Array<(status: ServiceWorkerStatus) => void> = [];

  /**
   * Check if service workers are supported
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  /**
   * Register the service worker
   */
  async register(): Promise<ServiceWorkerStatus> {
    if (!this.isSupported()) {
      const status: ServiceWorkerStatus = {
        isSupported: false,
        isRegistered: false,
        isActive: false,
        isInstalling: false,
        isWaiting: false,
        error: 'Service workers are not supported in this browser'
      };
      this.notifyListeners(status);
      return status;
    }

    try {
      logger.info('PWA: Registering service worker...');
      
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      logger.info('PWA: Service worker registered successfully');

      // Set up event listeners
      this.setupEventListeners();

      const status = await this.getStatus();
      this.notifyListeners(status);
      return status;

    } catch (error) {
      logger.error('PWA: Service worker registration failed:', error instanceof Error ? error : undefined, { error: error instanceof Error ? error.message : String(error) });
      
      const status: ServiceWorkerStatus = {
        isSupported: true,
        isRegistered: false,
        isActive: false,
        isInstalling: false,
        isWaiting: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      this.notifyListeners(status);
      return status;
    }
  }

  /**
   * Unregister the service worker
   */
  async unregister(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      const result = await this.registration.unregister();
      this.registration = null;
      logger.info('PWA: Service worker unregistered');
      return result;
    } catch (error) {
      logger.error('PWA: Failed to unregister service worker:', error instanceof Error ? error : undefined, { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  /**
   * Get current service worker status
   */
  async getStatus(): Promise<ServiceWorkerStatus> {
    if (!this.isSupported()) {
      return {
        isSupported: false,
        isRegistered: false,
        isActive: false,
        isInstalling: false,
        isWaiting: false
      };
    }

    if (!this.registration) {
      return {
        isSupported: true,
        isRegistered: false,
        isActive: false,
        isInstalling: false,
        isWaiting: false
      };
    }

    const status: ServiceWorkerStatus = {
      isSupported: true,
      isRegistered: true,
      isActive: !!this.registration.active,
      isInstalling: !!this.registration.installing,
      isWaiting: !!this.registration.waiting,
      registration: this.registration
    };

    return status;
  }

  /**
   * Check for service worker updates
   */
  async checkForUpdates(): Promise<boolean> {
    if (!this.registration) {
      return false;
    }

    try {
      await this.registration.update();
      return this.updateAvailable;
    } catch (error) {
      logger.error('PWA: Failed to check for updates:', error instanceof Error ? error : undefined, { error: error instanceof Error ? error.message : String(error) });
      return false;
    }
  }

  /**
   * Skip waiting and activate new service worker
   */
  async skipWaiting(): Promise<void> {
    if (!this.registration?.waiting) {
      return;
    }

    // Send message to waiting service worker
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // Reload the page to activate the new service worker
    window.location.reload();
  }

  /**
   * Send message to service worker
   */
  async sendMessage(message: ServiceWorkerMessage): Promise<any> {
    if (!this.registration?.active) {
      throw new Error('No active service worker');
    }

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      this.registration!.active!.postMessage(message, [messageChannel.port2]);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        reject(new Error('Message timeout'));
      }, 5000);
    });
  }

  /**
   * Get service worker version
   */
  async getVersion(): Promise<string | null> {
    try {
      const response = await this.sendMessage({ type: 'GET_VERSION' });
      return response.version || null;
    } catch (error) {
      logger.error('PWA: Failed to get service worker version:', error instanceof Error ? error : undefined, { error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  /**
   * Subscribe to service worker status changes
   */
  subscribe(listener: (status: ServiceWorkerStatus) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Set up service worker event listeners
   */
  private setupEventListeners(): void {
    if (!this.registration) {
      return;
    }

    // Handle service worker updates
    this.registration.addEventListener('updatefound', () => {
      logger.info('PWA: Service worker update found');
      
      const newWorker = this.registration!.installing;
      if (!newWorker) {
        return;
      }

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed') {
          if (navigator.serviceWorker.controller) {
            // New service worker is waiting
            this.updateAvailable = true;
            logger.info('PWA: New service worker is waiting');
            this.notifyUpdateAvailable();
          } else {
            // Service worker is active
            logger.info('PWA: Service worker is now active');
            this.updateAvailable = false;
          }
        }
      });
    });

    // Handle controller change
    navigator.serviceWorker.addEventListener('controllerchange', async () => {
      logger.info('PWA: Service worker controller changed');
      this.updateAvailable = false;
      this.notifyListeners(await this.getStatus());
    });
  }

  /**
   * Notify listeners of status changes
   */
  private notifyListeners(status: ServiceWorkerStatus): void {
    this.listeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        logger.error('PWA: Error in status listener:', error instanceof Error ? error : undefined, { error: error instanceof Error ? error.message : String(error) });
      }
    });
  }

  /**
   * Notify that an update is available
   */
  private notifyUpdateAvailable(): void {
    // Dispatch custom event for update available
    window.dispatchEvent(new CustomEvent('sw-update-available', {
      detail: { registration: this.registration }
    }));
  }
}

// Create singleton instance
export const serviceWorkerManager = new ServiceWorkerManager();

/**
 * Initialize service worker
 */
export async function initializeServiceWorker(): Promise<ServiceWorkerStatus> {
  return await serviceWorkerManager.register();
}

/**
 * Check if service worker is supported
 */
export function isServiceWorkerSupported(): boolean {
  return serviceWorkerManager.isSupported();
}

/**
 * Get service worker status
 */
export async function getServiceWorkerStatus(): Promise<ServiceWorkerStatus> {
  return await serviceWorkerManager.getStatus();
}

/**
 * Check for service worker updates
 */
export async function checkServiceWorkerUpdates(): Promise<boolean> {
  return await serviceWorkerManager.checkForUpdates();
}

/**
 * Skip waiting and activate new service worker
 */
export async function skipServiceWorkerWaiting(): Promise<void> {
  return await serviceWorkerManager.skipWaiting();
}

/**
 * Subscribe to service worker status changes
 */
export function subscribeToServiceWorkerStatus(
  listener: (status: ServiceWorkerStatus) => void
): () => void {
  return serviceWorkerManager.subscribe(listener);
}
