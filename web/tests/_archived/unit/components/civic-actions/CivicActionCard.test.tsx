/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { CivicActionCard, type CivicAction } from '@/features/civics/components/civic-actions/CivicActionCard';

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

const mockAction: CivicAction = {
  id: '1',
  title: 'Test Petition',
  description: 'Test description',
  action_type: 'petition',
  category: 'environment',
  urgency_level: 'high',
  status: 'active',
  current_signatures: 50,
  required_signatures: 100,
  is_public: true,
  created_at: '2025-01-22T00:00:00Z',
  end_date: '2025-12-31T23:59:59Z',
  target_representatives: [1, 2],
  target_state: 'CA',
  target_district: '12',
};

describe('CivicActionCard', () => {
  const mockOnSign = jest.fn();
  const mockOnView = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    const { isFeatureEnabled } = jest.requireMock('@/lib/core/feature-flags');
    isFeatureEnabled.mockReturnValue(true);
  });

  it('renders action card with title and description', () => {
    render(<CivicActionCard action={mockAction} />);

    expect(screen.getByText('Test Petition')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('displays action type badge', () => {
    render(<CivicActionCard action={mockAction} />);

    expect(screen.getByText('Petition')).toBeInTheDocument();
  });

  it('displays urgency level badge', () => {
    render(<CivicActionCard action={mockAction} />);

    expect(screen.getByText(/high urgency/i)).toBeInTheDocument();
  });

  it('displays signature progress for petitions', () => {
    render(<CivicActionCard action={mockAction} />);

    expect(screen.getByText(/50 \/ 100 signatures/)).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('shows progress bar for petitions', () => {
    const { container } = render(<CivicActionCard action={mockAction} />);

    // Progress bar is a div with width style, not a progressbar role
    const progressBar = container.querySelector('[style*="width: 50%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('displays end date when provided', () => {
    render(<CivicActionCard action={mockAction} />);

    expect(screen.getByText(/Ends/)).toBeInTheDocument();
  });

  it('displays target state when provided', () => {
    render(<CivicActionCard action={mockAction} />);

    expect(screen.getByText('CA')).toBeInTheDocument();
  });

  it('displays category badge when provided', () => {
    render(<CivicActionCard action={mockAction} />);

    expect(screen.getByText('environment')).toBeInTheDocument();
  });

  it('calls onSign when sign button is clicked', async () => {
    mockOnSign.mockResolvedValue(undefined);

    render(
      <CivicActionCard
        action={mockAction}
        onSign={mockOnSign}
        showSignButton={true}
      />
    );

    const signButton = screen.getByRole('button', { name: /sign/i });
    fireEvent.click(signButton);

    await waitFor(() => {
      expect(mockOnSign).toHaveBeenCalledWith('1');
    });
  });

  it('shows signed state after signing', async () => {
    mockOnSign.mockResolvedValue(undefined);

    render(
      <CivicActionCard
        action={mockAction}
        onSign={mockOnSign}
        showSignButton={true}
      />
    );

    const signButton = screen.getByRole('button', { name: /sign/i });
    fireEvent.click(signButton);

    await waitFor(() => {
      expect(screen.getByText('Signed')).toBeInTheDocument();
    });
  });

  it('disables sign button when already signed', () => {
    render(
      <CivicActionCard
        action={mockAction}
        onSign={mockOnSign}
        showSignButton={true}
        signed={true}
      />
    );

    const signButton = screen.getByRole('button', { name: /signed/i });
    expect(signButton).toBeDisabled();
  });

  it('does not show sign button for non-petition actions', () => {
    const campaignAction = { ...mockAction, action_type: 'campaign' as const };

    render(
      <CivicActionCard
        action={campaignAction}
        onSign={mockOnSign}
        showSignButton={true}
      />
    );

    expect(screen.queryByRole('button', { name: /sign/i })).not.toBeInTheDocument();
  });

  it('shows expired status for expired actions', () => {
    const expiredAction = {
      ...mockAction,
      end_date: '2020-01-01T00:00:00Z',
    };

    render(<CivicActionCard action={expiredAction} />);

    // Check for the specific "This action has ended" message
    expect(screen.getByText('This action has ended.')).toBeInTheDocument();
  });

  it('shows inactive status for completed actions', () => {
    const completedAction = { ...mockAction, status: 'completed' as const };

    render(<CivicActionCard action={completedAction} />);

    expect(screen.getByText(/completed/i)).toBeInTheDocument();
  });

  it('shows draft badge for non-public actions', () => {
    const draftAction = { ...mockAction, is_public: false };

    render(<CivicActionCard action={draftAction} />);

    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('calls onView when view details link is clicked', () => {
    render(<CivicActionCard action={mockAction} onView={mockOnView} />);

    const viewLink = screen.getByText(/view details/i);
    fireEvent.click(viewLink);

    expect(mockOnView).toHaveBeenCalledWith('1');
  });

  it('does not render when feature flag is disabled', () => {
    const { isFeatureEnabled } = jest.requireMock('@/lib/core/feature-flags');
    isFeatureEnabled.mockReturnValueOnce(false);

    const { container } = render(<CivicActionCard action={mockAction} />);

    expect(container.firstChild).toBeNull();
  });

  it('handles actions without required signatures', () => {
    const actionWithoutTarget = {
      ...mockAction,
      required_signatures: null,
      current_signatures: 10,
      action_type: 'campaign' as const, // Non-petition actions don't show signature progress
    };

    render(<CivicActionCard action={actionWithoutTarget} />);

    // Component should still render the title
    expect(screen.getByText('Test Petition')).toBeInTheDocument();
  });

  it('handles actions without description', () => {
    const actionWithoutDesc = { ...mockAction, description: null };

    const { container } = render(<CivicActionCard action={actionWithoutDesc} />);

    // Component should still render the title even without description
    expect(screen.getByText('Test Petition')).toBeInTheDocument();
    // Description should not be rendered
    expect(container.querySelector('.line-clamp-2')).not.toHaveTextContent('Test description');
  });
});

