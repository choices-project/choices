/**
 * PWA Test Utilities
 * 
 * Comprehensive utilities for testing PWA features with proper async handling
 * and realistic mocking of browser APIs.
 */

import { act } from '@testing-library/react';
import { waitFor } from '@testing-library/dom';

/**
 * Mock PWA environment with proper async handling
 */
export const createPWAMockEnvironment = () => {
  // Mock service worker
  const mockServiceWorker = {
    register: jest.fn().mockResolvedValue({
      installing: null,
      waiting: null,
      active: { state: 'activated' }
    }),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    postMessage: jest.fn()
  };

  // Mock notification API
  const mockNotification = {
    requestPermission: jest.fn().mockResolvedValue('granted'),
    show: jest.fn(),
    close: jest.fn()
  };

  // Mock offline storage
  const mockOfflineStorage = {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  };

  // Mock installation prompt
  const mockInstallPrompt = {
    prompt: jest.fn().mockResolvedValue(undefined),
    userChoice: Promise.resolve({ outcome: 'accepted' })
  };

  // Mock browser APIs
  Object.defineProperty(window, 'navigator', {
    value: {
      ...window.navigator,
      serviceWorker: mockServiceWorker
    },
    writable: true
  });

  Object.defineProperty(window, 'Notification', {
    value: mockNotification,
    writable: true
  });

  Object.defineProperty(window, 'localStorage', {
    value: mockOfflineStorage,
    writable: true
  });

  Object.defineProperty(window, 'sessionStorage', {
    value: mockOfflineStorage,
    writable: true
  });

  // Mock beforeinstallprompt event
  const mockBeforeInstallPrompt = new Event('beforeinstallprompt');
  Object.defineProperty(mockBeforeInstallPrompt, 'prompt', {
    value: mockInstallPrompt.prompt,
    writable: true
  });
  Object.defineProperty(mockBeforeInstallPrompt, 'userChoice', {
    value: mockInstallPrompt.userChoice,
    writable: true
  });

  return {
    mockServiceWorker,
    mockNotification,
    mockOfflineStorage,
    mockInstallPrompt,
    mockBeforeInstallPrompt
  };
};

/**
 * Wait for PWA operations with proper timeout handling
 */
export const waitForPWAOperation = async (
  operation: () => Promise<void>,
  timeout = 15000
) => {
  return await waitFor(operation, { timeout });
};

/**
 * Simulate PWA installation with proper async handling
 */
export const simulatePWAInstallation = async () => {
  const { mockBeforeInstallPrompt } = createPWAMockEnvironment();
  
  // Simulate beforeinstallprompt event
  window.dispatchEvent(mockBeforeInstallPrompt);
  
  // Wait for event to be processed
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
  });
};

/**
 * Simulate offline data sync with proper async handling
 */
export const simulateOfflineDataSync = async () => {
  const { mockOfflineStorage } = createPWAMockEnvironment();
  
  // Simulate offline data
  mockOfflineStorage.getItem.mockReturnValue(JSON.stringify({
    polls: [{ id: '1', title: 'Test Poll' }],
    actions: [{ id: '1', type: 'vote', data: { pollId: '1' } }]
  }));
  
  // Simulate sync operation
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
  });
};

/**
 * Simulate notification permission request with proper async handling
 */
export const simulateNotificationPermission = async () => {
  const { mockNotification } = createPWAMockEnvironment();
  
  // Simulate permission request
  await act(async () => {
    const result = await mockNotification.requestPermission();
    expect(result).toBe('granted');
  });
};

/**
 * Simulate PWA errors with proper async handling
 */
export const simulatePWAError = async (errorType: 'installation' | 'sync' | 'notification') => {
  const { mockServiceWorker, mockNotification, mockOfflineStorage } = createPWAMockEnvironment();
  
  switch (errorType) {
    case 'installation':
      mockServiceWorker.register.mockRejectedValue(new Error('Installation failed'));
      break;
    case 'sync':
      mockOfflineStorage.setItem.mockRejectedValue(new Error('Sync failed'));
      break;
    case 'notification':
      mockNotification.requestPermission.mockRejectedValue(new Error('Permission denied'));
      break;
  }
  
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
  });
};

/**
 * Test PWA accessibility with proper focus management
 */
export const testPWAAccessibility = async () => {
  // Test keyboard navigation
  const firstElement = document.querySelector('[data-testid="pwa-first-focusable"]');
  const secondElement = document.querySelector('[data-testid="pwa-second-focusable"]');
  
  if (firstElement && secondElement) {
    // Focus first element
    (firstElement as HTMLElement).focus();
    expect(document.activeElement).toBe(firstElement);
    
    // Tab to second element
    await act(async () => {
      (firstElement as HTMLElement).dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    });
    
    // Wait for focus to change
    await waitFor(() => {
      expect(document.activeElement).toBe(secondElement);
    });
  }
};

/**
 * Clean up PWA mocks after tests
 */
export const cleanupPWAMocks = () => {
  // Clean up mocks
  jest.clearAllMocks();
  
  // Reset browser APIs
  Object.defineProperty(window, 'navigator', {
    value: window.navigator,
    writable: true
  });
  
  Object.defineProperty(window, 'Notification', {
    value: window.Notification,
    writable: true
  });
  
  Object.defineProperty(window, 'localStorage', {
    value: window.localStorage,
    writable: true
  });
  
  Object.defineProperty(window, 'sessionStorage', {
    value: window.sessionStorage,
    writable: true
  });
};
