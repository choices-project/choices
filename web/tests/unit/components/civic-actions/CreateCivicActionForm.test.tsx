/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { CreateCivicActionForm } from '@/features/civics/components/civic-actions/CreateCivicActionForm';

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

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/hooks/useI18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      // Validation error messages - exact keys from messages/en.json
      if (key === 'civics.actions.create.validation.titleRequired') return 'Title is required.';
      if (key === 'civics.actions.create.validation.titleMax') return 'Title must be 200 characters or less.';
      if (key === 'civics.actions.create.validation.descriptionMax') return 'Description must be 5000 characters or less.';
      if (key === 'civics.actions.create.validation.signaturesRange') return 'Target signatures must be between 1 and 1,000,000.';
      if (key === 'civics.actions.create.validation.endDateFuture') return 'End date must be in the future.';

      // Return readable labels for common keys
      if (key.includes('title') && key.includes('label')) return 'Title';
      if (key.includes('description') && key.includes('label')) return 'Description';
      if (key.includes('action.type') || key.includes('actionType')) return 'Action Type';
      if (key.includes('urgency') || key.includes('urgencyLevel')) return 'Urgency Level';
      if (key.includes('target.signatures') || key.includes('targetSignatures') || key.includes('signatures.label')) return 'Target Signatures';
      if (key.includes('end.date') || key.includes('endDate')) return 'End Date';
      if (key.includes('commonCounter')) {
        const current = params?.current ?? 0;
        const max = params?.max ?? 0;
        return `${current}/${max} characters`;
      }
      if (key.includes('civics.actions.create.buttons.create') || key.includes('buttons.create')) return 'Create action';
      if (key.includes('create.action') || key.includes('createAction') || key.includes('button.create') || key.includes('submit')) return 'Create action';
      if (key.includes('button') && (key.includes('create') || key.includes('submit'))) return 'Create action';
      if (key.includes('common.actions.cancel')) return 'Cancel';
      // Default: return key for debugging
      return key;
    },
    currentLanguage: 'en',
  }),
}));

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof global.fetch;

describe('CreateCivicActionForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockClear();
    const { isFeatureEnabled } = jest.requireMock('@/lib/core/feature-flags');
    isFeatureEnabled.mockReturnValue(true);
    global.fetch = mockFetch as unknown as typeof global.fetch;
  });

  it('renders form with all fields', () => {
    render(<CreateCivicActionForm />);

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/action type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/urgency level/i)).toBeInTheDocument();
  });

  it('validates required title field', async () => {
    render(<CreateCivicActionForm />);

    const submitButton = screen.getByRole('button', { name: /create action/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/title is required/i)).toBeInTheDocument();
    });
  });

  it('validates title length', async () => {
    render(<CreateCivicActionForm />);

    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, {
      target: { value: 'a'.repeat(201) },
    });

    const submitButton = screen.getByRole('button', { name: /create action/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/title must be 200 characters or less/i)).toBeInTheDocument();
    });
  });

  it('validates description length', async () => {
    render(<CreateCivicActionForm />);

    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'Valid Title' } });

    const descriptionInput = screen.getByLabelText(/description/i);
    fireEvent.change(descriptionInput, {
      target: { value: 'a'.repeat(5001) },
    });

    const submitButton = screen.getByRole('button', { name: /create action/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/description must be 5000 characters or less/i)).toBeInTheDocument();
    });
  });

  it('validates required signatures range', async () => {
    render(<CreateCivicActionForm />);

    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'Valid Title' } });

    const signaturesInput = screen.getByLabelText(/target signatures/i);
    fireEvent.change(signaturesInput, { target: { value: '2000000' } });

    const submitButton = screen.getByRole('button', { name: /create action/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/between 1 and 1,000,000/i)).toBeInTheDocument();
    });
  });

  it('validates end date is in future', async () => {
    render(<CreateCivicActionForm />);

    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'Valid Title' } });

    const endDateInput = screen.getByLabelText(/end date/i);
    // Set a past date - validation should catch this
    fireEvent.change(endDateInput, {
      target: { value: '2020-01-01T00:00' },
    });

    // Wait for the input value to be set
    await waitFor(() => {
      expect(endDateInput).toHaveValue('2020-01-01T00:00');
    });

    const submitButton = screen.getByRole('button', { name: /create action/i });
    fireEvent.click(submitButton);

    // Wait for validation error to appear - check for the exact error message
    await waitFor(() => {
      // The error message should be "End date must be in the future."
      expect(screen.getByText(/End date must be in the future/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('submits form with valid data', async () => {
    const mockOnSuccess = jest.fn();
    const mockAction = { id: '123', title: 'Test Action' };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockAction,
      }),
    });

    render(<CreateCivicActionForm onSuccess={mockOnSuccess} />);

    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Action' } });

    const actionTypeSelect = screen.getByLabelText(/action type/i);
    fireEvent.change(actionTypeSelect, { target: { value: 'petition' } });

    const submitButton = screen.getByRole('button', { name: /create action/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/civic-actions',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
  });

  it('shows error message on submission failure', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Failed to create action',
      }),
    });

    render(<CreateCivicActionForm />);

    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Action' } });

    const submitButton = screen.getByRole('button', { name: /create action/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to create/i)).toBeInTheDocument();
    });
  });

  it('shows character count for title', () => {
    render(<CreateCivicActionForm />);

    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'Test' } });

    expect(screen.getByText(/4\/200 characters/i)).toBeInTheDocument();
  });

  it('shows character count for description', () => {
    render(<CreateCivicActionForm />);

    const description = 'Test description';
    const descriptionInput = screen.getByLabelText(/description/i);
    fireEvent.change(descriptionInput, { target: { value: description } });

    const expected = new RegExp(`${description.length}\\s*/\\s*5000 characters`, 'i');
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', () => {
    const mockOnCancel = jest.fn();

    render(<CreateCivicActionForm onCancel={mockOnCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('does not render when feature flag is disabled', () => {
    const { isFeatureEnabled } = jest.requireMock('@/lib/core/feature-flags');
    isFeatureEnabled.mockReturnValue(false);

    const { container } = render(<CreateCivicActionForm />);

    expect(container.firstChild).toBeNull();
  });

  it('handles form submission loading state', async () => {
    mockFetch.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );

    const { container } = render(<CreateCivicActionForm />);

    // Verify component rendered (not null due to feature flag)
    expect(container.firstChild).not.toBeNull();

    const titleInput = await screen.findByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Action' } });

    const submitButton = screen.getByRole('button', { name: /create action/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      // Check that button is disabled during submission
      expect(submitButton).toBeDisabled();
    });
  });
});

