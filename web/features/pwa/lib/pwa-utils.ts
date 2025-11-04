/**
 * PWA Utilities
 * 
 * This module provides PWA-specific utility functions.
 */

import { logger } from '@/lib/utils/logger';

export type PWAConfig = {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  display: 'standalone' | 'fullscreen' | 'minimal-ui';
  orientation: 'portrait' | 'landscape' | 'any';
  startUrl: string;
  scope: string;
  icons: Array<{
    src: string;
    sizes: string;
    type: string;
    purpose?: 'any' | 'maskable';
  }>;
}

export const defaultPWAConfig: PWAConfig = {
  name: 'Choices',
  shortName: 'Choices',
  description: 'A democratic polling platform',
  themeColor: '#3b82f6',
  backgroundColor: '#ffffff',
  display: 'standalone',
  orientation: 'portrait',
  startUrl: '/',
  scope: '/',
  icons: [
    {
      src: '/icons/icon-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: '/icons/icon-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any'
    }
  ]
};

export class PWAUtils {
  static async registerServiceWorker(): Promise<boolean> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        logger.info('Service Worker registered:', { scope: registration.scope, active: !!registration.active });
        return true;
      } catch (error) {
        logger.error('Service Worker registration failed:', error instanceof Error ? error : new Error(String(error)));
        return false;
      }
    }
    return false;
  }

  static async installPrompt(): Promise<BeforeInstallPromptEvent | null> {
    if ('serviceWorker' in navigator) {
      return new Promise((resolve) => {
        window.addEventListener('beforeinstallprompt', (e) => {
          e.preventDefault();
          resolve(e as BeforeInstallPromptEvent);
        });
      });
    }
    return null;
  }

  static isPWAInstalled(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  }

  static isOnline(): boolean {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  }

  static async cacheData(key: string, data: any): Promise<void> {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cache = await caches.open('choices-cache');
      await cache.put(key, new Response(JSON.stringify(data)));
    }
  }

  static async getCachedData(key: string): Promise<unknown> {
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cache = await caches.open('choices-cache');
      const response = await cache.match(key);
      if (response) {
        return await response.json();
      }
    }
    return null;
  }
}

export type BeforeInstallPromptEvent = {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
} & Event

// PWA event types for TypeScript

// PWA Manager class for managing PWA functionality
export class PWAManager {
  getDeviceFingerprint(): Promise<any> {
    if (typeof window === 'undefined') {
      return Promise.resolve({
        platform: 'server',
        screenResolution: '0x0',
        language: 'en',
        timezone: 'UTC',
        webAuthn: false,
        standalone: false
      });
    }
    
    return Promise.resolve({
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      webAuthn: 'credentials' in navigator,
      standalone: window.matchMedia('(display-mode: standalone)').matches
    });
  }

  async requestNotificationPermission(): Promise<boolean> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  async subscribeToPushNotifications(): Promise<void> {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      
      // Use existing push notification subscription flow
      try {
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null
        });
        
        // Send subscription to existing server endpoint
        await fetch('/api/pwa/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subscription)
        });
        
        logger.info('Push notifications enabled:', { endpoint: subscription.endpoint });
      } catch (error) {
        logger.error('Failed to subscribe to push notifications:', error instanceof Error ? error : new Error(String(error)));
      }
    }
  }

  getPWAStatus(): Promise<any> {
    if (typeof window === 'undefined') {
      return Promise.resolve({
        installable: false,
        offline: false,
        pushNotifications: false,
        webAuthn: false,
        serviceWorker: false,
        offlineVotes: 0
      });
    }
    
    return Promise.resolve({
      installable: 'beforeinstallprompt' in window,
      offline: 'serviceWorker' in navigator,
      pushNotifications: 'PushManager' in window,
      webAuthn: 'credentials' in navigator,
      serviceWorker: 'serviceWorker' in navigator,
      offlineVotes: 0
    });
  }

  isInstalled(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  }

  storeOfflineVote(vote: any): Promise<void> {
    // Store offline vote in local storage
    const offlineVotes = JSON.parse(localStorage.getItem('offlineVotes') ?? '[]');
    offlineVotes.push(vote);
    localStorage.setItem('offlineVotes', JSON.stringify(offlineVotes));
    return Promise.resolve();
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// PWA WebAuthn class - delegates to existing WebAuthn implementation
export class PWAWebAuthn {
  // Use existing WebAuthn implementation instead of duplicating
  async registerUser(username: string): Promise<any> {
    // Delegate to existing WebAuthn registration flow
    const response = await fetch('/api/v1/auth/webauthn/register/options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error('Failed to get registration options');
    }
    
    const options = await response.json();
    return navigator.credentials.create({ publicKey: options });
  }

  async authenticateUser(): Promise<any> {
    // Delegate to existing WebAuthn authentication flow
    const response = await fetch('/api/v1/auth/webauthn/authenticate/options', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (!response.ok) {
      throw new Error('Failed to get authentication options');
    }
    
    const options = await response.json();
    return navigator.credentials.get({ publicKey: options });
  }
}

// Privacy Storage class - delegates to existing encryption system
export class PrivacyStorage {
  // Use existing encryption system instead of duplicating
  async storeEncryptedData(key: string, data: any): Promise<void> {
    try {
      // Delegate to existing privacy data management system
      const response = await fetch('/api/privacy/encrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, data })
      });
      
      if (!response.ok) {
        throw new Error('Failed to encrypt data');
      }
      
      const result = await response.json();
      localStorage.setItem(key, result.encryptedData);
    } catch (error) {
      logger.error('Failed to encrypt data:', error instanceof Error ? error : new Error(String(error)));
      // Fallback to unencrypted storage
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  async getEncryptedData(key: string): Promise<any> {
    try {
      const encryptedData = localStorage.getItem(key);
      if (!encryptedData) return null;
      
      // Delegate to existing decryption system
      const response = await fetch('/api/privacy/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, encryptedData })
      });
      
      if (!response.ok) {
        throw new Error('Failed to decrypt data');
      }
      
      return await response.json();
    } catch (error) {
      logger.error('Failed to decrypt data:', error instanceof Error ? error : new Error(String(error)));
      // Fallback to unencrypted data
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }
  }

  clearAllEncryptedData(): void {
    // Clear all encrypted data
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('pwa_encrypted_')) {
        localStorage.removeItem(key);
      }
    });
  }
}

// Export instances
export const pwaManager = new PWAManager();
export const pwaWebAuthn = new PWAWebAuthn();
export const privacyStorage = new PrivacyStorage();

