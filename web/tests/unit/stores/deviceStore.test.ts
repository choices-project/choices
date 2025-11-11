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
  afterEach(() => {
    jest.resetAllMocks();
    delete (globalThis as unknown as { window?: unknown }).window;
    delete (globalThis as unknown as { navigator?: unknown }).navigator;
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

    const mockNavigator = {
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) Version/16.0 Mobile/15E148 Safari/604.1 iOS',
      maxTouchPoints: 2,
      onLine: false,
      connection,
    } as Navigator;

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

    const mockWindow = {
      innerWidth: 480,
      innerHeight: 900,
      devicePixelRatio: 3,
      matchMedia,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    } as unknown as Window & typeof globalThis;

    (globalThis as unknown as { window: Window & typeof globalThis }).window = mockWindow;
    (globalThis as unknown as { navigator: Navigator }).navigator = mockNavigator;

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
});
