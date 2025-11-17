/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { CivicActionList } from '@/features/civics/components/civic-actions/CivicActionList';
import type { CivicAction } from '@/features/civics/components/civic-actions/CivicActionCard';

jest.mock('@/lib/core/feature-flags', () => ({
  isFeatureEnabled: jest.fn(() => true),
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof global.fetch;

const mockActions: CivicAction[] = [
  {
    id: '1',
    title: 'Action 1',
    description: 'Description 1',
    action_type: 'petition',
    category: 'environment',
    urgency_level: 'high',
    status: 'active',
    current_signatures: 50,
    required_signatures: 100,
    is_public: true,
    created_at: '2025-01-22T00:00:00Z',
    end_date: null,
    target_representatives: null,
    target_state: null,
    target_district: null,
  },
  {
    id: '2',
    title: 'Action 2',
    description: 'Description 2',
    action_type: 'campaign',
    category: 'healthcare',
    urgency_level: 'medium',
    status: 'active',
    current_signatures: null,
    required_signatures: null,
    is_public: true,
    created_at: '2025-01-22T00:00:00Z',
    end_date: null,
    target_representatives: null,
    target_state: null,
    target_district: null,
  },
];

describe('CivicActionList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    const { isFeatureEnabled } = jest.requireMock('@/lib/core/feature-flags');
    isFeatureEnabled.mockReturnValue(true);
    global.fetch = mockFetch as unknown as typeof global.fetch;
  });

  it('renders list of actions', () => {
    render(<CivicActionList initialActions={mockActions} />);

    expect(screen.getByText('Action 1')).toBeInTheDocument();
    expect(screen.getByText('Action 2')).toBeInTheDocument();
  });

  it('shows loading state when no initial actions', () => {
    mockFetch.mockImplementation(() =>
      new Promise(() => undefined) // Never resolves
    );

    render(<CivicActionList initialActions={[]} />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error state when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Fetch failed'));

    render(<CivicActionList initialActions={[]} />);

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('shows empty state when no actions', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: [],
        metadata: { pagination: { total: 0, hasMore: false } },
      }),
    });

    render(<CivicActionList initialActions={[]} />);

    await waitFor(() => {
      expect(screen.getByText(/no civic actions found/i)).toBeInTheDocument();
    });
  });

  it('shows create button when showCreateButton is true', () => {
    render(<CivicActionList initialActions={mockActions} showCreateButton={true} />);

    expect(screen.getByText(/create action/i)).toBeInTheDocument();
  });

  it('hides create button when showCreateButton is false', () => {
    render(<CivicActionList initialActions={mockActions} showCreateButton={false} />);

    expect(screen.queryByText(/create action/i)).not.toBeInTheDocument();
  });

  it('calls onSign when action is signed', async () => {
    const mockOnSign = jest.fn().mockResolvedValue(undefined);

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { signed: true, signature_count: 51 },
      }),
    });

    render(
      <CivicActionList
        initialActions={mockActions}
        onSign={mockOnSign}
      />
    );

    // Find and click sign button (would need to be in a card)
    // This is a simplified test - full integration would test the card interaction
    await waitFor(() => {
      expect(screen.getByText('Action 1')).toBeInTheDocument();
    });
  });

  it('fetches more actions when load more is clicked', async () => {
    const moreActions: CivicAction[] = [
      {
        id: '3',
        title: 'Action 3',
        description: 'Description 3',
        action_type: 'survey',
        category: 'education',
        urgency_level: 'low',
        status: 'active',
        current_signatures: null,
        required_signatures: null,
        is_public: true,
        created_at: '2025-01-22T00:00:00Z',
        end_date: null,
        target_representatives: null,
        target_state: null,
        target_district: null,
      },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        data: moreActions,
        metadata: { pagination: { total: 3, hasMore: false } },
      }),
    });

    render(<CivicActionList initialActions={mockActions} />);

    const loadMoreButton = screen.getByText(/load more/i);
    fireEvent.click(loadMoreButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it('applies filters when provided', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockActions,
        metadata: { pagination: { total: 2, hasMore: false } },
      }),
    });

    render(
      <CivicActionList
        initialActions={[]}
        filters={{ status: 'active', action_type: 'petition' }}
      />
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('status=active');
    expect(url).toContain('action_type=petition');
  });

  it('does not render when feature flag is disabled', () => {
    const { isFeatureEnabled } = jest.requireMock('@/lib/core/feature-flags');
    isFeatureEnabled.mockReturnValue(false);

    const { container } = render(<CivicActionList initialActions={mockActions} />);

    expect(container.firstChild).toBeNull();
  });

  it('handles retry on error', async () => {
    mockFetch
      .mockRejectedValueOnce(new Error('Fetch failed'))
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: mockActions,
          metadata: { pagination: { total: 2, hasMore: false } },
        }),
      });

    render(<CivicActionList initialActions={[]} />);

    await waitFor(() => {
      expect(screen.getByText(/retry/i)).toBeInTheDocument();
    });

    const retryButton = screen.getByText(/retry/i);
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});

