// PWA Utilities for Choices Platform
// Enhanced WebAuthn, offline functionality, and privacy features

import { isFeatureEnabled } from './feature-flags'
import { devLog } from '@/lib/logger';

export interface PWAConfig {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
}

export interface DeviceFingerprint {
  userAgent: string;
  platform: string;
  screenResolution: string;
  language: string;
  timezone: string;
  webAuthn: boolean;
  serviceWorker: boolean;
  pushNotifications: boolean;
  backgroundSync: boolean;
  installPrompt: boolean;
  offlineStorage: boolean;
  encryptedStorage: boolean;
}

export interface OfflineVote {
  pollId: string;
  choice: number;
  timestamp: number;
  deviceFingerprint: DeviceFingerprint;
}

export interface VerificationChallenge {
  id: string;
  type: 'webauthn' | 'fingerprint' | 'location';
  data: any;
  completed: boolean;
}

// PWA Manager Class
export class PWAManager {
  private registration: ServiceWorkerRegistration | null = null;
  private deferredPrompt: any = null;
  private isOnline = false;
  private pwaEnabled = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      this.pwaEnabled = isFeatureEnabled('pwa');
      this.initialize();
    }
  }

  private async initialize() {
    // Only initialize if PWA feature is enabled
    if (!this.pwaEnabled) {
      devLog('PWA: Feature disabled via feature flags');
      return;
    }

    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        devLog('PWA: Service Worker registered');
        
        // Listen for updates
        this.registration.addEventListener('updatefound', () => {
          const newWorker = this.registration!.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.showUpdatePrompt();
              }
            });
          }
        });
      } catch (error) {
        devLog('PWA: Service Worker registration failed', error);
      }
    }

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallPrompt();
    });

    // Listen for online/offline changes
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.onOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.onOffline();
    });
  }

  // Show PWA install prompt
  showInstallPrompt() {
    const installButton = document.getElementById('install-pwa');
    if (installButton) {
      installButton.style.display = 'block';
    }
  }

  // Show PWA update prompt
  showUpdatePrompt() {
    const updateButton = document.getElementById('update-pwa');
    if (updateButton) {
      updateButton.style.display = 'block';
    }
  }

  // Handle online event
  private onOnline() {
    devLog('PWA: Back online, syncing data...');
    this.syncOfflineData();
  }

  // Handle offline event
  private onOffline() {
    devLog('PWA: Gone offline, enabling offline mode...');
  }

  // Sync offline data when back online
  private async syncOfflineData() {
    try {
      const offlineVotes = this.getOfflineVotes();
      if (offlineVotes.length > 0) {
        devLog(`PWA: Syncing ${offlineVotes.length} offline votes...`);
        
        // Here you would send the offline votes to the server
        // For now, we'll just clear them
        this.clearOfflineVotes();
      }
    } catch (error) {
      devLog('PWA: Failed to sync offline data:', error);
    }
  }

  // Get device fingerprint
  async getDeviceFingerprint(): Promise<DeviceFingerprint> {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      webAuthn: 'credentials' in navigator,
      serviceWorker: 'serviceWorker' in navigator,
      pushNotifications: 'PushManager' in window,
      backgroundSync: 'serviceWorker' in navigator && 'sync' in (navigator.serviceWorker as any),
      installPrompt: 'beforeinstallprompt' in window,
      offlineStorage: 'indexedDB' in window,
      encryptedStorage: 'crypto' in window && 'subtle' in (window as any).crypto
    };
  }

  // Store offline vote
  async storeOfflineVote(vote: Omit<OfflineVote, 'timestamp' | 'deviceFingerprint'>) {
    if (!this.pwaEnabled) {
      devLog('PWA: Feature disabled, cannot store offline vote');
      return;
    }

    const deviceFingerprint = await this.getDeviceFingerprint();
    const offlineVote: OfflineVote = {
      ...vote,
      timestamp: Date.now(),
      deviceFingerprint
    };

    const offlineVotes = this.getOfflineVotes();
    offlineVotes.push(offlineVote);
    localStorage.setItem('offline_votes', JSON.stringify(offlineVotes));
    
    devLog('PWA: Offline vote stored:', offlineVote);
  }

  // Get offline votes
  getOfflineVotes(): OfflineVote[] {
    try {
      const stored = localStorage.getItem('offline_votes');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      devLog('PWA: Failed to get offline votes:', error);
      return [];
    }
  }

  // Clear offline votes
  clearOfflineVotes() {
    localStorage.removeItem('offline_votes');
    devLog('PWA: Offline votes cleared');
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (!this.pwaEnabled) {
      devLog('PWA: Feature disabled, cannot request notifications');
      return false;
    }

    if (!('Notification' in window)) {
      devLog('PWA: Notifications not supported');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Subscribe to push notifications
  async subscribeToPushNotifications(): Promise<boolean> {
    if (!this.pwaEnabled || !this.registration) {
      devLog('PWA: Cannot subscribe to push notifications');
      return false;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: new Uint8Array(this.urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''))
      });
      
      devLog('PWA: Push notification subscription successful');
      return true;
    } catch (error) {
      devLog('PWA: Push notification subscription failed:', error);
      return false;
    }
  }

  // Convert VAPID key
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

  // Check if PWA is installed
  isInstalled(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches;
  }

  // Check if online
  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Get PWA status
  getPWAStatus() {
    return {
      enabled: this.pwaEnabled,
      installed: this.isInstalled(),
      online: this.isOnlineStatus(),
      serviceWorker: !!this.registration,
      offlineVotes: this.getOfflineVotes().length
    };
  }
}

// WebAuthn Manager
export class PWAWebAuthn {
  private pwaEnabled = false;

  constructor() {
    this.pwaEnabled = isFeatureEnabled('pwa');
  }

  // Register user with WebAuthn
  async registerUser(userId: string): Promise<any> {
    if (!this.pwaEnabled) {
      throw new Error('PWA feature is disabled');
    }

    if (!('credentials' in navigator)) {
      throw new Error('WebAuthn not supported');
    }

    try {
      const challenge = await this.generateChallenge();
      
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: challenge,
          rp: {
            name: 'Choices Platform',
            id: window.location.hostname
          },
          user: {
            id: new Uint8Array(16),
            name: userId,
            displayName: userId
          },
          pubKeyCredParams: [
            {
              type: 'public-key',
              alg: -7
            }
          ],
          timeout: 60000,
          attestation: 'direct'
        }
      });

      return credential;
    } catch (error) {
      devLog('WebAuthn registration failed:', error);
      throw error;
    }
  }

  // Authenticate user with WebAuthn
  async authenticateUser(userId: string): Promise<any> {
    if (!this.pwaEnabled) {
      throw new Error('PWA feature is disabled');
    }

    if (!('credentials' in navigator)) {
      throw new Error('WebAuthn not supported');
    }

    try {
      const challenge = await this.generateChallenge();
      
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: challenge,
          rpId: window.location.hostname,
          timeout: 60000,
          userVerification: 'preferred'
        }
      });

      return assertion;
    } catch (error) {
      devLog('WebAuthn authentication failed:', error);
      throw error;
    }
  }

  // Generate challenge
  private async generateChallenge(): Promise<ArrayBuffer> {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return array.buffer;
  }
}

// Privacy Storage Manager
export class PrivacyStorage {
  private pwaEnabled = false;

  constructor() {
    this.pwaEnabled = isFeatureEnabled('pwa');
  }

  // Store encrypted data
  async storeEncryptedData(key: string, data: any): Promise<void> {
    if (!this.pwaEnabled) {
      devLog('PWA: Feature disabled, cannot store encrypted data');
      return;
    }

    if (!('crypto' in window) || !('subtle' in (window as any).crypto)) {
      devLog('PWA: Crypto API not supported');
      return;
    }

    try {
      const cryptoKey = await this.getOrCreateKey();
      const encodedData = new TextEncoder().encode(JSON.stringify(data));
      const encryptedData = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: new Uint8Array(12) },
        cryptoKey,
        encodedData
      );

      localStorage.setItem(`encrypted_${key}`, JSON.stringify(Array.from(new Uint8Array(encryptedData))));
    } catch (error) {
      devLog('PWA: Failed to store encrypted data:', error);
    }
  }

  // Get encrypted data
  async getEncryptedData(key: string): Promise<any> {
    if (!this.pwaEnabled) {
      devLog('PWA: Feature disabled, cannot retrieve encrypted data');
      return null;
    }

    if (!('crypto' in window) || !('subtle' in (window as any).crypto)) {
      devLog('PWA: Crypto API not supported');
      return null;
    }

    try {
      const stored = localStorage.getItem(`encrypted_${key}`);
      if (!stored) return null;

      const cryptoKey = await this.getOrCreateKey();
      const encryptedData = new Uint8Array(JSON.parse(stored));
      const decryptedData = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(12) },
        cryptoKey,
        encryptedData
      );

      return JSON.parse(new TextDecoder().decode(decryptedData));
    } catch (error) {
      devLog('PWA: Failed to retrieve encrypted data:', error);
      return null;
    }
  }

  // Get or create crypto key
  private async getOrCreateKey(): Promise<CryptoKey> {
    const keyName = 'pwa-encryption-key';
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(keyName),
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );

    return key;
  }

  // Clear encrypted data
  clearEncryptedData(key: string): void {
    localStorage.removeItem(`encrypted_${key}`);
  }

  // Clear all encrypted data
  clearAllEncryptedData(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('encrypted_')) {
        localStorage.removeItem(key);
      }
    });
  }
}

// Create instances
export const pwaManager = new PWAManager();
export const pwaWebAuthn = new PWAWebAuthn();
export const privacyStorage = new PrivacyStorage();
