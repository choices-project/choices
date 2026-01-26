import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type { DeviceStore } from '@/lib/stores/deviceStore';
import { createInitialDeviceState, deviceStoreCreator } from '@/lib/stores/deviceStore';

const createTestDeviceStore = () => create<DeviceStore>()(immer(deviceStoreCreator));

const createMediaQueryList = (matches: boolean) => ({
  matches,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
});

describe('deviceStore', () => {
  const originalWindow = {
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
    matchMedia: window.matchMedia,
  };

  const originalNavigator = {
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints,
    onLine: navigator.onLine,
    connection: (navigator as Navigator & { connection?: unknown }).connection,
  };

  afterEach(() => {
    jest.resetAllMocks();
    Object.defineProperty(window, 'innerWidth', {
      value: originalWindow.innerWidth,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: originalWindow.innerHeight,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, 'devicePixelRatio', {
      value: originalWindow.devicePixelRatio,
      configurable: true,
      writable: true,
    });
    window.matchMedia = originalWindow.matchMedia;
    Object.defineProperty(navigator, 'userAgent', {
      value: originalNavigator.userAgent,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: originalNavigator.maxTouchPoints,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(navigator, 'onLine', {
      value: originalNavigator.onLine,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(navigator, 'connection', {
      value: originalNavigator.connection,
      configurable: true,
      writable: true,
    });
  });

  it('initializes with default state', () => {
    const store = createTestDeviceStore();

    expect(store.getState()).toMatchObject(createInitialDeviceState());
  });

  it('setScreenSize updates responsive flags', () => {
    const store = createTestDeviceStore();

    store.getState().setScreenSize(600, 800);

    const state = store.getState();
    expect(state.deviceType).toBe('mobile');
    expect(state.isMobile).toBe(true);
    expect(state.isTablet).toBe(false);
    expect(state.orientation).toBe('portrait');
    expect(state.screenSize).toEqual({ width: 600, height: 800, aspectRatio: 0.75 });
  });

  it('updateDeviceInfo ingests environment signals', () => {
    const connection = {
      effectiveType: '4g',
      downlink: 20,
      rtt: 40,
      saveData: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    } as const;

    Object.defineProperty(navigator, 'userAgent', {
      value:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) Version/16.0 Mobile/15E148 Safari/604.1 iOS',
      configurable: true,
      writable: true,
    });
    Object.defineProperty(navigator, 'maxTouchPoints', {
      value: 2,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(navigator, 'connection', {
      value: connection,
      configurable: true,
      writable: true,
    });

    const matchMedia = jest.fn((query: string) => {
      switch (query) {
        case '(hover: hover)':
          return createMediaQueryList(false);
        case '(prefers-reduced-motion: reduce)':
          return createMediaQueryList(true);
        case '(prefers-color-scheme: dark)':
          return createMediaQueryList(true);
        case '(prefers-contrast: high)':
          return createMediaQueryList(false);
        default:
          return createMediaQueryList(false);
      }
    });

    Object.defineProperty(window, 'innerWidth', {
      value: 480,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 900,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, 'devicePixelRatio', {
      value: 3,
      configurable: true,
      writable: true,
    });
    window.matchMedia = matchMedia;

    const store = createTestDeviceStore();

    store.getState().updateDeviceInfo();

    const state = store.getState();
    expect(state.deviceType).toBe('mobile');
    expect(state.isMobile).toBe(true);
    expect(state.orientation).toBe('portrait');
    expect(state.pixelRatio).toBe(3);
    expect(state.capabilities.touch).toBe(true);
    expect(state.capabilities.reducedMotion).toBe(true);
    expect(state.capabilities.darkMode).toBe(true);
    expect(state.network.online).toBe(false);
    expect(state.network.saveData).toBe(true);
    expect(state.browser).toBe('Safari');
    expect(state.os).toBe('iOS');
  });

  it('resetDeviceState can preserve capabilities', () => {
    const store = createTestDeviceStore();

    store.setState((draft) => {
      draft.capabilities.touch = true;
      draft.capabilities.camera = true;
    });

    store.getState().resetDeviceState({ preserveCapabilities: true });

    const state = store.getState();
    expect(state.capabilities.touch).toBe(true);
    expect(state.capabilities.camera).toBe(true);
    expect(state.isInitializing).toBe(true);
    expect(state.deviceType).toBe('desktop');
  });

  it('setOrientation updates orientation state', () => {
    const store = createTestDeviceStore();

    store.getState().setOrientation('portrait');
    expect(store.getState().orientation).toBe('portrait');

    store.getState().setOrientation('landscape');
    expect(store.getState().orientation).toBe('landscape');
  });

  it('setNetworkInfo updates network state', () => {
    const store = createTestDeviceStore();

    store.getState().setNetworkInfo({ online: false, type: '2g' });
    const state = store.getState();
    expect(state.network.online).toBe(false);
    expect(state.network.type).toBe('2g');
  });

  it('setCapability updates individual capability', () => {
    const store = createTestDeviceStore();

    store.getState().setCapability('touch', true);
    expect(store.getState().capabilities.touch).toBe(true);

    store.getState().setCapability('touch', false);
    expect(store.getState().capabilities.touch).toBe(false);
  });

  it('setInitializing updates initialization state', () => {
    const store = createTestDeviceStore();

    store.getState().setInitializing(false);
    expect(store.getState().isInitializing).toBe(false);

    store.getState().setInitializing(true);
    expect(store.getState().isInitializing).toBe(true);
  });

  it('initialize sets up event listeners and updates device info', () => {
    const store = createTestDeviceStore();
    const originalAddEventListener = window.addEventListener;
    const addEventListenerSpy = jest.fn();
    window.addEventListener = addEventListenerSpy;

    Object.defineProperty(window, 'innerWidth', {
      value: 1024,
      configurable: true,
      writable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 768,
      configurable: true,
      writable: true,
    });

    store.getState().initialize();

    const state = store.getState();
    expect(state.listenersRegistered).toBe(true);
    expect(state.cleanupListeners).toBeDefined();
    expect(typeof state.cleanupListeners).toBe('function');
    expect(addEventListenerSpy).toHaveBeenCalled();

    // Cleanup
    window.addEventListener = originalAddEventListener;
    state.cleanupListeners?.();
  });

  it('teardown cleans up event listeners', () => {
    const store = createTestDeviceStore();
    const cleanupSpy = jest.fn();

    // Set up listeners
    store.setState((draft) => {
      draft.listenersRegistered = true;
      draft.cleanupListeners = cleanupSpy;
    });

    store.getState().teardown();

    expect(cleanupSpy).toHaveBeenCalled();
    const state = store.getState();
    expect(state.listenersRegistered).toBe(false);
    expect(state.cleanupListeners).toBeNull();
  });

  it('derives device type correctly for different screen sizes', () => {
    const store = createTestDeviceStore();

    // Mobile
    store.getState().setScreenSize(600, 800);
    expect(store.getState().deviceType).toBe('mobile');
    expect(store.getState().isMobile).toBe(true);

    // Tablet
    store.getState().setScreenSize(800, 1024);
    expect(store.getState().deviceType).toBe('tablet');
    expect(store.getState().isTablet).toBe(true);

    // Desktop
    store.getState().setScreenSize(1920, 1080);
    expect(store.getState().deviceType).toBe('desktop');
    expect(store.getState().isDesktop).toBe(true);
  });

  it('base actions work correctly', () => {
    const store = createTestDeviceStore();

    store.getState().setLoading(true);
    expect(store.getState().isLoading).toBe(true);

    store.getState().setError('Test error');
    expect(store.getState().error).toBe('Test error');

    store.getState().clearError();
    expect(store.getState().error).toBeNull();
  });
});
