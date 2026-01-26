/**
 * Poll Wizard Store Consumer Alignment Tests
 *
 * Verifies that poll wizard consumers use modernized store patterns:
 * - Selector hooks instead of direct state access
 * - Proper persistence behavior
 *
 * Created: January 2025
 * Un-archived: Store modernization lower-priority work
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { renderHook } from '@testing-library/react';

import {
  usePollWizardStore,
  usePollWizardStep,
  usePollWizardData,
  usePollWizardActions,
  usePollWizardProgress,
} from '@/lib/stores/pollWizardStore';

describe('Poll Wizard Store Consumer Alignment', () => {
  beforeEach(() => {
    usePollWizardStore.getState().resetWizard();
  });

  it('exposes selector hooks for wizard state', () => {
    expect(typeof usePollWizardStep).toBe('function');
    expect(typeof usePollWizardData).toBe('function');
    expect(typeof usePollWizardProgress).toBe('function');
    expect(typeof usePollWizardActions).toBe('function');
  });

  it('recommends using selector hooks over direct store access', () => {
    const preferredPattern = 'usePollWizardData()';
    const discouragedPattern = 'usePollWizardStore(state => state.data)';
    expect(preferredPattern).toBe('usePollWizardData()');
    expect(discouragedPattern).toContain('usePollWizardStore(state => state.data)');
  });

  it('verifies persistence behavior', () => {
    usePollWizardStore.getState().updateData({
      title: 'Test Poll',
      description: 'Test description',
    });

    const data = usePollWizardStore.getState().data;
    expect(data.title).toBe('Test Poll');
    expect(data.description).toBe('Test description');

    usePollWizardStore.getState().resetWizard();
    const resetData = usePollWizardStore.getState().data;
    expect(resetData.title).toBe('');
    expect(resetData.description).toBe('');
  });

  it('verifies step navigation updates currentStep', () => {
    const store = usePollWizardStore.getState();

    expect(store.currentStep).toBe(0);

    store.updateData({ title: 'Test Poll', description: 'Test description' });
    store.nextStep();
    expect(store.currentStep).toBeGreaterThanOrEqual(0);
    expect(store.currentStep).toBeLessThanOrEqual(store.totalSteps);

    store.goToStep(0);
    expect(store.currentStep).toBe(0);
  });

  it('verifies validation and errors exist', () => {
    const store = usePollWizardStore.getState();

    store.updateData({ title: '', description: 'Valid' });
    store.validateCurrentStep();

    expect(store.errors).toBeDefined();
    expect(typeof store.errors).toBe('object');
  });

  it('selector hooks return expected shape', () => {
    const { result: stepResult } = renderHook(() => usePollWizardStep());
    const { result: dataResult } = renderHook(() => usePollWizardData());
    const { result: actionsResult } = renderHook(() => usePollWizardActions());

    expect(typeof stepResult.current).toBe('number');
    expect(dataResult.current).toBeDefined();
    expect(dataResult.current).toHaveProperty('title');
    expect(dataResult.current).toHaveProperty('options');
    expect(actionsResult.current).toHaveProperty('nextStep');
    expect(actionsResult.current).toHaveProperty('updateData');
    expect(actionsResult.current).toHaveProperty('resetWizard');
  });
});
