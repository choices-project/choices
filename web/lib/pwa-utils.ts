// PWA Utilities for Choices Platform
// Enhanced WebAuthn, offline functionality, and privacy features

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
  language: string;
  timezone: string;
  screenResolution: string;
  colorDepth: number;
  hardwareConcurrency: number;
  deviceMemory?: number;
  // PWA-specific
  installPrompt: boolean;
  standalone: boolean;
  serviceWorker: boolean;
  webAuthn: boolean;
  pushNotifications: boolean;
  backgroundSync: boolean;
}

export interface OfflineVote {
  pollId: string;
  choice: number;
  timestamp: number;
  offline: boolean;
  deviceFingerprint?: DeviceFingerprint;
}

export interface OfflineBehavior {
  action: string;
  metadata: Record<string, any>;
  timestamp: number;
  offline: boolean;
  deviceFingerprint?: DeviceFingerprint;
}

export interface VerificationChallenge {
  id: string;
  type: 'captcha' | 'behavior' | 'social';
  data: any;
  expiresAt: number;
  completed: boolean;
}

// PWA Manager Class
export class PWAManager {
  private registration: ServiceWorkerRegistration | null = null;
  private deferredPrompt: any = null;
  private isOnline = navigator.onLine;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private async initialize() {
    // Register service worker
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('PWA: Service Worker registered');
        
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
        console.error('PWA: Service Worker registration failed', error);
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
    if (installButton && this.deferredPrompt) {
      installButton.style.display = 'block';
      installButton.addEventListener('click', async () => {
        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          console.log('PWA: Installed successfully');
          installButton.style.display = 'none';
        }
        this.deferredPrompt = null;
      });
    }
  }

  // Show update prompt
  showUpdatePrompt() {
    const updateButton = document.getElementById('update-pwa');
    if (updateButton) {
      updateButton.style.display = 'block';
      updateButton.addEventListener('click', () => {
        if (this.registration && this.registration.waiting) {
          this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
      });
    }
  }

  // Handle online event
  private onOnline() {
    console.log('PWA: Back online, syncing data...');
    this.syncOfflineData();
  }

  // Handle offline event
  private onOffline() {
    console.log('PWA: Gone offline');
    this.showOfflineIndicator();
  }

  // Show offline indicator
  private showOfflineIndicator() {
    const indicator = document.getElementById('offline-indicator');
    if (indicator) {
      indicator.style.display = 'block';
    }
  }

  // Sync offline data
  private async syncOfflineData() {
    if (this.registration && 'sync' in this.registration) {
      try {
        await (this.registration as any).sync.register('offline-votes');
        await (this.registration as any).sync.register('offline-verification');
        await (this.registration as any).sync.register('offline-behavior');
      } catch (error) {
        console.error('PWA: Background sync registration failed', error);
      }
    }
  }

  // Get device fingerprint
  async getDeviceFingerprint(): Promise<DeviceFingerprint> {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      deviceMemory: (navigator as any).deviceMemory,
      installPrompt: 'beforeinstallprompt' in window,
      standalone: window.matchMedia('(display-mode: standalone)').matches,
      serviceWorker: 'serviceWorker' in navigator,
      webAuthn: 'credentials' in navigator,
      pushNotifications: 'PushManager' in window,
      backgroundSync: 'serviceWorker' in navigator && 'sync' in (navigator.serviceWorker as any)
    };
  }

  // Store offline vote
  async storeOfflineVote(vote: Omit<OfflineVote, 'timestamp' | 'offline'>) {
    if (this.registration) {
      const deviceFingerprint = await this.getDeviceFingerprint();
      const offlineVote: OfflineVote = {
        ...vote,
        timestamp: Date.now(),
        offline: true,
        deviceFingerprint
      };

      this.registration.active?.postMessage({
        type: 'STORE_OFFLINE_VOTE',
        payload: offlineVote
      });
    }
  }

  // Store offline behavior
  async storeOfflineBehavior(behavior: Omit<OfflineBehavior, 'timestamp' | 'offline'>) {
    if (this.registration) {
      const deviceFingerprint = await this.getDeviceFingerprint();
      const offlineBehavior: OfflineBehavior = {
        ...behavior,
        timestamp: Date.now(),
        offline: true,
        deviceFingerprint
      };

      this.registration.active?.postMessage({
        type: 'STORE_OFFLINE_BEHAVIOR',
        payload: offlineBehavior
      });
    }
  }

  // Request push notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('PWA: Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('PWA: Notification permission denied');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Subscribe to push notifications
  async subscribeToPushNotifications(): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.error('PWA: Service Worker not registered');
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        // applicationServerKey: this.urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '') as unknown as Uint8Array
      });

      console.log('PWA: Push notification subscription successful');
      return subscription;
    } catch (error) {
      console.error('PWA: Push notification subscription failed', error);
      return null;
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
}

// Enhanced WebAuthn Manager for PWA
export class PWAWebAuthnManager {
  private pwaManager: PWAManager;

  constructor(pwaManager: PWAManager) {
    this.pwaManager = pwaManager;
  }

  // Register user with enhanced WebAuthn
  async registerUser(pseudonym: string): Promise<Credential | null> {
    try {
      const deviceFingerprint = await this.pwaManager.getDeviceFingerprint();
      
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: this.generateChallenge(),
          rp: {
            name: "Choices",
            id: window.location.hostname
          },
          user: {
            id: this.generateUserId(),
            name: pseudonym,
            displayName: pseudonym
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" } // ES256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform", // Forces device credential
            requireResidentKey: true,
            userVerification: "required"
          },
          extensions: {
            appid: window.location.origin
          },
          timeout: 60000 // 60 seconds
        }
      });

      console.log('PWA WebAuthn: Registration successful');
      return credential;
    } catch (error) {
      console.error('PWA WebAuthn: Registration failed', error);
      return null;
    }
  }

  // Authenticate user with enhanced WebAuthn
  async authenticateUser(credentialId: ArrayBuffer): Promise<Credential | null> {
    try {
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: this.generateChallenge(),
          rpId: window.location.hostname,
          allowCredentials: [
            {
              type: "public-key",
              id: credentialId,
              transports: ["internal"]
            }
          ],
          userVerification: "required",
          timeout: 60000
        }
      });

      console.log('PWA WebAuthn: Authentication successful');
      return credential;
    } catch (error) {
      console.error('PWA WebAuthn: Authentication failed', error);
      return null;
    }
  }

  // Generate challenge
  private generateChallenge(): ArrayBuffer {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return array.buffer;
  }

  // Generate user ID
  private generateUserId(): ArrayBuffer {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return array.buffer;
  }
}

// Privacy-First Storage Manager
export class PrivacyStorageManager {
  private encryptionKey: CryptoKey | null = null;

  constructor() {
    this.initializeEncryption();
  }

  // Initialize encryption
  private async initializeEncryption() {
    try {
      this.encryptionKey = await crypto.subtle.generateKey(
        {
          name: "AES-GCM",
          length: 256
        },
        true,
        ["encrypt", "decrypt"]
      );
    } catch (error) {
      console.error('Privacy Storage: Encryption initialization failed', error);
    }
  }

  // Store encrypted data locally
  async storeEncryptedData(key: string, data: any): Promise<void> {
    if (!this.encryptionKey) {
      console.error('Privacy Storage: Encryption not initialized');
      return;
    }

    try {
      const jsonData = JSON.stringify(data);
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(jsonData);

      const iv = crypto.getRandomValues(new Uint8Array(12));
      const encryptedData = await crypto.subtle.encrypt(
        {
          name: "AES-GCM",
          iv: iv
        },
        this.encryptionKey,
        dataBuffer
      );

      const encryptedArray = new Uint8Array(encryptedData);
      const combined = new Uint8Array(iv.length + encryptedArray.length);
      combined.set(iv);
      combined.set(Array.from(encryptedArray), iv.length);

      localStorage.setItem(key, btoa(String.fromCharCode.apply(null, Array.from(combined))));
    } catch (error) {
      console.error('Privacy Storage: Encryption failed', error);
    }
  }

  // Retrieve encrypted data
  async getEncryptedData(key: string): Promise<any | null> {
    if (!this.encryptionKey) {
      console.error('Privacy Storage: Encryption not initialized');
      return null;
    }

    try {
      const encryptedString = localStorage.getItem(key);
      if (!encryptedString) return null;

      const combined = new Uint8Array(
        atob(encryptedString).split('').map(char => char.charCodeAt(0))
      );

      const iv = combined.slice(0, 12);
      const encryptedData = combined.slice(12);

      const decryptedData = await crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv
        },
        this.encryptionKey,
        encryptedData
      );

      const decoder = new TextDecoder();
      const jsonData = decoder.decode(decryptedData);
      return JSON.parse(jsonData);
    } catch (error) {
      console.error('Privacy Storage: Decryption failed', error);
      return null;
    }
  }

  // Clear encrypted data
  clearEncryptedData(key: string): void {
    localStorage.removeItem(key);
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

// Export singleton instances
export const pwaManager = new PWAManager();
export const pwaWebAuthn = new PWAWebAuthnManager(pwaManager);
export const privacyStorage = new PrivacyStorageManager();
