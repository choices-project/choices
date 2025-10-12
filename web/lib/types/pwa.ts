// PWA Types for Agent A5
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
