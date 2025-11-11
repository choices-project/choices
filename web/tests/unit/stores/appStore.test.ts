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

