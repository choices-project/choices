/**
 * Poll Wizard Store - Progressive Saving Tests
 * 
 * Tests for progressive saving functionality to ensure users don't lose their work.
 * Verifies that wizard state persists across page reloads and navigation.
 * 
 * Created: January 2025
 * Purpose: Ensure optimal UX by preventing data loss during poll creation
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';

import type { PollWizardStore } from '@/lib/stores/pollWizardStore';
import {
  createInitialPollWizardState,
  pollWizardStoreCreator,
} from '@/lib/stores/pollWizardStore';

// Mock storage for testing persistence
// Zustand persist middleware stores data as JSON strings
const createMockStorage = () => {
  let storage: Record<string, string> = {};

  return {
    getItem: (key: string): string | null => {
      const value = storage[key];
      // If value is already a string, return it; otherwise stringify
      if (value === undefined || value === null) return null;
      return typeof value === 'string' ? value : JSON.stringify(value);
    },
    setItem: (key: string, value: string): void => {
      // Zustand persist always passes strings, but ensure we store as string
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

const createTestPollWizardStore = (storage?: ReturnType<typeof createMockStorage>) => {
  const mockStorage = storage ?? createMockStorage();
  
  return create<PollWizardStore>()(
    persist(
      immer(pollWizardStoreCreator),
      {
        name: 'poll-wizard-store',
        storage: mockStorage as any,
        partialize: (state) => ({
          currentStep: state.currentStep,
          data: state.data,
        }),
      }
    )
  );
};

describe('PollWizardStore Progressive Saving', () => {
  let mockStorage: ReturnType<typeof createMockStorage>;

  beforeEach(() => {
    mockStorage = createMockStorage();
    // Clear any existing storage
    mockStorage.clear();
  });

  afterEach(() => {
    mockStorage.clear();
  });

  describe('Persistence', () => {
    it('saves current step to storage', async () => {
      const store = createTestPollWizardStore(mockStorage);

      // Provide valid data for step 0 to allow navigation
      store.getState().updateData({
        title: 'Test Poll',
        description: 'Test Description',
      });

      // Navigate to step 1 (from initial step 0)
      store.getState().nextStep();
      expect(store.getState().currentStep).toBe(1);

      // Wait for persist to write (Zustand persist is async)
      await new Promise(resolve => setTimeout(resolve, 10));

      // Check storage - Zustand persist stores as { state: { ... } }
      const storedRaw = mockStorage.getItem('poll-wizard-store');
      expect(storedRaw).toBeTruthy();
      const stored = storedRaw ? JSON.parse(storedRaw) : {};
      expect(stored.state?.currentStep).toBe(1);
    });

    it('saves wizard data to storage', async () => {
      const store = createTestPollWizardStore(mockStorage);

      // Update data
      store.getState().updateData({
        title: 'Test Poll',
        description: 'Test Description',
        category: 'civics',
      });

      // Wait for persist to write (Zustand persist is async)
      await new Promise(resolve => setTimeout(resolve, 10));

      // Check storage - Zustand persist stores as { state: { ... } }
      const storedRaw = mockStorage.getItem('poll-wizard-store');
      expect(storedRaw).toBeTruthy();
      const stored = storedRaw ? JSON.parse(storedRaw) : {};
      expect(stored.state?.data?.title).toBe('Test Poll');
      expect(stored.state?.data?.description).toBe('Test Description');
      expect(stored.state?.data?.category).toBe('civics');
    });

    it('restores state from storage on initialization', async () => {
      // Set up initial storage - Zustand persist stores with version
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
        })
      );

      // Create new store instance (simulating page reload)
      const store = createTestPollWizardStore(mockStorage);

      // Wait for persist to hydrate - Zustand persist hydrates synchronously on creation
      // But we need to wait a tick for the state to be applied
      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify restored state
      expect(store.getState().currentStep).toBe(2);
      expect(store.getState().data.title).toBe('Restored Poll');
      expect(store.getState().data.description).toBe('Restored Description');
      expect(store.getState().data.category).toBe('politics');
      expect(store.getState().data.options).toEqual(['Option 1', 'Option 2']);
    });

    it('persists data updates immediately', async () => {
      const store = createTestPollWizardStore(mockStorage);

      // Clear initial options first (default state has 2 empty options)
      const initialState = store.getState();
      // Remove all existing options
      while (initialState.data.options.length > 0) {
        initialState.removeOption(0);
      }

      // Update multiple fields
      store.getState().updateData({ title: 'Poll Title' });
      store.getState().updateData({ description: 'Poll Description' });
      store.getState().addOption();
      store.getState().updateOption(0, 'First Option');

      // Wait for persist to write (Zustand persist is async)
      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify all changes are persisted - Zustand persist stores as { state: { ... } }
      const storedRaw = mockStorage.getItem('poll-wizard-store');
      expect(storedRaw).toBeTruthy();
      const stored = storedRaw ? JSON.parse(storedRaw) : {};
      expect(stored.state?.data?.title).toBe('Poll Title');
      expect(stored.state?.data?.description).toBe('Poll Description');
      expect(stored.state?.data?.options).toHaveLength(1);
      expect(stored.state?.data?.options[0]).toBe('First Option');
    });

    it('persists step navigation', async () => {
      const store = createTestPollWizardStore(mockStorage);

      // Provide valid data for step 0 to allow navigation
      store.getState().updateData({
        title: 'Test Poll',
        description: 'Test Description',
      });

      // Navigate through steps (starting from step 0)
      expect(store.getState().currentStep).toBe(0);
      
      store.getState().nextStep();
      expect(store.getState().currentStep).toBe(1);
      
      // Provide valid data for step 1 (options)
      store.getState().addOption();
      store.getState().updateOption(0, 'Option 1');
      store.getState().addOption();
      store.getState().updateOption(1, 'Option 2');
      
      store.getState().nextStep();
      expect(store.getState().currentStep).toBe(2);

      store.getState().prevStep();
      expect(store.getState().currentStep).toBe(1);

      // Wait for persist to write (Zustand persist is async)
      await new Promise(resolve => setTimeout(resolve, 10));

      // Verify final step is persisted - Zustand persist stores as { state: { ... } }
      const storedRaw = mockStorage.getItem('poll-wizard-store');
      expect(storedRaw).toBeTruthy();
      const stored = storedRaw ? JSON.parse(storedRaw) : {};
      expect(stored.state?.currentStep).toBe(1);
    });
  });

  describe('Data Recovery', () => {
    it('recovers partial data entry', async () => {
      // Simulate user entering data but not completing
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
        })
      );

      const store = createTestPollWizardStore(mockStorage);

      // Wait for persist to hydrate
      await new Promise(resolve => setTimeout(resolve, 50));

      // User should be able to continue from where they left off
      expect(store.getState().currentStep).toBe(1);
      expect(store.getState().data.title).toBe('Incomplete Poll');
      expect(store.getState().data.options).toEqual(['Option A']);
    });

    it('maintains data integrity across multiple updates', async () => {
      const store = createTestPollWizardStore(mockStorage);

      // Clear initial options first
      const initialState = store.getState();
      while (initialState.data.options.length > 0) {
        initialState.removeOption(0);
      }

      // Simulate user working through wizard
      store.getState().updateData({ title: 'Step 1 Title' });
      // Provide valid data for step 0 to allow navigation
      store.getState().updateData({ description: 'Step 1 Description' });
      store.getState().nextStep();
      
      store.getState().addOption();
      store.getState().updateOption(0, 'Option 1');
      store.getState().addOption();
      store.getState().updateOption(1, 'Option 2');
      store.getState().nextStep();

      store.getState().addTag('tag1');
      store.getState().addTag('tag2');
      store.getState().updateSettings({ allowComments: true });

      // Wait for persist to write
      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify all data is preserved
      const stored = JSON.parse(mockStorage.getItem('poll-wizard-store') ?? '{}');
      expect(stored.state.data.title).toBe('Step 1 Title');
      expect(stored.state.data.options).toEqual(['Option 1', 'Option 2']);
      expect(stored.state.data.tags).toEqual(['tag1', 'tag2']);
      expect(stored.state.data.settings.allowComments).toBe(true);
      expect(stored.state.currentStep).toBe(2);
    });
  });

  describe('Reset Behavior', () => {
    it('clears persisted data when wizard is reset', () => {
      const store = createTestPollWizardStore(mockStorage);

      // Set up some data
      store.getState().updateData({ title: 'Test Poll' });
      store.getState().nextStep();

      // Verify data is stored
      let stored = JSON.parse(mockStorage.getItem('poll-wizard-store') ?? '{}');
      expect(stored.state.data.title).toBe('Test Poll');

      // Reset wizard
      store.getState().resetWizard();

      // Verify storage is cleared/reset
      stored = JSON.parse(mockStorage.getItem('poll-wizard-store') ?? '{}');
      expect(stored.state.data.title).toBe('');
      expect(stored.state.currentStep).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles corrupted storage gracefully', () => {
      // Set invalid storage data
      mockStorage.setItem('poll-wizard-store', 'invalid json');

      // Store should initialize with default state
      const store = createTestPollWizardStore(mockStorage);
      expect(store.getState().currentStep).toBe(0);
      expect(store.getState().data.title).toBe('');
    });

    it('handles missing storage keys', () => {
      // No storage data
      const store = createTestPollWizardStore(mockStorage);
      
      // Should use default state
      expect(store.getState().currentStep).toBe(0);
      expect(store.getState().data).toMatchObject(createInitialPollWizardState().data);
    });

    it('preserves data when navigating back and forth', async () => {
      const store = createTestPollWizardStore(mockStorage);

      // Clear initial options first
      const initialState = store.getState();
      while (initialState.data.options.length > 0) {
        initialState.removeOption(0);
      }

      // Enter data on step 0
      store.getState().updateData({ title: 'My Poll', description: 'My Description' });
      store.getState().nextStep();

      // Enter data on step 1
      store.getState().addOption();
      store.getState().updateOption(0, 'Option A');
      store.getState().nextStep();

      // Go back to step 0
      store.getState().prevStep();
      store.getState().prevStep();

      // Wait for persist to write
      await new Promise(resolve => setTimeout(resolve, 50));

      // Verify all data is still there
      expect(store.getState().data.title).toBe('My Poll');
      expect(store.getState().data.options).toEqual(['Option A']);
      
      // Verify persisted
      const stored = JSON.parse(mockStorage.getItem('poll-wizard-store') ?? '{}');
      expect(stored.state.data.title).toBe('My Poll');
      expect(stored.state.data.options).toEqual(['Option A']);
    });
  });

  describe('Performance', () => {
    it('does not persist non-essential state', () => {
      const store = createTestPollWizardStore(mockStorage);

      // Set loading and error states (should not be persisted)
      store.getState().setLoading(true);
      store.getState().setFieldError('title', 'Error message');

      const stored = JSON.parse(mockStorage.getItem('poll-wizard-store') ?? '{}');
      
      // Only currentStep and data should be persisted
      expect(stored.state).toHaveProperty('currentStep');
      expect(stored.state).toHaveProperty('data');
      expect(stored.state).not.toHaveProperty('isLoading');
      expect(stored.state).not.toHaveProperty('errors');
    });
  });
});

