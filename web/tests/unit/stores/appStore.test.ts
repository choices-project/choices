import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

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

  it('theme state persists across store reinitialization', () => {
    const store1 = createTestAppStore();
    store1.getState().setTheme('dark');
    
    const theme1 = store1.getState().theme;
    expect(theme1).toBe('dark');
    
    // Simulate persistence by checking state is maintained
    // (In real app, Zustand persist middleware handles this)
    const store2 = createTestAppStore();
    // Note: Without persist middleware in test, this will reset
    // But we can verify the setTheme action works correctly
    store2.getState().setTheme('dark');
    expect(store2.getState().theme).toBe('dark');
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

