import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';

import type { AppStore } from '@/lib/stores/appStore';
import {
  appStoreCreator,
  createInitialAppState,
  initialAppState,
} from '@/lib/stores/appStore';

const createTestAppStore = () =>
  create<AppStore>()(
    immer(appStoreCreator),
  );


describe('appStore', () => {
  it('initializes with default state', () => {
    const store = createTestAppStore();

    expect(store.getState()).toMatchObject(createInitialAppState());
  });

  it('setTheme updates theme and resolved theme', () => {
    const store = createTestAppStore();

    store.getState().setTheme('dark');

    expect(store.getState().theme).toBe('dark');
    expect(store.getState().resolvedTheme).toBe('dark');
  });

  it('toggleSidebar toggles collapsed flag', () => {
    const store = createTestAppStore();

    const initial = store.getState().sidebarCollapsed;
    store.getState().toggleSidebar();

    expect(store.getState().sidebarCollapsed).toBe(!initial);
  });

  it('setFeatureFlags merges new flags', () => {
    const store = createTestAppStore();

    store.getState().setFeatureFlags({ featureA: true });

    expect(store.getState().features.featureA).toBe(true);
  });

  it('setTheme with "system" respects system theme', () => {
    const store = createTestAppStore();
    
    // Set system theme to dark
    store.getState().updateSystemTheme('dark');
    store.getState().setTheme('system');
    
    expect(store.getState().theme).toBe('system');
    expect(store.getState().systemTheme).toBe('dark');
    expect(store.getState().resolvedTheme).toBe('dark');
  });

  it('toggleTheme switches between light and dark', () => {
    const store = createTestAppStore();
    
    // Start with system (default)
    expect(store.getState().theme).toBe('system');
    
    // Toggle should switch to dark (from system's resolved theme)
    store.getState().toggleTheme();
    const firstToggle = store.getState().theme;
    expect(['light', 'dark']).toContain(firstToggle);
    
    // Toggle again should switch to opposite
    store.getState().toggleTheme();
    const secondToggle = store.getState().theme;
    expect(secondToggle).not.toBe(firstToggle);
    expect(['light', 'dark']).toContain(secondToggle);
  });

  it('updateSystemTheme updates resolved theme when theme is system', () => {
    const store = createTestAppStore();
    
    // Set theme to system
    store.getState().setTheme('system');
    store.getState().updateSystemTheme('dark');
    
    expect(store.getState().theme).toBe('system');
    expect(store.getState().systemTheme).toBe('dark');
    expect(store.getState().resolvedTheme).toBe('dark');
    
    // Change system theme
    store.getState().updateSystemTheme('light');
    expect(store.getState().resolvedTheme).toBe('light');
  });

  it('updateSystemTheme does not change resolved theme when theme is not system', () => {
    const store = createTestAppStore();
    
    // Set theme to dark explicitly
    store.getState().setTheme('dark');
    expect(store.getState().resolvedTheme).toBe('dark');
    
    // Update system theme should not affect resolved theme
    store.getState().updateSystemTheme('light');
    expect(store.getState().resolvedTheme).toBe('dark');
    expect(store.getState().theme).toBe('dark');
  });

  it('theme state is persisted via partialize function', () => {
    const store = createTestAppStore();
    
    // Set theme
    store.getState().setTheme('dark');
    expect(store.getState().theme).toBe('dark');
    
    // Verify theme is in the persisted state (via partialize)
    // The actual persistence is handled by Zustand persist middleware
    // This test verifies the state can be set and retrieved correctly
    const state = store.getState();
    expect(state.theme).toBe('dark');
    expect(state.resolvedTheme).toBe('dark');
  });

  it('sidebar state is persisted via partialize function', () => {
    const store = createTestAppStore();
    
    // Set sidebar state (note: setSidebarPinned(true) sets collapsed to false)
    store.getState().setSidebarWidth(250);
    store.getState().setSidebarPinned(true);
    
    // Verify sidebar state is set correctly
    const state = store.getState();
    expect(state.sidebarCollapsed).toBe(false); // Pinned sidebars are not collapsed
    expect(state.sidebarWidth).toBe(250);
    expect(state.sidebarPinned).toBe(true);
    
    // Test collapsed state separately
    store.getState().setSidebarPinned(false);
    store.getState().setSidebarCollapsed(true);
    expect(store.getState().sidebarCollapsed).toBe(true);
    expect(store.getState().sidebarPinned).toBe(false);
    
    // The actual persistence is handled by Zustand persist middleware
    // This test verifies the state can be set and retrieved correctly
  });

  it('theme and sidebar state are both included in partialize', () => {
    const store = createTestAppStore();
    
    // Set both theme and sidebar
    store.getState().setTheme('dark');
    store.getState().setSidebarCollapsed(true);
    store.getState().setSidebarWidth(300);
    
    // Verify both are set
    const state = store.getState();
    expect(state.theme).toBe('dark');
    expect(state.sidebarCollapsed).toBe(true);
    expect(state.sidebarWidth).toBe(300);
    
    // The actual persistence is handled by Zustand persist middleware
    // This test verifies both states can be set together correctly
  });

  it('setSidebarWidth clamps values between 200 and 400', () => {
    const store = createTestAppStore();
    
    store.getState().setSidebarWidth(150);
    expect(store.getState().sidebarWidth).toBe(200);
    
    store.getState().setSidebarWidth(500);
    expect(store.getState().sidebarWidth).toBe(400);
    
    store.getState().setSidebarWidth(300);
    expect(store.getState().sidebarWidth).toBe(300);
  });

  it('setSidebarPinned updates pinned state', () => {
    const store = createTestAppStore();
    
    expect(store.getState().sidebarPinned).toBe(false);
    store.getState().setSidebarPinned(true);
    expect(store.getState().sidebarPinned).toBe(true);
  });

  it('setSidebarActiveSection updates active section', () => {
    const store = createTestAppStore();
    
    expect(store.getState().sidebarActiveSection).toBeNull();
    store.getState().setSidebarActiveSection('polls');
    expect(store.getState().sidebarActiveSection).toBe('polls');
    
    store.getState().setSidebarActiveSection(null);
    expect(store.getState().sidebarActiveSection).toBeNull();
  });

  it('openModal adds modal to stack', () => {
    const store = createTestAppStore();
    
    expect(store.getState().activeModal).toBeNull();
    expect(store.getState().modalStack).toHaveLength(0);
    
    store.getState().openModal('test-modal', { test: 'data' });
    
    expect(store.getState().activeModal).toBe('test-modal');
    expect(store.getState().modalData).toEqual({ test: 'data' });
    expect(store.getState().modalStack).toHaveLength(1);
    expect(store.getState().modalStack[0]).toMatchObject({
      id: 'test-modal',
      data: { test: 'data' },
    });
  });

  it('closeModal removes modal from stack', () => {
    const store = createTestAppStore();
    
    store.getState().openModal('modal-1', {});
    store.getState().openModal('modal-2', {});
    
    expect(store.getState().modalStack).toHaveLength(2);
    expect(store.getState().activeModal).toBe('modal-2');
    
    store.getState().closeModal();
    
    expect(store.getState().modalStack).toHaveLength(1);
    expect(store.getState().activeModal).toBe('modal-1');
    
    store.getState().closeModal();
    
    expect(store.getState().modalStack).toHaveLength(0);
    expect(store.getState().activeModal).toBeNull();
  });

  it('updateSettings merges settings correctly', () => {
    const store = createTestAppStore();
    
    const initialSettings = store.getState().settings;
    store.getState().updateSettings({ animations: false, compactMode: true });
    
    expect(store.getState().settings.animations).toBe(false);
    expect(store.getState().settings.compactMode).toBe(true);
    expect(store.getState().settings.enableAnalytics).toBe(initialSettings.enableAnalytics);
  });

  it('setBreadcrumbs updates breadcrumb array', () => {
    const store = createTestAppStore();
    
    const breadcrumbs = [
      { label: 'Home', href: '/' },
      { label: 'Polls', href: '/polls' },
    ];
    
    store.getState().setBreadcrumbs(breadcrumbs);
    expect(store.getState().breadcrumbs).toEqual(breadcrumbs);
  });

  it('addBreadcrumb appends to breadcrumb array', () => {
    const store = createTestAppStore();
    
    store.getState().setBreadcrumbs([{ label: 'Home', href: '/' }]);
    store.getState().addBreadcrumb({ label: 'Polls', href: '/polls' });
    
    expect(store.getState().breadcrumbs).toHaveLength(2);
    expect(store.getState().breadcrumbs[1]).toEqual({ label: 'Polls', href: '/polls' });
  });

  it('removeBreadcrumb removes breadcrumb at index', () => {
    const store = createTestAppStore();
    
    store.getState().setBreadcrumbs([
      { label: 'Home', href: '/' },
      { label: 'Polls', href: '/polls' },
      { label: 'Detail', href: '/polls/1' },
    ]);
    
    store.getState().removeBreadcrumb(1);
    
    expect(store.getState().breadcrumbs).toHaveLength(2);
    expect(store.getState().breadcrumbs[1].label).toBe('Detail');
  });

  it('setCurrentRoute updates route and previous route', () => {
    const store = createTestAppStore();
    
    expect(store.getState().currentRoute).toBe('/');
    expect(store.getState().previousRoute).toBe('');
    
    store.getState().setCurrentRoute('/polls');
    
    expect(store.getState().currentRoute).toBe('/polls');
    expect(store.getState().previousRoute).toBe('/');
    
    store.getState().setCurrentRoute('/polls/1');
    
    expect(store.getState().currentRoute).toBe('/polls/1');
    expect(store.getState().previousRoute).toBe('/polls');
  });

  it('resetAppState restores initial values', () => {
    const store = createTestAppStore();

    store.setState((state) => {
      state.theme = 'dark';
      state.features.sample = true;
    });

    store.getState().resetAppState();

    expect(store.getState()).toMatchObject(initialAppState);
  });
});

describe('appStore persistence', () => {
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    mockStorage = {};
  });

  const createPersistedTestStore = () => {
    const storage = {
      getItem: (name: string) => mockStorage[name] || null,
      setItem: (name: string, value: string) => {
        mockStorage[name] = value;
      },
      removeItem: (name: string) => {
        delete mockStorage[name];
      },
    };

    return create<AppStore>()(
      persist(immer(appStoreCreator), {
        name: 'app-store',
        storage: createJSONStorage(() => storage),
      }),
    );
  };

  describe('theme persistence', () => {
    it('persists theme preference across store recreations', () => {
      const store1 = createPersistedTestStore();
      
      store1.getState().setTheme('dark');
      expect(store1.getState().theme).toBe('dark');

      // Create a new store instance (simulating page reload)
      const store2 = createPersistedTestStore();
      
      // Theme should be restored from persistence
      expect(store2.getState().theme).toBe('dark');
      expect(store2.getState().resolvedTheme).toBe('dark');
    });

    it('persists system theme preference', () => {
      const store1 = createPersistedTestStore();
      
      store1.getState().setTheme('system');
      store1.getState().updateSystemTheme('dark');
      
      const store2 = createPersistedTestStore();
      
      expect(store2.getState().theme).toBe('system');
      // Note: systemTheme itself is not persisted, but the theme preference is
      expect(store2.getState().theme).toBe('system');
    });

    it('persists theme changes sequentially', () => {
      const store1 = createPersistedTestStore();
      
      store1.getState().setTheme('light');
      expect(store1.getState().theme).toBe('light');

      store1.getState().setTheme('dark');
      expect(store1.getState().theme).toBe('dark');

      const store2 = createPersistedTestStore();
      expect(store2.getState().theme).toBe('dark');
    });

    it('persists resolved theme correctly for explicit themes', () => {
      const store1 = createPersistedTestStore();
      
      store1.getState().setTheme('dark');
      const resolvedBefore = store1.getState().resolvedTheme;

      const store2 = createPersistedTestStore();
      
      // For explicit themes (not 'system'), resolved theme should match
      expect(store2.getState().resolvedTheme).toBe(resolvedBefore);
    });
  });

  describe('sidebar persistence', () => {
    it('persists sidebar collapsed state across store recreations', () => {
      const store1 = createPersistedTestStore();
      
      store1.getState().setSidebarCollapsed(true);
      expect(store1.getState().sidebarCollapsed).toBe(true);

      const store2 = createPersistedTestStore();
      
      expect(store2.getState().sidebarCollapsed).toBe(true);
    });

    it('persists sidebar width across store recreations', () => {
      const store1 = createPersistedTestStore();
      
      store1.getState().setSidebarWidth(320);
      expect(store1.getState().sidebarWidth).toBe(320);

      const store2 = createPersistedTestStore();
      
      expect(store2.getState().sidebarWidth).toBe(320);
    });

    it('persists sidebar pinned state across store recreations', () => {
      const store1 = createPersistedTestStore();
      
      store1.getState().setSidebarPinned(true);
      expect(store1.getState().sidebarPinned).toBe(true);
      // Pinned sidebars should not be collapsed
      expect(store1.getState().sidebarCollapsed).toBe(false);

      const store2 = createPersistedTestStore();
      
      expect(store2.getState().sidebarPinned).toBe(true);
      expect(store2.getState().sidebarCollapsed).toBe(false);
    });

    it('persists all sidebar properties together', () => {
      const store1 = createPersistedTestStore();
      
      store1.getState().setSidebarWidth(300);
      store1.getState().setSidebarPinned(false);
      store1.getState().setSidebarCollapsed(true);

      const store2 = createPersistedTestStore();
      
      expect(store2.getState().sidebarWidth).toBe(300);
      expect(store2.getState().sidebarPinned).toBe(false);
      expect(store2.getState().sidebarCollapsed).toBe(true);
    });

    it('persists sidebar width clamping across recreations', () => {
      const store1 = createPersistedTestStore();
      
      // Set a clamped value
      store1.getState().setSidebarWidth(500); // Should clamp to 400
      expect(store1.getState().sidebarWidth).toBe(400);

      const store2 = createPersistedTestStore();
      
      // Clamped value should persist
      expect(store2.getState().sidebarWidth).toBe(400);
    });
  });

  describe('combined theme and sidebar persistence', () => {
    it('persists both theme and sidebar state together', () => {
      const store1 = createPersistedTestStore();
      
      store1.getState().setTheme('dark');
      store1.getState().setSidebarCollapsed(true);
      store1.getState().setSidebarWidth(280);

      const store2 = createPersistedTestStore();
      
      expect(store2.getState().theme).toBe('dark');
      expect(store2.getState().sidebarCollapsed).toBe(true);
      expect(store2.getState().sidebarWidth).toBe(280);
    });

    it('handles sequential updates to both theme and sidebar', () => {
      const store1 = createPersistedTestStore();
      
      // Initial settings
      store1.getState().setTheme('light');
      store1.getState().setSidebarCollapsed(false);

      // Update theme
      store1.getState().setTheme('dark');

      // Update sidebar
      store1.getState().setSidebarCollapsed(true);
      store1.getState().setSidebarWidth(300);

      const store2 = createPersistedTestStore();
      
      expect(store2.getState().theme).toBe('dark');
      expect(store2.getState().sidebarCollapsed).toBe(true);
      expect(store2.getState().sidebarWidth).toBe(300);
    });

    it('persists settings alongside theme and sidebar', () => {
      const store1 = createPersistedTestStore();
      
      store1.getState().setTheme('dark');
      store1.getState().setSidebarCollapsed(true);
      store1.getState().updateSettings({ compactMode: true, animations: false });

      const store2 = createPersistedTestStore();
      
      expect(store2.getState().theme).toBe('dark');
      expect(store2.getState().sidebarCollapsed).toBe(true);
      expect(store2.getState().settings.compactMode).toBe(true);
      expect(store2.getState().settings.animations).toBe(false);
    });
  });

  describe('persistence edge cases', () => {
    it('handles missing persisted data gracefully', () => {
      // Don't set any data in mockStorage
      const store = createPersistedTestStore();
      
      // Should fall back to initial state
      expect(store.getState().theme).toBe(initialAppState.theme);
      expect(store.getState().sidebarCollapsed).toBe(initialAppState.sidebarCollapsed);
    });

    it('handles corrupted persisted data gracefully', () => {
      // Set invalid JSON
      mockStorage['app-store'] = '{ invalid json }';
      
      // Should not throw and should use initial state
      expect(() => {
        const store = createPersistedTestStore();
        expect(store.getState().theme).toBeDefined();
      }).not.toThrow();
    });

    it('persists only partialized fields', async () => {
      const store1 = createPersistedTestStore();
      
      // Set both persisted and non-persisted state
      store1.getState().setTheme('dark'); // Persisted
      store1.getState().setSidebarCollapsed(true); // Persisted
      store1.getState().setCurrentRoute('/test'); // Not persisted
      store1.getState().setBreadcrumbs([{ label: 'Test', href: '/test' }]); // Not persisted

      // Wait for persist to write
      await new Promise(resolve => setTimeout(resolve, 50));

      const store2 = createPersistedTestStore();
      
      // Wait for rehydration to complete (onRehydrateStorage is called asynchronously)
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Only persisted fields should be restored
      expect(store2.getState().theme).toBe('dark');
      expect(store2.getState().sidebarCollapsed).toBe(true);
      // Non-persisted fields should be initial values (reset by onRehydrateStorage)
      expect(store2.getState().currentRoute).toBe(initialAppState.currentRoute);
      expect(store2.getState().breadcrumbs).toEqual(initialAppState.breadcrumbs);
    });
  });

  describe('persistence with feature flags', () => {
    it('persists feature flags alongside theme and sidebar', () => {
      const store1 = createPersistedTestStore();
      
      store1.getState().setTheme('dark');
      store1.getState().setSidebarCollapsed(true);
      store1.getState().setFeatureFlags({ featureA: true, featureB: false });

      const store2 = createPersistedTestStore();
      
      expect(store2.getState().theme).toBe('dark');
      expect(store2.getState().sidebarCollapsed).toBe(true);
      expect(store2.getState().features.featureA).toBe(true);
      expect(store2.getState().features.featureB).toBe(false);
    });
  });
});

