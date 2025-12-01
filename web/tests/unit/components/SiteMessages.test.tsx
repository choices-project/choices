/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

import SiteMessages from '@/components/SiteMessages';
import ScreenReaderSupport from '@/lib/accessibility/screen-reader';

const mockMessages = [
  {
    id: 'critical-1',
    title: 'Critical outage',
    message: 'Realtime notifications are currently unavailable for some users.',
    type: 'error' as const,
    priority: 'critical' as const,
    created_at: new Date('2025-11-09T12:00:00Z').toISOString(),
    updated_at: new Date('2025-11-09T12:00:00Z').toISOString(),
  },
  {
    id: 'success-1',
    title: 'Deployment succeeded',
    message: 'Version 2025.11.09 is now live in production.',
    type: 'success' as const,
    priority: 'low' as const,
    created_at: new Date('2025-11-09T11:00:00Z').toISOString(),
    updated_at: new Date('2025-11-09T11:00:00Z').toISOString(),
  },
];

describe('SiteMessages', () => {
  let fetchMock: jest.Mock;
  let announceSpy: jest.SpyInstance;

  beforeEach(() => {
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ messages: mockMessages }),
    } as Response);
    global.fetch = fetchMock as unknown as typeof fetch;

    window.localStorage.clear();

    // Announcements are captured via spy in tests; implementation is intentionally a no-op
    announceSpy = jest
      .spyOn(ScreenReaderSupport, 'announce')
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders critical messages with assertive alerts and info messages with polite status', async () => {
    render(<SiteMessages autoRefresh={false} />);

    const critical = await screen.findByRole('alert');
    expect(critical).toHaveTextContent(/Critical outage/);
    expect(critical).toHaveAttribute('aria-live', 'assertive');
    expect(critical).toHaveAttribute('aria-atomic', 'true');

    const status = screen.getByRole('status');
    expect(within(status).getByText('Deployment succeeded')).toBeInTheDocument();
    expect(status).toHaveAttribute('aria-live', 'polite');
  });

  it('announces dismissals and removes the message from the DOM', async () => {
    render(<SiteMessages autoRefresh={false} showDismiss />);

    const dismissButton = await screen.findByRole('button', { name: /Dismiss message titled Critical outage/ });
    fireEvent.click(dismissButton);

    await waitFor(() => expect(screen.queryByText(/Critical outage/)).not.toBeInTheDocument());
    expect(announceSpy).toHaveBeenCalledWith('Message "Critical outage" dismissed.', 'polite');
  });
});

