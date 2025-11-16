export const NOTIFICATION_FIXTURES = [
  {
    id: 'notification-1',
    title: 'Poll reminder',
    message: 'Vote in the community broadband poll.',
    createdAt: new Date('2025-01-10T12:00:00.000Z').toISOString(),
    readAt: null,
  },
];

export const buildNotificationList = () => ({
  notifications: NOTIFICATION_FIXTURES,
  total: NOTIFICATION_FIXTURES.length,
});

export const buildNotification = (overrides: Partial<(typeof NOTIFICATION_FIXTURES)[number]> = {}) => ({
  id: overrides.id ?? `notification-${Date.now()}`,
  title: overrides.title ?? 'Mock Notification',
  message: overrides.message ?? 'Mock notification body',
  createdAt: overrides.createdAt ?? new Date().toISOString(),
  readAt: overrides.readAt ?? null,
});

