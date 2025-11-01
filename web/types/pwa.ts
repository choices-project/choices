import type React from 'react'
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

export type PWAFeatures = {
  installable: boolean;
  offline: boolean;
  pushNotifications: boolean;
  webAuthn: boolean;
  backgroundSync: boolean;
}

export type PWAStatus = {
  isStandalone: boolean;
  isOnline: boolean;
  hasServiceWorker: boolean;
  hasPushSupport: boolean;
  pwaStatus: PWAManagerStatus | null;
}

export type PWAManagerStatus = {
  isInstalled: boolean;
  hasServiceWorker: boolean;
  hasPushSupport: boolean;
  hasBackgroundSync: boolean;
  hasWebAuthn: boolean;
  version: string;
  lastUpdate: Date;
}

export type ServiceWorkerRegistration = {
  sync?: {
    register(tag: string): Promise<void>;
    getTags(): Promise<string[]>;
  };
} & globalThis.ServiceWorkerRegistration

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

export type FeatureCardProps = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  available: boolean;
}

export type StatusItemProps = {
  label: string;
  value: string;
  status: 'success' | 'warning' | 'error' | 'info';
}
