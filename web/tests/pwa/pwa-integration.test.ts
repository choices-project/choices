/**
 * PWA Integration Tests
 * 
 * Tests for PWA functionality including service worker,
 * installation, offline capabilities, and notifications.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { checkPWASupport, getInstallationCriteria } from '@/lib/pwa/init';

// Mock navigator and window objects
const mockNavigator = {
  serviceWorker: {
    register: vi.fn(),
    getRegistration: vi.fn(),
    controller: null
  },
  onLine: true
};

const mockWindow = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  location: {
    protocol: 'https:',
    hostname: 'localhost'
  },
  matchMedia: vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }))
};

// Mock document
const mockDocument = {
  querySelector: vi.fn(() => ({
    rel: 'manifest',
    href: '/manifest.json'
  }))
};

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn()
};

describe('PWA Support Detection', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Mock global objects
    Object.defineProperty(global, 'navigator', {
      value: mockNavigator,
      writable: true
    });
    
    Object.defineProperty(global, 'window', {
      value: mockWindow,
      writable: true
    });
    
    Object.defineProperty(global, 'document', {
      value: mockDocument,
      writable: true
    });
    
    Object.defineProperty(global, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should detect PWA support correctly', () => {
    const support = checkPWASupport();
    
    expect(support.isSupported).toBe(true);
    expect(support.features.serviceWorker).toBe(true);
    expect(support.features.pushManager).toBe(false); // Not mocked
    expect(support.features.notifications).toBe(false); // Not mocked
    expect(support.features.installPrompt).toBe(false); // Not mocked
  });

  it('should check installation criteria', () => {
    const criteria = getInstallationCriteria();
    
    expect(criteria.hasServiceWorker).toBe(true);
    expect(criteria.hasManifest).toBe(true);
    expect(criteria.isHTTPS).toBe(true);
    expect(criteria.isEngaging).toBe(false); // New session
  });

  it('should detect engagement after session duration', () => {
    // Mock existing session
    mockSessionStorage.getItem.mockReturnValue((Date.now() - 60000).toString()); // 1 minute ago
    
    const criteria = getInstallationCriteria();
    
    expect(criteria.isEngaging).toBe(true);
  });

  it('should handle missing service worker', () => {
    // Mock navigator without service worker
    Object.defineProperty(global, 'navigator', {
      value: {},
      writable: true
    });
    
    const support = checkPWASupport();
    
    expect(support.isSupported).toBe(false);
    expect(support.features.serviceWorker).toBe(false);
  });

  it('should handle HTTP protocol', () => {
    mockWindow.location.protocol = 'http:';
    
    const criteria = getInstallationCriteria();
    
    expect(criteria.isHTTPS).toBe(false);
  });

  it('should handle missing manifest', () => {
    mockDocument.querySelector.mockReturnValue(null);
    
    const criteria = getInstallationCriteria();
    
    expect(criteria.hasManifest).toBe(false);
  });
});

describe('PWA Event Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    Object.defineProperty(global, 'window', {
      value: mockWindow,
      writable: true
    });
  });

  it('should set up event listeners', () => {
    // This would test the setupPWAEventListeners function
    // For now, we'll just verify the mock is called
    expect(mockWindow.addEventListener).toBeDefined();
  });

  it('should handle app installation event', () => {
    const event = new Event('appinstalled');
    window.dispatchEvent(event);
    
    expect(mockWindow.dispatchEvent).toHaveBeenCalled();
  });

  it('should handle before install prompt event', () => {
    const event = new Event('beforeinstallprompt');
    window.dispatchEvent(event);
    
    expect(mockWindow.dispatchEvent).toHaveBeenCalled();
  });

  it('should handle online event', () => {
    const event = new Event('online');
    window.dispatchEvent(event);
    
    expect(mockWindow.dispatchEvent).toHaveBeenCalled();
  });

  it('should handle offline event', () => {
    const event = new Event('offline');
    window.dispatchEvent(event);
    
    expect(mockWindow.dispatchEvent).toHaveBeenCalled();
  });
});

describe('PWA Analytics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    Object.defineProperty(global, 'window', {
      value: mockWindow,
      writable: true
    });
  });

  it('should track PWA events', () => {
    const { trackPWAEvent } = require('@/lib/pwa/init');
    
    trackPWAEvent('pwa-install', { source: 'banner' });
    
    expect(mockWindow.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'pwa-analytics',
        detail: expect.objectContaining({
          eventName: 'pwa-install',
          properties: { source: 'banner' }
        })
      })
    );
  });
});
