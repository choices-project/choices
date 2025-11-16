import { act, render } from '@testing-library/react';

import { useNotificationStore } from '@/lib/stores';

import { usePollCreatedListener } from '../usePollCreatedListener';

const pushMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

const TestComponent = () => {
  usePollCreatedListener();
  return null;
};

describe('usePollCreatedListener', () => {
  beforeEach(() => {
    const { clearAll } = useNotificationStore.getState();
    clearAll();
    jest.clearAllMocks();
    pushMock.mockReset();
  });

  it('adds notification with navigation actions when poll created event fires', () => {
    render(<TestComponent />);

    const eventDetail = { id: 'poll-abc', title: 'Budget Priorities' };

    act(() => {
      window.dispatchEvent(new CustomEvent('choices:poll-created', { detail: eventDetail }));
    });

    const notifications = useNotificationStore.getState().notifications;
    expect(notifications.length).toBe(1);

    const notification = notifications[0]!;
    expect(notification).toMatchObject({
      type: 'success',
      title: 'Poll published',
    });
    expect(notification.message).toContain('Budget Priorities');
    expect(notification.actions).toHaveLength(2);

    notification.actions?.[0]?.action();
    expect(pushMock).toHaveBeenCalledWith('/polls/poll-abc');

    notification.actions?.[1]?.action();
    expect(pushMock).toHaveBeenCalledWith('/polls/analytics?pollId=poll-abc');
  });

  it('supports events that provide pollId instead of id', () => {
    render(<TestComponent />);

    act(() => {
      window.dispatchEvent(
        new CustomEvent('choices:poll-created', { detail: { pollId: 'poll-alt', title: 'Alt Budget' } }),
      );
    });

    const notifications = useNotificationStore.getState().notifications;
    expect(notifications.length).toBe(1);
    const notification = notifications[0]!;
    expect(notification.message).toContain('Alt Budget');

    notification.actions?.[0]?.action();
    expect(pushMock).toHaveBeenCalledWith('/polls/poll-alt');

    notification.actions?.[1]?.action();
    expect(pushMock).toHaveBeenCalledWith('/polls/analytics?pollId=poll-alt');
  });

  it('ignores events without poll id', () => {
    render(<TestComponent />);

    act(() => {
      window.dispatchEvent(new CustomEvent('choices:poll-created', { detail: { title: 'No ID' } }));
    });

    expect(useNotificationStore.getState().notifications).toHaveLength(0);
  });
});
