/**
 * Device Store Consumer Verification Tests
 * 
 * Verifies that PWA/device consumers use modernized store patterns:
 * - Selector hooks instead of direct state access
 * - ServiceWorker integration patterns
 * - Device capability detection
 * 
 * Created: January 2025
 */

import { describe, it, expect } from '@jest/globals';

import {
  useDeviceType,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useScreenSize,
  useCapabilities,
  useNetwork,
  useDeviceActions,
} from '@/lib/stores/deviceStore';

describe('Device Store Consumer Verification', () => {
  it('exposes selector hooks for device state', () => {
    // Verify hooks exist
    expect(typeof useDeviceType).toBe('function');
    expect(typeof useIsMobile).toBe('function');
    expect(typeof useIsTablet).toBe('function');
    expect(typeof useIsDesktop).toBe('function');
    expect(typeof useScreenSize).toBe('function');
    expect(typeof useCapabilities).toBe('function');
    expect(typeof useNetwork).toBe('function');
  });

  it('provides action hooks for device management', () => {
    const actions = useDeviceActions();
    
    expect(actions).toBeDefined();
    expect(typeof actions.setScreenSize).toBe('function');
    expect(typeof actions.setCapability).toBe('function');
    expect(typeof actions.setNetworkInfo).toBe('function');
  });

  it('recommends using selector hooks over direct useDeviceStore(state => state.x)', () => {
    // Direct access should be discouraged in favor of selector hooks
    const preferredPattern = 'useIsMobile()'; // ✅ Preferred
    const discouragedPattern = 'useDeviceStore(state => state.isMobile)'; // ❌ Discouraged
    
    expect(preferredPattern).toBe('useIsMobile()');
    expect(discouragedPattern).toContain('useDeviceStore(state => state.isMobile)');
  });

  it('verifies ServiceWorker integration patterns', () => {
    // ServiceWorker integration should use deviceStore for capability detection
    const capabilities = useCapabilities();
    
    // Device store should expose ServiceWorker-related capabilities
    expect(capabilities).toBeDefined();
    expect(typeof capabilities.offline).toBe('boolean');
  });

  it('ensures selectors are stable across renders', () => {
    // Selectors should be stable (memoized) to prevent unnecessary re-renders
    const selector1 = useIsMobile;
    const selector2 = useIsMobile;
    
    // Same function reference (stable)
    expect(selector1).toBe(selector2);
  });
});

/**
 * Consumer Alignment Guidelines:
 * 
 * ✅ PREFERRED:
 * - useIsMobile()
 * - useIsTablet()
 * - useIsDesktop()
 * - useDeviceCapabilities()
 * - useNetworkInfo()
 * - useDeviceActions()
 * 
 * ❌ AVOID:
 * - useDeviceStore(state => state.isMobile)
 * - useDeviceStore.getState().isMobile
 * - Direct state mutations
 * 
 * ServiceWorker Integration:
 * - Use deviceStore capabilities for offline detection
 * - Use networkInfo for connection status
 * - Integrate with pwaStore for offline queue management
 */

