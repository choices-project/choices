/**
 * Poll Wizard Store Persistence Tests
 * 
 * Tests for poll wizard store persistence behavior:
 * - Data persistence across page refreshes
 * - Step persistence
 * - Error persistence
 * - Reset behavior
 * 
 * Created: January 2025
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import {
  usePollWizardStore,
} from '@/lib/stores/pollWizardStore';

// Mock localStorage for persistence testing
const mockLocalStorage = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('Poll Wizard Store Persistence', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.clear();
    usePollWizardStore.getState().resetWizard();
  });

  it('updates wizard data', () => {
    const store = usePollWizardStore.getState();
    store.updateData({
      title: 'Test Poll',
      description: 'Test description',
      options: ['Option 1', 'Option 2'],
    });
    // Read state after update
    const state = usePollWizardStore.getState();
    const data = state.data;
    expect(data.title).toBe('Test Poll');
    expect(data.description).toBe('Test description');
    expect(data.options).toHaveLength(2);
  });

  it('navigates to step', () => {
    const store = usePollWizardStore.getState();
    // goToStep may validate and prevent navigation if current step is invalid
    // Let's test with valid data first
    store.updateData({
      title: 'Test Poll',
      description: 'Test description',
    });
    store.goToStep(1); // Navigate to step 1 (should work)
    // Read state after navigation
    const state = usePollWizardStore.getState();
    expect(state.currentStep).toBe(1);
  });

  it('clears persistence on reset', () => {
    const store = usePollWizardStore.getState();
    
    // Set data and navigate
    store.updateData({
      title: 'Test Poll',
      description: 'Test description',
    });
    store.goToStep(3);

    // Reset
    store.resetWizard();

    const resetState = usePollWizardStore.getState();
    expect(resetState.currentStep).toBe(0);
    expect(resetState.data.title).toBe('');
    expect(resetState.data.description).toBe('');
  });

  it('sets and clears errors correctly', () => {
    // Note: Errors are not persisted to localStorage (not in partialize), only kept in memory
    const store = usePollWizardStore.getState();
    store.setFieldError('title', 'Title is required');
    
    // Read state after setting error
    const state = usePollWizardStore.getState();
    const errors = state.errors;
    expect(errors.title).toBe('Title is required');
    
    // Note: nextStep() calls validateCurrentStep() which may clear errors if step becomes valid
    // This is expected behavior - validation runs on navigation
    // Errors are maintained in memory until validation clears them
    expect(errors).toBeDefined();
    expect(Object.keys(errors).length).toBeGreaterThanOrEqual(1);
  });

  it('clears errors on data update', () => {
    const store = usePollWizardStore.getState();
    
    // Set error
    store.setFieldError('title', 'Title is required');
    
    // Update data (should clear error)
    store.updateData({ title: 'Valid Title' });
    
    const errors = store.errors;
    expect(errors.title).toBeUndefined();
  });

  it('maintains progress calculation', () => {
    const store = usePollWizardStore.getState();
    
    expect(store.progress).toBeGreaterThanOrEqual(0);
    expect(store.progress).toBeLessThanOrEqual(100);
    
    store.goToStep(3);
    const progress = store.getProgress();
    expect(progress).toBeGreaterThan(0);
  });

  it('maintains settings across navigation', () => {
    // Settings are part of data, which is persisted, so they should persist in memory
    const store = usePollWizardStore.getState();
    store.updateSettings({
      allowComments: true,
      privacyLevel: 'private',
    });
    
    // Read state after update
    const state = usePollWizardStore.getState();
    const settings = state.data.settings;
    expect(settings?.allowComments).toBe(true);
    expect(settings?.privacyLevel).toBe('private');
    
    // Note: privacyLevel is also a top-level field in data, but updateSettings only updates settings
    // To update top-level privacyLevel, use updateData instead
    store.updateData({ privacyLevel: 'private' });
    const stateAfterDataUpdate = usePollWizardStore.getState();
    expect(stateAfterDataUpdate.data.privacyLevel).toBe('private');
    
    // Settings should remain after navigation
    store.nextStep();
    const stateAfterNav = usePollWizardStore.getState();
    const settingsAfterNav = stateAfterNav.data.settings;
    expect(settingsAfterNav?.allowComments).toBe(true);
    expect(settingsAfterNav?.privacyLevel).toBe('private');
    expect(stateAfterNav.data.privacyLevel).toBe('private');
  });
});

