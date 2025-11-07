import { useRouter } from 'next/navigation';
import { useCallback, useEffect } from 'react';

import { useNotificationStore } from '@/lib/stores';

type PollCreatedDetail = {
  id: string;
  title?: string;
};

const isPollCreatedEvent = (event: Event): event is CustomEvent<PollCreatedDetail> => {
  return typeof (event as CustomEvent<PollCreatedDetail>).detail !== 'undefined';
};

export const usePollCreatedListener = () => {
  const router = useRouter();
  const addNotification = useNotificationStore((state) => state.addNotification);

  const handlePollCreated = useCallback(
    (event: Event) => {
      if (!isPollCreatedEvent(event)) {
        return;
      }

      const { id, title } = event.detail ?? {};
      if (!id) {
        return;
      }

      addNotification({
        type: 'success',
        title: 'Poll published',
        message: `${title ?? 'Your poll'} is live. Share it or review analytics right away.`,
        duration: 6000,
        actions: [
          {
            label: 'View poll',
            action: () => router.push(`/polls/${id}`),
          },
          {
            label: 'View analytics',
            action: () => router.push(`/polls/analytics?pollId=${id}`),
          },
        ],
      });
    },
    [addNotification, router],
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.addEventListener('choices:poll-created', handlePollCreated as EventListener);
    return () => {
      window.removeEventListener('choices:poll-created', handlePollCreated as EventListener);
    };
  }, [handlePollCreated]);
};
