/**
 * Device Store
 * 
 * Centralized Zustand store for device detection, capabilities,
 * and responsive state management.
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

import { create } from 'zustand';
import type { Database } from '@/types/database';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';


// ============================================================================
// TYPES
// ============================================================================

export type DeviceType = 'mobile' | 'tablet' | 'desktop';
export type Orientation = 'portrait' | 'landscape';
export type ConnectionType = 'slow-2g' | '2g' | '3g' | '4g' | '5g' | 'wifi' | 'ethernet' | 'unknown';

export interface ScreenSize {
  width: number;
  height: number;
  aspectRatio: number;
}

export interface DeviceCapabilities {
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
}

export interface NetworkInfo {
  type: ConnectionType;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
  online: boolean;
}

export interface DeviceStore {
  // Device Information
  deviceType: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  
  // Screen Information
  screenSize: ScreenSize;
  orientation: Orientation;
  pixelRatio: number;
  
  // Device Capabilities
  capabilities: DeviceCapabilities;
  
  // Network Information
  network: NetworkInfo;
  
  // User Agent
  userAgent: string;
  browser: string;
  os: string;
  
  // Loading States
  isLoading: boolean;
  isInitializing: boolean;
  
  // Error State
  error: string | null;
  
  // Actions
  updateDeviceInfo: () => void;
  setOrientation: (orientation: Orientation) => void;
  setScreenSize: (width: number, height: number) => void;
  setNetworkInfo: (network: Partial<NetworkInfo>) => void;
  setCapability: (capability: keyof DeviceCapabilities, value: boolean) => void;
  setLoading: (loading: boolean) => void;
  setInitializing: (initializing: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Initialization
  initialize: () => void;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const detectDeviceType = (): DeviceType => {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
};

const detectOrientation = (): Orientation => {
  if (typeof window === 'undefined') return 'landscape';
  
  return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
};

const detectCapabilities = (): DeviceCapabilities => {
  if (typeof window === 'undefined') {
    return {
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
      share: false
    };
  }

  return {
    touch: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
    hover: window.matchMedia('(hover: hover)').matches,
    reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
    highContrast: window.matchMedia('(prefers-contrast: high)').matches,
    lowData: (navigator as any).connection?.saveData || false,
    offline: !navigator.onLine,
    geolocation: 'geolocation' in navigator,
    camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
    microphone: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
    vibration: 'vibrate' in navigator,
    notifications: 'Notification' in window,
    clipboard: 'clipboard' in navigator,
    share: 'share' in navigator
  };
};

const detectNetworkInfo = (): NetworkInfo => {
  if (typeof window === 'undefined' || !('connection' in navigator)) {
    return {
      type: 'unknown',
      effectiveType: '4g',
      downlink: 10,
      rtt: 50,
      saveData: false,
      online: true
    };
  }

  const connection = (navigator as any).connection;
  return {
    type: connection?.effectiveType || 'unknown',
    effectiveType: connection?.effectiveType || '4g',
    downlink: connection?.downlink || 10,
    rtt: connection?.rtt || 50,
    saveData: connection?.saveData || false,
    online: navigator.onLine
  };
};

const detectBrowser = (userAgent: string): string => {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  return 'Unknown';
};

const detectOS = (userAgent: string): string => {
  if (userAgent.includes('Windows')) return 'Windows';
  if (userAgent.includes('Mac')) return 'macOS';
  if (userAgent.includes('Linux')) return 'Linux';
  if (userAgent.includes('Android')) return 'Android';
  if (userAgent.includes('iOS')) return 'iOS';
  return 'Unknown';
};

// ============================================================================
// STORE IMPLEMENTATION
// ============================================================================

export const useDeviceStore = create<DeviceStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial State
        deviceType: 'desktop',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        
        screenSize: {
          width: 1920,
          height: 1080,
          aspectRatio: 16/9
        },
        orientation: 'landscape',
        pixelRatio: 1,
        
        capabilities: {
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
          share: false
        },
        
        network: {
          type: 'unknown',
          effectiveType: '4g',
          downlink: 10,
          rtt: 50,
          saveData: false,
          online: true
        },
        
        userAgent: '',
        browser: 'Unknown',
        os: 'Unknown',
        
        isLoading: false,
        isInitializing: true,
        error: null,

        // Actions
        updateDeviceInfo: () => {
          if (typeof window === 'undefined') return;

          const deviceType = detectDeviceType();
          const orientation = detectOrientation();
          const capabilities = detectCapabilities();
          const network = detectNetworkInfo();
          const userAgent = navigator.userAgent;
          const browser = detectBrowser(userAgent);
          const os = detectOS(userAgent);

          set((state) => {
            state.deviceType = deviceType;
            state.isMobile = deviceType === 'mobile';
            state.isTablet = deviceType === 'tablet';
            state.isDesktop = deviceType === 'desktop';
            
            state.orientation = orientation;
            state.capabilities = capabilities;
            state.network = network;
            state.userAgent = userAgent;
            state.browser = browser;
            state.os = os;
            
            // Update screen size
            state.screenSize = {
              width: window.innerWidth,
              height: window.innerHeight,
              aspectRatio: window.innerWidth / window.innerHeight
            };
            
            state.pixelRatio = window.devicePixelRatio || 1;
          });
        },

        setOrientation: (orientation: Orientation) => {
          set((state) => {
            state.orientation = orientation;
          });
        },

        setScreenSize: (width: number, height: number) => {
          set((state) => {
            state.screenSize = {
              width,
              height,
              aspectRatio: width / height
            };
            
            // Update device type based on new screen size
            const deviceType = width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';
            state.deviceType = deviceType;
            state.isMobile = deviceType === 'mobile';
            state.isTablet = deviceType === 'tablet';
            state.isDesktop = deviceType === 'desktop';
          });
        },

        setNetworkInfo: (network: Partial<NetworkInfo>) => {
          set((state) => {
            state.network = { ...state.network, ...network };
          });
        },

        setCapability: (capability: keyof DeviceCapabilities, value: boolean) => {
          set((state) => {
            state.capabilities[capability] = value;
          });
        },

        setLoading: (loading: boolean) => {
          set((state) => {
            state.isLoading = loading;
          });
        },

        setInitializing: (initializing: boolean) => {
          set((state) => {
            state.isInitializing = initializing;
          });
        },

        setError: (error: string | null) => {
          set((state) => {
            state.error = error;
          });
        },

        clearError: () => {
          set((state) => {
            state.error = null;
          });
        },

        // Initialization
        initialize: () => {
          set((state) => {
            state.isInitializing = true;
            state.error = null;
          });

          try {
            if (typeof window !== 'undefined') {
              // Initial device detection
              get().updateDeviceInfo();

              // Set up event listeners
              const handleResize = () => {
                get().setScreenSize(window.innerWidth, window.innerHeight);
                get().setOrientation(detectOrientation());
              };

              const handleOrientationChange = () => {
                setTimeout(() => {
                  get().setScreenSize(window.innerWidth, window.innerHeight);
                  get().setOrientation(detectOrientation());
                }, 100);
              };

              const handleOnline = () => {
                get().setNetworkInfo({ online: true });
              };

              const handleOffline = () => {
                get().setNetworkInfo({ online: false });
              };

              const handleConnectionChange = () => {
                get().setNetworkInfo(detectNetworkInfo());
              };

              // Add event listeners
              window.addEventListener('resize', handleResize);
              window.addEventListener('orientationchange', handleOrientationChange);
              window.addEventListener('online', handleOnline);
              window.addEventListener('offline', handleOffline);
              
              if ('connection' in navigator) {
                (navigator as any).connection?.addEventListener('change', handleConnectionChange);
              }

              // Listen for capability changes
              const mediaQueries = {
                hover: window.matchMedia('(hover: hover)'),
                reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)'),
                darkMode: window.matchMedia('(prefers-color-scheme: dark)'),
                highContrast: window.matchMedia('(prefers-contrast: high)')
              };

              Object.entries(mediaQueries).forEach(([capability, mediaQuery]) => {
                const handler = (e: MediaQueryListEvent) => {
                  get().setCapability(capability as keyof DeviceCapabilities, e.matches);
                };
                mediaQuery.addEventListener('change', handler);
              });

              set((state) => {
                state.isInitializing = false;
              });
            } else {
              // Server-side fallback
              set((state) => {
                state.isInitializing = false;
              });
            }

          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Failed to initialize device detection';
              state.isInitializing = false;
            });
          }
        }
      })),
      {
        name: 'device-storage',
        partialize: (state) => ({
          deviceType: state.deviceType,
          screenSize: state.screenSize,
          orientation: state.orientation,
          capabilities: state.capabilities,
          network: state.network,
          browser: state.browser,
          os: state.os
        })
      }
    ),
    { name: 'device-store' }
  )
);

// ============================================================================
// SELECTORS
// ============================================================================

export const useDevice = () => useDeviceStore();

// Device Type Selectors
export const useDeviceType = () => useDeviceStore(state => state.deviceType);
export const useIsMobile = () => useDeviceStore(state => state.isMobile);
export const useIsTablet = () => useDeviceStore(state => state.isTablet);
export const useIsDesktop = () => useDeviceStore(state => state.isDesktop);

// Screen Selectors
export const useScreenSize = () => useDeviceStore(state => state.screenSize);
export const useOrientation = () => useDeviceStore(state => state.orientation);
export const usePixelRatio = () => useDeviceStore(state => state.pixelRatio);

// Capability Selectors
export const useCapabilities = () => useDeviceStore(state => state.capabilities);
export const useHasTouch = () => useDeviceStore(state => state.capabilities.touch);
export const useHasHover = () => useDeviceStore(state => state.capabilities.hover);
export const useReducedMotion = () => useDeviceStore(state => state.capabilities.reducedMotion);
export const useDarkMode = () => useDeviceStore(state => state.capabilities.darkMode);
export const useHighContrast = () => useDeviceStore(state => state.capabilities.highContrast);
export const useLowData = () => useDeviceStore(state => state.capabilities.lowData);
export const useIsOffline = () => useDeviceStore(state => state.capabilities.offline);

// Network Selectors
export const useNetwork = () => useDeviceStore(state => state.network);
export const useConnectionType = () => useDeviceStore(state => state.network.type);
export const useIsOnline = () => useDeviceStore(state => state.network.online);

// Browser/OS Selectors
export const useBrowser = () => useDeviceStore(state => state.browser);
export const useOS = () => useDeviceStore(state => state.os);
export const useUserAgent = () => useDeviceStore(state => state.userAgent);

// Loading & Error Selectors
export const useDeviceLoading = () => useDeviceStore(state => state.isLoading);
export const useDeviceInitializing = () => useDeviceStore(state => state.isInitializing);
export const useDeviceError = () => useDeviceStore(state => state.error);

// ============================================================================
// ACTIONS
// ============================================================================

export const useDeviceActions = () => useDeviceStore(state => ({
  updateDeviceInfo: state.updateDeviceInfo,
  setOrientation: state.setOrientation,
  setScreenSize: state.setScreenSize,
  setNetworkInfo: state.setNetworkInfo,
  setCapability: state.setCapability,
  setLoading: state.setLoading,
  setInitializing: state.setInitializing,
  setError: state.setError,
  clearError: state.clearError,
  initialize: state.initialize
}));

// ============================================================================
// UTILITIES
// ============================================================================

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
    isLargeScreen: screenSize.width >= 1024
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
    canUseAdvancedFeatures: isOnline && !lowData && capabilities.camera && capabilities.microphone
  };
};
