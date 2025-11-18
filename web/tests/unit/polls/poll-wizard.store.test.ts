import { act } from '@testing-library/react';

import type { PollWizardSubmissionResult } from '@/lib/polls/wizard/submission';
import { pollWizardStoreUtils, usePollWizardStore } from '@/lib/stores/pollWizardStore';

function expectDefined<T>(value: T | undefined, context: string): T {
  if (value === undefined) {
    throw new Error(`Expected ${context} to be defined`);
  }
  return value;
}

describe('pollWizardStore', () => {
  const seedValidWizardData = () => {
    act(() => {
      const store = usePollWizardStore.getState();
      store.updateData({
        title: 'Transit Priorities',
        description: 'Decide how we should allocate next quarter transit funding.',
        category: 'infrastructure',
      });
      store.updateOption(0, 'Invest in rapid bus lanes');
      store.updateOption(1, 'Expand bike corridors');
      store.updateTags(['transit', 'budget']);
    });
  };

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

  describe('submitPoll', () => {
    it('short-circuits with validation errors when data incomplete', async () => {
      const result = (await usePollWizardStore.getState().submitPoll()) as PollWizardSubmissionResult;

      expect(result.success).toBe(false);
      if ('error' in result) {
        expect(result.status).toBe(422);
        expect(result.reason).toBe('validation');
        expect(result.error).toMatch(/Please fix/i);
        expect(result.fieldErrors?.title).toBeDefined();
      }
    });

    it('returns structured success data when request succeeds', async () => {
      seedValidWizardData();

      const mockRequest = jest.fn().mockResolvedValue({
        success: true as const,
        status: 201,
        data: { id: 'poll-123', title: 'Transit Priorities' },
        message: 'Poll created',
        durationMs: 345,
      });

      let result: PollWizardSubmissionResult | undefined;
      await act(async () => {
        result = await usePollWizardStore.getState().submitPoll({ request: mockRequest });
      });

      expect(mockRequest).toHaveBeenCalledTimes(1);

      const resolvedResult = expectDefined(result, 'poll submission result');
      expect(resolvedResult.success).toBe(true);
      if (resolvedResult.success) {
        expect(resolvedResult.data).toEqual({ pollId: 'poll-123', title: 'Transit Priorities', status: 201 });
        expect(resolvedResult.pollId).toBe('poll-123');
        expect(resolvedResult.title).toBe('Transit Priorities');
        expect(resolvedResult.status).toBe(201);
        expect(resolvedResult.message).toBe('Poll created');
        expect(resolvedResult.durationMs).toBe(345);
      }
    });

    it('surfaces structured errors when request fails', async () => {
      seedValidWizardData();

      const mockRequest = jest.fn().mockResolvedValue({
        success: false as const,
        status: 403,
        message: 'Forbidden',
        fieldErrors: undefined,
      });

      let result: PollWizardSubmissionResult | undefined;
      await act(async () => {
        result = await usePollWizardStore.getState().submitPoll({ request: mockRequest });
      });

      expect(mockRequest).toHaveBeenCalledTimes(1);
      const resolvedResult = expectDefined(result, 'poll submission result');
      expect(resolvedResult.success).toBe(false);
      if (!resolvedResult.success) {
        expect(resolvedResult.status).toBe(403);
        expect(resolvedResult.reason).toBe('permission');
        expect(resolvedResult.error).toBe('Forbidden');
        expect(resolvedResult.message).toBe('Forbidden');
      }
    });
  });

  describe('error helpers', () => {
    it('sets and clears individual field errors', () => {
      act(() => {
        usePollWizardStore.getState().setFieldError('title', 'Required');
      });

      expect(usePollWizardStore.getState().errors).toMatchObject({ title: 'Required' });

      act(() => {
        usePollWizardStore.getState().clearFieldError('title');
      });

      expect(usePollWizardStore.getState().errors.title).toBeUndefined();
    });

    it('clears all errors at once', () => {
      act(() => {
        const store = usePollWizardStore.getState();
        store.setFieldError('title', 'Required');
        store.setFieldError('description', 'Required');
      });

      expect(Object.keys(usePollWizardStore.getState().errors)).toHaveLength(2);

      act(() => {
        usePollWizardStore.getState().clearAllErrors();
      });

      expect(usePollWizardStore.getState().errors).toEqual({});
    });
  });
});

