/* eslint-disable @typescript-eslint/no-var-requires */
/**
 * Polls Store Dashboard Widget Regression Tests
 * 
 * Tests for dashboard widget integration with pollsStore:
 * - Widget data loading
 * - Widget state updates
 * - Widget error handling
 * - Widget refresh behavior
 * 
 * Created: January 2025
 */

import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

import {
  usePollsStore,
  usePolls,
  usePollsLoading,
  usePollsError,
  usePollsActions,
} from '@/lib/stores/pollsStore';

// Mock dashboard widget component
jest.mock('@/features/polls/components/PollDashboardWidget', () => ({
  __esModule: true,
  default: function PollDashboardWidget() {
    const polls = usePolls();
    const loading = usePollsLoading();
    const error = usePollsError();
    const { loadPolls, refreshFeeds } = usePollsActions();

    React.useEffect(() => {
      void loadPolls({});
    }, [loadPolls]);

    return (
      <div data-testid="poll-dashboard-widget">
        <h2>Poll Dashboard</h2>
        {loading && <div data-testid="widget-loading">Loading...</div>}
        {error && <div data-testid="widget-error">{error}</div>}
        <div data-testid="poll-count">{polls.length} polls</div>
        <button
          data-testid="refresh-widget"
          onClick={() => void loadPolls({})}
        >
          Refresh
        </button>
      </div>
    );
  },
}));

jest.mock('@/lib/polls/api', () => ({
  loadPollsRequest: jest.fn(),
}));

describe('Polls Store Dashboard Widget Regression', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePollsStore.getState().resetPollsState();
  });

  it('renders dashboard widget with pollsStore', () => {
    const PollDashboardWidget = require('@/features/polls/components/PollDashboardWidget').default;
    render(<PollDashboardWidget />);

    expect(screen.getByTestId('poll-dashboard-widget')).toBeInTheDocument();
    expect(screen.getByText('Poll Dashboard')).toBeInTheDocument();
  });

  it('loads polls on mount and displays count', async () => {
    const { loadPollsRequest } = require('@/lib/polls/api');
    const mockPolls = [
      {
        id: 'poll-1',
        title: 'Test Poll 1',
        description: 'Test description',
        status: 'active',
        created_at: new Date().toISOString(),
      },
      {
        id: 'poll-2',
        title: 'Test Poll 2',
        description: 'Test description',
        status: 'active',
        created_at: new Date().toISOString(),
      },
    ];

    loadPollsRequest.mockResolvedValue({
      success: true,
      data: { polls: mockPolls, total: 2 },
    });

    const PollDashboardWidget = require('@/features/polls/components/PollDashboardWidget').default;
    render(<PollDashboardWidget />);

    await waitFor(() => {
      expect(screen.getByTestId('poll-count')).toHaveTextContent('2 polls');
    });
  });

  it('handles widget loading state', async () => {
    const { loadPollsRequest } = require('@/lib/polls/api');
    
    loadPollsRequest.mockImplementation(() => new Promise(() => undefined)); // Never resolves

    const PollDashboardWidget = require('@/features/polls/components/PollDashboardWidget').default;
    render(<PollDashboardWidget />);

    expect(screen.getByTestId('widget-loading')).toBeInTheDocument();
  });

  it('handles widget error state', async () => {
    const { loadPollsRequest } = require('@/lib/polls/api');
    
    loadPollsRequest.mockRejectedValue(new Error('Failed to load polls'));

    const PollDashboardWidget = require('@/features/polls/components/PollDashboardWidget').default;
    render(<PollDashboardWidget />);

    await waitFor(() => {
      expect(screen.getByTestId('widget-error')).toBeInTheDocument();
    });
  });

  it('refreshes widget data on button click', async () => {
    const { loadPollsRequest } = require('@/lib/polls/api');
    const mockPolls = [
      {
        id: 'poll-1',
        title: 'Test Poll',
        description: 'Test',
        status: 'active',
        created_at: new Date().toISOString(),
      },
    ];

    loadPollsRequest.mockResolvedValue({
      success: true,
      data: { polls: mockPolls, total: 1 },
    });

    const PollDashboardWidget = require('@/features/polls/components/PollDashboardWidget').default;
    render(<PollDashboardWidget />);

    await waitFor(() => {
      expect(screen.getByTestId('poll-count')).toHaveTextContent('1 polls');
    });

    // Update mock to return different data
    const updatedPolls = [...mockPolls, {
      id: 'poll-2',
      title: 'New Poll',
      description: 'New',
      status: 'active',
      created_at: new Date().toISOString(),
    }];

    loadPollsRequest.mockResolvedValue({
      success: true,
      data: { polls: updatedPolls, total: 2 },
    });

    const refreshButton = screen.getByTestId('refresh-widget');
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(screen.getByTestId('poll-count')).toHaveTextContent('2 polls');
    });
  });
});

/* eslint-enable @typescript-eslint/no-var-requires */



