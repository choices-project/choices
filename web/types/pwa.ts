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

export type DeviceFingerprint = {
  userAgent?: string;
  platform: string;
  screenResolution: string;
  language: string;
  timezone: string;
  webAuthn?: boolean;
  standalone?: boolean;
}

export type PWAStatusSnapshot = {
  installable: boolean;
  offline: boolean;
  pushNotifications: boolean;
  webAuthn: boolean;
  serviceWorker: boolean;
  offlineVotes: number;
}

export type OfflineVotePayload = {
  pollId: string;
  choice: number;
  metadata?: Record<string, unknown>;
}

export type OfflineVoteRecord = OfflineVotePayload & {
  timestamp: number;
};

export const PWA_QUEUED_REQUEST_TYPES = {
  VOTE: 'vote',
  CIVIC_ACTION: 'civic_action',
  CONTACT: 'contact',
  POLL_CREATE: 'poll_create',
  PROFILE_UPDATE: 'profile_update',
  HASHTAG_FOLLOW: 'hashtag_follow',
} as const;

export type PWAQueuedRequestType = typeof PWA_QUEUED_REQUEST_TYPES[keyof typeof PWA_QUEUED_REQUEST_TYPES];

export type PWAHttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export type PWAQueuedRequest<TPayload = Record<string, unknown>> = {
  id: string;
  type: PWAQueuedRequestType;
  payload: TPayload | null;
  endpoint: string;
  method: PWAHttpMethod;
  timestamp: number;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
};

export type PWAQueuedAction<TData = Record<string, unknown>> = {
  id: string;
  action: string;
  data: TData;
  timestamp: string;
};

export type PWAQueueHarness = {
  setQueueState?: (
    size: number,
    options?: { cachedPages?: number; cachedResources?: number; isOffline?: boolean }
  ) => void;
  setOnlineStatus?: (isOnline: boolean) => void;
  reset?: () => void;
};

export type PWAServiceWorkerMessage =
  | { type: 'OFFLINE_QUEUE_UPDATED'; size: number; updatedAt: string }
  | { type: 'CACHE_HIT'; cache: string; url: string; strategy?: string }
  | { type: 'CACHE_MISS'; cache: string; url: string; strategy?: string };

export const PWA_SERVICE_WORKER_MESSAGE_TYPES = {
  OFFLINE_QUEUE_UPDATED: 'OFFLINE_QUEUE_UPDATED',
  CACHE_HIT: 'CACHE_HIT',
  CACHE_MISS: 'CACHE_MISS',
} as const;

export type PWAServiceWorkerMessageType =
  typeof PWA_SERVICE_WORKER_MESSAGE_TYPES[keyof typeof PWA_SERVICE_WORKER_MESSAGE_TYPES];

export const isPWAServiceWorkerMessage = (value: unknown): value is PWAServiceWorkerMessage => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  const type = record.type;

  switch (type) {
    case PWA_SERVICE_WORKER_MESSAGE_TYPES.OFFLINE_QUEUE_UPDATED:
      return typeof record.size === 'number' && typeof record.updatedAt === 'string';
    case PWA_SERVICE_WORKER_MESSAGE_TYPES.CACHE_HIT:
    case PWA_SERVICE_WORKER_MESSAGE_TYPES.CACHE_MISS:
      return typeof record.cache === 'string' && typeof record.url === 'string';
    default:
      return false;
  }
};

export type PWAUser = {
  stableId: string;
  pseudonym: string;
  trustTier: 'T0' | 'T1' | 'T2' | 'T3';
  verificationScore: number;
  profileVisibility: 'anonymous' | 'pseudonymous' | 'public';
  dataSharingLevel: 'minimal' | 'demographic' | 'full';
  demographics?: {
    ageRange?: string;
    educationLevel?: string;
    incomeBracket?: string;
    regionCode?: string;
  };
  lastActivity?: string;
  pwaFeatures?: {
    webAuthnEnabled: boolean;
    pushNotificationsEnabled: boolean;
    offlineVotingEnabled: boolean;
    encryptedStorageEnabled: boolean;
  };
  createdAt: string;
  lastActive: string;
}

export type PWAUserProfile = {
  stableId: string;
  pseudonym: string;
  trustTier: 'T0' | 'T1' | 'T2' | 'T3';
  verificationScore: number;
  deviceFingerprint: DeviceFingerprint;
  pwaFeatures: {
    webAuthnEnabled: boolean;
    pushNotificationsEnabled: boolean;
    offlineVotingEnabled: boolean;
    encryptedStorageEnabled: boolean;
  };
  privacySettings: {
    dataCollection: boolean;
    analytics: boolean;
    notifications: boolean;
    offlineStorage: boolean;
  };
  createdAt: string;
  updatedAt: string;
}

export type PWAExportedUserData = {
  user: PWAUser;
  profile: PWAUserProfile | null;
  offlineVotes: OfflineVoteRecord[];
  timestamp: string;
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
