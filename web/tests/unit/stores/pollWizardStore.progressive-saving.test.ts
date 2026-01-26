/**
 * Poll Wizard Store - Progressive Saving Tests
 *
 * Tests for progressive saving functionality to ensure users don't lose their work.
 * Verifies that wizard state persists across page reloads and navigation.
 *
 * Created: January 2025
 * Un-archived: Store modernization lower-priority work
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { PollWizardStore } from '@/lib/stores/pollWizardStore';
import {
  createInitialPollWizardState,
  pollWizardStoreCreator,
} from '@/lib/stores/pollWizardStore';

const createMockStorage = () => {
  let storage: Record<string, string> = {};

  return {
    getItem: (key: string): string | null => {
      return storage[key] ?? null;
    },
    setItem: (key: string, value: string): void => {
      storage[key] = value;
    },
    removeItem: (key: string): void => {
      delete storage[key];
    },
    clear: (): void => {
      storage = {};
    },
    getStorage: () => storage,
  };
};

type PersistStore = ReturnType<typeof create<PollWizardStore>> & {
  persist?: { rehydrate: () => Promise<void>; hasHydrated: () => boolean };
};

const createTestPollWizardStore = (
  storage?: ReturnType<typeof createMockStorage>,
  onRehydrateStorage?: () => void | Promise<void>,
): PersistStore => {
  const mockStorage = storage ?? createMockStorage();
  return create<PollWizardStore>()(
    persist(immer(pollWizardStoreCreator), {
      name: 'poll-wizard-store',
      storage: createJSONStorage(() => mockStorage),
      partialize: (state) => ({
        currentStep: state.currentStep,
        data: state.data,
      }),
      onRehydrateStorage,
    }),
  ) as PersistStore;
};

describe('PollWizardStore Progressive Saving', () => {
  let mockStorage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    mockStorage = createMockStorage();
    mockStorage.clear();
  });

  afterEach(() => {
    mockStorage.clear();
  });

  describe('Persistence', () => {
    it('saves current step to storage', async () => {
      const store = createTestPollWizardStore(mockStorage);

      store.getState().updateData({
        title: 'Test Poll',
        description: 'Test Description',
      });

      store.getState().nextStep();
      expect(store.getState().currentStep).toBe(1);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const storedRaw = mockStorage.getItem('poll-wizard-store');
      expect(storedRaw).toBeTruthy();
      const stored = storedRaw ? (JSON.parse(storedRaw) as { state?: { currentStep?: number } }) : {};
      expect(stored.state?.currentStep).toBe(1);
    });

    it('saves wizard data to storage', async () => {
      const store = createTestPollWizardStore(mockStorage);

      store.getState().updateData({
        title: 'Test Poll',
        description: 'Test Description',
        category: 'civics',
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const storedRaw = mockStorage.getItem('poll-wizard-store');
      expect(storedRaw).toBeTruthy();
      const stored = storedRaw ? (JSON.parse(storedRaw) as { state?: { data?: { title?: string; description?: string; category?: string } } }) : {};
      expect(stored.state?.data?.title).toBe('Test Poll');
      expect(stored.state?.data?.description).toBe('Test Description');
      expect(stored.state?.data?.category).toBe('civics');
    });

    it('restores state from storage on initialization', async () => {
      // Pre-populate storage before creating store
      const storedData = {
        state: {
          currentStep: 2,
          data: {
            title: 'Restored Poll',
            description: 'Restored Description',
            category: 'politics',
            options: ['Option 1', 'Option 2'],
            tags: ['test'],
            privacyLevel: 'public' as const,
            settings: {},
          },
        },
        version: 0,
      };
      mockStorage.setItem('poll-wizard-store', JSON.stringify(storedData));

      // Verify storage is set correctly
      const storedRaw = mockStorage.getItem('poll-wizard-store');
      expect(storedRaw).toBeTruthy();

      // Wait for hydration using onRehydrateStorage callback
      let hydrationPromise: Promise<void>;
      let hydrationResolve: () => void;
      hydrationPromise = new Promise((resolve) => {
        hydrationResolve = resolve;
      });

      const store = createTestPollWizardStore(mockStorage, () => {
        hydrationResolve();
      });

      // Manually trigger rehydration if persist API is available
      if (store.persist?.rehydrate) {
        await store.persist.rehydrate();
        hydrationResolve(); // Resolve in case callback doesn't fire
      } else {
        // If no persist API, wait a bit for async hydration
        await new Promise((resolve) => setTimeout(resolve, 100));
        hydrationResolve();
      }

      // Wait for hydration to complete (with timeout)
      await Promise.race([
        hydrationPromise,
        new Promise((resolve) => setTimeout(resolve, 200)),
      ]);

      // Give a small delay for state to settle
      await new Promise((resolve) => setTimeout(resolve, 50));

      const state = store.getState();
      expect(state.currentStep).toBe(2);
      expect(state.data.title).toBe('Restored Poll');
      expect(state.data.description).toBe('Restored Description');
      expect(state.data.category).toBe('politics');
      expect(state.data.options).toEqual(['Option 1', 'Option 2']);
    });

    it('persists step navigation', async () => {
      const store = createTestPollWizardStore(mockStorage);

      store.getState().updateData({
        title: 'Test Poll',
        description: 'Test Description',
      });

      expect(store.getState().currentStep).toBe(0);

      store.getState().nextStep();
      expect(store.getState().currentStep).toBe(1);

      const s = store.getState();
      while (s.data.options.length < 2) {
        s.addOption();
      }
      s.updateOption(0, 'Option 1');
      s.updateOption(1, 'Option 2');

      store.getState().nextStep();
      expect(store.getState().currentStep).toBe(2);

      store.getState().prevStep();
      expect(store.getState().currentStep).toBe(1);

      await new Promise((resolve) => setTimeout(resolve, 10));

      const storedRaw = mockStorage.getItem('poll-wizard-store');
      expect(storedRaw).toBeTruthy();
      const stored = storedRaw ? (JSON.parse(storedRaw) as { state?: { currentStep?: number } }) : {};
      expect(stored.state?.currentStep).toBe(1);
    });
  });

  describe('Data Recovery', () => {
    it('recovers partial data entry', async () => {
      // Pre-populate storage before creating store
      const storedData = {
        state: {
          currentStep: 1,
          data: {
            title: 'Incomplete Poll',
            description: 'User started but did not finish',
            category: 'civics',
            options: ['Option A'],
            tags: [],
            privacyLevel: 'public' as const,
            settings: {},
          },
        },
        version: 0,
      };
      mockStorage.setItem('poll-wizard-store', JSON.stringify(storedData));

      // Verify storage is set correctly
      const storedRaw = mockStorage.getItem('poll-wizard-store');
      expect(storedRaw).toBeTruthy();

      // Wait for hydration using onRehydrateStorage callback
      let hydrationPromise: Promise<void>;
      let hydrationResolve: () => void;
      hydrationPromise = new Promise((resolve) => {
        hydrationResolve = resolve;
      });

      const store = createTestPollWizardStore(mockStorage, () => {
        hydrationResolve();
      });

      // Manually trigger rehydration if persist API is available
      if (store.persist?.rehydrate) {
        await store.persist.rehydrate();
        hydrationResolve(); // Resolve in case callback doesn't fire
      } else {
        // If no persist API, wait a bit for async hydration
        await new Promise((resolve) => setTimeout(resolve, 100));
        hydrationResolve();
      }

      // Wait for hydration to complete (with timeout)
      await Promise.race([
        hydrationPromise,
        new Promise((resolve) => setTimeout(resolve, 200)),
      ]);

      // Give a small delay for state to settle
      await new Promise((resolve) => setTimeout(resolve, 50));

      const state = store.getState();
      expect(state.currentStep).toBe(1);
      expect(state.data.title).toBe('Incomplete Poll');
      expect(state.data.options).toEqual(['Option A']);
    });
  });

  describe('Reset Behavior', () => {
    it('clears persisted data when wizard is reset', () => {
      const store = createTestPollWizardStore(mockStorage);

      store.getState().updateData({ title: 'Test Poll' });
      store.getState().nextStep();

      let stored = JSON.parse(mockStorage.getItem('poll-wizard-store') ?? '{}') as { state?: { data?: { title?: string }; currentStep?: number } };
      expect(stored.state?.data?.title).toBe('Test Poll');

      store.getState().resetWizard();

      stored = JSON.parse(mockStorage.getItem('poll-wizard-store') ?? '{}') as { state?: { data?: { title?: string }; currentStep?: number } };
      expect(stored.state?.data?.title).toBe('');
      expect(stored.state?.currentStep).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles corrupted storage gracefully', () => {
      mockStorage.setItem('poll-wizard-store', 'invalid json');

      const store = createTestPollWizardStore(mockStorage);
      expect(store.getState().currentStep).toBe(0);
      expect(store.getState().data.title).toBe('');
    });

    it('handles missing storage keys', () => {
      const store = createTestPollWizardStore(mockStorage);

      expect(store.getState().currentStep).toBe(0);
      expect(store.getState().data).toMatchObject(
        createInitialPollWizardState().data,
      );
    });
  });

  describe('Performance', () => {
    it('does not persist non-essential state', () => {
      const store = createTestPollWizardStore(mockStorage);

      store.getState().setLoading(true);
      store.getState().setFieldError('title', 'Error message');

      const stored = JSON.parse(mockStorage.getItem('poll-wizard-store') ?? '{}') as { state?: Record<string, unknown> };

      expect(stored.state).toHaveProperty('currentStep');
      expect(stored.state).toHaveProperty('data');
      expect(stored.state).not.toHaveProperty('isLoading');
      expect(stored.state).not.toHaveProperty('errors');
    });
  });
});
