import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';

import { useNotificationActions } from '@/lib/stores/notificationStore';

type PollCreatedDetail = {
  id?: string;
  pollId?: string;
  title?: string;
};

const isPollCreatedEvent = (event: Event): event is CustomEvent<PollCreatedDetail> => {
  return typeof (event as CustomEvent<PollCreatedDetail>).detail !== 'undefined';
};

export const usePollCreatedListener = () => {
  const router = useRouter();
  // Get stable reference to addNotification directly from store
  const { addNotification } = useNotificationActions();
  
  // Use refs to avoid dependency issues
  const routerRef = useRef(router);
  const addNotificationRef = useRef(addNotification);
  
  // Keep refs updated
  routerRef.current = router;
  addNotificationRef.current = addNotification;

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handlePollCreated = (event: Event) => {
      if (!isPollCreatedEvent(event)) {
        return;
      }

      const detail = event.detail ?? {};
      const resolvedId = detail.pollId ?? detail.id;
      if (!resolvedId) {
        return;
      }

      addNotificationRef.current({
        type: 'success',
        title: 'Poll published',
        message: `${detail.title ?? 'Your poll'} is live. Share it or review analytics right away.`,
        duration: 6000,
        actions: [
          {
            label: 'View poll',
            action: () => routerRef.current.push(`/polls/${resolvedId}`),
          },
          {
            label: 'View analytics',
            action: () => routerRef.current.push(`/polls/analytics?pollId=${resolvedId}`),
          },
        ],
      });
    };

    window.addEventListener('choices:poll-created', handlePollCreated as EventListener);
    return () => {
      window.removeEventListener('choices:poll-created', handlePollCreated as EventListener);
    };
  }, []); // Empty deps - stable effect
};
