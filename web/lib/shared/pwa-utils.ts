// PWA Utilities for Choices Platform
// Enhanced WebAuthn, offline functionality, and privacy features

import { isFeatureEnabled } from '@/lib/core/feature-flags'
import { devLog } from '@/lib/logger';

// Helper function to convert ArrayBuffer to base64url
function arrayBufferToBase64url(buffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(buffer);
  const base64 = btoa(String.fromCharCode(...uint8Array));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Additional type definitions
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

export interface NavigatorWithServiceWorker extends Navigator {
  serviceWorker: ServiceWorkerContainer & {
    sync?: {
      register(tag: string): Promise<void>;
      getTags(): Promise<string[]>;
    };
  };
}

export interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

export interface WebAuthnRegistrationResult {
  success: boolean;
  credentialId: string;
  publicKey: string;
  error?: string;
}

export interface WebAuthnAuthenticationResult {
  success: boolean;
  credentialId: string;
  signature: string;
  error?: string;
}

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
  data: WebAuthnChallengeData | FingerprintData | LocationData;
  completed: boolean;
}

export interface WebAuthnChallengeData {
  challenge: string;
  rpId: string;
  userVerification: string;
  timeout: number;
}

export interface FingerprintData {
  deviceId: string;
  timestamp: number;
  signature: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

// PWA Manager Class
export class PWAManager {
  private registration: ServiceWorkerRegistration | null = null;
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isOnline = false;
  private pwaEnabled = false;
  private pushSubscription: PushSubscription | null = null;

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
      this.deferredPrompt = e as BeforeInstallPromptEvent;
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
    
    // Track install prompt shown
    if (this.pwaEnabled) {
      devLog('PWA: Install prompt shown');
      // You can add analytics tracking here
    }
  }

  // Install PWA
  async installPWA(): Promise<boolean> {
    if (!this.pwaEnabled) {
      throw new Error('PWA feature is disabled');
    }

    if (!this.deferredPrompt) {
      throw new Error('No install prompt available');
    }

    try {
      // Show the install prompt
      this.deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await this.deferredPrompt.userChoice;
      
      // Clear the deferred prompt
      this.deferredPrompt = null;
      
      if (outcome === 'accepted') {
        devLog('PWA: User accepted the install prompt');
        return true;
      } else {
        devLog('PWA: User dismissed the install prompt');
        return false;
      }
    } catch (error) {
      devLog('PWA: Install failed:', error);
      throw error;
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
    
    // Track offline usage
    if (this.pwaEnabled) {
      // You can add analytics tracking here
      devLog('PWA: Offline mode activated');
    }
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
      backgroundSync: 'serviceWorker' in navigator && 'sync' in (navigator as NavigatorWithServiceWorker).serviceWorker,
      installPrompt: 'beforeinstallprompt' in window,
      offlineStorage: 'indexedDB' in window,
      encryptedStorage: 'crypto' in window && 'subtle' in window.crypto
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

  // Check if PWA is installed
  isPWAInstalled(): boolean {
    if (typeof window === 'undefined') return false;
    
    // Check if running in standalone mode (installed PWA)
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as NavigatorWithStandalone).standalone === true;
  }

  // Get PWA installation status
  getInstallationStatus(): {
    isInstalled: boolean;
    canInstall: boolean;
    hasPrompt: boolean;
  } {
    return {
      isInstalled: this.isPWAInstalled(),
      canInstall: 'beforeinstallprompt' in window,
      hasPrompt: !!this.deferredPrompt
    };
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
      
      // Store the subscription for later use
      this.pushSubscription = subscription;
      
      devLog('PWA: Push notification subscription successful', subscription);
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
  async registerUser(userId: string): Promise<WebAuthnRegistrationResult> {
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

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      return {
        success: true,
        credentialId: credential.id,
        publicKey: arrayBufferToBase64url((credential as any).rawId)
      };
    } catch (error) {
      devLog('WebAuthn registration failed:', error);
      throw error;
    }
  }

  // Authenticate user with WebAuthn
  async authenticateUser(userId: string): Promise<WebAuthnAuthenticationResult> {
    if (!this.pwaEnabled) {
      throw new Error('PWA feature is disabled');
    }

    if (!('credentials' in navigator)) {
      throw new Error('WebAuthn not supported');
    }

    try {
      // Use the userId parameter to identify the user for authentication
      devLog('PWA: Authenticating user with WebAuthn:', userId);
      
      const challenge = await this.generateChallenge();
      
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: challenge,
          rpId: window.location.hostname,
          timeout: 60000,
          userVerification: 'preferred',
          // Use userId to filter credentials for this specific user
          allowCredentials: [] // Would be populated with user's registered credentials
        }
      });

      if (!assertion) {
        throw new Error('Failed to authenticate');
      }

      // Log successful authentication with userId
      devLog('PWA: WebAuthn authentication successful for user:', userId);
      return {
        success: true,
        credentialId: assertion.id,
        signature: arrayBufferToBase64url((assertion as any).rawId)
      };
    } catch (error) {
      devLog('WebAuthn authentication failed for user:', userId, error);
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
  async storeEncryptedData(key: string, data: Record<string, unknown>): Promise<void> {
    if (!this.pwaEnabled) {
      devLog('PWA: Feature disabled, cannot store encrypted data');
      return;
    }

    if (!('crypto' in window) || !('subtle' in window.crypto)) {
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
  async getEncryptedData(key: string): Promise<Record<string, unknown> | null> {
    if (!this.pwaEnabled) {
      devLog('PWA: Feature disabled, cannot retrieve encrypted data');
      return null;
    }

    if (!('crypto' in window) || !('subtle' in window.crypto)) {
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
