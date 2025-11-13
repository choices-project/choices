import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import type { PWAQueuedAction, PWAStore } from '@/lib/stores/pwaStore';
import { createInitialPWAState, pwaStoreCreator } from '@/lib/stores/pwaStore';

const createTestPWAStore = () => create<PWAStore>()(immer(pwaStoreCreator));

describe('pwaStore', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('initializes with expected defaults', () => {
    const store = createTestPWAStore();
    const state = store.getState();
    const defaults = createInitialPWAState();

    expect(state.installation).toMatchObject({
      isInstalled: false,
      canInstall: false,
    });
    expect(state.offline.isOnline).toBe(defaults.offline.isOnline);
    expect(state.notifications).toEqual([]);
    expect(state.offlineQueueSize).toBe(0);
    expect(state.preferences).toEqual(defaults.preferences);
  });

  it('setOnlineStatus toggles connectivity flags', () => {
    const store = createTestPWAStore();

    store.getState().setOnlineStatus(false);
    expect(store.getState().offline.isOnline).toBe(false);
    expect(store.getState().offline.isOffline).toBe(true);

    store.getState().setOnlineStatus(true);
    expect(store.getState().offline.isOnline).toBe(true);
    expect(store.getState().offline.isOffline).toBe(false);
  });

  it('queueOfflineAction and processOfflineActions manage queue lifecycle', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true });
    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    const store = createTestPWAStore();

    const action: PWAQueuedAction = {
      id: 'action-1',
      type: 'test',
      createdAt: new Date().toISOString(),
      data: { foo: 'bar' },
    };

    store.getState().queueOfflineAction(action);
    expect(store.getState().offlineQueueSize).toBe(1);
    expect(store.getState().offline.offlineData.queuedActions).toHaveLength(1);

    await store.getState().processOfflineActions();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(store.getState().offlineQueueSize).toBe(0);
    expect(store.getState().offline.offlineData.queuedActions).toHaveLength(0);
    expect(store.getState().offlineQueueUpdatedAt).not.toBeNull();
  });

  it('updatePreferences merges partial updates', () => {
    const store = createTestPWAStore();

    store.getState().updatePreferences({
      autoUpdate: false,
      dataUsage: { ...store.getState().preferences.dataUsage, syncFrequency: 5 },
    });

    expect(store.getState().preferences.autoUpdate).toBe(false);
    expect(store.getState().preferences.dataUsage.syncFrequency).toBe(5);
  });

  it('registerServiceWorker invokes navigator service worker API when available', async () => {
    const register = jest.fn().mockResolvedValue({ scope: '/sw' });
    const serviceWorker = {
      register,
      getRegistrations: jest.fn(),
      getRegistration: jest.fn(),
    } as unknown as ServiceWorkerContainer;

    (globalThis as unknown as { navigator: Navigator }).navigator = { serviceWorker } as Navigator;

    const store = createTestPWAStore();

    await store.getState().registerServiceWorker();

    expect(register).toHaveBeenCalledWith('/service-worker.js');
  });

  it('exportData generates downloadable payload via document API', async () => {
    const originalURL = window.URL;
    const createObjectURL = jest.fn().mockReturnValue('blob:export');
    const revokeObjectURL = jest.fn();
    Object.defineProperty(window, 'URL', {
      value: {
        createObjectURL,
        revokeObjectURL,
      },
      configurable: true,
    });
    const click = jest.fn();
    const mockAnchor = { href: '', download: '', click } as unknown as HTMLAnchorElement;
    const createElement = jest
      .spyOn(document, 'createElement')
      .mockReturnValue(mockAnchor);

    const store = createTestPWAStore();

    await store.getState().exportData();

    expect(createElement).toHaveBeenCalledWith('a');
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:export');

    createElement.mockRestore();
    Object.defineProperty(window, 'URL', { value: originalURL, configurable: true });
  });
});
