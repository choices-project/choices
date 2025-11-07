import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { useNotificationStore } from '@/lib/stores';

import {
  DESCRIPTION_CHAR_LIMIT,
  MAX_OPTIONS,
  MAX_TAGS,
  POLL_CREATION_STEPS,
  TITLE_CHAR_LIMIT,
} from '../constants';
import CreatePollPage from '../page';

const submitMock = jest.fn();
const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

jest.mock('../hooks', () => ({
  usePollCreateController: () => {
    const data = {
      title: 'Budget priorities',
      description: 'Help decide budget focus.',
      category: 'civic',
      options: ['Option A', 'Option B'],
      tags: ['civics'],
      settings: {
        allowMultipleVotes: false,
        allowAnonymousVotes: false,
        requireAuthentication: true,
        showResults: true,
        allowComments: true,
        privacyLevel: 'public' as const,
        votingMethod: 'single' as const,
      },
    };

    const steps = POLL_CREATION_STEPS.map((step, index) =>
      Object.assign({}, step, {
        index,
        isCurrent: index === POLL_CREATION_STEPS.length - 1,
        isCompleted: index < POLL_CREATION_STEPS.length - 1,
        hasError: false,
      })
    );

    return {
      data,
      errors: {},
      currentStep: POLL_CREATION_STEPS.length - 1,
      steps,
      activeTip: null,
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
        addOption: jest.fn(),
        removeOption: jest.fn(),
        updateOption: jest.fn(),
        addTag: jest.fn(),
        removeTag: jest.fn(),
        updateSettings: jest.fn(),
        clearError: jest.fn(),
      },
      goToNextStep: jest.fn(),
      goToPreviousStep: jest.fn(),
      submit: submitMock,
      descriptionLimit: DESCRIPTION_CHAR_LIMIT,
      titleLimit: TITLE_CHAR_LIMIT,
      maxOptions: MAX_OPTIONS,
      maxTags: MAX_TAGS,
    };
  },
}));

describe('CreatePollPage submit flow', () => {
  beforeEach(() => {
    submitMock.mockReset();
    pushMock.mockReset();
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
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'choices:poll-created' }),
    );

    const notifications = useNotificationStore.getState().notifications;
    expect(notifications[0]).toMatchObject({
      title: 'Poll created',
      type: 'success',
    });
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
    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('/auth?redirect='));

    const notifications = useNotificationStore.getState().notifications;
    expect(notifications[0]).toMatchObject({
      type: 'warning',
      title: 'Sign in required',
    });

    expect(screen.queryByText(/Share your poll/i)).not.toBeInTheDocument();
  });
});
