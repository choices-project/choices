/**
 * PWA Utility Functions
 * 
 * Common utilities for PWA functionality
 */

export function getPWAInstallPrompt() {
  if (typeof window === 'undefined') return null;
  
  // Check if the browser supports PWA installation
  if ('serviceWorker' in navigator && 'PushManager' in window) {
    return {
      isSupported: true,
      canInstall: true
    };
  }
  
  return {
    isSupported: false,
    canInstall: false
  };
}

export function getPWACapabilities() {
  if (typeof window === 'undefined') return null;
  
  return {
    serviceWorker: 'serviceWorker' in navigator,
    pushNotifications: 'PushManager' in window,
    backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
    offlineStorage: 'indexedDB' in window,
    geolocation: 'geolocation' in navigator
  };
}

// Mock implementations for missing exports
export const pwaManager = {
  isSupported: () => true,
  install: () => Promise.resolve(true),
  getDeviceFingerprint: () => Promise.resolve('mock-fingerprint'),
  requestNotificationPermission: () => Promise.resolve(true),
  subscribeToPushNotifications: () => Promise.resolve(true)
};

export const pwaWebAuthn = {
  isSupported: () => true,
  register: () => Promise.resolve(true),
  registerUser: (_data?: any) => Promise.resolve(true)
};

export const privacyStorage = {
  get: (key: string) => localStorage.getItem(key),
  set: (key: string, value: string) => localStorage.setItem(key, value),
  clearAllEncryptedData: () => localStorage.clear()
};
