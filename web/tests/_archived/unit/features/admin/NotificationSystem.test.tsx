import { act, render, screen } from '@testing-library/react';

import { NotificationContainer } from '@/features/admin/components/NotificationSystem';
import ScreenReaderSupport from '@/lib/accessibility/screen-reader';
import { useNotificationStore } from '@/lib/stores/notificationStore';

jest.mock('@/lib/accessibility/screen-reader', () => ({
  __esModule: true,
  default: {
    announce: jest.fn(),
  },
}));

describe('NotificationContainer', () => {
  const getStore = () => useNotificationStore.getState();

  beforeEach(() => {
    getStore().clearAllAdminNotifications();
    getStore().clearAll();
    (ScreenReaderSupport.announce as jest.Mock).mockClear();
  });

  it('renders nothing when there are no admin notifications', () => {
    const { container } = render(<NotificationContainer />);

    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });

  it('announces when a new notification arrives', () => {
    render(<NotificationContainer />);

    act(() => {
      getStore().addAdminNotification({
        type: 'warning',
        title: 'System alert',
        message: 'CPU usage high',
        read: false,
      });
    });

    expect(screen.getByRole('region')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByText('System alert')).toBeInTheDocument();
    expect(screen.getByText('CPU usage high')).toBeInTheDocument();
    expect(ScreenReaderSupport.announce).toHaveBeenCalledWith('System alert: CPU usage high', 'assertive');
  });

  it('announces when notifications are cleared', () => {
    render(<NotificationContainer />);

    act(() => {
      getStore().addAdminNotification({
        type: 'info',
        title: 'Digest ready',
        message: 'Your weekly summary is available.',
        read: false,
      });
    });

    act(() => {
      getStore().clearAllAdminNotifications();
    });

    expect(ScreenReaderSupport.announce).toHaveBeenLastCalledWith('All notifications cleared.', 'polite');
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });
});


