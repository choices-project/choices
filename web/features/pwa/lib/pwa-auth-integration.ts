/**
 * PWA Authentication Integration
 * 
 * Integrates PWA features with the existing authentication system,
 * providing enhanced security and privacy features.
 */

import { devLog } from '@/lib/utils/logger';
import type {
  DeviceFingerprint,
  OfflineVoteRecord,
  PWAExportedUserData,
  PWAUser,
  PWAUserProfile,
} from '@/types/pwa';

import { isFeatureEnabled } from './feature-flags';

const OFFLINE_VOTES_STORAGE_KEY = 'offline_votes';
const PWA_USER_STORAGE_KEY = 'pwa_user';

const toOfflineVoteRecord = (value: unknown): OfflineVoteRecord | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.pollId !== 'string' || typeof record.choice !== 'number') {
    return null;
  }

  const metadata =
    typeof record.metadata === 'object' && record.metadata !== null
      ? (record.metadata as Record<string, unknown>)
      : undefined;

  const timestamp =
    typeof record.timestamp === 'number' && Number.isFinite(record.timestamp)
      ? record.timestamp
      : Date.now();

  return {
    pollId: record.pollId,
    choice: record.choice,
    ...(metadata ? { metadata } : {}),
    timestamp,
  };
};

export class PWAAuth {
  private pwaEnabled = false;
  private currentUser: PWAUser | null = null;

  constructor() {
    this.pwaEnabled = isFeatureEnabled('pwa');
    this.loadUserFromStorage();
  }

  // Create a new PWA user
  createUser(): Promise<PWAUser> {
    if (!this.pwaEnabled) {
      return Promise.reject(new Error('PWA feature is disabled'));
    }

    const stableId = this.generateStableId();
    const pseudonym = this.generatePseudonym();
    
    const user: PWAUser = {
      stableId,
      pseudonym,
      trustTier: 'T0',
      verificationScore: 0,
      profileVisibility: 'pseudonymous',
      dataSharingLevel: 'minimal',
      lastActivity: new Date().toISOString(),
      pwaFeatures: {
        webAuthnEnabled: false,
        pushNotificationsEnabled: false,
        offlineVotingEnabled: true,
        encryptedStorageEnabled: true
      },
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString()
    };

    this.currentUser = user;
    this.saveUserToStorage(user);
    
    devLog('PWA: User created:', { pseudonym: user.pseudonym });
    return Promise.resolve(user);
  }

  // Get current user
  getCurrentUser(): PWAUser | null {
    return this.currentUser;
  }

  // Update user profile
  updateUserProfile(updates: Partial<PWAUser>): Promise<PWAUser | null> {
    if (!this.currentUser) {
      return Promise.resolve(null);
    }

    const now = new Date().toISOString();

    this.currentUser = {
      ...this.currentUser,
      ...updates,
      lastActive: now,
      lastActivity: updates.lastActivity ?? this.currentUser.lastActivity ?? now,
    };

    this.saveUserToStorage(this.currentUser);
    return Promise.resolve(this.currentUser);
  }

  // Enable WebAuthn for user
  async enableWebAuthn(stableId: string): Promise<boolean> {
    if (!this.pwaEnabled) {
      devLog('PWA: Feature disabled, cannot enable WebAuthn');
      return false;
    }

    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      devLog('PWA: WebAuthn not available in current environment');
      return false;
    }

    if (this.currentUser?.stableId !== stableId) {
      devLog('PWA: User not found or not current user');
      return false;
    }

    try {
      // Check if WebAuthn is supported
      if (!('credentials' in navigator)) {
        devLog('PWA: WebAuthn not supported');
        return false;
      }

      // Register WebAuthn credential
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: this.generateChallenge(),
          rp: {
            name: 'Choices Platform',
            id: window.location.hostname
          },
          user: {
            id: new Uint8Array(16),
            name: this.currentUser.pseudonym,
            displayName: this.currentUser.pseudonym
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

      if (credential) {
        // Update user profile
        await this.updateUserProfile({
          pwaFeatures: {
            ...this.currentUser.pwaFeatures,
            webAuthnEnabled: true,
            pushNotificationsEnabled: this.currentUser.pwaFeatures?.pushNotificationsEnabled ?? false,
            offlineVotingEnabled: this.currentUser.pwaFeatures?.offlineVotingEnabled ?? false,
            encryptedStorageEnabled: this.currentUser.pwaFeatures?.encryptedStorageEnabled ?? false
          },
          verificationScore: Math.min(100, this.currentUser.verificationScore + 20)
        });

        devLog('PWA: WebAuthn enabled successfully');
        return true;
      }

      return false;
    } catch (error) {
      devLog('PWA: Failed to enable WebAuthn:', { error });
      return false;
    }
  }

  // Enable push notifications for user
  async enablePushNotifications(stableId: string): Promise<boolean> {
    if (!this.pwaEnabled) {
      devLog('PWA: Feature disabled, cannot enable push notifications');
      return false;
    }

    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      devLog('PWA: Push notifications not available in current environment');
      return false;
    }

    if (this.currentUser?.stableId !== stableId) {
      devLog('PWA: User not found or not current user');
      return false;
    }

    try {
      // Request notification permission
      if (!('Notification' in window)) {
        devLog('PWA: Notifications not supported');
        return false;
      }

      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        // Subscribe to push notifications
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const registration = await navigator.serviceWorker.ready;
          const vapidKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY ?? 
                           process.env.WEB_PUSH_VAPID_PUBLIC_KEY ?? '';
          if (!vapidKey) {
            devLog('PWA: VAPID public key not configured');
            return false;
          }

          const applicationServerKey = this.urlBase64ToUint8Array(vapidKey);

          const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey
          });

          if (subscription) {
            // Update user profile
            await this.updateUserProfile({
              pwaFeatures: {
                ...this.currentUser.pwaFeatures,
                webAuthnEnabled: this.currentUser.pwaFeatures?.webAuthnEnabled ?? false,
                pushNotificationsEnabled: true,
                offlineVotingEnabled: this.currentUser.pwaFeatures?.offlineVotingEnabled ?? false,
                encryptedStorageEnabled: this.currentUser.pwaFeatures?.encryptedStorageEnabled ?? false
              }
            });

            devLog('PWA: Push notifications enabled successfully');
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      devLog('PWA: Failed to enable push notifications:', { error });
      return false;
    }
  }

  // Authenticate user with WebAuthn
  async authenticateWithWebAuthn(): Promise<boolean> {
    if (!this.pwaEnabled || !this.currentUser) {
      return false;
    }

    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      devLog('PWA: WebAuthn not available in current environment');
      return false;
    }

    if (!this.currentUser.pwaFeatures?.webAuthnEnabled) {
      devLog('PWA: WebAuthn not enabled for user');
      return false;
    }

    try {
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: this.generateChallenge(),
          rpId: window.location.hostname,
          timeout: 60000,
          userVerification: 'preferred'
        }
      });

      if (assertion) {
        // Update last active time
        await this.updateUserProfile({
          lastActive: new Date().toISOString()
        });

        devLog('PWA: WebAuthn authentication successful');
        return true;
      }

      return false;
    } catch (error) {
      devLog('PWA: WebAuthn authentication failed:', { error });
      return false;
    }
  }

  // Increase user trust score
  async increaseTrustScore(amount: number): Promise<void> {
    if (!this.currentUser) {
      return;
    }

    const newScore = Math.min(100, this.currentUser.verificationScore + amount);
    let newTier = this.currentUser.trustTier;

    // Update tier based on score
    if (newScore >= 90) {
      newTier = 'T3';
    } else if (newScore >= 70) {
      newTier = 'T2';
    } else if (newScore >= 40) {
      newTier = 'T1';
    }

    await this.updateUserProfile({
      verificationScore: newScore,
      trustTier: newTier
    });
  }

  // Get user profile for display
  getUserProfile(): PWAUserProfile | null {
    if (!this.currentUser) {
      return null;
    }

    return {
      stableId: this.currentUser.stableId,
      pseudonym: this.currentUser.pseudonym,
      trustTier: this.currentUser.trustTier,
      verificationScore: this.currentUser.verificationScore,
      deviceFingerprint: this.getDeviceFingerprint(),
      pwaFeatures: this.currentUser.pwaFeatures ?? {
        webAuthnEnabled: false,
        pushNotificationsEnabled: false,
        offlineVotingEnabled: true,
        encryptedStorageEnabled: true
      },
      privacySettings: {
        dataCollection: true,
        analytics: true,
        notifications: true,
        offlineStorage: true
      },
      createdAt: this.currentUser.createdAt,
      updatedAt: this.currentUser.lastActive
    };
  }

  // Delete user account
  deleteUser(): Promise<boolean> {
    if (!this.currentUser) {
      return Promise.resolve(false);
    }

    try {
      if (typeof window === 'undefined') {
        devLog('PWA: Cannot delete user outside browser environment');
        return Promise.resolve(false);
      }

      // Clear local storage
      window.localStorage.removeItem(PWA_USER_STORAGE_KEY);
      window.localStorage.removeItem(OFFLINE_VOTES_STORAGE_KEY);
      
      // Clear encrypted storage
      const keys = Object.keys(window.localStorage);
      keys.forEach(key => {
        if (key.startsWith('encrypted_')) {
          window.localStorage.removeItem(key);
        }
      });

      this.currentUser = null;
      devLog('PWA: User account deleted');
      return Promise.resolve(true);
    } catch (error) {
      devLog('PWA: Failed to delete user account:', { error });
      return Promise.resolve(false);
    }
  }

  // Export user data
  exportUserData(): PWAExportedUserData | null {
    if (!this.currentUser) {
      return null;
    }

    return {
      user: this.currentUser,
      profile: this.getUserProfile(),
      offlineVotes: this.getOfflineVotes(),
      timestamp: new Date().toISOString()
    };
  }

  // Check if PWA auth is enabled
  isEnabled(): boolean {
    return this.pwaEnabled;
  }

  // Private helper methods

  private generateStableId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 15);
    return `pwa_${timestamp}_${random}`;
  }

  private generatePseudonym(): string {
    const adjectives = ['Swift', 'Bright', 'Calm', 'Wise', 'Bold', 'Gentle', 'Quick', 'Deep'];
    const nouns = ['River', 'Mountain', 'Forest', 'Ocean', 'Desert', 'Valley', 'Meadow', 'Cliff'];
    
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 999) + 1;
    
    return `${adjective}${noun}${number}`;
  }

  private generateChallenge(): ArrayBuffer {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return array.buffer;
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    if (typeof window === 'undefined') {
      throw new Error('urlBase64ToUint8Array requires a browser environment');
    }

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

  private getDeviceFingerprint(): DeviceFingerprint {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return {
        userAgent: 'server',
        platform: 'server',
        screenResolution: '0x0',
        language: 'en',
        timezone: 'UTC',
        webAuthn: false,
        standalone: false,
      };
    }

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;

    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      webAuthn: 'credentials' in navigator,
      standalone,
    };
  }

  private getOfflineVotes(): OfflineVoteRecord[] {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const stored = window.localStorage.getItem(OFFLINE_VOTES_STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .map(toOfflineVoteRecord)
        .filter((record): record is OfflineVoteRecord => record !== null);
    } catch {
      return [];
    }
  }

  private saveUserToStorage(user: PWAUser): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(PWA_USER_STORAGE_KEY, JSON.stringify(user));
    } catch (error) {
      devLog('PWA: Failed to save user to storage:', { error });
    }
  }

  private loadUserFromStorage(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const stored = window.localStorage.getItem(PWA_USER_STORAGE_KEY);
      if (stored) {
        this.currentUser = JSON.parse(stored) as PWAUser;
        // Update last active time
        if (this.currentUser) {
          this.currentUser.lastActive = new Date().toISOString();
          this.currentUser.lastActivity = new Date().toISOString();
        }
      }
    } catch (error) {
      devLog('PWA: Failed to load user from storage:', { error });
    }
  }
}

// Create singleton instance
export const pwaAuth = new PWAAuth();
