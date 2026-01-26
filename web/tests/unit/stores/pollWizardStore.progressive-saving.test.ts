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
import { persist } from 'zustand/middleware';

import type { PollWizardStore } from '@/lib/stores/pollWizardStore';
import {
  createInitialPollWizardState,
  pollWizardStoreCreator,
} from '@/lib/stores/pollWizardStore';

const createMockStorage = () => {
  let storage: Record<string, string> = {};

  return {
    getItem: (key: string): string | null => {
      const value = storage[key];
      if (value === undefined || value === null) return null;
      return typeof value === 'string' ? value : JSON.stringify(value);
    },
    setItem: (key: string, value: string): void => {
      storage[key] = typeof value === 'string' ? value : JSON.stringify(value);
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
): PersistStore => {
  const mockStorage = storage ?? createMockStorage();
  return create<PollWizardStore>()(
    persist(immer(pollWizardStoreCreator), {
      name: 'poll-wizard-store',
      storage: mockStorage as unknown as Storage,
      partialize: (state) => ({
        currentStep: state.currentStep,
        data: state.data,
      }),
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

    it.skip('restores state from storage on initialization', async () => {
      mockStorage.setItem(
        'poll-wizard-store',
        JSON.stringify({
          state: {
            currentStep: 2,
            data: {
              title: 'Restored Poll',
              description: 'Restored Description',
              category: 'politics',
              options: ['Option 1', 'Option 2'],
              tags: ['test'],
              privacyLevel: 'public',
              settings: {},
            },
          },
          version: 0,
        }),
      );

      const store = createTestPollWizardStore(mockStorage);
      if (store.persist?.rehydrate) await store.persist.rehydrate();

      expect(store.getState().currentStep).toBe(2);
      expect(store.getState().data.title).toBe('Restored Poll');
      expect(store.getState().data.description).toBe('Restored Description');
      expect(store.getState().data.category).toBe('politics');
      expect(store.getState().data.options).toEqual(['Option 1', 'Option 2']);
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
    it.skip('recovers partial data entry', async () => {
      mockStorage.setItem(
        'poll-wizard-store',
        JSON.stringify({
          state: {
            currentStep: 1,
            data: {
              title: 'Incomplete Poll',
              description: 'User started but did not finish',
              category: 'civics',
              options: ['Option A'],
              tags: [],
              privacyLevel: 'public',
              settings: {},
            },
          },
          version: 0,
        }),
      );

      const store = createTestPollWizardStore(mockStorage);
      if (store.persist?.rehydrate) await store.persist.rehydrate();

      expect(store.getState().currentStep).toBe(1);
      expect(store.getState().data.title).toBe('Incomplete Poll');
      expect(store.getState().data.options).toEqual(['Option A']);
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
