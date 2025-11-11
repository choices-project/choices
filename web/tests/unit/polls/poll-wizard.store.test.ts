import { act } from '@testing-library/react';

import { pollWizardStoreUtils, usePollWizardStore } from '@/lib/stores/pollWizardStore';

describe('pollWizardStore', () => {
  beforeEach(() => {
    act(() => {
      pollWizardStoreUtils.resetWizard();
    });
  });

  describe('initial state', () => {
    it('matches the default wizard data and reports validation errors out of the box', () => {
      const summary = pollWizardStoreUtils.getWizardSummary();
      const validation = pollWizardStoreUtils.validateAllSteps();

      expect(summary.currentStep).toBe(0);
      expect(summary.progress).toBe(0);
      expect(summary.data.title).toBe('');
      expect(summary.data.options).toEqual(['', '']);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toMatchObject({ title: expect.any(String), description: expect.any(String) });
    });
  });

  it('validates required fields on the details step', () => {
    act(() => {
      usePollWizardStore.getState().updateData({ title: 'My poll' });
    });

    expect(usePollWizardStore.getState().errors).toMatchObject({ description: 'Description is required' });

    act(() => {
      usePollWizardStore.getState().updateData({ description: 'Context for voters' });
    });

    expect(usePollWizardStore.getState().errors).toEqual({});
    expect(usePollWizardStore.getState().canProceed).toBe(true);
  });

  it('advances steps only when validation passes', () => {
    const store = usePollWizardStore.getState();

    act(() => {
      store.updateData({ title: 'Scoped budget poll', description: 'Allocate the next quarter budget effectively.' });
      store.nextStep();
    });

    const afterDetailsStep = usePollWizardStore.getState().currentStep;
    expect(afterDetailsStep).toBeGreaterThanOrEqual(1);

    act(() => {
      store.nextStep();
    });

    expect(usePollWizardStore.getState().currentStep).toBe(afterDetailsStep);

    act(() => {
      store.updateOption(0, 'Increase R&D');
      store.updateOption(1, 'Boost customer support');
      store.nextStep();
    });

    expect(usePollWizardStore.getState().currentStep).toBeGreaterThan(afterDetailsStep);
  });

  it('merges settings without overwriting existing values with undefined', () => {
    const store = usePollWizardStore.getState();

    act(() => {
      store.updateSettings({ allowAnonymousVotes: false });
    });

    const { settings } = usePollWizardStore.getState().data;
    expect(settings.allowAnonymousVotes).toBe(false);
    expect(settings.allowComments).toBe(true);
  });
});

