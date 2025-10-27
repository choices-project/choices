// PWA Types for Choices Platform
// Created: 2025-01-16
// Purpose: Type definitions for PWA components and functionality

export type BeforeInstallPromptEvent = {
  prompt(): Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
} & Event

export interface PWAFeatures {
  installable: boolean;
  offline: boolean;
  pushNotifications: boolean;
  webAuthn: boolean;
  backgroundSync: boolean;
}

export interface PWAStatus {
  isStandalone: boolean;
  isOnline: boolean;
  hasServiceWorker: boolean;
  hasPushSupport: boolean;
  pwaStatus: PWAManagerStatus | null;
}

export interface PWAManagerStatus {
  isInstalled: boolean;
  hasServiceWorker: boolean;
  hasPushSupport: boolean;
  hasBackgroundSync: boolean;
  hasWebAuthn: boolean;
  version: string;
  lastUpdate: Date;
}

// ServiceWorkerRegistration is extended globally in global.d.ts
// No need to redefine it here

export type NavigatorWithServiceWorker = {
  serviceWorker: ServiceWorkerContainer & {
    sync?: {
      register(tag: string): Promise<void>;
      getTags(): Promise<string[]>;
    };
  };
} & Navigator

/**
 * Precise PWA feature detection utilities
 */
export const pwaFeatureDetection = {
  backgroundSync: (): boolean => {
    return 'serviceWorker' in navigator &&
      'sync' in (navigator as NavigatorWithServiceWorker).serviceWorker &&
      typeof (navigator as NavigatorWithServiceWorker).serviceWorker.sync?.register === 'function';
  },
  
  webAuthn: (): boolean => {
    return 'credentials' in navigator && 'create' in navigator.credentials;
  },
  
  pushNotifications: (): boolean => {
    return 'PushManager' in window && 'serviceWorker' in navigator;
  },
  
  installable: (): boolean => {
    return 'beforeinstallprompt' in window;
  },
  
  offline: (): boolean => {
    return 'serviceWorker' in navigator && 'indexedDB' in window;
  }
};

export interface FeatureCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  available: boolean;
}

export interface StatusItemProps {
  label: string;
  value: string;
  status: 'success' | 'warning' | 'error' | 'info';
}
