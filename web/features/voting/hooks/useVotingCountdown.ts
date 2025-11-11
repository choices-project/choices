import { useEffect, useMemo, useState } from 'react';

import { useVotingActions } from '@/lib/stores/votingStore';

const formatTimeRemaining = (endTime: Date): string => {
  const now = new Date();
  const diff = endTime.getTime() - now.getTime();

  if (diff <= 0) {
    return 'Poll ended';
  }

  const minutesTotal = Math.floor(diff / (1000 * 60));
  const days = Math.floor(minutesTotal / (60 * 24));
  const hours = Math.floor((minutesTotal % (60 * 24)) / 60);
  const minutes = minutesTotal % 60;

  if (days > 0) {
    return `${days}d ${hours}h ${minutes}m left`;
  }

  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }

  return `${minutes}m left`;
};

export const useVotingCountdown = (endTime?: string | null) => {
  const { registerTimer, clearTimer } = useVotingActions();
  const targetDate = useMemo(
    () => (endTime ? new Date(endTime) : null),
    [endTime],
  );
  const [timeRemaining, setTimeRemaining] = useState<string>(() =>
    targetDate ? formatTimeRemaining(targetDate) : '',
  );

  useEffect(() => {
    if (!targetDate || Number.isNaN(targetDate.getTime())) {
      setTimeRemaining('');
      return;
    }

    const updateCountdown = () => {
      setTimeRemaining(formatTimeRemaining(targetDate));
    };

    updateCountdown();

    if (typeof window === 'undefined') {
      return;
    }

    const handle = setInterval(updateCountdown, 60_000);
    const timerId = registerTimer(handle);

    return () => {
      clearTimer(timerId);
    };
  }, [clearTimer, registerTimer, targetDate]);

  return timeRemaining;
};

