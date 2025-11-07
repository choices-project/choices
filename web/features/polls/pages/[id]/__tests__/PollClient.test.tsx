import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import PollClient from '../PollClient';

const updatePreferenceMock = jest.fn();
const trackEventMock = jest.fn();
const fetchMock = jest.fn();
const useMilestonesMock = jest.fn(() => ({
  enabledMilestones: [],
  reachedMilestones: [],
  nextMilestone: 10,
  preferences: { 10: false, 25: false },
  updatePreference: updatePreferenceMock,
}));

jest.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'user-123' } }),
}));

jest.mock('@/lib/stores', () => {
  const actual = jest.requireActual('@/lib/stores');
  return {
    ...actual,
    useAnalyticsStore: (selector: any) => selector({
      trackEvent: trackEventMock,
      sessionId: 'test-session',
    }),
  };
});

jest.mock('@/features/polls/hooks/usePollMilestoneNotifications', () => ({
  POLL_MILESTONES: [10, 25],
  usePollMilestoneNotifications: () => useMilestonesMock(),
}));

const basePoll = {
  id: 'poll-1',
  title: 'Community Garden Funding',
  description: 'Decide how we allocate the next round of funding.',
  options: ['Increase budget', 'Keep budget'],
  status: 'closed' as const,
  totalVotes: 15,
  participation: 12,
  privacyLevel: 'public',
  votingMethod: 'single',
  canVote: false,
};

const originalFetch = global.fetch;

describe('PollClient milestone toggles', () => {
  beforeEach(() => {
    updatePreferenceMock.mockClear();
    trackEventMock.mockClear();
    fetchMock.mockReset();

    // First call: HEAD request to check vote status
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 204,
    } as Response);

    // Second call: GET results payload
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({
        success: true,
        data: {
          poll_id: 'poll-1',
          total_votes: 0,
          trust_tier_filter: null,
          results: [],
        },
      }),
    } as unknown as Response);

    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('updates milestone preferences and records analytics when toggled on', async () => {
    render(<PollClient poll={basePoll} />);

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const toggle = await screen.findByLabelText('Toggle milestone notification for 10 votes');
    fireEvent.click(toggle);

    expect(updatePreferenceMock).toHaveBeenCalledWith(10, true);
    expect(trackEventMock).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'milestone_pref_updated',
        metadata: expect.objectContaining({
          milestone: 10,
          enabled: true,
        }),
      }),
    );
  });
});

