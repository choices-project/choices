/**
 * Device Store
 *
 * Centralized Zustand store for device detection, capabilities,
 * and responsive state management.
 *
 * Modernized to align with the 2025 Zustand store standards:
 * - Typed creator & action split
 * - SSR-safe environment guards
 * - Base loading/error actions reuse
 * - Memoized selector helpers
 */

import { useMemo } from 'react';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { detectBrowser as detectBrowserInfo } from '@/lib/utils/browser-utils';

import { createBaseStoreActions } from './baseStoreActions';
import { createSafeStorage } from './storage';

import type { BaseStore } from './types';
import type { StateCreator } from 'zustand';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';
export type ConnectionType =
  | 'slow-2g'
  | '2g'
  | '3g'
  | '4g'
  | '5g'
  | 'wifi'
  | 'ethernet'
  | 'unknown';

export type ScreenSize = {
  width: number;
  height: number;
  aspectRatio: number;
};

export type DeviceCapabilities = {
  touch: boolean;
  hover: boolean;
  reducedMotion: boolean;
  darkMode: boolean;
  highContrast: boolean;
  lowData: boolean;
  offline: boolean;
  geolocation: boolean;
  camera: boolean;
  microphone: boolean;
  vibration: boolean;
  notifications: boolean;
  clipboard: boolean;
  share: boolean;
};

export type NetworkInfo = {
  type: ConnectionType;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
  online: boolean;
};

type NetworkConnection = {
  readonly effectiveType?: string;
  readonly downlink?: number;
  readonly rtt?: number;
  readonly saveData?: boolean;
  addEventListener?: (type: string, listener: EventListenerOrEventListenerObject) => void;
  removeEventListener?: (type: string, listener: EventListenerOrEventListenerObject) => void;
  onchange?: ((this: NetworkConnection, ev: Event) => unknown) | null;
} & EventTarget;

export type DeviceState = {
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenSize: ScreenSize;
  orientation: Orientation;
  pixelRatio: number;
  capabilities: DeviceCapabilities;
  network: NetworkInfo;
  userAgent: string;
  browser: string;
  os: string;
  isLoading: boolean;
  isInitializing: boolean;
  error: string | null;
  listenersRegistered: boolean;
  cleanupListeners: (() => void) | null;
};

export type ResetDeviceStateOptions = {
  preserveCapabilities?: boolean;
};

export type DeviceActions = Pick<BaseStore, 'setLoading' | 'setError' | 'clearError'> & {
  updateDeviceInfo: () => void;
  setOrientation: (orientation: Orientation) => void;
  setScreenSize: (width: number, height: number) => void;
  setNetworkInfo: (network: Partial<NetworkInfo>) => void;
  setCapability: (capability: keyof DeviceCapabilities, value: boolean) => void;
  setInitializing: (initializing: boolean) => void;
  resetDeviceState: (options?: ResetDeviceStateOptions) => void;
  initialize: () => void;
  teardown: () => void;
};

export type DeviceStore = DeviceState & DeviceActions;

export type DeviceStoreCreator = StateCreator<
  DeviceStore,
  [['zustand/immer', never]],
  [],
  DeviceStore
>;

export type DeviceEnvironment = {
  getWindow: () => (Window & typeof globalThis) | undefined;
  getNavigator: () => Navigator | undefined;
  getConnection: () => NetworkConnection | undefined;
};

const createDefaultCapabilities = (): DeviceCapabilities => ({
  touch: false,
  hover: true,
  reducedMotion: false,
  darkMode: false,
  highContrast: false,
  lowData: false,
  offline: false,
  geolocation: false,
  camera: false,
  microphone: false,
  vibration: false,
  notifications: false,
  clipboard: false,
  share: false,
});

const DEFAULT_SCREEN: ScreenSize = {
  width: 1920,
  height: 1080,
  aspectRatio: 16 / 9,
};

const DEFAULT_NETWORK: NetworkInfo = {
  type: 'unknown',
  effectiveType: '4g',
  downlink: 10,
  rtt: 50,
  saveData: false,
  online: true,
};

export const createDeviceEnvironment = (): DeviceEnvironment => {
  const resolveWindow = (): (Window & typeof globalThis) | undefined => {
    if (typeof globalThis !== 'undefined' && typeof (globalThis as any).window !== 'undefined') {
      return (globalThis as any).window as Window & typeof globalThis;
    }
    return typeof window === 'undefined' ? undefined : window;
  };

  const resolveNavigator = (): Navigator | undefined => {
    if (typeof globalThis !== 'undefined' && typeof (globalThis as any).navigator !== 'undefined') {
      return (globalThis as any).navigator as Navigator;
    }
    return typeof navigator === 'undefined' ? undefined : navigator;
  };

  return {
    getWindow: resolveWindow,
    getNavigator: resolveNavigator,
    getConnection: () => {
      const nav = resolveNavigator();
      if (!nav) {
        return undefined;
      }
      const connection = (nav as Navigator & { connection?: NetworkConnection }).connection;
      return connection ?? undefined;
    },
  };
};

const deriveDeviceType = (width: number): DeviceType => {
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

const deriveOrientation = (width: number, height: number): Orientation =>
  height > width ? 'portrait' : 'landscape';

const deriveScreenSize = (width: number, height: number): ScreenSize => ({
  width,
  height,
  aspectRatio: height === 0 ? 0 : width / height,
});

const resolveCapabilities = (win?: Window, nav?: Navigator): DeviceCapabilities => {
  const defaults = createDefaultCapabilities();
  if (!win || !nav) {
    return defaults;
  }

  const match = (query: string): boolean => {
    if (typeof win.matchMedia !== 'function') {
      return false;
    }
    const result = win.matchMedia(query);
    return !!(result && typeof result.matches === 'boolean' ? result.matches : false);
  };
  const connection = (nav as Navigator & { connection?: NetworkConnection }).connection;

  return {
    touch: 'ontouchstart' in win || nav.maxTouchPoints > 0,
    hover: match('(hover: hover)'),
    reducedMotion: match('(prefers-reduced-motion: reduce)'),
    darkMode: match('(prefers-color-scheme: dark)'),
    highContrast: match('(prefers-contrast: high)'),
    lowData: connection?.saveData ?? false,
    offline: nav.onLine ? false : true,
    geolocation: 'geolocation' in nav,
    camera: 'mediaDevices' in nav && !!nav.mediaDevices?.getUserMedia,
    microphone: 'mediaDevices' in nav && !!nav.mediaDevices?.getUserMedia,
    vibration: 'vibrate' in nav,
    notifications: 'Notification' in win,
    clipboard: 'clipboard' in nav,
    share: typeof (nav as Navigator & { share?: unknown }).share === 'function',
  };
};

const resolveNetworkInfo = (nav?: Navigator, connection?: NetworkConnection): NetworkInfo => ({
  type: (connection?.effectiveType ?? 'unknown') as ConnectionType,
  effectiveType: connection?.effectiveType ?? DEFAULT_NETWORK.effectiveType,
  downlink: connection?.downlink ?? DEFAULT_NETWORK.downlink,
  rtt: connection?.rtt ?? DEFAULT_NETWORK.rtt,
  saveData: connection?.saveData ?? DEFAULT_NETWORK.saveData,
  online: nav?.onLine ?? DEFAULT_NETWORK.online,
});

const detectBrowser = (userAgent: string): string => {
  const info = detectBrowserInfo();
  if (info.name && info.name !== 'unknown') return info.name.charAt(0).toUpperCase() + info.name.slice(1);
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Unknown';
};

const detectOS = (userAgent: string): string => {
  const normalized = userAgent.toLowerCase();
  if (!normalized.length) {
    return 'Unknown';
  }

  if (
    normalized.includes('iphone') ||
    normalized.includes('ipad') ||
    normalized.includes('ipod') ||
    normalized.includes('ios')
  ) {
    return 'iOS';
  }

  if (normalized.includes('android')) {
    return 'Android';
  }

  if (normalized.includes('windows')) {
    return 'Windows';
  }

  if (normalized.includes('mac os x') || normalized.includes('macintosh') || normalized.includes('mac')) {
    return 'macOS';
  }

  if (normalized.includes('linux')) {
    return 'Linux';
  }

  return 'Unknown';
};

export const createInitialDeviceState = (): DeviceState => ({
  deviceType: 'desktop',
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  screenSize: DEFAULT_SCREEN,
  orientation: 'landscape',
  pixelRatio: 1,
  capabilities: createDefaultCapabilities(),
  network: DEFAULT_NETWORK,
  userAgent: '',
  browser: 'Unknown',
  os: 'Unknown',
  isLoading: false,
  isInitializing: true,
  error: null,
  listenersRegistered: false,
  cleanupListeners: null,
});

export const createDeviceActions = (
  set: (recipe: (draft: DeviceStore) => void) => void,
  get: () => DeviceStore,
  environment: DeviceEnvironment,
): DeviceActions => {
  const baseActions = createBaseStoreActions<DeviceStore>(set);

  return {
    ...baseActions,

    updateDeviceInfo: () => {
      const win = environment.getWindow();
      const nav = environment.getNavigator();

      set((state) => {
        const width = win?.innerWidth ?? state.screenSize.width;
        const height = win?.innerHeight ?? state.screenSize.height;
        const deviceType = deriveDeviceType(width);

        state.deviceType = deviceType;
        state.isMobile = deviceType === 'mobile';
        state.isTablet = deviceType === 'tablet';
        state.isDesktop = deviceType === 'desktop';

        state.screenSize = deriveScreenSize(width, height);
        state.orientation = deriveOrientation(width, height);
        state.pixelRatio = win?.devicePixelRatio ?? state.pixelRatio;
        state.capabilities = resolveCapabilities(win, nav);
        state.network = {
          ...state.network,
          ...resolveNetworkInfo(nav, environment.getConnection()),
        };

        const userAgent = nav?.userAgent ?? '';
        state.userAgent = userAgent;
        state.browser = detectBrowser(userAgent);
        state.os = detectOS(userAgent);
      });
    },

    setOrientation: (orientation) => {
      set((state) => {
        state.orientation = orientation;
      });
    },

    setScreenSize: (width, height) => {
      set((state) => {
        const deviceType = deriveDeviceType(width);
        state.screenSize = deriveScreenSize(width, height);
        state.deviceType = deviceType;
        state.isMobile = deviceType === 'mobile';
        state.isTablet = deviceType === 'tablet';
        state.isDesktop = deviceType === 'desktop';
        state.orientation = deriveOrientation(width, height);
      });
    },

    setNetworkInfo: (network) => {
      set((state) => {
        state.network = { ...state.network, ...network };
      });
    },

    setCapability: (capability, value) => {
      set((state) => {
        state.capabilities[capability] = value;
      });
    },

    setInitializing: (initializing) => {
      set((state) => {
        state.isInitializing = initializing;
      });
    },

    resetDeviceState: (options) => {
      const preserveCapabilities = options?.preserveCapabilities ?? false;
      const cleanup = get().cleanupListeners;
      cleanup?.();

      const initial = createInitialDeviceState();
      set((state) => {
        const capabilities = preserveCapabilities ? state.capabilities : initial.capabilities;

        state.deviceType = initial.deviceType;
        state.isMobile = initial.isMobile;
        state.isTablet = initial.isTablet;
        state.isDesktop = initial.isDesktop;
        state.screenSize = initial.screenSize;
        state.orientation = initial.orientation;
        state.pixelRatio = initial.pixelRatio;
        state.capabilities = { ...capabilities };
        state.network = initial.network;
        state.userAgent = initial.userAgent;
        state.browser = initial.browser;
        state.os = initial.os;
        state.isLoading = false;
        state.isInitializing = initial.isInitializing;
        state.error = null;
        state.listenersRegistered = false;
        state.cleanupListeners = null;
      });
    },

    initialize: () => {
      const { cleanupListeners, listenersRegistered } = get();
      if (listenersRegistered) {
        cleanupListeners?.();
      }

      set((state) => {
        state.isInitializing = true;
        state.error = null;
      });

      const cleanupFns: Array<() => void> = [];

      try {
        const win = environment.getWindow();
        if (!win) {
          set((state) => {
            state.isInitializing = false;
            state.listenersRegistered = false;
            state.cleanupListeners = null;
          });
          return;
        }

        get().updateDeviceInfo();

        const handleResize = () => {
          const currentWindow = environment.getWindow();
          if (!currentWindow) {
            return;
          }
          const width = currentWindow.innerWidth;
          const height = currentWindow.innerHeight;
          get().setScreenSize(width, height);
          get().updateDeviceInfo();
        };

        const handleOrientationChange = () => {
          const currentWindow = environment.getWindow();
          if (!currentWindow) {
            return;
          }
          setTimeout(() => {
            const width = currentWindow.innerWidth;
            const height = currentWindow.innerHeight;
            get().setScreenSize(width, height);
            get().updateDeviceInfo();
          }, 100);
        };

        const handleOnline = () => {
          get().setNetworkInfo({ online: true });
        };

        const handleOffline = () => {
          get().setNetworkInfo({ online: false });
        };

        const handleConnectionChange = () => {
          get().setNetworkInfo(resolveNetworkInfo(environment.getNavigator(), environment.getConnection()));
        };

        win.addEventListener('resize', handleResize);
        cleanupFns.push(() => win.removeEventListener('resize', handleResize));

        win.addEventListener('orientationchange', handleOrientationChange);
        cleanupFns.push(() => win.removeEventListener('orientationchange', handleOrientationChange));

        win.addEventListener('online', handleOnline);
        cleanupFns.push(() => win.removeEventListener('online', handleOnline));

        win.addEventListener('offline', handleOffline);
        cleanupFns.push(() => win.removeEventListener('offline', handleOffline));

        const connection = environment.getConnection();
        if (connection) {
          connection.addEventListener?.('change', handleConnectionChange);
          cleanupFns.push(() => connection.removeEventListener?.('change', handleConnectionChange));

          if (!connection.addEventListener) {
            const originalOnChange = connection.onchange;
            connection.onchange = handleConnectionChange;
            cleanupFns.push(() => {
              if (connection.onchange === handleConnectionChange) {
                connection.onchange = originalOnChange ?? null;
              }
            });
          }
        }

        const hoverQuery = win.matchMedia?.('(hover: hover)');
        const reducedMotionQuery = win.matchMedia?.('(prefers-reduced-motion: reduce)');
        const darkModeQuery = win.matchMedia?.('(prefers-color-scheme: dark)');
        const highContrastQuery = win.matchMedia?.('(prefers-contrast: high)');

        const queryMap: Record<string, MediaQueryList | undefined> = {
          hover: hoverQuery,
          reducedMotion: reducedMotionQuery,
          darkMode: darkModeQuery,
          highContrast: highContrastQuery,
        };

        Object.entries(queryMap).forEach(([capability, media]) => {
          if (!media) {
            return;
          }

          const handler = (event: MediaQueryListEvent) => {
            get().setCapability(capability as keyof DeviceCapabilities, event.matches);
          };

          if (typeof media.addEventListener === 'function') {
            media.addEventListener('change', handler);
            cleanupFns.push(() => media.removeEventListener('change', handler));
          } else if (typeof media.addListener === 'function') {
            media.addListener(handler);
            cleanupFns.push(() => media.removeListener(handler));
          }
        });

        const release = () => {
          cleanupFns.forEach((fn) => fn());
          set((state) => {
            state.listenersRegistered = false;
            state.cleanupListeners = null;
          });
        };

        set((state) => {
          state.isInitializing = false;
          state.listenersRegistered = true;
          state.cleanupListeners = release;
        });
      } catch (error) {
        cleanupFns.forEach((fn) => fn());
        const message =
          error instanceof Error ? error.message : 'Failed to initialize device detection';
        set((state) => {
          state.error = message;
          state.isInitializing = false;
          state.listenersRegistered = false;
          state.cleanupListeners = null;
        });
      }
    },

    teardown: () => {
      const { cleanupListeners } = get();
      cleanupListeners?.();
      set((state) => {
        state.listenersRegistered = false;
        state.cleanupListeners = null;
      });
    },
  };
};

export const deviceStoreCreator: DeviceStoreCreator = (set, get) => {
  const environment = createDeviceEnvironment();
  return Object.assign(createInitialDeviceState(), createDeviceActions(set, get, environment));
};

export const useDeviceStore = create<DeviceStore>()(
  devtools(
    persist(
      immer(deviceStoreCreator),
      {
        name: 'device-storage',
        storage: createSafeStorage(),
        partialize: (state) => ({
          deviceType: state.deviceType,
          screenSize: state.screenSize,
          orientation: state.orientation,
          capabilities: state.capabilities,
          network: state.network,
          browser: state.browser,
          os: state.os,
        }),
      },
    ),
    { name: 'device-store' },
  ),
);

export const useDevice = () => useDeviceStore();

export const useDeviceType = () => useDeviceStore((state) => state.deviceType);
export const useIsMobile = () => useDeviceStore((state) => state.isMobile);
export const useIsTablet = () => useDeviceStore((state) => state.isTablet);
export const useIsDesktop = () => useDeviceStore((state) => state.isDesktop);

export const useScreenSize = () => useDeviceStore((state) => state.screenSize);
export const useOrientation = () => useDeviceStore((state) => state.orientation);
export const usePixelRatio = () => useDeviceStore((state) => state.pixelRatio);

export const useCapabilities = () => useDeviceStore((state) => state.capabilities);
export const useHasTouch = () => useDeviceStore((state) => state.capabilities.touch);
export const useHasHover = () => useDeviceStore((state) => state.capabilities.hover);
export const useReducedMotion = () => useDeviceStore((state) => state.capabilities.reducedMotion);
export const useDarkMode = () => useDeviceStore((state) => state.capabilities.darkMode);
export const useHighContrast = () => useDeviceStore((state) => state.capabilities.highContrast);
export const useLowData = () => useDeviceStore((state) => state.capabilities.lowData);
export const useIsOffline = () => useDeviceStore((state) => state.capabilities.offline);

export const useNetwork = () => useDeviceStore((state) => state.network);
export const useConnectionType = () => useDeviceStore((state) => state.network.type);
export const useIsOnline = () => useDeviceStore((state) => state.network.online);

export const useBrowser = () => useDeviceStore((state) => state.browser);
export const useOS = () => useDeviceStore((state) => state.os);
export const useUserAgent = () => useDeviceStore((state) => state.userAgent);

export const useDeviceLoading = () => useDeviceStore((state) => state.isLoading);
export const useDeviceInitializing = () => useDeviceStore((state) => state.isInitializing);
export const useDeviceError = () => useDeviceStore((state) => state.error);

export const useDeviceActions = () => {
  const updateDeviceInfo = useDeviceStore((state) => state.updateDeviceInfo);
  const setOrientation = useDeviceStore((state) => state.setOrientation);
  const setScreenSize = useDeviceStore((state) => state.setScreenSize);
  const setNetworkInfo = useDeviceStore((state) => state.setNetworkInfo);
  const setCapability = useDeviceStore((state) => state.setCapability);
  const setLoading = useDeviceStore((state) => state.setLoading);
  const setInitializing = useDeviceStore((state) => state.setInitializing);
  const setError = useDeviceStore((state) => state.setError);
  const clearError = useDeviceStore((state) => state.clearError);
  const resetDeviceState = useDeviceStore((state) => state.resetDeviceState);
  const initialize = useDeviceStore((state) => state.initialize);
  const teardown = useDeviceStore((state) => state.teardown);

  return useMemo(
    () => ({
      updateDeviceInfo,
      setOrientation,
      setScreenSize,
      setNetworkInfo,
      setCapability,
      setLoading,
      setInitializing,
      setError,
      clearError,
      resetDeviceState,
      initialize,
      teardown,
    }),
    [
      updateDeviceInfo,
      setOrientation,
      setScreenSize,
      setNetworkInfo,
      setCapability,
      setLoading,
      setInitializing,
      setError,
      clearError,
      resetDeviceState,
      initialize,
      teardown,
    ]
  );
};

export const deviceSelectors = {
  deviceType: (state: DeviceStore) => state.deviceType,
  isMobile: (state: DeviceStore) => state.isMobile,
  isTablet: (state: DeviceStore) => state.isTablet,
  isDesktop: (state: DeviceStore) => state.isDesktop,
  screenSize: (state: DeviceStore) => state.screenSize,
  orientation: (state: DeviceStore) => state.orientation,
  capabilities: (state: DeviceStore) => state.capabilities,
  network: (state: DeviceStore) => state.network,
  browser: (state: DeviceStore) => state.browser,
  os: (state: DeviceStore) => state.os,
  isLoading: (state: DeviceStore) => state.isLoading,
  isInitializing: (state: DeviceStore) => state.isInitializing,
  error: (state: DeviceStore) => state.error,
};

export const useResponsiveBreakpoint = () => {
  const screenSize = useScreenSize();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();

  return {
    screenSize,
    isMobile,
    isTablet,
    isDesktop,
    breakpoint: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
    isSmallScreen: screenSize.width < 768,
    isMediumScreen: screenSize.width >= 768 && screenSize.width < 1024,
    isLargeScreen: screenSize.width >= 1024,
  };
};

export const useDeviceCapabilities = () => {
  const capabilities = useCapabilities();
  const isOnline = useIsOnline();
  const lowData = useLowData();

  return {
    ...capabilities,
    isOnline,
    isOffline: !isOnline,
    isLowData: lowData,
    canUseAdvancedFeatures:
      isOnline && !lowData && capabilities.camera && capabilities.microphone,
  };
};
