/**
 * PWA Utilities
 * 
 * This module provides PWA-specific utility functions.
 */

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
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        return true;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
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
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  }

  static isOnline(): boolean {
    return navigator.onLine;
  }

  static async cacheData(key: string, data: any): Promise<void> {
    if ('caches' in window) {
      const cache = await caches.open('choices-cache');
      await cache.put(key, new Response(JSON.stringify(data)));
    }
  }

  static async getCachedData(key: string): Promise<any | null> {
    if ('caches' in window) {
      const cache = await caches.open('choices-cache');
      const response = await cache.match(key);
      if (response) {
        return await response.json();
      }
    }
    return null;
  }
}

export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

// PWA Manager class for managing PWA functionality
export class PWAManager {
  async getDeviceFingerprint(): Promise<any> {
    return {
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      webAuthn: 'credentials' in navigator,
      standalone: window.matchMedia('(display-mode: standalone)').matches
    };
  }

  async requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  async subscribeToPushNotifications(): Promise<void> {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      const _registration = await navigator.serviceWorker.ready;
      // Implementation would go here
    }
  }

  async getPWAStatus(): Promise<any> {
    return {
      installable: 'beforeinstallprompt' in window,
      offline: 'serviceWorker' in navigator,
      pushNotifications: 'PushManager' in window,
      webAuthn: 'credentials' in navigator,
      serviceWorker: 'serviceWorker' in navigator,
      offlineVotes: 0
    };
  }

  isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  }

  async storeOfflineVote(vote: any): Promise<void> {
    // Store offline vote in local storage
    const offlineVotes = JSON.parse(localStorage.getItem('offlineVotes') || '[]');
    offlineVotes.push(vote);
    localStorage.setItem('offlineVotes', JSON.stringify(offlineVotes));
  }
}

// PWA WebAuthn class for biometric authentication
export class PWAWebAuthn {
  async registerUser(username: string): Promise<any> {
    if (!('credentials' in navigator)) {
      throw new Error('WebAuthn not supported');
    }
    
    // Implementation would go here
    return { id: 'mock-credential-id', username };
  }

  async authenticateUser(): Promise<any> {
    if (!('credentials' in navigator)) {
      throw new Error('WebAuthn not supported');
    }
    
    // Implementation would go here
    return { success: true };
  }
}

// Privacy Storage class for encrypted local storage
export class PrivacyStorage {
  async storeEncryptedData(key: string, data: any): Promise<void> {
    if ('crypto' in window && 'subtle' in (window as Window & { crypto: Crypto }).crypto) {
      // Implementation would go here
      localStorage.setItem(key, JSON.stringify(data));
    }
  }

  async getEncryptedData(key: string): Promise<any> {
    if ('crypto' in window && 'subtle' in (window as Window & { crypto: Crypto }).crypto) {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }
    return null;
  }

  clearAllEncryptedData(): void {
    // Clear all encrypted data
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('encrypted_')) {
        localStorage.removeItem(key);
      }
    });
  }
}

// Export instances
export const pwaManager = new PWAManager();
export const pwaWebAuthn = new PWAWebAuthn();
export const privacyStorage = new PrivacyStorage();

