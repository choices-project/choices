import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { useNotificationStore } from '@/lib/stores';

import { POLL_CREATION_STEPS } from '../constants';
import CreatePollPage from '../page';

const submitMock = jest.fn();
const pushMock = jest.fn();
const resetWizardMock = jest.fn();
const clearFieldErrorMock = jest.fn();
const goToNextStepMock = jest.fn();
const goToPreviousStepMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  usePathname: () => '/polls/create',
}));

jest.mock('../hooks', () => ({
  usePollCreateController: () => {
    const data = {
      title: 'Budget priorities',
      description: 'Help decide budget focus.',
      category: 'civic',
      options: ['Option A', 'Option B'],
      tags: ['civics'],
      privacyLevel: 'public' as const,
      settings: {
        allowMultipleVotes: false,
        allowAnonymousVotes: false,
        requireAuthentication: true,
        requireEmail: false,
        showResults: true,
        allowWriteIns: false,
        allowComments: true,
        enableNotifications: true,
        maxSelections: 1,
        votingMethod: 'single' as const,
        privacyLevel: 'public' as const,
        moderationEnabled: false,
        autoClose: false,
      },
    };

    const steps = POLL_CREATION_STEPS.map((step, index) => ({
      ...step,
      index,
      isCurrent: index === POLL_CREATION_STEPS.length - 1,
      isCompleted: index < POLL_CREATION_STEPS.length - 1,
      hasError: false,
    }));

    return {
      data,
      errors: {},
      currentStep: POLL_CREATION_STEPS.length - 1,
      steps,
      progressPercent: 90,
      activeTip: { heading: 'Test tip', body: 'Complete your poll.' },
      canProceed: true,
      canGoBack: true,
      isLoading: false,
      categories: [
        {
          id: 'civic',
          name: 'Civic matters',
          description: 'Engagement around local governance.',
          icon: '🏛️',
        },
      ],
      actions: {
        updateData: jest.fn(),
        updateSettings: jest.fn(),
        addOption: jest.fn(),
        removeOption: jest.fn(),
        updateOption: jest.fn(),
        addTag: jest.fn(),
        removeTag: jest.fn(),
        clearFieldError: clearFieldErrorMock,
        resetWizard: resetWizardMock,
      },
      goToNextStep: goToNextStepMock,
      goToPreviousStep: goToPreviousStepMock,
      submit: submitMock,
    };
  },
}));

describe('CreatePollPage submit flow', () => {
  beforeEach(() => {
    submitMock.mockReset();
    pushMock.mockReset();
    resetWizardMock.mockReset();
    clearFieldErrorMock.mockReset();
    goToNextStepMock.mockReset();
    goToPreviousStepMock.mockReset();

    const { clearAll } = useNotificationStore.getState();
    clearAll();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('opens share dialog and dispatches event on successful submission', async () => {
    const dispatchSpy = jest.spyOn(window, 'dispatchEvent');

    submitMock.mockResolvedValue({
      success: true,
      data: { id: 'poll-123', title: 'Budget priorities' },
    });

    render(<CreatePollPage />);

    fireEvent.click(screen.getByRole('button', { name: /publish poll/i }));

    await waitFor(() => expect(screen.getByText(/Share your poll/i)).toBeInTheDocument());

    expect(submitMock).toHaveBeenCalledTimes(1);
    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'choices:poll-created' }));
    expect(resetWizardMock).toHaveBeenCalled();

    const shareInput = screen.getByDisplayValue(/poll-123/);
    expect(shareInput).toBeInTheDocument();

    const notifications = useNotificationStore.getState().notifications;
    expect(notifications[0]).toMatchObject({
      title: 'Poll created',
      type: 'success',
    });

    dispatchSpy.mockRestore();
  });

  it('redirects to auth and shows warning when submission is unauthorized', async () => {
    submitMock.mockResolvedValue({
      success: false,
      status: 401,
      message: 'Unauthorized',
    });

    render(<CreatePollPage />);

    fireEvent.click(screen.getByRole('button', { name: /publish poll/i }));

    await waitFor(() => expect(pushMock).toHaveBeenCalled());
    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('/auth?redirect=%2Fpolls%2Fcreate'));

    const notifications = useNotificationStore.getState().notifications;
    expect(notifications[0]).toMatchObject({
      type: 'warning',
      title: 'Sign in required',
    });

    expect(screen.queryByText(/Share your poll/i)).not.toBeInTheDocument();
    expect(resetWizardMock).not.toHaveBeenCalled();
  });
});
